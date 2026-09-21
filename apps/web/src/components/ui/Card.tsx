import React from 'react';

type CardVariant = 'default' | 'premium' | 'flat' | 'outline';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  hoverable?: boolean;
  clickable?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

const variantClasses: Record<CardVariant, string> = {
  default: 'bg-white rounded-2xl shadow-card',
  premium: 'bg-dark-card rounded-2xl shadow-card text-white',
  flat: 'bg-white rounded-2xl border border-border',
  outline: 'bg-transparent rounded-2xl border-2 border-border',
};

const paddingClasses = {
  none: '',
  sm: 'p-4',
  md: 'p-4 md:p-6',
  lg: 'p-6 md:p-8',
};

export function Card({
  variant = 'default',
  hoverable = false,
  clickable = false,
  padding = 'md',
  className = '',
  children,
  ...props
}: CardProps) {
  return (
    <div
      {...props}
      className={`relative overflow-hidden transition-all duration-300 ${variantClasses[variant]} ${paddingClasses[padding]} ${hoverable ? 'hover:shadow-card-hover hover:-translate-y-1' : ''} ${clickable ? 'cursor-pointer' : ''} ${className}`}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function CardHeader({ className = '', children, ...props }: CardHeaderProps) {
  return <div className={`mb-4 ${className}`} {...props}>{children}</div>;
}

interface CardBodyProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function CardBody({ className = '', children, ...props }: CardBodyProps) {
  return <div className={className} {...props}>{children}</div>;
}

interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function CardFooter({ className = '', children, ...props }: CardFooterProps) {
  return <div className={`mt-4 pt-4 border-t border-border ${className}`} {...props}>{children}</div>;
}

interface CardBadgeProps {
  children: React.ReactNode;
  variant?: 'gold' | 'dark' | 'light' | 'danger' | 'success';
  className?: string;
}

const badgeVariants = {
  gold: 'bg-brand-gradient text-white',
  dark: 'bg-black/50 backdrop-blur text-white border border-white/20',
  light: 'bg-white/90 text-dark',
  danger: 'bg-danger text-white',
  success: 'bg-success text-white',
};

export function CardBadge({ children, variant = 'dark', className = '' }: CardBadgeProps) {
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-[0.7rem] font-bold uppercase tracking-wide ${badgeVariants[variant]} ${className}`}>
      {children}
    </span>
  );
}

interface CardGridProps {
  children: React.ReactNode;
  columns?: 1 | 2 | 3 | 4;
  className?: string;
}

const gridColumns = {
  1: 'grid-cols-1',
  2: 'grid-cols-1 sm:grid-cols-2',
  3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
  4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
};

export function CardGrid({ children, columns = 4, className = '' }: CardGridProps) {
  return <div className={`grid gap-4 md:gap-6 ${gridColumns[columns]} ${className}`}>{children}</div>;
}
