import React, { useMemo, useState } from 'react'
import { useDocumentStore } from '@/stores/documentStore'
import DocumentToolbar from './DocumentToolbar'
import MarkdownRenderer from './MarkdownRenderer'
import EmptyState from '@/components/common/EmptyState'

export default function DocumentViewer() {
  const currentDocumentId = useDocumentStore((s) => s.currentDocumentId)
  const documents = useDocumentStore((s) => s.documents)
  const updateDocument = useDocumentStore((s) => s.updateDocument)
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState('')

  const currentDocument = useMemo(
    () => documents.find((d) => d.id === currentDocumentId),
    [documents, currentDocumentId]
  )

  const handleStartEdit = () => {
    if (!currentDocument) return
    setEditContent(currentDocument.content)
    setIsEditing(true)
  }

  const handleSaveEdit = async () => {
    if (!currentDocument) return
    await updateDocument(currentDocument.id, editContent)
    setIsEditing(false)
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setEditContent('')
  }

  if (!currentDocument) {
    return (
      <div className="flex flex-col h-full">
        <DocumentToolbar />
        <div className="flex-1 flex items-center justify-center">
          <EmptyState
            icon={
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
            }
            title="选择或导入文档"
            description="拖拽文件到窗口或从左侧导入 PDF、DOCX、TXT、Markdown 文件"
          />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <DocumentToolbar
        document={currentDocument}
        isEditing={isEditing}
        onStartEdit={handleStartEdit}
        onSaveEdit={handleSaveEdit}
        onCancelEdit={handleCancelEdit}
      />
      <div className="flex-1 overflow-y-auto px-8 py-6">
        <div className="max-w-3xl mx-auto">
          {isEditing ? (
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full h-[calc(100vh-120px)] resize-none rounded-xl p-4 text-sm outline-none leading-relaxed"
              style={{
                background: 'var(--input-bg)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-color)',
                fontFamily: 'inherit',
              }}
            />
          ) : currentDocument.format === 'md' ? (
            <MarkdownRenderer content={currentDocument.content} />
          ) : (
            <div className="markdown-content text-sm leading-relaxed whitespace-pre-wrap">
              {currentDocument.content}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
