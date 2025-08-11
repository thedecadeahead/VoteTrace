import { prisma } from './prisma'

function startOfDay(date = new Date()): Date {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

export async function getApiBudget(source: string): Promise<{ used: number; limit: number }> {
  const day = startOfDay()
  const row = await prisma.apiQuota.upsert({
    where: { source_day: { source, day } },
    update: {},
    create: { source, day, used: 0, limit: 500 },
  })
  return { used: row.used, limit: row.limit }
}

export async function incrementApiBudget(source: string, amount = 1): Promise<void> {
  const day = startOfDay()
  await prisma.apiQuota.update({
    where: { source_day: { source, day } },
    data: { used: { increment: amount } },
  })
}

export async function upsertOpenStatesPerson(p: { id: string; name: string; jurisdiction: string; chamber?: string | null; district?: string | null; raw?: any }) {
  await prisma.openStatesPerson.upsert({
    where: { id: p.id },
    update: { name: p.name, jurisdiction: p.jurisdiction, chamber: p.chamber || null, district: p.district || null, raw: p.raw || undefined },
    create: { id: p.id, name: p.name, jurisdiction: p.jurisdiction, chamber: p.chamber || null, district: p.district || null, raw: p.raw || undefined },
  })
}

export async function cacheVoteEvents(personId: string, jurisdiction: string, items: any[]) {
  for (const v of items) {
    const id = String(v.id || v.identifier)
    await prisma.voteEvent.upsert({
      where: { id },
      update: {
        jurisdiction,
        personId,
        date: new Date(v.date || v.created_at || v.updated_at || Date.now()),
        motion: v.motionText || v.motion_text || v.motion || v.bill?.title || null,
        billId: v.bill?.identifier || v.bill?.number || null,
        choice: (Array.isArray(v.votes) ? v.votes[0]?.option : Array.isArray(v.voters) ? v.voters[0]?.vote : v.result) || null,
        raw: v,
      },
      create: {
        id,
        jurisdiction,
        personId,
        date: new Date(v.date || v.created_at || v.updated_at || Date.now()),
        motion: v.motionText || v.motion_text || v.motion || v.bill?.title || null,
        billId: v.bill?.identifier || v.bill?.number || null,
        choice: (Array.isArray(v.votes) ? v.votes[0]?.option : Array.isArray(v.voters) ? v.voters[0]?.vote : v.result) || null,
        raw: v,
      },
    })
  }
}

export async function readCachedVoteEvents(personId: string, maxAgeHours = 24) {
  const since = new Date(Date.now() - maxAgeHours * 3600 * 1000)
  const list = await prisma.voteEvent.findMany({
    where: { personId, updatedAt: { gte: since } },
    orderBy: { date: 'desc' },
    take: 50,
  })
  return list
}


