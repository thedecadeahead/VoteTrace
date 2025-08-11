import { NextRequest } from 'next/server'
import { fetchCandidateByName, fetchTotalsByCommittee, fetchTopContributors } from '@/lib/fec'
import { normalizeNameFromSlug } from '@/lib/slug'
import { lookupOfficialIdsByName } from '@/lib/idmap'

export async function GET(req: NextRequest, { params }: { params: { slug: string } }) {
  const name = normalizeNameFromSlug(params.slug)
  try {
    const mapped = lookupOfficialIdsByName(name)
    let committeeId = mapped?.fecCommitteeId || null
    let cand = null as any
    if (!committeeId) {
      const candidates = await fetchCandidateByName(name)
      cand = candidates?.results?.[0]
      if (!cand) return Response.json({})
      committeeId = cand?.principal_committee_id || cand?.committee_id
    }
    if (!committeeId) return Response.json({})
    const [totalsData, topData] = await Promise.all([
      fetchTotalsByCommittee(committeeId),
      fetchTopContributors(committeeId),
    ])
    const totals = totalsData?.results?.[0] || null
    const topContributors = (topData?.results || []).map((r: any) => ({ contributor: r.contributor || r.name, total: r.total }))
    return Response.json({ totals, topContributors, committeeId })
  } catch (e: any) {
    console.error('Finance error', { slug: params.slug, error: e?.message })
    return new Response(e?.message || 'Failed to fetch finance', { status: 500 })
  }
}


