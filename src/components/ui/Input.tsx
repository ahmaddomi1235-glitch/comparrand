import type { InputHTMLAttributes, ReactNode } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: ReactNode;
  iconPosition?: 'start' | 'end';
  containerClassName?: string;
}

export function Input({
  label,
  error,
  hint,
  icon,
  iconPosition = 'start',
  containerClassName = '',
  className = '',
  id,
  ...rest
}: InputProps) {
  const inputId = id ?? label?.replace(/\s+/g, '-').toLowerCase();

  return (
    <div className={`flex flex-col gap-1.5 ${containerClassName}`}>
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-text-main">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && iconPosition === 'start' && (
          <span
            className="absolute inset-y-0 end-3 flex items-center text-text-secondary pointer-events-none"
            aria-hidden="true"
          >
            {icon}
          </span>
        )}
        <input
          id={inputId}
          {...rest}
          className={`
            w-full px-4 py-2.5 bg-white border rounded-input text-sm text-text-main
            placeholder:text-text-secondary/60
            focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary
            transition-colors
            ${icon && iconPosition === 'start' ? 'pe-10' : ''}
            ${icon && iconPosition === 'end' ? 'ps-10' : ''}
            ${error ? 'border-danger-text ring-1 ring-danger-text' : 'border-border-default'}
            ${className}
          `}
        />
        {icon && iconPosition === 'end' && (
          <span
            className="absolute inset-y-0 start-3 flex items-center text-text-secondary pointer-events-none"
            aria-hidden="true"
          >
            {icon}
          </span>
        )}
      </div>
      {error && <p className="text-xs text-danger-text">{error}</p>}
      {hint && !error && <p className="text-xs text-text-secondary">{hint}</p>}
    </div>
  );
}
