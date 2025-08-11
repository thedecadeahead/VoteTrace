import React from 'react'

export function LevelBadge({ level }: { level: string }) {
  const normalized = level.toLowerCase()
  const styleMap: Record<string, string> = {
    federal: 'bg-blue-100 text-blue-800 ring-blue-200',
    state: 'bg-violet-100 text-violet-800 ring-violet-200',
    county: 'bg-teal-100 text-teal-800 ring-teal-200',
    city: 'bg-indigo-100 text-indigo-800 ring-indigo-200',
    special_district: 'bg-gray-100 text-gray-800 ring-gray-200',
    local: 'bg-slate-100 text-slate-800 ring-slate-200',
  }
  const classes = styleMap[normalized] || styleMap.local
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${classes}`}>
      {level}
    </span>
  )
}


