'use client';

import { useMemo, useState, type ReactNode } from 'react';
import { ArrowRight, ChevronDown, ChevronRight, CircleDot, GitBranch, Globe, Layers, Sparkles } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import type { GraphEdge, GraphNode, NodeType } from '@/components/terminal/types';

type EventChildren = {
  sources: string[];
  actors: string[];
  assets: string[];
  media: string[];
  relationCounts: Record<GraphEdge['type'], number>;
  evidenceCount: number;
  bestEdgeByType: Partial<Record<GraphEdge['type'], GraphEdge>>;
};

type MindThread = {
  eventId: string;
  sourceId: string | null;
  impactId: string | null;
  confidence: number;
  evidenceCount: number;
  relationCounts: Record<GraphEdge['type'], number>;
  bestEdgeByType: Partial<Record<GraphEdge['type'], GraphEdge>>;
};

function toneForNode(type: NodeType) {
  if (type === 'asset')
    return {
      bg: 'bg-[rgba(0,102,255,0.14)]',
      border: 'border-[rgba(0,102,255,0.35)]',
      text: 'text-[rgba(153,197,255,0.95)]',
    };
  if (type === 'event')
    return {
      bg: 'bg-[rgba(255,82,28,0.14)]',
      border: 'border-[rgba(255,82,28,0.35)]',
      text: 'text-[rgba(255,205,185,0.95)]',
    };
  if (type === 'entity')
    return {
      bg: 'bg-[rgba(20,184,166,0.14)]',
      border: 'border-[rgba(20,184,166,0.35)]',
      text: 'text-[rgba(167,243,235,0.95)]',
    };
  if (type === 'media')
    return {
      bg: 'bg-[rgba(255,188,92,0.14)]',
      border: 'border-[rgba(255,188,92,0.35)]',
      text: 'text-[rgba(255,225,168,0.95)]',
    };
  return { bg: 'bg-white/5', border: 'border-white/10', text: 'text-white/70' };
}

function edgeTypeMeta(type: GraphEdge['type']) {
  if (type === 'mentions') {
    return {
      label: 'reported',
      chip: 'border-[rgba(153,197,255,0.45)] bg-[rgba(0,102,255,0.14)] text-[rgba(180,214,255,0.95)]',
    };
  }
  if (type === 'co_moves') {
    return {
      label: 'co-move',
      chip: 'border-[rgba(20,184,166,0.45)] bg-[rgba(20,184,166,0.14)] text-[rgba(170,250,238,0.95)]',
    };
  }
  if (type === 'same_story') {
    return {
      label: 'context',
      chip: 'border-white/20 bg-white/[0.06] text-white/80',
    };
  }
  return {
    label: 'hypothesis',
    chip: 'border-[rgba(255,82,28,0.45)] bg-[rgba(255,82,28,0.14)] text-[rgba(255,215,194,0.95)]',
  };
}

function formatPct(v: number) {
  return `${Math.round(Math.max(0, Math.min(1, v)) * 100)}%`;
}

function scoreRootCandidate(label: string, topic: string) {
  const a = String(label || '').trim().toLowerCase();
  const b = String(topic || '').trim().toLowerCase();
  if (!a || !b) return 0;
  if (a === b) return 100;
  if (a.replace(/\s+/g, '') === b.replace(/\s+/g, '')) return 92;
  if (a.startsWith(b) || b.startsWith(a)) return 84;
  if (a.includes(b) || b.includes(a)) return 72;
  return 0;
}

function pickRoot(nodes: GraphNode[], topic: string) {
  const assets = nodes.filter((n) => n.type === 'asset');
  if (!assets.length) return nodes[0] || null;
  if (assets.length === 1) return assets[0];
  let best = assets[0];
  let bestScore = scoreRootCandidate(best.label, topic);
  for (const n of assets.slice(1)) {
    const s = scoreRootCandidate(n.label, topic);
    if (s > bestScore) {
      best = n;
      bestScore = s;
    }
  }
  return best;
}

function edgeBetween(a: string, b: string, edgesByNode: Map<string, GraphEdge[]>) {
  const list = edgesByNode.get(a) || [];
  let best: GraphEdge | null = null;
  for (const e of list) {
    if (!((e.from === a && e.to === b) || (e.from === b && e.to === a))) continue;
    if (!best || Number(e.confidence || 0) > Number(best.confidence || 0)) best = e;
  }
  return best;
}

function sortByScore(ids: string[], scoreById: Map<string, number>) {
  return [...ids].sort((x, y) => (scoreById.get(y) || 0) - (scoreById.get(x) || 0));
}

export function EvidenceMindMap({
  topic,
  nodes,
  edges,
  selected,
  onSelectNode,
  onSelectEdge,
  className,
  viewportClassName,
}: {
  topic: string;
  nodes: GraphNode[];
  edges: GraphEdge[];
  selected: { nodeId: string | null; edgeId: string | null };
  onSelectNode: (id: string | null) => void;
  onSelectEdge: (id: string | null) => void;
  className?: string;
  viewportClassName?: string;
}) {
  const [expandedEvents, setExpandedEvents] = useState<Record<string, boolean>>({});

  const data = useMemo(() => {
    const nodeById = new Map<string, GraphNode>();
    nodes.forEach((n) => nodeById.set(String(n.id), n));

    const edgesByNode = new Map<string, GraphEdge[]>();
    const neighbors = new Map<string, Set<string>>();
    const strongestEdgeByType = new Map<GraphEdge['type'], GraphEdge>();
    for (const e of edges) {
      const a = String(e.from);
      const b = String(e.to);
      const prevA = edgesByNode.get(a) || [];
      prevA.push(e);
      edgesByNode.set(a, prevA);
      const prevB = edgesByNode.get(b) || [];
      prevB.push(e);
      edgesByNode.set(b, prevB);

      const na = neighbors.get(a) || new Set<string>();
      na.add(b);
      neighbors.set(a, na);
      const nb = neighbors.get(b) || new Set<string>();
      nb.add(a);
      neighbors.set(b, nb);

      const prevStrong = strongestEdgeByType.get(e.type);
      if (!prevStrong || Number(e.confidence || 0) > Number(prevStrong.confidence || 0)) {
        strongestEdgeByType.set(e.type, e);
      }
    }

    const root = pickRoot(nodes, topic);
    const rootId = root ? String(root.id) : null;

    const scoreById = new Map<string, number>();
    const linkCountById = new Map<string, number>();
    for (const n of nodes) {
      const id = String(n.id);
      const linked = neighbors.get(id)?.size ?? 0;
      linkCountById.set(id, linked);
      const localEdges = edgesByNode.get(id) || [];
      const avgConfidence = localEdges.length
        ? localEdges.reduce((sum, edge) => sum + Number(edge.confidence || 0), 0) / localEdges.length
        : 0;
      scoreById.set(id, linked + avgConfidence * 2);
    }

    if (rootId) {
      for (const nid of neighbors.get(rootId) || []) {
        const e = edgeBetween(rootId, nid, edgesByNode);
        const bonus = e ? Number(e.confidence || 0) * 3 : 0;
        scoreById.set(nid, (scoreById.get(nid) || 0) + bonus + 2);
      }
    }

    const direct = rootId ? Array.from(neighbors.get(rootId) || []) : [];
    const directByType: Record<NodeType, string[]> = { asset: [], event: [], entity: [], source: [], media: [] };
    for (const id of direct) {
      const n = nodeById.get(id);
      if (!n) continue;
      directByType[n.type].push(id);
    }

    const eventIds = new Set(sortByScore(directByType.event, scoreById));
    const twoHopEntities = new Set<string>();
    const twoHopSources = new Set<string>();
    const twoHopAssets = new Set<string>();
    const twoHopMedia = new Set<string>();
    for (const evId of eventIds) {
      for (const nid of neighbors.get(evId) || []) {
        const n = nodeById.get(nid);
        if (!n) continue;
        if (n.type === 'entity') twoHopEntities.add(nid);
        if (n.type === 'source') twoHopSources.add(nid);
        if (n.type === 'asset' && nid !== rootId) twoHopAssets.add(nid);
        if (n.type === 'media') twoHopMedia.add(nid);
      }
    }

    const branch = {
      root,
      rootId,
      events: sortByScore(directByType.event, scoreById).slice(0, 18),
      actors: sortByScore(Array.from(new Set([...directByType.entity, ...Array.from(twoHopEntities)])), scoreById).slice(0, 18),
      sources: sortByScore(Array.from(new Set([...directByType.source, ...Array.from(twoHopSources)])), scoreById).slice(0, 18),
      spillovers: sortByScore(
        Array.from(new Set([...directByType.asset.filter((x) => x !== rootId), ...Array.from(twoHopAssets)])),
        scoreById,
      ).slice(0, 14),
      media: sortByScore(Array.from(new Set([...directByType.media, ...Array.from(twoHopMedia)])), scoreById).slice(0, 14),
    };

    function childrenForEvent(eventId: string): EventChildren {
      const kids = Array.from(neighbors.get(eventId) || []);
      const byType: Record<NodeType, string[]> = { asset: [], event: [], entity: [], source: [], media: [] };
      const relationCounts: Record<GraphEdge['type'], number> = { mentions: 0, co_moves: 0, hypothesis: 0, same_story: 0 };
      const evidenceIds = new Set<string>();
      const bestEdgeByType: Partial<Record<GraphEdge['type'], GraphEdge>> = {};

      const eventEdges = edgesByNode.get(eventId) || [];
      for (const edge of eventEdges) {
        relationCounts[edge.type] += 1;
        for (const evId of edge.evidenceIds || []) evidenceIds.add(evId);
        const prev = bestEdgeByType[edge.type];
        if (!prev || Number(edge.confidence || 0) > Number(prev.confidence || 0)) {
          bestEdgeByType[edge.type] = edge;
        }
      }

      for (const id of kids) {
        if (id === rootId) continue;
        const n = nodeById.get(id);
        if (!n) continue;
        byType[n.type].push(id);
      }

      return {
        sources: sortByScore(byType.source, scoreById).slice(0, 6),
        actors: sortByScore(byType.entity, scoreById).slice(0, 6),
        assets: sortByScore(byType.asset, scoreById).slice(0, 4),
        media: sortByScore(byType.media, scoreById).slice(0, 4),
        relationCounts,
        evidenceCount: evidenceIds.size,
        bestEdgeByType,
      };
    }

    const childrenByEvent = new Map<string, EventChildren>();
    for (const evId of branch.events) {
      childrenByEvent.set(evId, childrenForEvent(evId));
    }

    const threads: MindThread[] = branch.events
      .map((evId) => {
        const kids = childrenByEvent.get(evId) || childrenForEvent(evId);
        const sourceId = kids.sources[0] || null;
        const impactId = kids.assets[0] || kids.actors[0] || kids.media[0] || null;

        const rootEdge = rootId ? edgeBetween(evId, rootId, edgesByNode) : null;
        const sourceEdge = sourceId ? edgeBetween(evId, sourceId, edgesByNode) : null;
        const impactEdge = impactId ? edgeBetween(evId, impactId, edgesByNode) : null;
        const confidenceEdges = [rootEdge, sourceEdge, impactEdge].filter((e): e is GraphEdge => Boolean(e));
        const confidence = confidenceEdges.length
          ? confidenceEdges.reduce((sum, e) => sum + Number(e.confidence || 0), 0) / confidenceEdges.length
          : 0;

        return {
          eventId: evId,
          sourceId,
          impactId,
          confidence,
          evidenceCount: kids.evidenceCount,
          relationCounts: kids.relationCounts,
          bestEdgeByType: kids.bestEdgeByType,
        };
      })
      .sort((a, b) => b.confidence - a.confidence || b.evidenceCount - a.evidenceCount);

    const channelCounts: Record<GraphEdge['type'], number> = { mentions: 0, co_moves: 0, hypothesis: 0, same_story: 0 };
    for (const thread of threads) {
      channelCounts.mentions += thread.relationCounts.mentions;
      channelCounts.co_moves += thread.relationCounts.co_moves;
      channelCounts.hypothesis += thread.relationCounts.hypothesis;
      channelCounts.same_story += thread.relationCounts.same_story;
    }
    const channelOrder = (['mentions', 'hypothesis', 'co_moves', 'same_story'] as GraphEdge['type'][])
      .filter((type) => channelCounts[type] > 0 || strongestEdgeByType.has(type))
      .sort((a, b) => channelCounts[b] - channelCounts[a]);

    const impactHighlights = Array.from(new Set([...branch.spillovers, ...branch.actors, ...branch.media])).slice(0, 10);

    return {
      nodeById,
      edgesByNode,
      branch,
      childrenByEvent,
      threads,
      linkCountById,
      scoreById,
      strongestEdgeByType,
      channelCounts,
      channelOrder,
      impactHighlights,
    };
  }, [edges, nodes, topic]);

  const root = data.branch.root;

  const renderNodeChip = (id: string, typeHint?: NodeType) => {
    const node = data.nodeById.get(id);
    if (!node) return null;
    const type = typeHint || node.type;
    const tone = toneForNode(type);
    const selectedOn = selected.nodeId === id;
    const linkCount = data.linkCountById.get(id) || 0;
    return (
      <button
        key={id}
        type="button"
        className={cn(
          'w-full rounded-full border px-3 py-2 text-left text-sm transition',
          tone.border,
          tone.bg,
          selectedOn ? 'ring-2 ring-white/30' : 'hover:bg-white/[0.06]',
        )}
        onClick={() => {
          onSelectNode(id);
          onSelectEdge(null);
        }}
        title={node.label}
      >
        <div className="flex items-center justify-between gap-3">
          <div className={cn('truncate font-semibold', tone.text)}>{node.label}</div>
          <div className="mono text-[11px] text-white/45">links {linkCount}</div>
        </div>
      </button>
    );
  };

  const BranchCard = ({
    title,
    icon,
    items,
    emptyHint,
    itemType,
  }: {
    title: string;
    icon: ReactNode;
    items: string[];
    emptyHint: string;
    itemType: NodeType;
  }) => {
    return (
      <div className="rounded-2xl border border-white/10 bg-black/15 p-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-semibold tracking-wide text-white/70">
            <span className="text-white/60">{icon}</span>
            {title}
          </div>
          <Badge className="mono">{items.length}</Badge>
        </div>
        <div className="mt-2 space-y-2">
          {items.length === 0 ? (
            <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white/60">
              {emptyHint}
            </div>
          ) : (
            items.map((id) => renderNodeChip(id, itemType))
          )}
        </div>
      </div>
    );
  };

  return (
    <div className={cn('relative overflow-hidden rounded-2xl border border-white/10 bg-black/25', className)}>
      <div className="pointer-events-none absolute inset-0 grid-overlay opacity-70" />
      <div className={cn('relative w-full', viewportClassName ?? 'h-[320px] lg:h-[430px]')}>
        <div className="h-full overflow-auto p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Badge tone="teal" className="mono">
                MIND MAP
              </Badge>
              <div className="text-xs text-white/55">Story-first view: catalysts, channels, and impact from the graph.</div>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-white/55">
              <span className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1">
                nodes <span className="mono text-white/75">{nodes.length}</span>
              </span>
              <span className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1">
                edges <span className="mono text-white/75">{edges.length}</span>
              </span>
            </div>
          </div>

          <div className="mt-4">
            <div className="mx-auto max-w-[980px] rounded-3xl border border-white/10 bg-white/[0.02] p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="text-xs font-semibold tracking-[0.18em] text-white/50">FOCUS ASSET</div>
                <div className="text-[11px] text-white/45 mono">{topic}</div>
              </div>

              <div className="mt-3 flex items-center justify-center">
                {root ? (
                  <button
                    type="button"
                    className={cn(
                      'rounded-full border px-4 py-2 text-sm font-semibold transition',
                      toneForNode(root.type).border,
                      toneForNode(root.type).bg,
                      toneForNode(root.type).text,
                      selected.nodeId === String(root.id) ? 'ring-2 ring-white/35' : 'hover:bg-white/[0.06]',
                    )}
                    onClick={() => {
                      onSelectNode(String(root.id));
                      onSelectEdge(null);
                    }}
                    title={root.label}
                  >
                    {root.label}
                  </button>
                ) : (
                  <div className="text-sm text-white/60">No nodes yet.</div>
                )}
              </div>

              <div className="mt-4 grid gap-3 lg:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-black/15 p-3">
                  <div className="flex items-center gap-2 text-[11px] font-semibold tracking-[0.16em] text-white/55">
                    <GitBranch className="h-3.5 w-3.5" />
                    CATALYSTS
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {data.branch.events.slice(0, 6).length ? (
                      data.branch.events.slice(0, 6).map((id) => {
                        const node = data.nodeById.get(id);
                        if (!node) return null;
                        return (
                          <button
                            key={`cat_${id}`}
                            type="button"
                            className={cn(
                              'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition',
                              toneForNode('event').border,
                              toneForNode('event').bg,
                              toneForNode('event').text,
                            )}
                            onClick={() => {
                              onSelectNode(id);
                              onSelectEdge(null);
                            }}
                            title={node.label}
                          >
                            <span className="max-w-[200px] truncate">{node.label}</span>
                          </button>
                        );
                      })
                    ) : (
                      <div className="text-sm text-white/55">No events yet.</div>
                    )}
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/15 p-3">
                  <div className="flex items-center gap-2 text-[11px] font-semibold tracking-[0.16em] text-white/55">
                    <Layers className="h-3.5 w-3.5" />
                    CHANNELS
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {data.channelOrder.length ? (
                      data.channelOrder.slice(0, 6).map((type) => {
                        const meta = edgeTypeMeta(type);
                        const best = data.strongestEdgeByType.get(type);
                        return (
                          <button
                            key={`ch_${type}`}
                            type="button"
                            className={cn(
                              'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition hover:brightness-110',
                              meta.chip,
                              selected.edgeId && best?.id === selected.edgeId ? 'ring-2 ring-white/25' : '',
                            )}
                            onClick={() => {
                              if (!best) return;
                              onSelectEdge(best.id);
                              onSelectNode(best.from);
                            }}
                            title={best ? `Best edge confidence ${formatPct(best.confidence)}` : meta.label}
                          >
                            <span>{meta.label}</span>
                            <span className="mono opacity-80">{data.channelCounts[type]}</span>
                          </button>
                        );
                      })
                    ) : (
                      <div className="text-sm text-white/55">No channel edges yet.</div>
                    )}
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/15 p-3">
                  <div className="flex items-center gap-2 text-[11px] font-semibold tracking-[0.16em] text-white/55">
                    <Sparkles className="h-3.5 w-3.5" />
                    IMPACT
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {data.impactHighlights.length ? (
                      data.impactHighlights.slice(0, 6).map((id) => {
                        const node = data.nodeById.get(id);
                        if (!node) return null;
                        return (
                          <button
                            key={`impact_${id}`}
                            type="button"
                            className={cn(
                              'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition',
                              toneForNode(node.type).border,
                              toneForNode(node.type).bg,
                              toneForNode(node.type).text,
                            )}
                            onClick={() => {
                              onSelectNode(id);
                              onSelectEdge(null);
                            }}
                            title={node.label}
                          >
                            <span className="max-w-[200px] truncate">{node.label}</span>
                          </button>
                        );
                      })
                    ) : (
                      <div className="text-sm text-white/55">No impact nodes yet.</div>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-4 grid gap-3 lg:grid-cols-5">
                <BranchCard
                  title="Events"
                  icon={<GitBranch className="h-4 w-4" />}
                  items={data.branch.events}
                  emptyHint="No event nodes linked yet."
                  itemType="event"
                />
                <BranchCard
                  title="Actors"
                  icon={<CircleDot className="h-4 w-4" />}
                  items={data.branch.actors}
                  emptyHint="No actor nodes linked yet."
                  itemType="entity"
                />
                <BranchCard
                  title="Sources"
                  icon={<Globe className="h-4 w-4" />}
                  items={data.branch.sources}
                  emptyHint="No sources linked yet."
                  itemType="source"
                />
                <BranchCard
                  title="Spillovers"
                  icon={<Sparkles className="h-4 w-4" />}
                  items={data.branch.spillovers}
                  emptyHint="No spillover assets detected."
                  itemType="asset"
                />
                <BranchCard
                  title="Media"
                  icon={<Globe className="h-4 w-4" />}
                  items={data.branch.media}
                  emptyHint="No media nodes linked yet."
                  itemType="media"
                />
              </div>
            </div>
          </div>

          {data.threads.length ? (
            <div className="mx-auto mt-4 max-w-[980px]">
              <div className="mb-2 flex items-center justify-between gap-3">
                <div className="text-xs font-semibold tracking-[0.18em] text-white/50">NARRATIVE THREADS</div>
                <div className="text-[11px] text-white/45">
                  Source <ArrowRight className="inline h-3 w-3" /> Event <ArrowRight className="inline h-3 w-3" /> Impact
                </div>
              </div>
              <div className="space-y-2">
                {data.threads.slice(0, 10).map((thread) => {
                  const evId = thread.eventId;
                  const ev = data.nodeById.get(evId);
                  if (!ev) return null;
                  const open = Boolean(expandedEvents[evId]);
                  const kids = data.childrenByEvent.get(evId);
                  const sourceNode = thread.sourceId ? data.nodeById.get(thread.sourceId) : null;
                  const impactNode = thread.impactId ? data.nodeById.get(thread.impactId) : null;

                  return (
                    <div key={evId} className="rounded-2xl border border-white/10 bg-black/15 p-3">
                      <div className="flex items-start justify-between gap-3">
                        <button
                          type="button"
                          className={cn(
                            'flex-1 rounded-2xl border px-3 py-2 text-left transition',
                            toneForNode('event').border,
                            toneForNode('event').bg,
                            selected.nodeId === evId ? 'ring-2 ring-white/25' : 'hover:bg-white/[0.06]',
                          )}
                          onClick={() => {
                            onSelectNode(evId);
                            onSelectEdge(null);
                          }}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className={cn('font-semibold', toneForNode('event').text)}>{ev.label}</div>
                            <div className="mono text-[11px] text-white/45">
                              conf {formatPct(thread.confidence)} · ev {thread.evidenceCount}
                            </div>
                          </div>
                        </button>
                        <button
                          type="button"
                          className="h-10 w-10 rounded-xl border border-white/10 bg-white/[0.03] text-white/60 transition hover:bg-white/[0.06]"
                          onClick={() => setExpandedEvents((p) => ({ ...p, [evId]: !p[evId] }))}
                          aria-label={open ? 'Collapse event' : 'Expand event'}
                        >
                          {open ? <ChevronDown className="mx-auto h-4 w-4" /> : <ChevronRight className="mx-auto h-4 w-4" />}
                        </button>
                      </div>

                      <div className="mt-2 rounded-xl border border-white/10 bg-white/[0.03] p-2">
                        <div className="flex flex-wrap items-center gap-1.5 text-xs">
                          <button
                            type="button"
                            className={cn(
                              'max-w-[220px] truncate rounded-full border px-2.5 py-1 text-left',
                              sourceNode ? `${toneForNode(sourceNode.type).border} ${toneForNode(sourceNode.type).bg} ${toneForNode(sourceNode.type).text}` : 'border-white/10 bg-white/[0.05] text-white/65',
                            )}
                            onClick={() => {
                              if (!thread.sourceId) return;
                              onSelectNode(thread.sourceId);
                              onSelectEdge(null);
                            }}
                            disabled={!thread.sourceId}
                            title={sourceNode?.label || 'No source link'}
                          >
                            {sourceNode?.label || 'No source'}
                          </button>
                          <ArrowRight className="h-3.5 w-3.5 text-white/45" />
                          <button
                            type="button"
                            className={cn(
                              'max-w-[240px] truncate rounded-full border px-2.5 py-1 text-left',
                              toneForNode('event').border,
                              toneForNode('event').bg,
                              toneForNode('event').text,
                            )}
                            onClick={() => {
                              onSelectNode(evId);
                              onSelectEdge(null);
                            }}
                            title={ev.label}
                          >
                            {ev.label}
                          </button>
                          <ArrowRight className="h-3.5 w-3.5 text-white/45" />
                          <button
                            type="button"
                            className={cn(
                              'max-w-[220px] truncate rounded-full border px-2.5 py-1 text-left',
                              impactNode ? `${toneForNode(impactNode.type).border} ${toneForNode(impactNode.type).bg} ${toneForNode(impactNode.type).text}` : 'border-white/10 bg-white/[0.05] text-white/65',
                            )}
                            onClick={() => {
                              if (!thread.impactId) return;
                              onSelectNode(thread.impactId);
                              onSelectEdge(null);
                            }}
                            disabled={!thread.impactId}
                            title={impactNode?.label || 'No impact link'}
                          >
                            {impactNode?.label || 'No impact'}
                          </button>
                        </div>
                      </div>

                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        {(['mentions', 'hypothesis', 'co_moves', 'same_story'] as GraphEdge['type'][])
                          .filter((type) => thread.relationCounts[type] > 0)
                          .map((type) => {
                            const meta = edgeTypeMeta(type);
                            const edge = thread.bestEdgeByType[type];
                            return (
                              <button
                                key={`${evId}_${type}`}
                                type="button"
                                className={cn(
                                  'inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] transition hover:brightness-110',
                                  meta.chip,
                                  edge?.id && selected.edgeId === edge.id ? 'ring-2 ring-white/25' : '',
                                )}
                                onClick={() => {
                                  if (!edge) return;
                                  onSelectNode(evId);
                                  onSelectEdge(edge.id);
                                }}
                                title={edge ? `Edge confidence ${formatPct(edge.confidence)}` : meta.label}
                              >
                                <span>{meta.label}</span>
                                <span className="mono opacity-80">{thread.relationCounts[type]}</span>
                              </button>
                            );
                          })}
                      </div>

                      {open ? (
                        <div className="mt-3 grid gap-3 lg:grid-cols-4">
                          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-3">
                            <div className="text-[11px] font-semibold tracking-[0.18em] text-white/45">SOURCES</div>
                            <div className="mt-2 space-y-2">
                              {kids?.sources.length ? kids.sources.map((id) => renderNodeChip(id, 'source')) : <div className="text-sm text-white/60">None</div>}
                            </div>
                          </div>
                          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-3">
                            <div className="text-[11px] font-semibold tracking-[0.18em] text-white/45">ACTORS</div>
                            <div className="mt-2 space-y-2">
                              {kids?.actors.length ? kids.actors.map((id) => renderNodeChip(id, 'entity')) : <div className="text-sm text-white/60">None</div>}
                            </div>
                          </div>
                          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-3">
                            <div className="text-[11px] font-semibold tracking-[0.18em] text-white/45">ASSETS</div>
                            <div className="mt-2 space-y-2">
                              {kids?.assets.length ? kids.assets.map((id) => renderNodeChip(id, 'asset')) : <div className="text-sm text-white/60">None</div>}
                            </div>
                          </div>
                          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-3">
                            <div className="text-[11px] font-semibold tracking-[0.18em] text-white/45">MEDIA</div>
                            <div className="mt-2 space-y-2">
                              {kids?.media.length ? kids.media.map((id) => renderNodeChip(id, 'media')) : <div className="text-sm text-white/60">None</div>}
                            </div>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

