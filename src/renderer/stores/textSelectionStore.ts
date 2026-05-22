import { create } from 'zustand'

interface TextSelection {
  text: string           // The selected text content
  startIndex: number     // Start position in the raw content
  endIndex: number       // End position in the raw content
  contentId: string      // Document or note ID
  fullContent: string    // The full raw content for replacement context
}

interface TextSelectionState {
  selection: TextSelection | null
  showToolbar: boolean
  toolbarPos: { x: number; y: number }

  setSelection: (sel: TextSelection | null) => void
  setToolbar: (show: boolean, pos?: { x: number; y: number }) => void
  clearSelection: () => void
}

export const useTextSelectionStore = create<TextSelectionState>((set) => ({
  selection: null,
  showToolbar: false,
  toolbarPos: { x: 0, y: 0 },

  setSelection: (sel) => set({ selection: sel }),
  setToolbar: (show, pos) => set({ showToolbar: show, toolbarPos: pos || { x: 0, y: 0 } }),
  clearSelection: () => set({ selection: null, showToolbar: false }),
}))
