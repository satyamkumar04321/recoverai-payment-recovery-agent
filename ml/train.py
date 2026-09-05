import os
import joblib
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import accuracy_score, precision_score, recall_score, roc_auc_score

def train_model(data_path="data/synthetic_transactions.csv", model_output_path="ml/model.joblib"):
    if not os.path.exists(data_path):
        print(f"Data file not found at {data_path}. Running generator...")
        from generate_data import generate_synthetic_transactions
        df = generate_synthetic_transactions(1000)
        os.makedirs(os.path.dirname(data_path), exist_ok=True)
        df.to_csv(data_path, index=False)
    else:
        df = pd.read_csv(data_path)

    # Preprocessing Encoders
    le_payment = LabelEncoder()
    le_failure = LabelEncoder()

    df['payment_method_encoded'] = le_payment.fit_transform(df['payment_method'])
    df['failure_reason_encoded'] = le_failure.fit_transform(df['failure_reason'])

    feature_cols = [
        'amount',
        'previous_transactions',
        'previous_successful_payments',
        'previous_failed_payments',
        'customer_success_rate',
        'retry_count',
        'payment_method_encoded',
        'failure_reason_encoded'
    ]

    X = df[feature_cols]
    y = df['is_recovered']

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    clf = RandomForestClassifier(
        n_estimators=100,
        max_depth=8,
        min_samples_split=4,
        random_state=42
    )

    clf.fit(X_train, y_train)

    # Evaluation
    y_pred = clf.predict(X_test)
    y_proba = clf.predict_proba(X_test)[:, 1]

    acc = accuracy_score(y_test, y_pred)
    prec = precision_score(y_test, y_pred)
    rec = recall_score(y_test, y_pred)
    auc = roc_auc_score(y_test, y_proba)

    print("=== RecoverAI Model Evaluation Metrics ===")
    print(f"Accuracy:  {acc:.4f}")
    print(f"Precision: {prec:.4f}")
    print(f"Recall:    {rec:.4f}")
    print(f"ROC-AUC:   {auc:.4f}")

    # Feature Importances
    importances = dict(zip(feature_cols, clf.feature_importances_))
    print("\nFeature Importances:")
    for feat, imp in sorted(importances.items(), key=lambda x: x[1], reverse=True):
        print(f"  {feat}: {imp:.4f}")

    # Package model payload
    model_payload = {
        "model": clf,
        "le_payment": le_payment,
        "le_failure": le_failure,
        "feature_cols": feature_cols,
        "metrics": {
            "accuracy": round(acc, 4),
            "precision": round(prec, 4),
            "recall": round(rec, 4),
            "roc_auc": round(auc, 4)
        }
    }

    os.makedirs(os.path.dirname(model_output_path), exist_ok=True)
    joblib.dump(model_payload, model_output_path)
    print(f"\nModel bundle successfully saved to {model_output_path}")

if __name__ == "__main__":
    train_model()
