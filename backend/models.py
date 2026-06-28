import os
from datetime import datetime
from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, Date, ForeignKey, JSON
from sqlalchemy.orm import declarative_base, sessionmaker, relationship

# Load environment variables from .env file if it exists
env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".env")
if os.path.exists(env_path):
    with open(env_path, "r") as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                key, val = line.split("=", 1)
                os.environ[key.strip()] = val.strip()

# Load database URL from environment variable or use local default
DATABASE_URL = os.getenv("DATABASE_URL", "mysql+pymysql://root:@localhost:3306/fraudlens")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class Employee(Base):
    __tablename__ = "employees"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, nullable=False)
    department = Column(String(100), nullable=True)

class Vendor(Base):
    __tablename__ = "vendors"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    gstin = Column(String(15), unique=True, nullable=True)
    status = Column(String(50), default="Unverified") # Verified, Unverified, Invalid

class PolicyRule(Base):
    __tablename__ = "policy_rules"

    id = Column(Integer, primary_key=True, index=True)
    category = Column(String(100), unique=True, nullable=False)
    max_amount = Column(Float, nullable=False) # absolute limit above which transaction is flagged/rejected
    approval_threshold = Column(Float, nullable=False) # limit requiring second-level approval

class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    date = Column(Date, nullable=False)
    amount = Column(Float, nullable=False)
    category = Column(String(100), nullable=False)
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=False)
    vendor_id = Column(Integer, ForeignKey("vendors.id"), nullable=False)
    status = Column(String(50), default="Pending") # Pending, Approved, Flagged
    verdict = Column(String(50), nullable=True) # Auto-Approved, Flagged for Review, Rejected
    reasoning_trail = Column(JSON, nullable=True) # JSON object storing details from each agent
    receipt_url = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    employee = relationship("Employee")
    vendor = relationship("Vendor")

def init_db():
    Base.metadata.create_base_all = Base.metadata.create_all(bind=engine)
