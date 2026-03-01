'use client';

import { useEffect, type ReactNode } from 'react';
import { X } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';

export function Modal({
  open,
  title,
  hint,
  actions,
  children,
  onClose,
  className,
}: {
  open: boolean;
  title: string;
  hint?: string;
  actions?: ReactNode;
  children: ReactNode;
  onClose: () => void;
  className?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose, open]);

  return (
    <div className={cn('fixed inset-0 z-[80] transition-opacity', open ? 'opacity-100' : 'pointer-events-none opacity-0')}>
      <div
        className={cn('absolute inset-0 bg-black/55 backdrop-blur-sm transition-opacity', open ? 'opacity-100' : 'opacity-0')}
        onClick={onClose}
      />
      <div className="absolute inset-0 p-3 sm:p-6">
        <div
          className={cn(
            'mx-auto h-full max-w-[1720px] overflow-hidden rounded-3xl border border-white/10 bg-[#070b14]/96 shadow-[0_40px_100px_-55px_var(--shadow)]',
            className,
          )}
        >
          <div className="flex h-full flex-col">
            <div className="flex items-start justify-between gap-3 border-b border-white/10 px-4 py-3 lg:px-5 lg:py-4">
              <div>
                <div className="text-sm font-semibold text-white/90">{title}</div>
                {hint ? <div className="mt-0.5 text-[11px] text-white/45">{hint}</div> : null}
              </div>
              <div className="flex items-center gap-2">
                {actions}
                <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close modal">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="flex-1 overflow-hidden px-4 py-3 lg:px-5 lg:py-4">{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

