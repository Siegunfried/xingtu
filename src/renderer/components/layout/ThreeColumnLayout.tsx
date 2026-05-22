import React from 'react'
import Sidebar from '@/components/sidebar/Sidebar'
import DocumentViewer from '@/components/viewer/DocumentViewer'
import AIPanel from '@/components/ai-panel/AIPanel'

export default function ThreeColumnLayout() {
  return (
    <div className="flex h-screen w-screen overflow-hidden">
      {/* Left sidebar - 260px */}
      <div className="w-[260px] flex-shrink-0 h-full">
        <Sidebar />
      </div>

      {/* Center - document viewer */}
      <div className="flex-1 min-w-0 h-full">
        <DocumentViewer />
      </div>

      {/* Right - AI panel - 380px */}
      <div className="w-[380px] flex-shrink-0 h-full">
        <AIPanel />
      </div>
    </div>
  )
}
