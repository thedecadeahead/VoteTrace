import { NextRequest } from 'next/server'
import { searchPeople } from '@/lib/openstates'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const jurisdiction = searchParams.get('jurisdiction') || 'New York'
  const name = searchParams.get('name') || undefined
  try {
    const data = await searchPeople({ jurisdiction, name, page: 1, per_page: 10 })
    return Response.json(data)
  } catch (err: any) {
    const status = err?.message?.includes('OPENSTATES_API_KEY') ? 501 : 500
    return new Response(err?.message || 'OpenStates error', { status })
  }
}


