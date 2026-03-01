'use client';

import type { ButtonHTMLAttributes } from 'react';

import { cn } from '@/lib/utils';

type Variant = 'primary' | 'ghost' | 'outline';
type Size = 'sm' | 'md' | 'icon';

export function Button({
  className,
  variant = 'primary',
  size = 'md',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size }) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-xl font-medium transition',
        'disabled:cursor-not-allowed disabled:opacity-50',
        size === 'sm' && 'h-9 px-3 text-sm',
        size === 'md' && 'h-10 px-4 text-sm',
        size === 'icon' && 'h-10 w-10 px-0',
        variant === 'primary' &&
          'border border-white/10 bg-white/10 text-white/90 hover:bg-white/15 hover:text-white shadow-[0_12px_30px_-18px_var(--shadow)]',
        variant === 'outline' &&
          'border border-white/14 bg-transparent text-white/80 hover:bg-white/6 hover:text-white',
        variant === 'ghost' && 'border border-transparent bg-transparent text-white/75 hover:bg-white/8 hover:text-white',
        className,
      )}
      {...props}
    />
  );
}

