import React from 'react'

type AlertProps = {
  kind?: 'error' | 'info' | 'success' | 'warning'
  title?: string
  children?: React.ReactNode
}

export default function Alert({ kind = 'info', title, children }: AlertProps) {
  const base = 'rounded-md p-4 text-sm'
  const styles: Record<string, string> = {
    error: 'bg-red-50 text-red-800 ring-1 ring-red-200 dark:bg-red-900/30 dark:text-red-200 dark:ring-red-800/50',
    info: 'bg-blue-50 text-blue-800 ring-1 ring-blue-200 dark:bg-blue-900/30 dark:text-blue-200 dark:ring-blue-800/50',
    success: 'bg-green-50 text-green-800 ring-1 ring-green-200 dark:bg-green-900/30 dark:text-green-200 dark:ring-green-800/50',
    warning: 'bg-yellow-50 text-yellow-900 ring-1 ring-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-200 dark:ring-yellow-800/50',
  }
  return (
    <div role={kind === 'error' ? 'alert' : 'status'} className={`${base} ${styles[kind]}`}>
      {title && <div className="mb-1 font-medium">{title}</div>}
      {children}
    </div>
  )
}


