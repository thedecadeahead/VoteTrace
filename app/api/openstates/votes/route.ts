import { NextRequest } from 'next/server'
import { openStatesFetch } from '@/lib/openstates'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const jurisdiction = searchParams.get('jurisdiction') || 'New York'
  const per_page = parseInt(searchParams.get('per_page') || '1', 10)
  try {
    const data = await openStatesFetch('/votes', { jurisdiction, per_page, sort: '-date' })
    return Response.json(data)
  } catch (e: any) {
    return new Response(e?.message || 'OpenStates error', { status: 500 })
  }
}


