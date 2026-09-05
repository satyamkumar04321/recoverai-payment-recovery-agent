import React, { useEffect, useState } from 'react';
import type { Transaction } from '../services/api';
import { fetchTransactions } from '../services/api';
import { PriorityBadge } from '../components/PriorityBadge';
import { Zap, Bot, RefreshCw } from 'lucide-react';

interface QueueViewProps {
  onSelectTransaction: (txn: Transaction) => void;
}

export const RecoveryQueueView: React.FC<QueueViewProps> = ({ onSelectTransaction }) => {
  const [queueItems, setQueueItems] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const loadQueue = async () => {
    try {
      setLoading(true);
      const data = await fetchTransactions('Failed');
      
      // Sort failed items by High Priority first, then by recoverable value (amount * probability)
      const sorted = data.sort((a, b) => {
        const priorityScore: Record<string, number> = { 'High': 3, 'Medium': 2, 'Low': 1 };
        const pDiff = (priorityScore[b.priority] || 0) - (priorityScore[a.priority] || 0);
        if (pDiff !== 0) return pDiff;
        return (b.amount * b.recovery_probability) - (a.amount * a.recovery_probability);
      });

      setQueueItems(sorted);
    } catch (err) {
      console.error('Error fetching recovery queue:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQueue();
  }, []);

  const totalPotentialRevenue = queueItems
    .filter(t => t.recovery_probability >= 0.50)
    .reduce((acc, t) => acc + t.amount, 0);

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* Potential Recoverable Revenue Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-emerald-950/50 via-slate-900 to-slate-900 border border-emerald-500/30 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
            <Zap className="w-4 h-4 fill-emerald-400" />
            AI Actionable Queue
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">Recovery Queue</h1>
          <p className="text-xs text-slate-400">High-priority failed payments sorted by machine learning recovery potential</p>
        </div>

        <div className="px-5 py-3 rounded-xl bg-slate-950 border border-emerald-500/20 text-right">
          <span className="text-xs font-medium text-slate-400 block">Total Potential Recoverable Revenue</span>
          <span className="text-2xl font-black text-emerald-400">
            ${totalPotentialRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      {/* Queue Items Table */}
      <div className="rounded-xl bg-slate-900/80 border border-slate-800 overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-12 text-center text-slate-400 flex flex-col items-center gap-3">
            <RefreshCw className="w-6 h-6 animate-spin text-emerald-500" />
            <span className="text-xs">Computing priority queue rankings...</span>
          </div>
        ) : queueItems.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <p className="text-sm font-semibold">No pending failed payments in queue!</p>
            <p className="text-xs text-slate-500 mt-1">All failed transactions have been processed.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="text-xs font-semibold uppercase bg-slate-950/80 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3.5">Customer</th>
                  <th className="px-4 py-3.5">Amount</th>
                  <th className="px-4 py-3.5">Failure Reason</th>
                  <th className="px-4 py-3.5">Recovery Prob.</th>
                  <th className="px-4 py-3.5">Priority</th>
                  <th className="px-4 py-3.5">Recommended Action</th>
                  <th className="px-4 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {queueItems.map((txn) => {
                  const prob = Math.round(txn.recovery_probability * 100);
                  return (
                    <tr
                      key={txn.id}
                      className="hover:bg-slate-800/40 transition cursor-pointer"
                      onClick={() => onSelectTransaction(txn)}
                    >
                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-white">{txn.customer_name}</div>
                        <div className="text-[10px] font-mono text-slate-400">{txn.transaction_id}</div>
                      </td>
                      <td className="px-4 py-3.5 font-bold text-emerald-400">${txn.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                      <td className="px-4 py-3.5 text-xs text-slate-300">{txn.failure_reason}</td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${prob >= 70 ? 'bg-emerald-500' : prob >= 45 ? 'bg-amber-500' : 'bg-rose-500'}`}
                              style={{ width: `${prob}%` }}
                            />
                          </div>
                          <span className="font-bold text-xs text-white">{prob}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <PriorityBadge priority={txn.priority} />
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-xs text-indigo-300 flex items-center gap-1.5">
                          <Bot className="w-3.5 h-3.5 text-indigo-400" />
                          {txn.recommended_action}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectTransaction(txn);
                          }}
                          className="px-3.5 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-md shadow-emerald-600/20 transition flex items-center gap-1 ml-auto"
                        >
                          <Zap className="w-3.5 h-3.5" /> Execute
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};
