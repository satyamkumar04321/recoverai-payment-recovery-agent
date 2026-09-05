import React, { useState } from 'react';
import type { PredictionOutput, RecommendationOutput } from '../services/api';
import { predictRecovery, recommendAction } from '../services/api';
import { PriorityBadge } from '../components/PriorityBadge';
import { Cpu, Bot, Sparkles, RefreshCw } from 'lucide-react';

export const SimulatorView: React.FC = () => {
  const [amount, setAmount] = useState<number>(350.0);
  const [paymentMethod, setPaymentMethod] = useState<string>('Credit Card');
  const [failureReason, setFailureReason] = useState<string>('Network Timeout');
  const [prevTxns, setPrevTxns] = useState<number>(30);
  const [prevSuccess, setPrevSuccess] = useState<number>(27);
  const [retryCount, setRetryCount] = useState<number>(0);

  const [loading, setLoading] = useState<boolean>(false);
  const [prediction, setPrediction] = useState<PredictionOutput | null>(null);
  const [recommendation, setRecommendation] = useState<RecommendationOutput | null>(null);

  const handleRunSimulator = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const successRate = prevTxns > 0 ? prevSuccess / prevTxns : 0.8;
      const prevFailed = Math.max(0, prevTxns - prevSuccess);

      const pred = await predictRecovery({
        amount: Number(amount),
        payment_method: paymentMethod,
        failure_reason: failureReason,
        previous_transactions: Number(prevTxns),
        previous_successful_payments: Number(prevSuccess),
        previous_failed_payments: prevFailed,
        retry_count: Number(retryCount),
        customer_success_rate: successRate
      });

      setPrediction(pred);

      const rec = await recommendAction({
        amount: Number(amount),
        payment_method: paymentMethod,
        failure_reason: failureReason,
        recovery_probability: pred.recovery_probability,
        retry_count: Number(retryCount),
        customer_success_rate: successRate
      });

      setRecommendation(rec);
    } catch (err) {
      console.error('Simulator error:', err);
      alert('Error running ML simulation.');
    } finally {
      setLoading(false);
    }
  };

  const paymentMethods = ['Credit Card', 'Debit Card', 'UPI', 'ACH Direct Debit', 'Digital Wallet'];
  const failureReasons = ['Insufficient Funds', 'Expired Card', 'Network Timeout', 'Authentication Failed', 'Bank Decline'];

  return (
    <div className="space-y-6 animate-fadeIn max-w-5xl mx-auto">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          <Cpu className="w-6 h-6 text-blue-400" />
          ML Recovery Model Playground
        </h1>
        <p className="text-xs text-slate-400">Test live Random Forest probability predictions and rule-based AI recovery recommendations</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Input Form Column */}
        <form onSubmit={handleRunSimulator} className="lg:col-span-6 p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4 shadow-xl">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-2">Transaction Attributes</h2>

          <div>
            <label className="text-xs font-medium text-slate-300 block mb-1">Transaction Amount ($)</label>
            <input
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-white focus:border-blue-500 focus:outline-none"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">Payment Method</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-white focus:border-blue-500 focus:outline-none"
              >
                {paymentMethods.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">Failure Reason</label>
              <select
                value={failureReason}
                onChange={(e) => setFailureReason(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-white focus:border-blue-500 focus:outline-none"
              >
                {failureReasons.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">Total History</label>
              <input
                type="number"
                value={prevTxns}
                onChange={(e) => setPrevTxns(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-white focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">Successful</label>
              <input
                type="number"
                value={prevSuccess}
                onChange={(e) => setPrevSuccess(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-white focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">Prior Retries</label>
              <input
                type="number"
                min="0"
                max="5"
                value={retryCount}
                onChange={(e) => setRetryCount(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-white focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-lg shadow-blue-500/25 transition flex items-center justify-center gap-2 mt-4"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            Predict & Recommend Action
          </button>
        </form>

        {/* Prediction Results Output */}
        <div className="lg:col-span-6 space-y-4">
          {prediction && recommendation ? (
            <div className="p-6 rounded-2xl bg-slate-900/90 border border-blue-500/30 space-y-5 shadow-2xl animate-fadeIn">
              
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Inference Results</span>
                <PriorityBadge priority={prediction.priority} />
              </div>

              {/* Score Bar */}
              <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300 font-semibold">Predicted Recovery Probability</span>
                  <span className="text-xl font-extrabold text-white">
                    {Math.round(prediction.recovery_probability * 100)}%
                  </span>
                </div>
                <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-700 ${
                      prediction.recovery_probability >= 0.70 ? 'bg-emerald-500' : prediction.recovery_probability >= 0.45 ? 'bg-amber-500' : 'bg-rose-500'
                    }`}
                    style={{ width: `${Math.round(prediction.recovery_probability * 100)}%` }}
                  />
                </div>
                <div className="text-[10px] text-slate-400 mt-1">
                  Status: {prediction.is_recoverable ? <span className="text-emerald-400 font-bold">Recoverable</span> : <span className="text-rose-400 font-bold">Low Recovery Prospect</span>}
                </div>
              </div>

              {/* Recommendation Card */}
              <div className="p-5 rounded-xl bg-slate-950 border border-indigo-500/30 space-y-2">
                <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-wider">
                  <Bot className="w-4 h-4" /> Recommended Action
                </div>
                <h3 className="text-lg font-extrabold text-white">{recommendation.recommended_action}</h3>
                <p className="text-xs text-slate-300 leading-relaxed bg-slate-900 p-3 rounded-lg border border-slate-800">
                  {recommendation.explanation}
                </p>
              </div>

            </div>
          ) : (
            <div className="h-full p-8 rounded-2xl bg-slate-900/40 border border-dashed border-slate-800 flex flex-col items-center justify-center text-center gap-3 min-h-[300px]">
              <Cpu className="w-10 h-10 text-slate-600" />
              <div>
                <p className="text-sm font-semibold text-slate-300">Run Model Simulation</p>
                <p className="text-xs text-slate-500 mt-1">Adjust parameters on the left and click "Predict" to see real-time Scikit-Learn inference results.</p>
              </div>
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
