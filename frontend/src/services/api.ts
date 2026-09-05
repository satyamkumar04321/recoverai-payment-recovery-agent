const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export interface DashboardStats {
  total_transactions: number;
  failed_payments: number;
  failed_revenue: number;
  recoverable_revenue: number;
  recovered_revenue: number;
  recovery_rate: number;
}

export interface Transaction {
  id: number;
  transaction_id: string;
  customer_id: string;
  customer_name: string;
  amount: number;
  payment_method: string;
  failure_reason: string;
  previous_transactions: number;
  previous_successful_payments: number;
  previous_failed_payments: number;
  customer_success_rate: number;
  retry_count: number;
  recovery_probability: number;
  priority: 'High' | 'Medium' | 'Low';
  recommended_action: string;
  recommendation_reason: string;
  status: 'Failed' | 'Recovered' | 'Pending' | 'Unrecoverable';
  created_at?: string;
}

export interface PredictionInput {
  amount: number;
  payment_method: string;
  failure_reason: string;
  previous_transactions: number;
  previous_successful_payments: number;
  previous_failed_payments: number;
  retry_count: number;
  customer_success_rate?: number;
}

export interface PredictionOutput {
  recovery_probability: number;
  is_recoverable: boolean;
  priority: 'High' | 'Medium' | 'Low';
}

export interface RecommendationInput {
  amount: number;
  payment_method: string;
  failure_reason: string;
  recovery_probability: number;
  retry_count: number;
  customer_success_rate: number;
}

export interface RecommendationOutput {
  recommended_action: string;
  explanation: string;
}

export async function fetchDashboardStats(): Promise<DashboardStats> {
  const res = await fetch(`${API_BASE_URL}/api/dashboard`);
  if (!res.ok) throw new Error('Failed to fetch dashboard statistics');
  return res.json();
}

export async function fetchTransactions(
  status?: string,
  failure_reason?: string,
  search?: string
): Promise<Transaction[]> {
  const params = new URLSearchParams();
  if (status && status !== 'All') params.append('status', status);
  if (failure_reason && failure_reason !== 'All') params.append('failure_reason', failure_reason);
  if (search && search.trim() !== '') params.append('search', search.trim());

  const url = `${API_BASE_URL}/api/transactions${params.toString() ? '?' + params.toString() : ''}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch transactions');
  return res.json();
}

export async function fetchTransactionById(id: string | number): Promise<Transaction> {
  const res = await fetch(`${API_BASE_URL}/api/transactions/${id}`);
  if (!res.ok) throw new Error(`Transaction ${id} not found`);
  return res.json();
}

export async function predictRecovery(payload: PredictionInput): Promise<PredictionOutput> {
  const res = await fetch(`${API_BASE_URL}/api/predict`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to generate ML prediction');
  return res.json();
}

export async function recommendAction(payload: RecommendationInput): Promise<RecommendationOutput> {
  const res = await fetch(`${API_BASE_URL}/api/recommend`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to generate recommendation');
  return res.json();
}

export async function executeTransactionAction(id: string | number, action: string): Promise<Transaction> {
  const res = await fetch(`${API_BASE_URL}/api/transactions/${id}/action`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action }),
  });
  if (!res.ok) throw new Error('Failed to execute action on transaction');
  return res.json();
}
