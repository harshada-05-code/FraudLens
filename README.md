# FraudLens 🛡️

**FraudLens** is an AI-powered expense and invoice fraud auditor built for small and medium businesses (SMBs) in India. It was designed and developed for the AI Agents Hackathon.

FraudLens automatically parses uploaded or forwarded receipts, runs a team of cooperative AI agents to audit them for compliance and fraud risks, and displays a step-by-step reasoning trail on an interactive dashboard.

---

## 🏗️ Architecture & Multi-Agent Design

FraudLens uses a multi-agent auditing pipeline built on the **Google Agent Development Kit (ADK)** and integrated with a **FastMCP** server to expose core auditing tools:

```
[ Receipt/Invoice ]
         │
         ▼
 1. 📥 Intake Agent  ───► Extracts metadata (vendor, amount, date, category)
         │
         ▼
 2. ⚖️ Compliance Agent ──► Audits limits & approval rules (get_policy_rules)
         │
         ▼
 3. 🕵️ Fraud Agent   ───► Runs duplicate checking & collusion network forensics
         │
         ▼
 4. 🏢 Vendor Agent  ───► Verifies GSTIN format & registry (verify_gstin)
         │
         ▼
 5. 🤖 Orchestrator Agent ──► Synthesizes sub-agent reports into a final verdict,
                              writes detailed reasoning trail to MySQL database.
```

### Exposed FastMCP Server Tools
- `get_policy_rules(category)`: Retrieves spend limits and approval thresholds.
- `check_duplicate_receipt(amount, vendor_name, date_str, employee_id)`: Checks for duplicates in a 7-day window.
- `get_vendor_transaction_graph(vendor_id)`: Evaluates repeat-only connection metrics to spot collusion.
- `verify_gstin(gstin_number)`: Analyzes Indian GSTIN registration status.
- `flag_transaction(transaction_id, verdict, reasoning)`: Updates transaction status.
- `get_dashboard_summary()`: Aggregates metrics for the frontend charts and feed.

---

## 🌟 Key Features

1. **GSTIN Registry Verification Tool**: Automatically parses and validates Indian GSTINs, displaying a color-coded status badge (`Verified` / `Unverified` / `Invalid`).
2. **Interactive Collusion Network Graph**: An SVG force-directed physics graph displaying employees and vendors as nodes. Drag nodes to inspect links; thick red lines indicate repeat-transaction collusion risk clusters.
3. **Simulated WhatsApp Intake**: Simulates an employee forwarding a receipt to the bot. The backend performs parsing, triggers the AI agent pipeline, and replies back with the audit verdict.
4. **Self-Explaining Verdict Cards**: Shows the precise breakdown of reasoning for every audited transaction, including duplicate/collusion flags, compliance details, and tax verification info.

---

## 🚀 Local Setup & Installation

### Prerequisites
- Python 3.10+
- Node.js v18+
- MySQL Server 8.0

### 1. Database Setup
Ensure your local MySQL service is running on port `3306`. Start by creating the `fraudlens` database:
```sql
CREATE DATABASE IF NOT EXISTS fraudlens;
```

### 2. Backend Installation
1. Initialize the Python virtual environment and install dependencies:
   ```bash
   python -m venv .venv
   # Activate:
   # Windows: .venv\Scripts\activate
   # macOS/Linux: source .venv/bin/activate
   
   pip install google-adk mcp fastapi uvicorn sqlalchemy pymysql pydantic cryptography jinja2
   ```
2. Run the database seed script to populate synthetic transactions, collusion networks, and GSTIN samples:
   ```bash
   python backend/seed.py
   ```
3. *(Optional)* Configure your Gemini API key in the environment:
   ```bash
   # Windows
   $env:GEMINI_API_KEY="your-api-key-here"
   # macOS/Linux
   export GEMINI_API_KEY="your-api-key-here"
   ```
   *Note: If no API key is present, FraudLens falls back to a rule-based simulation engine that produces identical structured reasoning logs so you can fully run and test the app offline.*

4. Launch the FastAPI server:
   ```bash
   $env:PYTHONPATH="backend"
   uvicorn main:app --host 127.0.0.1 --port 8000
   ```

### 3. Frontend Installation
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install npm packages:
   ```bash
   npm install
   ```
3. Start the React development server:
   ```bash
   npm run dev
   ```
4. Open your browser and navigate to `http://localhost:5173/`.

---

## 🔗 GitHub Repository
The source code is fully tracked and pushed to:
[https://github.com/harshada-05-code/FraudLens](https://github.com/harshada-05-code/FraudLens)
