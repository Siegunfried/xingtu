import React, { useState, useEffect, useRef } from 'react'
import { useWorkspaceStore } from '@/stores/workspaceStore'
import { useUndoStore } from '@/stores/undoStore'
import { useSelectionContext } from '@/stores/selectionContext'
import { useTextSelectionStore } from '@/stores/textSelectionStore'
import { useChatStore } from '@/stores/chatStore'
import MarkdownRenderer from './MarkdownRenderer'
import EmptyState from '@/components/common/EmptyState'

export default function ContentViewer() {
  const currentFileContent = useWorkspaceStore((s) => s.currentFileContent)
  const selectedFilePath = useWorkspaceStore((s) => s.selectedFilePath)
  const selectedNotePath = useWorkspaceStore((s) => s.selectedNotePath)
  const saveCurrentFile = useWorkspaceStore((s) => s.saveCurrentFile)
  const pushState = useUndoStore((s) => s.pushState)
  const undo = useUndoStore((s) => s.undo)
  const redo = useUndoStore((s) => s.redo)
  const undoStacks = useUndoStore((s) => s.undoStacks)
  const { setSelection } = useSelectionContext()
  const storeSetSelection = useTextSelectionStore((s) => s.setSelection)
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState('')

  const contentRef = useRef<HTMLDivElement>(null)
  // Refs to avoid stale closures in event listener
  const contentDataRef = useRef({ content: '', contentId: '' })
  const file = currentFileContent
  const isNote = !!selectedNotePath
  const contentId = selectedNotePath || selectedFilePath || ''
  const content = file?.content || ''
  const title = file?.name || ''
  // Keep refs fresh
  contentDataRef.current = { content, contentId }

  const stack = undoStacks[contentId]
  const canUndo = !!(stack && stack.past.length > 0)
  const canRedo = !!(stack && stack.future.length > 0)

  // Selection listener — both mouseup and selectionchange
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null
    const capture = () => {
      if (timer) clearTimeout(timer)
      timer = setTimeout(() => {
        const sel = window.getSelection()
        if (!sel || sel.isCollapsed) return
        const text = sel.toString().trim()
        if (!text) return
        const { content: curContent, contentId: curId } = contentDataRef.current
        if (!curContent) return
        // Try exact match first, then try finding any overlapping text
        let idx = curContent.indexOf(text)
        if (idx === -1) {
          // Try shorter match (first 20 chars)
          const short = text.slice(0, 20)
          idx = curContent.indexOf(short)
          if (idx === -1) return
        }
        const selData = { text, startIndex: idx, endIndex: idx + text.length, contentId: curId, fullContent: curContent }
        setSelection(selData)
        storeSetSelection(selData)
      }, 100)
    }
    document.addEventListener('mouseup', capture)
    document.addEventListener('selectionchange', capture)
    return () => {
      document.removeEventListener('mouseup', capture)
      document.removeEventListener('selectionchange', capture)
      if (timer) clearTimeout(timer)
    }
  }, [setSelection])

  const handleStartEdit = () => {
    pushState(contentId, content)
    setEditContent(content)
    setIsEditing(true)
  }

  const handleSaveEdit = async () => {
    await saveCurrentFile(editContent)
    setIsEditing(false)
  }

  const handleUndo = () => {
    const prev = undo(contentId)
    if (prev === null) return
    if (isEditing) {
      setEditContent(prev)
    } else {
      saveCurrentFile(prev)
    }
  }

  const handleRedo = () => {
    const next = redo(contentId)
    if (next === null) return
    if (isEditing) {
      setEditContent(next)
    } else {
      saveCurrentFile(next)
    }
  }

  if (!file) {
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
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
              </svg>
            }
            title="选择文件"
            description="从左侧文件树选择文档或笔记"
          />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="glass flex items-center justify-between px-5 py-2.5 flex-shrink-0"
        style={{ borderBottom: '1px solid var(--border-color)' }}>
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex items-center gap-0.5 mr-2">
            <button onClick={handleUndo} disabled={!canUndo}
              className="w-6 h-6 rounded flex items-center justify-center smooth-transition disabled:opacity-25"
              style={{ color: 'var(--text-secondary)' }} title="撤销">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
              </svg>
            </button>
            <button onClick={handleRedo} disabled={!canRedo}
              className="w-6 h-6 rounded flex items-center justify-center smooth-transition disabled:opacity-25"
              style={{ color: 'var(--text-secondary)' }} title="重做">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
              </svg>
            </button>
          </div>
          <h1 className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{title}</h1>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
            style={{ background: isNote ? 'rgba(96,165,250,0.15)' : 'var(--accent-light)', color: isNote ? '#60a5fa' : 'var(--accent)' }}>
            {isNote ? '笔记' : file.ext?.toUpperCase() || 'FILE'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>{content.length} 字</span>
          {!isEditing ? (
            <button onClick={handleStartEdit} className="text-xs px-2.5 py-1 rounded-full smooth-transition"
              style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}>编辑</button>
          ) : (
            <>
              <button onClick={() => { setIsEditing(false); setEditContent('') }} className="text-xs px-2.5 py-1 rounded-full"
                style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>取消</button>
              <button onClick={handleSaveEdit} className="text-xs px-2.5 py-1 rounded-full"
                style={{ background: 'var(--accent)', color: '#fff' }}>保存</button>
            </>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-8 py-6">
        <div className="max-w-3xl mx-auto relative" ref={contentRef}>
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
