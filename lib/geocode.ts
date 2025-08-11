const NOMINATIM_BASE = process.env.NOMINATIM_BASE || 'https://nominatim.openstreetmap.org'

export type Coordinates = { latitude: number; longitude: number }

export function parseCoordinates(input: string): Coordinates | null {
  const trimmed = input.trim()
  const m = trimmed.match(/^\s*(-?\d{1,3}\.\d+),\s*(-?\d{1,3}\.\d+)\s*$/)
  if (!m) return null
  const latitude = Number(m[1])
  const longitude = Number(m[2])
  if (Number.isNaN(latitude) || Number.isNaN(longitude)) return null
  if (latitude < -90 || latitude > 90) return null
  if (longitude < -180 || longitude > 180) return null
  return { latitude, longitude }
}

export async function reverseGeocodeToAddress(coords: Coordinates): Promise<string | null> {
  const url = new URL(`${NOMINATIM_BASE}/reverse`)
  url.searchParams.set('lat', String(coords.latitude))
  url.searchParams.set('lon', String(coords.longitude))
  url.searchParams.set('format', 'jsonv2')

  const res = await fetch(url.toString(), {
    headers: {
      'User-Agent': 'VoteTrace/0.1 (reverse-geocode)'
    },
    // Cache for 10 minutes
    next: { revalidate: 600 },
  })
  if (!res.ok) return null
  const data = await res.json()
  // Prefer a structured postal address when available
  if (data?.address) {
    const a = data.address
    const city = a.city || a.town || a.village || a.hamlet || a.municipality || a.county
    const parts = [a.house_number, a.road, city, a.state, a.postcode]
    const line = parts.filter(Boolean).join(', ')
    if (line) return line
  }
  // Fallback to display_name if we cannot construct a clean line
  if (data?.display_name) return String(data.display_name)
  return null
}

export async function reverseGeocodeCandidates(coords: Coordinates): Promise<string[]> {
  const candidates: string[] = []
  // Nominatim
  try {
    const url = new URL(`${NOMINATIM_BASE}/reverse`)
    url.searchParams.set('lat', String(coords.latitude))
    url.searchParams.set('lon', String(coords.longitude))
    url.searchParams.set('format', 'jsonv2')
    const res = await fetch(url.toString(), {
      headers: { 'User-Agent': 'VoteTrace/0.1 (reverse-geocode)' },
      next: { revalidate: 600 },
    })
    if (res.ok) {
      const data = await res.json()
      if (data?.address) {
        const a = data.address
        const city = a.city || a.town || a.village || a.hamlet || a.municipality || a.county
        const parts = [a.house_number, a.road, city, a.state, a.postcode].filter(Boolean)
        const structured = parts.join(', ')
        if (structured) {
          candidates.push(structured)
          if (a.postcode) candidates.push([a.house_number, a.road, city, a.state].filter(Boolean).join(', '))
          if (a.house_number && a.road) candidates.push([a.road, city, a.state, a.postcode].filter(Boolean).join(', '))
          candidates.push(structured + ', USA')
        }
      }
      if (data?.display_name) candidates.push(String(data.display_name))
    }
  } catch {}

  // US Census Geocoder (no key required)
  try {
    const url = new URL('https://geocoding.geo.census.gov/geocoder/locations/coordinates')
    url.searchParams.set('x', String(coords.longitude))
    url.searchParams.set('y', String(coords.latitude))
    url.searchParams.set('benchmark', '2020')
    url.searchParams.set('format', 'json')
    const res = await fetch(url.toString(), { next: { revalidate: 600 } })
    if (res.ok) {
      const data = await res.json()
      const match = data?.result?.addressMatches?.[0]
      if (match?.matchedAddress) {
        candidates.push(String(match.matchedAddress))
      } else if (match?.addressComponents) {
        const c = match.addressComponents
        const structured = [c.number, c.street, c.city, c.state, c.zip].filter(Boolean).join(', ')
        if (structured) candidates.push(structured)
      }
    }
  } catch {}

  return Array.from(new Set(candidates.filter(Boolean)))
}

export async function forwardGeocodeToCoords(query: string): Promise<Coordinates | null> {
  const url = new URL(`${NOMINATIM_BASE}/search`)
  url.searchParams.set('q', query)
  url.searchParams.set('format', 'jsonv2')
  url.searchParams.set('limit', '1')
  const res = await fetch(url.toString(), {
    headers: { 'User-Agent': 'VoteTrace/0.1 (forward-geocode)' },
    next: { revalidate: 600 },
  })
  if (!res.ok) return null
  const list = await res.json()
  const top = Array.isArray(list) ? list[0] : null
  if (!top?.lat || !top?.lon) return null
  const latitude = Number(top.lat)
  const longitude = Number(top.lon)
  if (Number.isNaN(latitude) || Number.isNaN(longitude)) return null
  return { latitude, longitude }
}


