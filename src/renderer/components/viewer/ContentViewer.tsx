import React, { useMemo, useState, useEffect, useCallback, useRef } from 'react'
import { useDocumentStore } from '@/stores/documentStore'
import { useNotesStore } from '@/stores/notesStore'
import { useUndoStore } from '@/stores/undoStore'
import { useTextSelectionStore } from '@/stores/textSelectionStore'
import { getAllNotesForDocument } from '@/db/database'
import MarkdownRenderer from './MarkdownRenderer'
import EmptyState from '@/components/common/EmptyState'

export default function ContentViewer() {
  const documents = useDocumentStore((s) => s.documents)
  const currentDocumentId = useDocumentStore((s) => s.currentDocumentId)
  const selectedNoteId = useDocumentStore((s) => s.selectedNoteId)
  const updateDocument = useDocumentStore((s) => s.updateDocument)
  const updateNoteContent = useNotesStore((s) => s.updateNoteContent)
  const pushState = useUndoStore((s) => s.pushState)
  const undo = useUndoStore((s) => s.undo)
  const redo = useUndoStore((s) => s.redo)
  const undoStacks = useUndoStore((s) => s.undoStacks)
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState('')
  const [noteContent, setNoteContent] = useState<Record<string, string>>({})
  const [noteTitles, setNoteTitles] = useState<Record<string, string>>({})

  const isDoc = !selectedNoteId
  const contentId = selectedNoteId || currentDocumentId || ''
  const currentDoc = useMemo(
    () => currentDocumentId ? documents.find((d) => d.id === currentDocumentId) : null,
    [documents, currentDocumentId]
  )

  useEffect(() => {
    if (!selectedNoteId || !currentDocumentId) return
    if (noteContent[selectedNoteId]) return
    getAllNotesForDocument(currentDocumentId).then((notes) => {
      const note = notes.find((n) => n.id === selectedNoteId)
      if (note) {
        setNoteContent((prev) => ({ ...prev, [note.id]: note.content }))
        setNoteTitles((prev) => ({ ...prev, [note.id]: note.title }))
      }
    })
  }, [selectedNoteId, currentDocumentId])

  if (!currentDocumentId || !currentDoc) {
    return (
      <div className="flex flex-col h-full">
        <div className="glass flex items-center px-5 py-2.5 flex-shrink-0"
          style={{ borderBottom: '1px solid var(--border-color)' }}>
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

  const title = isDoc ? currentDoc.title : (noteTitles[contentId] || '笔记')
  const content = isDoc ? currentDoc.content : (noteContent[contentId] || '加载中...')
  const format = isDoc ? currentDoc.format : 'md'
  const stack = undoStacks[contentId]
  const canUndo = !!(stack && stack.past.length > 0)
  const canRedo = !!(stack && stack.future.length > 0)

  const handleStartEdit = () => {
    pushState(contentId, content)
    setEditContent(content)
    setIsEditing(true)
  }

  const handleSaveEdit = async () => {
    if (isDoc) {
      await updateDocument(currentDoc.id, editContent)
    } else {
      await updateNoteContent(editContent)
      setNoteContent((prev) => ({ ...prev, [contentId]: editContent }))
    }
    setIsEditing(false)
  }

  const handleUndo = () => {
    const prev = undo(contentId)
    if (prev === null) return
    if (isEditing) {
      setEditContent(prev)
    } else if (isDoc) {
      pushState(contentId, currentDoc.content)
      updateDocument(currentDoc.id, prev)
    } else {
      pushState(contentId, noteContent[contentId] || '')
      updateNoteContent(prev)
      setNoteContent((s) => ({ ...s, [contentId]: prev }))
    }
  }

  const handleRedo = () => {
    const next = redo(contentId)
    if (next === null) return
    if (isEditing) {
      setEditContent(next)
    } else if (isDoc) {
      pushState(contentId, currentDoc.content)
      updateDocument(currentDoc.id, next)
    } else {
      pushState(contentId, noteContent[contentId] || '')
      updateNoteContent(next)
      setNoteContent((s) => ({ ...s, [contentId]: next }))
    }
  }

  // Text selection tracking
  const setSelection = useTextSelectionStore((s) => s.setSelection)
  const clearSelection = useTextSelectionStore((s) => s.clearSelection)
  const setToolbar = useTextSelectionStore((s) => s.setToolbar)
  const showToolbar = useTextSelectionStore((s) => s.showToolbar)
  const toolbarPos = useTextSelectionStore((s) => s.toolbarPos)
  const contentRef = useRef<HTMLDivElement>(null)

  const handleMouseUp = useCallback(() => {
    const sel = window.getSelection()
    if (!sel || sel.isCollapsed || !sel.toString().trim()) {
      clearSelection()
      return
    }
    const text = sel.toString()
    // Find position in raw content
    const idx = content.indexOf(text)
    if (idx === -1) return
    setSelection({
      text,
      startIndex: idx,
      endIndex: idx + text.length,
      contentId,
      fullContent: content,
    })
    // Position toolbar near selection
    const range = sel.getRangeAt(0)
    const rect = range.getBoundingClientRect()
    setToolbar(true, {
      x: rect.left + rect.width / 2,
      y: rect.top - 40,
    })
  }, [content, contentId, setSelection, clearSelection, setToolbar])

  const handleSelectionAsk = useCallback(() => {
    // Clear selection visual but keep data in store for the chat
    window.getSelection()?.removeAllRanges()
    setToolbar(false)
  }, [setToolbar])

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
      <div className="glass flex items-center justify-between px-5 py-2.5 flex-shrink-0"
        style={{ borderBottom: '1px solid var(--border-color)' }}>
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex items-center gap-0.5 mr-2">
            <button onClick={handleUndo} disabled={!canUndo}
              className="w-6 h-6 rounded flex items-center justify-center smooth-transition disabled:opacity-25"
              style={{ color: 'var(--text-secondary)' }} title="撤销 (Ctrl+Z)">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
              </svg>
            </button>
            <button onClick={handleRedo} disabled={!canRedo}
              className="w-6 h-6 rounded flex items-center justify-center smooth-transition disabled:opacity-25"
              style={{ color: 'var(--text-secondary)' }} title="重做 (Ctrl+Shift+Z)">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
              </svg>
            </button>
          </div>
          <h1 className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{title}</h1>
          {label}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
            {isEditing ? editContent.length : content.length} 字
          </span>
          {!isEditing ? (
            <button onClick={handleStartEdit} className="text-xs px-2.5 py-1 rounded-full smooth-transition"
              style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}>编辑</button>
          ) : (
            <>
              <button onClick={() => { setIsEditing(false); setEditContent('') }}
                className="text-xs px-2.5 py-1 rounded-full"
                style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>取消</button>
              <button onClick={handleSaveEdit} className="text-xs px-2.5 py-1 rounded-full"
                style={{ background: 'var(--accent)', color: '#fff' }}>保存</button>
            </>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-8 py-6" onMouseUp={handleMouseUp}>
        <div className="max-w-3xl mx-auto relative" ref={contentRef}>
          {/* Floating selection toolbar */}
          {showToolbar && (
            <div
              className="fixed z-50 animate-fade-in"
              style={{
                left: toolbarPos.x,
                top: toolbarPos.y,
                transform: 'translate(-50%, 0)',
              }}
            >
              <button
                onClick={handleSelectionAsk}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium shadow-lg smooth-transition hover:opacity-90"
                style={{ background: 'var(--accent)', color: '#fff' }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
                基于选中提问
              </button>
            </div>
          )}
          {isEditing ? (
            <textarea value={editContent} onChange={(e) => setEditContent(e.target.value)}
              className="w-full h-[calc(100vh-120px)] resize-none rounded-xl p-4 text-sm outline-none leading-relaxed"
              style={{ background: 'var(--input-bg)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', fontFamily: 'inherit' }}
            />
          ) : (
            <MarkdownRenderer content={content} />
          )}
        </div>
      </div>
    </div>
  )
}
