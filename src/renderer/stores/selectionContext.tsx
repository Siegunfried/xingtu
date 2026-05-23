import React, { createContext, useContext, useState, useCallback, type ReactNode } from 'react'

export interface TextSelection {
  text: string
  startIndex: number
  endIndex: number
  contentId: string
  fullContent: string
}

interface SelectionContextType {
  selection: TextSelection | null
  setSelection: (sel: TextSelection | null) => void
  clearSelection: () => void
}

const SelectionContext = createContext<SelectionContextType>({
  selection: null,
  setSelection: () => {},
  clearSelection: () => {},
})

export function SelectionProvider({ children }: { children: ReactNode }) {
  const [selection, setSelection] = useState<TextSelection | null>(null)
  const clearSelection = useCallback(() => setSelection(null), [])
  return (
    <SelectionContext.Provider value={{ selection, setSelection, clearSelection }}>
      {children}
    </SelectionContext.Provider>
  )
}

export function useSelectionContext() {
  return useContext(SelectionContext)
}
