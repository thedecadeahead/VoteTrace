import { NextRequest } from 'next/server'
import { searchBills } from '@/lib/openstates'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const jurisdiction = searchParams.get('jurisdiction')
  const q = searchParams.get('q') || undefined
  if (!jurisdiction) return new Response('Missing jurisdiction', { status: 400 })
  try {
    const data = await searchBills({ jurisdiction, q, page: 1, per_page: 10 })
    return Response.json(data)
  } catch (err: any) {
    const status = err?.message?.includes('OPENSTATES_API_KEY') ? 501 : 500
    return new Response(err?.message || 'OpenStates error', { status })
  }
}


