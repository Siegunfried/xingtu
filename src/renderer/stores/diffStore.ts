import { create } from 'zustand'

export type DiffTarget = 'document' | 'notes'

interface DiffState {
  pendingDiff: {
    oldContent: string
    newContent: string
    target: DiffTarget
    title: string
  } | null

  showDiff: (oldContent: string, newContent: string, target: DiffTarget, title: string) => void
  clearDiff: () => void
}

export const useDiffStore = create<DiffState>((set) => ({
  pendingDiff: null,
  showDiff: (oldContent, newContent, target, title) =>
    set({ pendingDiff: { oldContent, newContent, target, title } }),
  clearDiff: () => set({ pendingDiff: null }),
}))
