import { create } from 'zustand'
import { v4 as uuid } from 'uuid'
import type { NoteRecord } from '@/types'
import { getRootNote, saveNote } from '@/db/database'

interface NotesState {
  currentNote: NoteRecord | null
  isLoading: boolean
  error: string | null

  loadNote: (documentId: string) => Promise<void>
  appendToNote: (documentId: string, title: string, content: string) => Promise<NoteRecord>
  replaceNote: (documentId: string, content: string) => Promise<void>
  updateNoteContent: (content: string) => Promise<void>
  clearNote: () => void
}

export const useNotesStore = create<NotesState>((set, get) => ({
  currentNote: null,
  isLoading: false,
  error: null,

  loadNote: async (documentId) => {
    set({ isLoading: true })
    const note = await getRootNote(documentId)
    set({ currentNote: note || null, isLoading: false })
  },

  appendToNote: async (documentId, title, content) => {
    const { currentNote } = get()
    const now = Date.now()

    if (currentNote) {
      // Append to existing root note
      const noteSection = `\n\n---\n### ${new Date(now).toLocaleString('zh-CN')} — ${title}\n\n${content}`
      const updated: NoteRecord = {
        ...currentNote,
        content: currentNote.content + noteSection,
        updatedAt: now,
      }
      await saveNote(updated)
      set({ currentNote: updated })
      return updated
    } else {
      // Create root note
      const newNote: NoteRecord = {
        id: uuid(),
        documentId,
        parentNoteId: null,
        title,
        content: `# ${title}\n\n${content}`,
        createdAt: now,
        updatedAt: now,
      }
      await saveNote(newNote)
      set({ currentNote: newNote })
      return newNote
    }
  },

  replaceNote: async (documentId, content) => {
    const { currentNote } = get()
    const now = Date.now()

    if (currentNote) {
      const updated: NoteRecord = {
        ...currentNote,
        content,
        updatedAt: now,
      }
      await saveNote(updated)
      set({ currentNote: updated })
    } else {
      const newNote: NoteRecord = {
        id: uuid(),
        documentId,
        parentNoteId: null,
        title: '阅读笔记',
        content,
        createdAt: now,
        updatedAt: now,
      }
      await saveNote(newNote)
      set({ currentNote: newNote })
    }
  },

  updateNoteContent: async (content) => {
    const { currentNote } = get()
    if (!currentNote) return
    const updated: NoteRecord = { ...currentNote, content, updatedAt: Date.now() }
    await saveNote(updated)
    set({ currentNote: updated })
  },

  clearNote: () => set({ currentNote: null }),
}))
