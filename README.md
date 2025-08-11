# VoteTrace

Next.js TypeScript app for civic transparency: representative lookup, voting records, and campaign finance. See `VoteTrace_PRD.md` and `TODO.md`.

## Quick start (local)
1. Copy environment config:
   - Review `ENVIRONMENT.md` for all variables.
   - Create a local `.env` with required keys. Minimal to start:
     - GOOGLE_CIVIC_API_KEY, FEC_API_KEY
     - For federal votes we use GovTrack (no key) with links to House Clerk/Senate roll calls
     - Optional state votes (preferred direct source):
       - OPEN_NY_LEG_API_KEY (New York Open Legislation) and OPEN_NY_LEG_API_BASE (defaults to `https://legislation.nysenate.gov/api/3`)
       - OPENSTATES_API_KEY (fallback), OPENSTATES_API_BASE, OPENSTATES_GRAPHQL_ENDPOINT (if your key has GraphQL access)
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

### Notes on state votes and caching
- State votes prefer direct legislature APIs (e.g., New York Open Legislation). When available, we query the state API first.
- Fallbacks: OpenStates GraphQL (if enabled), then REST variants. Finally, a recent-jurisdiction heuristic.
- Supabase-backed cache (optional at runtime): If DATABASE_URL is set and reachable, we upsert person/vote events and enforce a daily budget via `ApiQuota`. If the DB is not reachable, the API continues without caching.

### Supabase connectivity
- For migrations, Prisma requires a direct connection (5432). If your network blocks 5432, paste the SQL in README/TODO into the Supabase SQL editor to create tables.
- For runtime in restricted networks, use the Transaction Pooler URL (usually port 6543) and append `?sslmode=require&pgbouncer=true&connection_limit=1`.


