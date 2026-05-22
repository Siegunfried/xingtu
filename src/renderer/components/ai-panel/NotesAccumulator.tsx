import React, { useState } from 'react'
import { useNotesStore } from '@/stores/notesStore'
import MarkdownRenderer from '@/components/viewer/MarkdownRenderer'
import EmptyState from '@/components/common/EmptyState'

export default function NotesAccumulator() {
  const currentNote = useNotesStore((s) => s.currentNote)
  const updateNoteContent = useNotesStore((s) => s.updateNoteContent)
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState('')

  if (!currentNote) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <EmptyState
          icon={
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
          }
          title="暂无笔记"
          description="在对话中向 AI 提问，回答会自动积累成笔记"
        />
      </div>
    )
  }

  const handleStartEdit = () => {
    setEditContent(currentNote.content)
    setIsEditing(true)
  }

  const handleSaveEdit = async () => {
    await updateNoteContent(editContent)
    setIsEditing(false)
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setEditContent('')
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Toolbar */}
      <div
        className="flex items-center justify-between px-4 py-2"
        style={{ borderBottom: '1px solid var(--border-color)' }}
      >
        <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
          更新于 {new Date(currentNote.updatedAt).toLocaleString('zh-CN')}
        </span>
        {!isEditing ? (
          <button
            onClick={handleStartEdit}
            className="text-xs px-2.5 py-1 rounded-full smooth-transition hover:opacity-80"
            style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}
          >
            编辑
          </button>
        ) : (
          <div className="flex gap-1.5">
            <button
              onClick={handleSaveEdit}
              className="text-xs px-2.5 py-1 rounded-full smooth-transition"
              style={{ background: 'var(--accent)', color: '#fff' }}
            >
              保存
            </button>
            <button
              onClick={handleCancelEdit}
              className="text-xs px-2.5 py-1 rounded-full smooth-transition"
              style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}
            >
              取消
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        {isEditing ? (
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            className="w-full h-full resize-none rounded-lg p-3 text-sm outline-none"
            style={{
              background: 'var(--input-bg)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-color)',
            }}
          />
        ) : (
          <div className="text-sm leading-relaxed">
            <MarkdownRenderer content={currentNote.content} />
          </div>
        )}
      </div>
    </div>
  )
}
