const FEC_BASE = process.env.FEC_API_BASE || 'https://api.open.fec.gov/v1'

export async function fetchCandidateByName(name: string) {
  const key = process.env.FEC_API_KEY
  if (!key) throw new Error('Missing FEC_API_KEY')
  const url = new URL(`${FEC_BASE}/candidates/search/`)
  url.searchParams.set('q', name)
  url.searchParams.set('api_key', key)
  url.searchParams.set('sort', '-two_year_period')
  url.searchParams.set('per_page', '5')
  const res = await fetch(url.toString(), { next: { revalidate: 3600 } })
  if (!res.ok) return null
  return res.json()
}

export async function fetchTotalsByCommittee(committeeId: string) {
  const key = process.env.FEC_API_KEY
  if (!key) throw new Error('Missing FEC_API_KEY')
  const url = new URL(`${FEC_BASE}/committee/${committeeId}/totals/`)
  url.searchParams.set('api_key', key)
  url.searchParams.set('sort', '-cycle')
  const res = await fetch(url.toString(), { next: { revalidate: 3600 } })
  if (!res.ok) return null
  return res.json()
}

export async function fetchTopContributors(committeeId: string) {
  const key = process.env.FEC_API_KEY
  if (!key) throw new Error('Missing FEC_API_KEY')
  const url = new URL(`${FEC_BASE}/schedules/schedule_a/by_contributor/`)
  url.searchParams.set('api_key', key)
  url.searchParams.set('committee_id', committeeId)
  url.searchParams.set('sort', '-total')
  url.searchParams.set('per_page', '10')
  const res = await fetch(url.toString(), { next: { revalidate: 3600 } })
  if (!res.ok) return null
  return res.json()
}



