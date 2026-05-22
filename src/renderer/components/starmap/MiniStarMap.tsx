import React, { useRef, useEffect } from 'react'
import { useStarMapStore } from '@/stores/starMapStore'
import { useWorkspaceStore } from '@/stores/workspaceStore'

export default function MiniStarMap() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef(0)
  const nodes = useStarMapStore((s) => s.nodes)
  const tick = useStarMapStore((s) => s.tick)
  const selectNode = useStarMapStore((s) => s.selectNode)
  const selectedNode = useStarMapStore((s) => s.selectedNode)
  const workspacePath = useWorkspaceStore((s) => s.workspacePath)
  const rootEntries = useWorkspaceStore((s) => s.rootEntries)
  const buildFromFiles = useStarMapStore((s) => s.buildFromFiles)

  // Build graph when files change
  useEffect(() => {
    if (workspacePath && rootEntries.length > 0) {
      buildFromFiles(workspacePath, rootEntries)
    }
  }, [workspacePath, rootEntries, buildFromFiles])

  // Animation loop
  useEffect(() => {
    let running = true
    const loop = () => {
      if (!running) return
      tick()
      animRef.current = requestAnimationFrame(loop)
    }
    animRef.current = requestAnimationFrame(loop)
    return () => { running = false; cancelAnimationFrame(animRef.current) }
  }, [tick])

  // Canvas render
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const parent = canvas.parentElement
    if (!parent) return
    const dpr = window.devicePixelRatio
    const w = parent.clientWidth
    const h = parent.clientHeight
    canvas.width = w * dpr
    canvas.height = h * dpr
    canvas.style.width = w + 'px'
    canvas.style.height = h + 'px'
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    const isDark = document.documentElement.classList.contains('dark')

    const render = () => {
      ctx.clearRect(0, 0, w, h)

      // Background
      ctx.fillStyle = isDark ? '#0f172a' : '#f1f5f9'
      ctx.fillRect(0, 0, w, h)

      // Subtle grid dots
      ctx.fillStyle = isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.04)'
      for (let x = 0; x < w; x += 20) {
        for (let y = 0; y < h; y += 20) {
          ctx.fillRect(x, y, 1, 1)
        }
      }

      if (nodes.length === 0) {
        ctx.fillStyle = isDark ? '#64748b' : '#94a3b8'
        ctx.font = '12px -apple-system, sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText('导入文档后生成星图', w / 2, h / 2)
        return
      }

      // Draw edges (note → parent)
      for (const node of nodes) {
        if (node.parentPath) {
          const parent = nodes.find((n) => n.path === node.parentPath)
          if (parent) {
            ctx.strokeStyle = isDark ? 'rgba(96,165,250,0.25)' : 'rgba(59,130,246,0.2)'
            ctx.lineWidth = 0.8
            ctx.beginPath()
            ctx.moveTo(parent.x, parent.y)
            ctx.lineTo(node.x, node.y)
            ctx.stroke()
          }
        }
      }

      // Draw nodes
      for (const node of nodes) {
        const isDoc = node.type === 'document'
        const isSel = selectedNode?.id === node.id
        const r = isDoc ? 7 : 4

        // Selection glow
        if (isSel) {
          const grad = ctx.createRadialGradient(node.x, node.y, r, node.x, node.y, r + 10)
          grad.addColorStop(0, 'rgba(96,165,250,0.3)')
          grad.addColorStop(1, 'transparent')
          ctx.fillStyle = grad
          ctx.beginPath()
          ctx.arc(node.x, node.y, r + 10, 0, Math.PI * 2)
          ctx.fill()
        }

        // Node body - matte
        ctx.fillStyle = isDoc
          ? (isDark ? '#5b8def' : '#3b6cb4')
          : (isDark ? '#7b9fc7' : '#6b8db5')
        ctx.beginPath()
        ctx.arc(node.x, node.y, r, 0, Math.PI * 2)
        ctx.fill()

        // Border
        ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)'
        ctx.lineWidth = 0.5
        ctx.stroke()

        // Document inner ring
        if (isDoc) {
          ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)'
          ctx.lineWidth = 0.8
          ctx.beginPath()
          ctx.arc(node.x, node.y, r - 2, 0, Math.PI * 2)
          ctx.stroke()
        }

        // Label
        const label = node.name.length > 8 ? node.name.slice(0, 8) + '..' : node.name
        ctx.fillStyle = isDark ? '#cbd5e1' : '#334155'
        ctx.font = '9px -apple-system, sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText(label, node.x, node.y + r + 11)
      }
    }

    render()
  }, [nodes, selectedNode])

  // Click handler
  const handleClick = (e: React.MouseEvent) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const mx = e.clientX - rect.left
    const my = e.clientY - rect.top

    let closest: string | null = null
    let closestDist = 20
    for (const node of nodes) {
      const dist = Math.sqrt((mx - node.x) ** 2 + (my - node.y) ** 2)
      if (dist < closestDist) {
        closestDist = dist
        closest = node.id
      }
    }
    if (closest) {
      const node = nodes.find((n) => n.id === closest) || null
      selectNode(node)
    }
  }

  return (
    <canvas ref={canvasRef} onClick={handleClick}
      className="w-full cursor-pointer"
      style={{ touchAction: 'none', height: '280px' }}
    />
  )
}
