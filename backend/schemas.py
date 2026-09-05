from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class TransactionBase(BaseModel):
    transaction_id: str
    customer_id: str
    customer_name: str
    amount: float
    payment_method: str
    failure_reason: str
    previous_transactions: int
    previous_successful_payments: int
    previous_failed_payments: int
    customer_success_rate: float
    retry_count: int

class TransactionResponse(TransactionBase):
    id: int
    recovery_probability: float
    priority: str
    recommended_action: str
    recommendation_reason: str
    status: str
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class DashboardStats(BaseModel):
    total_transactions: int
    failed_payments: int
    failed_revenue: float
    recoverable_revenue: float
    recovered_revenue: float
    recovery_rate: float

class PredictionInput(BaseModel):
    amount: float = Field(..., example=249.99)
    payment_method: str = Field(..., example="Credit Card")
    failure_reason: str = Field(..., example="Insufficient Funds")
    previous_transactions: int = Field(..., example=25)
    previous_successful_payments: int = Field(..., example=22)
    previous_failed_payments: int = Field(..., example=3)
    retry_count: int = Field(default=0, example=1)
    customer_success_rate: Optional[float] = Field(default=None, example=0.88)

class PredictionOutput(BaseModel):
    recovery_probability: float
    is_recoverable: bool
    priority: str

class RecommendationInput(BaseModel):
    amount: float
    payment_method: str
    failure_reason: str
    recovery_probability: float
    retry_count: int
    customer_success_rate: float

class RecommendationOutput(BaseModel):
    recommended_action: str
    explanation: str

class ActionRequest(BaseModel):
    action: str = Field(..., example="execute_retry") # execute_retry, mark_recovered, mark_unrecoverable
