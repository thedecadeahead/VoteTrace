"use client"

import { useEffect, useState } from 'react'
import Alert from '@/components/Alert'
import Spinner from '@/components/Spinner'
import { LevelBadge } from '@/components/LevelBadge'
import { parseCoordinates } from '@/lib/geocode'
import { extractStateFromDivision } from '@/lib/slug'

type Official = {
  name: string
  office: string
  party?: string
  level: string
  divisionId?: string
}

export default function HomePage() {
  const [address, setAddress] = useState('')
  const [loading, setLoading] = useState(false)
  const [officials, setOfficials] = useState<Official[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [addressHint, setAddressHint] = useState<string | null>(null)

  async function onSearch(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setOfficials(null)
    try {
      const res = await fetch(`/api/representatives?address=${encodeURIComponent(address)}`)
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json()
      setOfficials(data.officials)
    } catch (err: any) {
      setError(err.message || 'Failed to load')
    } finally {
      setLoading(false)
    }
  }

  function geolocate() {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const { latitude, longitude } = pos.coords
      // Use Census Geocoder for reverse lookup in future; for MVP, store coords in address field
      setAddress(`${latitude},${longitude}`)
    })
  }

  useEffect(() => {
    // If input is coordinates, hint the user to click and search, but do not auto-reverse geocode on client
    const coords = parseCoordinates(address)
    if (coords) setAddressHint('Coordinates detected. We will convert to a street address before lookup.')
    else setAddressHint(null)
  }, [address])

  return (
    <main className="mx-auto max-w-5xl p-6">
      <header className="mb-8">
        <div className="inline-flex items-center gap-3 rounded-full bg-brand-100 px-3 py-1 text-sm text-brand-800 ring-1 ring-brand-200 dark:bg-brand-900/40 dark:text-brand-200 dark:ring-brand-800/50">Civic transparency</div>
        <h1 className="mt-3 mb-3 text-4xl font-semibold tracking-tight">Know who represents you</h1>
        <p className="max-w-3xl text-gray-700 dark:text-gray-300">
          Find all your representatives across <span className="font-medium">federal</span>, <span className="font-medium">state</span>,
          <span className="font-medium"> county</span>, and <span className="font-medium">special districts</span>. We link to original sources,
          track votes and bills, and surface campaign donations.
        </p>
      </header>
      <form onSubmit={onSearch} className="sticky top-0 z-10 mb-6 grid grid-cols-1 gap-3 rounded-xl border border-gray-200 bg-white/90 p-3 backdrop-blur dark:border-gray-800 dark:bg-gray-900/80 sm:grid-cols-[1fr_auto_auto]">
        <input
          placeholder="123 Main St, City, ST"
          className="w-full rounded-md border border-gray-300 bg-white p-3 shadow-sm focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          aria-label="Address"
        />
        <button
          type="submit"
          className="flex items-center justify-center gap-2 rounded-md bg-brand-600 px-4 py-3 font-medium text-white shadow hover:bg-brand-700 disabled:opacity-60"
          disabled={loading || !address}
        >
          {loading && <Spinner size={16} />}
          <span>{loading ? 'Searching…' : 'Search'}</span>
        </button>
        <button
          type="button"
          onClick={geolocate}
          className="rounded-md bg-gray-100 px-4 py-3 font-medium text-gray-900 ring-1 ring-gray-300 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-100 dark:ring-gray-700 dark:hover:bg-gray-700"
        >
          Use my location
        </button>
      </form>
      {addressHint && !error && (
        <div className="mb-4">
          <Alert kind="info">{addressHint}</Alert>
        </div>
      )}
      {error && (
        <div className="mb-4">
          <Alert kind="error" title="Lookup failed">
            <span className="break-words">{error}</span>
          </Alert>
        </div>
      )}
      {officials && officials.length === 0 && <p className="text-gray-700 dark:text-gray-300">No officials found.</p>}
      {officials && officials.length > 0 && (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {officials
            .sort((a, b) => a.level.localeCompare(b.level))
            .map((o, i) => (
            <li key={i} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition hover:shadow dark:border-gray-800 dark:bg-gray-900">
              <div className="mb-2 flex items-center justify-between gap-2">
                <a
                  href={`/officials/${encodeURIComponent(o.name.toLowerCase().replace(/[^a-z0-9]+/g,'-'))}?level=${encodeURIComponent(o.level)}${o.divisionId ? `&divisionId=${encodeURIComponent(o.divisionId)}` : ''}${o.divisionId ? `&state=${extractStateFromDivision(o.divisionId) || ''}` : ''}`}
                  className="text-base font-semibold hover:underline"
                >
                  {o.name}
                </a>
                <LevelBadge level={o.level} />
              </div>
               <div className="text-sm text-gray-700 dark:text-gray-300">{o.office}{o.party ? ` • ${o.party}` : ''}</div>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}


