import type { MedicineWarning } from '../../types';
import { AlertTriangle, Info, XCircle } from 'lucide-react';

interface WarningBoxProps {
  warning: MedicineWarning;
}

const warningConfig = {
  none: null,
  info: {
    bg: 'bg-info-bg',
    text: 'text-info-text',
    border: 'border-info-text/25',
    icon: <Info size={18} />,
  },
  warning: {
    bg: 'bg-warning-bg',
    text: 'text-warning-text',
    border: 'border-warning-text/25',
    icon: <AlertTriangle size={18} />,
  },
  danger: {
    bg: 'bg-danger-bg',
    text: 'text-danger-text',
    border: 'border-danger-text/25',
    icon: <XCircle size={18} />,
  },
};

export function WarningBox({ warning }: WarningBoxProps) {
  if (warning.level === 'none') return null;
  const config = warningConfig[warning.level];
  if (!config) return null;

  return (
    <div className={`${config.bg} ${config.text} border ${config.border} rounded-card p-4 flex gap-3`}>
      <span className="flex-shrink-0 mt-0.5" aria-hidden="true">
        {config.icon}
      </span>
      <div>
        {warning.title && (
          <p className="font-semibold text-sm mb-0.5">{warning.title}</p>
        )}
        <p className="text-sm">{warning.message}</p>
      </div>
    </div>
  );
}
