// Minimal hand-maintained ID map to ensure reliable lookups for well-known officials.
// Keys should be lowercased plain names without titles/party/state noise.

export type OfficialIds = {
  govtrackId?: number
  fecCandidateId?: string
  fecCommitteeId?: string
}

const nameKey = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').replace(/\s+/g, ' ').trim()

const MAP: Record<string, OfficialIds> = {
  'charles schumer': { govtrackId: 300087, fecCandidateId: 'S8NY00082' },
  'charles chuck schumer': { govtrackId: 300087, fecCandidateId: 'S8NY00082' },
  'chuck schumer': { govtrackId: 300087, fecCandidateId: 'S8NY00082' },
  'kirsten gillibrand': { govtrackId: 412223, fecCandidateId: 'S0NY00410' },
  'yvette clarke': { govtrackId: 412221, fecCandidateId: 'H6NY11147' },
  'yvette clarke ny9': { govtrackId: 412221, fecCandidateId: 'H6NY11147' },
}

export function lookupOfficialIdsByName(name: string): OfficialIds | null {
  const key = nameKey(name)
  return MAP[key] || null
}


