import React, { useRef, useEffect, useCallback } from 'react'
import { useStarMapStore } from '@/stores/starMapStore'

interface Camera {
  theta: number    // horizontal rotation angle
  phi: number      // vertical tilt
  distance: number // zoom
  targetX: number
  targetY: number
}

export default function StarMap() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const cameraRef = useRef<Camera>({
    theta: 0.5,
    phi: 0.6,
    distance: 500,
    targetX: 0,
    targetY: 0,
  })
  const dragRef = useRef<{ startX: number; startY: number; theta: number; phi: number } | null>(null)
  const hoveredRef = useRef<string | null>(null)
  const animationRef = useRef<number>(0)

  const nodes = useStarMapStore((s) => s.nodes)
  const edges = useStarMapStore((s) => s.edges)
  const selectedNodeId = useStarMapStore((s) => s.selectedNodeId)
  const selectNode = useStarMapStore((s) => s.selectNode)
  const initialized = useStarMapStore((s) => s.initialized)
  const buildGraph = useStarMapStore((s) => s.buildGraph)

  // Init graph on mount
  useEffect(() => {
    if (!initialized) {
      buildGraph()
    }
  }, [initialized, buildGraph])

  // Main render loop
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const render = () => {
      const w = canvas.width
      const h = canvas.height
      const cam = cameraRef.current
      const isDark = document.documentElement.classList.contains('dark')

      ctx.clearRect(0, 0, w, h)

      // Background gradient
      const grad = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w * 0.7)
      if (isDark) {
        grad.addColorStop(0, '#0a1628')
        grad.addColorStop(1, '#050a14')
      } else {
        grad.addColorStop(0, '#f8fafc')
        grad.addColorStop(1, '#e2e8f0')
      }
      ctx.fillStyle = grad
      ctx.fillRect(0, 0, w, h)

      // Draw subtle background stars
      drawBackgroundStars(ctx, w, h, isDark)

      // Camera matrix
      const cosT = Math.cos(cam.theta)
      const sinT = Math.sin(cam.theta)
      const cosP = Math.cos(cam.phi)
      const sinP = Math.sin(cam.phi)

      // Projection helper
      const project = (x: number, y: number, z: number) => {
        // Translate relative to target
        const dx = x - cam.targetX
        const dy = y - cam.targetY

        // Rotate around Y axis (theta)
        const rx = dx * cosT - z * sinT
        const rz = dx * sinT + z * cosT
        const ry = dy * cosP - rz * sinP
        const rz2 = dy * sinP + rz * cosP

        // Perspective
        const scale = cam.distance / (cam.distance + rz2 + 300)
        const sx = w / 2 + rx * scale
        const sy = h / 2 + ry * scale

        return { sx, sy, scale, depth: rz2 }
      }

      // Calculate projected positions and sort by depth (back to front)
      const projected = nodes
        .map((node) => {
          const { sx, sy, scale, depth } = project(node.x, node.y, node.z)
          return { node, sx, sy, scale, depth }
        })
        .sort((a, b) => b.depth - a.depth)

      // Draw edges
      for (const edge of edges) {
        const sourceNode = nodes.find((n) => n.id === edge.sourceId)
        const targetNode = nodes.find((n) => n.id === edge.targetId)
        if (!sourceNode || !targetNode) continue

        const sProj = project(sourceNode.x, sourceNode.y, sourceNode.z)
        const tProj = project(targetNode.x, targetNode.y, targetNode.z)

        const alpha = Math.max(0.1, Math.min(0.5, (sProj.scale + tProj.scale) / 2))
        ctx.strokeStyle = isDark
          ? `rgba(96, 165, 250, ${alpha})`
          : `rgba(59, 130, 246, ${alpha * 0.7})`
        ctx.lineWidth = 1 * Math.min(sProj.scale, tProj.scale)
        ctx.beginPath()
        ctx.moveTo(sProj.sx, sProj.sy)

        // Curved line (quadratic bezier)
        const mx = (sProj.sx + tProj.sx) / 2
        const my = (sProj.sy + tProj.sy) / 2 - 15 * sProj.scale
        ctx.quadraticCurveTo(mx, my, tProj.sx, tProj.sy)
        ctx.stroke()
      }

      // Draw nodes
      for (const { node, sx, sy, scale } of projected) {
        const r = node.radius * scale
        const isDoc = node.type === 'document'
        const isSelected = node.id === selectedNodeId
        const isHovered = node.id === hoveredRef.current

        const baseColor = isDoc
          ? (isDark ? '#4b7cc9' : '#3b6cb4')
          : (isDark ? '#6b8db5' : '#5a7fa8')
        const hoverColor = isDoc
          ? (isDark ? '#5d8fd6' : '#4b7cc9')
          : (isDark ? '#7d9fc7' : '#6b8db5')

        // Flat matte core
        ctx.fillStyle = (isHovered || isSelected) ? hoverColor : baseColor
        ctx.beginPath()
        ctx.arc(sx, sy, r, 0, Math.PI * 2)
        ctx.fill()

        // Thin subtle border
        ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)'
        ctx.lineWidth = 0.8 * scale
        ctx.stroke()

        // Document nodes: slightly larger with a subtle inner ring
        if (isDoc) {
          ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.15)'
          ctx.lineWidth = 1.2 * scale
          ctx.beginPath()
          ctx.arc(sx, sy, r - 3 * scale, 0, Math.PI * 2)
          ctx.stroke()
        }

        // Selection indicator: dashed ring
        if (isSelected) {
          ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)'
          ctx.lineWidth = 1.5 * scale
          ctx.setLineDash([4 * scale, 3 * scale])
          ctx.beginPath()
          ctx.arc(sx, sy, r + 5 * scale, 0, Math.PI * 2)
          ctx.stroke()
          ctx.setLineDash([])
        }

        // Label (only for document nodes or larger notes)
        if (isDoc || isHovered || isSelected) {
          const fontSize = Math.max(10, isDoc ? 12 : 10) * Math.min(scale, 1.5)
          ctx.font = `${fontSize}px -apple-system, sans-serif`
          ctx.fillStyle = isDark ? '#e2e8f0' : '#1e293b'
          ctx.textAlign = 'center'

          const label = node.label.length > 15
            ? node.label.slice(0, 15) + '...'
            : node.label
          ctx.fillText(label, sx, sy + r + 14 * scale)

          // Show note count on document nodes
          if (isDoc) {
            const noteCount = edges.filter((e) => e.sourceId === node.id).length
            if (noteCount > 0) {
              ctx.font = `${fontSize * 0.8}px -apple-system, sans-serif`
              ctx.fillStyle = isDark ? '#94a3b8' : '#64748b'
              ctx.fillText(`${noteCount} 篇笔记`, sx, sy + r + 26 * scale)
            }
          }
        }
      }

      animationRef.current = requestAnimationFrame(render)
    }

    render()
    return () => cancelAnimationFrame(animationRef.current)
  }, [nodes, edges, selectedNodeId])

  // Handle resize
  useEffect(() => {
    const resize = () => {
      const canvas = canvasRef.current
      if (!canvas) return
      const parent = canvas.parentElement
      if (!parent) return
      canvas.width = parent.clientWidth * window.devicePixelRatio
      canvas.height = parent.clientHeight * window.devicePixelRatio
      canvas.style.width = parent.clientWidth + 'px'
      canvas.style.height = parent.clientHeight + 'px'
      const ctx = canvas.getContext('2d')
      ctx?.scale(window.devicePixelRatio, window.devicePixelRatio)
    }
    resize()
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [])

  // Mouse handlers
  const getMousePos = useCallback((e: React.MouseEvent) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }, [])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const pos = getMousePos(e)
    dragRef.current = {
      startX: pos.x,
      startY: pos.y,
      theta: cameraRef.current.theta,
      phi: cameraRef.current.phi,
    }
  }, [getMousePos])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const pos = getMousePos(e)

    // Drag to orbit
    if (dragRef.current) {
      const dx = pos.x - dragRef.current.startX
      const dy = pos.y - dragRef.current.startY
      cameraRef.current.theta = dragRef.current.theta + dx * 0.005
      cameraRef.current.phi = Math.max(
        -1.4,
        Math.min(1.4, dragRef.current.phi + dy * 0.005)
      )
      return
    }

    // Hover detection (approximate)
    const canvas = canvasRef.current
    if (!canvas) return
    const w = canvas.width / window.devicePixelRatio
    const h = canvas.height / window.devicePixelRatio
    const cam = cameraRef.current

    let closestId: string | null = null
    let closestDist = 30 // hit radius

    for (const node of nodes) {
      const cosT = Math.cos(cam.theta)
      const sinT = Math.sin(cam.theta)
      const cosP = Math.cos(cam.phi)
      const sinP = Math.sin(cam.phi)

      const dx = node.x - cam.targetX
      const dy = node.y - cam.targetY
      const rx = dx * cosT - node.z * sinT
      const rz = dx * sinT + node.z * cosT
      const ry = dy * cosP - rz * sinP
      const rz2 = dy * sinP + rz * cosP

      const scale = cam.distance / (cam.distance + rz2 + 300)
      const sx = w / 2 + rx * scale
      const sy = h / 2 + ry * scale

      const dist = Math.sqrt((pos.x - sx) ** 2 + (pos.y - sy) ** 2)
      if (dist < closestDist && dist < node.radius * scale + 10) {
        closestDist = dist
        closestId = node.id
      }
    }

    hoveredRef.current = closestId
    const cursor = closestId ? 'pointer' : dragRef.current ? 'grabbing' : 'grab'
    if (canvas) canvas.style.cursor = cursor
  }, [nodes, getMousePos])

  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    if (dragRef.current) {
      const dx = e.clientX - dragRef.current.startX
      const dy = e.clientY - dragRef.current.startY
      const moved = Math.abs(dx) > 2 || Math.abs(dy) > 2
      dragRef.current = null

      // If didn't move much, treat as click
      if (!moved) {
        const hoveredId = hoveredRef.current
        selectNode(hoveredId === selectedNodeId ? null : hoveredId)
      }
    }
  }, [selectNode, selectedNodeId])

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    cameraRef.current.distance = Math.max(
      150,
      Math.min(1500, cameraRef.current.distance + e.deltaY * 0.5)
    )
  }, [])

  return (
    <canvas
      ref={canvasRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
      className="w-full h-full block"
      style={{ touchAction: 'none' }}
    />
  )
}

// Draw random background stars
function drawBackgroundStars(ctx: CanvasRenderingContext2D, w: number, h: number, isDark: boolean) {
  const count = Math.floor((w * h) / 2000)
  const color = isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.15)'

  // Use deterministic positions for stability
  const seed = 42
  for (let i = 0; i < count; i++) {
    const x = ((i * 137 + seed) % w)
    const y = ((i * 271 + seed * 3) % h)
    const r = ((i * 53) % 3) * 0.3 + 0.3

    ctx.fillStyle = color
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fill()
  }

}
