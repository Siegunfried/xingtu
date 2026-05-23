import React, { useRef, useEffect, useState } from 'react'
import { useWorkspaceStore } from '@/stores/workspaceStore'
import { useChatStore } from '@/stores/chatStore'
import { useStarMapStore } from '@/stores/starMapStore'

interface Props { onClose: () => void }

// Pre-generate background stars for performance
const bgStars: { x: number; y: number; r: number; a: number; s: number }[] = []
for (let i = 0; i < 300; i++) {
  bgStars.push({
    x: Math.random(), y: Math.random(),
    r: Math.random() * 1.5 + 0.2,
    a: Math.random() * 0.6 + 0.2,
    s: Math.random() * 0.02 + 0.005,
  })
}

export default function StarMapPanel({ onClose }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef(0)
  const timeRef = useRef(0)
  const cameraRef = useRef({ theta: 0.5, phi: 0.5, dist: 500 })
  const dragRef = useRef<{ sx: number; sy: number; t: number; p: number } | null>(null)
  const hoveredRef = useRef<string | null>(null)
  const [showTip, setShowTip] = useState(true)

  const nodes = useStarMapStore((s) => s.nodes)
  const tick = useStarMapStore((s) => s.tick)
  const selectedNode = useStarMapStore((s) => s.selectedNode)
  const selectNode = useStarMapStore((s) => s.selectNode)
  const workspacePath = useWorkspaceStore((s) => s.workspacePath)
  const rootEntries = useWorkspaceStore((s) => s.rootEntries)
  const buildFromFiles = useStarMapStore((s) => s.buildFromFiles)
  const selectFile = useWorkspaceStore((s) => s.selectFile)
  const selectNote = useWorkspaceStore((s) => s.selectNote)
  const loadMessages = useChatStore((s) => s.loadMessages)

  useEffect(() => {
    if (workspacePath && rootEntries.length > 0) buildFromFiles(workspacePath, rootEntries)
  }, [workspacePath, rootEntries, buildFromFiles])

  useEffect(() => { setTimeout(() => setShowTip(false), 5000) }, [])

  // Animation loop
  useEffect(() => {
    let running = true
    const loop = (t: number) => {
      if (!running) return
      timeRef.current = t
      tick()
      animRef.current = requestAnimationFrame(loop)
    }
    animRef.current = requestAnimationFrame(loop)
    return () => { running = false; cancelAnimationFrame(animRef.current) }
  }, [tick])

  // Resize
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
    const w = canvas.width / devicePixelRatio
    const h = canvas.height / devicePixelRatio
    const cam = cameraRef.current
    const t = timeRef.current

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
      const ms = t * 0.001

      // === Deep space background ===
      const bgGrad = ctx.createRadialGradient(w * 0.3, h * 0.4, 0, w / 2, h / 2, w * 1.0)
      bgGrad.addColorStop(0, '#0a0e27')
      bgGrad.addColorStop(0.3, '#060b1a')
      bgGrad.addColorStop(0.6, '#020510')
      bgGrad.addColorStop(1, '#010208')
      ctx.fillStyle = bgGrad
      ctx.fillRect(0, 0, w, h)

      // Nebula clouds
      ctx.globalCompositeOperation = 'screen'
      for (let i = 0; i < 3; i++) {
        const nx = w * (0.2 + i * 0.3 + Math.sin(ms * 0.05 + i) * 0.1)
        const ny = h * (0.3 + i * 0.15)
        const ng = ctx.createRadialGradient(nx, ny, 0, nx, ny, w * 0.3)
        ng.addColorStop(0, `rgba(${30 + i * 20}, ${60 + i * 30}, ${180 - i * 20}, 0.06)`)
        ng.addColorStop(0.5, `rgba(${10 + i * 10}, ${20 + i * 10}, ${80 - i * 10}, 0.02)`)
        ng.addColorStop(1, 'transparent')
        ctx.fillStyle = ng
        ctx.fillRect(0, 0, w, h)
      }
      ctx.globalCompositeOperation = 'source-over'

      // === Starfield ===
      for (const s of bgStars) {
        const sx = s.x * w, sy = (s.y + Math.sin(ms * s.s + s.x * 10) * 0.008) * h
        const twinkle = 0.4 + Math.sin(ms * 2 + s.x * 20 + s.y * 15) * 0.3 + Math.cos(ms * 3.7 + s.y * 30) * 0.3
        const alpha = s.a * twinkle
        ctx.fillStyle = `rgba(180,200,255,${alpha})`
        ctx.beginPath()
        // Bright stars get cross spikes
        if (s.r > 1.0 && twinkle > 0.7) {
          const spike = s.r * 3
          ctx.moveTo(sx - spike, sy); ctx.lineTo(sx + spike, sy)
          ctx.moveTo(sx, sy - spike); ctx.lineTo(sx, sy + spike)
          ctx.strokeStyle = `rgba(180,200,255,${alpha * 0.3})`
          ctx.lineWidth = 0.3
          ctx.stroke()
        }
        ctx.arc(sx, sy, s.r, 0, Math.PI * 2)
        ctx.fill()
      }

      // === Scan lines ===
      ctx.fillStyle = 'rgba(255,255,255,0.008)'
      for (let y = 0; y < h; y += 3) ctx.fillRect(0, y, w, 1)

      if (nodes.length === 0) {
        ctx.fillStyle = 'rgba(100,140,200,0.5)'
        ctx.font = '14px -apple-system, sans-serif'; ctx.textAlign = 'center'
        ctx.fillText('导入文档后生成星图', w / 2, h / 2)
        return
      }

      const projected = nodes.map((n) => ({ n, ...project(n.x, n.y, 0) })).sort((a, b) => b.d - a.d)

      // === Constellation edges ===
      for (const node of nodes) {
        if (!node.parentPath) continue
        const parent = nodes.find((n) => n.path === node.parentPath)
        if (!parent) continue
        const sp = project(parent.x, parent.y, 0)
        const tp = project(node.x, node.y, 0)
        const midAlpha = (sp.s + tp.s) / 2 * 0.6
        const dashLen = 6 * Math.min(sp.s, tp.s)
        ctx.setLineDash([dashLen, dashLen * 0.6])
        ctx.strokeStyle = `rgba(80,140,230,${Math.max(0.08, midAlpha)})`
        ctx.lineWidth = 0.6 * Math.min(sp.s, tp.s)
        ctx.beginPath(); ctx.moveTo(sp.sx, sp.sy); ctx.lineTo(tp.sx, tp.sy); ctx.stroke()
        ctx.setLineDash([])
      }

      // === Nodes ===
      for (const { n, sx, sy, s } of projected) {
        const isDoc = n.type === 'document'
        const isSel = selectedNode?.id === n.id
        const isHover = hoveredRef.current === n.id
        const r = (isDoc ? 12 : 5) * s

        // Selection pulse ring
        if (isSel) {
          const pulsePhase = Math.sin(ms * 4) * 0.3 + 0.7
          const ringR = r * (2.5 + Math.sin(ms * 3) * 0.5)
          ctx.strokeStyle = `rgba(100,160,255,${0.4 * pulsePhase})`
          ctx.lineWidth = 1.2 * s
          ctx.beginPath(); ctx.arc(sx, sy, ringR, 0, Math.PI * 2); ctx.stroke()

          // Outer glow
          const glow = ctx.createRadialGradient(sx, sy, r * 0.5, sx, sy, r * 3.5)
          glow.addColorStop(0, 'rgba(80,140,240,0.2)')
          glow.addColorStop(0.5, 'rgba(40,80,180,0.08)')
          glow.addColorStop(1, 'transparent')
          ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(sx, sy, r * 3.5, 0, Math.PI * 2); ctx.fill()
        }

        // Hover glow
        if (isHover && !isSel) {
          const hGlow = ctx.createRadialGradient(sx, sy, r * 0.3, sx, sy, r * 2)
          hGlow.addColorStop(0, 'rgba(100,160,240,0.15)')
          hGlow.addColorStop(1, 'transparent')
          ctx.fillStyle = hGlow; ctx.beginPath(); ctx.arc(sx, sy, r * 2, 0, Math.PI * 2); ctx.fill()
        }

        // Core gradient (star-like)
        const coreGrad = ctx.createRadialGradient(sx - r * 0.2, sy - r * 0.2, 0, sx, sy, r)
        if (isDoc) {
          coreGrad.addColorStop(0, '#ffffff')
          coreGrad.addColorStop(0.15, '#c8dfff')
          coreGrad.addColorStop(0.5, '#4a8ae0')
          coreGrad.addColorStop(1, '#1a3a6a')
        } else {
          coreGrad.addColorStop(0, '#e8f0ff')
          coreGrad.addColorStop(0.3, '#8ab4e8')
          coreGrad.addColorStop(1, '#2a4a6a')
        }
        ctx.fillStyle = coreGrad
        ctx.beginPath(); ctx.arc(sx, sy, r, 0, Math.PI * 2); ctx.fill()

        // Star cross spikes for document nodes
        if (isDoc) {
          const spikeLen = r * 2.2
          const spikeAlpha = 0.25 + Math.sin(ms * 2 + sx * 0.01) * 0.1
          ctx.strokeStyle = `rgba(150,200,255,${spikeAlpha})`
          ctx.lineWidth = 0.4 * s
          const angles = [0, Math.PI / 4, Math.PI / 2, Math.PI * 3 / 4]
          for (const a of angles) {
            ctx.beginPath()
            ctx.moveTo(sx - Math.cos(a) * spikeLen, sy - Math.sin(a) * spikeLen)
            ctx.lineTo(sx + Math.cos(a) * spikeLen, sy + Math.sin(a) * spikeLen)
            ctx.stroke()
          }
        }

        // Label
        if (isDoc || isHover || isSel) {
          const fs = Math.max(9, (isDoc ? 11 : 9) * Math.min(s, 1.5))
          const lblY = sy + r + 11 * s
          // Label background
          const lbl = n.name.length > 14 ? n.name.slice(0, 14) + '...' : n.name
          const tw = ctx.measureText(lbl).width
          if (isDoc) {
            ctx.fillStyle = 'rgba(0,10,30,0.5)'
            const pad = 4 * s
            ctx.beginPath()
            ctx.roundRect(sx - tw / 2 - pad, lblY - fs / 2 - pad * 0.5, tw + pad * 2, fs + pad, 3 * s)
            ctx.fill()
          }
          ctx.fillStyle = isDoc ? '#c8dfff' : '#8ab4e0'
          ctx.font = `${fs}px -apple-system, sans-serif`; ctx.textAlign = 'center'
          ctx.fillText(lbl, sx, lblY + fs * 0.35)
        }
      }

      // Tip
      if (showTip) {
        ctx.fillStyle = 'rgba(150,180,220,0.3)'
        ctx.font = '11px -apple-system, sans-serif'; ctx.textAlign = 'center'
        ctx.fillText('拖拽旋转 · 滚轮缩放 · 点击选择', w / 2, h - 20)
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
    let best: string | null = null; let bestD = 30
    for (const n of nodes) {
      const cam = cameraRef.current
      const cosT = Math.cos(cam.theta), sinT = Math.sin(cam.theta)
      const cosP = Math.cos(cam.phi), sinP = Math.sin(cam.phi)
      const rx = n.x * cosT; const rz = n.x * sinT
      const ry = n.y * cosP - rz * sinP; const rz2 = n.y * sinP + rz * cosP
      const s = cam.dist / (cam.dist + rz2 + 400)
      const cw = canvasRef.current!.width / devicePixelRatio
      const ch = canvasRef.current!.height / devicePixelRatio
      const sx = cw / 2 + rx * s; const sy = ch / 2 + ry * s
      const dist = Math.hypot(p.x - sx, p.y - sy)
      if (dist < bestD && dist < (n.type === 'document' ? 20 : 12) * s) { bestD = dist; best = n.id }
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
    <div className="fixed inset-0 z-50 flex flex-col animate-fade-in" style={{ background: '#010510' }}>
      {/* Top bar - sci-fi style */}
      <div className="flex items-center justify-between px-5 py-2 flex-shrink-0"
        style={{ background: 'rgba(10,20,50,0.8)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(80,140,230,0.15)' }}>
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#4a8ae0', boxShadow: '0 0 8px #4a8ae0' }} />
          <h1 className="text-sm font-semibold tracking-wider" style={{ color: '#c8dfff' }}>KNOWLEDGE STARMAP</h1>
          <span className="text-[10px] font-mono" style={{ color: 'rgba(140,180,230,0.5)' }}>
            {nodes.length} NODES
          </span>
        </div>
        <button onClick={onClose}
          className="w-6 h-6 rounded flex items-center justify-center hover:bg-white/5 transition-colors"
          style={{ color: 'rgba(140,180,230,0.6)' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
        </button>
      </div>

      <div className="flex-1 flex min-h-0">
        <div className="flex-1 min-w-0 relative">
          <canvas ref={canvasRef} className="absolute inset-0" style={{ touchAction: 'none' }}
            onMouseDown={handleDown} onMouseMove={handleMove} onMouseUp={handleUp} onMouseLeave={handleUp} onWheel={handleWheel} />
        </div>

        {/* Right panel - sci-fi terminal style */}
        <div className="w-[320px] flex-shrink-0 flex flex-col"
          style={{ background: 'rgba(8,18,40,0.9)', backdropFilter: 'blur(16px)', borderLeft: '1px solid rgba(80,140,230,0.12)' }}>
          {selectedNode ? (
            <>
              <div className="px-4 py-4" style={{ borderBottom: '1px solid rgba(80,140,230,0.1)' }}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-1.5 h-1.5 rounded-full"
                    style={{ background: selectedNode.type === 'document' ? '#4a8ae0' : '#60a5fa', boxShadow: `0 0 6px ${selectedNode.type === 'document' ? '#4a8ae0' : '#60a5fa'}` }} />
                  <span className="text-[10px] font-mono tracking-wider uppercase"
                    style={{ color: 'rgba(140,180,230,0.5)' }}>
                    {selectedNode.type === 'document' ? 'Document' : 'Note'}
                  </span>
                </div>
                <h3 className="text-sm font-semibold mb-1" style={{ color: '#d0e0ff' }}>{selectedNode.name}</h3>
                <p className="text-[10px] font-mono truncate" style={{ color: 'rgba(120,160,220,0.4)' }}>
                  {selectedNode.path.split(/[/\\]/).slice(-2).join('/')}
                </p>
              </div>
              <div className="flex-1 overflow-y-auto px-4 py-3">
                <div className="font-mono text-[11px] leading-relaxed" style={{ color: 'rgba(120,160,220,0.5)' }}>
                  <p>TYPE: {selectedNode.type.toUpperCase()}</p>
                  <p className="mt-1">STATUS: ACTIVE</p>
                  <p className="mt-1">CONNECTIONS: {
                    nodes.filter((n) => n.parentPath === selectedNode.path).length
                  }</p>
                </div>
              </div>
              <div className="px-4 py-3" style={{ borderTop: '1px solid rgba(80,140,230,0.1)' }}>
                <button onClick={handleOpenDoc}
                  className="w-full py-2 rounded text-xs font-medium transition-all hover:brightness-110 tracking-wider"
                  style={{ background: 'rgba(60,120,220,0.2)', color: '#a0d0ff', border: '1px solid rgba(80,140,230,0.3)' }}>
                  OPEN {selectedNode.type === 'document' ? 'DOCUMENT' : 'NOTE'}
                </button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center p-6">
              <div className="text-center">
                <div className="relative inline-block mb-4">
                  <div className="w-12 h-12 rounded-full" style={{ background: 'radial-gradient(circle, rgba(80,140,230,0.2), transparent)' }} />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(140,180,230,0.4)" strokeWidth="1">
                      <circle cx="12" cy="12" r="3" /><circle cx="4" cy="4" r="1" /><circle cx="20" cy="6" r="1.2" />
                      <line x1="12" y1="9" x2="20" y2="6" /><line x1="12" y1="9" x2="4" y2="4" />
                    </svg>
                  </div>
                </div>
                <p className="text-sm font-medium mb-1 tracking-wider" style={{ color: 'rgba(180,200,230,0.6)' }}>STARMAP</p>
                <p className="text-[10px] font-mono" style={{ color: 'rgba(120,160,220,0.3)' }}>
                  SELECT NODE TO VIEW
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
