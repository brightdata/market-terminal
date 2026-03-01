export function buildSignalTerminalSummariesPrompt({
  topic,
  evidenceExcerpts,
}: {
  topic: string;
  evidenceExcerpts: unknown;
}): { system: string; user: string } {
  const system = [
    'You are a market news summarizer for active traders.',
    'Use only the provided excerpts; do not invent facts.',
    'If an excerpt is low-signal (navigation/menus/price page), you may omit that item from the output.',
    'Return strict JSON only.',
    'Bullets must be factual and directly supported by the excerpt.',
  ].join('\n');

  const user = [
    `Topic: ${topic}`,
    '',
    'Evidence excerpts (JSON):',
    JSON.stringify(evidenceExcerpts),
    '',
    'Return JSON: { items: [{ id, bullets: string[2..5], entities?: string[], catalysts?: string[], sentiment?: "bullish"|"bearish"|"mixed"|"neutral", confidence?: number }] }',
    'Rules:',
    '- Write for traders: prefer concrete nouns, numbers, and named actors; avoid generic filler.',
    '- Bullets: 2..5 short factual bullets that can be traced to the excerpt.',
    '- Entities: tickers, companies, people, macro terms (Fed, CPI, yields, DXY, XAU, ETF, sanctions, war, etc) when present.',
    '- Catalysts: short phrases that describe the driver/channel (e.g. "ETF inflows", "rate cut expectations", "export controls", "liquidations").',
    '- Sentiment: reflect what the excerpt implies for price risk (not your opinion).',
    '- Confidence: 0..1 based on excerpt specificity (dates/numbers/attribution increases confidence).',
    '- If the excerpt is mostly navigation/menus, omit the item rather than guessing.',
  ].join('\n');

  return { system, user };
}
