import React from 'react'
import ChatMessages from './ChatMessages'
import ChatInput from './ChatInput'
import { useWorkspaceStore } from '@/stores/workspaceStore'

export default function AIPanel() {
  const selectedFilePath = useWorkspaceStore((s) => s.selectedFilePath)
  const activeNotePath = useWorkspaceStore((s) => s.activeNotePath)
  const setActiveNote = useWorkspaceStore((s) => s.setActiveNote)

  const handleNewNote = () => {
    setActiveNote(null) // Next AI response will create a new note
  }

  return (
    <div className="flex flex-col h-full" style={{
      background: 'var(--bg-secondary)',
      borderLeft: '1px solid var(--border-color)',
    }}>
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
      <ChatMessages />
      <ChatInput />
    </div>
  )
}
