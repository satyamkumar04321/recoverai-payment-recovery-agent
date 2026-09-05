import React from 'react';

interface StatusBadgeProps {
  status: 'Failed' | 'Recovered' | 'Pending' | 'Unrecoverable' | string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  let styles = 'bg-gray-800 text-gray-300 border-gray-700';

  if (status === 'Recovered') {
    styles = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
  } else if (status === 'Failed') {
    styles = 'bg-rose-500/10 text-rose-400 border-rose-500/30';
  } else if (status === 'Pending') {
    styles = 'bg-blue-500/10 text-blue-400 border-blue-500/30';
  } else if (status === 'Unrecoverable') {
    styles = 'bg-gray-500/10 text-gray-400 border-gray-600/30';
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles}`}>
      {status}
    </span>
  );
};
