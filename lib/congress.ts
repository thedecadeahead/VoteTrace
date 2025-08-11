const DEFAULT_BASE = process.env.CONGRESS_GOV_API_BASE || 'https://api.data.gov/congress/v3'

export async function fetchBillByCongressAndNumber(
  congress: number,
  billType: string,
  billNumber: number
): Promise<unknown> {
  const apiKey = process.env.CONGRESS_GOV_API_KEY
  if (!apiKey) throw new Error('Missing CONGRESS_GOV_API_KEY')
  const url = new URL(`${DEFAULT_BASE}/bill/${congress}/${billType}/${billNumber}`)
  url.searchParams.set('api_key', apiKey)
  const res = await fetch(url.toString(), { next: { revalidate: 3600 } })
  if (!res.ok) throw new Error(`Congress.gov error ${res.status}`)
  return res.json()
}


