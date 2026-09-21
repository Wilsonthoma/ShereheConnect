'use client';

import React from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'outline-light' | 'ghost' | 'danger' | 'success';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  children: React.ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-brand-gradient text-white font-semibold hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0',
  secondary: 'bg-transparent text-red border-2 border-red font-semibold hover:bg-red hover:text-white hover:-translate-y-0.5',
  outline: 'bg-transparent border border-border text-dark font-medium hover:border-red hover:text-red',
  'outline-light': 'bg-transparent border-2 border-white text-white font-semibold hover:bg-white hover:text-orange hover:scale-105',
  ghost: 'bg-transparent text-gray font-medium hover:bg-black/5 hover:text-dark',
  danger: 'bg-danger text-white font-semibold hover:bg-red-600 hover:-translate-y-0.5',
  success: 'bg-success text-white font-semibold hover:bg-emerald-600 hover:-translate-y-0.5',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-4 py-2 text-xs rounded-md',
  md: 'px-5 py-2.5 text-sm md:px-6 md:py-3 rounded-full',
  lg: 'px-6 py-3 text-sm md:px-8 md:py-4 md:text-base rounded-full',
};

export function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  isLoading = false,
  leftIcon,
  rightIcon,
  children,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled || isLoading}
      className={`touch-target inline-flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none ${variantClasses[variant]} ${sizeClasses[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
    >
      {isLoading ? (
        <>
          <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          <span>Loading...</span>
        </>
      ) : (
        <>
          {leftIcon}
          {children}
          {rightIcon}
        </>
      )}
    </button>
  );
}
