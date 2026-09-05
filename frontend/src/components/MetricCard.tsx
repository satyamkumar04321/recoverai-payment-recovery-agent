import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  subtext?: string;
  theme?: 'blue' | 'rose' | 'emerald' | 'violet' | 'amber';
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  icon: Icon,
  subtext,
  theme = 'blue'
}) => {
  const themeMap = {
    blue: {
      border: 'border-blue-500/20 hover:border-blue-500/40',
      iconBg: 'bg-blue-500/10 text-blue-400',
      glow: 'from-blue-500/5 to-transparent'
    },
    rose: {
      border: 'border-rose-500/20 hover:border-rose-500/40',
      iconBg: 'bg-rose-500/10 text-rose-400',
      glow: 'from-rose-500/5 to-transparent'
    },
    emerald: {
      border: 'border-emerald-500/20 hover:border-emerald-500/40',
      iconBg: 'bg-emerald-500/10 text-emerald-400',
      glow: 'from-emerald-500/5 to-transparent'
    },
    violet: {
      border: 'border-violet-500/20 hover:border-violet-500/40',
      iconBg: 'bg-violet-500/10 text-violet-400',
      glow: 'from-violet-500/5 to-transparent'
    },
    amber: {
      border: 'border-amber-500/20 hover:border-amber-500/40',
      iconBg: 'bg-amber-500/10 text-amber-400',
      glow: 'from-amber-500/5 to-transparent'
    }
  };

  const t = themeMap[theme];

  return (
    <div className={`relative overflow-hidden rounded-xl bg-slate-900/80 backdrop-blur-md border ${t.border} p-5 transition-all duration-300 hover:-translate-y-1 shadow-lg`}>
      <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl ${t.glow} rounded-full blur-2xl pointer-events-none`} />
      
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-400">{title}</span>
        <div className={`p-2.5 rounded-lg ${t.iconBg}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      <div className="mt-3">
        <h3 className="text-2xl font-bold text-white tracking-tight">{value}</h3>
        {subtext && (
          <p className="mt-1 text-xs text-slate-400 flex items-center gap-1">
            {subtext}
          </p>
        )}
      </div>
    </div>
  );
};
