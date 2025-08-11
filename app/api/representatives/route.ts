import { NextRequest } from 'next/server'
import { fetchOfficialsByAddress } from '@/lib/civic'
import { parseCoordinates, reverseGeocodeCandidates, forwardGeocodeToCoords } from '@/lib/geocode'
import { lookupGeographies } from '@/lib/census'
import { fetchRepresentative, fetchSenatorsByState } from '@/lib/govtrack'
import { fetchStateLegislators } from '@/lib/openstatesLookup'
import { fetchRepresentativesFromFiveCalls } from '@/lib/fivecalls'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const address = searchParams.get('address')
  if (!address) {
    return new Response('Missing address', { status: 400 })
  }
  try {
    const coords = parseCoordinates(address)
    if (coords) {
      // Try multiple candidate strings to satisfy Google Civic formatting quirks
      const candidates = await reverseGeocodeCandidates(coords)
      console.log('Reverse candidates', { coords, candidates })
      if (candidates.length === 0) {
        return new Response('Unable to reverse-geocode coordinates to an address', { status: 400 })
      }
      // First, attempt Google Civic as before
      for (const candidate of candidates) {
        try {
          const officials = await fetchOfficialsByAddress(candidate)
          return Response.json({ officials, usedAddress: candidate, source: 'google_civic' })
        } catch (e: any) {
          if (String(e?.message || '').includes('Civic API error 404') || String(e?.message || '').includes('NOT_FOUND')) {
            console.warn('Civic rejected candidate', { candidate, error: e?.message })
          } else {
            console.error('Civic error non-retryable', { candidate, error: e?.message })
            throw e
          }
        }
      }

      // Fallback: use Census + GovTrack to assemble federal reps
      const geo = await lookupGeographies(coords)
      if (!geo.stateAbbr) return new Response('Could not resolve state for coordinates', { status: 502 })
      const [sens, reps, stateside] = await Promise.all([
        fetchSenatorsByState(geo.stateAbbr),
        fetchRepresentative(geo.stateAbbr, geo.congressionalDistrict),
        fetchStateLegislators(geo.stateAbbr, geo.stateUpperDistrict, geo.stateLowerDistrict),
      ])
      const state = geo.stateAbbr!
      const officials = [
        ...sens.map((r) => ({ name: r.person?.name || '', party: r.party || undefined, office: r.title || 'Senator', level: 'federal', divisionId: `ocd-division/country:us/state:${state.toLowerCase()}` })),
        ...reps.map((r) => ({ name: r.person?.name || '', party: r.party || undefined, office: r.title || 'Representative', level: 'federal', divisionId: `ocd-division/country:us/state:${state.toLowerCase()}/cd:${String(geo.congressionalDistrict)}` })),
        ...stateside.map((p: any) => ({ name: p.name || p.person?.name || '', party: (p.party || p.current_party || '') || undefined, office: p.current_role?.title || p.chamber || 'State Legislator', level: 'state', divisionId: `ocd-division/country:us/state:${state.toLowerCase()}` })),
      ]
      return Response.json({ officials, usedAddress: candidates[0], source: 'govtrack_fallback', geography: geo })
    }

    // If input is a postal string, try Google Civic; on failure, forward-geocode and fall back
    try {
      const officials = await fetchOfficialsByAddress(address)
      return Response.json({ officials, usedAddress: address, source: 'google_civic' })
    } catch (civicErr: any) {
      // Try FiveCalls by address
      try {
        const fc = await fetchRepresentativesFromFiveCalls(address)
        if (fc && typeof fc === 'object') {
          const out: any[] = []
          const add = (person: any, level: string, office?: string) => {
            if (!person) return
            out.push({
              name: person.name || person.full_name || person.official_full || person.title || '',
              party: person.party || person.current_party || person.party_affiliation || undefined,
              office: office || person.office || person.role || 'Representative',
              level,
              divisionId: '',
            })
          }
          // Heuristic mapping of common 5Calls response shapes
          if (Array.isArray(fc.federal)) fc.federal.forEach((p: any) => add(p, 'federal'))
          if (Array.isArray(fc.state)) fc.state.forEach((p: any) => add(p, 'state'))
          if (Array.isArray(fc.results)) fc.results.forEach((p: any) => add(p, 'federal'))
          if (out.length > 0) return Response.json({ officials: out, usedAddress: address, source: 'fivecalls' })
        }
      } catch {}

      const coords2 = await forwardGeocodeToCoords(address)
      if (!coords2) throw civicErr
      const geo = await lookupGeographies(coords2)
      if (!geo.stateAbbr) throw civicErr
      const [sens, reps, stateside] = await Promise.all([
        fetchSenatorsByState(geo.stateAbbr),
        fetchRepresentative(geo.stateAbbr, geo.congressionalDistrict),
        fetchStateLegislators(geo.stateAbbr, geo.stateUpperDistrict, geo.stateLowerDistrict),
      ])
      const state2 = geo.stateAbbr!
      const officials = [
        ...sens.map((r) => ({ name: r.person?.name || '', party: r.party || undefined, office: r.title || 'Senator', level: 'federal', divisionId: `ocd-division/country:us/state:${state2.toLowerCase()}` })),
        ...reps.map((r) => ({ name: r.person?.name || '', party: r.party || undefined, office: r.title || 'Representative', level: 'federal', divisionId: `ocd-division/country:us/state:${state2.toLowerCase()}/cd:${String(geo.congressionalDistrict)}` })),
        ...stateside.map((p: any) => ({ name: p.name || p.person?.name || '', party: (p.party || p.current_party || '') || undefined, office: p.current_role?.title || p.chamber || 'State Legislator', level: 'state', divisionId: `ocd-division/country:us/state:${state2.toLowerCase()}` })),
      ]
      return Response.json({ officials, usedAddress: address, source: 'govtrack_fallback', geography: geo })
    }
  } catch (err: any) {
    const message = err?.message || 'Failed to resolve officials'
    const status = message.includes('GOOGLE_CIVIC_API_KEY') ? 501 : 500
    return new Response(message, { status })
  }
}


