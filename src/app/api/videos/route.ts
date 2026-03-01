import { NextResponse } from 'next/server';

import { brightDataSerpZone, env } from '@/lib/env';
import { brightDataSerpGoogle, type SerpResult } from '@/lib/brightdata';
import { createLogger } from '@/lib/log';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type VideoItem = {
  id: string;
  title: string;
  url: string;
  channel: string;
  thumbnail: string;
  provider: 'YouTube';
};

type VideosResponse = {
  topic: string;
  fetchedAt: number;
  mode: 'brightdata' | 'mock';
  items: VideoItem[];
  error?: string;
};

function isVideoId(id: string) {
  return /^[A-Za-z0-9_-]{11}$/.test(id);
}

function canonicalYouTubeUrlFromId(id: string) {
  return `https://www.youtube.com/watch?v=${id}`;
}

function extractYouTubeVideoIdFromUrl(rawUrl: string) {
  try {
    const url = new URL(rawUrl);

    // Some results may be YouTube redirect links.
    if (url.hostname === 'www.youtube.com' && url.pathname === '/redirect') {
      const q = url.searchParams.get('q');
      if (q && /^https?:\/\//i.test(q)) return extractYouTubeVideoIdFromUrl(q);
    }

    // youtu.be/<id>
    if (url.hostname === 'youtu.be') {
      const id = url.pathname.replace(/^\//, '').slice(0, 11);
      return isVideoId(id) ? id : null;
    }

    // youtube.com/watch?v=<id>
    if (url.hostname.endsWith('youtube.com')) {
      if (url.pathname === '/watch') {
        const id = url.searchParams.get('v') || '';
        return isVideoId(id) ? id : null;
      }
      // youtube.com/shorts/<id>
      const shorts = url.pathname.match(/^\/shorts\/([A-Za-z0-9_-]{11})/i)?.[1] || '';
      return isVideoId(shorts) ? shorts : null;
    }
  } catch {
    // ignore
  }
  return null;
}

function uniqueSerp(results: SerpResult[], limit: number) {
  const seen = new Set<string>();
  const out: SerpResult[] = [];
  for (const r of results) {
    const key = r.url || '';
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(r);
    if (out.length >= limit) break;
  }
  return out;
}

async function fetchYouTubeOEmbed(url: string) {
  const endpoint = `https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(url)}`;
  const resp = await fetch(endpoint, { cache: 'no-store' });
  if (!resp.ok) throw new Error(`oEmbed failed (${resp.status})`);
  return (await resp.json()) as { title?: string; author_name?: string; thumbnail_url?: string };
}

function mockItems(topic: string): VideoItem[] {
  const q = encodeURIComponent(`${topic} market news analysis`);
  const searchUrl = `https://www.youtube.com/results?search_query=${q}`;
  return [
    { id: 'mock_1', title: `Latest: ${topic} tape recap`, channel: 'Video Pulse' },
    { id: 'mock_2', title: `Explainer: what moved ${topic} today`, channel: 'Video Pulse' },
    { id: 'mock_3', title: `Cross-asset: ${topic} spillovers`, channel: 'Video Pulse' },
  ].map((v) => ({
    id: v.id,
    title: v.title,
    channel: v.channel,
    url: searchUrl,
    thumbnail: '',
    provider: 'YouTube',
  }));
}

export async function GET(request: Request) {
  const reqId = crypto.randomUUID();
  const log = createLogger({ reqId, route: '/api/videos' });
  const startedAt = Date.now();

  const url = new URL(request.url);
  const topic = (url.searchParams.get('topic') || url.searchParams.get('q') || '').trim();
  if (!topic) {
    log.warn('videos.bad_request', { ms: Date.now() - startedAt });
    return NextResponse.json(
      { error: 'Missing ?topic=' },
      { status: 400 },
    );
  }

  const token = env.brightdata.token;
  const zone = brightDataSerpZone();

  const fetchedAt = Date.now();
  const rawLimit = Number.parseInt(url.searchParams.get('limit') || '', 10);
  const limit = Number.isFinite(rawLimit) ? Math.max(1, Math.min(8, rawLimit)) : 6;

  if (!token) {
    const payload: VideosResponse = {
      topic,
      fetchedAt,
      mode: 'mock',
      items: mockItems(topic).slice(0, limit),
      error: 'BRIGHTDATA_API_TOKEN (or API_TOKEN) not set; returning mock videos.',
    };
    log.warn('videos.mock', { topic: topic.slice(0, 80), limit, ms: Date.now() - startedAt });
    return NextResponse.json(payload, { status: 200 });
  }

  try {
    log.info('videos.request', { topic: topic.slice(0, 80), limit, zone });
    const queries = [
      `site:youtube.com/watch ${topic} market news analysis`,
      `site:youtube.com/watch ${topic} breaking news today`,
    ];

    let serp: SerpResult[] = [];
    for (const q of queries) {
      const results = await brightDataSerpGoogle({ query: q, format: 'light_json_google' });
      serp = serp.concat(results);
    }

    const picked = uniqueSerp(serp, Math.max(12, limit * 3));
    const ids = picked
      .map((r) => ({ id: extractYouTubeVideoIdFromUrl(r.url), title: r.title }))
      .filter((v): v is { id: string; title: string } => Boolean(v.id))
      .slice(0, limit);

    const oembeds = await Promise.allSettled(
      ids.map(async (v) => {
        const url = canonicalYouTubeUrlFromId(v.id);
        const meta = await fetchYouTubeOEmbed(url);
        return {
          id: v.id,
          title: meta.title || v.title || url,
          url,
          channel: meta.author_name || 'YouTube',
          thumbnail: meta.thumbnail_url || `https://i.ytimg.com/vi/${v.id}/hqdefault.jpg`,
          provider: 'YouTube' as const,
        } satisfies VideoItem;
      }),
    );

    const items = oembeds
      .filter((r): r is PromiseFulfilledResult<VideoItem> => r.status === 'fulfilled')
      .map((r) => r.value)
      .slice(0, limit);

    const ok = items.length > 0;
    const payload: VideosResponse = {
      topic,
      fetchedAt,
      mode: ok ? 'brightdata' : 'mock',
      items: ok ? items : mockItems(topic).slice(0, limit),
      ...(ok ? {} : { error: 'No YouTube items extracted from SERP; returning mock videos.' }),
    };
    log.info('videos.response', { mode: payload.mode, count: payload.items.length, ms: Date.now() - startedAt });
    return NextResponse.json(payload, { status: 200 });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    const payload: VideosResponse = {
      topic,
      fetchedAt,
      mode: 'mock',
      items: mockItems(topic).slice(0, limit),
      error: message,
    };
    log.error('videos.error', { message, ms: Date.now() - startedAt });
    return NextResponse.json(payload, { status: 200 });
  }
}
