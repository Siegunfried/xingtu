import React from 'react'
import { useDocumentStore } from '@/stores/documentStore'
import { useChatStore } from '@/stores/chatStore'
import { useNotesStore } from '@/stores/notesStore'
import HistoryItem from './HistoryItem'

export default function Sidebar() {
  const { documents, currentDocumentId, importDocument, openDocument, removeDocument, isLoading } =
    useDocumentStore()
  const loadMessages = useChatStore((s) => s.loadMessages)
  const loadNote = useNotesStore((s) => s.loadNote)

  const handleImport = async () => {
    try {
      const file = await window.electronAPI.openFile()
      if (!file) return
      const docId = await importDocument(file.name, file.format, file.data)
      await loadMessages(docId)
      await loadNote(docId)
    } catch {
      // error handled in store
    }
  }

  const handleSelect = async (id: string) => {
    await openDocument(id)
    await loadMessages(id)
    await loadNote(id)
  }

  const handleDelete = async (id: string) => {
    await removeDocument(id)
    // If deleted current doc, clear messages and notes (the store handles the currentDocumentId change)
    if (currentDocumentId === id) {
      useChatStore.getState().clearMessages(id)
      useNotesStore.getState().clearNote()
    }
  }

  return (
    <div
      className="flex flex-col h-full"
      style={{
        background: 'var(--bg-secondary)',
        borderRight: '1px solid var(--border-color)',
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{ borderBottom: '1px solid var(--border-color)' }}
      >
        <h2
          className="text-xs font-semibold tracking-wide uppercase"
          style={{ color: 'var(--text-secondary)' }}
        >
          阅读历史
        </h2>
        <button
          onClick={handleImport}
          disabled={isLoading}
          className="flex items-center justify-center w-7 h-7 rounded-full smooth-transition hover:opacity-80 active:scale-95"
          style={{ background: 'var(--accent)', color: '#fff' }}
          title="导入文档"
        >
          {isLoading ? (
            <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="31.4 31.4" />
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          )}
        </button>
      </div>

      {/* Document list */}
      <div className="flex-1 overflow-y-auto py-1">
        {documents.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full px-4 text-center">
            <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
              暂无文档
            </p>
            <button
              onClick={handleImport}
              className="mt-3 text-xs px-4 py-1.5 rounded-full smooth-transition hover:opacity-80"
              style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}
            >
              导入第一篇文档
            </button>
          </div>
        ) : (
          documents.map((doc) => (
            <HistoryItem
              key={doc.id}
              document={doc}
              isActive={doc.id === currentDocumentId}
              onSelect={() => handleSelect(doc.id)}
              onDelete={() => handleDelete(doc.id)}
            />
          ))
        )}
      </div>
    </div>
  )
}
