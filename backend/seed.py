import random
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from models import engine, SessionLocal, Base, Employee, Vendor, PolicyRule, Transaction

# Seed configuration
NUM_EMPLOYEES = 12
NUM_VENDORS = 18
NUM_TRANSACTIONS = 160

# Categories and their policy settings
CATEGORIES = {
    "Travel": {"max": 75000.0, "threshold": 50000.0},
    "Meals": {"max": 10000.0, "threshold": 5000.0},
    "Software": {"max": 150000.0, "threshold": 100000.0},
    "Office Supplies": {"max": 30000.0, "threshold": 15000.0},
    "Consulting": {"max": 200000.0, "threshold": 120000.0},
    "Hardware": {"max": 120000.0, "threshold": 80000.0}
}

DEPARTMENTS = ["Engineering", "Sales", "Marketing", "HR", "Finance", "Operations"]

# GSTIN generators
def generate_valid_gstin():
    state_code = "27"  # Maharashtra
    pan = "".join(random.choices("ABCDEFGHIJKLMNOPQRSTUVWXYZ", k=5)) + \
          "".join(random.choices("0123456789", k=4)) + \
          random.choice("ABCDEFGHIJKLMNOPQRSTUVWXYZ")
    entity = "1"
    z = "Z"
    checksum = random.choice("0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ")
    return f"{state_code}{pan}{entity}{z}{checksum}"

def generate_invalid_gstin():
    return "".join(random.choices("0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ", k=10))

def seed_data():
    db = SessionLocal()
    try:
        seed_data_in_db(db, recreate_tables=True)
    except Exception as e:
        print(f"Error seeding database: {e}")
        raise e
    finally:
        db.close()

def seed_data_in_db(db: Session, recreate_tables: bool = True):
    try:
        if recreate_tables:
            # Recreate tables
            Base.metadata.drop_all(bind=engine)
            Base.metadata.create_all(bind=engine)
            print("Database tables recreated.")

        # 1. Seed Policy Rules
        for cat, limits in CATEGORIES.items():
            rule = PolicyRule(
                category=cat,
                max_amount=limits["max"],
                approval_threshold=limits["threshold"]
            )
            db.add(rule)
        
        # 2. Seed Employees
        employees = []
        names = [
            "Aarav Mehta", "Diya Sharma", "Ishaan Patel", "Ananya Iyer", 
            "Kabir Rao", "Meera Nair", "Arjun Gupta", "Riya Sen", 
            "Dev Shah", "Neha Verma", "Aditya Joshi", "Sanya Malhotra"
        ]
        for i in range(NUM_EMPLOYEES):
            name = names[i]
            email = f"{name.lower().replace(' ', '.')}@fraudlens-company.in"
            emp = Employee(
                name=name,
                email=email,
                department=random.choice(DEPARTMENTS)
            )
            db.add(emp)
            employees.append(emp)
        db.commit()
        # Refresh to get IDs
        for emp in employees:
            db.refresh(emp)
        print(f"Seeded {len(employees)} employees.")

        # 3. Seed Vendors
        vendors = []
        vendor_names = [
            "Apex Consulting Services", "Dhaba Express Ltd", "Indigo Airlines", 
            "WeWork India", "AWS Cloud Services", "Microsoft India Ltd", 
            "Chai Point Corp", "Staples Office Solutions", "Taj Hotels", 
            "Ola Cabs", "Uber India", "Blue Dart Express", "Dell Technologies", 
            "Reliance Retail", "Tata Power", "Infosys Ltd", 
            "Shree Balaji Printers", "Garg Stationery & Xerox"
        ]
        
        for i in range(NUM_VENDORS):
            name = vendor_names[i]
            
            # Mix of verified, unverified, invalid GSTINs
            if i % 3 == 0:
                gstin = generate_valid_gstin()
                status = "Verified"
            elif i % 3 == 1:
                gstin = generate_valid_gstin()
                status = "Unverified"
            else:
                gstin = generate_invalid_gstin()
                status = "Invalid"

            vendor = Vendor(
                name=name,
                gstin=gstin,
                status=status
            )
            db.add(vendor)
            vendors.append(vendor)
        db.commit()
        for v in vendors:
            db.refresh(v)
        print(f"Seeded {len(vendors)} vendors.")

        # Keep track of generated transactions to allow duplicates/collusion injecting
        transactions = []
        start_date = datetime.now() - timedelta(days=60)

        # 4. Generate standard transactions (Normal transactions)
        for _ in range(NUM_TRANSACTIONS - 20):  # reserve 20 for custom fraud seeds
            emp = random.choice(employees)
            vendor = random.choice(vendors)
            cat = random.choice(list(CATEGORIES.keys()))
            
            # Normally distributed amount under the category maximum
            limit = CATEGORIES[cat]["max"]
            amount = round(random.uniform(500, limit * 0.7), 2)
            
            # Normal distribution of dates
            days_ago = random.randint(0, 60)
            tx_date = (start_date + timedelta(days=days_ago)).date()
            
            tx = Transaction(
                date=tx_date,
                amount=amount,
                category=cat,
                employee_id=emp.id,
                vendor_id=vendor.id,
                status="Approved" if amount < CATEGORIES[cat]["threshold"] else "Pending",
                verdict="Auto-Approved" if amount < CATEGORIES[cat]["threshold"] else "Flagged for Review",
                reasoning_trail={
                    "intake": {"status": "success", "extracted": {"vendor": vendor.name, "amount": amount, "date": tx_date.isoformat(), "category": cat}},
                    "compliance": {"status": "success", "flags": [], "message": "Transaction is within budget limits."},
                    "fraud": {"status": "success", "duplicate_risk": "Low", "collusion_risk": "Low"},
                    "vendor": {"status": "success", "gstin_status": vendor.status, "message": f"GSTIN status verified as {vendor.status}."}
                },
                receipt_url=f"/receipts/tx_{random.randint(1000, 9999)}.png"
            )
            db.add(tx)
            transactions.append(tx)

        # 5. Inject Fraud Seeds (Duplicates)
        # Duplicate pair 1: Same day, same amount, same employee, same vendor
        dup_emp = employees[0]
        dup_vendor = vendors[1]  # Dhaba Express
        dup_date = (start_date + timedelta(days=15)).date()
        dup_amount = 4500.00
        
        tx_orig1 = Transaction(
            date=dup_date,
            amount=dup_amount,
            category="Meals",
            employee_id=dup_emp.id,
            vendor_id=dup_vendor.id,
            status="Approved",
            verdict="Auto-Approved",
            reasoning_trail={
                "intake": {"status": "success", "extracted": {"vendor": dup_vendor.name, "amount": dup_amount, "date": dup_date.isoformat(), "category": "Meals"}},
                "compliance": {"status": "success", "flags": [], "message": "Transaction is within budget limits."},
                "fraud": {"status": "success", "duplicate_risk": "Low", "collusion_risk": "Low"},
                "vendor": {"status": "success", "gstin_status": dup_vendor.status}
            },
            receipt_url="/receipts/dhaba_1.png"
        )
        db.add(tx_orig1)
        
        # Exact duplicate submitted 2 days later
        tx_dup1 = Transaction(
            date=dup_date + timedelta(days=2),
            amount=dup_amount,
            category="Meals",
            employee_id=dup_emp.id,
            vendor_id=dup_vendor.id,
            status="Flagged",
            verdict="Rejected",
            reasoning_trail={
                "intake": {"status": "success", "extracted": {"vendor": dup_vendor.name, "amount": dup_amount, "date": (dup_date + timedelta(days=2)).isoformat(), "category": "Meals"}},
                "compliance": {"status": "success", "flags": [], "message": "Within budget limits."},
                "fraud": {
                    "status": "flagged",
                    "duplicate_risk": "High",
                    "duplicate_details": f"Duplicate of receipt #1, 100% amount match, submitted 2 days ago by the same employee.",
                    "collusion_risk": "Low"
                },
                "vendor": {"status": "success", "gstin_status": dup_vendor.status}
            },
            receipt_url="/receipts/dhaba_1_copy.png"
        )
        db.add(tx_dup1)

        # Duplicate pair 2: Fuzzy match (amount very close, same date/employee, different invoice number/format)
        dup_emp2 = employees[3]  # Ananya Iyer
        dup_vendor2 = vendors[2]  # Indigo Airlines
        dup_date2 = (start_date + timedelta(days=30)).date()
        
        tx_orig2 = Transaction(
            date=dup_date2,
            amount=28500.00,
            category="Travel",
            employee_id=dup_emp2.id,
            vendor_id=dup_vendor2.id,
            status="Pending",
            verdict="Flagged for Review",
            reasoning_trail={
                "intake": {"status": "success", "extracted": {"vendor": dup_vendor2.name, "amount": 28500.00, "date": dup_date2.isoformat(), "category": "Travel"}},
                "compliance": {"status": "success", "flags": ["Second-level approval required"], "message": "Exceeds approval threshold of 50,000 INR."},
                "fraud": {"status": "success", "duplicate_risk": "Low", "collusion_risk": "Low"},
                "vendor": {"status": "success", "gstin_status": dup_vendor2.status}
            },
            receipt_url="/receipts/indigo_ticket.png"
        )
        db.add(tx_orig2)

        tx_dup2 = Transaction(
            date=dup_date2,
            amount=28499.00,  # 1 INR difference
            category="Travel",
            employee_id=dup_emp2.id,
            vendor_id=dup_vendor2.id,
            status="Flagged",
            verdict="Rejected",
            reasoning_trail={
                "intake": {"status": "success", "extracted": {"vendor": dup_vendor2.name, "amount": 28499.00, "date": dup_date2.isoformat(), "category": "Travel"}},
                "compliance": {"status": "success", "flags": [], "message": "Within budget limits."},
                "fraud": {
                    "status": "flagged",
                    "duplicate_risk": "High",
                    "duplicate_details": "Fuzzy duplicate of Indigo flight ticket (99.9% amount match, same date and employee).",
                    "collusion_risk": "Low"
                },
                "vendor": {"status": "success", "gstin_status": dup_vendor2.status}
            },
            receipt_url="/receipts/indigo_ticket_reprint.png"
        )
        db.add(tx_dup2)

        # 6. Inject Collusion Cluster 1: Employee Kabir Rao (id=5) and Apex Consulting Services (id=1)
        # Kabir Rao repeatedly files high-value Consulting transactions with Apex Consulting Services
        collusion_emp1 = employees[4]   # Kabir Rao
        collusion_vendor1 = vendors[0]  # Apex Consulting Services
        for d in range(8):
            tx_amount = 145000.00 + (d * 5000)  # Round figures
            tx_date = (start_date + timedelta(days=d * 5)).date()
            is_flagged = d >= 5
            tx_coll1 = Transaction(
                date=tx_date,
                amount=tx_amount,
                category="Consulting",
                employee_id=collusion_emp1.id,
                vendor_id=collusion_vendor1.id,
                status="Flagged" if is_flagged else "Approved",
                verdict="Flagged for Review" if is_flagged else "Auto-Approved",
                reasoning_trail={
                    "intake": {"status": "success", "extracted": {"vendor": collusion_vendor1.name, "amount": tx_amount, "date": tx_date.isoformat(), "category": "Consulting"}},
                    "compliance": {"status": "success", "flags": ["Above threshold"] if tx_amount > 120000 else []},
                    "fraud": {
                        "status": "flagged" if is_flagged else "success",
                        "duplicate_risk": "Low",
                        "collusion_risk": "High" if is_flagged else "Medium",
                        "collusion_details": "Highly suspicious dense transaction history. Employee Kabir Rao has made 8 high-value transactions with Apex Consulting Services within 40 days, representing 92% of the vendor's total revenue." if is_flagged else "Repeated activity detected."
                    },
                    "vendor": {"status": "success", "gstin_status": collusion_vendor1.status}
                },
                receipt_url=f"/receipts/apex_inv_{d}.png"
            )
            db.add(tx_coll1)

        # 7. Inject Collusion Cluster 2: Employee Arjun Gupta (id=7) and Garg Stationery (id=18)
        # Arjun Gupta submits many transactions for Garg Stationery (Invalid GSTIN!)
        collusion_emp2 = employees[6]   # Arjun Gupta
        collusion_vendor2 = vendors[17] # Garg Stationery & Xerox (Invalid GSTIN)
        for d in range(6):
            tx_amount = 22000.00 + (d * 1200)
            tx_date = (start_date + timedelta(days=d * 6)).date()
            tx_coll2 = Transaction(
                date=tx_date,
                amount=tx_amount,
                category="Office Supplies",
                employee_id=collusion_emp2.id,
                vendor_id=collusion_vendor2.id,
                status="Flagged",
                verdict="Flagged for Review",
                reasoning_trail={
                    "intake": {"status": "success", "extracted": {"vendor": collusion_vendor2.name, "amount": tx_amount, "date": tx_date.isoformat(), "category": "Office Supplies"}},
                    "compliance": {"status": "success", "flags": ["Above threshold"] if tx_amount > 15000 else []},
                    "fraud": {
                        "status": "flagged",
                        "duplicate_risk": "Low",
                        "collusion_risk": "High",
                        "collusion_details": "Arjun Gupta has filed 6 separate office supply invoices with Garg Stationery (Invalid GSTIN) in 36 days. High density repeat pattern with non-verified vendor."
                    },
                    "vendor": {
                        "status": "invalid",
                        "gstin_status": "Invalid",
                        "message": "The vendor's GSTIN format does not match any valid state profile. Immediate risk flagged."
                    }
                },
                receipt_url=f"/receipts/garg_bill_{d}.png"
            )
            db.add(tx_coll2)

        db.commit()
        print("Successfully seeded database with synthetic transactions, employees, vendors, and policies.")

    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
        raise e

if __name__ == "__main__":
    seed_data()
