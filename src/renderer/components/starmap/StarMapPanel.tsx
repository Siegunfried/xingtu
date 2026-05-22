import React, { useState, useCallback } from 'react'
import StarMap from './StarMap'
import { useStarMapStore } from '@/stores/starMapStore'
import { useChatStore } from '@/stores/chatStore'
import { useDocumentStore } from '@/stores/documentStore'
import { useNotesStore } from '@/stores/notesStore'
import { hasApiKey, streamChat, getCurrentConfig } from '@/services/aiService'
import MarkdownRenderer from '@/components/viewer/MarkdownRenderer'

interface StarMapPanelProps {
  onClose: () => void
}

export default function StarMapPanel({ onClose }: StarMapPanelProps) {
  const nodes = useStarMapStore((s) => s.nodes)
  const selectedNodeId = useStarMapStore((s) => s.selectedNodeId)
  const selectNode = useStarMapStore((s) => s.selectNode)
  const addNoteNode = useStarMapStore((s) => s.addNoteNode)

  const [showAskPanel, setShowAskPanel] = useState(false)
  const [question, setQuestion] = useState('')
  const [isThinking, setIsThinking] = useState(false)
  const [answer, setAnswer] = useState('')
  const [error, setError] = useState('')

  const selectedNode = nodes.find((n) => n.id === selectedNodeId)

  const handleAskChild = useCallback(async () => {
    if (!question.trim() || !selectedNode || isThinking) return

    if (!hasApiKey()) {
      setError('请先在设置中配置 API Key')
      return
    }

    setIsThinking(true)
    setAnswer('')
    setError('')

    const parentContent = selectedNode.content.slice(0, 5000)
    const config = getCurrentConfig()

    // Use parent node content as context, ask follow-up
    const fakeDocumentContent = parentContent
    const history: { role: 'user' | 'assistant'; content: string }[] = []

    await streamChat(
      fakeDocumentContent,
      history,
      `针对以下内容，请深入解答：${question}\n\n请用 Markdown 格式输出，给出详细、有深度的回答。`,
      {
        onToken: (token) => {
          setAnswer((prev) => prev + token)
        },
        onDone: async (fullText) => {
          const title = question.length > 30 ? question.slice(0, 30) + '...' : question
          await addNoteNode(
            selectedNode.documentId,
            selectedNode.type === 'note' ? selectedNode.id : null,
            title,
            fullText
          )
          setIsThinking(false)
          setQuestion('')
        },
        onError: (err) => {
          setError(err.message)
          setIsThinking(false)
        },
      }
    )
  }, [question, selectedNode, isThinking, addNoteNode])

  return (
    <div className="fixed inset-0 z-50 flex flex-col animate-fade-in" style={{ background: 'var(--bg-primary)' }}>
      {/* Main: canvas + sidebar */}
      <div className="flex-1 flex min-h-0">

        {/* Star Map canvas */}
        <div className="flex-1 min-w-0 relative">
          <StarMap />

          {/* Floating close button */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-7 h-7 rounded-full flex items-center justify-center smooth-transition z-10"
            style={{
              background: 'var(--bg-glass)',
              backdropFilter: 'blur(12px)',
              color: 'var(--text-secondary)',
              border: '1px solid var(--border-color)',
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Info panel */}
        <div
          className="w-[360px] flex-shrink-0 flex flex-col overflow-y-auto"
          style={{
            background: 'var(--bg-secondary)',
            borderLeft: '1px solid var(--border-color)',
          }}
        >
          {selectedNode ? (
            <div className="flex flex-col h-full">
              {/* Node info header */}
              <div className="px-4 py-4" style={{ borderBottom: '1px solid var(--border-color)' }}>
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                    style={{
                      background: 'var(--accent-light)',
                      color: 'var(--accent)',
                    }}
                  >
                    {selectedNode.type === 'document' ? '文档' : '笔记'}
                  </span>
                  {selectedNode.type === 'note' && (
                    <span className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
                      第{nodes.filter((n) => n.parentNoteId === selectedNode.id || n.id === selectedNode.id).length}层
                    </span>
                  )}
                </div>
                <h3 className="text-sm font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
                  {selectedNode.label}
                </h3>
                <p className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
                  创建于 {new Date(selectedNode.createdAt).toLocaleString('zh-CN')}
                </p>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto px-4 py-3">
                {selectedNode.content.length > 300 ? (
                  <div className="text-xs leading-relaxed markdown-content">
                    <MarkdownRenderer content={selectedNode.content.slice(0, 2000)} />
                    {selectedNode.content.length > 2000 && (
                      <p className="mt-2" style={{ color: 'var(--text-tertiary)' }}>
                        ... (共 {selectedNode.content.length.toLocaleString()} 字符)
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    {selectedNode.content || '(空内容)'}
                  </div>
                )}
              </div>

              {/* Ask button */}
              <div className="px-4 py-3" style={{ borderTop: '1px solid var(--border-color)' }}>
                <button
                  onClick={() => {
                    setShowAskPanel(true)
                    setAnswer('')
                    setError('')
                    setQuestion('')
                  }}
                  className="w-full py-2 rounded-lg text-xs font-medium smooth-transition hover:opacity-90"
                  style={{ background: 'var(--accent)', color: '#fff' }}
                >
                  对此节点深入提问
                </button>
              </div>

              {/* Ask panel */}
              {showAskPanel && (
                <div
                  className="px-4 py-3"
                  style={{
                    background: 'var(--bg-primary)',
                    borderTop: '1px solid var(--border-color)',
                  }}
                >
                  <textarea
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    placeholder="输入问题，AI 将基于此节点内容回答并创建新的子笔记节点..."
                    rows={2}
                    className="w-full resize-none rounded-lg p-2.5 text-xs outline-none mb-2"
                    style={{
                      background: 'var(--input-bg)',
                      color: 'var(--text-primary)',
                      border: '1px solid var(--border-color)',
                    }}
                  />
                  {error && (
                    <p className="text-xs mb-2" style={{ color: '#ef4444' }}>
                      {error}
                    </p>
                  )}
                  {answer && (
                    <div className="max-h-[200px] overflow-y-auto mb-2 p-3 rounded-lg text-xs leading-relaxed markdown-content"
                      style={{ background: 'var(--bg-tertiary)' }}
                    >
                      <MarkdownRenderer content={answer} />
                    </div>
                  )}
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setShowAskPanel(false)
                        setAnswer('')
                        setError('')
                      }}
                      className="flex-1 py-1.5 rounded-lg text-xs smooth-transition"
                      style={{
                        background: 'var(--bg-tertiary)',
                        color: 'var(--text-secondary)',
                      }}
                    >
                      关闭
                    </button>
                    <button
                      onClick={handleAskChild}
                      disabled={!question.trim() || isThinking}
                      className="flex-1 py-1.5 rounded-lg text-xs font-medium smooth-transition disabled:opacity-40"
                      style={{ background: 'var(--accent)', color: '#fff' }}
                    >
                      {isThinking ? '思考中...' : '生成子笔记'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center p-8">
                <div className="mb-4 opacity-30">
                  <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.8">
                    <circle cx="12" cy="12" r="3" />
                    <circle cx="4" cy="4" r="1.5" />
                    <circle cx="20" cy="6" r="1" />
                    <circle cx="6" cy="18" r="1.2" />
                    <circle cx="18" cy="16" r="0.8" />
                    <circle cx="22" cy="20" r="1.3" />
                    <line x1="12" y1="9" x2="20" y2="6" />
                    <line x1="12" y1="9" x2="4" y2="4" />
                    <line x1="12" y1="12" x2="6" y2="18" />
                    <line x1="12" y1="15" x2="18" y2="16" />
                    <line x1="18" y1="16" x2="22" y2="20" />
                  </svg>
                </div>
                <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                  知识星图
                </p>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--text-tertiary)' }}>
                  点击星图中的节点查看详情<br />
                  拖拽旋转视角 · 滚轮缩放<br />
                  对节点深入提问生成子笔记
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
