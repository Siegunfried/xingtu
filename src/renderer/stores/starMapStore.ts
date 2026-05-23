import { create } from 'zustand'

interface StarNode {
  id: string
  name: string
  path: string
  type: 'document' | 'note'
  parentPath: string | null
  level: number        // 0=document, 1=direct note, 2=sub-note...
  x: number; y: number
  vx: number; vy: number
  pinned: boolean      // true = fixed position (documents)
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
        const subEntries = await window.electronAPI.listDir(entry.path)
        const hasNotes = subEntries.some((s) => s.name.endsWith('.md'))
        if (hasNotes) {
          for (const sub of subEntries) {
            if (sub.name.endsWith('.md')) {
              nodes.push({
                id: sub.path, name: sub.name.replace('.md', ''), path: sub.path,
                type: 'note', parentPath: entry.path, level: 1,
                x: 0, y: 0, vx: 0, vy: 0, pinned: false,
              })
            }
          }
        }
      } else if (docExts.has(ext)) {
        nodes.push({
          id: entry.path, name: entry.name, path: entry.path,
          type: 'document', parentPath: null, level: 0,
          x: 0, y: 0, vx: 0, vy: 0, pinned: true,
        })
      }
    }

    // ---- Tree layout ----
    const docs = nodes.filter((n) => n.type === 'document')
    const noteNodes = nodes.filter((n) => n.type === 'note')

    // Position documents evenly in a horizontal row at the top
    const docSpacing = Math.min(180, 800 / Math.max(docs.length, 1))
    const docStartX = -(docs.length - 1) * docSpacing / 2
    docs.forEach((d, i) => {
      d.x = docStartX + i * docSpacing
      d.y = -120
    })

    // Position notes in rings around their parent document
    // Group notes by parent
    const childrenByParent = new Map<string, StarNode[]>()
    for (const n of noteNodes) {
      if (!n.parentPath) continue
      const list = childrenByParent.get(n.parentPath) || []
      list.push(n)
      childrenByParent.set(n.parentPath, list)
    }

    const parentEntries = Array.from(childrenByParent.entries())
    for (let pi = 0; pi < parentEntries.length; pi++) {
      const parentPath = parentEntries[pi][0]
      const children = parentEntries[pi][1]
      const parent = nodes.find((n) => n.path === parentPath)
      if (!parent) continue
      const count = children.length
      const ringRadius = 60 + count * 4
      for (let i = 0; i < children.length; i++) {
        const child = children[i]
        // Spread around the parent in a partial arc
        const startAngle = -Math.PI / 2 - (count - 1) * 0.15
        const angle = startAngle + i * (Math.PI * 0.6 / Math.max(count - 1, 1))
        child.x = parent.x + Math.cos(angle) * ringRadius
        child.y = parent.y + Math.sin(angle) * ringRadius + 30
      }
    }

    set({ nodes })
  },

  selectNode: (node) => set({ selectedNode: node, showCard: true }),
  closeCard: () => set({ showCard: false, selectedNode: null }),

  tick: () => {
    const { nodes } = get()
    if (nodes.length === 0) return

    // --- Repulsion: all non-connected pairs push apart ---
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i], b = nodes[j]
        // Skip repulsion if they're parent-child
        if (a.parentPath === b.path || b.parentPath === a.path) continue
        let dx = b.x - a.x, dy = b.y - a.y
        const dist = Math.sqrt(dx * dx + dy * dy) + 0.1
        const force = 2000 / (dist * dist)
        a.vx -= (dx / dist) * force
        a.vy -= (dy / dist) * force
        b.vx += (dx / dist) * force
        b.vy += (dy / dist) * force
      }
    }

    // --- Strong attraction: child pulled toward parent ---
    for (const node of nodes) {
      if (!node.parentPath) continue
      const parent = nodes.find((n) => n.path === node.parentPath)
      if (!parent) continue
      const dx = parent.x - node.x, dy = parent.y - node.y
      const dist = Math.sqrt(dx * dx + dy * dy) + 0.1
      const preferred = 55 + node.level * 15
      const displacement = dist - preferred
      // Strong spring force toward ideal distance
      const force = displacement * 0.03
      node.vx += dx / dist * force
      node.vy += dy / dist * force
    }

    // --- Sibling spread within same parent ---
    const siblings = new Map<string, StarNode[]>()
    for (const node of nodes) {
      if (!node.parentPath) continue
      const list = siblings.get(node.parentPath) || []
      list.push(node)
      siblings.set(node.parentPath, list)
    }
    const sibEntries = Array.from(siblings.values())
    for (let si = 0; si < sibEntries.length; si++) {
      const sibs = sibEntries[si]
      for (let i = 0; i < sibs.length; i++) {
        for (let j = i + 1; j < sibs.length; j++) {
          const a = sibs[i], b = sibs[j]
          let dx = b.x - a.x, dy = b.y - a.y
          const dist = Math.sqrt(dx * dx + dy * dy) + 0.1
          const preferred = 35
          if (dist < preferred) {
            const force = (preferred - dist) * 0.02
            a.vx -= dx / dist * force
            a.vy -= dy / dist * force
            b.vx += dx / dist * force
            b.vy += dy / dist * force
          }
        }
      }
    }

    // --- Document spread: keep documents apart ---
    const docs = nodes.filter((n) => n.type === 'document')
    for (let i = 0; i < docs.length; i++) {
      for (let j = i + 1; j < docs.length; j++) {
        const a = docs[i], b = docs[j]
        let dx = b.x - a.x, dy = b.y - a.y
        const dist = Math.sqrt(dx * dx + dy * dy) + 0.1
        const preferred = 200
        if (dist < preferred) {
          const force = (preferred - dist) * 0.015
          a.vx -= dx / dist * force; a.vy -= dy / dist * force
          b.vx += dx / dist * force; b.vy += dy / dist * force
        }
      }
    }

    // --- Global center + damping ---
    for (const node of nodes) {
      if (node.pinned) {
        // Documents: light center pull + high damping
        node.vx += (0 - node.x) * 0.0003 + (40 - node.y) * 0.0003
        node.vx *= 0.75
        node.vy *= 0.75
      } else {
        node.vx += (0 - node.x) * 0.0002
        node.vy += (0 - node.y) * 0.0002
        node.vx *= 0.82
        node.vy *= 0.82
      }
      // Clamp speed
      const speed = Math.sqrt(node.vx * node.vx + node.vy * node.vy)
      const maxSpeed = node.pinned ? 0.8 : 1.5
      if (speed > maxSpeed) {
        node.vx *= maxSpeed / speed
        node.vy *= maxSpeed / speed
      }
      node.x += node.vx
      node.y += node.vy
    }

    set({ nodes: [...nodes] })
  },
}))
