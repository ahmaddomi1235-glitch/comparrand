import type { ReactNode } from 'react';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className = '' }: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center text-center py-16 px-6 ${className}`}>
      {icon && (
        <div className="w-16 h-16 rounded-full bg-primary-light flex items-center justify-center text-primary mb-4">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-semibold text-text-main mb-2">{title}</h3>
      {description && (
        <p className="text-text-secondary text-sm max-w-xs mb-6">{description}</p>
      )}
      {action && <div>{action}</div>}
    </div>
  );
}
