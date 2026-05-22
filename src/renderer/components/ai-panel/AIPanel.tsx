import React from 'react'
import ChatMessages from './ChatMessages'
import ChatInput from './ChatInput'
import EmptyState from '@/components/common/EmptyState'
import { useWorkspaceStore } from '@/stores/workspaceStore'

export default function AIPanel() {
  const selectedFilePath = useWorkspaceStore((s) => s.selectedFilePath)

  if (!selectedFilePath) {
    return (
      <div className="flex flex-col h-full" style={{
        background: 'var(--bg-secondary)',
        borderLeft: '1px solid var(--border-color)',
      }}>
        <div className="flex items-center px-4 py-3 flex-shrink-0"
          style={{ borderBottom: '1px solid var(--border-color)' }}>
          <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>AI 对话</span>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <EmptyState
            icon={
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            }
            title="AI 阅读助手"
            description="从左侧文件树选择文档后，在这里向 AI 提问"
          />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full" style={{
      background: 'var(--bg-secondary)',
      borderLeft: '1px solid var(--border-color)',
    }}>
      <div className="flex items-center px-4 py-3 flex-shrink-0"
        style={{ borderBottom: '1px solid var(--border-color)' }}>
        <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>AI 对话</span>
      </div>
      <ChatMessages />
      <ChatInput />
    </div>
  )
}
