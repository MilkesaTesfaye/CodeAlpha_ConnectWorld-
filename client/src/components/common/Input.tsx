import { forwardRef, useState, type InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helpText?: string;
  icon?: React.ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helpText, icon, className = '', id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
    const [focused, setFocused] = useState(false);

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className={`block text-sm font-medium mb-1.5 transition-colors ${
              error
                ? 'text-red-500'
                : focused
                ? 'text-primary-600 dark:text-primary-400'
                : 'text-dark-700 dark:text-dark-300'
            }`}
          >
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-dark-400">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            onFocus={(e) => {
              setFocused(true);
              props.onFocus?.(e);
            }}
            onBlur={(e) => {
              setFocused(false);
              props.onBlur?.(e);
            }}
            className={`w-full px-4 py-2.5 rounded-xl text-sm bg-white dark:bg-dark-900 text-dark-900 dark:text-white placeholder-dark-400 dark:placeholder-dark-500 transition-all duration-200 focus:outline-none ${
              icon ? 'pl-10' : ''
            } ${
              error
                ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
                : 'border-dark-200 dark:border-dark-700 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20'
            } ${className}`}
            aria-invalid={error ? 'true' : 'false'}
            {...props}
          />
          {/* Focus indicator */}
          {!error && focused && (
            <div className="absolute inset-0 rounded-xl ring-2 ring-primary-500/20 pointer-events-none" />
          )}
        </div>
        {error && (
          <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
            <svg className="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {error}
          </p>
        )}
        {helpText && !error && (
          <p className="mt-1.5 text-xs text-dark-400">{helpText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
export default Input;
