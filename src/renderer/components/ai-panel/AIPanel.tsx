import React from 'react'
import ChatMessages from './ChatMessages'
import ChatInput from './ChatInput'
import { useWorkspaceStore } from '@/stores/workspaceStore'

export default function AIPanel() {
  const selectedFilePath = useWorkspaceStore((s) => s.selectedFilePath)

  return (
    <div className="flex flex-col h-full" style={{
      background: 'var(--bg-secondary)',
      borderLeft: '1px solid var(--border-color)',
    }}>
      <div className="flex items-center px-4 py-3 flex-shrink-0"
        style={{ borderBottom: '1px solid var(--border-color)' }}>
        <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>AI 对话</span>
        {!selectedFilePath && (
          <span className="text-[10px] ml-2" style={{ color: 'var(--text-tertiary)' }}>— 选择文档开始提问</span>
        )}
      </div>
      <ChatMessages />
      <ChatInput />
    </div>
  )
}
