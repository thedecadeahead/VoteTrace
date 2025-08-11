import { NextRequest } from 'next/server'
import { searchPersonByNameState, fetchPersonDetails, fetchCommitteeMembership } from '@/lib/govtrack'
import { normalizeNameFromSlug } from '@/lib/slug'
import { stateAbbrevToName } from '@/lib/usStates'
import { findPersonByName, openStatesFetch } from '@/lib/openstates'
import { lookupOfficialIdsByName } from '@/lib/idmap'

export async function GET(req: NextRequest, { params }: { params: { slug: string } }) {
  const { slug } = params
  const { searchParams } = new URL(req.url)
  const state = searchParams.get('state') || undefined
  const level = searchParams.get('level') || undefined
  const name = normalizeNameFromSlug(slug)

  try {
    if (level === 'state' && state) {
      const jurisdiction = stateAbbrevToName(state) || state
      const person = await findPersonByName(jurisdiction, name)
      if (!person) {
        console.warn('Bio lookup (state): unable to resolve person', { slug, name, state })
        return Response.json({ bio: null, committees: [] })
      }
      // Try memberships via nested resource; if missing, fall back to memberships query by person_id
      let committees: any[] = []
      try {
        const memberships: any = await openStatesFetch(`/people/${encodeURIComponent(person.id || person.uuid || person._id)}/memberships`, { per_page: 50 })
        committees = ((memberships && (memberships.results || memberships.data)) || [])
      } catch {
        try {
          const memberships2: any = await openStatesFetch(`/memberships`, { person_id: person.id || person.uuid || person._id, per_page: 50 })
          committees = ((memberships2 && (memberships2.results || memberships2.data)) || [])
        } catch {}
      }
      const committeeList = committees.map((m: any) => ({ name: m.organization?.name || m.organization }))
      return Response.json({ bio: null, committees: committeeList, personId: person.id || person.uuid })
    }

    // Federal path: prefer hardcoded mapping when available
    const mapped = lookupOfficialIdsByName(name)
    let personId = mapped?.govtrackId || null
    let person: any = null
    if (!personId) {
      person = await searchPersonByNameState(name, state)
      personId = person?.id || null
    }
    if (!personId) {
      console.warn('Bio lookup: unable to resolve person', { slug, name, state })
      return Response.json({})
    }
    // If we have a personId but not person, fetch details will still work
    const [details, committees] = await Promise.all([
      fetchPersonDetails(personId),
      fetchCommitteeMembership(personId),
    ])
    const bio = details ? {
      birthday: details.birthday,
      gender: details.gender,
      twitter: details.twitterid,
      youtube: details.youtubeid,
    } : null
    const committeeList = (committees || []).map((m: any) => ({ name: m.committee?.name || m.committee }))
    return Response.json({ bio, committees: committeeList, personId })
  } catch (e: any) {
    console.error('Bio error', { slug, state, error: e?.message })
    return new Response(e?.message || 'Failed to fetch bio', { status: 500 })
  }
}


