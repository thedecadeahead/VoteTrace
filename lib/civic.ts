type CivicOfficial = {
  name: string
  party?: string
}

type CivicOffice = {
  name: string
  divisionId: string
  levels?: string[]
  officialIndices: number[]
}

type CivicResponse = {
  normalizedInput?: Record<string, string>
  offices?: CivicOffice[]
  officials?: CivicOfficial[]
}

export type ResolvedOfficial = {
  name: string
  office: string
  party?: string
  level: string
  divisionId: string
}

export async function fetchOfficialsByAddress(address: string): Promise<ResolvedOfficial[]> {
  const apiKey = process.env.GOOGLE_CIVIC_API_KEY
  if (!apiKey) throw new Error('Missing GOOGLE_CIVIC_API_KEY')

  // Using the documented base host for Civic Information API
  const url = new URL('https://www.googleapis.com/civicinfo/v2/representatives')
  url.searchParams.set('address', address)
  url.searchParams.set('key', apiKey)

  const res = await fetch(url.toString(), { next: { revalidate: 3600 } })
  if (!res.ok) {
    const text = await res.text()
    // Server-side logging to help diagnose formatting issues with addresses
    console.error('Civic fetch failed', {
      url: url.toString(),
      status: res.status,
      body: text,
    })
    throw new Error(`Civic API error ${res.status}: ${text}`)
  }
  const data: CivicResponse = await res.json()
  const offices = data.offices || []
  const officials = data.officials || []

  const resolved: ResolvedOfficial[] = []
  for (const office of offices) {
    const level = office.levels?.[0] || inferLevelFromDivision(office.divisionId)
    for (const idx of office.officialIndices) {
      const o = officials[idx]
      if (!o) continue
      resolved.push({
        name: o.name,
        party: o.party,
        office: office.name,
        level,
        divisionId: office.divisionId,
      })
    }
  }
  return sortByLevel(resolved)
}

function inferLevelFromDivision(divisionId: string): string {
  if (divisionId.includes('country:us') && divisionId.includes('district')) return 'federal'
  if (divisionId.includes('country:us') && divisionId.includes('state:')) return 'state'
  if (divisionId.includes('county:')) return 'county'
  if (divisionId.includes('place:')) return 'city'
  if (divisionId.includes('school_district') || divisionId.includes('special')) return 'special_district'
  return 'local'
}

function sortByLevel(list: ResolvedOfficial[]): ResolvedOfficial[] {
  const order = ['federal', 'state', 'county', 'city', 'special_district', 'local']
  return list.sort((a, b) => order.indexOf(a.level) - order.indexOf(b.level))
}


