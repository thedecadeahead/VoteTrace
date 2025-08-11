export type GovTrackRole = {
  person?: { name?: string }
  title?: string
  role_type?: string
  state?: string
  district?: number | null
  party?: string
}

async function gt(path: string): Promise<{ objects: GovTrackRole[] }> {
  const url = new URL(`https://www.govtrack.us/api/v2/${path}`)
  const res = await fetch(url.toString(), { next: { revalidate: 3600 } })
  if (!res.ok) throw new Error(`GovTrack error ${res.status}`)
  return res.json()
}

export async function fetchSenatorsByState(state: string): Promise<GovTrackRole[]> {
  const data = await gt(`role?current=true&role_type=senator&state=${encodeURIComponent(state)}`)
  return data.objects
}

export async function fetchRepresentative(state: string, district: string | number | undefined): Promise<GovTrackRole[]> {
  if (!district) return []
  const data = await gt(`role?current=true&role_type=representative&state=${encodeURIComponent(state)}&district=${encodeURIComponent(String(district))}`)
  return data.objects
}

// Person search and votes
export type GovTrackPerson = { id: number; name: string }
export async function searchPersonByNameState(name: string, state?: string): Promise<GovTrackPerson | null> {
  const url = new URL('https://www.govtrack.us/api/v2/person')
  url.searchParams.set('name', name)
  if (state) url.searchParams.set('state', state)
  const res = await fetch(url.toString(), { next: { revalidate: 3600 } })
  if (!res.ok) return null
  const data = await res.json()
  const obj = data?.objects?.[0]
  if (!obj) return null
  return { id: obj.id, name: obj.name }
}

export type GovTrackVote = {
  id: number
  created: string
  option?: { value?: string }
  vote?: { number?: number; chamber?: string; question?: string; related_bill?: { display_number?: string } }
}

export async function fetchRecentVotesForPerson(personId: number, limit = 20): Promise<GovTrackVote[]> {
  const url = new URL('https://www.govtrack.us/api/v2/vote_voter')
  url.searchParams.set('person', String(personId))
  url.searchParams.set('sort', '-created')
  url.searchParams.set('limit', String(limit))
  const res = await fetch(url.toString(), { next: { revalidate: 600 } })
  if (!res.ok) return []
  const data = await res.json()
  return (data?.objects || []).map((o: any) => ({
    id: o.id,
    created: o.created,
    option: o.option,
    vote: o.vote,
  }))
}

export async function fetchPersonDetails(personId: number): Promise<any | null> {
  const url = new URL(`https://www.govtrack.us/api/v2/person/${personId}`)
  const res = await fetch(url.toString(), { next: { revalidate: 3600 } })
  if (!res.ok) return null
  return res.json()
}

export async function fetchCommitteeMembership(personId: number): Promise<any[]> {
  const url = new URL(`https://www.govtrack.us/api/v2/committee_member`)
  url.searchParams.set('person', String(personId))
  url.searchParams.set('current', 'true')
  const res = await fetch(url.toString(), { next: { revalidate: 3600 } })
  if (!res.ok) return []
  const data = await res.json()
  return data?.objects || []
}

export function lastNameFromFull(name: string): string | null {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 0) return null
  return parts[parts.length - 1].replace(/[^a-zA-Z\-']/g, '') || null
}

export async function resolvePersonIdByHeuristic(
  name: string,
  state?: string,
  district?: string | number
): Promise<number | null> {
  const direct = await searchPersonByNameState(name, state)
  if (direct?.id) return direct.id
  if (!state) return null
  const lname = lastNameFromFull(name)?.toLowerCase()
  // Try representative by district if provided
  if (district) {
    const reps = await fetchRepresentative(state, district)
    const match = reps.find((r) => (r.person?.name || '').toLowerCase().includes(lname || ''))
    if (match && (match as any).person?.id) return (match as any).person.id
  }
  // Try senators by state
  const sens = await fetchSenatorsByState(state)
  const smatch = sens.find((r) => (r.person?.name || '').toLowerCase().includes(lname || ''))
  if (smatch && (smatch as any).person?.id) return (smatch as any).person.id
  return null
}


