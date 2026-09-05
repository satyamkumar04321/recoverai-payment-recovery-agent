import React from 'react';

interface PriorityBadgeProps {
  priority: 'High' | 'Medium' | 'Low' | string;
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({ priority }) => {
  let styles = 'bg-gray-800 text-gray-300 border-gray-700';
  
  if (priority === 'High') {
    styles = 'bg-rose-500/10 text-rose-400 border-rose-500/30';
  } else if (priority === 'Medium') {
    styles = 'bg-amber-500/10 text-amber-400 border-amber-500/30';
  } else if (priority === 'Low') {
    styles = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${styles}`}>
      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
        priority === 'High' ? 'bg-rose-400 animate-pulse' : priority === 'Medium' ? 'bg-amber-400' : 'bg-emerald-400'
      }`} />
      {priority}
    </span>
  );
};
