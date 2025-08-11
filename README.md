# VoteTrace

Next.js TypeScript app for civic transparency: representative lookup, voting records, and campaign finance. See `VoteTrace_PRD.md` and `TODO.md`.

## Quick start (local)
1. Copy environment config:
   - Review `ENVIRONMENT.md` for all variables.
   - Create a local `.env` with required keys. Minimal to start:
     - GOOGLE_CIVIC_API_KEY, FEC_API_KEY
      - Federal votes: GovTrack API (no key) with source links to House Clerk and Senate roll calls
     - Optional state votes (preferred direct source):
        - OPEN_NY_LEG_API_KEY (New York Open Legislation) and OPEN_NY_LEG_API_BASE (defaults to `https://legislation.nysenate.gov/api/3`)
        - OPENSTATES_API_KEY (fallback aggregation), OPENSTATES_API_BASE, OPENSTATES_GRAPHQL_ENDPOINT (if your key has GraphQL access via Plural)
   - Use `NEXT_PUBLIC_SITE_URL` for the site origin.
2. Install deps and run:
   - `npm install`
   - `npm run dev` → http://localhost:3000

## Deployment
- Vercel/Node host: deploy the Next.js app and set required environment variables. Uses your Supabase database; no local Docker required.
- Optional: containerize if you prefer (Fly.io/Railway/Render). Not required for the current feature set.

Required env (see `ENVIRONMENT.md`):
- GOOGLE_CIVIC_API_KEY
- FEC_API_KEY (for finance)
- DATABASE_URL or POSTGRES_URL (Postgres)
- Optional state votes: OPEN_NY_LEG_API_KEY (direct NY), OPENSTATES_API_KEY (fallback)
- OPENSTATES_GRAPHQL_ENDPOINT if using Plural GraphQL
- REDIS_URL (future caching/jobs)

## Scripts
- `npm run dev` – start dev server
- `npm run build` – production build
- `npm start` – run production
- `npm run lint` – lint
- `npm run typecheck` – TypeScript check

### Data sources
- Address → officials: Google Civic Information API (deprecated reps endpoint can 404; we include fallbacks via Census geocoder + GovTrack/OpenStates)
- Federal votes: GovTrack recent votes for person; linkouts to House Clerk and Senate roll calls
- State votes: Prefer direct legislature APIs (currently New York Open Legislation); fallback to OpenStates (GraphQL/REST) when enabled; final fallback is a recent-jurisdiction heuristic
- Campaign finance: FEC API (committees, totals, top contributors)

### Caching & quotas
- Supabase-backed cache is optional. When enabled, the API stores state vote events and tracks a daily upstream budget via `ApiQuota` to respect provider limits (e.g., OpenStates 500/day). If the DB is unreachable, endpoints still return results without caching.

### Supabase connectivity
- For migrations, Prisma requires a direct connection (5432). If your network blocks 5432, paste the SQL in README/TODO into the Supabase SQL editor to create tables.
- For runtime in restricted networks, use the Transaction Pooler URL (usually port 6543) and append `?sslmode=require&pgbouncer=true&connection_limit=1`.


