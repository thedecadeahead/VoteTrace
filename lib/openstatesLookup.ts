import { openStatesFetch } from './openstates'
import { stateAbbrevToName } from './usStates'

export async function fetchStateLegislators(stateAbbrev: string, sldu?: string, sldl?: string) {
  const results: any[] = []
  const state = stateAbbrevToName(stateAbbrev) || stateAbbrev
  // Upper chamber
  if (sldu) {
    try {
      const data = await openStatesFetch<any>('/people', { jurisdiction: state, chamber: 'upper', district: sldu, per_page: 10 })
      if (Array.isArray((data as any)?.results || (data as any)?.data)) {
        const arr = (data as any).results || (data as any).data
        results.push(...arr)
      }
    } catch {}
  }
  // Lower chamber
  if (sldl) {
    try {
      const data = await openStatesFetch<any>('/people', { jurisdiction: state, chamber: 'lower', district: sldl, per_page: 10 })
      if (Array.isArray((data as any)?.results || (data as any)?.data)) {
        const arr = (data as any).results || (data as any).data
        results.push(...arr)
      }
    } catch {}
  }
  return results
}


