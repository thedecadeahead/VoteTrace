export function slugify(input: string): string {
  return input.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')
}

export function extractStateFromDivision(divisionId?: string): string | undefined {
  if (!divisionId) return undefined
  const m = divisionId.match(/state:([a-z]{2})/i)
  return m ? m[1].toUpperCase() : undefined
}

export function extractCdFromDivision(divisionId?: string): string | undefined {
  if (!divisionId) return undefined
  const m = divisionId.match(/cd:([0-9]+)/i)
  return m ? m[1] : undefined
}

export function normalizeNameFromSlug(slug: string): string {
  const raw = decodeURIComponent(slug.replace(/-/g, ' '))
  // Drop bracketed party/state like [D-NY]
  let name = raw.replace(/\[[^\]]+\]/g, ' ').trim()
  // Remove common titles/prefixes
  const prefixes = ['senator', 'sen', 'sen.', 'representative', 'rep', 'rep.', 'hon.', 'mr', 'mr.', 'ms', 'ms.', 'mrs', 'mrs.', 'dr', 'dr.']
  let tokens = name.split(/\s+/).filter((t) => !prefixes.includes(t.toLowerCase()))
  name = tokens.join(' ').replace(/\s{2,}/g, ' ').trim()
  // Remove trailing state abbreviations like D-NY or R-CA if present as tokens
  name = name.replace(/\b[drpi]-[A-Z]{2}\b/gi, '').trim()
  // Remove trailing state+district tokens like NY9, ca12, ny-9
  name = name.replace(/\b[A-Z]{2}[- ]?\d{1,3}\b/gi, '').trim()
  // Collapse fancy quotes to plain
  name = name.replace(/[“”]/g, '"').replace(/[’]/g, "'")
  // Remove standalone party/state tokens (e.g., D NY)
  tokens = name.split(/\s+/)
  const parties = new Set(['d', 'r', 'i', 'p'])
  const states = new Set(['AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY','DC','PR'])
  tokens = tokens.filter((t) => {
    const u = t.toUpperCase()
    if (states.has(u)) return false
    if (parties.has(u.toLowerCase())) return false
    if (/^[A-Z]{2}\d{1,3}$/i.test(u)) return false
    return true
  })
  name = tokens.join(' ').replace(/\s{2,}/g, ' ').trim()
  return name
}


