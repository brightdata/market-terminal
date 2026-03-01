import { Suspense } from 'react';
import { Terminal } from '@/components/terminal/Terminal';

export default function TerminalPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-terminal" />}>
      <Terminal />
    </Suspense>
  );
}
