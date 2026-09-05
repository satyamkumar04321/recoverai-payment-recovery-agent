import React, { useEffect, useState } from 'react';
import type { Transaction } from '../services/api';
import { fetchTransactions } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import { PriorityBadge } from '../components/PriorityBadge';
import { Search, RefreshCw, Eye } from 'lucide-react';

interface TransactionsViewProps {
  onSelectTransaction: (txn: Transaction) => void;
}

export const TransactionsView: React.FC<TransactionsViewProps> = ({ onSelectTransaction }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [statusFilter, setStatusFilter] = useState('All');
  const [reasonFilter, setReasonFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await fetchTransactions(statusFilter, reasonFilter, searchQuery);
      setTransactions(data);
    } catch (err) {
      console.error('Failed to load transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter, reasonFilter, searchQuery]);

  const failureReasons = [
    'All',
    'Insufficient Funds',
    'Expired Card',
    'Network Timeout',
    'Authentication Failed',
    'Bank Decline'
  ];

  const statuses = ['All', 'Failed', 'Recovered', 'Pending', 'Unrecoverable'];

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Transactions Directory</h1>
          <p className="text-xs text-slate-400">Search and filter transaction logs with Random Forest recovery predictions</p>
        </div>
        <div className="text-xs text-slate-400 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800 self-start sm:self-auto">
          Showing <strong className="text-white">{transactions.length}</strong> transactions
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col md:flex-row items-center gap-4">
        {/* Search Query Input */}
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by customer name or transaction ID (e.g. TXN-10025)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
          />
        </div>

        {/* Status Dropdown */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <span className="text-xs text-slate-400 whitespace-nowrap">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full md:w-40 px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-blue-500"
          >
            {statuses.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        {/* Failure Reason Dropdown */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <span className="text-xs text-slate-400 whitespace-nowrap">Reason:</span>
          <select
            value={reasonFilter}
            onChange={(e) => setReasonFilter(e.target.value)}
            className="w-full md:w-48 px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-blue-500"
          >
            {failureReasons.map(r => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="rounded-xl bg-slate-900/80 border border-slate-800 overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-12 text-center text-slate-400 flex flex-col items-center gap-3">
            <RefreshCw className="w-6 h-6 animate-spin text-blue-500" />
            <span className="text-xs">Loading transaction records...</span>
          </div>
        ) : transactions.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <p className="text-sm font-semibold">No matching transactions found.</p>
            <p className="text-xs text-slate-500 mt-1">Try resetting search filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="text-xs font-semibold uppercase bg-slate-950/80 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3.5">Transaction ID</th>
                  <th className="px-4 py-3.5">Customer</th>
                  <th className="px-4 py-3.5">Amount</th>
                  <th className="px-4 py-3.5">Method</th>
                  <th className="px-4 py-3.5">Failure Reason</th>
                  <th className="px-4 py-3.5">Recovery Prob.</th>
                  <th className="px-4 py-3.5">Priority</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {transactions.map((txn) => {
                  const prob = Math.round(txn.recovery_probability * 100);
                  return (
                    <tr
                      key={txn.id}
                      className="hover:bg-slate-800/40 transition cursor-pointer"
                      onClick={() => onSelectTransaction(txn)}
                    >
                      <td className="px-4 py-3 font-mono text-xs font-bold text-white">{txn.transaction_id}</td>
                      <td className="px-4 py-3 font-medium text-slate-200">{txn.customer_name}</td>
                      <td className="px-4 py-3 font-bold text-blue-400">${txn.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                      <td className="px-4 py-3 text-xs text-slate-400">{txn.payment_method}</td>
                      <td className="px-4 py-3 text-xs text-slate-300">{txn.failure_reason}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-14 h-2 bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${prob >= 70 ? 'bg-emerald-500' : prob >= 45 ? 'bg-amber-500' : 'bg-rose-500'}`}
                              style={{ width: `${prob}%` }}
                            />
                          </div>
                          <span className="font-bold text-xs text-white">{prob}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <PriorityBadge priority={txn.priority} />
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={txn.status} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectTransaction(txn);
                          }}
                          className="p-1.5 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition"
                        >
                          <Eye className="w-4 h-4" />
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
