import { NextRequest } from 'next/server'
import { searchPersonByNameState, fetchRecentVotesForPerson, resolvePersonIdByHeuristic } from '@/lib/govtrack'
import { stateAbbrevToName } from '@/lib/usStates'
import { findPersonByName, fetchPersonVotes as fetchOpenStatesVotes, fetchRecentSessionVotesForJurisdiction } from '@/lib/openstates'
import { fetchVoteEventsByPerson } from '@/lib/openstatesGraphql'
import { cacheVoteEvents, getApiBudget, incrementApiBudget, readCachedVoteEvents, upsertOpenStatesPerson } from '@/lib/cache'
import { fetchStateVotesByName } from '@/lib/stateVotes'
import { extractCdFromDivision } from '@/lib/slug'
import { lookupOfficialIdsByName } from '@/lib/idmap'
import { normalizeNameFromSlug } from '@/lib/slug'

export async function GET(req: NextRequest, { params }: { params: { slug: string } }) {
  const { slug } = params
  const { searchParams } = new URL(req.url)
  const state = searchParams.get('state') || undefined
  const divisionId = searchParams.get('divisionId') || undefined
  const level = searchParams.get('level') || undefined
  const name = normalizeNameFromSlug(slug)

  try {
    // If state-level, use OpenStates for votes
    if (level === 'state' && state) {
      const jurisdiction = stateAbbrevToName(state) || state
      // First, try official state API if supported
      const direct = await fetchStateVotesByName(state, name)
      if (direct.length > 0) {
        const directOut = direct.map((v) => ({ id: v.id, created: v.date, question: v.motion, bill: v.billId, choice: v.choice }))
        return Response.json({ votes: directOut, personId: name })
      }
      const person = await findPersonByName(jurisdiction, name)
      if (!person) {
        console.warn('State votes: unable to resolve person', { slug, name, state })
        return Response.json({ votes: [] })
      }
      const personOsId = person.id || person.person?.id || person.uuid || person._id
      try {
        await upsertOpenStatesPerson({
          id: personOsId,
          name: person.name || person.full_name || slug,
          jurisdiction,
          chamber: person.current_role?.org_classification || undefined,
          district: person.current_role?.district || undefined,
          raw: person,
        })
      } catch {}

      // Cache-first read
      let cached: any[] = []
      try {
        cached = await readCachedVoteEvents(personOsId)
      } catch {
        cached = []
      }
      if (cached && cached.length > 0) {
        const simplified = cached.map((v) => ({
          id: v.id,
          created: v.date.toISOString(),
          question: v.motion || undefined,
          bill: v.billId || undefined,
          choice: v.choice || undefined,
        }))
        return Response.json({ votes: simplified, personId: personOsId, source: 'cache' })
      }

      // Check daily budget before calling upstream
      let budget = { used: 0, limit: 500 }
      try {
        budget = await getApiBudget('openstates')
      } catch {
        budget = { used: 0, limit: 500 }
      }
      if (budget.used >= budget.limit) {
        return Response.json({ votes: [], personId: personOsId, source: 'cache', note: 'budget_exhausted' })
      }
      // Prefer GraphQL if configured
      let votes = await fetchVoteEventsByPerson(jurisdiction, personOsId)
      // Fallback to REST variants
      if (!votes || votes.length === 0) {
        votes = await fetchOpenStatesVotes(personOsId)
      }
      // If none returned, try broader recent jurisdiction votes and filter by person
      if (!votes || votes.length === 0) {
        const recent = await fetchRecentSessionVotesForJurisdiction(jurisdiction, 100)
        const pid = (personOsId || '').toLowerCase()
        votes = recent.filter((v: any) => {
          const voters = v.votes || v.roll_call || v.voters || []
          const people = Array.isArray(voters) ? voters.map((vv: any) => (vv.person?.id || vv.person_id || vv.voter_id || '').toLowerCase()) : []
          return people.includes(pid)
        })
      }
      try {
        await cacheVoteEvents(personOsId, jurisdiction, votes || [])
      } catch {}
      const simplified = (votes || []).map((v: any) => {
        const firstVoter = Array.isArray(v.votes) ? v.votes[0] : Array.isArray(v.voters) ? v.voters[0] : undefined
        return {
          id: v.id || v.identifier,
          created: v.date || v.created_at || v.updated_at,
          question: v.motionText || v.motion_text || v.motion || v.bill?.title,
          bill: v.bill?.identifier || v.bill?.number || v.bill?.classification,
          choice: firstVoter?.option || firstVoter?.vote || v.result,
        }
      })
      try { await incrementApiBudget('openstates', 1) } catch {}
      return Response.json({ votes: simplified, personId: personOsId })
    }

    const mapped = lookupOfficialIdsByName(name)
    let personId = mapped?.govtrackId || null
    if (!personId) {
      let person = await searchPersonByNameState(name, state)
      personId = person?.id || null
    }
    if (!personId) {
      let cd = extractCdFromDivision(divisionId)
      if (!cd) {
        const m = slug.match(/ny[- ]?(\d{1,2})/i)
        if (m) cd = m[1]
      }
      personId = await resolvePersonIdByHeuristic(name, state || undefined, cd)
    }
    if (!personId) {
      console.warn('Votes lookup: unable to resolve person ID', { slug, name, state, divisionId })
      return Response.json({ votes: [] })
    }
    const votes = await fetchRecentVotesForPerson(personId)
    const simplified = votes.map((v) => ({
      id: v.id,
      created: v.created,
      question: v.vote?.question,
      bill: v.vote?.related_bill?.display_number,
      choice: v.option?.value,
      source_url: v.vote?.chamber && v.vote?.number
        ? (v.vote?.chamber === 'house'
           ? `https://clerk.house.gov/Votes/${new Date(v.created).getUTCFullYear()}/roll${String(v.vote.number).padStart(3,'0')}.xml`
           : `https://www.senate.gov/legislative/LIS/roll_call_votes/vote${new Date(v.created).getUTCFullYear()}${v.vote.chamber === 'senate' ? '' : ''}/vote_${new Date(v.created).getUTCFullYear()}_${String(v.vote.number).padStart(5,'0')}.xml`)
        : undefined,
    }))
    return Response.json({ votes: simplified, personId })
  } catch (e: any) {
    console.error('Votes error', { slug, state, divisionId, error: e?.message })
    return new Response(e?.message || 'Failed to fetch votes', { status: 500 })
  }
}


