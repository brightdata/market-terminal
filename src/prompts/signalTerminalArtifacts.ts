export function buildSignalTerminalArtifactsPrompt({
  topic,
  evidence,
}: {
  topic: string;
  evidence: unknown;
}): { system: string; user: string } {
  const system = [
    'You are a market intelligence analyst for active traders.',
    'Use only the provided evidence items.',
    'If aiSummary exists, treat it as a compressed view of the excerpt (still evidence-bound).',
    'Output strict JSON only.',
    'Every tape item and every edge must reference evidence IDs from the input.',
    'Build an evidence map that is explorable: multiple sources, multiple events, and the key assets/entities.',
    'Avoid hallucinations: if evidence is weak or missing for an angle, mark it as weak and keep confidence low.',
    'Prefer trader utility: emphasize what changed today, why it matters, and what to watch next (evidence-bound).',
  ].join('\n');

  const user = [
    `Topic: ${topic}`,
    '',
    'Evidence (JSON):',
    JSON.stringify(evidence),
    '',
    'Return JSON with fields:',
    '- tape: [{title, source, publishedAt?, tags[], evidenceId}]',
    '- nodes: [{id, type, label}]',
    '- edges: [{id, from, to, type, confidence, evidenceIds[], rationale?}]',
    '- clusters: [{title, summary, momentum, evidenceIds[], related[]}]',
    '- assistantMessage?: short instruction for the user',
    '',
    'Constraints:',
    '- Keep nodes <= 24, edges <= 36, tape <= 12, clusters <= 6.',
    '- Node IDs should be stable and human-readable (e.g. n_btc, n_xau, n_etf).',
    '- For tape.publishedAt use unix ms timestamp when known; if uncertain, omit publishedAt (do not output null/object/text placeholders).',
    '- Include at least: 1 asset node (topic), 3 source nodes (domains from evidence.source), 4 event nodes (catalysts), and 2 entity/actor nodes when present in evidence.',
    '- Prefer a source -> event -> asset structure. Use co_moves/hypothesis edges for cross-asset links.',
    '- Ensure graph coherence: each event should connect to at least one source and at least one asset/context node when evidence supports it.',
    '- Ensure each source node connects into the map (no isolated source nodes).',
    '- When possible, include a short rationale per edge (why this link exists) without adding new facts.',
    '- If evidence suggests a channel/correlation (macro, policy, cross-asset, flows), extend the map one extra hop to show likely spillovers (add impacted assets/entities when supported; otherwise use low-confidence hypothesis edges).',
    '- Aim for 8-12 tape items when evidence allows (each must reference one evidenceId).',
    '- Aim for 2-4 clusters if the evidence supports multiple narratives.',
    '- For entity nodes, prefer named institutions/people/orgs present in evidence; avoid vague actor labels.',
    '',
    'Standard trader lenses (use tags + events when supported by evidence):',
    '- Macro: central bank policy, rates, inflation, yields, FX regime',
    '- Cross-asset: related assets/sectors/benchmarks',
    '- Policy/regulation: SEC, Treasury, sanctions, export controls, govt statements',
    '- Geopolitics/war: conflict-driven risk, supply-chain shocks',
    '- Flows/positioning: ETF flows, options, futures funding/liquidations',
    '',
    'Tagging guidance (keep tags short):',
    '- Use tags like: macro, rates, cpi, dxy, xau, flows, etf, regulation, sanctions, geopolitics, spillover, correlation, rumor, unverified',
    '- Tags should reflect the evidence category, not an opinion.',
    '',
    'Link examples (examples only, adapt to evidence):',
    '- source -> event (mentions): domain published/reported the catalyst headline',
    '- event -> asset (hypothesis/co_moves): catalyst likely affects the primary topic asset',
    '- asset -> entity (same_story): actor/institution linked to the same narrative',
    '- asset -> asset (co_moves): cross-asset regime link backed by evidence',
    '',
    'Cluster summary style:',
    '- In 2-4 sentences, describe: (1) driver, (2) channel, (3) what to watch next.',
  ].join('\n');

  return { system, user };
}

export function buildSignalTerminalArtifactsRepairPrompt({
  baseSystem,
  baseUser,
  validationErrors,
}: {
  baseSystem: string;
  baseUser: string;
  validationErrors: string;
}): { system: string; user: string } {
  const system = [
    baseSystem,
    '',
    'Your previous JSON failed validation.',
    'Return corrected JSON that matches the required schema exactly.',
    'Do not add extra keys. Keep within the stated size limits.',
  ].join('\n');

  const user = [
    baseUser,
    '',
    'Validation errors (for reference):',
    String(validationErrors || '').slice(0, 1200),
    '',
    'Now return corrected JSON only.',
  ].join('\n');

  return { system, user };
}
