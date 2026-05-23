import React from 'react'
import ChatMessages from './ChatMessages'
import ChatInput from './ChatInput'
import { useWorkspaceStore } from '@/stores/workspaceStore'
import { useTextSelectionStore } from '@/stores/textSelectionStore'

export default function AIPanel() {
  const selectedFilePath = useWorkspaceStore((s) => s.selectedFilePath)
  const activeNotePath = useWorkspaceStore((s) => s.activeNotePath)
  const setActiveNote = useWorkspaceStore((s) => s.setActiveNote)
  const textSelection = useTextSelectionStore((s) => s.selection)
  const clearSelection = useTextSelectionStore((s) => s.clearSelection)

  const handleNewNote = () => setActiveNote(null)

  return (
    <div className="flex flex-col h-full" style={{
      background: 'var(--bg-secondary)',
      borderLeft: '1px solid var(--border-color)',
    }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 flex-shrink-0"
        style={{ borderBottom: '1px solid var(--border-color)' }}>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>AI 对话</span>
          {!selectedFilePath && (
            <span className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>— 选择文档开始提问</span>
          )}
          {selectedFilePath && activeNotePath && (
            <span className="text-[9px] px-1.5 py-0.5 rounded-full"
              style={{ background: 'rgba(96,165,250,0.12)', color: '#60a5fa' }}>
              笔记中
            </span>
          )}
        </div>
        {selectedFilePath && (
          <button onClick={handleNewNote}
            className="flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-medium smooth-transition hover:opacity-80"
            style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            新笔记
          </button>
        )}
      </div>

      {/* Selection hint — visually prominent when active */}
      <div className="flex items-center gap-2 px-4 py-2.5 flex-shrink-0"
        style={{
          background: textSelection
            ? 'rgba(0,113,227,0.1)'
            : 'transparent',
          borderBottom: textSelection
            ? '1.5px solid rgba(0,113,227,0.25)'
            : '1.5px solid transparent',
          transition: 'all 0.25s ease',
        }}>
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
          style={{
            color: textSelection ? 'var(--accent)' : 'transparent',
            flexShrink: 0,
            transition: 'color 0.25s',
            opacity: textSelection ? 1 : 0,
          }}>
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
        <span className="text-[10px] truncate flex-1 font-medium" style={{
          color: textSelection ? 'var(--accent)' : 'var(--text-tertiary)',
          transition: 'color 0.25s',
        }}>
          {textSelection
            ? `已选中 ${textSelection.text.length} 字 · 输入问题基于选中内容回答`
            : '选中文本即可基于内容提问'}
        </span>
        {textSelection && (
          <button onClick={clearSelection}
            className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 hover:bg-blue-500/10 transition-colors"
            style={{ color: 'var(--accent)' }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </div>

      <ChatMessages />
      <ChatInput />
    </div>
  )
}
