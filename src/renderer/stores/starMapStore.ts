import { create } from 'zustand'
import { v4 as uuid } from 'uuid'
import type { GraphNode, NoteRecord } from '@/types'
import { getAllDocuments } from '@/db/database'
import { getAllNotesForDocument, saveNote } from '@/db/database'
import { ForceEngine, type GraphEdge } from '@/services/forceEngine'

const NODE_COLORS: Record<string, string> = {
  document: '#0071e3',
  note: '#60a5fa',
}

const NODE_RADII: Record<string, number> = {
  document: 18,
  note: 8,
}

interface StarMapState {
  nodes: GraphNode[]
  edges: GraphEdge[]
  selectedNodeId: string | null
  engine: ForceEngine | null
  initialized: boolean

  buildGraph: () => Promise<void>
  selectNode: (id: string | null) => void
  addNoteNode: (documentId: string, parentNoteId: string | null, title: string, content: string) => Promise<NoteRecord>
  removeNode: (id: string) => void
  getNoteTree: (documentId: string) => NoteRecord[]
  startEngine: () => void
  stopEngine: () => void
}

export const useStarMapStore = create<StarMapState>((set, get) => ({
  nodes: [],
  edges: [],
  selectedNodeId: null,
  engine: null,
  initialized: false,

  buildGraph: async () => {
    const docs = await getAllDocuments()
    const nodes: GraphNode[] = []
    const edges: GraphEdge[] = []

    for (const doc of docs) {
      const docNode: GraphNode = {
        id: doc.id,
        type: 'document',
        label: doc.title,
        content: doc.content,
        documentId: doc.id,
        parentNoteId: null,
        createdAt: doc.importedAt,
        color: NODE_COLORS.document,
        radius: NODE_RADII.document,
        x: (Math.random() - 0.5) * 200,
        y: (Math.random() - 0.5) * 200,
        z: (Math.random() - 0.5) * 100,
        vx: 0, vy: 0, vz: 0,
      }
      nodes.push(docNode)

      // Get all notes for this document
      const docNotes = await getAllNotesForDocument(doc.id)
      addNoteNodesToGraph(docNotes, doc.id, null, nodes, edges)
    }

    const engine = new ForceEngine(nodes, edges)
    engine.setOnUpdate(() => {
      set({ nodes: [...nodes], edges: [...edges] })
    })

    set({ nodes, edges, engine, initialized: true })
    engine.start()
  },

  selectNode: (id) => {
    set({ selectedNodeId: id })
  },

  addNoteNode: async (documentId, parentNoteId, title, content) => {
    const note: NoteRecord = {
      id: uuid(),
      documentId,
      parentNoteId,
      title,
      content,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
    await saveNote(note)

    const parentNode = get().nodes.find((n) => n.id === (parentNoteId || documentId))
    const angle = Math.random() * Math.PI * 2
    const dist = (parentNode?.radius || 20) * 6

    const newNode: GraphNode = {
      id: note.id,
      type: 'note',
      label: title,
      content,
      documentId,
      parentNoteId,
      createdAt: note.createdAt,
      color: NODE_COLORS.note,
      radius: NODE_RADII.note,
      x: (parentNode?.x || 0) + Math.cos(angle) * dist,
      y: (parentNode?.y || 0) + Math.sin(angle) * dist,
      z: (parentNode?.z || 0) + (Math.random() - 0.5) * 60,
      vx: 0, vy: 0, vz: 0,
    }

    const newEdge: GraphEdge = {
      sourceId: parentNoteId || documentId,
      targetId: note.id,
    }

    const nodes = [...get().nodes, newNode]
    const edges = [...get().edges, newEdge]
    const engine = new ForceEngine(nodes, edges)
    engine.setOnUpdate(() => {
      set({ nodes: [...nodes], edges: [...edges] })
    })
    set({ nodes, edges, engine })
    engine.start()

    return note
  },

  removeNode: (id) => {
    const { nodes, edges } = get()
    // Remove node and its children recursively
    const idsToRemove = new Set<string>()
    const collectChildren = (nodeId: string) => {
      idsToRemove.add(nodeId)
      edges
        .filter((e) => e.sourceId === nodeId)
        .forEach((e) => collectChildren(e.targetId))
    }
    collectChildren(id)

    const newNodes = nodes.filter((n) => !idsToRemove.has(n.id))
    const newEdges = edges.filter(
      (e) => !idsToRemove.has(e.sourceId) && !idsToRemove.has(e.targetId)
    )
    const engine = new ForceEngine(newNodes, newEdges)
    engine.setOnUpdate(() => {
      set({ nodes: [...newNodes], edges: [...newEdges] })
    })
    set({
      nodes: newNodes,
      edges: newEdges,
      selectedNodeId: get().selectedNodeId === id ? null : get().selectedNodeId,
      engine,
    })
    engine.start()
  },

  getNoteTree: (documentId) => {
    // Returns all notes for a document in the component (data from DB)
    return []
  },

  startEngine: () => {
    const { engine, nodes, edges } = get()
    if (engine) {
      engine.start()
    } else {
      const newEngine = new ForceEngine(nodes, edges)
      newEngine.setOnUpdate(() => {
        set({ nodes: [...nodes], edges: [...edges] })
      })
      set({ engine: newEngine })
      newEngine.start()
    }
  },

  stopEngine: () => {
    get().engine?.stop()
  },
}))

function addNoteNodesToGraph(
  notes: NoteRecord[],
  documentId: string,
  parentId: string | null,
  nodes: GraphNode[],
  edges: GraphEdge[]
): void {
  for (const note of notes) {
    if (note.parentNoteId !== parentId) continue

    const parentNode = nodes.find((n) => n.id === (parentId || documentId))
    const angle = Math.random() * Math.PI * 2
    const dist = (parentNode?.radius || 20) * 5

    const node: GraphNode = {
      id: note.id,
      type: 'note',
      label: note.title,
      content: note.content,
      documentId,
      parentNoteId: note.parentNoteId,
      createdAt: note.createdAt,
      color: NODE_COLORS.note,
      radius: NODE_RADII.note,
      x: (parentNode?.x || 0) + Math.cos(angle) * dist,
      y: (parentNode?.y || 0) + Math.sin(angle) * dist,
      z: (parentNode?.z || 0) + (Math.random() - 0.5) * 50,
      vx: 0, vy: 0, vz: 0,
    }
    nodes.push(node)
    edges.push({
      sourceId: note.parentNoteId || documentId,
      targetId: note.id,
    })

    // Recursively add child notes
    addNoteNodesToGraph(notes, documentId, note.id, nodes, edges)
  }
}
