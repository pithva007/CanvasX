import { useState, useEffect, useRef } from 'react'
import { useSocket } from '@/context/SocketContext'
import { useWhiteboard } from '@/context/WhiteboardContext'
import { useRoomUsers } from '@/hooks/useSocketEvents'
import { useSyncStore } from '@/hooks/useSyncStore'
import { useToast } from '@/hooks/useToast'
import { Tldraw } from 'tldraw'
import 'tldraw/tldraw.css'
import { Toast } from '@/components/Toast'
import { LaserAndPingOverlay } from '@/components/LaserAndPingOverlay'
import {
  LogOut,
  Copy,
  Check,
  Users,
  Share2,
  Clock,
  Zap,
  Radio,
} from 'lucide-react'

export function WhiteboardPage({ onLeaveRoom }) {
  const { socket } = useSocket()
  const {
    roomId,
    roomCode,
    userId,
    userName,
    users,
    seeding,
    singleUserDiscardAt,
    resetRoom,
  } = useWhiteboard()
  const { toasts, addToast } = useToast()

  const [editor, setEditor] = useState(null)
  const [isLaserActive, setIsLaserActive] = useState(false)
  const overlayRef = useRef(null)

  const [copiedCode, setCopiedCode] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)
  const [secondsRemaining, setSecondsRemaining] = useState(null)

  // Listen to room events: roster updates, timer updates, discard event
  useRoomUsers({
    onDiscard: (message) => {
      addToast(message || 'Room was discarded', 'error')
      resetRoom()
      onLeaveRoom?.()
    },
    onUserJoined: (user) => {
      addToast(`🎉 ${user.name} joined! Timer cancelled — you can now draw together.`, 'success')
    },
  })

  const storeWithStatus = useSyncStore({
    socket,
    roomId,
    userId,
    userName,
    roomCode,
    seeding,
  })

  // Live countdown timer for 5-minute single-user discard
  useEffect(() => {
    if (!singleUserDiscardAt) {
      setSecondsRemaining(null)
      return
    }

    const updateTimer = () => {
      const now = Date.now()
      const diff = Math.max(0, Math.floor((singleUserDiscardAt - now) / 1000))
      setSecondsRemaining(diff)
    }

    updateTimer()
    const interval = setInterval(updateTimer, 1000)
    return () => clearInterval(interval)
  }, [singleUserDiscardAt])

  const formatCountdown = (totalSeconds) => {
    if (totalSeconds == null) return ''
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
  }

  const handleLeave = () => {
    if (socket) socket.emit('room:leave')
    resetRoom()
    onLeaveRoom?.()
  }

  const copyRoomCode = async () => {
    try {
      await navigator.clipboard.writeText(roomCode || '')
      setCopiedCode(true)
      addToast(`Room code ${roomCode} copied!`, 'success')
      setTimeout(() => setCopiedCode(false), 1500)
    } catch {
      addToast('Could not copy room code', 'error')
    }
  }

  const copyInviteLink = async () => {
    try {
      const origin = window.location.origin
      const path = window.location.pathname
      const inviteUrl = `${origin}${path}?room=${encodeURIComponent(roomCode || '')}`
      await navigator.clipboard.writeText(inviteUrl)
      setCopiedLink(true)
      addToast('Invite link copied to clipboard! Share it with collaborators.', 'success')
      setTimeout(() => setCopiedLink(false), 1500)
    } catch {
      addToast('Could not copy invite link', 'error')
    }
  }

  const toggleLaser = (explicitState) => {
    setIsLaserActive((prev) => {
      const next = typeof explicitState === 'boolean' ? explicitState : !prev
      if (next) {
        addToast('Laser Pointer ON — Drag to point (Hotkey: L or Esc to exit)', 'info')
      }
      return next
    })
  }

  const triggerCenterPing = () => {
    if (!editor || !overlayRef.current) return
    const screenCenter = { x: window.innerWidth / 2, y: window.innerHeight / 2 }
    const pageCenter = editor.screenToPage(screenCenter)
    overlayRef.current.triggerPing(pageCenter)
    addToast('Radar Ping sent! (Tip: Hold Alt + Click anywhere to ping)', 'info')
  }

  const isSolo = users.length <= 1 || (singleUserDiscardAt && secondsRemaining !== null)

  return (
    <div className="fixed inset-0 overflow-hidden bg-white">
      {/* tldraw full drawing UI */}
      <Tldraw
        store={storeWithStatus}
        onMount={(mountedEditor) => {
          setEditor(mountedEditor)
          if (typeof window !== 'undefined') window.editor = mountedEditor
        }}
      />

      {/* Laser & Radar Ping Interactive Overlay */}
      <LaserAndPingOverlay
        ref={overlayRef}
        editor={editor}
        socket={socket}
        userId={userId}
        userName={userName}
        isLaserActive={isLaserActive}
        onToggleLaser={toggleLaser}
      />

      {/* 5-Minute Single-User Discard Notice Banner */}
      {isSolo && secondsRemaining !== null && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[500] pointer-events-auto">
          <div className="flex items-center gap-2 sm:gap-3 px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-2xl bg-amber-500/95 text-slate-950 shadow-2xl backdrop-blur-md border border-amber-300 transition-all animate-bounce-subtle">
            <Clock className="w-4 h-4 text-amber-950 animate-pulse shrink-0" />
            <div className="text-xs sm:text-sm font-semibold flex items-center gap-1.5 flex-wrap">
              <span>Solo in room:</span>
              <span className="text-slate-900 font-normal">Closes in</span>
              <span className="font-mono font-bold text-amber-950 bg-amber-400/80 px-2 py-0.5 rounded-lg">
                {formatCountdown(secondsRemaining)}
              </span>
              <span className="text-slate-900 font-normal hidden sm:inline">unless someone joins</span>
            </div>
            <button
              onClick={copyInviteLink}
              title="Copy shareable invite link"
              className="ml-1 sm:ml-2 px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm active:scale-95 shrink-0"
            >
              <Share2 className="w-3 h-3 text-slate-200" />
              <span>Invite</span>
            </button>
          </div>
        </div>
      )}

      {/* Floating Header Bar (Top-Right) */}
      <div className="absolute top-3 right-3 z-[500] flex items-center gap-2 pointer-events-auto flex-wrap justify-end">
        {/* Laser Pointer Toggle Button */}
        <button
          onClick={() => toggleLaser()}
          title="Laser Pointer (Hotkey: L) — Draw lines that smoothly fade away after 1.5s"
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold shadow-lg backdrop-blur-md transition-all active:scale-95 ${
            isLaserActive
              ? 'bg-rose-600 text-white shadow-rose-600/30 ring-2 ring-rose-400 animate-pulse'
              : 'bg-slate-900/90 hover:bg-slate-900 text-slate-200'
          }`}
        >
          <Zap className={`w-3.5 h-3.5 ${isLaserActive ? 'text-white' : 'text-rose-400'}`} />
          <span>Laser</span>
          <span className="text-[10px] opacity-75 font-mono hidden sm:inline">(L)</span>
        </button>

        {/* Radar Ping Action Button */}
        <button
          onClick={triggerCenterPing}
          title="Radar Ping (Hold Alt + Click anywhere on canvas) — Sends expanding ripple with your name"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-900 text-slate-200 text-xs sm:text-sm font-medium shadow-lg backdrop-blur-md transition-all active:scale-95"
        >
          <Radio className="w-3.5 h-3.5 text-cyan-400" />
          <span className="hidden sm:inline">Ping</span>
          <span className="text-[10px] text-slate-400 font-mono hidden md:inline">Alt+Click</span>
        </button>

        {/* Room Code Button */}
        <button
          onClick={copyRoomCode}
          title="Click to copy room code"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-900 text-white text-xs sm:text-sm font-medium shadow-lg backdrop-blur-md transition-all active:scale-95"
        >
          <span className="text-slate-400 hidden sm:inline text-xs font-semibold">Room:</span>
          <span className="font-mono font-bold tracking-wide text-blue-300">{roomCode}</span>
          {copiedCode ? (
            <Check className="w-3.5 h-3.5 text-emerald-400" />
          ) : (
            <Copy className="w-3.5 h-3.5 text-slate-300" />
          )}
        </button>

        {/* Share Link Button */}
        <button
          onClick={copyInviteLink}
          title="Share invite link"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold shadow-lg backdrop-blur-md transition-all active:scale-95"
        >
          {copiedLink ? (
            <Check className="w-3.5 h-3.5 text-white" />
          ) : (
            <Share2 className="w-3.5 h-3.5 text-white" />
          )}
          <span className="hidden sm:inline">Share</span>
        </button>

        {/* Collaborators counter */}
        <div
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-900/90 text-white text-xs sm:text-sm font-medium shadow-lg backdrop-blur-md"
          title={users.map((u) => u.name).join(', ') || 'Only you'}
        >
          <Users className="w-3.5 h-3.5 text-slate-300" />
          <span className="font-bold">{Math.max(users.length, 1)}</span>
        </div>

        {/* Leave Room Button */}
        <button
          onClick={handleLeave}
          title="Leave room"
          className="flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 rounded-xl bg-red-600/90 hover:bg-red-600 text-white text-xs sm:text-sm font-semibold shadow-lg backdrop-blur-md transition-all active:scale-95"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Leave</span>
        </button>
      </div>

      {/* Toasts */}
      <div className="fixed bottom-4 right-4 z-[600] space-y-2 pointer-events-none">
        {toasts.map((toast) => (
          <Toast key={toast.id} message={toast.message} type={toast.type} />
        ))}
      </div>
    </div>
  )
}
