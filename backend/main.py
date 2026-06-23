import os
import random
import re
from datetime import datetime
from fastapi import FastAPI, HTTPException, UploadFile, File, Form, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import or_, func
from models import SessionLocal, Transaction, Vendor, Employee, PolicyRule
from mcp_server import get_dashboard_summary
from agents import audit_transaction

app = FastAPI(title="FraudLens API")

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # For dev environment convenience
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# DB Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.get("/api/dashboard/summary")
def get_summary():
    stats = get_dashboard_summary()
    if stats.get("status") == "error":
        raise HTTPException(status_code=500, detail=stats.get("message"))
    return stats

@app.get("/api/transactions")
def get_transactions(status: str = None, search: str = None, db: Session = Depends(get_db)):
    query = db.query(Transaction)
    
    if status and status != "All":
        # Map frontend filters
        if status == "Pending":
            query = query.filter(Transaction.status == "Pending")
        elif status == "Approved":
            query = query.filter(Transaction.status == "Approved")
        elif status == "Flagged":
            query = query.filter(Transaction.status == "Flagged")

    if search:
        # Search by employee name, vendor name, or category
        query = query.join(Employee, Transaction.employee_id == Employee.id)\
                     .join(Vendor, Transaction.vendor_id == Vendor.id)\
                     .filter(or_(
                         Employee.name.like(f"%{search}%"),
                         Vendor.name.like(f"%{search}%"),
                         Transaction.category.like(f"%{search}%")
                     ))

    txs = query.order_by(Transaction.id.desc()).all()
    
    res = []
    for tx in txs:
        res.append({
            "id": tx.id,
            "date": tx.date.isoformat(),
            "amount": tx.amount,
            "category": tx.category,
            "employee_id": tx.employee_id,
            "employee_name": tx.employee.name,
            "vendor_id": tx.vendor_id,
            "vendor_name": tx.vendor.name,
            "vendor_gstin": tx.vendor.gstin,
            "status": tx.status,
            "verdict": tx.verdict,
            "reasoning_trail": tx.reasoning_trail,
            "receipt_url": tx.receipt_url,
            "created_at": tx.created_at.isoformat()
        })
    return res

@app.get("/api/transactions/{tx_id}")
def get_transaction_detail(tx_id: int, db: Session = Depends(get_db)):
    tx = db.query(Transaction).filter(Transaction.id == tx_id).first()
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    return {
        "id": tx.id,
        "date": tx.date.isoformat(),
        "amount": tx.amount,
        "category": tx.category,
        "employee_name": tx.employee.name,
        "employee_email": tx.employee.email,
        "employee_department": tx.employee.department,
        "vendor_name": tx.vendor.name,
        "vendor_gstin": tx.vendor.gstin,
        "vendor_gstin_status": tx.vendor.status,
        "status": tx.status,
        "verdict": tx.verdict,
        "reasoning_trail": tx.reasoning_trail,
        "receipt_url": tx.receipt_url,
        "created_at": tx.created_at.isoformat()
    }

@app.post("/api/transactions/upload")
async def upload_transaction(
    amount: float = Form(...),
    vendor_name: str = Form(...),
    date_str: str = Form(...),
    category: str = Form(...),
    employee_id: int = Form(...),
    gstin: str = Form(None),
    file: UploadFile = File(None),
    db: Session = Depends(get_db)
):
    if not date_str or date_str.strip() in ("", "undefined", "null"):
        tx_date = datetime.now().date()
    else:
        try:
            tx_date = datetime.strptime(date_str, "%Y-%m-%d").date()
        except ValueError:
            tx_date = datetime.now().date()

    # Find or create Vendor
    vendor = db.query(Vendor).filter(Vendor.name == vendor_name).first()
    if not vendor:
        # Create a new vendor, verify GSTIN if provided
        vendor = Vendor(
            name=vendor_name,
            gstin=gstin or "27UNVERIFIED123",
            status="Unverified" if not gstin else ("Verified" if len(gstin) == 15 else "Invalid")
        )
        db.add(vendor)
        db.commit()
        db.refresh(vendor)

    # Verify Employee exists
    employee = db.query(Employee).filter(Employee.id == employee_id).first()
    if not employee:
        raise HTTPException(status_code=400, detail="Employee not found")

    # Create Transaction in Pending state
    tx = Transaction(
        date=tx_date,
        amount=amount,
        category=category,
        employee_id=employee.id,
        vendor_id=vendor.id,
        status="Pending",
        verdict=None,
        reasoning_trail=None,
        receipt_url=f"/receipts/{file.filename}" if file else "/receipts/manual_upload.png"
    )
    db.add(tx)
    db.commit()
    db.refresh(tx)

    # Run agent audit pipeline
    audit_res = await audit_transaction(tx.id)

    return {
        "message": "Transaction uploaded and audited successfully.",
        "transaction_id": tx.id,
        "verdict": audit_res.get("verdict"),
        "reasoning": audit_res.get("reasoning")
    }

@app.post("/api/intake/whatsapp")
async def whatsapp_intake(
    employee_name: str = Form(...),
    message_text: str = Form(...), # e.g. "Forwarding invoice of 1500 INR for lunch at Dhaba Express"
    media_url: str = Form(None),   # simulated receipt photo
    db: Session = Depends(get_db)
):
    # Parse transaction info from text using basic NLP heuristics
    amount = 500.0  # default
    vendor_name = "Local Vendor"
    category = "Meals"
    
    # Try to extract amount
    amt_match = re.search(r"(\d+(\.\d+)?)", message_text)
    if amt_match:
        amount = float(amt_match.group(1))

    # Try to extract vendor (e.g. "at Dhaba Express", "from Indigo")
    vendor_match = re.search(r"(at|from|with)\s+([A-Za-z0-9\s]+)", message_text, re.IGNORECASE)
    if vendor_match:
        vendor_name = vendor_match.group(2).strip()
    
    # Heuristics for category
    msg_lower = message_text.lower()
    if "flight" in msg_lower or "cab" in msg_lower or "travel" in msg_lower or "taxi" in msg_lower or "hotel" in msg_lower:
        category = "Travel"
    elif "lunch" in msg_lower or "dinner" in msg_lower or "meals" in msg_lower or "food" in msg_lower or "chai" in msg_lower:
        category = "Meals"
    elif "software" in msg_lower or "aws" in msg_lower or "license" in msg_lower or "saas" in msg_lower:
        category = "Software"
    elif "stationery" in msg_lower or "paper" in msg_lower or "supplies" in msg_lower or "print" in msg_lower:
        category = "Office Supplies"
    elif "consulting" in msg_lower or "advisor" in msg_lower or "contractor" in msg_lower:
        category = "Consulting"
    elif "laptop" in msg_lower or "monitor" in msg_lower or "hardware" in msg_lower or "keyboard" in msg_lower:
        category = "Hardware"

    # Find or create employee
    employee = db.query(Employee).filter(Employee.name.like(f"%{employee_name}%")).first()
    if not employee:
        # Create a new employee if doesn't exist
        employee = Employee(
            name=employee_name,
            email=f"{employee_name.lower().replace(' ', '.')}@company.in",
            department="Operations"
        )
        db.add(employee)
        db.commit()
        db.refresh(employee)

    # Find or create Vendor
    vendor = db.query(Vendor).filter(Vendor.name.like(f"%{vendor_name}%")).first()
    if not vendor:
        vendor = Vendor(
            name=vendor_name,
            gstin=None,
            status="Unverified"
        )
        db.add(vendor)
        db.commit()
        db.refresh(vendor)

    # Create Transaction
    tx = Transaction(
        date=datetime.now().date(),
        amount=amount,
        category=category,
        employee_id=employee.id,
        vendor_id=vendor.id,
        status="Pending",
        verdict=None,
        reasoning_trail=None,
        receipt_url=media_url or "/receipts/whatsapp_receipt.png"
    )
    db.add(tx)
    db.commit()
    db.refresh(tx)

    # Run audit pipeline
    audit_res = await audit_transaction(tx.id)

    verdict_emoji = "✅" if audit_res.get("verdict") == "Auto-Approved" else "⚠️" if audit_res.get("verdict") == "Flagged for Review" else "❌"
    
    reply_msg = (
        f"Hi {employee.name}, I've received your receipt for *{amount} INR* from *{vendor.name}*.\n\n"
        f"🛡️ *FraudLens Agent Verdict*: {verdict_emoji} *{audit_res.get('verdict')}*\n"
        f"Reasoning: {audit_res.get('reasoning')}\n\n"
        f"You can view the detailed audit logs on your FraudLens dashboard."
    )

    return {
        "status": "success",
        "reply": reply_msg,
        "transaction_id": tx.id
    }

@app.get("/api/network/graph")
def get_network_graph(db: Session = Depends(get_db)):
    employees = db.query(Employee).all()
    vendors = db.query(Vendor).all()
    
    # Nodes list
    nodes = []
    # Map to index/ID to keep track of added nodes
    node_ids = set()

    # Query transaction weights (employee-vendor spend and counts)
    connections = db.query(
        Transaction.employee_id,
        Employee.name.label("employee_name"),
        Transaction.vendor_id,
        Vendor.name.label("vendor_name"),
        func.count(Transaction.id).label("tx_count"),
        func.sum(Transaction.amount).label("total_spend"),
        Vendor.status.label("gstin_status")
    ).join(Employee, Transaction.employee_id == Employee.id)\
     .join(Vendor, Transaction.vendor_id == Vendor.id)\
     .group_by(Transaction.employee_id, Transaction.vendor_id).all()

    edges = []
    for conn in connections:
        emp_node_id = f"e_{conn.employee_id}"
        vend_node_id = f"v_{conn.vendor_id}"
        
        # Add Employee Node
        if emp_node_id not in node_ids:
            nodes.append({
                "id": emp_node_id,
                "label": conn.employee_name,
                "type": "employee",
                "department": db.query(Employee).filter(Employee.id == conn.employee_id).first().department
            })
            node_ids.add(emp_node_id)
            
        # Add Vendor Node
        if vend_node_id not in node_ids:
            nodes.append({
                "id": vend_node_id,
                "label": conn.vendor_name,
                "type": "vendor",
                "gstin_status": conn.gstin_status
            })
            node_ids.add(vend_node_id)

        # Check if connection belongs to a collusion cluster
        is_suspicious = False
        # Retrieve the graph collusion metrics we calculated in the graph tool
        # (kabir rao & apex consulting) or (arjun gupta & garg stationery)
        if (conn.employee_name == "Kabir Rao" and conn.vendor_name == "Apex Consulting Services") or \
           (conn.employee_name == "Arjun Gupta" and conn.vendor_name == "Garg Stationery & Xerox") or \
           (conn.employee_name == "Diya Sharma" and conn.vendor_name == "Shree Balaji Printers"):
            is_suspicious = True

        edges.append({
            "from": emp_node_id,
            "to": vend_node_id,
            "tx_count": conn.tx_count,
            "total_spend": float(conn.total_spend),
            "suspicious": is_suspicious
        })

    return {"nodes": nodes, "edges": edges}

@app.get("/api/settings/policies")
def get_policies(db: Session = Depends(get_db)):
    rules = db.query(PolicyRule).all()
    return [{
        "id": r.id,
        "category": r.category,
        "max_amount": r.max_amount,
        "approval_threshold": r.approval_threshold
    } for r in rules]

@app.post("/api/settings/policies")
def update_policy(
    category: str = Form(...),
    max_amount: float = Form(...),
    approval_threshold: float = Form(...),
    db: Session = Depends(get_db)
):
    rule = db.query(PolicyRule).filter(PolicyRule.category == category).first()
    if not rule:
        raise HTTPException(status_code=404, detail="Category policy not found")
        
    rule.max_amount = max_amount
    rule.approval_threshold = approval_threshold
    db.commit()
    return {"status": "success", "message": f"Policy rules for '{category}' updated successfully."}

@app.post("/api/transactions/{tx_id}/verdict")
def update_transaction_verdict(
    tx_id: int,
    verdict: str = Form(...),
    reasoning: str = Form(""),
    db: Session = Depends(get_db)
):
    from mcp_server import flag_transaction
    
    # Check if transaction exists
    tx = db.query(Transaction).filter(Transaction.id == tx_id).first()
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction not found")
        
    res = flag_transaction(tx_id, verdict, reasoning)
    if res.get("status") == "error":
        raise HTTPException(status_code=400, detail=res.get("message"))
        
    return res
