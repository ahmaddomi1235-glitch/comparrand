import type { SelectHTMLAttributes } from 'react';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
  containerClassName?: string;
}

export function Select({
  label,
  error,
  options,
  placeholder,
  containerClassName = '',
  className = '',
  id,
  ...rest
}: SelectProps) {
  const selectId = id ?? label?.replace(/\s+/g, '-').toLowerCase();

  return (
    <div className={`flex flex-col gap-1.5 ${containerClassName}`}>
      {label && (
        <label htmlFor={selectId} className="text-sm font-medium text-text-main">
          {label}
        </label>
      )}
      <select
        id={selectId}
        {...rest}
        className={`
          w-full px-4 py-2.5 bg-white border rounded-input text-sm text-text-main
          focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary
          transition-colors appearance-none cursor-pointer
          ${error ? 'border-danger-text ring-1 ring-danger-text' : 'border-border-default'}
          ${className}
        `}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="text-xs text-danger-text">{error}</p>}
    </div>
  );
}
