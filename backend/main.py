import os
import sys
import pandas as pd
from typing import List, Optional
from datetime import datetime
from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

# Add current directory and root to sys.path for robust imports
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from database import engine, Base, get_db, SessionLocal
from models import Transaction
from schemas import (
    TransactionResponse,
    DashboardStats,
    PredictionInput,
    PredictionOutput,
    RecommendationInput,
    RecommendationOutput,
    ActionRequest
)
from ml_service import predict_recovery_probability
from recommendation_service import get_recommendation

# Initialize Database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="RecoverAI API",
    description="AI-Powered Payment Revenue Recovery Agent API",
    version="1.0.0"
)

# Enable CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def seed_database_if_empty():
    db = SessionLocal()
    try:
        count = db.query(Transaction).count()
        if count == 0:
            csv_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "data", "synthetic_transactions.csv"))
            if os.path.exists(csv_path):
                print(f"Seeding database from {csv_path}...")
                df = pd.read_csv(csv_path)
                
                db_objects = []
                for _, row in df.iterrows():
                    # Calculate initial ML predictions for seeded records
                    pred = predict_recovery_probability(
                        amount=float(row['amount']),
                        payment_method=str(row['payment_method']),
                        failure_reason=str(row['failure_reason']),
                        previous_transactions=int(row['previous_transactions']),
                        previous_successful_payments=int(row['previous_successful_payments']),
                        previous_failed_payments=int(row['previous_failed_payments']),
                        retry_count=int(row['retry_count']),
                        customer_success_rate=float(row['customer_success_rate'])
                    )

                    rec = get_recommendation(
                        amount=float(row['amount']),
                        payment_method=str(row['payment_method']),
                        failure_reason=str(row['failure_reason']),
                        recovery_probability=pred['recovery_probability'],
                        retry_count=int(row['retry_count']),
                        customer_success_rate=float(row['customer_success_rate'])
                    )

                    txn = Transaction(
                        transaction_id=str(row['transaction_id']),
                        customer_id=str(row['customer_id']),
                        customer_name=str(row['customer_name']),
                        amount=float(row['amount']),
                        payment_method=str(row['payment_method']),
                        failure_reason=str(row['failure_reason']),
                        previous_transactions=int(row['previous_transactions']),
                        previous_successful_payments=int(row['previous_successful_payments']),
                        previous_failed_payments=int(row['previous_failed_payments']),
                        customer_success_rate=float(row['customer_success_rate']),
                        retry_count=int(row['retry_count']),
                        recovery_probability=pred['recovery_probability'],
                        priority=pred['priority'],
                        recommended_action=rec['recommended_action'],
                        recommendation_reason=rec['explanation'],
                        status=str(row['status'])
                    )
                    db_objects.append(txn)
                
                db.bulk_save_objects(db_objects)
                db.commit()
                print(f"Successfully seeded {len(db_objects)} transactions into SQLite DB.")
    except Exception as e:
        print(f"Error during DB seeding: {e}")
        db.rollback()
    finally:
        db.close()

# Seed on startup
seed_database_if_empty()

@app.get("/")
def read_root():
    return {
        "name": "RecoverAI API",
        "status": "online",
        "docs": "/docs"
    }

@app.get("/api/dashboard", response_model=DashboardStats)
def get_dashboard_stats(db: Session = Depends(get_db)):
    transactions = db.query(Transaction).all()
    
    total_transactions = len(transactions)
    failed_txns = [t for t in transactions if t.status in ["Failed", "Pending", "Unrecoverable"]]
    failed_payments = len(failed_txns)
    
    failed_revenue = sum(t.amount for t in failed_txns)
    
    # Recoverable revenue: Failed or Pending transactions with probability >= 0.50
    recoverable_revenue = sum(
        t.amount for t in transactions 
        if t.status in ["Failed", "Pending"] and t.recovery_probability >= 0.50
    )
    
    # Recovered revenue: transactions with status Recovered
    recovered_revenue = sum(t.amount for t in transactions if t.status == "Recovered")
    
    # Recovery rate percentage
    total_failed_ever = sum(1 for t in transactions if t.status in ["Failed", "Recovered", "Unrecoverable", "Pending"])
    recovered_count = sum(1 for t in transactions if t.status == "Recovered")
    
    recovery_rate = round((recovered_count / total_failed_ever * 100), 2) if total_failed_ever > 0 else 0.0

    return DashboardStats(
        total_transactions=total_transactions,
        failed_payments=failed_payments,
        failed_revenue=round(failed_revenue, 2),
        recoverable_revenue=round(recoverable_revenue, 2),
        recovered_revenue=round(recovered_revenue, 2),
        recovery_rate=recovery_rate
    )

@app.get("/api/transactions", response_model=List[TransactionResponse])
def get_transactions(
    status: Optional[str] = Query(None, description="Filter by status (Failed, Recovered, Pending, Unrecoverable)"),
    failure_reason: Optional[str] = Query(None, description="Filter by failure reason"),
    search: Optional[str] = Query(None, description="Search by customer name or transaction ID"),
    db: Session = Depends(get_db)
):
    query = db.query(Transaction)
    
    if status and status != "All":
        query = query.filter(Transaction.status == status)
    if failure_reason and failure_reason != "All":
        query = query.filter(Transaction.failure_reason == failure_reason)
    if search:
        search_fmt = f"%{search}%"
        query = query.filter(
            (Transaction.customer_name.ilike(search_fmt)) | 
            (Transaction.transaction_id.ilike(search_fmt))
        )
        
    return query.order_by(Transaction.id.desc()).all()

@app.get("/api/transactions/{id}", response_model=TransactionResponse)
def get_transaction_by_id(id: str, db: Session = Depends(get_db)):
    # Support lookup by integer ID or string transaction_id
    if id.isdigit():
        txn = db.query(Transaction).filter(Transaction.id == int(id)).first()
    else:
        txn = db.query(Transaction).filter(Transaction.transaction_id == id).first()

    if not txn:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return txn

@app.post("/api/predict", response_model=PredictionOutput)
def predict_transaction(payload: PredictionInput):
    # Auto-calculate success rate if omitted
    if payload.customer_success_rate is None:
        total = payload.previous_transactions
        success_rate = (payload.previous_successful_payments / total) if total > 0 else 0.75
    else:
        success_rate = payload.customer_success_rate

    result = predict_recovery_probability(
        amount=payload.amount,
        payment_method=payload.payment_method,
        failure_reason=payload.failure_reason,
        previous_transactions=payload.previous_transactions,
        previous_successful_payments=payload.previous_successful_payments,
        previous_failed_payments=payload.previous_failed_payments,
        retry_count=payload.retry_count,
        customer_success_rate=success_rate
    )
    return PredictionOutput(**result)

@app.post("/api/recommend", response_model=RecommendationOutput)
def recommend_action(payload: RecommendationInput):
    result = get_recommendation(
        amount=payload.amount,
        payment_method=payload.payment_method,
        failure_reason=payload.failure_reason,
        recovery_probability=payload.recovery_probability,
        retry_count=payload.retry_count,
        customer_success_rate=payload.customer_success_rate
    )
    return RecommendationOutput(**result)

@app.post("/api/transactions/{id}/action", response_model=TransactionResponse)
def execute_transaction_action(id: str, payload: ActionRequest, db: Session = Depends(get_db)):
    if id.isdigit():
        txn = db.query(Transaction).filter(Transaction.id == int(id)).first()
    else:
        txn = db.query(Transaction).filter(Transaction.transaction_id == id).first()

    if not txn:
        raise HTTPException(status_code=404, detail="Transaction not found")

    if payload.action == "execute_retry" or payload.action == "mark_recovered":
        txn.status = "Recovered"
        txn.retry_count += 1
        txn.recommendation_reason = "Payment successfully recovered via automated AI recovery workflow."
    elif payload.action == "mark_unrecoverable":
        txn.status = "Unrecoverable"
        txn.retry_count += 1
        txn.recommendation_reason = "Marked as unrecoverable following final attempt."
    else:
        txn.retry_count += 1

    db.commit()
    db.refresh(txn)
    return txn
