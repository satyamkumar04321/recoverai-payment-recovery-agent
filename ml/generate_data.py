import os
import random
import json
import pandas as pd
import numpy as np
from datetime import datetime, timedelta

def generate_synthetic_transactions(num_records=1000, seed=42):
    """
    Generates synthetic payment transactions with realistic features, 
    failure reasons, customer history metrics, and ground truth recovery labels.
    """
    random.seed(seed)
    np.random.seed(seed)

    company_names = [
        "Apex Logistics", "Nova Software", "Starlight Media", "Horizon Tech",
        "Vanguard Systems", "Pulse Health", "ECHO Commerce", "Quantum Labs",
        "Nexus Retail", "Zenith Financial", "CloudScale Networks", "Aura Designs"
    ]
    individual_names = [
        "Alex Mercer", "Sarah Jenkins", "Rajesh Kumar", "Elena Rostova",
        "Marcus Chen", "Priya Sharma", "David Miller", "Sophia Taylor",
        "Carlos Mendez", "Fatima Al-Mansoor", "Liam O'Connor", "Yuki Tanaka"
    ]
    all_names = company_names + individual_names

    customers = []
    for i in range(1, 151):
        c_id = f"CUST-{1000 + i}"
        c_name = all_names[(i - 1) % len(all_names)] + f" ({c_id})"
        prev_txns = random.randint(8, 120)
        # Success rate centered around 82%
        base_success_rate = random.uniform(0.60, 0.98)
        prev_success = int(prev_txns * base_success_rate)
        prev_failed = prev_txns - prev_success
        
        customers.append({
            "customer_id": c_id,
            "customer_name": c_name,
            "previous_transactions": prev_txns,
            "previous_successful_payments": prev_success,
            "previous_failed_payments": prev_failed,
            "customer_success_rate": round(prev_success / prev_txns, 3)
        })

    payment_methods = ["Credit Card", "Debit Card", "UPI", "ACH Direct Debit", "Digital Wallet"]
    failure_reasons = ["Insufficient Funds", "Expired Card", "Network Timeout", "Authentication Failed", "Bank Decline"]

    records = []
    start_date = datetime.now() - timedelta(days=30)

    for i in range(1, num_records + 1):
        txn_id = f"TXN-{10000 + i}"
        customer = random.choice(customers)
        
        # Payment amount distribution
        amount = round(random.choice([
            random.uniform(15.0, 150.0),
            random.uniform(150.0, 600.0),
            random.uniform(600.0, 2500.0)
        ]), 2)
        
        payment_method = random.choice(payment_methods)
        failure_reason = random.choice(failure_reasons)
        retry_count = random.choice([0, 0, 1, 1, 2, 3])
        
        # Calculate realistic recovery probability weight for ground truth label generation
        base_prob = 0.50
        
        if failure_reason == "Network Timeout":
            base_prob += 0.35
        elif failure_reason == "Authentication Failed":
            base_prob += 0.25
        elif failure_reason == "Expired Card":
            base_prob += 0.10
        elif failure_reason == "Insufficient Funds":
            base_prob -= 0.10
        elif failure_reason == "Bank Decline":
            base_prob -= 0.30
            
        # Adjust based on customer success rate
        base_prob += (customer["customer_success_rate"] - 0.75) * 0.4
        
        # Adjust based on retry count
        base_prob -= retry_count * 0.12
        
        # Adjust based on amount
        if amount > 1500:
            base_prob -= 0.08
            
        # Bound probability between 0.05 and 0.95
        true_prob = max(0.05, min(0.95, base_prob))
        
        # Ground truth recovery outcome
        is_recovered = 1 if random.random() < true_prob else 0
        
        # Assign realistic status
        if is_recovered == 1:
            status = random.choice(["Recovered", "Recovered", "Pending"])
        else:
            status = random.choice(["Failed", "Failed", "Unrecoverable"])

        created_at = start_date + timedelta(days=random.uniform(0, 30))
        
        records.append({
            "transaction_id": txn_id,
            "customer_id": customer["customer_id"],
            "customer_name": customer["customer_name"],
            "amount": amount,
            "payment_method": payment_method,
            "failure_reason": failure_reason,
            "previous_transactions": customer["previous_transactions"],
            "previous_successful_payments": customer["previous_successful_payments"],
            "previous_failed_payments": customer["previous_failed_payments"],
            "customer_success_rate": customer["customer_success_rate"],
            "retry_count": retry_count,
            "is_recovered": is_recovered,
            "status": status,
            "created_at": created_at.strftime("%Y-%m-%d %H:%M:%S")
        })

    df = pd.DataFrame(records)
    return df

if __name__ == "__main__":
    os.makedirs("data", exist_ok=True)
    df = generate_synthetic_transactions(1000)
    output_path = os.path.join("data", "synthetic_transactions.csv")
    df.to_csv(output_path, index=False)
    print(f"Generated {len(df)} synthetic transaction records at {output_path}")
