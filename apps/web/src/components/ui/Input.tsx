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
  const inputId = id || `input-${Math.random().toString(36).slice(2, 9)}`;

  return (
    <div className={`flex flex-col gap-1.5 ${fullWidth ? 'w-full' : ''}`}>
      {label && (
        <label htmlFor={inputId} className="text-xs font-semibold text-gray-dark">
          {label}
        </label>
      )}
      <div
        className={`touch-target flex items-center gap-2 px-3 py-2.5 md:px-3.5 md:py-2.5 border-[1.5px] rounded-lg bg-white transition-all duration-200 ${error ? 'border-danger' : 'border-border'} focus-within:border-gold focus-within:shadow-[0_0_0_3px_rgba(245,158,11,0.1)] focus-within:-translate-y-px`}
      >
        {leftIcon && <span className="text-gray text-base">{leftIcon}</span>}
        <input
          id={inputId}
          {...props}
          className={`flex-1 bg-transparent outline-none text-sm text-dark font-medium placeholder:text-gray-light placeholder:font-normal ${className}`}
        />
        {rightIcon && <span className="text-gray text-base">{rightIcon}</span>}
      </div>
      {error && <span className="text-xs text-danger font-medium">{error}</span>}
    </div>
  );
}
