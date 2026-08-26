import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'emerald' | 'rose' | 'blue' | 'amber' | 'slate' | 'purple';
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'slate',
  size = 'sm',
  className,
}) => {
  const variantStyles = {
    emerald: 'bg-emerald-50 text-emerald-700 border border-emerald-200/60',
    rose: 'bg-rose-50 text-rose-700 border border-rose-200/60',
    blue: 'bg-blue-50 text-blue-700 border border-blue-200/60',
    amber: 'bg-amber-50 text-amber-700 border border-amber-200/60',
    slate: 'bg-slate-100 text-slate-700 border border-slate-200',
    purple: 'bg-purple-50 text-purple-700 border border-purple-200/60',
  };

  const sizeStyles = {
    sm: 'px-2 py-0.5 text-xs font-medium rounded-md',
    md: 'px-2.5 py-1 text-xs font-semibold rounded-lg',
  };

  return (
    <span className={twMerge(clsx('inline-flex items-center gap-1', variantStyles[variant], sizeStyles[size], className))}>
      {children}
    </span>
  );
};
