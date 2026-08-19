import React from 'react';
import { Clock, CheckCircle2, XCircle, AlertCircle, FileText } from 'lucide-react';

export const StatusBadge = ({ status, size = 'md' }) => {
  const configs = {
    DRAFT: {
      label: 'Draft',
      bg: 'bg-slate-100 text-slate-700 border-slate-300',
      icon: FileText,
    },
    PENDING: {
      label: 'Submitted (Pending)',
      bg: 'bg-blue-50 text-blue-700 border-blue-200',
      icon: Clock,
    },
    UNDER_REVIEW: {
      label: 'Under Review',
      bg: 'bg-amber-50 text-amber-800 border-amber-200',
      icon: AlertCircle,
    },
    APPROVED: {
      label: 'Approved',
      bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      icon: CheckCircle2,
    },
    REJECTED: {
      label: 'Action Required / Rejected',
      bg: 'bg-rose-50 text-rose-700 border-rose-200',
      icon: XCircle,
    },
  };

  const config = configs[status] || {
    label: status || 'Unknown',
    bg: 'bg-gray-100 text-gray-700 border-gray-200',
    icon: Clock,
  };

  const IconComponent = config.icon;

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs font-medium gap-1',
    md: 'px-2.5 py-1 text-sm font-semibold gap-1.5',
    lg: 'px-3.5 py-1.5 text-base font-semibold gap-2',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border shadow-sm ${config.bg} ${sizeClasses[size]}`}
    >
      <IconComponent className={size === 'sm' ? 'w-3 h-3' : size === 'lg' ? 'w-5 h-5' : 'w-4 h-4'} />
      {config.label}
    </span>
  );
};

export default StatusBadge;
