import { create } from 'zustand'
import type { FileEntry, FileContent } from '@/types'

interface WorkspaceState {
  workspacePath: string | null
  rootEntries: FileEntry[]
  selectedFilePath: string | null
  selectedNotePath: string | null
  currentFileContent: FileContent | null
  autoExpandDir: string | null
  isLoading: boolean

  openWorkspace: () => Promise<void>
  setWorkspacePath: (path: string) => void
  refreshFiles: () => Promise<void>
  selectFile: (filePath: string) => Promise<void>
  selectNote: (notePath: string) => Promise<void>
  createNote: (parentFilePath: string, noteName: string, content: string) => Promise<string | null>
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
    set({
      selectedFilePath: filePath,
      selectedNotePath: null,
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
    // Signal FileTree to auto-expand this directory
    set({ autoExpandDir: noteDir })
    return notePath
  },

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
