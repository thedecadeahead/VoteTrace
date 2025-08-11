const BASE = process.env.FIVE_CALLS_API_BASE || 'https://5calls.org/representatives'

export async function fetchRepresentativesFromFiveCalls(address: string) {
  // 5 Calls API commonly used endpoint pattern: ?address=... or /{zip}
  const url = new URL(BASE)
  url.searchParams.set('address', address)
  const res = await fetch(url.toString(), { next: { revalidate: 300 } })
  if (!res.ok) throw new Error(`5Calls error ${res.status}`)
  return res.json() as Promise<any>
}


