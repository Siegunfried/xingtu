import React, { useState, useRef, useEffect } from 'react'
import ChatMessages from './ChatMessages'
import ChatInput from './ChatInput'
import NotesAccumulator from './NotesAccumulator'
import EmptyState from '@/components/common/EmptyState'
import { useChatStore } from '@/stores/chatStore'
import { useDocumentStore } from '@/stores/documentStore'

type Tab = 'chat' | 'notes'

export default function AIPanel() {
  const [activeTab, setActiveTab] = useState<Tab>('chat')
  const currentDocumentId = useDocumentStore((s) => s.currentDocumentId)

  if (!currentDocumentId) {
    return (
      <div
        className="flex flex-col h-full"
        style={{
          background: 'var(--bg-secondary)',
          borderLeft: '1px solid var(--border-color)',
        }}
      >
        <EmptyState
          icon={
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          }
          title="AI 阅读助手"
          description="导入文档后，在这里向 AI 提问，获取专业分析和智能笔记"
        />
      </div>
    )
  }

  return (
    <div
      className="flex flex-col h-full"
      style={{
        background: 'var(--bg-secondary)',
        borderLeft: '1px solid var(--border-color)',
      }}
    >
      {/* Tab bar */}
      <div
        className="flex items-center px-3 pt-3 pb-0 gap-1"
        style={{ borderBottom: '1px solid var(--border-color)' }}
      >
        <TabButton active={activeTab === 'chat'} onClick={() => setActiveTab('chat')}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          对话
        </TabButton>
        <TabButton active={activeTab === 'notes'} onClick={() => setActiveTab('notes')}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
          </svg>
          笔记
        </TabButton>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col min-h-0">
        {activeTab === 'chat' ? (
          <>
            <ChatMessages />
            <ChatInput />
          </>
        ) : (
          <NotesAccumulator />
        )}
      </div>
    </div>
  )
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-t-lg smooth-transition"
      style={{
        color: active ? 'var(--accent)' : 'var(--text-tertiary)',
        background: active ? 'var(--bg-primary)' : 'transparent',
        borderBottom: active ? '2px solid var(--accent)' : '2px solid transparent',
      }}
    >
      {children}
    </button>
  )
}
