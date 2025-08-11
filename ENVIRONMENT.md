# Environment Variables

Copy these into `.env` for local development or configure them in your deployment provider.

Required
- NODE_ENV=development
- NEXT_PUBLIC_SITE_URL=http://localhost:3000
- GOOGLE_CIVIC_API_KEY=your_key
- CONGRESS_GOV_API_KEY=your_key (data.gov API key for api.congress.gov)
- FEC_API_KEY=your_key
- DATABASE_URL=postgresql://postgres:postgres@localhost:5432/votetrace?schema=public
  - Alternatively set POSTGRES_URL; the app maps it to DATABASE_URL at runtime
- REDIS_URL=redis://localhost:6379

Optional
- MAPBOX_TOKEN=
- S3_ENDPOINT=
- S3_REGION=
- S3_BUCKET=
- S3_ACCESS_KEY_ID=
- S3_SECRET_ACCESS_KEY=
- OPENSTATES_API_KEY=
- OPENSTATES_API_BASE=https://v3.openstates.org
- FIVE_CALLS_API_BASE=   # e.g. https://5calls.org/representatives
- SUPABASE_URL=
- SUPABASE_ANON_KEY=
- SUPABASE_SERVICE_ROLE_KEY=


