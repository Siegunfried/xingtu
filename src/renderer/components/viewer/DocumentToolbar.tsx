import React from 'react'
import type { DocumentRecord } from '@/types'

interface DocumentToolbarProps {
  document?: DocumentRecord
  isEditing?: boolean
  onStartEdit?: () => void
  onSaveEdit?: () => void
  onCancelEdit?: () => void
}

const formatLabels: Record<string, string> = { pdf: 'PDF', docx: 'DOCX', txt: 'TXT', md: 'Markdown' }

export default function DocumentToolbar({
  document,
  isEditing,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
}: DocumentToolbarProps) {
  return (
    <div
      className="glass flex items-center justify-between px-5 py-2.5"
      style={{ borderBottom: '1px solid var(--border-color)' }}
    >
      <div className="flex items-center gap-3 min-w-0">
        {document ? (
          <>
            <h1 className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
              {document.title}
            </h1>
            <span
              className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
              style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}
            >
              {formatLabels[document.format] || document.format}
            </span>
          </>
        ) : (
          <span className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
            阅读器
          </span>
        )}
      </div>

      {document && (
        <div className="flex items-center gap-3">
          {!isEditing ? (
            <>
              <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                {document.content.length.toLocaleString()} 字符
              </span>
              <button
                onClick={onStartEdit}
                className="text-xs px-2.5 py-1 rounded-full smooth-transition hover:opacity-80"
                style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}
              >
                编辑
              </button>
            </>
          ) : (
            <>
              <button
                onClick={onCancelEdit}
                className="text-xs px-2.5 py-1 rounded-full smooth-transition"
                style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}
              >
                取消
              </button>
              <button
                onClick={onSaveEdit}
                className="text-xs px-2.5 py-1 rounded-full smooth-transition"
                style={{ background: 'var(--accent)', color: '#fff' }}
              >
                保存
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}
