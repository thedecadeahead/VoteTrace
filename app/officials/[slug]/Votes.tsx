'use client'
import { useEffect, useState } from 'react'

type Vote = {
  id: number | string
  created: string
  question?: string
  bill?: string
  choice?: string
  source_url?: string
}

export default function Votes({ slug, state, divisionId, level }: { slug: string; state?: string; divisionId?: string; level?: string }) {
  const [votes, setVotes] = useState<Vote[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [personId, setPersonId] = useState<string | number | null>(null)

  useEffect(() => {
    let cancelled = false
    async function run() {
      try {
        const params = new URLSearchParams()
        if (state) params.set('state', state)
        if (divisionId) params.set('divisionId', divisionId)
        if (level) params.set('level', level)
        const qs = params.toString()
        const res = await fetch(`/api/officials/${encodeURIComponent(slug)}/votes${qs ? `?${qs}` : ''}`)
        if (!res.ok) throw new Error(await res.text())
        const data = await res.json()
        if (!cancelled) {
          setVotes(data.votes)
          setPersonId(data.personId ?? null)
        }
      } catch (e: any) {
        if (!cancelled) setError(e?.message || 'Failed to load votes')
      }
    }
    run()
    return () => { cancelled = true }
  }, [slug, state, divisionId, level])

  if (error) return <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
  if (!votes) return <p className="text-sm text-gray-600 dark:text-gray-300">Loading votes…</p>
  if (votes.length === 0) {
    const link = (() => {
      if (!personId) return null
      if (level === 'state' && typeof personId === 'string') {
        const uuid = personId.replace('ocd-person/', '')
        return `https://openstates.org/person/${uuid}/`
      }
      if (level !== 'state' && typeof personId === 'number') {
        return `https://www.govtrack.us/congress/members/${personId}`
      }
      return null
    })()
    return (
      <div className="text-sm text-gray-600 dark:text-gray-300">
        <div>No recent votes found.</div>
        {link && (
          <div className="mt-2">
            <a className="text-brand-700 underline" href={link} target="_blank" rel="noreferrer">View all votes at the source</a>
          </div>
        )}
      </div>
    )
  }

  return (
    <ul className="divide-y divide-gray-200 dark:divide-gray-800">
      {votes.map((v) => (
        <li key={v.id} className="py-2 text-sm">
          <div className="font-medium">{v.bill || 'Vote'} — {v.choice || '—'}</div>
          <div className="text-gray-600 dark:text-gray-300">{v.question || ''}</div>
          <div className="text-gray-500 dark:text-gray-400 flex items-center gap-3">
            <span>{new Date(v.created).toLocaleDateString()}</span>
            {v.source_url && (
              <a className="text-brand-700 underline" href={v.source_url} target="_blank" rel="noreferrer">Source</a>
            )}
          </div>
        </li>
      ))}
    </ul>
  )
}


