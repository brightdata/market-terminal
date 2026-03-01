Bright Data Signal Terminal (demo)

## Getting Started

1. Install deps:

```bash
npm install
```

2. Configure env:

```bash
cp .env.example .env.local
```

Fill in:
- Bright Data: `BRIGHTDATA_API_TOKEN` (and optionally `BRIGHTDATA_WEB_UNLOCKER_ZONE`)
- Optional: `BRIGHTDATA_SERP_ZONE` if you want a separate SERP zone
- AI: `OPENAI_API_KEY` or `OPENROUTER_API_KEY`
- Supabase (optional):
  - Client (public): `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY`
  - Server (recommended for writes): `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`

3. (Optional) Supabase schema:
- Run `/Users/moin/new_brightdata_demo/market-terminal/supabase/schema.sql` in the Supabase SQL editor.

4. Run:

```bash
npm run dev
```

Open `http://localhost:3000`.

## Backend endpoints

- `GET /api/videos?topic=Bitcoin` (polls videos; Bright Data-enabled if configured)
- `GET /api/serp?q=Bitcoin&format=light` (debug endpoint for SERP retrieval)
- `POST /api/run` (SSE) streams pipeline events. Example:

```bash
curl -N -X POST http://localhost:3000/api/run \
  -H 'content-type: application/json' \
  -d '{"topic":"Bitcoin","mode":"fast","serpFormat":"light"}'
```

Notes:
- `ALLOW_CLIENT_API_KEYS=true` enables sending `apiKey` in the request body for local demos. Do not enable that for production.
