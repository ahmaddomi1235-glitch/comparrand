import type { ReactNode } from 'react';
import { AlertTriangle, Info, CheckCircle, XCircle, X } from 'lucide-react';

type AlertVariant = 'success' | 'warning' | 'danger' | 'info';

interface AlertProps {
  variant: AlertVariant;
  title?: string;
  children: ReactNode;
  onClose?: () => void;
  className?: string;
}

const config: Record<AlertVariant, { bg: string; text: string; border: string; icon: ReactNode }> = {
  success: {
    bg: 'bg-success-bg',
    text: 'text-success-text',
    border: 'border-success-text/30',
    icon: <CheckCircle size={18} />,
  },
  warning: {
    bg: 'bg-warning-bg',
    text: 'text-warning-text',
    border: 'border-warning-text/30',
    icon: <AlertTriangle size={18} />,
  },
  danger: {
    bg: 'bg-danger-bg',
    text: 'text-danger-text',
    border: 'border-danger-text/30',
    icon: <XCircle size={18} />,
  },
  info: {
    bg: 'bg-info-bg',
    text: 'text-info-text',
    border: 'border-info-text/30',
    icon: <Info size={18} />,
  },
};

export function Alert({ variant, title, children, onClose, className = '' }: AlertProps) {
  const c = config[variant];

  return (
    <div
      className={`${c.bg} ${c.text} border ${c.border} rounded-card p-4 flex gap-3 ${className}`}
      role="alert"
    >
      <span className="flex-shrink-0 mt-0.5" aria-hidden="true">
        {c.icon}
      </span>
      <div className="flex-1 min-w-0">
        {title && <p className="font-semibold mb-1">{title}</p>}
        <div className="text-sm">{children}</div>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="flex-shrink-0 p-0.5 rounded hover:opacity-70 transition-opacity"
          aria-label="إغلاق"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}
