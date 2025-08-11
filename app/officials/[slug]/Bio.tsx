'use client'
import { useEffect, useState } from 'react'

type Bio = { birthday?: string; gender?: string; twitter?: string; youtube?: string }
type Committee = { name: string }

export default function Bio({ slug, state, level }: { slug: string; state?: string; level?: string }) {
  const [bio, setBio] = useState<Bio | null>(null)
  const [committees, setCommittees] = useState<Committee[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function run() {
      try {
        const params = new URLSearchParams()
        if (state) params.set('state', state)
        if (level) params.set('level', level)
        const res = await fetch(`/api/officials/${encodeURIComponent(slug)}/bio${params.size ? `?${params.toString()}` : ''}`)
        if (!res.ok) throw new Error(await res.text())
        const data = await res.json()
        if (cancelled) return
        setBio(data.bio || null)
        setCommittees(data.committees || [])
      } catch (e: any) {
        if (!cancelled) setError(e?.message || 'Failed to load bio')
      }
    }
    run()
    return () => { cancelled = true }
  }, [slug, state, level])

  if (error) return <p className="text-sm text-red-700 dark:text-red-400">{error}</p>

  return (
    <div className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
      {bio ? (
        <div>
          {bio.birthday && <div>Born: <span className="font-medium">{new Date(bio.birthday).toLocaleDateString()}</span></div>}
          {bio.gender && <div>Gender: <span className="font-medium">{bio.gender}</span></div>}
          {(bio.twitter || bio.youtube) && (
            <div className="flex gap-3">
              {bio.twitter && <a className="text-brand-700 underline" href={`https://twitter.com/${bio.twitter}`}>Twitter</a>}
              {bio.youtube && <a className="text-brand-700 underline" href={`https://youtube.com/${bio.youtube}`}>YouTube</a>}
            </div>
          )}
        </div>
      ) : (
        <div>No bio available.</div>
      )}

      <div>
        <h3 className="mb-2 text-sm font-semibold">Committees</h3>
        {committees.length > 0 ? (
          <ul>
            {committees.map((c, i) => (<li key={i}>• {c.name}</li>))}
          </ul>
        ) : (
          <div>No committee assignments found.</div>
        )}
      </div>
    </div>
  )
}


