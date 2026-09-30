import { useEffect, useRef, useCallback, useImperativeHandle, forwardRef } from 'react'

const LASER_FADE_DURATION = 1500 // 1.5 seconds fade
const PING_DURATION = 2500 // 2.5 seconds sonar ripple

const PRESENCE_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA94D',
  '#9775FA', '#38D9A9', '#F783AC', '#748FFC',
]

function colorForId(id = '') {
  let hash = 0
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) | 0
  return PRESENCE_COLORS[Math.abs(hash) % PRESENCE_COLORS.length]
}

// Gentle audio sonar ping synthesized with Web Audio API (offline, zero-latency)
function playSonarBeep() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext
    if (!AudioCtx) return
    const ctx = new AudioCtx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = 'sine'
    osc.frequency.setValueAtTime(880, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.12)

    gain.gain.setValueAtTime(0.06, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35)

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.start()
    osc.stop(ctx.currentTime + 0.35)
  } catch (_) {
    // AudioContext can be blocked by browser autoplay policy before first gesture
  }
}

/**
 * LaserAndPingOverlay
 *
 * Renders:
 *  1. Laser Pointer: Glowing lines drawn by collaborators that smoothly fade in 1.5s.
 *  2. Radar Ping: Concentric expanding ripples triggered by Alt + Click.
 */
export const LaserAndPingOverlay = forwardRef(function LaserAndPingOverlay(
  {
    editor,
    socket,
    userId,
    userName,
    isLaserActive,
    onToggleLaser,
  },
  ref
) {
  const canvasRef = useRef(null)

  // In-memory collections of active laser strokes and radar pings
  const strokesRef = useRef(new Map())
  const pingsRef = useRef([])

  // Local drawing state
  const isMouseDownRef = useRef(false)
  const currentStrokeIdRef = useRef(null)
  const pendingEmitPointsRef = useRef([])
  const emitIntervalRef = useRef(null)

  const myColor = colorForId(userId || '')

  // Create a radar ping at given page coordinates
  const triggerPingAtPagePoint = useCallback(
    (pagePoint) => {
      if (!editor) return

      const ping = {
        id: `ping_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        x: pagePoint.x,
        y: pagePoint.y,
        userName: userName || `User-${(userId || '').substring(0, 5)}`,
        color: myColor,
        createdAt: Date.now(),
      }

      pingsRef.current.push(ping)
      playSonarBeep()

      if (socket) {
        socket.emit('ping:create', ping)
      }
    },
    [editor, socket, userId, userName, myColor]
  )

  // Expose triggerPing to parent via ref
  useImperativeHandle(
    ref,
    () => ({
      triggerPing: triggerPingAtPagePoint,
    }),
    [triggerPingAtPagePoint]
  )

  // Listen for socket events from peers
  useEffect(() => {
    if (!socket) return

    const onRemoteLaserPoints = (data) => {
      if (!data || !data.strokeId || !data.points) return
      const { strokeId, color, points } = data

      let stroke = strokesRef.current.get(strokeId)
      if (!stroke) {
        stroke = { color: color || '#FF3366', points: [] }
        strokesRef.current.set(strokeId, stroke)
      }

      for (const pt of points) {
        stroke.points.push({ x: pt.x, y: pt.y, time: pt.time || Date.now() })
      }
    }

    const onRemotePing = (data) => {
      if (!data || data.x == null || data.y == null) return
      pingsRef.current.push({
        id: data.id || `ping_${Date.now()}`,
        x: data.x,
        y: data.y,
        userName: data.userName || 'Collaborator',
        color: data.color || '#4ECDC4',
        createdAt: data.createdAt || Date.now(),
      })
      playSonarBeep()
    }

    socket.on('laser:points', onRemoteLaserPoints)
    socket.on('ping:create', onRemotePing)

    return () => {
      socket.off('laser:points', onRemoteLaserPoints)
      socket.off('ping:create', onRemotePing)
    }
  }, [socket])

  // Periodic socket emitter for smooth batched laser points (every ~30ms)
  useEffect(() => {
    emitIntervalRef.current = setInterval(() => {
      if (!socket || !currentStrokeIdRef.current) return
      if (pendingEmitPointsRef.current.length === 0) return

      const pointsToSend = [...pendingEmitPointsRef.current]
      pendingEmitPointsRef.current.length = 0

      socket.emit('laser:points', {
        strokeId: currentStrokeIdRef.current,
        color: myColor,
        points: pointsToSend,
      })
    }, 30)

    return () => {
      if (emitIntervalRef.current) clearInterval(emitIntervalRef.current)
    }
  }, [socket, myColor])

  // Global Alt + Click capture listener for Radar Ping (works at ANY time)
  useEffect(() => {
    const handleCapturePointerDown = (e) => {
      // Check for Alt key (Option on Mac) and left mouse button
      if (e.altKey && e.button === 0 && editor) {
        e.preventDefault()
        e.stopPropagation()

        const pagePoint = editor.screenToPage({ x: e.clientX, y: e.clientY })
        triggerPingAtPagePoint(pagePoint)
      }
    }

    window.addEventListener('pointerdown', handleCapturePointerDown, { capture: true })
    return () => {
      window.removeEventListener('pointerdown', handleCapturePointerDown, { capture: true })
    }
  }, [editor, triggerPingAtPagePoint])

  // Global keyboard shortcut: 'L' toggles laser mode, 'Escape' exits laser
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target.isContentEditable
      ) {
        return
      }

      if ((e.key === 'l' || e.key === 'L') && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault()
        onToggleLaser?.()
      } else if (e.key === 'Escape' && isLaserActive) {
        onToggleLaser?.(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isLaserActive, onToggleLaser])

  // Resize canvas to window
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const handleResize = () => {
      const dpr = window.devicePixelRatio || 1
      canvas.width = window.innerWidth * dpr
      canvas.height = window.innerHeight * dpr
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Local Laser Drawing handlers (on overlay canvas when isLaserActive === true)
  const handlePointerDown = (e) => {
    if (!isLaserActive || !editor) return
    if (e.button !== 0) return // Left click only

    isMouseDownRef.current = true
    const strokeId = `stroke_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`
    currentStrokeIdRef.current = strokeId

    const pagePoint = editor.screenToPage({ x: e.clientX, y: e.clientY })
    const point = { x: pagePoint.x, y: pagePoint.y, time: Date.now() }

    strokesRef.current.set(strokeId, {
      color: myColor,
      points: [point],
    })

    pendingEmitPointsRef.current.push(point)
  }

  const handlePointerMove = (e) => {
    if (!isLaserActive || !isMouseDownRef.current || !editor) return

    const strokeId = currentStrokeIdRef.current
    const stroke = strokesRef.current.get(strokeId)
    if (!stroke) return

    const pagePoint = editor.screenToPage({ x: e.clientX, y: e.clientY })
    const point = { x: pagePoint.x, y: pagePoint.y, time: Date.now() }

    const lastPoint = stroke.points[stroke.points.length - 1]
    if (lastPoint) {
      const dx = point.x - lastPoint.x
      const dy = point.y - lastPoint.y
      if (dx * dx + dy * dy < 4) return // min 2px distance
    }

    stroke.points.push(point)
    pendingEmitPointsRef.current.push(point)
  }

  const handlePointerUp = () => {
    isMouseDownRef.current = false
    currentStrokeIdRef.current = null
  }

  // Animation render loop
  useEffect(() => {
    let animId
    const canvas = canvasRef.current
    if (!canvas) return

    const render = () => {
      animId = requestAnimationFrame(render)
      const ctx = canvas.getContext('2d')
      if (!ctx || !editor) return

      const dpr = window.devicePixelRatio || 1
      const now = Date.now()

      ctx.save()
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight)

      // ─────────────────────────────────────────────────────────────
      // 1. RENDER LASER STROKES (1.5s Smooth Fade)
      // ─────────────────────────────────────────────────────────────
      strokesRef.current.forEach((stroke, strokeId) => {
        stroke.points = stroke.points.filter((pt) => now - pt.time < LASER_FADE_DURATION)
        if (stroke.points.length === 0) {
          strokesRef.current.delete(strokeId)
          return
        }

        const pts = stroke.points
        const zoom = (editor.camera && editor.camera.z) || 1

        for (let i = 0; i < pts.length - 1; i++) {
          const p1 = pts[i]
          const p2 = pts[i + 1]

          const s1 = editor.pageToScreen(p1)
          const s2 = editor.pageToScreen(p2)

          const age = now - p2.time
          const alpha = Math.max(0, 1 - age / LASER_FADE_DURATION)
          if (alpha <= 0) continue

          const baseWidth = Math.max(2, 5 * zoom * alpha)

          // Outer Glow
          ctx.beginPath()
          ctx.moveTo(s1.x, s1.y)
          ctx.lineTo(s2.x, s2.y)
          ctx.strokeStyle = stroke.color
          ctx.lineWidth = baseWidth + 4 * alpha
          ctx.lineCap = 'round'
          ctx.lineJoin = 'round'
          ctx.shadowBlur = 12 * alpha
          ctx.shadowColor = stroke.color
          ctx.globalAlpha = alpha * 0.75
          ctx.stroke()

          // Inner Bright Core
          ctx.beginPath()
          ctx.moveTo(s1.x, s1.y)
          ctx.lineTo(s2.x, s2.y)
          ctx.strokeStyle = '#ffffff'
          ctx.lineWidth = Math.max(1.5, 2 * zoom * alpha)
          ctx.lineCap = 'round'
          ctx.lineJoin = 'round'
          ctx.shadowBlur = 4 * alpha
          ctx.shadowColor = '#ffffff'
          ctx.globalAlpha = alpha
          ctx.stroke()
        }

        // Draw glowing laser head dot on the newest point if active
        const newest = pts[pts.length - 1]
        if (newest && now - newest.time < 350) {
          const head = editor.pageToScreen(newest)
          ctx.beginPath()
          ctx.arc(head.x, head.y, Math.max(3, 4.5 * zoom), 0, Math.PI * 2)
          ctx.fillStyle = '#ffffff'
          ctx.shadowBlur = 14
          ctx.shadowColor = stroke.color
          ctx.globalAlpha = 0.95
          ctx.fill()
        }
      })

      // ─────────────────────────────────────────────────────────────
      // 2. RENDER RADAR PINGS (2.5s Concentric Ripples + User Badge)
      // ─────────────────────────────────────────────────────────────
      pingsRef.current = pingsRef.current.filter((ping) => now - ping.createdAt < PING_DURATION)

      pingsRef.current.forEach((ping) => {
        const elapsed = now - ping.createdAt
        const progress = Math.min(1, elapsed / PING_DURATION)
        const alpha = Math.max(0, 1 - progress)

        const center = editor.pageToScreen({ x: ping.x, y: ping.y })
        const zoom = Math.min(Math.max((editor.camera && editor.camera.z) || 1, 0.5), 2.5)

        // 3 concentric expanding rings
        const numRings = 3
        for (let r = 0; r < numRings; r++) {
          const ringOffset = r * 0.22
          const ringProgress = (progress + ringOffset) % 1
          const ringRadius = ringProgress * 70 * zoom
          const ringAlpha = Math.max(0, (1 - ringProgress) * alpha * 0.85)

          ctx.beginPath()
          ctx.arc(center.x, center.y, ringRadius, 0, Math.PI * 2)
          ctx.strokeStyle = ping.color
          ctx.lineWidth = Math.max(1.5, 2.5 * (1 - ringProgress))
          ctx.globalAlpha = ringAlpha
          ctx.shadowBlur = 8 * ringAlpha
          ctx.shadowColor = ping.color
          ctx.stroke()
        }

        // Central target pulse dot
        ctx.beginPath()
        ctx.arc(center.x, center.y, 4 * zoom, 0, Math.PI * 2)
        ctx.fillStyle = ping.color
        ctx.shadowBlur = 12
        ctx.shadowColor = ping.color
        ctx.globalAlpha = alpha
        ctx.fill()

        // White bullseye center
        ctx.beginPath()
        ctx.arc(center.x, center.y, 2 * zoom, 0, Math.PI * 2)
        ctx.fillStyle = '#ffffff'
        ctx.globalAlpha = alpha
        ctx.fill()

        // Floating Pill Badge with User Name
        const badgeY = center.y - 18 - 8 * (1 - alpha)
        const badgeText = `📍 ${ping.userName}`

        ctx.font = 'bold 11px system-ui, -apple-system, sans-serif'
        const textMetrics = ctx.measureText(badgeText)
        const badgeWidth = textMetrics.width + 16
        const badgeHeight = 22
        const badgeX = center.x - badgeWidth / 2

        // Badge background
        ctx.beginPath()
        ctx.roundRect(badgeX, badgeY - badgeHeight, badgeWidth, badgeHeight, 11)
        ctx.fillStyle = 'rgba(15, 23, 42, 0.88)' // Slate-900
        ctx.strokeStyle = ping.color
        ctx.lineWidth = 1.5
        ctx.shadowBlur = 10
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)'
        ctx.globalAlpha = alpha * 0.95
        ctx.fill()
        ctx.stroke()

        // Badge text
        ctx.fillStyle = '#ffffff'
        ctx.shadowBlur = 0
        ctx.globalAlpha = alpha
        ctx.fillText(badgeText, badgeX + 8, badgeY - 7)
      })

      ctx.restore()
    }

    animId = requestAnimationFrame(render)
    return () => cancelAnimationFrame(animId)
  }, [editor])

  return (
    <canvas
      ref={canvasRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      style={{
        position: 'fixed',
        inset: 0,
        width: '100%',
        height: '100%',
        zIndex: 450,
        pointerEvents: isLaserActive ? 'auto' : 'none',
        cursor: isLaserActive
          ? `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'%3E%3Ccircle cx='12' cy='12' r='4' fill='%23FF3366' stroke='white' stroke-width='2'/%3E%3Ccircle cx='12' cy='12' r='10' fill='none' stroke='%23FF3366' stroke-width='1.5' stroke-dasharray='2 2' opacity='0.7'/%3E%3C/svg%3E") 12 12, crosshair`
          : 'default',
      }}
    />
  )
})
