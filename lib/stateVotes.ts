// Minimal state legislature connectors. Start with New York Open Legislation API.
// All functions are best-effort and return [] on failure so the caller can fall back.

type VoteItem = {
  id: string
  date: string
  motion?: string
  billId?: string
  choice?: string
}

const NY_BASE = process.env.OPEN_NY_LEG_API_BASE || 'https://legislation.nysenate.gov/api/3'
const NY_KEY = process.env.OPEN_NY_LEG_API_KEY

async function nyFetch(path: string): Promise<any> {
  if (!NY_KEY) throw new Error('Missing OPEN_NY_LEG_API_KEY')
  const url = new URL(`${NY_BASE}${path}`)
  url.searchParams.set('key', NY_KEY)
  const res = await fetch(url.toString(), { next: { revalidate: 300 } })
  if (!res.ok) throw new Error(`NY API ${res.status}`)
  return res.json()
}

async function findNyMemberIdByName(name: string): Promise<string | null> {
  try {
    const q = encodeURIComponent(name)
    // The members endpoint supports fullText search via 'search' param in v3
    const data = await nyFetch(`/members?search=${q}&limit=5`)
    const items = data?.result?.items || data?.result || []
    if (Array.isArray(items) && items.length > 0) {
      const first = items[0]
      return String(first.memberId || first.id || '') || null
    }
  } catch {}
  return null
}

async function fetchNyMemberVotes(memberId: string, limit = 20): Promise<VoteItem[]> {
  try {
    const data = await nyFetch(`/members/${encodeURIComponent(memberId)}/votes?limit=${limit}`)
    const items = data?.result?.items || data?.result || []
    if (!Array.isArray(items)) return []
    return items.map((v: any) => ({
      id: String(v.id || v.voteId || `${memberId}-${v?.date}`),
      date: v?.date || v?.voteDate || v?.created || new Date().toISOString(),
      motion: v?.motionText || v?.motion || v?.bill?.title,
      billId: v?.bill?.printNo || v?.bill?.identifier,
      choice: v?.vote?.memberVote || v?.memberVote || v?.vote || undefined,
    }))
  } catch {
    return []
  }
}

export async function fetchStateVotesByName(state: string, name: string): Promise<VoteItem[]> {
  if (state.toUpperCase() === 'NY') {
    try {
      const id = await findNyMemberIdByName(name)
      if (!id) return []
      return await fetchNyMemberVotes(id)
    } catch {
      return []
    }
  }
  return []
}


