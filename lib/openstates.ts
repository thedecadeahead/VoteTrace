const BASE = process.env.OPENSTATES_API_BASE || 'https://v3.openstates.org'

type QueryParams = Record<string, string | number | boolean | undefined>

function buildUrl(path: string, params: QueryParams = {}): string {
  const apiKey = process.env.OPENSTATES_API_KEY
  if (!apiKey) throw new Error('Missing OPENSTATES_API_KEY')
  const url = new URL(`${BASE}${path}`)
  url.searchParams.set('apikey', apiKey)
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined) continue
    url.searchParams.set(k, String(v))
  }
  return url.toString()
}

export async function openStatesFetch<T = unknown>(path: string, params: QueryParams = {}): Promise<T> {
  const url = buildUrl(path, params)
  const res = await fetch(url, { next: { revalidate: 600 } })
  if (!res.ok) throw new Error(`OpenStates error ${res.status}`)
  return res.json() as Promise<T>
}

export async function searchBills(params: { jurisdiction: string; q?: string; page?: number; per_page?: number }) {
  return openStatesFetch('/bills', params)
}

export async function searchPeople(params: { jurisdiction: string; name?: string; page?: number; per_page?: number }) {
  return openStatesFetch('/people', params)
}

export async function findPersonByName(jurisdiction: string, name: string): Promise<any | null> {
  try {
    const data: any = await openStatesFetch('/people', { jurisdiction, name, per_page: 10 })
    const arr = (data && (data.results || data.data)) || []
    if (!Array.isArray(arr) || arr.length === 0) return null
    // Prefer exact-ish name match ignoring case
    const lower = name.trim().toLowerCase()
    const exact = arr.find((p: any) => String(p.name || p.full_name || '').toLowerCase() === lower)
    return exact || arr[0]
  } catch {
    return null
  }
}

export async function fetchPersonVotes(personId: string, perPage = 20): Promise<any[]> {
  try {
    const data: any = await openStatesFetch(`/people/${encodeURIComponent(personId)}/votes`, { per_page: perPage })
    const arr = (data && (data.results || data.data)) || []
    return Array.isArray(arr) ? arr : []
  } catch {
    // Fallback: some deployments expose votes via /votes?people_id=
    try {
      const data2: any = await openStatesFetch(`/votes`, { people_id: personId, per_page: perPage, sort: '-date' })
      const arr2 = (data2 && (data2.results || data2.data)) || []
      return Array.isArray(arr2) ? arr2 : []
    } catch {
      return []
    }
  }
}

export async function fetchRecentSessionVotesForJurisdiction(jurisdiction: string, perPage = 50): Promise<any[]> {
  // Broad fetch for recent votes in jurisdiction; can be filtered by person client-side
  try {
    const data: any = await openStatesFetch('/votes', { jurisdiction, per_page: perPage, sort: '-date' })
    const arr = (data && (data.results || data.data)) || []
    return Array.isArray(arr) ? arr : []
  } catch {
    return []
  }
}


