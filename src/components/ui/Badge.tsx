import type { HTMLAttributes } from 'react';

import { cn } from '@/lib/utils';

type Tone = 'neutral' | 'blue' | 'orange' | 'teal';

export function Badge({
  className,
  tone = 'neutral',
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  const base = 'inline-flex items-center rounded-lg border px-2 py-0.5 text-[11px] font-medium';
  const styles =
    tone === 'blue'
      ? 'border-[rgba(0,102,255,0.35)] bg-[rgba(0,102,255,0.14)] text-[rgba(153,197,255,0.95)]'
      : tone === 'orange'
        ? 'border-[rgba(255,82,28,0.35)] bg-[rgba(255,82,28,0.14)] text-[rgba(255,205,185,0.95)]'
        : tone === 'teal'
          ? 'border-[rgba(20,184,166,0.35)] bg-[rgba(20,184,166,0.14)] text-[rgba(167,243,235,0.95)]'
          : 'border-white/10 bg-white/5 text-white/70';

  return <span className={cn(base, styles, className)} {...props} />;
}

