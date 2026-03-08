import type { ReactNode } from 'react';
import { ArrowRight, Database, Globe, Network, Sparkles } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';

function Box({
  title,
  subtitle,
  icon,
  tone = 'neutral',
}: {
  title: string;
  subtitle: string;
  icon: ReactNode;
  tone?: 'neutral' | 'blue' | 'orange' | 'teal';
}) {
  const toneClass =
    tone === 'blue'
      ? 'border-[rgba(0,102,255,0.28)] bg-[rgba(0,102,255,0.08)]'
      : tone === 'orange'
        ? 'border-[rgba(255,82,28,0.28)] bg-[rgba(255,82,28,0.08)]'
        : tone === 'teal'
          ? 'border-[rgba(20,184,166,0.28)] bg-[rgba(20,184,166,0.08)]'
          : 'border-white/10 bg-white/[0.03]';

  return (
    <div className={cn('rounded-2xl border p-4', toneClass)}>
      <div className="flex items-start gap-3">
        <div className="mt-0.5 text-white/70">{icon}</div>
        <div className="min-w-0">
          <div className="text-sm font-semibold text-white/90">{title}</div>
          <div className="mt-1 text-xs leading-relaxed text-white/55">{subtitle}</div>
        </div>
      </div>
    </div>
  );
}

function Arrow() {
  return (
    <div className="hidden items-center justify-center lg:flex">
      <div className="grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-white/[0.03]">
        <ArrowRight className="h-4 w-4 text-white/55" />
      </div>
    </div>
  );
}

export function ArchitectureDiagram({ className }: { className?: string }) {
  return (
    <div className={cn('relative overflow-hidden rounded-3xl border border-white/10 bg-black/25 p-4 lg:p-5', className)}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-xs font-semibold tracking-[0.22em] text-white/45">ARCHITECTURE</div>
          <div className="mt-1 text-lg font-semibold text-white/90">Evidence-first pipeline</div>
        </div>
        <Badge className="mono">plan -&gt; search -&gt; scrape -&gt; extract -&gt; link -&gt; cluster -&gt; render</Badge>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr]">
        <Box
          title="User question"
          subtitle="Ask about an asset, a move, and a horizon (today / 24h / week)."
          icon={<Network className="h-5 w-5" />}
        />
        <Arrow />
        <Box
          title="AI planner (OpenRouter)"
          subtitle="Generates search angles and coverage constraints (recency, macro, catalysts)."
          icon={<Sparkles className="h-5 w-5" />}
          tone="teal"
        />
        <Arrow />
        <Box
          title="Bright Data SERP"
          subtitle="Gets fresh sources across news and web with consistent parsing."
          icon={<Globe className="h-5 w-5" />}
          tone="blue"
        />
        <Arrow />
        <Box
          title="Web Unlocker"
          subtitle="Fetches the pages that matter (and that usually block bots)."
          icon={<Globe className="h-5 w-5" />}
          tone="blue"
        />
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-[1fr_auto_1fr_auto_1fr]">
        <Box
          title="AI extraction + linking"
          subtitle="Summaries, entities/actors, catalysts, edges, spillover hypotheses."
          icon={<Sparkles className="h-5 w-5" />}
          tone="orange"
        />
        <Arrow />
        <Box
          title="Supabase"
          subtitle="Stores sessions, pipeline events, and evidence so the UI can replay the trace."
          icon={<Database className="h-5 w-5" />}
        />
        <Arrow />
        <Box
          title="Dashboard"
          subtitle="Breaking Tape, Sources, Narratives, Evidence Map (Graph/Mind/Flow), Price, Video Pulse, Chat."
          icon={<Network className="h-5 w-5" />}
        />
      </div>

      <div className="mt-3 text-[11px] text-white/45">
        Bright Data is used as the evidence acquisition layer; the model uses that evidence to reason and produce artifacts.
      </div>
    </div>
  );
}
