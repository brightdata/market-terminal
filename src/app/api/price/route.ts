import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Cached = { fetchedAt: number; body: any };
const cache = new Map<string, Cached>();
const TTL_MS = 45_000;

function normalizeTopic(raw: string) {
  const s = (raw || '').trim();
  const lower = s.toLowerCase();

  if (/\b(btc|bitcoin)\b/.test(lower)) return { id: 'bitcoin', label: 'BTC' };
  if (/\b(eth|ethereum)\b/.test(lower)) return { id: 'ethereum', label: 'ETH' };
  if (/\b(sol|solana)\b/.test(lower)) return { id: 'solana', label: 'SOL' };
  if (/\b(xau|gold)\b/.test(lower)) return { id: 'pax-gold', label: 'XAU (proxy)' };

  // Unknown topic (stocks, DXY, etc) -> no live series yet.
  return null;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const topic = url.searchParams.get('topic') || url.searchParams.get('symbol') || 'Bitcoin';
  const norm = normalizeTopic(topic);

  if (!norm) {
    return NextResponse.json(
      {
        ok: false,
        topic,
        provider: 'unsupported',
        fetchedAt: Date.now(),
        series: [],
        timestamps: [],
        error: 'No live price provider mapped for this topic yet.',
      },
      { status: 200 },
    );
  }

  const key = `${norm.id}:usd:1d`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.fetchedAt < TTL_MS) {
    return NextResponse.json(hit.body, { status: 200 });
  }

  try {
    // CoinGecko has tightened interval controls over time; `interval=hourly` may be enterprise-only.
    // Omitting `interval` still returns a usable 24h series at an allowed granularity.
    const cgUrl = `https://api.coingecko.com/api/v3/coins/${encodeURIComponent(norm.id)}/market_chart?vs_currency=usd&days=1`;
    const resp = await fetch(cgUrl, {
      cache: 'no-store',
      headers: {
        'user-agent': 'market-terminal/price',
        accept: 'application/json',
      },
    });

    if (!resp.ok) {
      const text = await resp.text().catch(() => '');
      return NextResponse.json(
        {
          ok: false,
          topic,
          provider: 'coingecko',
          fetchedAt: Date.now(),
          series: [],
          timestamps: [],
          error: text ? `CoinGecko error (${resp.status}): ${text.slice(0, 240)}` : `CoinGecko error (${resp.status})`,
        },
        { status: 200 },
      );
    }

    const data = (await resp.json().catch(() => null)) as any;
    const prices: Array<[number, number]> = Array.isArray(data?.prices) ? data.prices : [];
    const timestamps = prices.map((p) => Number(p?.[0])).filter((n) => Number.isFinite(n));
    const series = prices.map((p) => Number(p?.[1])).filter((n) => Number.isFinite(n));

    const body = {
      ok: Boolean(series.length),
      topic,
      symbol: norm.label,
      provider: 'coingecko',
      fetchedAt: Date.now(),
      series,
      timestamps,
      last: series.length ? series[series.length - 1] : null,
    };
    cache.set(key, { fetchedAt: Date.now(), body });
    return NextResponse.json(body, { status: 200 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Price fetch failed';
    return NextResponse.json(
      {
        ok: false,
        topic,
        provider: 'coingecko',
        fetchedAt: Date.now(),
        series: [],
        timestamps: [],
        error: msg,
      },
      { status: 200 },
    );
  }
}
