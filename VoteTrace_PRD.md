# VoteTrace – Product Requirements Document (PRD)
*Last updated: 2025-08-10*

## 1) Overview
**VoteTrace** is a civic transparency platform that solves two problems:
1. **Document Drift:** Government documents (bills, amendments, reports) often move into archives or disappear from their original URLs.
2. **Opaque Voting Records:** Legislative voting histories are fragmented, hard to search, and filled with jargon.

**Expanded Scope:** Add **campaign donation records** for elected officials and ensure the platform covers **all elected officials tied to a user's address**, including federal, state, county, city/municipal, and relevant special districts (e.g., school board, transit, water).

**Solution:** VoteTrace lets users enter an address or share location to instantly see **all their representatives** with **clear voting histories**, **primary-source bill texts**, **synopses**, **plain-language explanations**, and **campaign finance data** (with transparent sources and disclaimers). All source documents are **archived with permanent URLs** to prevent link rot.

---

## 2) Goals & Non-Goals
### Goals
- Provide accurate, timely **representative lookup** (federal → state → county → city/municipal → special districts).
- Show **voting history**, **sponsored/co-sponsored** legislation, and **campaign finance** data per official.
- Offer **readable summaries** and **plain-language explanations** for each bill.
- **Preserve** primary-source documents with durable links and versioning.
- Deliver fast, accessible UX (WCAG 2.1 AA), mobile-first, and SEO-friendly.

### Non-Goals (v1)
- Editorial op-eds or endorsements.
- Automated causal claims between money and votes (we explicitly avoid implying causation).
- Real-time scraping of non-public or paywalled systems.

---

## 3) Target Users
- **Civic-minded residents** who want to see how reps vote and who funds them.
- **Journalists/researchers** who need reliable legislative histories and finance records.
- **Advocacy groups** tracking issue areas and contribution patterns.
- **Educators/students** seeking plain-language explanations of legislation.

---

## 4) Core User Stories
- *As a resident, I can enter my address or share location to see **all elected officials** for my jurisdictions (federal, state, county, city, special districts) and their recent votes (where applicable).*  
- *As a user, I can open a bill page showing original text/PDF, synopsis, plain-language explanation, status timeline, and vote breakdown.*  
- *As a user, I can open an official’s profile and see **campaign donations** received by their committees, view top contributors/industries, filter by time range and election cycle, and click through to original filings.*  
- *As a researcher, I can search and filter by bill number, keywords, topic, jurisdiction, date range, outcome, and finance metrics (amounts, industries, PAC types).*  
- *As a user, I can subscribe to a representative, bill, topic, or committee and receive notifications for new actions, filings, and upcoming votes.*  
- *As a user, I can share a **permanent URL** that won’t break even if the government’s original URL changes.*

---

## 5) Feature Set
### 5.1 Representative Lookup (**All Elected Officials**)
- Inputs: **Manual address** (autocomplete) or **Geolocation API** consent.
- Jurisdiction resolution: **Federal → State → County → City/Town/Village → Special Districts** (school board, transit, utilities, water, fire, community boards where available).
- Each profile: headshot, party, district, term info, committees, contact links, office hours (when available), **finance tab** (see 5.4).  
- Coverage sources: Google Civic Information API, state/local datasets, county clerk registries, school board directories; fallback to curated datasets when APIs are absent.

### 5.2 Voting Records
- Unified vote list with filters (topic, outcome, date range).
- Clear mapping to bill pages; link to floor statements or committee reports if available.
- Show **vote context** (e.g., amendments vs. final passage) and **whip counts** (when published).

### 5.3 Bill Pages
- **Canonical, permanent URL** on VoteTrace.
- **Original bill text** (embedded viewer) + **downloadable archival copy**.
- **Synopsis** (objective summary) and **Plain-Language Explanation** (reading-level controlled).
- **Status timeline**: introduced → committee → floor → reconciliation → signed/vetoed → effective.
- **Impact highlights** and related items (amendments, companion bills, prior versions, fiscal notes).
- **Vote breakdown**: by party, by chamber; links to each rep’s vote.

### 5.4 **Campaign Finance (Donations)**
- **Official Finance Overview**: total raised/spent by cycle, cash on hand (when available), committees linked to the official.
- **Top Contributors**: by **entity** and by **industry/sector**, with filters for cycle, geography, and contribution type (individual, PAC, party, transfer).
- **Contribution Explorer**: searchable, filterable table with contributor name, employer/occupation, amount, date, committee, filing ID, and link to source document.  
- **Committee Graph**: network visualization of relationships among a candidate’s committees, PACs, and party entities.  
- **Filings & Disclosures**: timeline of filings with links to PDFs and machine-readable records; **permanent mirrors** stored by VoteTrace.
- **Correlation View (Neutral)**: side-by-side timelines of major contributions and votes on related topics—**clearly labeled as descriptive context, not causal inference**.
- **Bulk Exports**: CSV/JSON for researchers.

### 5.5 Preservation & Versioning
- On ingest, fetch and **archive** primary documents (PDF/HTML) to object storage and submit to **Wayback**.
- **Content hashing** for deduplication; **version tracking** for revised texts.
- **Health checks** to detect link rot; auto-repair with archived mirrors.

### 5.6 Notifications & Tracking
- Follow **reps, bills, committees, topics, jurisdictions**.
- Delivery: email and in-app notifications (push later).
- Digest choices: immediate, daily, weekly.
- Finance-specific alerts: new filing posted, large contribution above threshold, new PAC link detected.

### 5.7 Search & Discovery
- Global search across reps, bills, topics, and finance records.
- Advanced filters: chamber, status, sponsor, cosponsors, committee, date range, outcome, **donation amount ranges**, **industry**, **committee**, **contributor geography**.
- Saved searches.

### 5.8 Plain-Language Pipeline
- NLP-assisted drafting with **editorial review** for neutrality.
- Reading level checks; glossary hover-cards for defined terms.
- Change audit trail on each revision.

---

## 6) Data Sources (initial US focus)
- **Representative & Voting Data**
  - ProPublica Congress API; GovTrack; Congress.gov (where accessible).
  - OpenStates (state-level); state legislature portals; municipal open data portals.
  - Google Civic Information API (address → officials mapping).
  - US Census Geocoder/TIGER for districting; state shapefiles.

- **Campaign Finance**
  - **Federal**: FEC API (candidate committees, PACs, receipts/disbursements, filings).  
  - **State**: state campaign finance portals/APIs (varies by state).  
  - **Aggregators/Nonprofits**: OpenSecrets (CRP), FollowTheMoney (NIMP)—subject to licenses/attribution.  
  - **Local**: county/municipal portals (where available), clerk/board of elections filings.

- **Archival**
  - Internet Archive Wayback Machine API; internal object storage (S3-compatible) with lifecycle policies.

> Notes: respect each source’s TOS and rate limits; cache and normalize snapshots to reduce dependence and ensure reproducibility.

---

## 7) Technical Stack
### Frontend
- **Framework**: Next.js (App Router, SSR/SSG, SEO) — TypeScript
- **UI**: Tailwind CSS + shadcn/ui; Headless UI; charting via Recharts; network graphs via vis-network or d3-force
- **State/Data**: TanStack Query; URQL/Apollo Client if GraphQL
- **Maps/Geospatial**: MapLibre GL / Mapbox GL JS; turf.js for client-side ops
- **Accessibility**: Radix primitives; axe-core CI; WCAG 2.1 AA

### Backend
- **Runtime**: Node.js (LTS) with TypeScript
- **Framework**: Fastify (preferred) or Express
- **API Layer**: GraphQL (Apollo) for flexible joins across bills/votes/finance; REST for ingestion webhooks
- **Background Jobs**: BullMQ (Redis) for ingestion, archiving, NLP, dedupe
- **Auth**: Auth.js/NextAuth (OIDC/OAuth2); optional passwordless
- **Rate Limiting**: Redis-backed; per-API upstream budget

### Data & Storage
- **Primary DB**: PostgreSQL + **PostGIS** (district polygons & point-in-polygon)
- **Finance Schema**: optimized for high-volume FEC/state filings (partitioning by cycle/date)
- **Search**: OpenSearch/Elasticsearch (synonyms, aggregations) or Postgres + pg_trgm for MVP
- **Caching**: Redis
- **Object Storage**: S3-compatible (AWS S3/Backblaze B2) for PDFs, machine-readable dumps, and mirrors
- **Queue/Events**: Redis Streams; Kafka (phase 2 if scale demands)
- **Analytics**: PostHog/Snowplow (privacy-sensitive)

### NLP & Content Processing
- **Summarization & Simplification**: LLMs with policy guardrails
- **Readability**: Flesch-Kincaid; human-in-the-loop editor UI
- **De-dup & Entity Resolution**: contributor and committee identity resolution (fuzzy matching, EIN/FEIN, employer normalization, OpenCorporates enrichment where licensed)

### DevOps & Infra
- **Hosting**: AWS (VPC, ALB) or Fly.io; Cloudflare CDN
- **CI/CD**: GitHub Actions; preview envs via Vercel/Netlify
- **IaC**: Terraform + Terragrunt
- **Observability**: OpenTelemetry + Grafana stack; Sentry
- **Secrets**: AWS Secrets Manager/Doppler; SOPS for repo configs
- **Backups**: encrypted daily DB + object snapshots; quarterly restore drills

---

## 8) System Architecture (high level)
1. **Client (Next.js)** → **BFF/API** (Fastify) unifying reps, votes, bills, and finance.  
2. **Ingestion Workers**:  
   - Poll legislative APIs (ProPublica/OpenStates/etc.) → normalize to **Postgres** → store documents in **S3** → submit originals to **Wayback**.  
   - Poll **FEC** + state/local portals → normalize receipts/disbursements → link to **officials** via committees and candidate IDs; maintain entity resolution tables.  
3. **NLP Pipeline**: draft synopsis & plain-language explanations → editor review → publish with provenance.  
4. **Search Indexer**: updates OpenSearch; **Geo Service** (PostGIS) resolves districts by address/coords.  
5. **Notifier**: sends emails/digests for tracked reps/bills/committees/finance events.
