'use client';

import { cn } from '@/lib/utils';

export type EvidenceView = 'graph' | 'mind' | 'flow' | 'timeline';

export function EvidenceViewToggle({
  value,
  onChange,
  disabled,
  className,
}: {
  value: EvidenceView;
  onChange: (v: EvidenceView) => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full border border-white/10 bg-white/[0.03] p-1 text-[11px] text-white/60',
        disabled ? 'opacity-60' : '',
        className,
      )}
      aria-label="Evidence view"
    >
      {(
        [
          { key: 'graph' as const, label: 'Graph' },
          { key: 'mind' as const, label: 'Mind' },
          { key: 'flow' as const, label: 'Flow' },
          { key: 'timeline' as const, label: 'Timeline' },
        ] as const
      ).map((t) => {
        const on = value === t.key;
        return (
          <button
            key={t.key}
            type="button"
            className={cn(
              'rounded-full px-3 py-1 transition',
              on ? 'bg-white/10 text-white/80' : 'text-white/55 hover:text-white/75',
              disabled ? 'pointer-events-none' : '',
            )}
            onClick={() => onChange(t.key)}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}
