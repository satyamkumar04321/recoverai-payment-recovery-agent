import React, { useState } from 'react';
import type { Transaction } from '../services/api';
import { executeTransactionAction } from '../services/api';
import { StatusBadge } from './StatusBadge';
import { PriorityBadge } from './PriorityBadge';
import { X, Bot, RefreshCw, CheckCircle2, Activity } from 'lucide-react';

interface ModalProps {
  transaction: Transaction | null;
  onClose: () => void;
  onActionSuccess: (updated: Transaction) => void;
}

export const TransactionDetailModal: React.FC<ModalProps> = ({
  transaction,
  onClose,
  onActionSuccess
}) => {
  const [loading, setLoading] = useState(false);

  if (!transaction) return null;

  const handleExecuteAction = async (actionType: string) => {
    try {
      setLoading(true);
      const updated = await executeTransactionAction(transaction.id, actionType);
      onActionSuccess(updated);
    } catch (err) {
      console.error(err);
      alert('Failed to execute recovery action.');
    } finally {
      setLoading(false);
    }
  };

  const probPercent = Math.round(transaction.recovery_probability * 100);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden text-slate-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Transaction {transaction.transaction_id}
              </h2>
              <p className="text-xs text-slate-400">Created: {transaction.created_at || 'Recent'}</p>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">

          {/* Core Info Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <div>
              <span className="text-xs text-slate-400">Customer</span>
              <p className="font-semibold text-white text-sm truncate">{transaction.customer_name}</p>
            </div>
            <div>
              <span className="text-xs text-slate-400">Amount</span>
              <p className="font-bold text-blue-400 text-sm">${transaction.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
            </div>
            <div>
              <span className="text-xs text-slate-400">Method</span>
              <p className="font-medium text-slate-200 text-sm">{transaction.payment_method}</p>
            </div>
            <div>
              <span className="text-xs text-slate-400">Status</span>
              <div className="mt-0.5">
                <StatusBadge status={transaction.status} />
              </div>
            </div>
          </div>

          {/* ML Recovery Score */}
          <div className="p-5 rounded-xl bg-gradient-to-r from-blue-950/30 to-indigo-950/30 border border-blue-500/20">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                <Bot className="w-4 h-4 text-blue-400" />
                Random Forest ML Recovery Score
              </span>
              <PriorityBadge priority={transaction.priority} />
            </div>

            <div className="flex items-center gap-4 mt-3">
              <div className="flex-1">
                <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      probPercent >= 70 ? 'bg-emerald-500' : probPercent >= 45 ? 'bg-amber-500' : 'bg-rose-500'
                    }`}
                    style={{ width: `${probPercent}%` }}
                  />
                </div>
              </div>
              <span className="text-2xl font-black text-white">{probPercent}%</span>
            </div>

            <div className="mt-2 text-xs text-slate-400 flex justify-between">
              <span>Failure Reason: <strong className="text-slate-200">{transaction.failure_reason}</strong></span>
              <span>Prior Retries: <strong className="text-slate-200">{transaction.retry_count}</strong></span>
            </div>
          </div>

          {/* AI Recommendation Engine Box */}
          <div className="p-5 rounded-xl bg-slate-950 border border-indigo-500/30 space-y-3">
            <div className="flex items-center gap-2 text-indigo-400 font-semibold text-sm">
              <Bot className="w-4 h-4" />
              Recommended Recovery Action
            </div>

            <div className="flex items-center justify-between bg-slate-900 p-3 rounded-lg border border-slate-800">
              <span className="font-bold text-white text-base">{transaction.recommended_action}</span>
              <span className="text-xs bg-indigo-500/20 text-indigo-300 px-3 py-1 rounded-md border border-indigo-500/30">
                Optimal Choice
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/60 p-3 rounded-lg border border-slate-800/50">
              {transaction.recommendation_reason || "Based on Random Forest failure scoring and historical payment behavior."}
            </p>
          </div>

          {/* Customer Historical Features */}
          <div>
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Customer Behavioral History</h4>
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-center">
                <span className="text-xs text-slate-400">Total Txns</span>
                <p className="text-base font-bold text-slate-200">{transaction.previous_transactions}</p>
              </div>
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-center">
                <span className="text-xs text-slate-400">Successful</span>
                <p className="text-base font-bold text-emerald-400">{transaction.previous_successful_payments}</p>
              </div>
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-center">
                <span className="text-xs text-slate-400">Success Rate</span>
                <p className="text-base font-bold text-blue-400">{Math.round(transaction.customer_success_rate * 100)}%</p>
              </div>
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-800 bg-slate-900/80">
          <button
            onClick={() => handleExecuteAction('mark_unrecoverable')}
            disabled={loading || transaction.status === 'Unrecoverable'}
            className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-rose-400 bg-slate-800 hover:bg-slate-700 rounded-lg transition disabled:opacity-50"
          >
            Mark Unrecoverable
          </button>

          <button
            onClick={() => handleExecuteAction('execute_retry')}
            disabled={loading || transaction.status === 'Recovered'}
            className="flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-lg shadow-blue-500/20 transition disabled:opacity-50"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            {transaction.status === 'Recovered' ? 'Already Recovered' : `Execute (${transaction.recommended_action})`}
          </button>
        </div>

      </div>
    </div>
  );
};
