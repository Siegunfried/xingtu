import React, { useEffect, useState } from 'react'
import { useWorkspaceStore } from '@/stores/workspaceStore'
import { useChatStore } from '@/stores/chatStore'
import type { FileEntry } from '@/types'

const DOC_EXTS = new Set(['pdf', 'docx', 'txt', 'md'])

interface Props { onOpenStarMap: () => void }

export default function FileTree({ onOpenStarMap }: Props) {
  const workspacePath = useWorkspaceStore((s) => s.workspacePath)
  const rootEntries = useWorkspaceStore((s) => s.rootEntries)
  const openWorkspace = useWorkspaceStore((s) => s.openWorkspace)
  const selectFile = useWorkspaceStore((s) => s.selectFile)
  const selectNote = useWorkspaceStore((s) => s.selectNote)
  const deleteEntry = useWorkspaceStore((s) => s.deleteEntry)
  const selectedFilePath = useWorkspaceStore((s) => s.selectedFilePath)
  const selectedNotePath = useWorkspaceStore((s) => s.selectedNotePath)
  const autoExpandDir = useWorkspaceStore((s) => s.autoExpandDir)
  const clearAutoExpand = useWorkspaceStore((s) => s.clearAutoExpand)
  const loadMessages = useChatStore((s) => s.loadMessages)
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set())
  const [subEntries, setSubEntries] = useState<Record<string, FileEntry[]>>({})

  useEffect(() => {
    const saved = localStorage.getItem('xingtu-workspace')
    if (saved) useWorkspaceStore.getState().setWorkspacePath(saved)
  }, [])

  // Auto-expand directory when a new note is created
  useEffect(() => {
    if (!autoExpandDir) return
    const loadAndExpand = async () => {
      const entries = await window.electronAPI.listDir(autoExpandDir)
      setSubEntries((prev) => ({ ...prev, [autoExpandDir]: entries }))
      setExpandedDirs((prev) => new Set(prev).add(autoExpandDir))
      clearAutoExpand()
    }
    loadAndExpand()
  }, [autoExpandDir, clearAutoExpand])

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

      {/* File tree */}
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

      {/* Star map button */}
      <div className="flex-shrink-0 px-3 py-2" style={{ borderTop: '1px solid var(--border-color)' }}>
        <button onClick={onOpenStarMap}
          className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-xs smooth-transition hover:opacity-80"
          style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="12" cy="12" r="3" /><circle cx="4" cy="4" r="1" /><circle cx="20" cy="6" r="1.2" /><circle cx="6" cy="18" r="1" /><circle cx="18" cy="16" r="0.8" />
            <line x1="12" y1="9" x2="20" y2="6" /><line x1="12" y1="9" x2="4" y2="4" /><line x1="13.5" y1="13.5" x2="6" y2="18" /><line x1="13.5" y1="13.5" x2="18" y2="16" />
          </svg>
          打开知识星图
        </button>
      </div>
    </div>
  )
}

function TreeItem({
  entry, isDoc, isNoteDir, selectedFilePath, selectedNotePath,
  isExpanded, subEntries, onToggleDir, onClickFile, onClickNote, onDelete,
  depth = 0, isLast = true,
}: {
  entry: FileEntry; isDoc: boolean; isNoteDir: boolean
  selectedFilePath: string | null; selectedNotePath: string | null
  isExpanded: boolean; subEntries: FileEntry[]
  onToggleDir: () => void; onClickFile: (path: string) => void
  onClickNote: (path: string) => void; onDelete: (path: string) => void
  depth?: number; isLast?: boolean
}) {
  const isDir = entry.isDirectory
  const isSelected = selectedFilePath === entry.path || selectedNotePath === entry.path
  const hasChildren = isDir && subEntries.length > 0

  // Extract note number from name like "01-标题.md"
  const noteMatch = entry.name.match(/^(\d{2})-(.+)\.md$/)
  const noteNum = noteMatch ? noteMatch[1] : null
  const noteTitle = noteMatch ? noteMatch[2] : entry.name.replace(/\.md$/, '')

  return (
    <div className="animate-slide-in">
      {/* Main row */}
      <div
        className="group flex items-center gap-1 py-1 pr-2 rounded-r-md cursor-pointer smooth-transition"
        style={{
          background: isSelected ? 'var(--sidebar-active)' : 'transparent',
          paddingLeft: `${8 + depth * 16}px`,
        }}
        onClick={() => {
          if (isDir) onToggleDir()
          else if (entry.name.endsWith('.md') && !isDoc) onClickNote(entry.path)
          else onClickFile(entry.path)
        }}
        onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = 'var(--sidebar-hover)' }}
        onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = 'transparent' }}
      >
        {/* Tree lines */}
        {depth > 0 && (
          <span className="flex-shrink-0" style={{ color: 'var(--text-tertiary)', fontSize: '10px', width: '14px', textAlign: 'center', opacity: 0.4, fontFamily: 'monospace' }}>
            {isLast ? '└' : '├'}
          </span>
        )}

        {/* Chevron for directories */}
        {isDir && !isNoteDir ? (
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2.5" strokeLinecap="round" className="flex-shrink-0 smooth-transition"
            style={{ color: 'var(--text-tertiary)', transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)' }}>
            <polyline points="9 18 15 12 9 6" />
          </svg>
        ) : isNoteDir ? (
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2.5" strokeLinecap="round" className="flex-shrink-0 smooth-transition"
            style={{ color: '#eab308', transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)' }}>
            <polyline points="9 18 15 12 9 6" />
          </svg>
        ) : <span className="w-[10px] flex-shrink-0" />}

        {/* Icon */}
        {isDir ? (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="flex-shrink-0"
            style={{ color: isNoteDir ? '#eab308' : 'var(--accent)' }}>
            <path d={isExpanded ? "M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2v1" : "M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"} />
          </svg>
        ) : (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="flex-shrink-0"
            style={{ color: isDoc ? 'var(--accent)' : '#60a5fa' }}>
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
          </svg>
        )}

        {/* Name */}
        <span className="text-xs truncate flex-1"
          style={{ color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)', fontWeight: isDoc ? 600 : isSelected ? 500 : 400 }}>
          {isDoc ? entry.name : noteTitle}
        </span>

        {/* Note number badge */}
        {noteNum && (
          <span className="text-[9px] px-1 rounded flex-shrink-0 font-medium"
            style={{ background: 'rgba(96,165,250,0.12)', color: '#60a5fa' }}>
            #{noteNum}
          </span>
        )}

        {/* Delete */}
        <button onClick={(e) => { e.stopPropagation(); onDelete(entry.path) }}
          className="opacity-0 group-hover:opacity-100 w-5 h-5 rounded flex items-center justify-center flex-shrink-0"
          style={{ color: 'var(--text-tertiary)' }}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {/* Child notes */}
      {isDir && isExpanded && subEntries.length > 0 && (
        <div>
          {subEntries.map((sub, i) => (
            <TreeItem
              key={sub.path}
              entry={sub}
              isDoc={false}
              isNoteDir={sub.isDirectory}
              selectedFilePath={selectedFilePath}
              selectedNotePath={selectedNotePath}
              isExpanded={false}
              subEntries={[]}
              onToggleDir={() => {}}
              onClickFile={onClickFile}
              onClickNote={onClickNote}
              onDelete={onDelete}
              depth={depth + 1}
              isLast={i === subEntries.length - 1}
            />
          ))}
        </div>
      )}
      {isDir && isExpanded && subEntries.length === 0 && (
        <p className="text-[10px] py-0.5 italic" style={{ color: 'var(--text-tertiary)', paddingLeft: `${40 + depth * 16}px` }}>空</p>
      )}
    </div>
  )
}
