import React from 'react'

interface EmptyStateProps {
  icon: React.ReactNode
  title: string
  description: string
  action?: React.ReactNode
}

export default function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div
      className="flex flex-col items-center justify-center h-full px-6 animate-fade-in"
      style={{ color: 'var(--text-secondary)' }}
    >
      <div className="mb-4 opacity-60">{icon}</div>
      <h3
        className="text-sm font-semibold mb-1.5"
        style={{ color: 'var(--text-primary)' }}
      >
        {title}
      </h3>
      <p className="text-xs text-center leading-relaxed max-w-60">
        {description}
      </p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}
