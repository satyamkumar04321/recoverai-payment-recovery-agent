# RecoverAI – AI-Powered Payment Revenue Recovery Agent

[![Python](https://img.shields.io/badge/Python-3.11+-blue.svg)](https://python.org)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-green.svg)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/Frontend-React%20%2B%20TypeScript-61dafb.svg)](https://reactjs.org)
[![Tailwind CSS](https://img.shields.io/badge/Styling-Tailwind%20v4-38bdf8.svg)](https://tailwindcss.com)
[![ML](https://img.shields.io/badge/ML-Scikit--Learn%20Random%20Forest-orange.svg)](https://scikit-learn.org)

> **Disclaimer**: This is an independent open-source fintech portfolio project built to showcase AI revenue recovery capabilities. It is **not** affiliated with, endorsed by, or an official product of Razorpay or any commercial payment gateway. All data used is synthetically generated.

---

## 📌 Problem

In subscription and e-commerce platforms, payment failures (due to insufficient funds, expired cards, network timeouts, or bank declines) account for **5-15% of monthly recurring revenue (MRR) loss**.

Traditional payment gateways treat all failures uniformly—either retrying indiscriminately (incurring heavy gateway fees) or failing immediately without follow-up.

---

## 🚀 Solution

**RecoverAI** is an AI/ML fintech agent that:
1. **Scarcely analyzes transaction & customer payment history**.
2. **Predicts payment recovery probability** using a Scikit-Learn **Random Forest Classifier**.
3. **Recommends the best recovery action** (e.g., Immediate Retry, Retry after 24h, Payment Reminder, Account Executive Outreach, or Do Not Retry).
4. **Prioritizes high-opportunity failed payments** in an interactive actionable **Recovery Queue**.

---

## 🔄 Project Flow

```
Failed Payment Occurs
      │
      ▼
Analyze Transaction + Customer History
(Amount, Failure Reason, Success Rate, Retry Count)
      │
      ▼
Scikit-Learn Random Forest Classifier
      │
      ▼
Calculate Recovery Probability (0.0 to 1.0)
      │
      ▼
AI / Rule-Based Recommendation Engine
      │
      ▼
Execute Best Recovery Action & Recapture Revenue
```

---

## ✨ Main Features

1. **Fintech KPI Dashboard**: Live tracking of Total Transactions, Failed Payments, Failed Revenue, Recoverable Revenue, Recovered Revenue, and Recovery Rate %.
2. **Transactions Directory**: Search and filter transaction logs by status (`Failed`, `Recovered`, `Pending`, `Unrecoverable`) and failure reason (`Insufficient Funds`, `Expired Card`, `Network Timeout`, `Authentication Failed`, `Bank Decline`).
3. **Random Forest Recovery Prediction**: ML probability model trained on 1,000 synthetic transaction records with realistic feature weights.
4. **Intelligent Recovery Recommendation Engine**: Actionable matrix suggesting one of 5 optimal recovery strategies with clear explanations. Operates 100% offline deterministically, with optional OpenAI LLM integration.
5. **Prioritized Recovery Queue**: Automatically sorts actionable failed payments by recoverable revenue and high ML probability.
6. **Visual Analytics**: Interactive Recharts visualizations displaying failure reason breakdown, revenue pie charts, and recovery probability histograms.
7. **ML Simulator / Model Playground**: Interactive UI allowing interviewers/recruiters to test custom transaction inputs against the model in real time.

---

## 🛠️ Tech Stack

- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS v4 + Lucide Icons + Recharts
- **Backend**: Python 3.11+ + FastAPI + Uvicorn + SQLAlchemy + Pydantic
- **ML / Data**: Pandas + Scikit-Learn (Random Forest) + Joblib + NumPy
- **Database**: SQLite (`data/recoverai.db`)
- **Deployment**: Docker & Docker Compose

---

## 📊 Machine Learning Model Details

- **Algorithm**: `RandomForestClassifier(n_estimators=100, max_depth=8, random_state=42)`
- **Features Used**:
  - `amount` (float)
  - `payment_method` (encoded categorical)
  - `failure_reason` (encoded categorical)
  - `previous_transactions` (int)
  - `previous_successful_payments` (int)
  - `previous_failed_payments` (int)
  - `retry_count` (int)
  - `customer_success_rate` (float)

### Feature Importance Ranking
1. **Failure Reason**: ~22.0%
2. **Transaction Amount**: ~16.5%
3. **Customer Success Rate**: ~13.5%
4. **Previous Successful Payments**: ~11.5%
5. **Previous Transactions**: ~11.4%
6. **Retry Count**: ~10.5%

---

## 🏃 How to Run the Project

### Option A: Running with Docker Compose (Recommended)

```bash
docker-compose up --build
```
- Frontend will be available at: `http://localhost:3000`
- Backend API will be available at: `http://localhost:8000`
- OpenAPI Docs available at: `http://localhost:8000/docs`

---

### Option B: Running Locally (Manual Setup)

#### 1. Backend & ML Setup
```bash
# Navigate to backend/root
python -m venv venv
# On Windows: venv\Scripts\activate
# On Linux/macOS: source venv/bin/activate

pip install -r backend/requirements.txt

# Generate synthetic dataset (~1,000 transactions) & train ML model
python ml/generate_data.py
python ml/train.py

# Start FastAPI server
uvicorn backend.main:app --reload --port 8000
```

#### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:3000` in your browser.

---

## 📡 Example API Prediction Request

```bash
curl -X 'POST' \
  'http://localhost:8000/api/predict' \
  -H 'Content-Type: application/json' \
  -d '{
  "amount": 450.00,
  "payment_method": "Credit Card",
  "failure_reason": "Network Timeout",
  "previous_transactions": 30,
  "previous_successful_payments": 28,
  "previous_failed_payments": 2,
  "retry_count": 0,
  "customer_success_rate": 0.933
}'
```

### Example Response
```json
{
  "recovery_probability": 0.885,
  "is_recoverable": true,
  "priority": "High"
}
```

---

## ⚠️ Limitations & Future Improvements

- **Limitations**:
  - Synthetic dataset generated using probabilistic distributions.
  - SQLite database used for simplicity in portfolio demonstration.
- **Future Improvements**:
  - Integration with Webhook listeners for real payment gateways (Stripe / Razorpay webhooks).
  - Multi-armed bandit / reinforcement learning for dynamic retry timing.
  - Automated WhatsApp & SMS recovery links dispatch.

---

## 📝 License

Distributed under the MIT License.
