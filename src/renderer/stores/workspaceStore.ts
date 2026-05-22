import { create } from 'zustand'
import type { FileEntry, FileContent } from '@/types'

interface WorkspaceState {
  workspacePath: string | null
  rootEntries: FileEntry[]
  selectedFilePath: string | null
  selectedNotePath: string | null
  currentFileContent: FileContent | null
  autoExpandDir: string | null
  activeNotePath: string | null  // current note being appended to
  isLoading: boolean

  openWorkspace: () => Promise<void>
  setWorkspacePath: (path: string) => void
  refreshFiles: () => Promise<void>
  selectFile: (filePath: string) => Promise<void>
  selectNote: (notePath: string) => Promise<void>
  createNote: (parentFilePath: string, noteName: string, content: string) => Promise<string | null>
  appendToActiveNote: (content: string) => Promise<boolean>
  setActiveNote: (path: string | null) => void
  saveCurrentFile: (content: string) => Promise<boolean>
  deleteEntry: (entryPath: string) => Promise<void>
  clearAutoExpand: () => void
}

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  workspacePath: null,
  rootEntries: [],
  selectedFilePath: null,
  selectedNotePath: null,
  currentFileContent: null,
  autoExpandDir: null,
  activeNotePath: null,
  isLoading: false,

  openWorkspace: async () => {
    const path = await window.electronAPI.openWorkspace()
    if (!path) return
    get().setWorkspacePath(path)
  },

  setWorkspacePath: async (path: string) => {
    set({ workspacePath: path, isLoading: true })
    localStorage.setItem('xingtu-workspace', path)
    const entries = await window.electronAPI.listDir(path)
    set({ rootEntries: entries, isLoading: false })
  },

  refreshFiles: async () => {
    const { workspacePath } = get()
    if (!workspacePath) return
    const entries = await window.electronAPI.listDir(workspacePath)
    set({ rootEntries: entries })
  },

  selectFile: async (filePath: string) => {
    const isText = filePath.match(/\.(txt|md)$/i)
    let content = ''
    if (isText) {
      const file = await window.electronAPI.readTextFile(filePath)
      content = file?.content || ''
    }
    // Find latest note for this document
    const parentName = filePath.split(/[/\\]/).pop()?.replace(/\.[^.]+$/, '') || ''
    const noteDir = filePath.substring(0, filePath.lastIndexOf('/') + 1 || filePath.lastIndexOf('\\') + 1) + parentName
    let activeNote: string | null = null
    try {
      const existing = await window.electronAPI.listDir(noteDir)
      const notes = existing.filter((e) => e.name.match(/^\d{2}-.*\.md$/))
      if (notes.length > 0) {
        activeNote = notes[notes.length - 1].path // latest note
      }
    } catch { /* no notes yet */ }

    set({
      selectedFilePath: filePath,
      selectedNotePath: null,
      activeNotePath: activeNote,
      currentFileContent: {
        name: filePath.split(/[/\\]/).pop() || '',
        path: filePath,
        ext: filePath.split('.').pop()?.toLowerCase() || '',
        content,
        size: content.length,
      },
    })
  },

  selectNote: async (notePath: string) => {
    const file = await window.electronAPI.readTextFile(notePath)
    set({
      selectedNotePath: notePath,
      currentFileContent: file || {
        name: notePath.split(/[/\\]/).pop() || '',
        path: notePath, ext: 'md', content: '', size: 0,
      },
    })
  },

  createNote: async (parentFilePath, noteName, content) => {
    const { workspacePath } = get()
    if (!workspacePath) return null
    // Create subfolder: 文档名/
    const parentName = parentFilePath.split(/[/\\]/).pop()?.replace(/\.[^.]+$/, '') || 'untitled'
    const noteDir = parentFilePath.substring(0, parentFilePath.lastIndexOf('/') + 1 || parentFilePath.lastIndexOf('\\') + 1) + parentName
    await window.electronAPI.createDir(noteDir)

    // Count existing notes for numbering
    const existing = await window.electronAPI.listDir(noteDir)
    const count = existing.filter((e) => e.name.match(/^\d{2}-.*\.md$/)).length
    const prefix = String(count + 1).padStart(2, '0')
    const safeName = noteName.replace(/[/\\:*?"<>|]/g, '-').slice(0, 50)
    const notePath = `${noteDir}/${prefix}-${safeName}.md`
    await window.electronAPI.writeTextFile(notePath, content)
    await get().refreshFiles()
    set({ autoExpandDir: noteDir, activeNotePath: notePath })
    return notePath
  },

  appendToActiveNote: async (content) => {
    const { activeNotePath } = get()
    if (!activeNotePath) return false
    try {
      const existing = await window.electronAPI.readTextFile(activeNotePath)
      const oldContent = existing?.content || ''
      const separator = '\n\n---\n\n'
      await window.electronAPI.writeTextFile(activeNotePath, oldContent + separator + content)
      // Refresh the note content in the viewer if it's selected
      const { selectedNotePath } = get()
      if (selectedNotePath === activeNotePath) {
        const updated = await window.electronAPI.readTextFile(activeNotePath)
        if (updated) set({ currentFileContent: updated })
      }
      return true
    } catch { return false }
  },

  setActiveNote: (path) => set({ activeNotePath: path }),

  clearAutoExpand: () => set({ autoExpandDir: null }),

  saveCurrentFile: async (content) => {
    const { selectedFilePath, selectedNotePath } = get()
    const target = selectedNotePath || selectedFilePath
    if (!target) return false
    const ok = await window.electronAPI.writeTextFile(target, content)
    if (ok) {
      set({ currentFileContent: { ...get().currentFileContent!, content, size: Buffer.byteLength(content, 'utf-8') } })
    }
    return ok
  },

  deleteEntry: async (entryPath) => {
    await window.electronAPI.deleteEntry(entryPath)
    await get().refreshFiles()
    const { selectedFilePath, selectedNotePath } = get()
    if (selectedFilePath === entryPath) set({ selectedFilePath: null, currentFileContent: null })
    if (selectedNotePath === entryPath) set({ selectedNotePath: null, currentFileContent: null })
  },
}))
