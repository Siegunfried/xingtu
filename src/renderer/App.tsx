import React, { useEffect, useState, useCallback } from 'react'
import ThreeColumnLayout from '@/components/layout/ThreeColumnLayout'
import { useDocumentStore } from '@/stores/documentStore'
import { useChatStore } from '@/stores/chatStore'
import { useNotesStore } from '@/stores/notesStore'
import { PROVIDERS, PROVIDER_ORDER, hasApiKey } from '@/services/aiService'
import { saveApiKey, getApiKey, saveProviderConfig, saveModel, getProvider, getModel } from '@/services/apiKeyStore'
import StarMapPanel from '@/components/starmap/StarMapPanel'
import DiffPanel from '@/components/diff/DiffPanel'
import { useDiffStore } from '@/stores/diffStore'
import { useUndoStore } from '@/stores/undoStore'
import type { AIProvider } from '@/types'

type Theme = 'light' | 'dark' | 'system'

export default function App() {
  const loadDocuments = useDocumentStore((s) => s.loadDocuments)
  const importDocument = useDocumentStore((s) => s.importDocument)
  const updateDocument = useDocumentStore((s) => s.updateDocument)
  const currentDocumentId = useDocumentStore((s) => s.currentDocumentId)
  const selectedNoteId = useDocumentStore((s) => s.selectedNoteId)
  const documents = useDocumentStore((s) => s.documents)
  const error = useDocumentStore((s) => s.error)
  const clearError = useDocumentStore((s) => s.clearError)
  const loadMessages = useChatStore((s) => s.loadMessages)
  const loadNote = useNotesStore((s) => s.loadNote)
  const updateNoteContent = useNotesStore((s) => s.updateNoteContent)
  const currentNote = useNotesStore((s) => s.currentNote)

  // Diff panel
  const pendingDiff = useDiffStore((s) => s.pendingDiff)
  const clearDiff = useDiffStore((s) => s.clearDiff)

  // Theme
  const [theme, setTheme] = useState<Theme>(() => {
    return (localStorage.getItem('xingtu-theme') as Theme) || 'system'
  })

  // Drag & Drop
  const [isDragging, setIsDragging] = useState(false)
  const dragCounter = React.useRef(0)

  // Star Map
  const [showStarMap, setShowStarMap] = useState(false)

  // Settings
  const [showSettings, setShowSettings] = useState(false)
  const [activeProvider, setActiveProvider] = useState<AIProvider>(getProvider())
  const [apiKeyInput, setApiKeyInput] = useState(() => getApiKey(getProvider()))
  const [selectedModel, setSelectedModel] = useState(() => {
    const saved = getModel()
    const config = PROVIDERS[getProvider()]
    return saved || config.defaultModel
  })
  const [customURL, setCustomURL] = useState(() => {
    return localStorage.getItem(`xingtu-url-custom`) || ''
  })
  const [settingsMsg, setSettingsMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Apply theme
  useEffect(() => {
    const root = document.documentElement
    const applyTheme = (t: 'light' | 'dark') => {
      if (t === 'dark') {
        root.classList.add('dark')
        root.classList.remove('light')
      } else {
        root.classList.remove('dark')
        root.classList.add('light')
      }
    }
    if (theme === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)')
      applyTheme(mq.matches ? 'dark' : 'light')
      const handler = (e: MediaQueryListEvent) => applyTheme(e.matches ? 'dark' : 'light')
      mq.addEventListener('change', handler)
      return () => mq.removeEventListener('change', handler)
    } else {
      applyTheme(theme)
    }
  }, [theme])

  useEffect(() => {
    localStorage.setItem('xingtu-theme', theme)
  }, [theme])

  // Load data on mount
  useEffect(() => {
    loadDocuments()
  }, [])

  // Drag & Drop handlers
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounter.current++
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true)
    }
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounter.current--
    if (dragCounter.current <= 0) {
      setIsDragging(false)
    }
  }, [])

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    dragCounter.current = 0

    const files = e.dataTransfer.files
    if (files.length === 0) return

    const file = files[0]
    const ext = file.name.split('.').pop()?.toLowerCase()
    if (!ext || !['pdf', 'docx', 'txt', 'md'].includes(ext)) {
      return
    }

    try {
      const buffer = await file.arrayBuffer()
      const bytes = new Uint8Array(buffer)
      let base64 = ''
      for (let i = 0; i < bytes.length; i++) {
        base64 += String.fromCharCode(bytes[i])
      }
      base64 = btoa(base64)

      const format = ext as 'pdf' | 'docx' | 'txt' | 'md'
      const docId = await importDocument(file.name, format, base64)
      await loadMessages(docId)
      await loadNote(docId)
    } catch {
      // error handled in store
    }
  }, [importDocument, loadMessages, loadNote])

  // Diff accept/reject
  const handleDiffAccept = useCallback(async () => {
    if (!pendingDiff) return
    const { oldContent, newContent, target } = pendingDiff
    const id = target === 'document' ? currentDocumentId : selectedNoteId
    if (id) {
      useUndoStore.getState().pushState(id, oldContent)
    }
    if (target === 'document' && currentDocumentId) {
      await updateDocument(currentDocumentId, newContent)
    } else if (target === 'notes') {
      await updateNoteContent(newContent)
    }
    clearDiff()
  }, [pendingDiff, currentDocumentId, selectedNoteId, updateDocument, updateNoteContent, clearDiff])

  const handleDiffReject = useCallback(() => {
    clearDiff()
  }, [clearDiff])

  // Settings handlers
  const handleSwitchProvider = (p: AIProvider) => {
    setActiveProvider(p)
    setApiKeyInput(getApiKey(p))
    const config = PROVIDERS[p]
    const savedModel = localStorage.getItem('xingtu-model')
    setSelectedModel(savedModel && config.models.find((m) => m.id === savedModel) ? savedModel : config.defaultModel)
    setCustomURL(localStorage.getItem(`xingtu-url-${p}`) || '')
    setSettingsMsg(null)
  }

  const handleSaveSettings = () => {
    const key = apiKeyInput.trim()
    if (key) {
      saveApiKey(activeProvider, key)
    }
    saveProviderConfig(activeProvider, activeProvider === 'custom' ? customURL : undefined)
    saveModel(selectedModel)
    if (activeProvider === 'custom' && customURL) {
      localStorage.setItem('xingtu-url-custom', customURL)
    }
    setSettingsMsg({ type: 'success', text: '设置已保存' })
    setTimeout(() => setSettingsMsg(null), 2000)
  }

  const handleClearKey = () => {
    saveApiKey(activeProvider, '')
    setApiKeyInput('')
    setSettingsMsg({ type: 'success', text: 'API Key 已清除' })
    setTimeout(() => setSettingsMsg(null), 2000)
  }

  const toggleTheme = () => {
    setTheme((t) => {
      if (t === 'light') return 'dark'
      if (t === 'dark') return 'system'
      return 'light'
    })
  }

  const themeIcon = theme === 'dark' ? 'moon' : theme === 'light' ? 'sun' : 'monitor'
  const keyConfigured = !!getApiKey(activeProvider)

  return (
    <div
      className="h-screen w-screen overflow-hidden"
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {showStarMap ? (
        <StarMapPanel onClose={() => setShowStarMap(false)} />
      ) : (
        <ThreeColumnLayout />
      )}

      {/* Drag overlay */}
      {isDragging && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center animate-fade-in"
          style={{
            background: 'rgba(0,113,227,0.08)',
            backdropFilter: 'blur(8px)',
            border: '2px dashed var(--accent)',
          }}
        >
          <div className="flex flex-col items-center gap-3">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{ background: 'var(--accent)', color: '#fff' }}
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
            </div>
            <p className="text-sm font-medium" style={{ color: 'var(--accent)' }}>
              释放文件以导入文档
            </p>
            <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
              支持 PDF、DOCX、TXT、Markdown
            </p>
          </div>
        </div>
      )}

      {/* Top-right buttons */}
      <div
        className="fixed top-3 right-3 flex items-center gap-1.5 z-40"
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
      >
        <button
          onClick={toggleTheme}
          className="w-7 h-7 rounded-full flex items-center justify-center smooth-transition glass"
          style={{
            color: 'var(--text-secondary)',
            border: '1px solid var(--border-color)',
            boxShadow: 'var(--shadow-sm)',
          }}
          title={`主题: ${theme === 'system' ? '跟随系统' : theme === 'dark' ? '深色' : '浅色'}`}
        >
          {themeIcon === 'sun' && (
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="12" cy="12" r="5" />
              <line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
              <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
            </svg>
          )}
          {themeIcon === 'moon' && (
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          )}
          {themeIcon === 'monitor' && (
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
              <line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" />
            </svg>
          )}
        </button>

        {/* Star Map button */}
        <button
          onClick={() => setShowStarMap((v) => !v)}
          className="w-7 h-7 rounded-full flex items-center justify-center smooth-transition glass"
          style={{
            color: showStarMap ? 'var(--accent)' : 'var(--text-secondary)',
            border: '1px solid var(--border-color)',
            boxShadow: 'var(--shadow-sm)',
          }}
          title="星图"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="12" cy="12" r="3" />
            <circle cx="4" cy="4" r="1" />
            <circle cx="20" cy="6" r="1.2" />
            <circle cx="6" cy="18" r="1" />
            <circle cx="18" cy="16" r="0.8" />
            <line x1="12" y1="9" x2="20" y2="6" />
            <line x1="12" y1="9" x2="4" y2="4" />
            <line x1="13.5" y1="13.5" x2="6" y2="18" />
            <line x1="13.5" y1="13.5" x2="18" y2="16" />
          </svg>
        </button>

        <button
          onClick={() => {
            setShowSettings(true)
            setSettingsMsg(null)
          }}
          className="w-7 h-7 rounded-full flex items-center justify-center smooth-transition glass"
          style={{
            color: hasApiKey() ? 'var(--accent)' : 'var(--text-secondary)',
            border: '1px solid var(--border-color)',
            boxShadow: 'var(--shadow-sm)',
          }}
          title="设置"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </button>
      </div>

      {/* Diff Panel */}
      {pendingDiff && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[700px] max-w-[90vw] shadow-2xl">
          <DiffPanel
            oldContent={pendingDiff.oldContent}
            newContent={pendingDiff.newContent}
            title={pendingDiff.title}
            onAccept={handleDiffAccept}
            onReject={handleDiffReject}
          />
        </div>
      )}

      {/* Error Toast */}
      {error && (
        <div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-xl text-sm shadow-lg animate-fade-in flex items-center gap-2"
          style={{ background: 'var(--bg-card)', color: '#ef4444', border: '1px solid var(--border-color)' }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
          </svg>
          {error}
          <button onClick={clearError} className="ml-1 opacity-60 hover:opacity-100">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center animate-fade-in"
          style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}
          onClick={() => setShowSettings(false)}
        >
          <div
            className="w-[520px] rounded-2xl p-6 shadow-lg max-h-[85vh] overflow-y-auto"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
                  选择 AI 服务
                </h2>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                  选择一个提供商并填入 API Key 即可开始使用
                </p>
              </div>
              <button
                onClick={() => setShowSettings(false)}
                className="w-6 h-6 rounded-full flex items-center justify-center smooth-transition"
                style={{ color: 'var(--text-tertiary)' }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Provider cards */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              {PROVIDER_ORDER.map((p) => {
                const cfg = PROVIDERS[p]
                const isActive = activeProvider === p
                const hasKey = !!getApiKey(p)
                return (
                  <button
                    key={p}
                    onClick={() => handleSwitchProvider(p)}
                    className="text-left p-3 rounded-xl smooth-transition"
                    style={{
                      background: isActive ? 'var(--accent-light)' : 'var(--input-bg)',
                      border: isActive ? '1.5px solid var(--accent)' : '1px solid var(--border-color)',
                    }}
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-xs font-semibold" style={{ color: isActive ? 'var(--accent)' : 'var(--text-primary)' }}>
                        {cfg.name}
                      </span>
                      {hasKey && (
                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#22c55e' }} />
                      )}
                    </div>
                    <p className="text-[10px] leading-tight" style={{ color: 'var(--text-tertiary)' }}>
                      {cfg.desc}
                    </p>
                  </button>
                )
              })}
            </div>

            {/* API Key — only for providers that need auth */}
            {PROVIDERS[activeProvider].requiresAuth && (
              <div className="mb-4">
                <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>
                  API Key
                  {keyConfigured && (
                    <span className="ml-1.5 text-[10px]" style={{ color: '#22c55e' }}>已配置</span>
                  )}
                </label>
                <div className="flex gap-2">
                  <input
                    type="password"
                    value={apiKeyInput}
                    onChange={(e) => { setApiKeyInput(e.target.value); setSettingsMsg(null) }}
                    placeholder={`粘贴 ${PROVIDERS[activeProvider].name} 的 API Key`}
                    className="flex-1 rounded-lg px-3 py-2 text-sm outline-none"
                    style={{
                      background: 'var(--input-bg)',
                      color: 'var(--text-primary)',
                      border: '1px solid var(--border-color)',
                    }}
                  />
                  {keyConfigured && (
                    <button
                      onClick={handleClearKey}
                      className="px-3 py-2 rounded-lg text-xs smooth-transition"
                      style={{ color: '#ef4444', background: 'rgba(239,68,68,0.1)' }}
                    >
                      清除
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Model selector — all providers */}
            {PROVIDERS[activeProvider].models.length > 0 && (
              <div className="mb-4">
                <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>
                  模型选择
                </label>
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                  style={{
                    background: 'var(--input-bg)',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--border-color)',
                  }}
                >
                  {PROVIDERS[activeProvider].models.map((m) => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Custom: URL + model ID */}
            {activeProvider === 'custom' && (
              <>
                <div className="mb-3">
                  <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--text-secondary)' }}>
                    API URL (OpenAI 兼容)
                  </label>
                  <input
                    type="text" value={customURL}
                    onChange={(e) => setCustomURL(e.target.value)}
                    placeholder="https://api.openai.com/v1/chat/completions"
                    className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                    style={{ background: 'var(--input-bg)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}
                  />
                </div>
                <div className="mb-4">
                  <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--text-secondary)' }}>
                    模型 ID
                  </label>
                  <input
                    type="text" value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    placeholder="gpt-4o"
                    className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                    style={{ background: 'var(--input-bg)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}
                  />
                </div>
              </>
            )}

            {/* Ollama hint */}
            {activeProvider === 'ollama' && (
              <div className="mb-4 p-3 rounded-lg text-xs" style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}>
                使用前请确保已安装并启动 <a href="https://ollama.com" target="_blank" className="underline">Ollama</a>，
                并已拉取对应模型（如 <code>ollama pull qwen3</code>）。无需 API Key。
              </div>
            )}

            {/* Save button */}
            <button
              onClick={handleSaveSettings}
              className="w-full py-2.5 rounded-xl text-sm font-semibold smooth-transition hover:opacity-90 mb-5"
              style={{ background: 'var(--accent)', color: '#fff' }}
            >
              保存配置
            </button>
            {settingsMsg && (
              <p className="text-xs mb-4 text-center" style={{ color: settingsMsg.type === 'success' ? '#22c55e' : '#ef4444' }}>
                {settingsMsg.text}
              </p>
            )}

            {/* Theme */}
            <div style={{ borderTop: '1px solid var(--border-color)' }} className="pt-4">
              <label className="text-xs font-medium mb-2 block" style={{ color: 'var(--text-secondary)' }}>
                外观
              </label>
              <div className="flex gap-2">
                {(['light', 'dark', 'system'] as Theme[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTheme(t)}
                    className="flex-1 py-2 rounded-lg text-xs font-medium smooth-transition"
                    style={{
                      background: theme === t ? 'var(--accent)' : 'var(--input-bg)',
                      color: theme === t ? '#fff' : 'var(--text-secondary)',
                    }}
                  >
                    {t === 'light' ? '浅色' : t === 'dark' ? '深色' : '跟随系统'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
