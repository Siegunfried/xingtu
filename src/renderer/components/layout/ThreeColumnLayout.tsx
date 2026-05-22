import React from 'react'
import FileTree from '@/components/tree/FileTree'
import ContentViewer from '@/components/viewer/ContentViewer'
import AIPanel from '@/components/ai-panel/AIPanel'

interface Props { onOpenStarMap: () => void }

export default function ThreeColumnLayout({ onOpenStarMap }: Props) {
  return (
    <div className="flex h-screen w-screen overflow-hidden">
      <div className="w-[240px] flex-shrink-0 h-full" style={{ borderRight: '1px solid var(--border-color)' }}>
        <FileTree onOpenStarMap={onOpenStarMap} />
      </div>
      <div className="flex-1 min-w-0 h-full">
        <ContentViewer />
      </div>
      <div className="w-[380px] flex-shrink-0 h-full">
        <AIPanel />
      </div>
    </div>
  )
}
