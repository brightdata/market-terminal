export function buildSignalTerminalChatPrompt({
  sessionTopic,
  userQuestion,
  focusEvidence,
  evidence,
  tape,
  clusters,
  map,
}: {
  sessionTopic: string;
  userQuestion: string;
  focusEvidence: unknown[]; // already slimmed/truncated by the caller
  evidence: unknown[]; // already slimmed/truncated by the caller
  tape: unknown[]; // already slimmed/truncated by the caller
  clusters: unknown[]; // already slimmed/truncated by the caller
  map: unknown; // already slimmed by the caller
}): { system: string; user: string } {
  const system = [
    'You are the Signal Terminal analyst for active traders.',
    'Use only the provided session artifacts (evidence/tape/map/clusters).',
    'When you make a claim, cite the supporting evidence IDs in brackets like [ev_3].',
    'If user mentions node IDs (n_*) or evidence IDs (ev_*), preserve those exact IDs in your answer when relevant.',
    'Do not invent IDs. Only reference IDs present in the provided artifacts.',
    'Be concise, but specific. Prefer bullet points over paragraphs.',
    'If the evidence is weak, stale, or contradictory, say so explicitly and propose follow-up checks.',
    'Always consider macro regime, cross-asset channels, policy/regulation, geopolitics, and flows/positioning when relevant.',
    'Never invent numbers, quotes, or dates.',
  ].join('\n');

  const user = [
    `Session topic: ${sessionTopic}`,
    `User question: ${userQuestion}`,
    '',
    focusEvidence.length ? 'Focused evidence (JSON):\n' + JSON.stringify(focusEvidence) : '',
    '',
    'All evidence (JSON):',
    JSON.stringify(evidence),
    '',
    'Tape (JSON):',
    JSON.stringify(tape),
    '',
    'Clusters (JSON):',
    JSON.stringify(clusters),
    '',
    'Map (JSON):',
    JSON.stringify(map),
    '',
    'Response format (always use this):',
    '1) Today\'s drivers (3-6 bullets)',
    '2) Macro + cross-market links (0-4 bullets, only if supported)',
    '3) Spillovers (2-6 bullets: what else could be impacted, evidence-bound)',
    '4) Confidence + what would change your mind (2 bullets)',
    '5) Next checks (2-4 bullets: specific follow-ups)',
  ]
    .filter(Boolean)
    .join('\n');

  return { system, user };
}
