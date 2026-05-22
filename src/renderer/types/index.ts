// Legacy types (for backward compat with old stores)
export interface DocumentRecord {
  id: string; title: string; content: string; format: string; importedAt: number; lastOpenedAt: number
}
export interface NoteRecord {
  id: string; documentId: string; parentNoteId: string | null; title: string; content: string; createdAt: number; updatedAt: number
}

// File tree entry
export interface FileEntry {
  name: string
  path: string
  isDirectory: boolean
  ext?: string
}

// File content
export interface FileContent {
  name: string
  path: string
  ext: string
  content: string
  size: number
}

export interface ChatMessage {
  id: string
  documentId: string  // now the file path
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: number
}

// Star Map graph node
export interface GraphNode {
  id: string
  type: 'document' | 'note'
  label: string
  content: string
  documentId: string
  parentNoteId: string | null
  createdAt: number
  color: string
  radius: number
  x: number; y: number; z: number
  vx: number; vy: number; vz: number
}

export type AIProvider = 'claude' | 'deepseek' | 'openai' | 'qwen' | 'kimi' | 'glm' | 'siliconflow' | 'ollama' | 'custom'

export interface ProviderConfig {
  id: AIProvider
  name: string
  desc: string
  baseURL: string
  models: { id: string; name: string }[]
  defaultModel: string
  requiresAuth: boolean
}

export interface ElectronAPI {
  openWorkspace: () => Promise<string | null>
  listDir: (dirPath: string) => Promise<{ name: string; isDirectory: boolean; path: string }[]>
  readTextFile: (filePath: string) => Promise<{ name: string; path: string; ext: string; content: string; size: number } | null>
  readBinaryFile: (filePath: string) => Promise<{ name: string; path: string; ext: string; data: string; size: number } | null>
  writeTextFile: (filePath: string, content: string) => Promise<boolean>
  createDir: (dirPath: string) => Promise<boolean>
  deleteEntry: (entryPath: string) => Promise<boolean>
  fileExists: (filePath: string) => Promise<boolean>
  openFile: () => Promise<{ name: string; path: string; format: string; data: string } | null>
  readFileByPath: (filePath: string) => Promise<{ name: string; path: string; format: string; data: string } | null>
  setSecureKey: (key: string) => Promise<string>
  getSecureKey: (encrypted: string) => Promise<string>
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}
