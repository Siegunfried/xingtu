import React, { useRef, useEffect, useState } from 'react'
import { useWorkspaceStore } from '@/stores/workspaceStore'
import { useChatStore } from '@/stores/chatStore'
import { useStarMapStore } from '@/stores/starMapStore'
import MarkdownRenderer from '@/components/viewer/MarkdownRenderer'

interface Props { onClose: () => void }

export default function StarMapPanel({ onClose }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef(0)
  const cameraRef = useRef({ theta: 0.5, phi: 0.5, dist: 500 })
  const dragRef = useRef<{ sx: number; sy: number; t: number; p: number } | null>(null)
  const hoveredRef = useRef<string | null>(null)
  const [showTip, setShowTip] = useState(true)

  const nodes = useStarMapStore((s) => s.nodes)
  const tick = useStarMapStore((s) => s.tick)
  const selectedNode = useStarMapStore((s) => s.selectedNode)
  const selectNode = useStarMapStore((s) => s.selectNode)
  const closeCard = useStarMapStore((s) => s.closeCard)
  const workspacePath = useWorkspaceStore((s) => s.workspacePath)
  const rootEntries = useWorkspaceStore((s) => s.rootEntries)
  const buildFromFiles = useStarMapStore((s) => s.buildFromFiles)
  const selectFile = useWorkspaceStore((s) => s.selectFile)
  const selectNote = useWorkspaceStore((s) => s.selectNote)
  const loadMessages = useChatStore((s) => s.loadMessages)

  useEffect(() => {
    if (workspacePath && rootEntries.length > 0) buildFromFiles(workspacePath, rootEntries)
  }, [workspacePath, rootEntries, buildFromFiles])

  useEffect(() => { setTimeout(() => setShowTip(false), 4000) }, [])

  // Animation + render
  useEffect(() => {
    let running = true
    const loop = () => { if (!running) return; tick(); animRef.current = requestAnimationFrame(loop) }
    animRef.current = requestAnimationFrame(loop)
    return () => { running = false; cancelAnimationFrame(animRef.current) }
  }, [tick])

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return
    const resize = () => {
      const p = canvas.parentElement; if (!p) return
      canvas.width = p.clientWidth * devicePixelRatio
      canvas.height = p.clientHeight * devicePixelRatio
      canvas.style.width = p.clientWidth + 'px'
      canvas.style.height = p.clientHeight + 'px'
    }
    resize(); window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [])

  // Canvas render
  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return
    const ctx = canvas.getContext('2d'); if (!ctx) return
    const isDark = document.documentElement.classList.contains('dark')
    const w = canvas.width / devicePixelRatio
    const h = canvas.height / devicePixelRatio
    const cam = cameraRef.current

    const project = (x: number, y: number, z: number) => {
      const cosT = Math.cos(cam.theta), sinT = Math.sin(cam.theta)
      const cosP = Math.cos(cam.phi), sinP = Math.sin(cam.phi)
      const rx = x * cosT - z * sinT
      const rz = x * sinT + z * cosT
      const ry = y * cosP - rz * sinP
      const rz2 = y * sinP + rz * cosP
      const s = cam.dist / (cam.dist + rz2 + 400)
      return { sx: w / 2 + rx * s, sy: h / 2 + ry * s, s, d: rz2 }
    }

    const render = () => {
      ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0)

      // Background
      const bg = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w * 0.7)
      bg.addColorStop(0, isDark ? '#0f172a' : '#f8fafc')
      bg.addColorStop(1, isDark ? '#050a14' : '#e2e8f0')
      ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h)

      if (nodes.length === 0) {
        ctx.fillStyle = isDark ? '#64748b' : '#94a3b8'
        ctx.font = '14px -apple-system, sans-serif'; ctx.textAlign = 'center'
        ctx.fillText('导入文档后生成星图', w / 2, h / 2)
        return
      }

      const projected = nodes.map((n) => ({ n, ...project(n.x, n.y, 0) })).sort((a, b) => b.d - a.d)

      // Edges
      for (const node of nodes) {
        if (!node.parentPath) continue
        const parent = nodes.find((n) => n.path === node.parentPath)
        if (!parent) continue
        const sp = project(parent.x, parent.y, 0)
        const tp = project(node.x, node.y, 0)
        ctx.strokeStyle = isDark ? `rgba(96,165,250,${0.15 + (sp.s + tp.s) / 4})` : `rgba(59,130,246,${0.1 + (sp.s + tp.s) / 5})`
        ctx.lineWidth = Math.min(sp.s, tp.s); ctx.beginPath()
        ctx.moveTo(sp.sx, sp.sy); ctx.lineTo(tp.sx, tp.sy); ctx.stroke()
      }

      // Nodes
      for (const { n, sx, sy, s } of projected) {
        const isDoc = n.type === 'document'; const isSel = selectedNode?.id === n.id
        const isHover = hoveredRef.current === n.id; const r = (isDoc ? 14 : 7) * s

        // Selection glow
        if (isSel) {
          ctx.fillStyle = `rgba(96,165,250,0.15)`; ctx.beginPath(); ctx.arc(sx, sy, r * 2.5, 0, Math.PI * 2); ctx.fill()
        }

        // Matte core
        ctx.fillStyle = isDoc ? (isDark ? '#5b8def' : '#3b6cb4') : (isDark ? '#7b9fc7' : '#6b8db5')
        ctx.beginPath(); ctx.arc(sx, sy, r, 0, Math.PI * 2); ctx.fill()
        ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)'; ctx.lineWidth = 0.8 * s; ctx.stroke()

        if (isDoc) {
          ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.12)'
          ctx.lineWidth = 1.2 * s; ctx.beginPath(); ctx.arc(sx, sy, r - 3 * s, 0, Math.PI * 2); ctx.stroke()
        }

        // Label
        if (isDoc || isHover || isSel) {
          const fs = Math.max(9, (isDoc ? 12 : 10) * Math.min(s, 1.5))
          ctx.font = `${fs}px -apple-system, sans-serif`; ctx.textAlign = 'center'
          ctx.fillStyle = isDark ? '#cbd5e1' : '#334155'
          const lbl = n.name.length > 12 ? n.name.slice(0, 12) + '...' : n.name
          ctx.fillText(lbl, sx, sy + r + 12 * s)
        }
      }

      if (showTip) {
        ctx.fillStyle = isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.3)'
        ctx.font = '12px -apple-system, sans-serif'; ctx.textAlign = 'center'
        ctx.fillText('拖拽旋转 · 滚轮缩放 · 点击选择', w / 2, h - 24)
      }
    }
    render()
  }, [nodes, selectedNode, showTip])

  // Input handlers
  const toCanvas = (e: React.MouseEvent) => {
    const c = canvasRef.current; if (!c) return { x: 0, y: 0 }
    const r = c.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }
  }

  const handleDown = (e: React.MouseEvent) => {
    const p = toCanvas(e); const cam = cameraRef.current
    dragRef.current = { sx: p.x, sy: p.y, t: cam.theta, p: cam.phi }
  }

  const handleMove = (e: React.MouseEvent) => {
    const p = toCanvas(e)
    if (dragRef.current) {
      const d = dragRef.current
      cameraRef.current.theta = d.t + (p.x - d.sx) * 0.005
      cameraRef.current.phi = Math.max(-1.4, Math.min(1.4, d.p + (p.y - d.sy) * 0.005))
      return
    }
    // Hover
    let best: string | null = null; let bestD = 30
    for (const n of nodes) {
      const cam = cameraRef.current
      const cosT = Math.cos(cam.theta), sinT = Math.sin(cam.theta)
      const cosP = Math.cos(cam.phi), sinP = Math.sin(cam.phi)
      const rx = n.x * cosT - 0 * sinT; const rz = n.x * sinT + 0 * cosT
      const ry = n.y * cosP - rz * sinP; const rz2 = n.y * sinP + rz * cosP
      const s = cam.dist / (cam.dist + rz2 + 400)
      const w = canvasRef.current!.width / devicePixelRatio
      const h = canvasRef.current!.height / devicePixelRatio
      const sx = w / 2 + rx * s; const sy = h / 2 + ry * s
      const dist = Math.hypot(p.x - sx, p.y - sy)
      if (dist < bestD && dist < (n.type === 'document' ? 18 : 10) * s) { bestD = dist; best = n.id }
    }
    hoveredRef.current = best
    if (canvasRef.current) canvasRef.current.style.cursor = best ? 'pointer' : dragRef.current ? 'grabbing' : 'grab'
  }

  const handleUp = (e: React.MouseEvent) => {
    if (dragRef.current) {
      const d = dragRef.current; const p = toCanvas(e)
      if (Math.abs(p.x - d.sx) < 3 && Math.abs(p.y - d.sy) < 3) {
        selectNode(hoveredRef.current ? nodes.find((n) => n.id === hoveredRef.current) || null : null)
      }
      dragRef.current = null
    }
  }

  const handleWheel = (e: React.WheelEvent) => {
    cameraRef.current.dist = Math.max(150, Math.min(1500, cameraRef.current.dist + e.deltaY * 0.5))
  }

  const handleOpenDoc = async () => {
    if (!selectedNode) return
    if (selectedNode.type === 'document') await selectFile(selectedNode.path)
    else await selectNote(selectedNode.path)
    await loadMessages(selectedNode.path)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col animate-fade-in" style={{ background: 'var(--bg-primary)' }}>
      {/* Top bar */}
      <div className="glass flex items-center justify-between px-5 py-2.5 flex-shrink-0" style={{ borderBottom: '1px solid var(--border-color)' }}>
        <div className="flex items-center gap-3">
          <h1 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>星图</h1>
          <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{nodes.length} 个节点</span>
        </div>
        <button onClick={onClose} className="w-6 h-6 rounded-full flex items-center justify-center" style={{ color: 'var(--text-tertiary)' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
        </button>
      </div>

      <div className="flex-1 flex min-h-0">
        <div className="flex-1 min-w-0 relative">
          <canvas ref={canvasRef} className="absolute inset-0" style={{ touchAction: 'none' }}
            onMouseDown={handleDown} onMouseMove={handleMove} onMouseUp={handleUp} onMouseLeave={handleUp} onWheel={handleWheel} />
        </div>

        {/* Info panel */}
        <div className="w-[340px] flex-shrink-0 flex flex-col" style={{ background: 'var(--bg-secondary)', borderLeft: '1px solid var(--border-color)' }}>
          {selectedNode ? (
            <>
              <div className="px-4 py-4" style={{ borderBottom: '1px solid var(--border-color)' }}>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                  style={{ background: selectedNode.type === 'document' ? 'var(--accent-light)' : 'rgba(96,165,250,0.15)', color: selectedNode.type === 'document' ? 'var(--accent)' : '#60a5fa' }}>
                  {selectedNode.type === 'document' ? '文档' : '笔记'}
                </span>
                <h3 className="text-sm font-semibold mt-2 mb-1" style={{ color: 'var(--text-primary)' }}>{selectedNode.name}</h3>
                <p className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>{selectedNode.path}</p>
              </div>
              <div className="flex-1 overflow-y-auto px-4 py-3">
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                  {selectedNode.type === 'document' ? '文档节点，点击下方按钮在阅读器中打开' : '笔记节点，点击下方按钮查看内容'}
                </p>
              </div>
              <div className="px-4 py-3" style={{ borderTop: '1px solid var(--border-color)' }}>
                <button onClick={handleOpenDoc}
                  className="w-full py-2 rounded-lg text-xs font-medium smooth-transition"
                  style={{ background: 'var(--accent)', color: '#fff' }}>
                  打开{selectedNode.type === 'document' ? '文档' : '笔记'}
                </button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center p-6">
              <div className="text-center">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.8" className="mx-auto mb-3 opacity-30">
                  <circle cx="12" cy="12" r="3" /><circle cx="4" cy="4" r="1.5" /><circle cx="20" cy="6" r="1" />
                  <line x1="12" y1="9" x2="20" y2="6" /><line x1="12" y1="9" x2="4" y2="4" />
                </svg>
                <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>知识星图</p>
                <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>点击节点查看详情<br />拖拽旋转 · 滚轮缩放</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
