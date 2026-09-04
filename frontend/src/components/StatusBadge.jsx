import React from 'react';

export const StatusBadge = ({ status }) => {
  const getStyles = () => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'checked_in':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'in_progress':
      case 'in_consultation':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'draft':
        return 'bg-slate-100 text-slate-700 border-slate-300';
      case 'scheduled':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'cancelled':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const formatText = (text) => {
    if (!text) return 'Unknown';
    return text.replace(/_/g, ' ').toUpperCase();
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold border tracking-wide uppercase ${getStyles()}`}
    >
      {formatText(status)}
    </span>
  );
};
