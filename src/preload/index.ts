import { contextBridge, ipcRenderer } from 'electron'

const api = {
  // Workspace
  openWorkspace: (): Promise<string | null> => ipcRenderer.invoke('dialog:openWorkspace'),

  // File system
  listDir: (dirPath: string): Promise<{ name: string; isDirectory: boolean; path: string }[]> =>
    ipcRenderer.invoke('fs:listDir', dirPath),
  readTextFile: (filePath: string): Promise<{
    name: string; path: string; ext: string; content: string; size: number
  } | null> => ipcRenderer.invoke('fs:readTextFile', filePath),
  readBinaryFile: (filePath: string): Promise<{
    name: string; path: string; ext: string; data: string; size: number
  } | null> => ipcRenderer.invoke('fs:readBinaryFile', filePath),
  writeTextFile: (filePath: string, content: string): Promise<boolean> =>
    ipcRenderer.invoke('fs:writeTextFile', filePath, content),
  createDir: (dirPath: string): Promise<boolean> =>
    ipcRenderer.invoke('fs:createDir', dirPath),
  deleteEntry: (entryPath: string): Promise<boolean> =>
    ipcRenderer.invoke('fs:deleteEntry', entryPath),
  fileExists: (filePath: string): Promise<boolean> =>
    ipcRenderer.invoke('fs:fileExists', filePath),

  // Legacy
  openFile: (): Promise<{ name: string; path: string; format: string; data: string } | null> =>
    ipcRenderer.invoke('dialog:openFile'),
  readFileByPath: (filePath: string): Promise<{
    name: string; path: string; format: string; data: string
  } | null> => ipcRenderer.invoke('file:readByPath', filePath),

  // Safe storage
  setSecureKey: (key: string): Promise<string> => ipcRenderer.invoke('safeStorage:setPassword', key),
  getSecureKey: (encrypted: string): Promise<string> => ipcRenderer.invoke('safeStorage:getPassword', encrypted),
}

contextBridge.exposeInMainWorld('electronAPI', api)
export type ElectronAPI = typeof api
