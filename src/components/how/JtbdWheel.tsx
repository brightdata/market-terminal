 'use client';

import { useMemo, useState, useId } from 'react';
import { cn } from '@/lib/utils';

type Segment = {
  label: string;
  tone: 'blue' | 'orange' | 'teal' | 'neutral';
  detail?: string;
  examples?: string[];
};

type Active =
  | {
      kind: 'step' | 'outcome';
      index: number; // 1-based
    }
  | null;

function polar(cx: number, cy: number, r: number, angRad: number) {
  return { x: cx + r * Math.cos(angRad), y: cy + r * Math.sin(angRad) };
}

function arcSegmentPath(cx: number, cy: number, r0: number, r1: number, a0: number, a1: number) {
  const p1 = polar(cx, cy, r1, a0);
  const p2 = polar(cx, cy, r1, a1);
  const p3 = polar(cx, cy, r0, a1);
  const p4 = polar(cx, cy, r0, a0);
  const largeArc = a1 - a0 > Math.PI ? 1 : 0;
  return [
    `M ${p1.x.toFixed(2)} ${p1.y.toFixed(2)}`,
    `A ${r1} ${r1} 0 ${largeArc} 1 ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`,
    `L ${p3.x.toFixed(2)} ${p3.y.toFixed(2)}`,
    `A ${r0} ${r0} 0 ${largeArc} 0 ${p4.x.toFixed(2)} ${p4.y.toFixed(2)}`,
    'Z',
  ].join(' ');
}

function toneFill(tone: Segment['tone']) {
  if (tone === 'blue') return 'rgba(0,102,255,0.14)';
  if (tone === 'orange') return 'rgba(255,82,28,0.14)';
  if (tone === 'teal') return 'rgba(20,184,166,0.14)';
  return 'rgba(255,255,255,0.06)';
}

function toneStroke(tone: Segment['tone']) {
  if (tone === 'blue') return 'rgba(0,102,255,0.38)';
  if (tone === 'orange') return 'rgba(255,82,28,0.38)';
  if (tone === 'teal') return 'rgba(20,184,166,0.38)';
  return 'rgba(255,255,255,0.14)';
}

export function JtbdWheel({
  className,
  title = 'Jobs-to-be-Done (Signal Terminal)',
  coreJob,
  steps,
  outcomes,
}: {
  className?: string;
  title?: string;
  coreJob: string;
  steps: Segment[];
  outcomes: Segment[];
}) {
  const uid = useId().replace(/:/g, '');
  const [pinned, setPinned] = useState<Active>(null);
  const [hovered, setHovered] = useState<Active>(null);
  const active: Active = hovered || pinned;

  const size = 540;
  const cx = size / 2;
  const cy = size / 2;

  const centerR = 78;
  const coreR0 = 96;
  const coreR1 = 168;
  const stepR0 = 186;
  const stepR1 = 254;
  const outR0 = 272;
  const outR1 = 330;

  // Start from the top.
  const base = -Math.PI / 2;
  const gap = (Math.PI * 2) / 360 * 1.2; // small gap between segments

  const stepSegs = useMemo(() => {
    return steps.map((s, i) => {
      const span = (Math.PI * 2) / steps.length;
      const a0 = base + i * span + gap / 2;
      const a1 = base + (i + 1) * span - gap / 2;
      const mid = (a0 + a1) / 2;
      const midR = (stepR0 + stepR1) / 2;
      const p = polar(cx, cy, midR, mid);
      const labelP = polar(cx, cy, stepR1 - 16, mid);
      return { ...s, i: i + 1, a0, a1, mid, p, labelP };
    });
  }, [base, cx, cy, gap, stepR0, stepR1, steps]);

  const outSegs = useMemo(() => {
    return outcomes.map((s, i) => {
      const span = (Math.PI * 2) / outcomes.length;
      const a0 = base + i * span + gap / 2;
      const a1 = base + (i + 1) * span - gap / 2;
      const mid = (a0 + a1) / 2;
      const midR = (outR0 + outR1) / 2;
      const p = polar(cx, cy, midR, mid);
      const labelP = polar(cx, cy, outR1 - 16, mid);
      return { ...s, i: i + 1, a0, a1, mid, p, labelP };
    });
  }, [base, cx, cy, gap, outR0, outR1, outcomes]);

  const activeSeg = useMemo(() => {
    if (!active) return null;
    if (active.kind === 'step') return stepSegs.find((s) => s.i === active.index) || null;
    return outSegs.find((s) => s.i === active.index) || null;
  }, [active, outSegs, stepSegs]);

  const activeTitle = active
    ? `${active.kind === 'step' ? 'Step' : 'Outcome'} ${active.index}`
    : null;

  const activeLabel = activeSeg?.label || null;
  const activeDetail = activeSeg?.detail || null;
  const activeExamples = (activeSeg?.examples || []).slice(0, 4);

  const dimOthers = Boolean(active);
  const isStepActive = (i: number) => Boolean(active && active.kind === 'step' && active.index === i);
  const isOutcomeActive = (i: number) => Boolean(active && active.kind === 'outcome' && active.index === i);

  const setPreview = (a: Active) => setHovered(a);
  const clearPreview = () => setHovered(null);

  const togglePin = (a: Active) => {
    if (!a) return;
    setPinned((prev) => (prev && prev.kind === a.kind && prev.index === a.index ? null : a));
  };

  const labelShort = (raw: string) => {
    const s = String(raw || '').trim();
    if (s.length <= 40) return s;
    return `${s.slice(0, 39).trimEnd()}…`;
  };

  return (
    <div className={cn('relative overflow-hidden rounded-3xl border border-white/10 bg-black/25', className)}>
      <div className="pointer-events-none absolute inset-0 grid-overlay opacity-70" />
      <div className="relative p-4 lg:p-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="text-xs font-semibold tracking-[0.22em] text-white/45">FRAMEWORK</div>
            <div className="mt-1 text-lg font-semibold text-white/90">{title}</div>
            <div className="mt-1 text-sm text-white/60">{coreJob}</div>
          </div>
          <div className="text-[11px] text-white/45">
            <span className="mono">Core</span> job, then <span className="mono">steps</span>, then <span className="mono">outcomes</span>.
          </div>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-[560px_1fr]">
          <div className="mx-auto w-full max-w-[560px]">
            <svg
              viewBox={`0 0 ${size} ${size}`}
              width="100%"
              height="auto"
              role="img"
              aria-label="Jobs-to-be-done wheel"
              className="block"
            >
              <defs>
                <radialGradient id="wheelGlow" cx="50%" cy="40%" r="70%">
                  <stop offset="0%" stopColor="rgba(255,255,255,0.10)" />
                  <stop offset="55%" stopColor="rgba(255,255,255,0.05)" />
                  <stop offset="100%" stopColor="rgba(255,255,255,0.00)" />
                </radialGradient>
                <filter id={`${uid}-segGlow`} x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="rgba(0,0,0,0.55)" />
                  <feDropShadow dx="0" dy="0" stdDeviation="7" floodColor="rgba(255,255,255,0.10)" />
                </filter>
              </defs>

              <circle cx={cx} cy={cy} r={outR1 + 26} fill="url(#wheelGlow)" opacity={0.7} />

              {/* Outer outcomes ring */}
              {outSegs.map((s) => (
                <g key={`out_${s.i}`}>
                  <path
                    d={arcSegmentPath(cx, cy, outR0, outR1, s.a0, s.a1)}
                    fill={toneFill(s.tone)}
                    stroke={toneStroke(s.tone)}
                    strokeWidth={isOutcomeActive(s.i) ? 2 : 1}
                    opacity={dimOthers && !isOutcomeActive(s.i) ? 0.32 : 1}
                    filter={isOutcomeActive(s.i) ? `url(#${uid}-segGlow)` : undefined}
                    style={{ cursor: 'pointer', transition: 'opacity 150ms ease' }}
                    tabIndex={0}
                    role="button"
                    aria-label={`Outcome ${s.i}: ${s.label}`}
                    onMouseEnter={() => setPreview({ kind: 'outcome', index: s.i })}
                    onMouseLeave={clearPreview}
                    onFocus={() => setPreview({ kind: 'outcome', index: s.i })}
                    onBlur={clearPreview}
                    onClick={() => togglePin({ kind: 'outcome', index: s.i })}
                  >
                    <title>{`Outcome ${s.i}: ${s.label}`}</title>
                  </path>
                  <text
                    x={s.p.x}
                    y={s.p.y}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="mono"
                    fontSize={isOutcomeActive(s.i) ? 12 : 11}
                    fill={isOutcomeActive(s.i) ? 'rgba(255,255,255,0.90)' : 'rgba(255,255,255,0.75)'}
                    opacity={dimOthers && !isOutcomeActive(s.i) ? 0.45 : 1}
                  >
                    {s.i}
                  </text>
                  {isOutcomeActive(s.i) ? (
                    <text
                      x={s.labelP.x}
                      y={s.labelP.y}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fontSize={10}
                      fill="rgba(255,255,255,0.78)"
                    >
                      {labelShort(s.label)}
                    </text>
                  ) : null}
                </g>
              ))}

              {/* Step ring */}
              {stepSegs.map((s) => (
                <g key={`step_${s.i}`}>
                  <path
                    d={arcSegmentPath(cx, cy, stepR0, stepR1, s.a0, s.a1)}
                    fill={toneFill(s.tone)}
                    stroke={toneStroke(s.tone)}
                    strokeWidth={isStepActive(s.i) ? 2 : 1}
                    opacity={dimOthers && !isStepActive(s.i) ? 0.32 : 1}
                    filter={isStepActive(s.i) ? `url(#${uid}-segGlow)` : undefined}
                    style={{ cursor: 'pointer', transition: 'opacity 150ms ease' }}
                    tabIndex={0}
                    role="button"
                    aria-label={`Step ${s.i}: ${s.label}`}
                    onMouseEnter={() => setPreview({ kind: 'step', index: s.i })}
                    onMouseLeave={clearPreview}
                    onFocus={() => setPreview({ kind: 'step', index: s.i })}
                    onBlur={clearPreview}
                    onClick={() => togglePin({ kind: 'step', index: s.i })}
                  >
                    <title>{`Step ${s.i}: ${s.label}`}</title>
                  </path>
                  <text
                    x={s.p.x}
                    y={s.p.y}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="mono"
                    fontSize={isStepActive(s.i) ? 13 : 12}
                    fill={isStepActive(s.i) ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0.82)'}
                    opacity={dimOthers && !isStepActive(s.i) ? 0.45 : 1}
                  >
                    {s.i}
                  </text>
                  {isStepActive(s.i) ? (
                    <text
                      x={s.labelP.x}
                      y={s.labelP.y}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fontSize={10}
                      fill="rgba(255,255,255,0.78)"
                    >
                      {labelShort(s.label)}
                    </text>
                  ) : null}
                </g>
              ))}

              {/* Core job ring */}
              <path
                d={arcSegmentPath(cx, cy, coreR0, coreR1, base + gap, base + Math.PI * 2 - gap)}
                fill="rgba(255,255,255,0.045)"
                stroke="rgba(255,255,255,0.14)"
                strokeWidth={1}
              />

              {/* Center */}
              <circle cx={cx} cy={cy} r={centerR} fill="rgba(0,0,0,0.22)" stroke="rgba(255,255,255,0.18)" />
              <text x={cx} y={cy - 8} textAnchor="middle" className="mono" fontSize={12} fill="rgba(255,255,255,0.70)">
                Job Executor
              </text>
              <text x={cx} y={cy + 14} textAnchor="middle" fontSize={16} fill="rgba(255,255,255,0.90)" fontWeight={700}>
                Trader / Investor
              </text>
              {activeTitle && activeLabel ? (
                <>
                  <text x={cx} y={cy + 40} textAnchor="middle" className="mono" fontSize={11} fill="rgba(255,255,255,0.60)">
                    {pinned ? 'Pinned' : 'Preview'}: {activeTitle}
                  </text>
                  <text x={cx} y={cy + 58} textAnchor="middle" fontSize={12} fill="rgba(255,255,255,0.82)">
                    {labelShort(activeLabel)}
                  </text>
                </>
              ) : (
                <text x={cx} y={cy + 44} textAnchor="middle" className="mono" fontSize={11} fill="rgba(255,255,255,0.55)">
                  Hover or click a segment
                </text>
              )}

              <text x={cx} y={coreR0 + 18} textAnchor="middle" fontSize={12} fill="rgba(255,255,255,0.60)" className="mono">
                CORE JOB
              </text>
              <text x={cx} y={stepR0 + 18} textAnchor="middle" fontSize={12} fill="rgba(255,255,255,0.60)" className="mono">
                JOB STEPS
              </text>
              <text x={cx} y={outR0 + 18} textAnchor="middle" fontSize={12} fill="rgba(255,255,255,0.60)" className="mono">
                OUTCOMES
              </text>
            </svg>
          </div>

          <div className="grid gap-4 lg:grid-rows-[auto_auto_1fr]">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <div className="text-xs font-semibold tracking-[0.18em] text-white/45">CORE FUNCTIONAL JOB</div>
              <div className="mt-2 text-sm leading-relaxed text-white/70">{coreJob}</div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/15 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-xs font-semibold tracking-[0.18em] text-white/45">FOCUS</div>
                <div className="flex items-center gap-2">
                  {pinned ? (
                    <button
                      type="button"
                      className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[11px] font-semibold text-white/70 transition hover:bg-white/[0.06]"
                      onClick={() => setPinned(null)}
                    >
                      Clear pin
                    </button>
                  ) : null}
                  <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[11px] text-white/60">
                    Hover to preview, click to pin
                  </span>
                </div>
              </div>
              <div className="mt-2 rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-3">
                {activeTitle && activeLabel ? (
                  <>
                    <div className="mono text-[11px] font-semibold text-white/65">{activeTitle}</div>
                    <div className="mt-1 text-sm font-semibold text-white/85">{activeLabel}</div>
                    {activeDetail ? <div className="mt-2 text-sm leading-relaxed text-white/70">{activeDetail}</div> : null}
                    {activeExamples.length ? (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {activeExamples.map((ex) => (
                          <span key={ex} className="rounded-full border border-white/10 bg-black/10 px-2.5 py-1 text-[11px] text-white/65">
                            {ex}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </>
                ) : (
                  <div className="text-sm text-white/65">
                    Select a step or outcome to explain what the product is doing and why it matters.
                  </div>
                )}
              </div>
            </div>

            <div className="grid gap-3 lg:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-black/15 p-4">
                <div className="text-xs font-semibold tracking-[0.18em] text-white/45">JOB STEPS (1-8)</div>
                <div className="mt-2 space-y-2 text-sm text-white/70">
                  {steps.map((s, idx) => (
                    <button
                      key={`s_${idx}`}
                      type="button"
                      className={cn(
                        'flex w-full items-start gap-3 rounded-2xl border px-3 py-2 text-left transition',
                        'border-white/10 bg-white/[0.02] hover:bg-white/[0.05]',
                        isStepActive(idx + 1) ? 'ring-2 ring-white/20 bg-white/[0.06]' : '',
                        dimOthers && active?.kind === 'step' && active.index !== idx + 1 ? 'opacity-55' : '',
                      )}
                      onMouseEnter={() => setPreview({ kind: 'step', index: idx + 1 })}
                      onMouseLeave={clearPreview}
                      onFocus={() => setPreview({ kind: 'step', index: idx + 1 })}
                      onBlur={clearPreview}
                      onClick={() => togglePin({ kind: 'step', index: idx + 1 })}
                    >
                      <span className="mono mt-[1px] inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-[11px] text-white/75">
                        {idx + 1}
                      </span>
                      <span className="text-sm leading-relaxed text-white/75">{s.label}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/15 p-4">
                <div className="text-xs font-semibold tracking-[0.18em] text-white/45">OUTCOMES (1-{outcomes.length})</div>
                <div className="mt-2 grid gap-2 sm:grid-cols-2 text-sm text-white/70">
                  {outcomes.map((s, idx) => (
                    <button
                      key={`o_${idx}`}
                      type="button"
                      className={cn(
                        'flex items-start gap-3 rounded-2xl border px-3 py-2 text-left transition',
                        'border-white/10 bg-white/[0.02] hover:bg-white/[0.05]',
                        isOutcomeActive(idx + 1) ? 'ring-2 ring-white/20 bg-white/[0.06]' : '',
                        dimOthers && active?.kind === 'outcome' && active.index !== idx + 1 ? 'opacity-55' : '',
                      )}
                      onMouseEnter={() => setPreview({ kind: 'outcome', index: idx + 1 })}
                      onMouseLeave={clearPreview}
                      onFocus={() => setPreview({ kind: 'outcome', index: idx + 1 })}
                      onBlur={clearPreview}
                      onClick={() => togglePin({ kind: 'outcome', index: idx + 1 })}
                    >
                      <span className="mono mt-[1px] inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-[11px] text-white/75">
                        {idx + 1}
                      </span>
                      <span className="text-sm leading-relaxed text-white/75">{s.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-[rgba(0,102,255,0.06)] p-4">
              <div className="text-xs font-semibold tracking-[0.18em] text-white/45">WHY BRIGHT DATA</div>
              <div className="mt-2 text-sm leading-relaxed text-white/70">
                Bright Data is the evidence supply chain: it returns consistent SERP results and unlocks pages that block bots,
                so the AI can focus on reasoning, summarization, linking, and spillover analysis instead of fighting anti-scraping.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
