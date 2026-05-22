import React, { useMemo, useState } from 'react'
import type { TreeSelection } from '@/components/tree/FileTree'
import { useDocumentStore } from '@/stores/documentStore'
import { useNotesStore } from '@/stores/notesStore'
import { getAllNotesForDocument } from '@/db/database'
import MarkdownRenderer from './MarkdownRenderer'
import EmptyState from '@/components/common/EmptyState'

interface ContentViewerProps {
  selection: TreeSelection | null
}

export default function ContentViewer({ selection }: ContentViewerProps) {
  const documents = useDocumentStore((s) => s.documents)
  const updateDocument = useDocumentStore((s) => s.updateDocument)
  const updateNoteContent = useNotesStore((s) => s.updateNoteContent)
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState('')
  const [noteContent, setNoteContent] = useState<Record<string, string>>({})
  const [noteTitles, setNoteTitles] = useState<Record<string, string>>({})

  const currentDoc = useMemo(
    () => selection ? documents.find((d) => d.id === selection.documentId) : null,
    [documents, selection]
  )

  // Load note content on selection
  React.useEffect(() => {
    if (!selection || selection.type !== 'note') return
    const loadNote = async () => {
      const notes = await getAllNotesForDocument(selection.documentId)
      const note = notes.find((n) => n.id === selection.id)
      if (note) {
        setNoteContent((prev) => ({ ...prev, [note.id]: note.content }))
        setNoteTitles((prev) => ({ ...prev, [note.id]: note.title }))
      }
    }
    if (!noteContent[selection.id]) {
      loadNote()
    }
  }, [selection])

  if (!selection || !currentDoc) {
    return (
      <div className="flex flex-col h-full">
        <div
          className="glass flex items-center px-5 py-2.5 flex-shrink-0"
          style={{ borderBottom: '1px solid var(--border-color)' }}
        >
          <span className="text-sm" style={{ color: 'var(--text-tertiary)' }}>阅读区</span>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <EmptyState
            icon={
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
            }
            title="选择文档或笔记"
            description="从左侧文件树选择要查看的内容"
          />
        </div>
      </div>
    )
  }

  const isDoc = selection.type === 'document'
  const title = isDoc
    ? currentDoc.title
    : (noteTitles[selection.id] || '笔记')
  const content = isDoc
    ? currentDoc.content
    : (noteContent[selection.id] || '加载中...')
  const format = isDoc ? currentDoc.format : 'md'

  const handleStartEdit = () => {
    setEditContent(content)
    setIsEditing(true)
  }

  const handleSaveEdit = async () => {
    if (isDoc) {
      await updateDocument(currentDoc.id, editContent)
    } else {
      await updateNoteContent(editContent)
      setNoteContent((prev) => ({ ...prev, [selection.id]: editContent }))
    }
    setIsEditing(false)
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setEditContent('')
  }

  const label = isDoc ? (
    <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
      style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}>
      {format?.toUpperCase?.() || 'MD'}
    </span>
  ) : (
    <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
      style={{ background: 'rgba(96,165,250,0.15)', color: '#60a5fa' }}>
      笔记
    </span>
  )

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div
        className="glass flex items-center justify-between px-5 py-2.5 flex-shrink-0"
        style={{ borderBottom: '1px solid var(--border-color)' }}
      >
        <div className="flex items-center gap-2 min-w-0">
          <h1 className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
            {title}
          </h1>
          {label}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
            {content.length.toLocaleString()} 字
          </span>
          {!isEditing ? (
            <button
              onClick={handleStartEdit}
              className="text-xs px-2.5 py-1 rounded-full smooth-transition"
              style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}
            >
              编辑
            </button>
          ) : (
            <>
              <button onClick={handleCancelEdit}
                className="text-xs px-2.5 py-1 rounded-full"
                style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>
                取消
              </button>
              <button onClick={handleSaveEdit}
                className="text-xs px-2.5 py-1 rounded-full"
                style={{ background: 'var(--accent)', color: '#fff' }}>
                保存
              </button>
            </>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-8 py-6">
        <div className="max-w-3xl mx-auto">
          {isEditing ? (
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full h-[calc(100vh-120px)] resize-none rounded-xl p-4 text-sm outline-none leading-relaxed"
              style={{
                background: 'var(--input-bg)', color: 'var(--text-primary)',
                border: '1px solid var(--border-color)', fontFamily: 'inherit',
              }}
            />
          ) : (
            <MarkdownRenderer content={content} />
          )}
        </div>
      </div>
    </div>
  )
}
