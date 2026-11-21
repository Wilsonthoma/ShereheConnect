'use client';

import React from 'react';

type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'outline'
  | 'outline-light'
  | 'ghost'
  | 'danger'
  | 'success';

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
  primary:
    'bg-gradient-to-r from-[#29ABE2] to-[#1A8CC4] text-white font-semibold border border-[#1A8CC4]/40 shadow-[0_3px_0_#1473A3,0_8px_16px_-6px_rgba(41,171,226,0.45)] hover:brightness-105 hover:-translate-y-0.5 hover:shadow-[0_4px_0_#1473A3,0_12px_20px_-6px_rgba(41,171,226,0.55)] active:translate-y-[2px] active:shadow-[0_1px_0_#1473A3]',
  secondary:
    'bg-[#E0F2FE] dark:bg-[#29ABE2]/15 text-[#1A8CC4] dark:text-[#29ABE2] font-semibold border border-[#29ABE2]/45 shadow-[0_2px_0_rgba(26,140,196,0.25)] hover:bg-[#29ABE2] hover:text-white dark:hover:bg-[#29ABE2] dark:hover:text-slate-950 hover:-translate-y-0.5 active:translate-y-[1px] active:shadow-none',
  outline:
    'bg-white dark:bg-[#3A3A3A] text-slate-800 dark:text-slate-100 font-semibold border border-slate-300 dark:border-slate-600 shadow-[0_2px_0_rgba(15,23,42,0.08)] dark:shadow-[0_2px_0_rgba(0,0,0,0.35)] hover:border-[#29ABE2] hover:text-[#1A8CC4] dark:hover:border-[#29ABE2] dark:hover:text-[#29ABE2] hover:-translate-y-0.5 active:translate-y-[1px] active:shadow-none',
  'outline-light':
    'bg-white/10 backdrop-blur-xs text-white font-semibold border border-white/70 shadow-[0_2px_0_rgba(255,255,255,0.2)] hover:bg-white hover:text-slate-900 hover:border-white hover:-translate-y-0.5 active:translate-y-[1px] active:shadow-none',
  ghost:
    'bg-transparent text-slate-600 dark:text-slate-300 font-medium border border-transparent hover:bg-slate-200/70 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white active:translate-y-[1px]',
  danger:
    'bg-red-600 text-white font-semibold border border-red-700 shadow-[0_3px_0_#991B1B] hover:bg-red-500 hover:-translate-y-0.5 active:translate-y-[2px] active:shadow-[0_1px_0_#991B1B]',
  success:
    'bg-emerald-600 text-white font-semibold border border-emerald-700 shadow-[0_3px_0_#065F46] hover:bg-emerald-500 hover:-translate-y-0.5 active:translate-y-[2px] active:shadow-[0_1px_0_#065F46]',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-3.5 py-1.5 text-xs rounded-xl',
  md: 'px-5 py-2.5 text-sm rounded-full',
  lg: 'px-7 py-3.5 text-sm sm:text-base rounded-full',
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
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      {...props}
      disabled={disabled || isLoading}
      className={[
        'touch-target inline-flex items-center justify-center gap-2',
        'cursor-pointer select-none whitespace-nowrap',
        'transition-all duration-150 ease-out',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#29ABE2] focus-visible:ring-offset-2 focus-visible:ring-offset-slate-50 dark:focus-visible:ring-offset-[#2B2B2B]',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none disabled:shadow-none disabled:transform-none',
        variantClasses[variant],
        sizeClasses[size],
        fullWidth ? 'w-full' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {isLoading ? (
        <>
          <span
            aria-hidden="true"
            className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"
          />
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