import { create } from 'zustand'

const MAX_HISTORY = 3

interface UndoEntry {
  id: string           // document or note id
  content: string      // the content BEFORE the change
}

interface UndoState {
  // Separate stacks per content id
  undoStacks: Record<string, { past: UndoEntry[]; future: UndoEntry[] }>

  pushState: (id: string, content: string) => void
  undo: (id: string) => string | null     // returns the previous content, or null
  redo: (id: string) => string | null     // returns the redone content, or null
  clearHistory: (id: string) => void
}

export const useUndoStore = create<UndoState>((set, get) => ({
  undoStacks: {},

  pushState: (id, content) => {
    set((state) => {
      const stack = state.undoStacks[id] || { past: [], future: [] }
      const newPast = [
        { id, content },
        ...stack.past,
      ].slice(0, MAX_HISTORY)
      return {
        undoStacks: {
          ...state.undoStacks,
          [id]: { past: newPast, future: [] },
        },
      }
    })
  },

  undo: (id) => {
    const stack = get().undoStacks[id]
    if (!stack || stack.past.length === 0) return null

    const [latest, ...rest] = stack.past
    set((state) => ({
      undoStacks: {
        ...state.undoStacks,
        [id]: {
          past: rest,
          future: [{ id, content: latest.content }, ...stack.future],
        },
      },
    }))
    return latest.content
  },

  redo: (id) => {
    const stack = get().undoStacks[id]
    if (!stack || stack.future.length === 0) return null

    const [latest, ...rest] = stack.future
    set((state) => ({
      undoStacks: {
        ...state.undoStacks,
        [id]: {
          past: [{ id, content: latest.content }, ...stack.past].slice(0, MAX_HISTORY),
          future: rest,
        },
      },
    }))
    return latest.content
  },

  clearHistory: (id) => {
    set((state) => {
      const { [id]: _, ...rest } = state.undoStacks
      return { undoStacks: rest }
    })
  },
}))
