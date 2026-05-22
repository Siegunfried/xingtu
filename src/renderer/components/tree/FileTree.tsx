import React, { useEffect, useState } from 'react'
import { useDocumentStore } from '@/stores/documentStore'
import { useChatStore } from '@/stores/chatStore'
import { useNotesStore } from '@/stores/notesStore'
import { getAllNotesForDocument } from '@/db/database'
import type { DocumentRecord, NoteRecord } from '@/types'

export type TreeSelection = { type: 'document' | 'note'; id: string; documentId: string }

interface FileTreeProps {
  onSelect: (sel: TreeSelection) => void
  selectedId: string | null
}

export default function FileTree({ onSelect, selectedId }: FileTreeProps) {
  const documents = useDocumentStore((s) => s.documents)
  const importDocument = useDocumentStore((s) => s.importDocument)
  const removeDocument = useDocumentStore((s) => s.removeDocument)
  const isLoading = useDocumentStore((s) => s.isLoading)
  const loadMessages = useChatStore((s) => s.loadMessages)
  const loadNote = useNotesStore((s) => s.loadNote)
  const [expandedDocs, setExpandedDocs] = useState<Set<string>>(new Set())
  const [docNotes, setDocNotes] = useState<Record<string, NoteRecord[]>>({})

  // Load notes for expanded documents
  useEffect(() => {
    documents.forEach(async (doc) => {
      if (expandedDocs.has(doc.id)) {
        const notes = await getAllNotesForDocument(doc.id)
        setDocNotes((prev) => ({ ...prev, [doc.id]: notes }))
      }
    })
  }, [documents, expandedDocs])

  const toggleExpand = (docId: string) => {
    setExpandedDocs((prev) => {
      const next = new Set(prev)
      if (next.has(docId)) { next.delete(docId) } else { next.add(docId) }
      return next
    })
  }

  const handleImport = async () => {
    try {
      const file = await window.electronAPI.openFile()
      if (!file) return
      await importDocument(file.name, file.format, file.data)
    } catch { /* store handles error */ }
  }

  const handleDelete = async (docId: string) => {
    await removeDocument(docId)
  }

  return (
    <div className="flex flex-col h-full" style={{ background: 'var(--bg-secondary)' }}>
      {/* Header */}
      <div
        className="flex items-center justify-between px-3 py-2.5 flex-shrink-0"
        style={{ borderBottom: '1px solid var(--border-color)' }}
      >
        <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>
          资源管理器
        </span>
        <button
          onClick={handleImport}
          disabled={isLoading}
          className="w-6 h-6 rounded-full flex items-center justify-center smooth-transition hover:opacity-80"
          style={{ background: 'var(--accent)', color: '#fff' }}
        >
          {isLoading ? (
            <svg className="animate-spin w-3 h-3" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="31.4 31.4" />
            </svg>
          ) : (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          )}
        </button>
      </div>

      {/* Tree */}
      <div className="flex-1 overflow-y-auto py-1">
        {documents.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>暂无文档</p>
            <button
              onClick={handleImport}
              className="mt-3 text-xs px-3 py-1.5 rounded-full smooth-transition"
              style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}
            >
              导入文档
            </button>
          </div>
        ) : (
          documents.map((doc) => (
            <TreeNode
              key={doc.id}
              doc={doc}
              notes={docNotes[doc.id] || []}
              isExpanded={expandedDocs.has(doc.id)}
              selectedId={selectedId}
              onToggleExpand={() => toggleExpand(doc.id)}
              onSelect={onSelect}
              onDelete={() => handleDelete(doc.id)}
            />
          ))
        )}
      </div>
    </div>
  )
}

function TreeNode({
  doc, notes, isExpanded, selectedId,
  onToggleExpand, onSelect, onDelete,
}: {
  doc: DocumentRecord
  notes: NoteRecord[]
  isExpanded: boolean
  selectedId: string | null
  onToggleExpand: () => void
  onSelect: (sel: TreeSelection) => void
  onDelete: () => void
}) {
  const isDocSelected = selectedId === doc.id
  const now = Date.now()
  const isNew = now - doc.lastOpenedAt < 3000

  return (
    <div className="animate-slide-in">
      {/* Document folder */}
      <div
        className="group flex items-center gap-1.5 mx-1 px-2 py-1.5 rounded-md cursor-pointer smooth-transition relative"
        style={{
          background: isDocSelected ? 'var(--sidebar-active)' : 'transparent',
        }}
        onClick={() => {
          onToggleExpand()
          onSelect({ type: 'document', id: doc.id, documentId: doc.id })
        }}
        onMouseEnter={(e) => { if (!isDocSelected) e.currentTarget.style.background = 'var(--sidebar-hover)' }}
        onMouseLeave={(e) => { if (!isDocSelected) e.currentTarget.style.background = 'transparent' }}
      >
        {/* Expand/collapse chevron */}
        <svg
          width="10" height="10" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
          className="flex-shrink-0 smooth-transition"
          style={{
            color: 'var(--text-tertiary)',
            transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
          }}
        >
          <polyline points="9 18 15 12 9 6" />
        </svg>

        {/* Document icon */}
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
          style={{ color: 'var(--accent)' }}>
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
        </svg>

        {/* Name */}
        <span
          className="text-xs truncate flex-1"
          style={{ color: isDocSelected ? 'var(--text-primary)' : 'var(--text-secondary)', fontWeight: isDocSelected ? 600 : 400 }}
        >
          {doc.title}
        </span>

        {isNew && (
          <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: 'var(--accent)' }} />
        )}

        {/* Delete */}
        <button
          onClick={(e) => { e.stopPropagation(); onDelete() }}
          className="opacity-0 group-hover:opacity-100 w-5 h-5 rounded flex items-center justify-center flex-shrink-0 smooth-transition"
          style={{ color: 'var(--text-tertiary)' }}
          title="删除文档"
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
        </button>
      </div>

      {/* Child notes */}
      {isExpanded && (
        <div className="ml-3">
          {notes.map((note) => {
            const isNoteSelected = selectedId === note.id
            return (
              <div
                key={note.id}
                className="flex items-center gap-1.5 pl-3 pr-2 py-1.5 mx-0.5 my-0.5 rounded-md cursor-pointer smooth-transition"
                style={{
                  background: isNoteSelected ? 'var(--sidebar-active)' : 'transparent',
                  borderLeft: isNoteSelected ? '2px solid var(--accent)' : '2px solid transparent',
                }}
                onClick={() => onSelect({ type: 'note', id: note.id, documentId: doc.id })}
                onMouseEnter={(e) => { if (!isNoteSelected) e.currentTarget.style.background = 'var(--sidebar-hover)' }}
                onMouseLeave={(e) => { if (!isNoteSelected) e.currentTarget.style.background = 'transparent' }}
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                  style={{ color: 'var(--text-tertiary)' }}>
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
                <span
                  className="text-[11px] truncate"
                  style={{ color: isNoteSelected ? 'var(--text-primary)' : 'var(--text-secondary)' }}
                >
                  {note.title || '笔记'}
                </span>
              </div>
            )
          })}
          {notes.length === 0 && (
            <p className="text-[10px] pl-6 py-1 italic" style={{ color: 'var(--text-tertiary)' }}>暂无笔记</p>
          )}
        </div>
      )}
    </div>
  )
}
