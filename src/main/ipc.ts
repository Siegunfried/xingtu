import { ipcMain, dialog, BrowserWindow, safeStorage } from 'electron'
import { readFile, writeFile, mkdir, readdir, stat, rm } from 'fs/promises'
import { basename, extname, join } from 'path'

export function registerIpcHandlers(): void {
  // --- Workspace ---
  ipcMain.handle('dialog:openWorkspace', async () => {
    const win = BrowserWindow.getFocusedWindow()
    if (!win) return null
    const result = await dialog.showOpenDialog(win, {
      title: '选择工作区文件夹',
      properties: ['openDirectory'],
    })
    if (result.canceled || result.filePaths.length === 0) return null
    return result.filePaths[0]
  })

  // --- File system ---
  ipcMain.handle('fs:listDir', async (_event, dirPath: string) => {
    try {
      const entries = await readdir(dirPath, { withFileTypes: true })
      return entries
        .filter((e) => !e.name.startsWith('.') && !e.name.startsWith('~'))
        .map((e) => ({
          name: e.name,
          isDirectory: e.isDirectory(),
          path: join(dirPath, e.name),
        }))
        .sort((a, b) => {
          if (a.isDirectory !== b.isDirectory) return a.isDirectory ? -1 : 1
          return a.name.localeCompare(b.name)
        })
    } catch {
      return []
    }
  })

  ipcMain.handle('fs:readTextFile', async (_event, filePath: string) => {
    try {
      const buffer = await readFile(filePath)
      return {
        name: basename(filePath),
        path: filePath,
        ext: extname(filePath).toLowerCase().slice(1),
        content: buffer.toString('utf-8'),
        size: buffer.length,
      }
    } catch {
      return null
    }
  })

  ipcMain.handle('fs:readBinaryFile', async (_event, filePath: string) => {
    try {
      const buffer = await readFile(filePath)
      return {
        name: basename(filePath),
        path: filePath,
        ext: extname(filePath).toLowerCase().slice(1),
        data: buffer.toString('base64'),
        size: buffer.length,
      }
    } catch {
      return null
    }
  })

  ipcMain.handle('fs:writeTextFile', async (_event, filePath: string, content: string) => {
    try {
      await writeFile(filePath, content, 'utf-8')
      return true
    } catch {
      return false
    }
  })

  ipcMain.handle('fs:createDir', async (_event, dirPath: string) => {
    try {
      await mkdir(dirPath, { recursive: true })
      return true
    } catch {
      return false
    }
  })

  ipcMain.handle('fs:deleteEntry', async (_event, entryPath: string) => {
    try {
      await rm(entryPath, { recursive: true, force: true })
      return true
    } catch {
      return false
    }
  })

  ipcMain.handle('fs:fileExists', async (_event, filePath: string) => {
    try {
      await stat(filePath)
      return true
    } catch {
      return false
    }
  })

  // --- Old: single file import (kept for drag-drop) ---
  ipcMain.handle('dialog:openFile', async () => {
    const win = BrowserWindow.getFocusedWindow()
    if (!win) return null
    const result = await dialog.showOpenDialog(win, {
      title: '导入文档',
      filters: [
        { name: '支持的文档', extensions: ['pdf', 'docx', 'txt', 'md'] },
        { name: '所有文件', extensions: ['*'] },
      ],
      properties: ['openFile'],
    })
    if (result.canceled || result.filePaths.length === 0) return null
    const filePath = result.filePaths[0]
    const buffer = await readFile(filePath)
    const ext = extname(filePath).toLowerCase().slice(1) as 'pdf' | 'docx' | 'txt' | 'md'
    return { name: basename(filePath), path: filePath, format: ext, data: buffer.toString('base64') }
  })

  ipcMain.handle('file:readByPath', async (_event, filePath: string) => {
    try {
      const buffer = await readFile(filePath)
      const ext = extname(filePath).toLowerCase().slice(1)
      if (!['pdf', 'docx', 'txt', 'md'].includes(ext)) return null
      return { name: basename(filePath), path: filePath, format: ext as 'pdf' | 'docx' | 'txt' | 'md', data: buffer.toString('base64') }
    } catch { return null }
  })

  // --- Safe Storage ---
  ipcMain.handle('safeStorage:setPassword', async (_event, key: string) => {
    if (!safeStorage.isEncryptionAvailable()) throw new Error('SafeStorage not available')
    return safeStorage.encryptString(key).toString('base64')
  })

  ipcMain.handle('safeStorage:getPassword', async (_event, encryptedBase64: string) => {
    if (!safeStorage.isEncryptionAvailable()) throw new Error('SafeStorage not available')
    return safeStorage.decryptString(Buffer.from(encryptedBase64, 'base64'))
  })
}
