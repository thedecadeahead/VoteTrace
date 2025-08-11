/*
  Quick exploratory script to probe OpenStates v3 responses for a person and recent vote events.
  Usage:
    ts-node scripts/openstates_probe.ts "New York" "Zellnor Myrie"
  or with npm script:
    npm run os:probe -- "New York" "Zellnor Myrie"
*/
import 'dotenv/config'

const BASE = process.env.OPENSTATES_API_BASE || 'https://v3.openstates.org'
const API_KEY = process.env.OPENSTATES_API_KEY

if (!API_KEY) {
  console.error('Missing OPENSTATES_API_KEY in env')
  process.exit(1)
}

function build(path: string, params: Record<string, string | number | boolean | undefined> = {}) {
  const url = new URL(`${BASE}${path}`)
  url.searchParams.set('apikey', API_KEY!)
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined) continue
    url.searchParams.set(k, String(v))
  }
  return url.toString()
}

async function fetchJson(path: string, params?: Record<string, any>) {
  const url = build(path, params)
  const res = await fetch(url)
  if (!res.ok) throw new Error(`${path} → ${res.status}`)
  return res.json()
}

async function main() {
  const jurisdiction = process.argv[2] || 'New York'
  const name = process.argv[3] || 'Zellnor Myrie'

  console.log('Jurisdiction:', jurisdiction)
  console.log('Name:', name)

  // 1) People search
  const people = await fetchJson('/people', { jurisdiction, name, per_page: 5 })
  console.log('\nPeople result keys:', Object.keys(people))
  const arr: any[] = (people as any).results || (people as any).data || []
  console.log('People count:', arr.length)
  if (arr.length === 0) return
  const person = arr[0]
  console.log('Person sample:', {
    id: person.id,
    name: person.name,
    openstates_url: person.openstates_url,
    current_role: person.current_role,
  })

  // 2) Try vote events filtered by person via /vote-events (v3 exposes VoteEvent here)
  // Note: Some deployments use voters.person_id; we'll try multiple params to learn the shape.
  const pid = person.id
  const attempts = [
    { note: 'voters.person_id via /vote-events', path: '/vote-events', params: { 'voters.person_id': pid, jurisdiction, per_page: 5, sort: '-date' } },
    { note: 'people_id via /vote-events', path: '/vote-events', params: { people_id: pid, jurisdiction, per_page: 5, sort: '-date' } },
    { note: 'voters.person_id via /votes', path: '/votes', params: { 'voters.person_id': pid, jurisdiction, per_page: 5, sort: '-date' } },
  ]
  for (const a of attempts) {
    try {
      const votes = await fetchJson(a.path as string, a.params)
      const list: any[] = (votes as any).results || (votes as any).data || []
      console.log(`\nVotes attempt ${a.note}: count=${list.length}`)
      if (list[0]) {
        const v = list[0]
        console.log('Sample vote keys:', Object.keys(v))
        console.log('Sample vote:', {
          id: v.id || v.identifier,
          date: v.date || v.created_at,
          motion_text: v.motion_text || v.motion,
          bill: v.bill?.identifier || v.bill?.number,
          voters_keys: Array.isArray(v.votes) ? Object.keys(v.votes[0] || {}) : [],
        })
      }
    } catch (e: any) {
      console.log(`Votes attempt ${a.note}: error`, e?.message)
    }
  }
}

main().catch((e) => {
  console.error('Probe failed:', e)
  process.exit(1)
})


