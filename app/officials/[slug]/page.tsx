import { notFound } from 'next/navigation'
import OfficialClient from './OfficialClient'

type Params = { params: { slug: string } }

export default async function OfficialPage({ params }: Params) {
  const slug = params.slug
  if (!slug) return notFound()

  // Query params will be consumed by OfficialClient on the client side

  return (
    <main className="mx-auto max-w-5xl p-6">
      <h1 className="mb-1 text-3xl font-semibold capitalize">{slug.replace(/-/g, ' ')}</h1>
      <p className="mb-6 text-gray-600 dark:text-gray-300">Profile overview, voting history, donors, and biography.</p>

      <OfficialClient slug={slug} />
    </main>
  )
}


