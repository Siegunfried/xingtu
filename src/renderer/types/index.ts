export interface DocumentRecord {
  id: string
  title: string
  content: string
  format: 'pdf' | 'docx' | 'txt' | 'md'
  importedAt: number
  lastOpenedAt: number
}

export interface ChatMessage {
  id: string
  documentId: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: number
}

export interface NoteRecord {
  id: string
  documentId: string
  parentNoteId: string | null
  title: string
  content: string
  createdAt: number
  updatedAt: number
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
  // Layout state (mutable, not persisted)
  x: number
  y: number
  z: number
  vx: number
  vy: number
  vz: number
}

export type AIProvider = 'claude' | 'deepseek' | 'openai' | 'custom'

export interface ProviderConfig {
  id: AIProvider
  name: string
  baseURL: string
  models: { id: string; name: string }[]
  defaultModel: string
  requiresAuth: boolean
}

export interface AIKeyConfig {
  provider: AIProvider
  key: string
}

export interface ElectronAPI {
  openFile: () => Promise<{
    name: string
    path: string
    format: 'pdf' | 'docx' | 'txt' | 'md'
    data: string
  } | null>
  readFileByPath: (filePath: string) => Promise<{
    name: string
    path: string
    format: 'pdf' | 'docx' | 'txt' | 'md'
    data: string
  } | null>
  setSecureKey: (key: string) => Promise<string>
  getSecureKey: (encrypted: string) => Promise<string>
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}
