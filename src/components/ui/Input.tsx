'use client';

import type { InputHTMLAttributes } from 'react';

import { cn } from '@/lib/utils';

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        'h-10 w-full rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white/90',
        'placeholder:text-white/35 outline-none',
        'focus:border-[rgba(0,102,255,0.55)] focus:ring-2 focus:ring-[rgba(0,102,255,0.25)]',
        className,
      )}
      {...props}
    />
  );
}

