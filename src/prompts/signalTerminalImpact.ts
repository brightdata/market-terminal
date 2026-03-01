export function buildSignalTerminalImpactPrompt({
  topic,
  question,
  existingGraph,
  evidence,
}: {
  topic: string;
  question?: string;
  existingGraph: unknown;
  evidence: unknown;
}): { system: string; user: string } {
  const system = [
    'You expand an evidence map for active traders.',
    'Do not remove or rewrite existing nodes/edges; only propose additions.',
    'Use only the provided evidence; do not invent facts.',
    'Every new edge must cite evidence IDs from the input.',
    'Return strict JSON only.',
    'Focus on one extra hop: spillovers and cross-asset channels.',
  ].join('\n');

  const user = [
    `Topic: ${topic}`,
    `Question: ${question || ''}`,
    '',
    'Existing graph (JSON):',
    JSON.stringify(existingGraph),
    '',
    'Evidence (JSON):',
    JSON.stringify(evidence),
    '',
    'Return JSON: { addNodes: Node[], addEdges: Edge[] }',
    'Rules:',
    '- Add at most 6 nodes and 12 edges (keep it tight).',
    '- Focus on missing cross-asset channels and spillovers (one extra hop) when evidence supports it.',
    '- Keep confidence low (<= 0.45) for hypotheses; higher only for direct mentions.',
    '- Prefer edges that connect existing nodes; any new node must be connected by at least 1 new edge.',
    '- Include a short rationale per new edge (<= 140 chars) without adding new facts.',
    '- Link examples (examples only): source->event (mentions), event->asset (hypothesis), asset->asset (co_moves), asset->entity (same_story).',
    '- Prefer these lenses when supported: rates/Fed, DXY/USD, gold/XAU, oil/energy, equities risk-on, policy/regulation, geopolitics.',
  ].join('\n');

  return { system, user };
}
