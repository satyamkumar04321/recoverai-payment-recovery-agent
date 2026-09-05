import React, { useEffect, useState } from 'react';
import type { DashboardStats, Transaction } from '../services/api';
import { fetchDashboardStats, fetchTransactions } from '../services/api';
import { MetricCard } from '../components/MetricCard';
import { PriorityBadge } from '../components/PriorityBadge';
import { 
  CreditCard, 
  AlertOctagon, 
  DollarSign, 
  TrendingUp, 
  ArrowUpRight, 
  CheckCircle2, 
  Bot, 
  RefreshCw,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';

interface DashboardViewProps {
  onSelectTransaction: (txn: Transaction) => void;
  onNavigateToQueue: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onSelectTransaction, onNavigateToQueue }) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [highPriorityTxns, setHighPriorityTxns] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const [sData, tData] = await Promise.all([
        fetchDashboardStats(),
        fetchTransactions('Failed')
      ]);
      setStats(sData);
      
      // Top high priority failed transactions with recovery_probability >= 0.50
      const sorted = tData
        .filter(t => t.recovery_probability >= 0.50)
        .sort((a, b) => (b.amount * b.recovery_probability) - (a.amount * a.recovery_probability))
        .slice(0, 5);
        
      setHighPriorityTxns(sorted);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading || !stats) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
        <p className="text-sm text-slate-400">Syncing live revenue recovery metrics...</p>
      </div>
    );
  }

  const formatCurrency = (amt: number) => `$${amt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="space-y-8 animate-fadeIn">
      
      {/* Top Welcome Banner & CTA */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-900/40 via-indigo-900/30 to-slate-900 border border-blue-500/20 p-6 sm:p-8">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-xs font-semibold text-blue-400">
              <Bot className="w-3.5 h-3.5" />
              Automated Revenue Recovery Active
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Payment Recovery Dashboard
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
              Identify failed payment transactions, predict recovery likelihood with Scikit-Learn Random Forest, and execute AI-recommended recovery actions in real-time.
            </p>
          </div>

          <button
            onClick={onNavigateToQueue}
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-xl shadow-blue-500/25 transition hover:scale-105 whitespace-nowrap"
          >
            Open Recovery Queue ({highPriorityTxns.length})
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 6 Key Main Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <MetricCard
          title="Total Transactions"
          value={stats.total_transactions.toLocaleString()}
          icon={CreditCard}
          subtext="Seeded historical pool"
          theme="blue"
        />
        <MetricCard
          title="Failed Payments"
          value={stats.failed_payments.toLocaleString()}
          icon={AlertOctagon}
          subtext="Requires intervention"
          theme="rose"
        />
        <MetricCard
          title="Failed Revenue"
          value={formatCurrency(stats.failed_revenue)}
          icon={DollarSign}
          subtext="Gross uncollected revenue"
          theme="rose"
        />
        <MetricCard
          title="Recoverable Revenue"
          value={formatCurrency(stats.recoverable_revenue)}
          icon={TrendingUp}
          subtext="Predicted high recovery rate"
          theme="amber"
        />
        <MetricCard
          title="Recovered Revenue"
          value={formatCurrency(stats.recovered_revenue)}
          icon={CheckCircle2}
          subtext="Successfully recaptured"
          theme="emerald"
        />
        <MetricCard
          title="Recovery Rate"
          value={`${stats.recovery_rate}%`}
          icon={ArrowUpRight}
          subtext="Overall efficiency score"
          theme="violet"
        />
      </div>

      {/* High Potential Recovery Queue Preview */}
      <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-6 space-y-4 shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-blue-400" />
              High Opportunity Recovery Queue
            </h2>
            <p className="text-xs text-slate-400">Failed transactions with highest predicted recovery probability and recoverable value</p>
          </div>

          <button
            onClick={onNavigateToQueue}
            className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1"
          >
            View All ({stats.failed_payments}) <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="text-xs font-semibold uppercase bg-slate-950/60 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-4 py-3">Transaction ID</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Failure Reason</th>
                <th className="px-4 py-3">Recovery Prob.</th>
                <th className="px-4 py-3">Priority</th>
                <th className="px-4 py-3">Recommended Action</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {highPriorityTxns.map((txn) => {
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
                    <td className="px-4 py-3 text-xs text-slate-300">{txn.failure_reason}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${prob >= 70 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                            style={{ width: `${prob}%` }}
                          />
                        </div>
                        <span className="font-bold text-xs text-white">{prob}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <PriorityBadge priority={txn.priority} />
                    </td>
                    <td className="px-4 py-3 text-xs font-medium text-indigo-300">{txn.recommended_action}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectTransaction(txn);
                        }}
                        className="px-3 py-1 text-xs font-semibold bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded-lg hover:bg-blue-600 hover:text-white transition"
                      >
                        Inspect & Recover
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
