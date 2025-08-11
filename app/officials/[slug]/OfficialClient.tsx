'use client'

import { useSearchParams } from 'next/navigation'
import Votes from './Votes'
import Finance from './Finance'
import Bio from './Bio'
import Promises from './Promises'

export default function OfficialClient({ slug }: { slug: string }) {
  const params = useSearchParams()
  const state = params.get('state') || undefined
  const divisionId = params.get('divisionId') || undefined
  const level = params.get('level') || undefined

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm lg:col-span-2 dark:border-gray-800 dark:bg-gray-900">
        <h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-gray-100">Recent votes</h2>
        <Votes slug={slug} state={state} divisionId={divisionId} level={level} />
      </section>

      <aside className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-gray-100">Biography</h2>
        <Bio slug={slug} state={state} level={level} />
      </aside>

      <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm lg:col-span-3 dark:border-gray-800 dark:bg-gray-900">
        <h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-gray-100">Campaign finance</h2>
        <Finance name={slug.replace(/-/g, ' ')} />
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm lg:col-span-3 dark:border-gray-800 dark:bg-gray-900">
        <h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-gray-100">Campaign promises</h2>
        <Promises />
      </section>
    </div>
  )
}


