import React, { useEffect, useState } from 'react'
import { useWorkspaceStore } from '@/stores/workspaceStore'
import { useChatStore } from '@/stores/chatStore'
import type { FileEntry } from '@/types'

const DOC_EXTS = new Set(['pdf', 'docx', 'txt', 'md'])

export default function FileTree() {
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
  const [collapsedDocs, setCollapsedDocs] = useState<Set<string>>(new Set())
  const [subEntries, setSubEntries] = useState<Record<string, FileEntry[]>>({})

  useEffect(() => {
    const saved = localStorage.getItem('xingtu-workspace')
    if (saved) useWorkspaceStore.getState().setWorkspacePath(saved)
  }, [])

  // Auto-load note dir when a new note is created
  useEffect(() => {
    if (!autoExpandDir) return
    const loadAndExpand = async () => {
      const entries = await window.electronAPI.listDir(autoExpandDir)
      setSubEntries((prev) => ({ ...prev, [autoExpandDir]: entries }))
      clearAutoExpand()
    }
    loadAndExpand()
  }, [autoExpandDir, clearAutoExpand])

  // Preload note children for documents with matching note folders
  useEffect(() => {
    if (!workspacePath || rootEntries.length === 0) return
    const loadNotes = async () => {
      const docs = rootEntries.filter((e) => !e.isDirectory && isDoc(e))
      const dirs = rootEntries.filter((e) => e.isDirectory)
      const docNames = new Set(docs.map((d) => d.name.replace(/\.[^.]+$/, '')))
      const noteDirs = dirs.filter((d) => docNames.has(d.name))
      if (noteDirs.length === 0) return
      const entriesMap: Record<string, FileEntry[]> = {}
      for (const dir of noteDirs) {
        entriesMap[dir.path] = await window.electronAPI.listDir(dir.path)
      }
      setSubEntries((prev) => ({ ...prev, ...entriesMap }))
    }
    loadNotes()
  }, [workspacePath, rootEntries])

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

  // Merge note folders into their parent documents
  const docEntries = rootEntries.filter((e) => !e.isDirectory && isDoc(e))
  const dirEntries = rootEntries.filter((e) => e.isDirectory)
  const noteDirNames = new Set(docEntries.map((d) => d.name.replace(/\.[^.]+$/, '')))
  // Standalone dirs = directories that are NOT note folders (no matching document)
  const standaloneDirs = dirEntries.filter((d) => !noteDirNames.has(d.name))

  // Build paired entries: document + its note children
  const pairedEntries = docEntries.map((doc) => {
    const docBase = doc.name.replace(/\.[^.]+$/, '')
    const noteDir = dirEntries.find((d) => d.name === docBase)
    const children = noteDir ? (subEntries[noteDir.path] || []) : []
    return { doc, children }
  })

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
        {/* Document entries with merged note children */}
        {pairedEntries.map(({ doc, children }) => (
          <TreeItem
            key={doc.path} entry={doc}
            isDoc={true}
            selectedFilePath={selectedFilePath} selectedNotePath={selectedNotePath}
            isExpanded={!collapsedDocs.has(doc.path)}
            hasNoteChildren={children.length > 0}
            noteChildren={children}
            onClickFile={handleClickFile} onClickNote={handleClickNote}
            onDelete={deleteEntry}
            onToggleCollapse={() => {
              setCollapsedDocs((prev) => {
                const next = new Set(prev)
                if (next.has(doc.path)) next.delete(doc.path)
                else next.add(doc.path)
                return next
              })
            }}
          />
        ))}

        {/* Standalone directories (not note folders) */}
        {standaloneDirs.map((dir) => (
          <TreeItem
            key={dir.path} entry={dir}
            isDoc={false}
            selectedFilePath={selectedFilePath} selectedNotePath={selectedNotePath}
            isExpanded={expandedDirs.has(dir.path)}
            hasNoteChildren={false}
            noteChildren={[]}
            onClickFile={handleClickFile} onClickNote={handleClickNote}
            onDelete={deleteEntry}
            onToggleDir={() => toggleDir(dir.path)}
            subEntries={subEntries[dir.path] || []}
          />
        ))}
      </div>

    </div>
  )
}

function TreeItem({
  entry, isDoc, selectedFilePath, selectedNotePath,
  isExpanded, hasNoteChildren, noteChildren,
  onClickFile, onClickNote, onDelete,
  onToggleDir, onToggleCollapse, subEntries,
  depth = 0, isLast = true,
}: {
  entry: FileEntry; isDoc: boolean
  selectedFilePath: string | null; selectedNotePath: string | null
  isExpanded: boolean
  hasNoteChildren: boolean
  noteChildren: FileEntry[]
  onClickFile: (path: string) => void
  onClickNote: (path: string) => void
  onDelete: (path: string) => void
  onToggleDir?: () => void
  onToggleCollapse?: () => void
  subEntries?: FileEntry[]
  depth?: number; isLast?: boolean
}) {
  const isDir = entry.isDirectory
  const isSelected = selectedFilePath === entry.path || selectedNotePath === entry.path
  const canExpand = isDoc && hasNoteChildren
  const showExpand = canExpand || isDir
  const children = isDoc ? noteChildren : (subEntries || [])
  const hasKids = children.length > 0

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
          if (isDir) {
            onToggleDir?.()
          } else if (isDoc) {
            onClickFile(entry.path)
            if (hasNoteChildren) onToggleCollapse?.()
          } else if (entry.name.endsWith('.md')) {
            onClickNote(entry.path)
          } else {
            onClickFile(entry.path)
          }
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

        {/* Chevron */}
        {showExpand ? (
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2.5" strokeLinecap="round" className="flex-shrink-0 smooth-transition"
            style={{ color: 'var(--text-tertiary)', transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)' }}>
            <polyline points="9 18 15 12 9 6" />
          </svg>
        ) : <span className="w-[10px] flex-shrink-0" />}

        {/* Icon */}
        {isDir ? (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="flex-shrink-0"
            style={{ color: 'var(--accent)' }}>
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

      {/* Children */}
      {isExpanded && hasKids && (
        <div>
          {children.map((child, i) => (
            <TreeItem
              key={child.path}
              entry={child}
              isDoc={false}
              selectedFilePath={selectedFilePath}
              selectedNotePath={selectedNotePath}
              isExpanded={false}
              hasNoteChildren={false}
              noteChildren={[]}
              onClickFile={onClickFile}
              onClickNote={onClickNote}
              onDelete={onDelete}
              depth={depth + 1}
              isLast={i === children.length - 1}
            />
          ))}
        </div>
      )}
      {isExpanded && !hasKids && showExpand && (
        <p className="text-[10px] py-0.5 italic" style={{ color: 'var(--text-tertiary)', paddingLeft: `${40 + depth * 16}px` }}>暂无笔记</p>
      )}
    </div>
  )
}
