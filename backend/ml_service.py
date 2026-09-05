import os
import joblib
import pandas as pd
import numpy as np

MODEL_PATH = os.getenv("ML_MODEL_PATH", os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "ml", "model.joblib")))

_model_bundle = None

def get_model_bundle():
    global _model_bundle
    if _model_bundle is None:
        if os.path.exists(MODEL_PATH):
            try:
                _model_bundle = joblib.load(MODEL_PATH)
                print(f"Loaded ML model successfully from {MODEL_PATH}")
            except Exception as e:
                print(f"Error loading model from {MODEL_PATH}: {e}")
                _model_bundle = None
        else:
            print(f"Model path {MODEL_PATH} not found. Will use heuristic fallback inference.")
    return _model_bundle

def predict_recovery_probability(
    amount: float,
    payment_method: str,
    failure_reason: str,
    previous_transactions: int,
    previous_successful_payments: int,
    previous_failed_payments: int,
    retry_count: int,
    customer_success_rate: float
) -> dict:
    bundle = get_model_bundle()

    if bundle is not None:
        try:
            model = bundle["model"]
            le_payment = bundle["le_payment"]
            le_failure = bundle["le_failure"]

            # Encode categorical features safely
            pay_enc = le_payment.transform([payment_method])[0] if payment_method in le_payment.classes_ else 0
            fail_enc = le_failure.transform([failure_reason])[0] if failure_reason in le_failure.classes_ else 0

            feature_cols = bundle["feature_cols"]
            row = {
                'amount': amount,
                'previous_transactions': previous_transactions,
                'previous_successful_payments': previous_successful_payments,
                'previous_failed_payments': previous_failed_payments,
                'customer_success_rate': customer_success_rate,
                'retry_count': retry_count,
                'payment_method_encoded': pay_enc,
                'failure_reason_encoded': fail_enc
            }
            X_df = pd.DataFrame([row])[feature_cols]

            proba = float(model.predict_proba(X_df)[0][1])
        except Exception as e:
            print(f"Inference error, fallback to heuristic: {e}")
            proba = _heuristic_probability(failure_reason, customer_success_rate, retry_count, amount)
    else:
        proba = _heuristic_probability(failure_reason, customer_success_rate, retry_count, amount)

    probability = round(max(0.02, min(0.98, proba)), 4)
    is_recoverable = probability >= 0.50

    # Determine priority
    if probability >= 0.70 and amount >= 150:
        priority = "High"
    elif probability >= 0.85:
        priority = "High"
    elif probability < 0.40:
        priority = "Low"
    else:
        priority = "Medium"

    return {
        "recovery_probability": probability,
        "is_recoverable": is_recoverable,
        "priority": priority
    }

def _heuristic_probability(failure_reason: str, customer_success_rate: float, retry_count: int, amount: float) -> float:
    base = 0.50
    if failure_reason == "Network Timeout":
        base += 0.35
    elif failure_reason == "Authentication Failed":
        base += 0.25
    elif failure_reason == "Expired Card":
        base += 0.15
    elif failure_reason == "Insufficient Funds":
        base -= 0.10
    elif failure_reason == "Bank Decline":
        base -= 0.30

    base += (customer_success_rate - 0.75) * 0.4
    base -= retry_count * 0.10
    return max(0.05, min(0.95, base))
