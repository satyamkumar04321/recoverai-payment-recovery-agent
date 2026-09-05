from sqlalchemy import Column, Integer, String, Float, DateTime
from datetime import datetime
from database import Base

class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    transaction_id = Column(String, unique=True, index=True, nullable=False)
    customer_id = Column(String, index=True, nullable=False)
    customer_name = Column(String, nullable=False)
    amount = Column(Float, nullable=False)
    payment_method = Column(String, nullable=False)
    failure_reason = Column(String, nullable=False)
    previous_transactions = Column(Integer, default=0)
    previous_successful_payments = Column(Integer, default=0)
    previous_failed_payments = Column(Integer, default=0)
    customer_success_rate = Column(Float, default=0.0)
    retry_count = Column(Integer, default=0)
    
    # ML & Decision Outputs
    recovery_probability = Column(Float, default=0.0)
    priority = Column(String, default="Medium")
    recommended_action = Column(String, default="Retry Payment")
    recommendation_reason = Column(String, default="")
    status = Column(String, default="Failed") # Failed, Recovered, Pending, Unrecoverable
    created_at = Column(DateTime, default=datetime.utcnow)
