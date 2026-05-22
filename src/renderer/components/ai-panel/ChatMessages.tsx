import React, { useRef, useEffect, useState, useCallback } from 'react'
import { useChatStore } from '@/stores/chatStore'
import { useWorkspaceStore } from '@/stores/workspaceStore'
import { useDiffStore } from '@/stores/diffStore'
import { useTextSelectionStore } from '@/stores/textSelectionStore'
import MarkdownRenderer from '@/components/viewer/MarkdownRenderer'
import EmptyState from '@/components/common/EmptyState'

export default function ChatMessages() {
  const messages = useChatStore((s) => s.messages)
  const streamingContent = useChatStore((s) => s.streamingContent)
  const isStreaming = useChatStore((s) => s.isStreaming)
  const isLoading = useChatStore((s) => s.isLoading)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingContent])

  if (messages.length === 0 && !isStreaming) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <EmptyState
          icon={
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round">
              <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z" />
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          }
          title="开始提问"
          description="在下方输入你对文档的问题，AI 将基于文档内容为你解答"
        />
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
      {messages.map((msg) => (
        <ChatBubble key={msg.id} role={msg.role} content={msg.content} />
      ))}

      {isStreaming && streamingContent && (
        <ChatBubble role="assistant" content={streamingContent} isStreaming />
      )}

      {isLoading && !streamingContent && (
        <div className="flex items-center gap-2 px-2 py-3">
          <div
            className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: 'var(--bg-tertiary)' }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
            </svg>
          </div>
          <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
            AI 正在思考...
          </span>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  )
}

const ChatBubble = React.memo(function ChatBubble({
  role,
  content,
  isStreaming,
}: {
  role: 'user' | 'assistant' | 'system'
  content: string
  isStreaming?: boolean
}) {
  const isUser = role === 'user'
  const isAssistant = role === 'assistant'

  return (
    <div className={`flex gap-2.5 ${isUser ? 'flex-row-reverse' : ''} animate-fade-in`}>
      <div
        className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
        style={{
          background: isUser ? 'var(--accent)' : 'var(--bg-tertiary)',
          color: isUser ? '#fff' : 'var(--text-secondary)',
        }}
      >
        {isUser ? (
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        ) : (
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z" />
            <path d="M8 10s1.5 2 4 2 4-2 4-2" />
            <line x1="9" y1="15" x2="15" y2="15" />
          </svg>
        )}
      </div>

      <div className="max-w-[85%]">
        <div
          className={`rounded-2xl px-3.5 py-2.5 leading-relaxed ${
            isStreaming ? 'typing-cursor' : ''
          }`}
          style={{
            background: isUser ? 'var(--chat-user-bg)' : 'var(--chat-ai-bg)',
            color: isUser ? 'var(--chat-user-text)' : 'var(--chat-ai-text)',
            borderTopRightRadius: isUser ? '4px' : undefined,
            borderTopLeftRadius: !isUser ? '4px' : undefined,
          }}
        >
          {isStreaming ? (
            <div className="text-[13px] whitespace-pre-wrap break-words">{content}</div>
          ) : (
            <div className="text-[13px] break-words min-w-0">
              <MarkdownRenderer content={content} />
            </div>
          )}
        </div>

        {/* Action buttons for assistant messages */}
        {isAssistant && !isStreaming && content.length > 20 && (
          <ActionButtons content={content} />
        )}
      </div>
    </div>
  )
})

function ActionButtons({ content }: { content: string }) {
  const selectedFilePath = useWorkspaceStore((s) => s.selectedFilePath)
  const selectedNotePath = useWorkspaceStore((s) => s.selectedNotePath)
  const currentFileContent = useWorkspaceStore((s) => s.currentFileContent)
  const showDiff = useDiffStore((s) => s.showDiff)
  const [copied, setCopied] = useState(false)

  const handleApplyToDoc = useCallback(() => {
    if (!selectedFilePath) return
    const oldContent = currentFileContent?.content || ''
    const textSel = useTextSelectionStore.getState().selection
    if (textSel && textSel.contentId === selectedFilePath) {
      const newFull = textSel.fullContent.slice(0, textSel.startIndex) + content + textSel.fullContent.slice(textSel.endIndex)
      showDiff(textSel.fullContent, newFull, 'document', `选中位置替换 (${textSel.text.length}字 → ${content.length}字)`)
    } else {
      showDiff(oldContent, content, 'document', `文档差异对比`)
    }
  }, [selectedFilePath, currentFileContent, content, showDiff])

  const handleApplyToNote = useCallback(() => {
    if (!selectedNotePath) return
    const oldContent = currentFileContent?.content || ''
    showDiff(oldContent, content, 'notes', `笔记差异对比`)
  }, [selectedNotePath, currentFileContent, content, showDiff])

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [content])

  return (
    <div className="flex gap-1 mt-1.5 px-1">
      <ActionBtn
        icon={
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
        }
        label="应用到文档"
        onClick={handleApplyToDoc}
        active={false}
      />
      <ActionBtn
        icon={
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="12" y1="20" x2="12" y2="10" />
            <line x1="18" y1="20" x2="18" y2="4" />
            <line x1="6" y1="20" x2="6" y2="16" />
          </svg>
        }
        label="应用到笔记"
        onClick={handleApplyToNote}
        active={false}
      />
      <ActionBtn
        icon={
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </svg>
        }
        label={copied ? '已复制' : '复制'}
        onClick={handleCopy}
        active={copied}
      />
    </div>
  )
}

function ActionBtn({
  icon, label, onClick, active,
}: {
  icon: React.ReactNode
  label: string
  onClick: () => void
  active: boolean
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1 px-2 py-1 rounded-full text-[10px] smooth-transition hover:opacity-80"
      style={{
        background: active ? 'var(--accent-light)' : 'var(--bg-tertiary)',
        color: active ? 'var(--accent)' : 'var(--text-tertiary)',
      }}
    >
      {icon}
      <span>{label}</span>
    </button>
  )
}
