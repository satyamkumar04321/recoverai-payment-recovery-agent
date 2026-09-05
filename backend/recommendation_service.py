import os
import requests

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "").strip()

def get_recommendation(
    amount: float,
    payment_method: str,
    failure_reason: str,
    recovery_probability: float,
    retry_count: int,
    customer_success_rate: float
) -> dict:
    """
    Returns optimal recovery action and short explanation.
    Uses deterministic rule-based matrix by default, or OpenAI API if key is present.
    """
    # 1. Rule-Based Matrix (Default & Primary Engine)
    action, explanation = _rule_based_recommendation(
        amount=amount,
        payment_method=payment_method,
        failure_reason=failure_reason,
        recovery_probability=recovery_probability,
        retry_count=retry_count,
        customer_success_rate=customer_success_rate
    )

    # 2. Optional LLM Enhancement (if API Key provided)
    if OPENAI_API_KEY:
        try:
            llm_res = _call_openai_recommendation(
                amount, payment_method, failure_reason, recovery_probability, retry_count, customer_success_rate
            )
            if llm_res and "action" in llm_res and "explanation" in llm_res:
                return llm_res
        except Exception as e:
            print(f"LLM API call failed, defaulting to rule engine: {e}")

    return {
        "recommended_action": action,
        "explanation": explanation
    }

def _rule_based_recommendation(
    amount: float,
    payment_method: str,
    failure_reason: str,
    recovery_probability: float,
    retry_count: int,
    customer_success_rate: float
) -> tuple:
    # Rule 1: High retry count or extremely low recovery probability
    if retry_count >= 3 or recovery_probability < 0.25:
        return (
            "Do Not Retry",
            f"Recovery probability is low ({recovery_probability:.0%}) with {retry_count} prior retries. Automated retries will incur unnecessary gateway fees."
        )

    # Rule 2: High Amount with decline/auth failure -> Contact Customer
    if amount >= 1000.0 and (failure_reason in ["Bank Decline", "Authentication Failed"] or retry_count >= 2):
        return (
            "Contact Customer",
            f"High-value transaction (${amount:,.2f}) failed due to {failure_reason}. Direct account executive outreach is recommended to preserve revenue."
        )

    # Rule 3: Temporary technical/network timeout with high probability -> Immediate Retry
    if failure_reason == "Network Timeout" and recovery_probability >= 0.65:
        return (
            "Retry Payment",
            f"Failure due to transient network congestion. Customer success rate is strong ({customer_success_rate:.0%}). Immediate payment re-attempt recommended."
        )

    # Rule 4: Insufficient Funds -> Delay 24 Hours (allow payroll/settlement)
    if failure_reason == "Insufficient Funds":
        if recovery_probability >= 0.50:
            return (
                "Retry After 24 Hours",
                f"Insufficient funds detected. Delaying retry by 24 hours aligns with typical bank account replenishment cycles."
            )
        else:
            return (
                "Send Payment Reminder",
                f"Low liquidity probability. Sending an automated payment reminder gives customer time to deposit funds prior to retry."
            )

    # Rule 5: Expired Card or Auth Error -> Send Payment Reminder
    if failure_reason == "Expired Card" or failure_reason == "Authentication Failed":
        return (
            "Send Payment Reminder",
            f"Payment method requires updated credentials ({failure_reason}). Prompt customer via email/SMS to update billing details."
        )

    # Rule 6: High probability fallback
    if recovery_probability >= 0.70:
        return (
            "Retry Payment",
            f"Model predicts high recovery rate ({recovery_probability:.0%}). Automated payment retry has a strong likelihood of success."
        )

    # Default moderate fallback
    return (
        "Send Payment Reminder",
        f"Moderate recovery likelihood ({recovery_probability:.0%}). Requesting customer verification before next automated collection attempt."
    )

def _call_openai_recommendation(amount, payment_method, failure_reason, recovery_probability, retry_count, customer_success_rate):
    headers = {
        "Authorization": f"Bearer {OPENAI_API_KEY}",
        "Content-Type": "application/json"
    }
    prompt = f"""
    You are an AI Payment Revenue Recovery Engine.
    Analyze transaction:
    - Amount: ${amount}
    - Payment Method: {payment_method}
    - Failure Reason: {failure_reason}
    - Recovery Probability: {recovery_probability:.2f}
    - Prior Retries: {retry_count}
    - Customer Success Rate: {customer_success_rate:.2f}

    Select EXACTLY one action from: ['Retry Payment', 'Retry After 24 Hours', 'Send Payment Reminder', 'Contact Customer', 'Do Not Retry'].
    Return JSON format with keys 'action' and 'explanation' (1-2 concise sentences).
    """
    data = {
        "model": "gpt-3.5-turbo",
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0.2,
        "response_format": {"type": "json_object"}
    }
    response = requests.post("https://api.openai.com/v1/chat/completions", headers=headers, json=data, timeout=5)
    if response.status_code == 200:
        import json
        content = json.loads(response.json()["choices"][0]["message"]["content"])
        return {
            "recommended_action": content.get("action", "Retry Payment"),
            "explanation": content.get("explanation", "")
        }
    return None
