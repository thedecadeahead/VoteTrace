# VoteTrace MVP – Build Plan

This TODO tracks all steps to deliver a functional MVP of VoteTrace based on `VoteTrace_PRD.md`. It’s organized by phases with clear acceptance criteria. A “What I need from you” section is at the end.

## Phase 0 — Repo, Infra, and Scaffolding
- [x] Initialize monolith app with Next.js (App Router, TypeScript), Tailwind, ESLint
  - Note: config is `next.config.mjs` (ESM). TypeScript config auto-adjusted by Next.
- [x] Create API routes for server-side fetches with key management via env vars
  - Implemented `/api/representatives` using Google Civic API (requires `GOOGLE_CIVIC_API_KEY`).
- [x] Add Dockerfile and docker-compose (app + Postgres + Redis)
- [x] Add GitHub Actions workflow (build, typecheck, lint) and preview deploy instructions
- [x] Add basic README with local/dev/prod instructions and environment variables

Acceptance:
- [ ] `docker compose up` runs app at http://localhost:3000
- [ ] CI passes on push (workflow added; local build/lint/typecheck passing)

## Phase 1 — Core UX: Address → Representatives (All Levels where available)
- [x] Home page with address input + “Use my location” (geolocation) option
  - Note: reverse-geocoding for coordinates is pending (address-only works now).
- [x] API endpoint integrating Google Civic Information API to resolve officials for address
- [x] Results page listing officials by level: Federal → State → County → City/Municipal → Special Districts (if present)
- [ ] Representative profile page scaffold (name, office, district, party, contact links)
- [ ] Basic analytics (page view) and SEO meta

Acceptance:
- [ ] Entering an address shows a list of officials with: name, office, party, district, contact links

## Phase 2 — Federal Voting Records (initial scope)
- [x] Federally elected official → resolve via GovTrack; show recent votes
- [x] Link each vote to official roll call on House Clerk/Senate site (source_url)
- [ ] Fetch bill metadata/details from Congress.gov (via data.gov key) and link vote → bill page (MVP later)

Acceptance:
- [ ] Federal officials show at least the last 20 votes
- [ ] Each vote links to a Bill page with minimal bill metadata

## Phase 3 — Campaign Finance (initial scope)
- [x] Resolve FEC candidate/committee via FEC API; totals and top contributors
- [ ] Add filing/source linkouts and disclaimer copy

Acceptance:
- [ ] Finance tab renders totals and top 10 contributors for the latest cycle
- [ ] Each row links to FEC filing/source

## Phase 4 — Bill Pages and Archival Skeleton
- [ ] Bill page canonical URL structure: `/bill/{jurisdiction}/{billId}`
- [ ] Embed original text (when available via upstream URL) and provide download link
- [ ] Archival skeleton: interface to mirror PDF/HTML to S3 and submit to Wayback (stubbed for MVP)
- [ ] Summaries UI slots: synopsis + plain-language explanation (static placeholder text for MVP)

Acceptance:
- [ ] Bill pages load with metadata, link to primary text, and permanent VoteTrace URL

## Phase 5 — Search & Filters (MVP scope)
- [ ] Global search field for officials and bills (federally scoped for MVP)
- [ ] Basic filters: chamber, outcome, date range (votes)

Acceptance:
- [ ] Searching returns matching people/bills; selecting navigates to pages above

## Phase 6 — Persistence & Caching (MVP minimal)
- [x] Add Postgres via Prisma; added `OpenStatesPerson`, `VoteEvent`, `ApiQuota` for state vote caching
- [x] SQL provided for creating tables via Supabase SQL Editor (works without 5432)
- [ ] Redis-backed caching for upstream API results and rate limit budget
- [ ] Background job skeleton (BullMQ) for deferred archival and cache warming

Acceptance:
- [ ] Cold path hits upstream; hot path serves cached responses within TTL
- [ ] Jobs can be enqueued and completed locally

## Phase 7 — Accessibility, Performance, and Polishing
- [ ] WCAG 2.1 AA checks; keyboard navigation; color contrast; aria labels
- [ ] Basic loading states, error boundaries, empty states
- [ ] Lighthouse ≥ 90 for performance/accessibility on key routes

Acceptance:
- [ ] Accessibility and performance checks recorded in CI logs

## Phase 8 — Deployment
- [x] Provide two deployment options:
  - Containerized deploy (e.g., Fly.io/Railway/Dokku) with Postgres + Redis add-ons
  - Vercel for frontend + a small container service for API/worker if needed
- [x] Provisioning notes and variables documented in README

Acceptance:
- [ ] App deployed to a public URL with working address → officials → votes → finance flow for federal

---

## Non-goals for MVP (explicitly out of scope)
- NLP summarization and editorial workflow (slots and structure only)
- Full archival automation and dedup/versioning (stub only)
- Notifications and saved searches (skeleton only)
- NLP summarization and editorial workflow (slots and structure only)
- Full archival automation and dedup/versioning (stub only)
- Notifications and saved searches (skeleton only)

---

## What I need from you
- API keys and quotas:
  - Google Civic Information API key
  - data.gov API key (Congress.gov)
  - FEC API key
  - Optional: OpenStates API key (state-level)
  - Optional: OPEN_NY_LEG_API_KEY (New York Open Legislation) for direct state votes
  - Mapbox or MapTiler token (if maps)
- Hosting decision: prefer one of Fly.io, Railway, Render, or your AWS account
- Object storage provider (for future archival): AWS S3 or Backblaze B2
- Branding assets: logo, color palette (or approval to use a neutral accessible palette)
- Copy approvals:
  - Homepage hero text and disclaimers
  - Finance data disclaimer
- Domain (e.g., votetrace.org) and DNS access (for TLS/HTTPS)

---

## Fast-Track Checklist (happy path)
- [ ] Provide API keys and hosting choice
- [ ] Run `docker compose up` to validate local environment
- [ ] Approve homepage copy/colors
- [ ] Choose deployment target and provision DB/Redis
- [ ] Deploy and verify public URL

---

## Recently completed
- Added dark mode toggle and site-wide dark styles
- State votes pipeline:
  - Prefer direct legislature APIs (NY implemented). Fallback to OpenStates where available.
  - Optional Supabase cache with daily budget; tolerant of DB/network unavailability.


