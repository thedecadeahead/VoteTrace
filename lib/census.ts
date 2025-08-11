import type { Coordinates } from './geocode'

type CensusGeoResponse = {
  result?: {
    geographies?: Record<string, Array<Record<string, string>>>
  }
}

export type DistrictInfo = {
  stateAbbr?: string
  countyName?: string
  placeName?: string
  congressionalDistrict?: string
  stateUpperDistrict?: string
  stateLowerDistrict?: string
}

export async function lookupGeographies(coords: Coordinates): Promise<DistrictInfo> {
  const url = new URL('https://geocoding.geo.census.gov/geocoder/geographies/coordinates')
  url.searchParams.set('x', String(coords.longitude))
  url.searchParams.set('y', String(coords.latitude))
  url.searchParams.set('benchmark', 'Public_AR_Current')
  url.searchParams.set('vintage', 'Current_Current')
  url.searchParams.set('format', 'json')

  const res = await fetch(url.toString(), { next: { revalidate: 600 } })
  if (!res.ok) return {}
  const data: CensusGeoResponse = await res.json()
  const geos = data?.result?.geographies || {}
  const states = geos['States'] || []
  const cdKey = Object.keys(geos).find((k) => k.toLowerCase().includes('congressional'))
  const cds: Array<Record<string, string>> = (cdKey ? geos[cdKey] : []) || []
  const counties = geos['Counties'] || []
  const places = geos['Incorporated Places'] || geos['Census Places'] || []
  // Try to find state legislative districts across possible key variants
  const slduKey = Object.keys(geos).find((k) => k.toLowerCase().includes('state legislative districts') && k.toLowerCase().includes('upper'))
  const sldlKey = Object.keys(geos).find((k) => k.toLowerCase().includes('state legislative districts') && k.toLowerCase().includes('lower'))
  const slduArr: Array<Record<string, string>> = (slduKey ? geos[slduKey] : []) || []
  const sldlArr: Array<Record<string, string>> = (sldlKey ? geos[sldlKey] : []) || []
  const sldu = slduArr[0]
  const sldl = sldlArr[0]

  const cd = cds[0] || {}
  const parsedCd =
    cd['CD118'] || cd['CD116'] || cd['BASENAME'] || cd['CD'] || (cd['NAME'] ? cd['NAME'].replace(/[^0-9]/g, '') : undefined)

  const info: DistrictInfo = {
    stateAbbr: states[0]?.STUSAB,
    countyName: counties[0]?.NAME,
    placeName: places[0]?.NAME,
    congressionalDistrict: parsedCd || undefined,
    stateUpperDistrict: sldu?.SLDUST || sldu?.BASENAME || sldu?.NAME || undefined,
    stateLowerDistrict: sldl?.SLDLST || sldl?.BASENAME || sldl?.NAME || undefined,
  }
  return info
}


