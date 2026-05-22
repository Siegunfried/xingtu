import Dexie, { type Table } from 'dexie'
import type { ChatMessage } from '@/types'

class AIDatabase extends Dexie {
  messages!: Table<ChatMessage, string>

  constructor() {
    super('XingtuDB')
    this.version(3).stores({
      messages: 'id, documentId',
    })
  }
}

export const db = new AIDatabase()

export async function getMessages(documentId: string): Promise<ChatMessage[]> {
  return db.messages.where('documentId').equals(documentId).sortBy('timestamp')
}

export async function saveMessage(msg: ChatMessage): Promise<void> {
  await db.messages.put(msg)
}

export async function deleteMessages(documentId: string): Promise<void> {
  await db.messages.where('documentId').equals(documentId).delete()
}
