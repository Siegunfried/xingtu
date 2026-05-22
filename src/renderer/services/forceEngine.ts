import type { GraphNode } from '@/types'

export interface GraphEdge {
  sourceId: string
  targetId: string
}

interface ForceConfig {
  repulsion: number
  attraction: number
  damping: number
  centerForce: number
  maxSpeed: number
}

const DEFAULT_CONFIG: ForceConfig = {
  repulsion: 8000,
  attraction: 0.005,
  damping: 0.85,
  centerForce: 0.002,
  maxSpeed: 3,
}

export class ForceEngine {
  nodes: GraphNode[]
  edges: GraphEdge[]
  config: ForceConfig
  private running = false
  private onUpdate: (() => void) | null = null

  constructor(nodes: GraphNode[], edges: GraphEdge[]) {
    this.nodes = nodes
    this.edges = edges
    this.config = { ...DEFAULT_CONFIG }
  }

  setOnUpdate(cb: () => void): void {
    this.onUpdate = cb
  }

  start(): void {
    this.running = true
    this.tick()
  }

  stop(): void {
    this.running = false
  }

  isRunning(): boolean {
    return this.running
  }

  private settled(): boolean {
    return this.nodes.every(
      (n) => Math.abs(n.vx) < 0.05 && Math.abs(n.vy) < 0.05 && Math.abs(n.vz) < 0.05
    )
  }

  private tick(): void {
    if (!this.running) return

    this.applyForces()
    this.onUpdate?.()

    if (!this.settled()) {
      requestAnimationFrame(() => this.tick())
    } else {
      this.running = false
    }
  }

  private applyForces(): void {
    const nodes = this.nodes
    const n = nodes.length

    // Repulsion: all pairs push apart
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const a = nodes[i]
        const b = nodes[j]
        let dx = b.x - a.x
        let dy = b.y - a.y
        let dz = b.z - a.z
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz) + 0.1
        const force = this.config.repulsion / (dist * dist)
        const fx = (dx / dist) * force
        const fy = (dy / dist) * force
        const fz = (dz / dist) * force
        a.vx -= fx
        a.vy -= fy
        a.vz -= fz
        b.vx += fx
        b.vy += fy
        b.vz += fz
      }
    }

    // Attraction: connected nodes pull together
    for (const edge of this.edges) {
      const a = nodes.find((nd) => nd.id === edge.sourceId)
      const b = nodes.find((nd) => nd.id === edge.targetId)
      if (!a || !b) continue

      const dx = b.x - a.x
      const dy = b.y - a.y
      const dz = b.z - a.z
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz) + 0.1
      // Tree-structured: child orbits parent at preferred distance
      const preferredDist = (a.radius + b.radius) * 4
      const displacement = dist - preferredDist
      const force = displacement * this.config.attraction
      a.vx += dx * force
      a.vy += dy * force
      a.vz += dz * force
      b.vx -= dx * force
      b.vy -= dy * force
      b.vz -= dz * force
    }

    // Center force: pull toward origin
    for (const node of nodes) {
      node.vx -= node.x * this.config.centerForce
      node.vy -= node.y * this.config.centerForce
      node.vz -= node.z * this.config.centerForce
    }

    // Apply velocity with damping
    for (const node of nodes) {
      node.vx *= this.config.damping
      node.vy *= this.config.damping
      node.vz *= this.config.damping

      // Clamp speed
      const speed = Math.sqrt(node.vx ** 2 + node.vy ** 2 + node.vz ** 2)
      if (speed > this.config.maxSpeed) {
        const scale = this.config.maxSpeed / speed
        node.vx *= scale
        node.vy *= scale
        node.vz *= scale
      }

      node.x += node.vx
      node.y += node.vy
      node.z += node.vz
    }
  }

  setNodeFixed(id: string, position: { x: number; y: number; z: number }): void {
    const node = this.nodes.find((nd) => nd.id === id)
    if (node) {
      node.x = position.x
      node.y = position.y
      node.z = position.z
      node.vx = 0
      node.vy = 0
      node.vz = 0
    }
  }
}
