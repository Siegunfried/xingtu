import React from 'react'
import FileTree from '@/components/tree/FileTree'
import ContentViewer from '@/components/viewer/ContentViewer'
import AIPanel from '@/components/ai-panel/AIPanel'
import type { TreeSelection } from '@/components/tree/FileTree'

interface ThreeColumnLayoutProps {
  selection: TreeSelection | null
  onSelect: (sel: TreeSelection) => void
}

export default function ThreeColumnLayout({ selection, onSelect }: ThreeColumnLayoutProps) {
  return (
    <div className="flex h-screen w-screen overflow-hidden">
      {/* Left sidebar - File tree */}
      <div className="w-[240px] flex-shrink-0 h-full" style={{
        borderRight: '1px solid var(--border-color)',
      }}>
        <FileTree onSelect={onSelect} selectedId={selection?.id || null} />
      </div>

      {/* Center - Content viewer */}
      <div className="flex-1 min-w-0 h-full">
        <ContentViewer selection={selection} />
      </div>

      {/* Right - AI panel */}
      <div className="w-[380px] flex-shrink-0 h-full">
        <AIPanel />
      </div>
    </div>
  )
}
