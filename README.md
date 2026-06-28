# FraudLens 🛡️ — Autonomous Multi-Agent Expense & Invoice Auditing for SMBs

**FraudLens** is an AI-powered expense and invoice fraud auditor built for small and medium businesses (SMBs) in India. It automatically parses uploaded or forwarded receipts, runs a team of cooperative AI agents to audit them for compliance, tax validity, and fraud risks, and displays a step-by-step reasoning trail on an interactive dashboard.

---

## 🎯 The Problem & Solution

In small and medium businesses (SMBs), expense and invoice fraud often slips under the radar due to manual, error-prone auditing processes. With over 80% of companies experiencing expense report non-compliance or invoice inflation, businesses lose up to 5% of their annual revenue to leakage, collusion clusters, and invalid tax filings (such as unregistered or inactive GSTIN numbers). Manual review of hundreds of receipts per month is slow, expensive, and scales poorly, leaving organizations vulnerable to internal leakages and regulatory tax penalties.

FraudLens solves this by deploying a cooperative team of AI agents that automatically audit every receipt and invoice in real-time. By connecting an Intake Gatekeeper Agent, Compliance Agent, Fraud Agent, and Tax/Vendor Agent under a central Lead Orchestrator, FraudLens validates spend policies, verifies Indian GSTINs, and flags collusion networks or duplicate submittals. SMBs save up to 15% of total operational spend by automatically catching leakages before payouts, reducing manual audit hours by 95%, and avoiding costly tax compliance penalties.

---

## 🏗️ Core Architectural Design

FraudLens uses a multi-agent auditing pipeline built on the **Google Agent Development Kit (ADK)** and integrated with a **FastMCP** server to expose core auditing tools:

```
                                 +-------------------------+
                                 |  Receipt/Invoice Upload |
                                 +------------+------------+
                                              |
                                              v
                               +--------------+--------------+
                               |   Intake Gatekeeper Agent   | (Pre-screens and validates document,
                               +--------------+--------------+  extracts vendor, amount, date, GSTIN)
                                              |
                                              v
                              +---------------+---------------+
                              |    Lead Orchestrator Agent    |
                              +---------------+---------------+
                                              |
                     +------------------------+------------------------+
                     |                        |                        |
                     v                        v                        v
         +-----------+-----------+  +---------+---------+  +-----------+-----------+
         |   Compliance Agent    |  |    Fraud Agent    |  |     Vendor Agent      |
         +-----------+-----------+  +---------+---------+  +-----------+-----------+
                     |                        |                        |
                     |                        |                        |
                     +------------------------+------------------------+
                                              |
                                              v
                              +---------------+---------------+
                              |  FastMCP Server (MySQL Tools) |
                              +---------------+---------------+
                                              |
                                              v
                                     +--------+--------+
                                     |  MySQL Database |
                                     +-----------------+
```

### Downstream Agents & Roles
1. **Intake Gatekeeper Agent**: Pre-screens the uploaded file/text to ensure it represents a valid receipt. If it is an arbitrary image, it rejects it immediately. Otherwise, it extracts the vendor, amount, date, category, and GSTIN.
2. **Compliance Agent**: Fetches category-specific rules via `get_policy_rules` and compares the transaction amount against spend limits and approval thresholds.
3. **Fraud Agent**: Uses `check_duplicate_receipt` to detect duplicate submissions within a 7-day window and `get_vendor_transaction_graph` to evaluate collusion risks.
4. **Vendor Agent**: Calls `verify_gstin` to analyze the vendor's Indian GSTIN format and status registry.
5. **Lead Orchestrator Agent**: Coordinates sub-agents, synthesizes reports into a final verdict (`Auto-Approved` / `Flagged for Review` / `Rejected`), and calls `flag_transaction` to update the database.

---

## 🌟 Key Features

1. **Intake Evaluation Guardrail**: Restricts intake to legitimate financial receipts. Completely filters out arbitrary uploads (such as scenery, pets, badges, or memes).
2. **GSTIN Registry Verification Tool**: Automatically parses and validates Indian GSTINs, displaying a color-coded status badge (`Verified` / `Unverified` / `Invalid`).
3. **Interactive Collusion Network Graph**: An SVG force-directed physics graph displaying employees and vendors as nodes. Thick red lines indicate repeat-transaction collusion risk clusters.
4. **Simulated WhatsApp Intake**: Simulates an employee forwarding a receipt to a bot. The backend performs parsing, triggers the agent pipeline, and replies back with the audit verdict.
5. **Self-Explaining Verdict Cards**: Shows the precise breakdown of reasoning for every audited transaction, including duplicate/collusion flags, compliance details, and tax verification info.

---

## 🚀 Local Setup & Installation

Follow these step-by-step instructions to set up and run the application locally:

### 1. Clone the Repository
```bash
git clone https://github.com/harshada-05-code/FraudLens.git
cd FraudLens
```

### 2. Database Migration Setup
Ensure your local MySQL service is running on port `3306`. Run the database schema migration script to set up the database and create all tables:
```bash
# Log in to your MySQL client and execute:
mysql -u root -p < schema.sql
```

### 3. Install Dependencies
Set up the Python virtual environment and install both backend and frontend dependencies:

**Backend Setup:**
```bash
python -m venv .venv
# Activate virtual environment:
# Windows:
.venv\Scripts\activate
# macOS/Linux:
source .venv/bin/activate

pip install -r requirements.txt
```

**Frontend Setup:**
```bash
cd frontend
npm install
cd ..
```

### 4. Database Seeding (Optional)
To populate the database with synthetic transactions, collusion networks, and GSTIN samples for testing:
```bash
python backend/seed.py
```

### 5. Running the Application
Start the local development servers for both the backend and frontend:

**Start Backend Server (FastAPI):**
```bash
# Set PYTHONPATH to backend folder
$env:PYTHONPATH="backend"  # Windows PowerShell
export PYTHONPATH="backend" # macOS/Linux

.venv\Scripts\python -m uvicorn main:app --host 127.0.0.1 --port 8000
```

**Start Frontend Server (Vite / React):**
```bash
cd frontend
npm run dev
```

Open your browser and navigate to **`http://localhost:5173/`** to interact with the dashboard.
