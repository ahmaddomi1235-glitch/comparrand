import type { ButtonHTMLAttributes, ReactNode } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: ReactNode;
  loading?: boolean;
  icon?: ReactNode;
  iconPosition?: 'start' | 'end';
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-white hover:bg-primary-hover focus:ring-2 focus:ring-primary focus:ring-offset-2',
  secondary: 'bg-secondary text-text-main hover:bg-secondary/80 focus:ring-2 focus:ring-secondary focus:ring-offset-2',
  outline: 'border border-border-default text-text-main bg-transparent hover:bg-bg-page focus:ring-2 focus:ring-primary focus:ring-offset-2',
  ghost: 'text-text-secondary bg-transparent hover:bg-bg-page hover:text-text-main focus:ring-2 focus:ring-primary focus:ring-offset-2',
  danger: 'bg-danger-bg text-danger-text hover:bg-danger-text hover:text-white focus:ring-2 focus:ring-danger-text focus:ring-offset-2',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-sm gap-1.5',
  md: 'px-5 py-2.5 text-sm gap-2',
  lg: 'px-7 py-3.5 text-base gap-2.5',
};

export function Button({
  variant = 'primary',
  size = 'md',
  children,
  loading = false,
  icon,
  iconPosition = 'start',
  className = '',
  disabled,
  ...rest
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <button
      {...rest}
      disabled={isDisabled}
      className={`
        inline-flex items-center justify-center font-semibold rounded-btn
        transition-all duration-150 cursor-pointer select-none
        disabled:opacity-60 disabled:cursor-not-allowed
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${className}
      `}
    >
      {loading && (
        <span
          className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin flex-shrink-0"
          aria-hidden="true"
        />
      )}
      {!loading && icon && iconPosition === 'start' && (
        <span aria-hidden="true">{icon}</span>
      )}
      {children}
      {!loading && icon && iconPosition === 'end' && (
        <span aria-hidden="true">{icon}</span>
      )}
    </button>
  );
}
