import React, { useEffect, useState } from 'react'
import { useWorkspaceStore } from '@/stores/workspaceStore'
import { useChatStore } from '@/stores/chatStore'
import { useStarMapStore } from '@/stores/starMapStore'
import MiniStarMap from '@/components/starmap/MiniStarMap'
import type { FileEntry } from '@/types'

const DOC_EXTS = new Set(['pdf', 'docx', 'txt', 'md'])
type SidebarTab = 'files' | 'stars'

export default function FileTree() {
  const workspacePath = useWorkspaceStore((s) => s.workspacePath)
  const rootEntries = useWorkspaceStore((s) => s.rootEntries)
  const openWorkspace = useWorkspaceStore((s) => s.openWorkspace)
  const selectFile = useWorkspaceStore((s) => s.selectFile)
  const selectNote = useWorkspaceStore((s) => s.selectNote)
  const deleteEntry = useWorkspaceStore((s) => s.deleteEntry)
  const selectedFilePath = useWorkspaceStore((s) => s.selectedFilePath)
  const selectedNotePath = useWorkspaceStore((s) => s.selectedNotePath)
  const loadMessages = useChatStore((s) => s.loadMessages)
  const [tab, setTab] = useState<SidebarTab>('files')
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set())
  const [subEntries, setSubEntries] = useState<Record<string, FileEntry[]>>({})

  const selectedStar = useStarMapStore((s) => s.selectedNode)
  const showCard = useStarMapStore((s) => s.showCard)
  const closeCard = useStarMapStore((s) => s.closeCard)

  useEffect(() => {
    const saved = localStorage.getItem('xingtu-workspace')
    if (saved) useWorkspaceStore.getState().setWorkspacePath(saved)
  }, [])

  const toggleDir = async (dirPath: string) => {
    if (expandedDirs.has(dirPath)) {
      setExpandedDirs((prev) => { const n = new Set(prev); n.delete(dirPath); return n })
    } else {
      setExpandedDirs((prev) => new Set(prev).add(dirPath))
      if (!subEntries[dirPath]) {
        const entries = await window.electronAPI.listDir(dirPath)
        setSubEntries((prev) => ({ ...prev, [dirPath]: entries }))
      }
    }
  }

  const handleClickFile = async (filePath: string) => {
    await selectFile(filePath)
    await loadMessages(filePath)
  }

  const handleClickNote = async (notePath: string) => {
    await selectNote(notePath)
    await loadMessages(notePath)
  }

  const handleOpenFromCard = async () => {
    if (!selectedStar) return
    if (selectedStar.type === 'document') {
      await selectFile(selectedStar.path)
      await loadMessages(selectedStar.path)
    } else {
      await selectNote(selectedStar.path)
      await loadMessages(selectedStar.path)
    }
    closeCard()
  }

  if (!workspacePath) {
    return (
      <div className="flex flex-col h-full" style={{ background: 'var(--bg-secondary)' }}>
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="1" className="mx-auto mb-3" style={{ color: 'var(--text-tertiary)' }}>
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
            </svg>
            <p className="text-xs mb-3" style={{ color: 'var(--text-secondary)' }}>选择一个文件夹作为工作区</p>
            <button onClick={openWorkspace} className="text-xs px-4 py-2 rounded-full smooth-transition"
              style={{ background: 'var(--accent)', color: '#fff' }}>打开工作区</button>
          </div>
        </div>
      </div>
    )
  }

  const isDoc = (entry: FileEntry) => DOC_EXTS.has(entry.name.split('.').pop()?.toLowerCase() || '')
  const isNoteDir = (entry: FileEntry) =>
    entry.isDirectory && rootEntries.some((e) => !e.isDirectory && e.name.replace(/\.[^.]+$/, '') === entry.name)

  return (
    <div className="flex flex-col h-full" style={{ background: 'var(--bg-secondary)' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5 flex-shrink-0"
        style={{ borderBottom: '1px solid var(--border-color)' }}>
        <div className="flex items-center gap-1.5 min-w-0">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2" style={{ color: 'var(--accent)' }}>
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
          </svg>
          <span className="text-[10px] truncate" style={{ color: 'var(--text-secondary)' }}>
            {workspacePath.split(/[/\\]/).pop()}
          </span>
        </div>
        <button onClick={openWorkspace} className="w-6 h-6 rounded flex items-center justify-center"
          style={{ color: 'var(--text-tertiary)' }} title="切换工作区">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </button>
      </div>

      {/* Tab bar */}
      <div className="flex items-center px-3 py-1 gap-1 flex-shrink-0"
        style={{ borderBottom: '1px solid var(--border-color)' }}>
        <button onClick={() => setTab('files')}
          className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-medium smooth-transition"
          style={{ background: tab === 'files' ? 'var(--sidebar-active)' : 'transparent', color: tab === 'files' ? 'var(--accent)' : 'var(--text-tertiary)' }}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
          </svg>文件
        </button>
        <button onClick={() => setTab('stars')}
          className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-medium smooth-transition"
          style={{ background: tab === 'stars' ? 'var(--sidebar-active)' : 'transparent', color: tab === 'stars' ? 'var(--accent)' : 'var(--text-tertiary)' }}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="12" cy="12" r="3" /><circle cx="4" cy="4" r="1" /><circle cx="20" cy="6" r="1" />
          </svg>星图
        </button>
      </div>

      {/* File tree view */}
      {tab === 'files' && (
        <div className="flex-1 overflow-y-auto py-1">
          {rootEntries.map((entry) => (
            <TreeItem
              key={entry.path} entry={entry}
              isDoc={isDoc(entry)} isNoteDir={isNoteDir(entry)}
              selectedFilePath={selectedFilePath} selectedNotePath={selectedNotePath}
              isExpanded={expandedDirs.has(entry.path)}
              subEntries={subEntries[entry.path] || []}
              onToggleDir={() => toggleDir(entry.path)}
              onClickFile={handleClickFile} onClickNote={handleClickNote}
              onDelete={deleteEntry}
            />
          ))}
        </div>
      )}

      {/* Star map view */}
      {tab === 'stars' && (
        <div className="flex-1 flex flex-col min-h-0">
          <MiniStarMap />
          <div className="flex-1 overflow-y-auto">
            {showCard && selectedStar && (
              <div className="m-2 p-3 rounded-xl animate-fade-in"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
                <div className="flex items-center gap-1.5 mb-2">
                  <span className="w-2 h-2 rounded-full"
                    style={{ background: selectedStar.type === 'document' ? 'var(--accent)' : '#60a5fa' }} />
                  <span className="text-[10px] font-medium" style={{ color: 'var(--text-tertiary)' }}>
                    {selectedStar.type === 'document' ? '文档' : '笔记'}
                  </span>
                </div>
                <h3 className="text-xs font-semibold mb-1 truncate" style={{ color: 'var(--text-primary)' }}>
                  {selectedStar.name}
                </h3>
                <p className="text-[10px] mb-3" style={{ color: 'var(--text-tertiary)' }}>
                  {selectedStar.path.split(/[/\\]/).slice(-2).join('/')}
                </p>
                <button onClick={handleOpenFromCard}
                  className="w-full py-1.5 rounded-lg text-[10px] font-medium smooth-transition"
                  style={{ background: 'var(--accent)', color: '#fff' }}>
                  打开{selectedStar.type === 'document' ? '文档' : '笔记'}
                </button>
              </div>
            )}
            {!showCard && (
              <div className="flex-1 flex items-center justify-center p-4">
                <p className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>点击星图节点查看详情</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function TreeItem({
  entry, isDoc, isNoteDir, selectedFilePath, selectedNotePath,
  isExpanded, subEntries, onToggleDir, onClickFile, onClickNote, onDelete,
}: {
  entry: FileEntry; isDoc: boolean; isNoteDir: boolean
  selectedFilePath: string | null; selectedNotePath: string | null
  isExpanded: boolean; subEntries: FileEntry[]
  onToggleDir: () => void; onClickFile: (path: string) => void
  onClickNote: (path: string) => void; onDelete: (path: string) => void
}) {
  const isDir = entry.isDirectory
  const isSelected = selectedFilePath === entry.path || selectedNotePath === entry.path

  return (
    <div className="animate-slide-in">
      <div
        className="group flex items-center gap-1.5 mx-1 px-2 py-1.5 rounded-md cursor-pointer smooth-transition"
        style={{ background: isSelected ? 'var(--sidebar-active)' : 'transparent' }}
        onClick={() => {
          if (isDir) onToggleDir()
          else if (entry.name.endsWith('.md') && !isDoc && !isNoteDir) onClickNote(entry.path)
          else onClickFile(entry.path)
        }}
        onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = 'var(--sidebar-hover)' }}
        onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = 'transparent' }}
      >
        {isDir ? (
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2.5" strokeLinecap="round" className="flex-shrink-0 smooth-transition"
            style={{ color: 'var(--text-tertiary)', transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)' }}>
            <polyline points="9 18 15 12 9 6" />
          </svg>
        ) : <span className="w-[10px] flex-shrink-0" />}
        {isDir ? (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            style={{ color: isNoteDir ? '#eab308' : 'var(--accent)' }}>
            <path d={isExpanded ? "M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2v1" : "M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"} />
          </svg>
        ) : (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            style={{ color: isDoc ? 'var(--accent)' : '#60a5fa' }}>
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
          </svg>
        )}
        <span className="text-xs truncate flex-1"
          style={{ color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)', fontWeight: isSelected ? 600 : 400 }}>
          {entry.name}
        </span>
        <button onClick={(e) => { e.stopPropagation(); onDelete(entry.path) }}
          className="opacity-0 group-hover:opacity-100 w-5 h-5 rounded flex items-center justify-center flex-shrink-0"
          style={{ color: 'var(--text-tertiary)' }}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
      {isDir && isExpanded && subEntries.map((sub) => (
        <div key={sub.path} className="ml-4">
          <div
            className="flex items-center gap-1.5 pl-3 pr-2 py-1.5 mx-0.5 my-0.5 rounded-md cursor-pointer smooth-transition"
            style={{
              background: selectedNotePath === sub.path ? 'var(--sidebar-active)' : 'transparent',
              borderLeft: selectedNotePath === sub.path ? '2px solid var(--accent)' : '2px solid transparent',
            }}
            onClick={() => onClickNote(sub.path)}
            onMouseEnter={(e) => { if (selectedNotePath !== sub.path) e.currentTarget.style.background = 'var(--sidebar-hover)' }}
            onMouseLeave={(e) => { if (selectedNotePath !== sub.path) e.currentTarget.style.background = 'transparent' }}
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: '#60a5fa' }}>
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
            </svg>
            <span className="text-[11px] truncate"
              style={{ color: selectedNotePath === sub.path ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
              {sub.name}
            </span>
          </div>
        </div>
      ))}
      {isDir && isExpanded && subEntries.length === 0 && (
        <p className="text-[10px] pl-10 py-1 italic" style={{ color: 'var(--text-tertiary)' }}>空文件夹</p>
      )}
    </div>
  )
}
