import { ipcMain, dialog, BrowserWindow, safeStorage } from 'electron'
import { readFile } from 'fs/promises'
import { basename, extname } from 'path'

export function registerIpcHandlers(): void {
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

    if (result.canceled || result.filePaths.length === 0) {
      return null
    }

    const filePath = result.filePaths[0]
    const buffer = await readFile(filePath)
    const ext = extname(filePath).toLowerCase().slice(1) as 'pdf' | 'docx' | 'txt' | 'md'

    return {
      name: basename(filePath),
      path: filePath,
      format: ext,
      data: buffer.toString('base64'),
    }
  })

  ipcMain.handle('file:readByPath', async (_event, filePath: string) => {
    try {
      const buffer = await readFile(filePath)
      const ext = extname(filePath).toLowerCase().slice(1)
      const allowed = ['pdf', 'docx', 'txt', 'md']
      if (!allowed.includes(ext)) {
        return null
      }
      return {
        name: basename(filePath),
        path: filePath,
        format: ext as 'pdf' | 'docx' | 'txt' | 'md',
        data: buffer.toString('base64'),
      }
    } catch {
      return null
    }
  })

  ipcMain.handle('safeStorage:setPassword', async (_event, key: string) => {
    if (!safeStorage.isEncryptionAvailable()) {
      throw new Error('SafeStorage encryption is not available')
    }
    const encrypted = safeStorage.encryptString(key)
    return encrypted.toString('base64')
  })

  ipcMain.handle('safeStorage:getPassword', async (_event, encryptedBase64: string) => {
    if (!safeStorage.isEncryptionAvailable()) {
      throw new Error('SafeStorage encryption is not available')
    }
    const encrypted = Buffer.from(encryptedBase64, 'base64')
    return safeStorage.decryptString(encrypted)
  })
}
