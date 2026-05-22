import React, { useState, useCallback } from 'react'
import ThreeColumnLayout from '@/components/layout/ThreeColumnLayout'
import { useWorkspaceStore } from '@/stores/workspaceStore'
import DiffPanel from '@/components/diff/DiffPanel'
import StarMapPanel from '@/components/starmap/StarMapPanel'
import { useDiffStore } from '@/stores/diffStore'
import { useUndoStore } from '@/stores/undoStore'

export default function App() {
  const selectedFilePath = useWorkspaceStore((s) => s.selectedFilePath)
  const selectedNotePath = useWorkspaceStore((s) => s.selectedNotePath)
  const saveCurrentFile = useWorkspaceStore((s) => s.saveCurrentFile)
  const workspacePath = useWorkspaceStore((s) => s.workspacePath)

  const [showStarMap, setShowStarMap] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const dragCounter = React.useRef(0)

  const pendingDiff = useDiffStore((s) => s.pendingDiff)
  const clearDiff = useDiffStore((s) => s.clearDiff)

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation()
    dragCounter.current++
    if (e.dataTransfer.items?.length) setIsDragging(true)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation()
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation()
    dragCounter.current--
    if (dragCounter.current <= 0) setIsDragging(false)
  }, [])

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation()
    setIsDragging(false); dragCounter.current = 0
    if (!workspacePath) return
    for (let i = 0; i < e.dataTransfer.files.length; i++) {
      const f = e.dataTransfer.files[i]
      const ext = f.name.split('.').pop()?.toLowerCase()
      if (!ext || !['pdf', 'docx', 'txt', 'md'].includes(ext)) continue
      const buf = await f.arrayBuffer()
      const content = new TextDecoder().decode(buf)
      const dest = `${workspacePath}/${f.name}`
      await window.electronAPI.writeTextFile(dest, content)
    }
    useWorkspaceStore.getState().refreshFiles()
  }, [workspacePath])

  const handleDiffAccept = useCallback(async () => {
    if (!pendingDiff) return
    const { oldContent, newContent, target } = pendingDiff
    const id = target === 'document' ? selectedFilePath : selectedNotePath
    if (id) useUndoStore.getState().pushState(id, oldContent)
    if (target === 'document' && selectedFilePath) {
      await window.electronAPI.writeTextFile(selectedFilePath, newContent)
      useWorkspaceStore.getState().selectFile(selectedFilePath)
    } else if (target === 'notes' && selectedNotePath) {
      await window.electronAPI.writeTextFile(selectedNotePath, newContent)
      useWorkspaceStore.getState().selectNote(selectedNotePath)
    } else {
      await saveCurrentFile(newContent)
    }
    clearDiff()
  }, [pendingDiff, selectedFilePath, selectedNotePath, saveCurrentFile, clearDiff])

  const handleDiffReject = useCallback(() => clearDiff(), [clearDiff])

  return (
    <div className="h-screen w-screen overflow-hidden"
      onDragEnter={handleDragEnter} onDragOver={handleDragOver}
      onDragLeave={handleDragLeave} onDrop={handleDrop}>
      {showStarMap ? (
        <StarMapPanel onClose={() => setShowStarMap(false)} />
      ) : (
        <ThreeColumnLayout onOpenStarMap={() => setShowStarMap(true)} />
      )}

      {isDragging && (
        <div className="fixed inset-0 z-50 flex items-center justify-center animate-fade-in"
          style={{ background: 'rgba(0,113,227,0.08)', backdropFilter: 'blur(8px)', border: '2px dashed var(--accent)' }}>
          <div className="flex flex-col items-center gap-3">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: 'var(--accent)', color: '#fff' }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
              </svg>
            </div>
            <p className="text-sm font-medium" style={{ color: 'var(--accent)' }}>释放文件以导入文档</p>
          </div>
        </div>
      )}

      {pendingDiff && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[700px] max-w-[90vw] shadow-2xl">
          <DiffPanel oldContent={pendingDiff.oldContent} newContent={pendingDiff.newContent}
            title={pendingDiff.title} onAccept={handleDiffAccept} onReject={handleDiffReject} />
        </div>
      )}
    </div>
  )
}
