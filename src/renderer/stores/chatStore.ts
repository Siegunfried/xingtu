import { create } from 'zustand'
import { v4 as uuid } from 'uuid'
import type { ChatMessage } from '@/types'
import { getMessages, saveMessage, deleteMessages } from '@/db/database'
import { useWorkspaceStore } from './workspaceStore'
import { streamChat, hasApiKey } from '@/services/aiService'
import { useTextSelectionStore } from './textSelectionStore'

interface ChatState {
  messages: ChatMessage[]
  isLoading: boolean
  streamingContent: string
  isStreaming: boolean
  error: string | null

  loadMessages: (documentId: string) => Promise<void>
  sendMessage: (content: string) => Promise<void>
  clearMessages: (documentId: string) => Promise<void>
  clearError: () => void
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  isLoading: false,
  streamingContent: '',
  isStreaming: false,
  error: null,

  loadMessages: async (documentId) => {
    const msgs = await getMessages(documentId)
    set({ messages: msgs })
  },

  sendMessage: async (content) => {
    const ws = useWorkspaceStore.getState()
    const docId = ws.selectedFilePath || ws.selectedNotePath
    if (!docId) {
      set({ error: '请先选择文档' })
      return
    }

    if (!hasApiKey()) {
      set({ error: '请先在设置中配置 API Key' })
      return
    }

    const userMsg: ChatMessage = {
      id: uuid(), documentId: docId, role: 'user', content, timestamp: Date.now(),
    }
    await saveMessage(userMsg)
    const currentMessages = [...get().messages, userMsg]
    set({ messages: currentMessages, isLoading: true, streamingContent: '', isStreaming: true, error: null })

    // Get document content from workspace store
    const fileContent = ws.currentFileContent?.content || ''

    // Check for text selection context
    const textSel = useTextSelectionStore.getState().selection
    let docContent = fileContent
    if (textSel && textSel.contentId === docId) {
      const ctx = textSel.fullContent
      const before = ctx.slice(Math.max(0, textSel.startIndex - 200), textSel.startIndex)
      const after = ctx.slice(textSel.endIndex, Math.min(ctx.length, textSel.endIndex + 200))
      docContent = `用户选中了文档中的以下片段（前后各保留200字上下文）：\n\n...${before}\n>>>${textSel.text}<<<\n${after}...\n\n（用户可能要求基于此片段进行问答或编辑）`
    }

    const history = currentMessages.map((m) => ({
      role: m.role as 'user' | 'assistant', content: m.content,
    }))
    history.pop()

    // Throttle streaming
    let tokenBuffer = ''
    let flushTimer: ReturnType<typeof setTimeout> | null = null
    const flushBuffer = () => {
      if (tokenBuffer) {
        set((state) => ({ streamingContent: state.streamingContent + tokenBuffer }))
        tokenBuffer = ''
      }
      flushTimer = null
    }

    await streamChat(docContent, history, content, {
      onToken: (token) => {
        tokenBuffer += token
        if (!flushTimer) flushTimer = setTimeout(flushBuffer, 50)
      },
      onDone: async (fullText) => {
        flushBuffer()
        const assistantMsg: ChatMessage = {
          id: uuid(), documentId: docId, role: 'assistant', content: fullText, timestamp: Date.now(),
        }
        await saveMessage(assistantMsg)
        set((state) => ({
          messages: [...state.messages, assistantMsg],
          isLoading: false, streamingContent: '', isStreaming: false,
        }))

        // Create note as .md file in subfolder
        const ws = useWorkspaceStore.getState()
        const parentPath = ws.selectedFilePath || ws.selectedNotePath
        if (parentPath && fullText) {
          const title = content.length > 30 ? content.slice(0, 30) + '...' : content
          await ws.createNote(parentPath, title, `# ${title}\n\n${fullText}`)
        }
      },
      onError: async (err) => {
        if (flushTimer) clearTimeout(flushTimer)
        set({ error: err.message, isLoading: false, streamingContent: '', isStreaming: false })
      },
    })
  },

  clearMessages: async (documentId) => {
    await deleteMessages(documentId)
    set({ messages: [], streamingContent: '', isStreaming: false })
  },

  clearError: () => set({ error: null }),
}))
