import React, { useState, useCallback, useRef, useEffect } from 'react'
import FileTree from '@/components/tree/FileTree'
import ContentViewer from '@/components/viewer/ContentViewer'
import AIPanel from '@/components/ai-panel/AIPanel'
import { useWorkspaceStore } from '@/stores/workspaceStore'
import { PROVIDERS, PROVIDER_ORDER, hasApiKey } from '@/services/aiService'
import { saveApiKey, getApiKey, saveProviderConfig, saveModel, getProvider, getModel } from '@/services/apiKeyStore'
import type { AIProvider } from '@/types'

type Theme = 'light' | 'dark' | 'system'

interface Props { onOpenStarMap: () => void }

export default function ThreeColumnLayout({ onOpenStarMap }: Props) {
  const workspacePath = useWorkspaceStore((s) => s.workspacePath)
  const openWorkspace = useWorkspaceStore((s) => s.openWorkspace)

  // Column widths
  const [leftW, setLeftW] = useState(() => Number(localStorage.getItem('xingtu-left-w')) || 240)
  const [rightW, setRightW] = useState(() => Number(localStorage.getItem('xingtu-right-w')) || 380)

  // Theme
  const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem('xingtu-theme') as Theme) || 'system')
  const [showSettings, setShowSettings] = useState(false)
  const [activeProvider, setActiveProvider] = useState<AIProvider>(getProvider())
  const [apiKeyInput, setApiKeyInput] = useState(() => getApiKey(getProvider()))
  const [selectedModel, setSelectedModel] = useState(() => {
    const saved = getModel()
    const config = PROVIDERS[getProvider()]
    return saved || config.defaultModel
  })
  const [customURL, setCustomURL] = useState(() => localStorage.getItem('xingtu-url-custom') || '')
  const [settingsMsg, setSettingsMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const keyConfigured = !!getApiKey(activeProvider)

  // Apply theme
  useEffect(() => {
    const root = document.documentElement
    const apply = (t: 'light' | 'dark') => {
      if (t === 'dark') { root.classList.add('dark'); root.classList.remove('light') }
      else { root.classList.remove('dark'); root.classList.add('light') }
    }
    if (theme === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)')
      apply(mq.matches ? 'dark' : 'light')
      const h = (e: MediaQueryListEvent) => apply(e.matches ? 'dark' : 'light')
      mq.addEventListener('change', h)
      return () => mq.removeEventListener('change', h)
    } else { apply(theme) }
  }, [theme])

  useEffect(() => { localStorage.setItem('xingtu-theme', theme) }, [theme])

  // Resize logic
  const resizing = useRef<'left' | 'right' | null>(null)
  const startX = useRef(0)
  const startW = useRef(0)

  const handleResizeStart = useCallback((side: 'left' | 'right', e: React.MouseEvent) => {
    e.preventDefault()
    resizing.current = side
    startX.current = e.clientX
    startW.current = side === 'left' ? leftW : rightW
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
  }, [leftW, rightW])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!resizing.current) return
      const dx = e.clientX - startX.current
      if (resizing.current === 'left') {
        const w = Math.max(160, Math.min(500, startW.current + dx))
        setLeftW(w)
        localStorage.setItem('xingtu-left-w', String(w))
      } else {
        const w = Math.max(280, Math.min(600, startW.current - dx))
        setRightW(w)
        localStorage.setItem('xingtu-right-w', String(w))
      }
    }
    const handleMouseUp = () => {
      if (resizing.current) {
        resizing.current = null
        document.body.style.cursor = ''
        document.body.style.userSelect = ''
      }
    }
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [])

  // Settings handlers
  const handleSwitchProvider = (p: AIProvider) => {
    setActiveProvider(p)
    setApiKeyInput(getApiKey(p))
    const config = PROVIDERS[p]
    const saved = localStorage.getItem('xingtu-model')
    setSelectedModel(saved && config.models.find((m) => m.id === saved) ? saved : config.defaultModel)
    setCustomURL(localStorage.getItem(`xingtu-url-${p}`) || '')
    setSettingsMsg(null)
  }

  const handleSaveSettings = () => {
    const key = apiKeyInput.trim()
    if (key) saveApiKey(activeProvider, key)
    saveProviderConfig(activeProvider, activeProvider === 'custom' ? customURL : undefined)
    saveModel(selectedModel)
    if (activeProvider === 'custom' && customURL) localStorage.setItem('xingtu-url-custom', customURL)
    setSettingsMsg({ type: 'success', text: '设置已保存' })
    setTimeout(() => setSettingsMsg(null), 2000)
  }

  const handleClearKey = () => {
    saveApiKey(activeProvider, '')
    setApiKeyInput('')
    setSettingsMsg({ type: 'success', text: 'API Key 已清除' })
    setTimeout(() => setSettingsMsg(null), 2000)
  }

  const toggleTheme = () => setTheme((t) => t === 'light' ? 'dark' : t === 'dark' ? 'system' : 'light')
  const themeIcon = theme === 'dark' ? 'moon' : theme === 'light' ? 'sun' : 'monitor'

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden" style={{ background: 'var(--bg-primary)' }}>
      {/* Top bar */}
      <div
        className="flex items-center justify-between px-4 py-1.5 flex-shrink-0"
        style={{
          background: 'var(--bg-secondary)',
          borderBottom: '1px solid var(--border-color)',
          WebkitAppRegion: 'drag',
        } as React.CSSProperties}
      >
        {/* Left: workspace */}
        <div className="flex items-center gap-2 min-w-0" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2" style={{ color: 'var(--accent)', flexShrink: 0 }}>
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
          </svg>
          {workspacePath ? (
            <span className="text-[11px] truncate font-medium" style={{ color: 'var(--text-secondary)' }}>
              {workspacePath.split(/[/\\]/).pop()}
            </span>
          ) : (
            <span className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>未打开工作区</span>
          )}
          <button
            onClick={openWorkspace}
            className="text-[10px] px-2 py-0.5 rounded-full smooth-transition hover:opacity-80"
            style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}
          >
            {workspacePath ? '切换' : '打开工作区'}
          </button>
        </div>

        {/* Right: actions */}
        <div className="flex items-center gap-1" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
          {/* Star map */}
          <button onClick={onOpenStarMap}
            className="w-6 h-6 rounded-md flex items-center justify-center smooth-transition hover:opacity-70"
            style={{ color: 'var(--text-secondary)' }} title="知识星图">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="12" cy="12" r="3" /><circle cx="4" cy="4" r="1" /><circle cx="20" cy="6" r="1.2" />
              <circle cx="6" cy="18" r="1" /><circle cx="18" cy="16" r="0.8" />
              <line x1="12" y1="9" x2="20" y2="6" /><line x1="12" y1="9" x2="4" y2="4" />
            </svg>
          </button>

          {/* Theme */}
          <button onClick={toggleTheme}
            className="w-6 h-6 rounded-md flex items-center justify-center smooth-transition hover:opacity-70"
            style={{ color: 'var(--text-secondary)' }} title="切换主题">
            {themeIcon === 'sun' && (<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" /></svg>)}
            {themeIcon === 'moon' && (<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></svg>)}
            {themeIcon === 'monitor' && (<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" /></svg>)}
          </button>

          {/* Settings */}
          <button onClick={() => { setShowSettings(true); setSettingsMsg(null) }}
            className="w-6 h-6 rounded-md flex items-center justify-center smooth-transition hover:opacity-70"
            style={{ color: hasApiKey() ? 'var(--accent)' : 'var(--text-secondary)' }} title="设置">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>
          </button>
        </div>
      </div>

      {/* Three columns */}
      <div className="flex-1 flex min-h-0">
        {/* Left column */}
        <div style={{ width: leftW, flexShrink: 0 }}>
          <FileTree />
        </div>

        {/* Left resize handle */}
        <div
          onMouseDown={(e) => handleResizeStart('left', e)}
          className="w-1 flex-shrink-0 cursor-col-resize hover:bg-blue-500/30 transition-colors z-10"
          style={{ background: 'var(--border-color)' }}
        />

        {/* Center column */}
        <div className="flex-1 min-w-0">
          <ContentViewer />
        </div>

        {/* Right resize handle */}
        <div
          onMouseDown={(e) => handleResizeStart('right', e)}
          className="w-1 flex-shrink-0 cursor-col-resize hover:bg-blue-500/30 transition-colors z-10"
          style={{ background: 'var(--border-color)' }}
        />

        {/* Right column */}
        <div style={{ width: rightW, flexShrink: 0 }}>
          <AIPanel />
        </div>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center animate-fade-in"
          style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}
          onClick={() => setShowSettings(false)}>
          <div className="w-[520px] rounded-2xl p-6 shadow-lg max-h-[85vh] overflow-y-auto"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
            onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div><h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>选择 AI 服务</h2>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>选择一个提供商并填入 API Key</p></div>
              <button onClick={() => setShowSettings(false)} className="w-6 h-6 rounded-full flex items-center justify-center" style={{ color: 'var(--text-tertiary)' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2 mb-4">
              {PROVIDER_ORDER.map((p) => {
                const cfg = PROVIDERS[p]; const isActive = activeProvider === p; const hasKey = !!getApiKey(p)
                return (
                  <button key={p} onClick={() => handleSwitchProvider(p)} className="text-left p-3 rounded-xl smooth-transition"
                    style={{ background: isActive ? 'var(--accent-light)' : 'var(--input-bg)', border: isActive ? '1.5px solid var(--accent)' : '1px solid var(--border-color)' }}>
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-xs font-semibold" style={{ color: isActive ? 'var(--accent)' : 'var(--text-primary)' }}>{cfg.name}</span>
                      {hasKey && <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#22c55e' }} />}
                    </div>
                    <p className="text-[10px] leading-tight" style={{ color: 'var(--text-tertiary)' }}>{cfg.desc}</p>
                  </button>
                )
              })}
            </div>
            {PROVIDERS[activeProvider].requiresAuth && (
              <div className="mb-4">
                <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>API Key{keyConfigured && <span className="ml-1.5 text-[10px]" style={{ color: '#22c55e' }}>已配置</span>}</label>
                <div className="flex gap-2">
                  <input type="password" value={apiKeyInput} onChange={(e) => { setApiKeyInput(e.target.value); setSettingsMsg(null) }}
                    placeholder={`粘贴 ${PROVIDERS[activeProvider].name} 的 API Key`}
                    className="flex-1 rounded-lg px-3 py-2 text-sm outline-none"
                    style={{ background: 'var(--input-bg)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }} />
                  {keyConfigured && <button onClick={handleClearKey} className="px-3 py-2 rounded-lg text-xs" style={{ color: '#ef4444', background: 'rgba(239,68,68,0.1)' }}>清除</button>}
                </div>
              </div>
            )}
            {PROVIDERS[activeProvider].models.length > 0 && (
              <div className="mb-4">
                <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>模型选择</label>
                <select value={selectedModel} onChange={(e) => setSelectedModel(e.target.value)}
                  className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                  style={{ background: 'var(--input-bg)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}>
                  {PROVIDERS[activeProvider].models.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </div>
            )}
            {activeProvider === 'custom' && (<>
              <div className="mb-3"><label className="text-xs font-medium mb-1 block" style={{ color: 'var(--text-secondary)' }}>API URL (OpenAI 兼容)</label>
                <input type="text" value={customURL} onChange={(e) => setCustomURL(e.target.value)} placeholder="https://api.openai.com/v1/chat/completions"
                  className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={{ background: 'var(--input-bg)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }} /></div>
              <div className="mb-4"><label className="text-xs font-medium mb-1 block" style={{ color: 'var(--text-secondary)' }}>模型 ID</label>
                <input type="text" value={selectedModel} onChange={(e) => setSelectedModel(e.target.value)} placeholder="gpt-4o"
                  className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={{ background: 'var(--input-bg)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }} /></div>
            </>)}
            {activeProvider === 'ollama' && (
              <div className="mb-4 p-3 rounded-lg text-xs" style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}>
                使用前请确保已安装并启动 Ollama，并已拉取对应模型。无需 API Key。
              </div>
            )}
            <button onClick={handleSaveSettings} className="w-full py-2.5 rounded-xl text-sm font-semibold smooth-transition hover:opacity-90 mb-5"
              style={{ background: 'var(--accent)', color: '#fff' }}>保存配置</button>
            {settingsMsg && <p className="text-xs mb-4 text-center" style={{ color: settingsMsg.type === 'success' ? '#22c55e' : '#ef4444' }}>{settingsMsg.text}</p>}
            <div style={{ borderTop: '1px solid var(--border-color)' }} className="pt-4">
              <label className="text-xs font-medium mb-2 block" style={{ color: 'var(--text-secondary)' }}>外观</label>
              <div className="flex gap-2">
                {(['light', 'dark', 'system'] as Theme[]).map((t) => (
                  <button key={t} onClick={() => setTheme(t)} className="flex-1 py-2 rounded-lg text-xs font-medium smooth-transition"
                    style={{ background: theme === t ? 'var(--accent)' : 'var(--input-bg)', color: theme === t ? '#fff' : 'var(--text-secondary)' }}>{t === 'light' ? '浅色' : t === 'dark' ? '深色' : '跟随系统'}</button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
