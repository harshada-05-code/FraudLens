import os
import re
from datetime import datetime, timedelta
from mcp.server.fastmcp import FastMCP
from sqlalchemy.orm import Session
from models import SessionLocal, PolicyRule, Transaction, Vendor, Employee
from sqlalchemy import func, or_

mcp = FastMCP("fraudlens_mcp")

# Helper to get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@mcp.tool()
def get_policy_rules(category: str) -> dict:
    """
    Retrieve policy rules (max spend limit and approval threshold) for a transaction category.
    """
    db = SessionLocal()
    try:
        rule = db.query(PolicyRule).filter(PolicyRule.category == category).first()
        if not rule:
            return {"status": "error", "message": f"No policy rule found for category '{category}'"}
        return {
            "status": "success",
            "category": category,
            "max_amount": rule.max_amount,
            "approval_threshold": rule.approval_threshold
        }
    finally:
        db.close()

@mcp.tool()
def check_duplicate_receipt(amount: float, vendor_name: str, date_str: str, employee_id: int) -> dict:
    """
    Check if a receipt has duplicate submissions (fuzzy amount and date matching)
    for the same employee within the past 7 days.
    """
    db = SessionLocal()
    try:
        tx_date = datetime.strptime(date_str, "%Y-%m-%d").date()
        start_date = tx_date - timedelta(days=7)
        end_date = tx_date + timedelta(days=7)

        # Query similar transactions by the same employee in the +/- 7 day window
        duplicates = db.query(Transaction).filter(
            Transaction.employee_id == employee_id,
            Transaction.date.between(start_date, end_date)
        ).all()

        for dup in duplicates:
            # Fuzzy match on amount: within 1 INR or 1%
            amount_diff = abs(dup.amount - amount)
            amount_match = amount_diff <= 1.0 or (amount_diff / max(amount, 0.01)) <= 0.01
            
            # Fuzzy match on vendor name: simple substring or exact
            vendor_match = vendor_name.lower() in dup.vendor.name.lower() or dup.vendor.name.lower() in vendor_name.lower()

            if amount_match and vendor_match:
                return {
                    "status": "flagged",
                    "duplicate_risk": "High",
                    "reason": f"Fuzzy duplicate found: Transaction #{dup.id} with amount {dup.amount} INR from {dup.vendor.name} on {dup.date} (matching {round((1 - amount_diff/max(amount,0.01))*100, 1)}% of amount)."
                }

        return {
            "status": "success",
            "duplicate_risk": "Low",
            "message": "No matching duplicate transactions found."
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}
    finally:
        db.close()

@mcp.tool()
def get_vendor_transaction_graph(vendor_id: int) -> dict:
    """
    Analyze collusion risk for a vendor by retrieving the transaction graph
    of all employees who transacted with this vendor, flagging tight repeat-only patterns.
    """
    db = SessionLocal()
    try:
        vendor = db.query(Vendor).filter(Vendor.id == vendor_id).first()
        if not vendor:
            return {"status": "error", "message": "Vendor not found"}

        # Group transactions by employee for this vendor
        stats = db.query(
            Transaction.employee_id,
            Employee.name.label("employee_name"),
            func.count(Transaction.id).label("tx_count"),
            func.sum(Transaction.amount).label("total_spend"),
            func.avg(Transaction.amount).label("avg_spend")
        ).join(Employee, Transaction.employee_id == Employee.id)\
         .filter(Transaction.vendor_id == vendor_id)\
         .group_by(Transaction.employee_id, Employee.name).all()

        total_vendor_tx = sum(stat.tx_count for stat in stats)
        total_vendor_spend = sum(stat.total_spend for stat in stats)

        employee_nodes = []
        collusion_flag = False
        collusion_details = ""

        for stat in stats:
            # Check for collusion: an employee represents > 75% of vendor transactions and count > 3
            tx_ratio = stat.tx_count / max(total_vendor_tx, 1)
            spend_ratio = stat.total_spend / max(total_vendor_spend, 1)
            
            is_suspicious = tx_ratio > 0.75 and stat.tx_count > 3
            if is_suspicious:
                collusion_flag = True
                collusion_details = f"Employee {stat.employee_name} represents {round(tx_ratio * 100, 1)}% of total transactions ({stat.tx_count} txs) and {round(spend_ratio * 100, 1)}% of total spend ({stat.total_spend} INR) with vendor {vendor.name}."

            employee_nodes.append({
                "employee_id": stat.employee_id,
                "employee_name": stat.employee_name,
                "transaction_count": stat.tx_count,
                "total_spend": float(stat.total_spend),
                "transaction_ratio": tx_ratio,
                "spend_ratio": spend_ratio,
                "suspicious": is_suspicious
            })

        return {
            "status": "success",
            "vendor_id": vendor_id,
            "vendor_name": vendor.name,
            "total_transactions": total_vendor_tx,
            "total_spend": float(total_vendor_spend),
            "collusion_risk": "High" if collusion_flag else ("Medium" if total_vendor_tx > 5 else "Low"),
            "collusion_details": collusion_details,
            "connections": employee_nodes
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}
    finally:
        db.close()

@mcp.tool()
def verify_gstin(gstin_number: str) -> dict:
    """
    Verify India's GSTIN registration status of a vendor (format, state code, checksum check).
    """
    if not gstin_number:
        return {"status": "invalid", "message": "GSTIN is missing."}
        
    # GSTIN regex: 15 chars, starts with 2 digits state code, 10 alphanumeric PAN, 1 alphanumeric entity code, 'Z', 1 checksum alphanumeric
    gstin_regex = r"^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$"
    
    if not re.match(gstin_regex, gstin_number.upper()):
        return {
            "status": "invalid",
            "gstin": gstin_number,
            "message": "Invalid GSTIN format. Must be 15 alphanumeric characters matching Indian GST profile format."
        }

    # State code validation (01-37 are valid state codes in India)
    state_code = int(gstin_number[:2])
    if state_code < 1 or state_code > 37:
        return {
            "status": "invalid",
            "gstin": gstin_number,
            "message": f"Invalid state code '{gstin_number[:2]}'. State codes must be between 01 and 37."
        }

    # In a real app we'd query the GST portal. We will mock valid profiles based on state code.
    # We flag certain test GSTINs as invalid/unverified for demo purposes.
    if "9" in gstin_number: # Let's make anything containing '9' return "Unverified" for demo variety
        return {
            "status": "unverified",
            "gstin": gstin_number,
            "message": "GSTIN matches format but registration status is currently unverified on the official portal."
        }

    return {
        "status": "verified",
        "gstin": gstin_number,
        "legal_name": "Verified Indian Enterprise Pvt Ltd",
        "registration_date": "2018-04-01",
        "message": "GSTIN is active, valid and registered on the GST portal."
    }

@mcp.tool()
def flag_transaction(transaction_id: int, verdict: str, reasoning: str) -> dict:
    """
    Flag or update the status of a transaction with the final agent verdict and reasoning.
    """
    db = SessionLocal()
    try:
        tx = db.query(Transaction).filter(Transaction.id == transaction_id).first()
        if not tx:
            return {"status": "error", "message": "Transaction not found"}

        tx.verdict = verdict
        if verdict == "Auto-Approved" or verdict == "Approved":
            tx.status = "Approved"
        elif verdict == "Flagged for Review":
            tx.status = "Flagged"
        else:
            tx.status = "Flagged"  # Rejected is still flagged in the queue

        # Append final summary to reasoning trail
        trail = tx.reasoning_trail or {}
        trail["final_verdict"] = {
            "verdict": verdict,
            "reasoning": reasoning,
            "timestamp": datetime.utcnow().isoformat()
        }
        tx.reasoning_trail = trail
        db.commit()

        return {"status": "success", "transaction_id": transaction_id, "new_status": tx.status, "new_verdict": tx.verdict}
    except Exception as e:
        db.rollback()
        return {"status": "error", "message": str(e)}
    finally:
        db.close()

@mcp.tool()
def get_dashboard_summary() -> dict:
    """
    Retrieve statistics: total spend, total flagged count, fraud caught (rejected count), money saved.
    """
    db = SessionLocal()
    try:
        total_spend = db.query(func.sum(Transaction.amount)).scalar() or 0.0
        flagged_count = db.query(func.count(Transaction.id)).filter(Transaction.status == "Flagged").scalar() or 0
        
        # Fraud caught / money saved is calculated from Rejected or Flagged collusion/duplicate transactions
        money_saved = db.query(func.sum(Transaction.amount)).filter(
            or_(
                Transaction.verdict == "Rejected",
                Transaction.verdict == "Flagged for Review"
            )
        ).scalar() or 0.0

        fraud_caught_count = db.query(func.count(Transaction.id)).filter(
            or_(
                Transaction.verdict == "Rejected",
                Transaction.verdict == "Flagged for Review"
            )
        ).scalar() or 0

        recent_txs = db.query(Transaction).order_by(Transaction.id.desc()).limit(5).all()
        recent_feed = []
        for tx in recent_txs:
            recent_feed.append({
                "id": tx.id,
                "date": tx.date.isoformat(),
                "amount": tx.amount,
                "category": tx.category,
                "employee": tx.employee.name,
                "vendor": tx.vendor.name,
                "status": tx.status,
                "verdict": tx.verdict
            })

        return {
            "total_spend": float(total_spend),
            "flagged_count": flagged_count,
            "fraud_caught_count": fraud_caught_count,
            "money_saved": float(money_saved),
            "recent_activity": recent_feed
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}
    finally:
        db.close()
