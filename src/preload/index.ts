import { contextBridge, ipcRenderer } from 'electron'

const api = {
  openFile: (): Promise<{
    name: string
    path: string
    format: 'pdf' | 'docx' | 'txt' | 'md'
    data: string // base64
  } | null> => ipcRenderer.invoke('dialog:openFile'),

  setSecureKey: (key: string): Promise<string> =>
    ipcRenderer.invoke('safeStorage:setPassword', key),

  getSecureKey: (encrypted: string): Promise<string> =>
    ipcRenderer.invoke('safeStorage:getPassword', encrypted),

  readFileByPath: (filePath: string): Promise<{
    name: string
    path: string
    format: 'pdf' | 'docx' | 'txt' | 'md'
    data: string
  } | null> => ipcRenderer.invoke('file:readByPath', filePath),
}

contextBridge.exposeInMainWorld('electronAPI', api)

export type ElectronAPI = typeof api
