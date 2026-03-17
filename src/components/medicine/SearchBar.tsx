import { useState, useRef } from 'react';
import { Search, X } from 'lucide-react';
import { sanitizeInput } from '../../utils';
import { SEARCH } from '../../constants';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onSearch: (value: string) => void;
  placeholder?: string;
  size?: 'md' | 'lg';
  className?: string;
  recentSearches?: string[];
  onSelectRecent?: (query: string) => void;
}

export function SearchBar({
  value,
  onChange,
  onSearch,
  placeholder = 'ابحث عن دواء بالاسم أو المادة الفعالة...',
  size = 'md',
  className = '',
  recentSearches = [],
  onSelectRecent,
}: SearchBarProps) {
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cleaned = sanitizeInput(e.target.value);
    onChange(cleaned);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      onSearch(value);
      inputRef.current?.blur();
    }
  };

  const handleClear = () => {
    onChange('');
    inputRef.current?.focus();
  };

  const showDropdown = focused && recentSearches.length > 0 && !value;

  const sizeClasses =
    size === 'lg'
      ? 'py-4 pe-14 ps-5 text-base rounded-card'
      : 'py-3 pe-12 ps-4 text-sm rounded-input';

  const iconSize = size === 'lg' ? 22 : 18;

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <input
          ref={inputRef}
          type="search"
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 150)}
          placeholder={placeholder}
          maxLength={SEARCH.MAX_QUERY_LENGTH}
          className={`
            w-full border border-border-default bg-white text-text-main
            placeholder:text-text-secondary/60
            focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary
            transition-all
            ${sizeClasses}
          `}
          aria-label="حقل البحث عن الأدوية"
        />
        <span
          className="absolute inset-y-0 end-4 flex items-center pointer-events-none text-text-secondary"
          aria-hidden="true"
        >
          <Search size={iconSize} />
        </span>
        {value && (
          <button
            onClick={handleClear}
            className="absolute inset-y-0 start-4 flex items-center text-text-secondary hover:text-danger-text transition-colors"
            aria-label="مسح البحث"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {showDropdown && (
        <div className="absolute top-full mt-1 w-full bg-white border border-border-default rounded-card shadow-card-hover z-20">
          <p className="px-4 py-2 text-xs text-text-secondary font-medium border-b border-border-light">
            آخر عمليات البحث
          </p>
          {recentSearches.map((q) => (
            <button
              key={q}
              className="w-full text-start px-4 py-2.5 text-sm text-text-main hover:bg-bg-page transition-colors flex items-center gap-2"
              onMouseDown={() => {
                onChange(q);
                onSelectRecent?.(q);
                onSearch(q);
              }}
            >
              <Search size={13} className="text-text-secondary flex-shrink-0" />
              {q}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
