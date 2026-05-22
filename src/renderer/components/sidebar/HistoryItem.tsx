import React from 'react'
import type { DocumentRecord } from '@/types'

interface HistoryItemProps {
  document: DocumentRecord
  isActive: boolean
  onSelect: () => void
  onDelete: () => void
}

const formatLabels: Record<string, string> = {
  pdf: 'PDF',
  docx: 'DOCX',
  txt: 'TXT',
  md: 'MD',
}

const formatColors: Record<string, string> = {
  pdf: '#ef4444',
  docx: '#3b82f6',
  txt: '#6b7280',
  md: '#8b5cf6',
}

export default function HistoryItem({ document, isActive, onSelect, onDelete }: HistoryItemProps) {
  return (
    <div
      onClick={onSelect}
      className="group relative mx-2 my-0.5 px-3 py-2.5 rounded-lg cursor-pointer smooth-transition animate-slide-in"
      style={{
        background: isActive ? 'var(--sidebar-active)' : 'transparent',
        borderLeft: isActive ? '3px solid var(--accent)' : '3px solid transparent',
      }}
      onMouseEnter={(e) => {
        if (!isActive) e.currentTarget.style.background = 'var(--sidebar-hover)'
      }}
      onMouseLeave={(e) => {
        if (!isActive) e.currentTarget.style.background = 'transparent'
      }}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p
            className="text-xs font-medium truncate"
            style={{ color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)' }}
          >
            {document.title}
          </p>
          <div className="flex items-center gap-1.5 mt-1">
            <span
              className="text-[10px] px-1.5 py-0.5 rounded font-medium"
              style={{
                background: formatColors[document.format] + '20',
                color: formatColors[document.format],
              }}
            >
              {formatLabels[document.format] || document.format.toUpperCase()}
            </span>
            <span className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
              {new Date(document.lastOpenedAt).toLocaleDateString('zh-CN')}
            </span>
          </div>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation()
            onDelete()
          }}
          className="opacity-0 group-hover:opacity-100 w-5 h-5 flex items-center justify-center rounded smooth-transition hover:bg-red-500/10"
          style={{ color: 'var(--text-tertiary)' }}
          title="删除"
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
    </div>
  )
}
