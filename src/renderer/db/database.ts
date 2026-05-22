import Dexie, { type Table } from 'dexie'
import type { DocumentRecord, ChatMessage, NoteRecord } from '@/types'

class AIDatabase extends Dexie {
  documents!: Table<DocumentRecord, string>
  messages!: Table<ChatMessage, string>
  notes!: Table<NoteRecord, string>

  constructor() {
    super('XingtuDB')
    this.version(1).stores({
      documents: 'id, lastOpenedAt',
      messages: 'id, documentId',
      notes: 'id, documentId',
    })
    this.version(2).stores({
      documents: 'id, lastOpenedAt',
      messages: 'id, documentId',
      notes: 'id, documentId, parentNoteId',
    }).upgrade(async (tx) => {
      // Migrate existing notes: set parentNoteId = null, title = '阅读笔记'
      const notes = await tx.table('notes').toArray()
      for (const note of notes) {
        await tx.table('notes').update(note.id, {
          parentNoteId: null,
          title: note.title || '阅读笔记',
          createdAt: note.createdAt || note.updatedAt || Date.now(),
        } as any)
      }
    })
  }
}

export const db = new AIDatabase()

// Document operations
export async function getAllDocuments(): Promise<DocumentRecord[]> {
  return db.documents.orderBy('lastOpenedAt').reverse().toArray()
}

export async function getDocument(id: string): Promise<DocumentRecord | undefined> {
  return db.documents.get(id)
}

export async function saveDocument(doc: DocumentRecord): Promise<void> {
  await db.documents.put(doc)
}

export async function deleteDocument(id: string): Promise<void> {
  await db.transaction('rw', db.documents, db.messages, db.notes, async () => {
    await db.documents.delete(id)
    await db.messages.where('documentId').equals(id).delete()
    await db.notes.where('documentId').equals(id).delete()
  })
}

export async function updateLastOpened(id: string): Promise<void> {
  await db.documents.update(id, { lastOpenedAt: Date.now() })
}

// Message operations
export async function getMessages(documentId: string): Promise<ChatMessage[]> {
  return db.messages.where('documentId').equals(documentId).sortBy('timestamp')
}

export async function saveMessage(msg: ChatMessage): Promise<void> {
  await db.messages.put(msg)
}

export async function deleteMessages(documentId: string): Promise<void> {
  await db.messages.where('documentId').equals(documentId).delete()
}

// Note operations
export async function getNotesByDocument(documentId: string): Promise<NoteRecord[]> {
  return db.notes.where('documentId').equals(documentId).toArray()
}

export async function getRootNote(documentId: string): Promise<NoteRecord | undefined> {
  return db.notes
    .where('documentId').equals(documentId)
    .and((n) => n.parentNoteId === null)
    .first()
}

export async function getChildNotes(parentNoteId: string): Promise<NoteRecord[]> {
  return db.notes.where('parentNoteId').equals(parentNoteId).toArray()
}

export async function getAllNotesForDocument(documentId: string): Promise<NoteRecord[]> {
  return db.notes.where('documentId').equals(documentId).toArray()
}

export async function saveNote(note: NoteRecord): Promise<void> {
  await db.notes.put(note)
}

export async function deleteNote(id: string): Promise<void> {
  // Delete note and all its children recursively
  const children = await db.notes.where('parentNoteId').equals(id).toArray()
  for (const child of children) {
    await deleteNote(child.id)
  }
  await db.notes.delete(id)
}
