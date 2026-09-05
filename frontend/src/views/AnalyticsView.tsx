import React, { useEffect, useState } from 'react';
import type { Transaction } from '../services/api';
import { fetchTransactions } from '../services/api';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { BarChart3, PieChart as PieIcon, RefreshCw, Activity, DollarSign } from 'lucide-react';

export const AnalyticsView: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await fetchTransactions('All');
      setTransactions(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
        <p className="text-sm text-slate-400">Processing analytical distributions...</p>
      </div>
    );
  }

  // 1. Failed payments by failure reason
  const failureReasonMap: Record<string, number> = {};
  const reasonProbSumMap: Record<string, number> = {};

  transactions.forEach(t => {
    failureReasonMap[t.failure_reason] = (failureReasonMap[t.failure_reason] || 0) + 1;
    reasonProbSumMap[t.failure_reason] = (reasonProbSumMap[t.failure_reason] || 0) + t.recovery_probability;
  });

  const failureReasonData = Object.keys(failureReasonMap).map(reason => ({
    name: reason,
    count: failureReasonMap[reason],
    avgProb: Math.round((reasonProbSumMap[reason] / failureReasonMap[reason]) * 100)
  }));

  // 2. Revenue breakdown (Recovered vs Recoverable vs Lost)
  const recoveredAmt = transactions.filter(t => t.status === 'Recovered').reduce((acc, t) => acc + t.amount, 0);
  const recoverableAmt = transactions.filter(t => t.status === 'Failed' && t.recovery_probability >= 0.50).reduce((acc, t) => acc + t.amount, 0);
  const unrecoverableAmt = transactions.filter(t => t.status === 'Unrecoverable' || (t.status === 'Failed' && t.recovery_probability < 0.50)).reduce((acc, t) => acc + t.amount, 0);

  const revenuePieData = [
    { name: 'Recovered Revenue', value: Math.round(recoveredAmt), color: '#10b981' },
    { name: 'Recoverable Revenue', value: Math.round(recoverableAmt), color: '#3b82f6' },
    { name: 'Unrecoverable / Lost', value: Math.round(unrecoverableAmt), color: '#f43f5e' },
  ];

  // 3. Recovery Probability Distribution Histogram
  const probBins = [
    { range: '0-20%', count: 0 },
    { range: '20-40%', count: 0 },
    { range: '40-60%', count: 0 },
    { range: '60-80%', count: 0 },
    { range: '80-100%', count: 0 },
  ];

  transactions.forEach(t => {
    const p = t.recovery_probability * 100;
    if (p < 20) probBins[0].count++;
    else if (p < 40) probBins[1].count++;
    else if (p < 60) probBins[2].count++;
    else if (p < 80) probBins[3].count++;
    else probBins[4].count++;
  });

  return (
    <div className="space-y-8 animate-fadeIn">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Recovery Analytics</h1>
        <p className="text-xs text-slate-400">Visualizing payment failure metrics, ML scoring distributions, and revenue streams</p>
      </div>

      {/* Grid of Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Chart 1: Failure Reason Breakdown */}
        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4 shadow-xl">
          <div className="flex items-center gap-2 text-sm font-bold text-white">
            <BarChart3 className="w-5 h-5 text-blue-400" />
            Failed Payments by Failure Reason
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={failureReasonData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 10 }} angle={-15} textAnchor="end" />
                <YAxis stroke="#94a3b8" tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
                <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Total Transactions" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Revenue Distribution Pie */}
        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4 shadow-xl">
          <div className="flex items-center gap-2 text-sm font-bold text-white">
            <PieIcon className="w-5 h-5 text-emerald-400" />
            Revenue Recovery Breakdown
          </div>
          <div className="h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={revenuePieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {revenuePieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val) => `$${Number(val || 0).toLocaleString()}`}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', color: '#cbd5e1' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Recovery Probability Distribution */}
        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4 shadow-xl">
          <div className="flex items-center gap-2 text-sm font-bold text-white">
            <Activity className="w-5 h-5 text-violet-400" />
            Recovery Probability Distribution Histogram
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={probBins} margin={{ top: 10, right: 10, left: -20, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="range" stroke="#94a3b8" tick={{ fontSize: 11 }} />
                <YAxis stroke="#94a3b8" tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
                <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Transaction Count" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 4: Average Recovery Probability per Failure Reason */}
        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4 shadow-xl">
          <div className="flex items-center gap-2 text-sm font-bold text-white">
            <DollarSign className="w-5 h-5 text-amber-400" />
            Average Recovery Probability by Reason (%)
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={failureReasonData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 10 }} angle={-15} textAnchor="end" />
                <YAxis stroke="#94a3b8" tick={{ fontSize: 11 }} domain={[0, 100]} />
                <Tooltip
                  formatter={(val) => `${val}%`}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
                <Bar dataKey="avgProb" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Avg Recovery Prob %" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

    </div>
  );
};
