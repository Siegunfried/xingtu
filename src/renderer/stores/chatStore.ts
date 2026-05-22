import { create } from 'zustand'
import { v4 as uuid } from 'uuid'
import type { ChatMessage } from '@/types'
import { getMessages, saveMessage, deleteMessages } from '@/db/database'
import { useDocumentStore } from './documentStore'
import { streamChat, hasApiKey, regenerateNote } from '@/services/aiService'
import { useNotesStore } from './notesStore'
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
    const { currentDocumentId } = useDocumentStore.getState()
    if (!currentDocumentId) {
      set({ error: '请先导入文档' })
      return
    }

    if (!hasApiKey()) {
      set({ error: '请先在设置中配置 API Key' })
      return
    }

    const userMsg: ChatMessage = {
      id: uuid(),
      documentId: currentDocumentId,
      role: 'user',
      content,
      timestamp: Date.now(),
    }

    await saveMessage(userMsg)
    const currentMessages = [...get().messages, userMsg]
    set({ messages: currentMessages, isLoading: true, streamingContent: '', isStreaming: true, error: null })

    const document = useDocumentStore.getState().documents.find(
      (d) => d.id === currentDocumentId
    )

    if (!document) {
      set({ error: '文档未找到', isLoading: false, isStreaming: false })
      return
    }

    // Check for text selection to use as context
    const textSel = useTextSelectionStore.getState().selection
    let docContent: string
    if (textSel && textSel.contentId === currentDocumentId) {
      // Use selected text + surrounding context
      const ctx = textSel.fullContent
      const before = ctx.slice(Math.max(0, textSel.startIndex - 200), textSel.startIndex)
      const after = ctx.slice(textSel.endIndex, Math.min(ctx.length, textSel.endIndex + 200))
      docContent = `用户选中了文档中的以下片段（前后各保留200字上下文）：\n\n...${before}\n>>>${textSel.text}<<<\n${after}...\n\n（用户可能要求基于此片段进行问答或编辑）`
    } else {
      docContent = document.content
    }

    const history = currentMessages.map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }))

    // Remove the last user message from history since aiService will add it
    history.pop()

    // Throttle streaming updates: buffer tokens and flush every 50ms
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
        if (!flushTimer) {
          flushTimer = setTimeout(flushBuffer, 50)
        }
      },
      onDone: async (fullText) => {
        // Flush any remaining tokens
        flushBuffer()
        const assistantMsg: ChatMessage = {
          id: uuid(),
          documentId: currentDocumentId,
          role: 'assistant',
          content: fullText,
          timestamp: Date.now(),
        }

        await saveMessage(assistantMsg)
        set((state) => ({
          messages: [...state.messages, assistantMsg],
          isLoading: false,
          streamingContent: '',
          isStreaming: false,
        }))

        // Regenerate full note from complete conversation history
        const allMessages = [...get().messages]
        const conversation = allMessages.map((m) => ({
          role: m.role,
          content: m.content,
        }))
        const docTitle = document?.title || '文档'
        const regeneratedNote = await regenerateNote(docTitle, conversation)
        if (regeneratedNote) {
          const notesStore = useNotesStore.getState()
          await notesStore.replaceNote(currentDocumentId, regeneratedNote)
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
