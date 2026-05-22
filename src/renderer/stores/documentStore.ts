import { create } from 'zustand'
import { v4 as uuid } from 'uuid'
import type { DocumentRecord } from '@/types'
import { getAllDocuments, getDocument, saveDocument, deleteDocument, updateLastOpened } from '@/db/database'
import { parseDocument } from '@/services/documentParser'

interface DocumentState {
  documents: DocumentRecord[]
  currentDocumentId: string | null
  selectedNoteId: string | null
  isLoading: boolean
  error: string | null

  loadDocuments: () => Promise<void>
  importDocument: (name: string, format: 'pdf' | 'docx' | 'txt' | 'md', base64Data: string) => Promise<string>
  openDocument: (id: string) => Promise<void>
  removeDocument: (id: string) => Promise<void>
  setCurrentDocumentId: (id: string | null) => void
  setSelectedNoteId: (id: string | null) => void
  updateDocument: (id: string, content: string) => Promise<void>
  clearError: () => void
}

export const useDocumentStore = create<DocumentState>((set, get) => ({
  documents: [],
  currentDocumentId: null,
  selectedNoteId: null,
  isLoading: false,
  error: null,

  loadDocuments: async () => {
    const docs = await getAllDocuments()
    set({ documents: docs })
  },

  importDocument: async (name, format, base64Data) => {
    set({ isLoading: true, error: null })
    try {
      const content = await parseDocument(format, base64Data)
      const id = uuid()
      const now = Date.now()

      const doc: DocumentRecord = {
        id,
        title: name,
        content,
        format,
        importedAt: now,
        lastOpenedAt: now,
      }

      await saveDocument(doc)
      const docs = await getAllDocuments()
      set({ documents: docs, currentDocumentId: id, isLoading: false })
      return id
    } catch (e) {
      const msg = e instanceof Error ? e.message : '导入文档失败'
      set({ error: msg, isLoading: false })
      throw e
    }
  },

  openDocument: async (id) => {
    await updateLastOpened(id)
    set({ currentDocumentId: id })
    // Refresh list to update order
    const docs = await getAllDocuments()
    set({ documents: docs })
  },

  removeDocument: async (id) => {
    await deleteDocument(id)
    const { currentDocumentId } = get()
    const docs = await getAllDocuments()
    set({
      documents: docs,
      currentDocumentId: currentDocumentId === id ? null : currentDocumentId,
    })
  },

  setCurrentDocumentId: (id) => set({ currentDocumentId: id, selectedNoteId: null }),
  setSelectedNoteId: (id) => set({ selectedNoteId: id }),

  updateDocument: async (id, content) => {
    const { documents } = get()
    const doc = documents.find((d) => d.id === id)
    if (!doc) return
    const updated = { ...doc, content, lastOpenedAt: Date.now() }
    await saveDocument(updated)
    const docs = await getAllDocuments()
    set({ documents: docs })
  },

  clearError: () => set({ error: null }),
}))
