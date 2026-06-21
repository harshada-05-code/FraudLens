import os
import json
import asyncio
from datetime import datetime
from sqlalchemy.orm import Session
from models import SessionLocal, Transaction, Vendor, Employee
from mcp_server import (
    get_policy_rules,
    check_duplicate_receipt,
    get_vendor_transaction_graph,
    verify_gstin,
    flag_transaction
)

# Import Google ADK
try:
    from google.adk import Agent
    from google.adk.runners import Runner
    from google.adk.sessions import InMemorySessionService
    from google.genai import types
    ADK_AVAILABLE = True
except ImportError:
    ADK_AVAILABLE = False

# Check if Gemini API key is present
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
USE_REAL_AGENTS = ADK_AVAILABLE and GEMINI_API_KEY is not None

# Configure Gemini model
MODEL_NAME = "gemini-2.5-flash"

if USE_REAL_AGENTS:
    # Set the key in environment for google-genai
    if os.getenv("GEMINI_API_KEY") is None and os.getenv("GOOGLE_API_KEY") is not None:
        os.environ["GEMINI_API_KEY"] = os.getenv("GOOGLE_API_KEY")

    # Define ADK Agents
    intake_agent = Agent(
        name="IntakeAgent",
        model=MODEL_NAME,
        description="Parses invoice or receipt text and extracts vendor name, amount, date, and category.",
        instruction=(
            "You are an expense intake specialist. Extract the vendor name, amount (float value), "
            "date (YYYY-MM-DD), and expense category (Travel, Meals, Software, Office Supplies, Consulting, or Hardware) "
            "from the raw text. Return a JSON object with keys: vendor, amount, date, category."
        )
    )

    compliance_agent = Agent(
        name="ComplianceAgent",
        model=MODEL_NAME,
        description="Checks expense against policy rules (spend limits and thresholds).",
        instruction=(
            "You are a corporate compliance officer. Use the 'get_policy_rules' tool to fetch the rules "
            "for the transaction category. Compare the transaction amount against the limits. If the amount "
            "exceeds the max_amount, flag it as a violation. If it exceeds the approval_threshold, "
            "indicate that second-level approval is required. Return a JSON object detailing your findings."
        ),
        tools=[get_policy_rules]
    )

    fraud_agent = Agent(
        name="FraudAgent",
        model=MODEL_NAME,
        description="Detects duplicate submissions and collusion networks.",
        instruction=(
            "You are a forensic fraud investigator. Use 'check_duplicate_receipt' to check for duplicates "
            "and 'get_vendor_transaction_graph' to inspect collusion patterns. Summarize the risks and "
            "return a JSON object with duplicate_risk (Low/Medium/High), collusion_risk (Low/Medium/High), "
            "and details of any flagged anomalies."
        ),
        tools=[check_duplicate_receipt, get_vendor_transaction_graph]
    )

    vendor_agent = Agent(
        name="VendorAgent",
        model=MODEL_NAME,
        description="Verifies the GSTIN registration status of the vendor.",
        instruction=(
            "You are a tax audit specialist. Use 'verify_gstin' to verify the vendor's GSTIN. "
            "Return a JSON object showing whether the status is Verified, Unverified, or Invalid, "
            "along with a brief reason."
        ),
        tools=[verify_gstin]
    )

    orchestrator_agent = Agent(
        name="OrchestratorAgent",
        model=MODEL_NAME,
        description="Orchestrates the sub-agents and flags the transaction with the final verdict.",
        instruction=(
            "You are the Lead Auditor agent. You run the sub-agents (Intake, Compliance, Fraud, Vendor) "
            "and compile their outputs into a single final verdict: Auto-Approved, Flagged for Review, or Rejected. "
            "Write a step-by-step reasoning trail and call 'flag_transaction' to update the database."
        ),
        tools=[flag_transaction],
        sub_agents=[intake_agent, compliance_agent, fraud_agent, vendor_agent]
    )

# --- Fallback Auditing Engine (Rule-based Simulator) ---
def run_fallback_audit(tx: Transaction, db: Session) -> dict:
    """
    Simulates the multi-agent reasoning flow and updates the database,
    providing realistic results when no API key is available.
    """
    # 1. Intake Agent Step
    # Extract metadata already in the seeded transaction or passed
    vendor = tx.vendor
    employee = tx.employee
    category = tx.category
    amount = tx.amount
    date_str = tx.date.isoformat()
    
    intake_result = {
        "status": "success",
        "extracted": {
            "vendor": vendor.name,
            "amount": amount,
            "date": date_str,
            "category": category
        }
    }

    # 2. Compliance Agent Step
    policy = get_policy_rules(category)
    compliance_flags = []
    compliance_msg = "Transaction is within budget limits."
    
    if policy["status"] == "success":
        max_amount = policy["max_amount"]
        threshold = policy["approval_threshold"]
        if amount > max_amount:
            compliance_flags.append(f"Exceeds {category} limit ({amount} > {max_amount} INR)")
            compliance_msg = f"Limit Exceeded: amount exceeds category budget of {max_amount} INR."
        elif amount > threshold:
            compliance_flags.append(f"Above review threshold ({amount} > {threshold} INR)")
            compliance_msg = f"Needs Approval: amount exceeds review threshold of {threshold} INR."
    
    compliance_result = {
        "status": "success" if not compliance_flags else "flagged",
        "flags": compliance_flags,
        "message": compliance_msg
    }

    # 3. Fraud Agent Step
    dup_check = check_duplicate_receipt(amount, vendor.name, date_str, tx.employee_id)
    graph_check = get_vendor_transaction_graph(tx.vendor_id)
    
    fraud_flags = []
    dup_risk = "Low"
    collusion_risk = "Low"
    
    if dup_check.get("status") == "flagged":
        dup_risk = "High"
        fraud_flags.append(dup_check["reason"])
        
    if graph_check.get("collusion_risk") == "High":
        collusion_risk = "High"
        fraud_flags.append(graph_check["collusion_details"])
    elif graph_check.get("collusion_risk") == "Medium":
        collusion_risk = "Medium"
        fraud_flags.append("Elevated repeat transaction frequency between employee and vendor.")

    fraud_result = {
        "status": "success" if not fraud_flags else "flagged",
        "duplicate_risk": dup_risk,
        "collusion_risk": collusion_risk,
        "flags": fraud_flags
    }

    # 4. Vendor Agent Step
    gstin_check = verify_gstin(vendor.gstin)
    vendor_result = {
        "status": gstin_check["status"],
        "gstin_status": gstin_check["status"].capitalize(),
        "message": gstin_check["message"]
    }

    # 5. Orchestrator Step - Compile Verdict
    verdict = "Auto-Approved"
    reasoning = "All agent checks passed successfully."
    
    # Priority for verdict:
    # 1. High Duplicate Risk or Invalid GSTIN -> Reject
    # 2. High Collusion Risk, Compliance Violation, or Unverified GSTIN -> Flag for Review
    # 3. Above Threshold -> Flag for Review
    if dup_risk == "High" or vendor_result["gstin_status"] == "Invalid":
        verdict = "Rejected"
        reasons = []
        if dup_risk == "High":
            reasons.append("identical duplicate receipt detected")
        if vendor_result["gstin_status"] == "Invalid":
            reasons.append("vendor GSTIN is invalid/unregistered")
        reasoning = f"Transaction rejected due to: {', '.join(reasons)}."
    elif collusion_risk == "High" or len(compliance_flags) > 0 or vendor_result["gstin_status"] == "Unverified":
        verdict = "Flagged for Review"
        reasons = []
        if collusion_risk == "High":
            reasons.append("suspicious collusion pattern")
        if len(compliance_flags) > 0:
            reasons.extend(compliance_flags)
        if vendor_result["gstin_status"] == "Unverified":
            reasons.append("unverified vendor GSTIN")
        reasoning = f"Transaction flagged for audit: {', '.join(reasons)}."

    # Save to database
    reasoning_trail = {
        "intake": intake_result,
        "compliance": compliance_result,
        "fraud": fraud_result,
        "vendor": vendor_result
    }
    
    flag_transaction(tx.id, verdict, reasoning)
    
    # Fetch updated transaction
    tx.reasoning_trail = reasoning_trail
    db.commit()

    return {
        "transaction_id": tx.id,
        "verdict": verdict,
        "reasoning": reasoning,
        "trail": reasoning_trail
    }

# --- Main Entrypoint for Auditing ---
async def audit_transaction(transaction_id: int) -> dict:
    """
    Main entrypoint called by the API. Executes the audit pipeline using
    either Google ADK (if configured) or the fallback rule-based simulator.
    """
    db = SessionLocal()
    try:
        tx = db.query(Transaction).filter(Transaction.id == transaction_id).first()
        if not tx:
            return {"status": "error", "message": "Transaction not found"}

        if USE_REAL_AGENTS:
            # Running via Google ADK
            session_service = InMemorySessionService()
            runner = Runner(agent=orchestrator_agent, session_service=session_service)
            
            # Formulate user message
            user_msg = types.Content(
                role='user', 
                parts=[
                    types.Part(text=(
                        f"Please audit the following transaction: "
                        f"ID={tx.id}, Amount={tx.amount} INR, Date={tx.date}, Category={tx.category}, "
                        f"EmployeeID={tx.employee_id}, VendorID={tx.vendor_id}, GSTIN={tx.vendor.gstin}."
                    ))
                ]
            )
            
            try:
                events = runner.run_async(
                    session_id=f"session-{tx.id}",
                    user_id=f"user-{tx.employee_id}",
                    new_message=user_msg
                )
                
                final_text = ""
                async for event in events:
                    if event.content and event.content.parts:
                        for part in event.content.parts:
                            final_text += part.text
                
                # ADK run complete. If it didn't update MySQL, we run fallback to ensure structured fields are filled.
                # In standard usage, ADK calls flag_transaction tool which updates verdict/status.
                # Let's ensure database has the structured reasoning trail:
                db.refresh(tx)
                if not tx.reasoning_trail:
                    # Parse final_text or construct fallback reasoning
                    run_fallback_audit(tx, db)
                
                return {"status": "success", "agent": "Google ADK", "transaction_id": tx.id}
            except Exception as adk_err:
                print(f"ADK Execution failed: {adk_err}. Falling back to rule-based engine.")
                # Fallback on error
                res = run_fallback_audit(tx, db)
                return {"status": "success", "agent": "Fallback Engine (ADK Error)", **res}
        else:
            # Run fallback directly
            res = run_fallback_audit(tx, db)
            return {"status": "success", "agent": "Fallback Simulator", **res}

    finally:
        db.close()
