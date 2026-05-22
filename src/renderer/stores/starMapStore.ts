import { create } from 'zustand'

interface StarNode {
  id: string        // file path
  name: string
  path: string
  type: 'document' | 'note'
  parentPath: string | null
  x: number; y: number
  vx: number; vy: number
}

interface StarMapState {
  nodes: StarNode[]
  selectedNode: StarNode | null
  showCard: boolean

  buildFromFiles: (rootPath: string, entries: { name: string; path: string; isDirectory: boolean }[]) => Promise<void>
  selectNode: (node: StarNode | null) => void
  closeCard: () => void
  tick: () => void
}

export const useStarMapStore = create<StarMapState>((set, get) => ({
  nodes: [],
  selectedNode: null,
  showCard: false,

  buildFromFiles: async (rootPath, entries) => {
    const nodes: StarNode[] = []
    const docExts = new Set(['pdf', 'docx', 'txt', 'md'])

    for (const entry of entries) {
      const ext = entry.name.split('.').pop()?.toLowerCase() || ''
      if (entry.isDirectory) {
        // Check if it's a note folder (contains .md files)
        const subEntries = await window.electronAPI.listDir(entry.path)
        const hasNotes = subEntries.some((s) => s.name.endsWith('.md'))
        if (hasNotes) {
          // Add note files as children
          for (const sub of subEntries) {
            if (sub.name.endsWith('.md')) {
              nodes.push({
                id: sub.path, name: sub.name.replace('.md', ''), path: sub.path,
                type: 'note', parentPath: entry.path,
                x: 0, y: 0, vx: 0, vy: 0,
              })
            }
          }
        }
      } else if (docExts.has(ext)) {
        nodes.push({
          id: entry.path, name: entry.name, path: entry.path,
          type: 'document', parentPath: null,
          x: 0, y: 0, vx: 0, vy: 0,
        })
      }
    }

    // Initial layout: spread in a circle
    const cx = 120, cy = 160, r = 90
    nodes.forEach((n, i) => {
      const angle = (2 * Math.PI * i) / Math.max(nodes.length, 1)
      n.x = cx + Math.cos(angle) * r * (0.5 + Math.random() * 0.5)
      n.y = cy + Math.sin(angle) * r * (0.5 + Math.random() * 0.5)
    })

    set({ nodes })
  },

  selectNode: (node) => set({ selectedNode: node, showCard: true }),
  closeCard: () => set({ showCard: false, selectedNode: null }),

  tick: () => {
    const { nodes } = get()
    if (nodes.length === 0) return

    // Simple force iteration
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i], b = nodes[j]
        let dx = b.x - a.x, dy = b.y - a.y
        const dist = Math.sqrt(dx * dx + dy * dy) + 0.1
        const force = 3000 / (dist * dist)
        a.vx -= (dx / dist) * force
        a.vy -= (dy / dist) * force
        b.vx += (dx / dist) * force
        b.vy += (dy / dist) * force
      }
    }

    // Attraction: note nodes pulled toward their parent
    for (const node of nodes) {
      if (node.parentPath) {
        const parent = nodes.find((n) => n.path === node.parentPath)
        if (parent) {
          const dx = parent.x - node.x, dy = parent.y - node.y
          const dist = Math.sqrt(dx * dx + dy * dy) + 0.1
          const targetDist = 50
          const force = (dist - targetDist) * 0.01
          node.vx += dx * force
          node.vy += dy * force
        }
      }
    }

    // Center pull + damping
    const cx = 120, cy = 160
    for (const node of nodes) {
      node.vx += (cx - node.x) * 0.001
      node.vy += (cy - node.y) * 0.001
      node.vx *= 0.85
      node.vy *= 0.85
      node.x += node.vx
      node.y += node.vy
    }

    set({ nodes: [...nodes] })
  },
}))
