'use client'
import { useEffect, useState } from 'react'

type Totals = { cycle?: number; receipts?: number; disbursements?: number; cash_on_hand_end_period?: number }
type Top = { contributor: string; total: number }

export default function Finance({ name }: { name: string }) {
  const [totals, setTotals] = useState<Totals | null>(null)
  const [top, setTop] = useState<Top[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function run() {
      try {
        const res = await fetch(`/api/officials/${encodeURIComponent(name)}/finance`)
        if (!res.ok) throw new Error(await res.text())
        const data = await res.json()
        if (cancelled) return
        setTotals(data.totals || null)
        setTop(data.topContributors || null)
      } catch (e: any) {
        if (!cancelled) setError(e?.message || 'Failed to load finance')
      }
    }
    run()
    return () => { cancelled = true }
  }, [name])

  if (error) return <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
  return (
    <div className="space-y-3">
      <div className="text-sm text-gray-700 dark:text-gray-300">
        {totals ? (
          <div>
            <div>Cycle: <span className="font-medium">{totals.cycle}</span></div>
            <div>Receipts: <span className="font-medium">${(totals.receipts || 0).toLocaleString()}</span></div>
            <div>Disbursements: <span className="font-medium">${(totals.disbursements || 0).toLocaleString()}</span></div>
            <div>Cash on hand: <span className="font-medium">${(totals.cash_on_hand_end_period || 0).toLocaleString()}</span></div>
          </div>
        ) : (
          <div>No totals available.</div>
        )}
      </div>

      <div>
        <h3 className="mb-2 text-sm font-semibold">Top contributors</h3>
        {top && top.length > 0 ? (
          <ul className="text-sm text-gray-700 dark:text-gray-300">
            {top.map((t, i) => (
              <li key={i} className="flex justify-between py-1"><span>{t.contributor}</span><span>${t.total.toLocaleString()}</span></li>
            ))}
          </ul>
        ) : (
          <div className="text-sm text-gray-600 dark:text-gray-400">No top contributors data.</div>
        )}
      </div>
    </div>
  )
}


