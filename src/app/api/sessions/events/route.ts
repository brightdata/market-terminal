import { NextResponse } from 'next/server';
import { z } from 'zod';

import { hasConvex } from '@/lib/env';
import { getConvexClient, api } from '@/lib/convex/server';
import { createLogger } from '@/lib/log';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const QuerySchema = z.object({
  sessionId: z.string().uuid(),
  limit: z.coerce.number().int().min(1).max(800).optional().default(250),
});

export async function GET(request: Request) {
  const reqId = crypto.randomUUID();
  const log = createLogger({ reqId, route: '/api/sessions/events' });
  const startedAt = Date.now();

  const url = new URL(request.url);
  const parsed = QuerySchema.safeParse({
    sessionId: url.searchParams.get('sessionId') || url.searchParams.get('id') || '',
    limit: url.searchParams.get('limit') || undefined,
  });

  if (!parsed.success) {
    log.warn('sessions.events.bad_request', { ms: Date.now() - startedAt });
    return NextResponse.json({ error: 'Missing or invalid ?sessionId=' }, { status: 400 });
  }

  if (!hasConvex()) {
    log.warn('sessions.events.missing_convex', { ms: Date.now() - startedAt });
    return NextResponse.json({ error: 'Convex not configured' }, { status: 400 });
  }

  const convex = getConvexClient();
  if (!convex) {
    log.warn('sessions.events.missing_convex_client', { ms: Date.now() - startedAt });
    return NextResponse.json({ error: 'Convex not configured' }, { status: 400 });
  }

  const { sessionId, limit } = parsed.data;

  const session = await convex.query(api.sessions.get, { sessionId });
  if (!session) {
    log.warn('sessions.events.session_not_found', { sessionId, ms: Date.now() - startedAt });
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }

  let events: any[];
  try {
    events = await convex.query(api.sessionEvents.list, { sessionId, limit });
  } catch (e: any) {
    log.error('sessions.events.events_fetch_failed', { sessionId, error: e?.message, ms: Date.now() - startedAt });
    return NextResponse.json({ error: e?.message || 'fetch failed' }, { status: 500 });
  }

  log.info('sessions.events.ok', { sessionId, events: events.length, ms: Date.now() - startedAt });

  return NextResponse.json(
    {
      session: {
        id: session.sessionId,
        created_at: new Date(session._creationTime).toISOString(),
        topic: session.topic,
        status: session.status,
        step: session.step,
        progress: session.progress,
        meta: session.meta,
      },
      events,
    },
    { status: 200 },
  );
}

