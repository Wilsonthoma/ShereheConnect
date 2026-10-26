'use client';

import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

export function Input({
  label,
  error,
  leftIcon,
  rightIcon,
  fullWidth = true,
  className = '',
  id,
  ...props
}: InputProps) {
  const inputId =
    id || `input-${Math.random().toString(36).slice(2, 9)}`;

  return (
    <div className={`flex flex-col gap-1.5 ${fullWidth ? 'w-full' : ''}`}>
      {label && (
        <label
          htmlFor={inputId}
          className="text-xs font-semibold
                     text-slate-600 dark:text-slate-300
                     transition-colors"
        >
          {label}
        </label>
      )}
      <div
        className={`
          touch-target flex items-center gap-2
          px-3 py-2.5 md:px-3.5 md:py-2.5
          border-[1.5px] rounded-lg
          bg-white dark:bg-slate-900
          transition-all duration-200
          ${
            error
              ? 'border-red-500/60'
              : 'border-slate-300 dark:border-slate-700'
          }
          focus-within:border-gold
          focus-within:shadow-[0_0_0_3px_rgba(245,158,11,0.1)]
          focus-within:-translate-y-px
        `}
      >
        {leftIcon && (
          <span className="text-slate-500 dark:text-slate-400 text-base shrink-0">
            {leftIcon}
          </span>
        )}
        <input
          id={inputId}
          {...props}
          className={`
            flex-1 bg-transparent outline-none
            text-sm font-medium
            text-slate-900 dark:text-white
            placeholder:text-slate-400 dark:placeholder:text-slate-500
            placeholder:font-normal
            ${className}
          `}
        />
        {rightIcon && (
          <span className="text-slate-500 dark:text-slate-400 text-base shrink-0">
            {rightIcon}
          </span>
        )}
      </div>
      {error && (
        <span className="text-xs text-red-500 font-medium">{error}</span>
      )}
    </div>
  );
}