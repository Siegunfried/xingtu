import { create } from 'zustand'
import { v4 as uuid } from 'uuid'
import type { ChatMessage } from '@/types'
import { getMessages, saveMessage, deleteMessages } from '@/db/database'
import { useDocumentStore } from './documentStore'
import { streamChat, hasApiKey, summarizeToNote } from '@/services/aiService'
import { useNotesStore } from './notesStore'

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

    const history = currentMessages.map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }))

    // Remove the last user message from history since aiService will add it
    history.pop()

    await streamChat(document.content, history, content, {
      onToken: (token) => {
        set((state) => ({ streamingContent: state.streamingContent + token }))
      },
      onDone: async (fullText) => {
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

        // Generate condensed note from conversation
        const title = content.length > 40 ? content.slice(0, 40) + '...' : content
        const condensedNote = await summarizeToNote(content, fullText)
        const notesStore = useNotesStore.getState()
        await notesStore.appendToNote(currentDocumentId, title, condensedNote)
      },
      onError: async (err) => {
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
