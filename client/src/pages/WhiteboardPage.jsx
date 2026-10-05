import { useState, useEffect, useRef } from 'react'
import { useSocket } from '@/context/SocketContext'
import { useWhiteboard } from '@/context/WhiteboardContext'
import { useRoomUsers } from '@/hooks/useSocketEvents'
import { useSyncStore } from '@/hooks/useSyncStore'
import { useToast } from '@/hooks/useToast'
import {
  Tldraw,
  DefaultToolbar,
  DefaultToolbarContent,
  ToolbarItem,
} from 'tldraw'
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
  Crown,
  ShieldAlert,
  AlertTriangle,
  Trash2,
  X,
  UserX,
} from 'lucide-react'

// Enhanced toolbar ensuring all 20 geometric shapes are available in toolbar and overflow menu
function CustomToolbar(props) {
  return (
    <DefaultToolbar {...props}>
      <DefaultToolbarContent />
      <ToolbarItem tool="trapezoid" />
      <ToolbarItem tool="pentagon" />
      <ToolbarItem tool="octagon" />
      <ToolbarItem tool="rhombus-2" />
    </DefaultToolbar>
  )
}

const customComponents = {
  Toolbar: CustomToolbar,
}

export function WhiteboardPage({ onLeaveRoom }) {
  const { socket } = useSocket()
  const {
    roomId,
    roomCode,
    userId,
    userName,
    users,
    adminId,
    isAdmin,
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

  const [isUsersListOpen, setIsUsersListOpen] = useState(false)
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false)
  const [isDiscarding, setIsDiscarding] = useState(false)
  const [userToKick, setUserToKick] = useState(null)
  const [isKicking, setIsKicking] = useState(false)
  const usersDropdownRef = useRef(null)

  // Listen to room events: roster updates, timer updates, discard event, kicked event
  useRoomUsers({
    onDiscard: (message) => {
      if (typeof window !== 'undefined') {
        try {
          sessionStorage.removeItem('canvasx_in_room')
        } catch (_) {}
      }
      addToast(message || 'Room was discarded', 'info')
      resetRoom()
      onLeaveRoom?.()
    },
    onKicked: (message) => {
      if (typeof window !== 'undefined') {
        try {
          sessionStorage.removeItem('canvasx_in_room')
          if (window.history.replaceState) {
            const url = new URL(window.location.href)
            url.searchParams.delete('room')
            window.history.replaceState({}, '', url.pathname)
          }
        } catch (_) {}
      }
      addToast(message || 'You have been removed from the room by the host.', 'error')
      resetRoom()
      onLeaveRoom?.()
    },
    onUserJoined: (user) => {
      addToast(`🎉 ${user.name} joined! Timer cancelled — you can now draw together.`, 'success')
    },
    onAdminChanged: (data) => {
      if (data?.adminId === userId) {
        addToast('You are now the room host with permission to manage or discard the room.', 'info')
      }
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

  // Keep browser address bar and session storage in sync with active room (?room=CODE)
  useEffect(() => {
    if (!roomCode) return
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.setItem('canvasx_in_room', roomCode)
        if (window.history.replaceState) {
          const url = new URL(window.location.href)
          if (url.searchParams.get('room') !== roomCode) {
            url.searchParams.set('room', roomCode)
            window.history.replaceState({}, '', url.toString())
          }
        }
      } catch (_) {}
    }
  }, [roomCode])

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

  // Close collaborators dropdown when clicking outside or pressing Escape
  useEffect(() => {
    if (!isUsersListOpen) return
    const handleClickOutside = (e) => {
      if (usersDropdownRef.current && !usersDropdownRef.current.contains(e.target)) {
        setIsUsersListOpen(false)
      }
    }
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsUsersListOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('touchstart', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isUsersListOpen])

  const formatCountdown = (totalSeconds) => {
    if (totalSeconds == null) return ''
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
  }

  const handleLeave = () => {
    if (socket) socket.emit('room:leave')
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.removeItem('canvasx_in_room')
      } catch (_) {}
    }
    resetRoom()
    onLeaveRoom?.()
  }

  const handleAdminDiscard = () => {
    if (!socket || isDiscarding) return
    setIsDiscarding(true)
    socket.emit('room:discard', (response) => {
      setIsDiscarding(false)
      setShowDiscardConfirm(false)
      if (response && !response.success) {
        addToast(response.message || 'Failed to discard room', 'error')
      }
      // On success, room:discarded event will be broadcast to all members (including host)
    })
  }

  const handleConfirmKick = (targetUser) => {
    if (!socket || isKicking || !targetUser) return
    setIsKicking(true)
    socket.emit('room:kick', { targetUserId: targetUser.id }, (response) => {
      setIsKicking(false)
      setUserToKick(null)
      if (response?.success) {
        addToast(`${response.kickedUserName || targetUser.name || 'User'} was removed from the room.`, 'info')
      } else {
        addToast(response?.message || 'Failed to remove user from room', 'error')
      }
    })
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

  // Combined user list fallback
  const displayUsers = users && users.length > 0
    ? users
    : [{ id: userId || 'you', name: userName || 'You', color: '#38D9A9', isAdmin }]

  // Put current user first, host next, then others sorted alphabetically
  const sortedUsers = [...displayUsers].sort((a, b) => {
    if (a.id === userId) return -1
    if (b.id === userId) return 1
    const aIsHost = a.id === adminId || Boolean(a.isAdmin)
    const bIsHost = b.id === adminId || Boolean(b.isAdmin)
    if (aIsHost && !bIsHost) return -1
    if (!aIsHost && bIsHost) return 1
    return (a.name || '').localeCompare(b.name || '')
  })

  const isSolo = displayUsers.length <= 1 || (singleUserDiscardAt && secondsRemaining !== null)

  return (
    <div className="fixed inset-0 overflow-hidden bg-white">
      {/* tldraw full drawing UI */}
      <Tldraw
        store={storeWithStatus}
        components={customComponents}
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
        <div className="absolute top-20 sm:top-16 left-1/2 -translate-x-1/2 z-[450] pointer-events-auto w-[calc(100vw-1.5rem)] max-w-sm sm:max-w-md lg:w-auto px-1 sm:px-0">
          <div className="flex items-center justify-between sm:justify-center gap-2 sm:gap-3 px-3 py-1.5 sm:px-4 sm:py-2 rounded-2xl bg-amber-500/95 text-slate-950 shadow-xl backdrop-blur-md border border-amber-300 transition-all animate-bounce-subtle">
            <Clock className="w-4 h-4 text-amber-950 animate-pulse shrink-0" />
            <div className="text-xs sm:text-sm font-semibold flex items-center gap-1 sm:gap-1.5 flex-wrap">
              <span>Solo:</span>
              <span className="text-slate-900 font-normal">Closes in</span>
              <span className="font-mono font-bold text-amber-950 bg-amber-400/80 px-1.5 sm:px-2 py-0.5 rounded-lg">
                {formatCountdown(secondsRemaining)}
              </span>
              <span className="text-slate-900 font-normal hidden md:inline">unless someone joins</span>
            </div>
            <button
              onClick={copyInviteLink}
              title="Copy shareable invite link"
              className="ml-auto sm:ml-2 px-2 sm:px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm active:scale-95 shrink-0"
            >
              <Share2 className="w-3 h-3 text-slate-200" />
              <span>Invite</span>
            </button>
          </div>
        </div>
      )}

      {/* Floating Header Bar (Top-Right) */}
      <div className="absolute top-2.5 sm:top-3 right-2 sm:right-3 z-[500] flex items-center gap-1 sm:gap-2 pointer-events-auto max-w-[calc(100vw-1.5rem)] flex-wrap justify-end">
        {/* Laser Pointer Toggle Button */}
        <button
          onClick={() => toggleLaser()}
          title="Laser Pointer (Hotkey: L) — Draw lines that smoothly fade away after 1.5s"
          aria-label="Toggle Laser Pointer"
          className={`flex items-center gap-1 sm:gap-1.5 px-2 py-1.5 sm:px-3 sm:py-1.5 rounded-xl text-xs sm:text-sm font-semibold shadow-lg backdrop-blur-md transition-all active:scale-95 shrink-0 ${
            isLaserActive
              ? 'bg-rose-600 text-white shadow-rose-600/30 ring-2 ring-rose-400 animate-pulse'
              : 'bg-slate-900/90 hover:bg-slate-900 text-slate-200'
          }`}
        >
          <Zap className={`w-3.5 h-3.5 ${isLaserActive ? 'text-white' : 'text-rose-400'}`} />
          <span className="hidden sm:inline">Laser</span>
          <span className="text-[10px] opacity-75 font-mono hidden md:inline">(L)</span>
        </button>

        {/* Radar Ping Action Button */}
        <button
          onClick={triggerCenterPing}
          title="Radar Ping (Hold Alt + Click anywhere on canvas) — Sends expanding ripple with your name"
          aria-label="Radar Ping canvas"
          className="flex items-center gap-1 sm:gap-1.5 px-2 py-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-900 text-slate-200 text-xs sm:text-sm font-medium shadow-lg backdrop-blur-md transition-all active:scale-95 shrink-0"
        >
          <Radio className="w-3.5 h-3.5 text-cyan-400" />
          <span className="hidden sm:inline">Ping</span>
          <span className="text-[10px] text-slate-400 font-mono hidden md:inline">Alt+Click</span>
        </button>

        {/* Room Code Button */}
        <button
          onClick={copyRoomCode}
          title="Click to copy room code"
          aria-label={`Copy room code ${roomCode}`}
          className="flex items-center gap-1 sm:gap-1.5 px-2 py-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-900 text-white text-xs sm:text-sm font-medium shadow-lg backdrop-blur-md transition-all active:scale-95 shrink-0"
        >
          <span className="text-slate-400 hidden sm:inline text-xs font-semibold">Room:</span>
          <span className="font-mono font-bold tracking-wide text-blue-300 text-xs sm:text-sm">{roomCode}</span>
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
          aria-label="Share invite link"
          className="flex items-center gap-1 sm:gap-1.5 px-2 py-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold shadow-lg backdrop-blur-md transition-all active:scale-95 shrink-0"
        >
          {copiedLink ? (
            <Check className="w-3.5 h-3.5 text-white" />
          ) : (
            <Share2 className="w-3.5 h-3.5 text-white" />
          )}
          <span className="hidden sm:inline">Share</span>
        </button>

        {/* Collaborators counter button & popover */}
        <div className="relative shrink-0" ref={usersDropdownRef}>
          <button
            onClick={() => setIsUsersListOpen((prev) => !prev)}
            title="View joined collaborators"
            aria-label="View joined collaborators"
            aria-expanded={isUsersListOpen}
            aria-haspopup="dialog"
            className={`flex items-center gap-1 sm:gap-1.5 px-2 py-1.5 sm:px-2.5 sm:py-1.5 rounded-xl text-white text-xs sm:text-sm font-medium shadow-lg backdrop-blur-md transition-all active:scale-95 cursor-pointer ${
              isUsersListOpen
                ? 'bg-blue-600 ring-2 ring-blue-400/80 shadow-blue-500/20'
                : 'bg-slate-900/90 hover:bg-slate-900'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-slate-300" />
            <span className="font-bold">{displayUsers.length}</span>
          </button>

          {/* Collaborators Dropdown Popover */}
          {isUsersListOpen && (
            <div
              role="dialog"
              aria-label="Joined collaborators"
              className="absolute top-full mt-2 right-0 w-72 sm:w-80 bg-slate-900/95 backdrop-blur-xl border border-slate-700/70 rounded-2xl shadow-2xl z-[600] overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-3.5 py-3 border-b border-slate-800/80 bg-slate-900">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-400" />
                  <span className="text-xs sm:text-sm font-bold text-white">Joined Collaborators</span>
                  <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                    {displayUsers.length}
                  </span>
                </div>
                <button
                  onClick={() => setIsUsersListOpen(false)}
                  className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                  aria-label="Close user list"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* User list */}
              <div className="max-h-60 overflow-y-auto divide-y divide-slate-800/50 p-2 space-y-1">
                {sortedUsers.map((u) => {
                  const isMe = u.id === userId
                  const isUserAdmin = u.id === adminId || Boolean(u.isAdmin)
                  return (
                    <div
                      key={u.id}
                      className="flex items-center justify-between gap-3 p-2 rounded-xl hover:bg-slate-800/50 transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="relative shrink-0">
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs text-white shadow-inner"
                            style={{ backgroundColor: u.color || '#4ECDC4' }}
                          >
                            {(u.name || '?')[0].toUpperCase()}
                          </div>
                          <span
                            className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-slate-900 rounded-full"
                            title="Online"
                          />
                        </div>
                        <div className="min-w-0 flex flex-col">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs sm:text-sm font-semibold text-slate-100 truncate max-w-[130px]">
                              {u.name}
                            </span>
                            {isMe && (
                              <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                                You
                              </span>
                            )}
                            {isUserAdmin && (
                              <span className="flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                <Crown className="w-2.5 h-2.5 text-amber-400" />
                                Host
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-400">
                            {isMe ? 'Current user' : 'Active collaborator'}
                          </span>
                        </div>
                      </div>

                      {/* Host moderation: Kick collaborator */}
                      {isAdmin && !isMe && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            setUserToKick(u)
                          }}
                          title={`Kick ${u.name} from room`}
                          aria-label={`Kick ${u.name} from room`}
                          className="px-2 py-1 bg-red-500/10 hover:bg-red-500/25 active:scale-95 text-red-300 hover:text-red-200 border border-red-500/30 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all shrink-0 cursor-pointer"
                        >
                          <UserX className="w-3.5 h-3.5 text-red-400" />
                          <span>Kick</span>
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Popover Footer */}
              {isAdmin ? (
                <div className="p-3 bg-red-950/30 border-t border-red-900/40">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-red-300 flex items-center gap-1">
                        <ShieldAlert className="w-3.5 h-3.5 text-red-400 shrink-0" />
                        <span>Host Controls</span>
                      </div>
                      <p className="text-[11px] text-slate-400 truncate">Discard room for everyone</p>
                    </div>
                    <button
                      onClick={() => {
                        setIsUsersListOpen(false)
                        setShowDiscardConfirm(true)
                      }}
                      className="px-2.5 py-1.5 bg-red-600 hover:bg-red-700 active:scale-95 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5 shrink-0"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Discard</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="px-3 py-2 bg-slate-800/40 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between">
                  <span className="flex items-center gap-1.5 truncate">
                    <Crown className="w-3 h-3 text-amber-400 shrink-0" />
                    <span>Room Host:</span>
                    <strong className="text-slate-200 truncate">
                      {sortedUsers.find((u) => u.id === adminId || u.isAdmin)?.name || 'Host'}
                    </strong>
                  </span>
                  <span className="text-[10px] text-slate-500 shrink-0">Only host can discard</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Leave Room Button */}
        <button
          onClick={handleLeave}
          title="Leave room"
          aria-label="Leave room"
          className="flex items-center gap-1 sm:gap-1.5 px-2 py-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-800 text-white text-xs sm:text-sm font-semibold shadow-lg backdrop-blur-md transition-all active:scale-95 shrink-0"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Leave</span>
        </button>

        {/* Admin Discard Room Button */}
        {isAdmin && (
          <button
            onClick={() => setShowDiscardConfirm(true)}
            title="Discard Room (Host only) — Ends the session for all participants"
            aria-label="Discard room for all participants"
            className="flex items-center gap-1 sm:gap-1.5 px-2 py-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-red-600/90 hover:bg-red-600 text-white text-xs sm:text-sm font-semibold shadow-lg backdrop-blur-md transition-all active:scale-95 shrink-0"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Discard</span>
          </button>
        )}
      </div>

      {/* Discard Confirmation Modal */}
      {showDiscardConfirm && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[700] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in"
        >
          <div className="w-full max-w-sm sm:max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-5 sm:p-6 text-white space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 shrink-0">
                <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 text-red-400" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base sm:text-lg font-bold text-white">Discard Whiteboard Room?</h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  As the room host, discarding this room will immediately end the session for all collaborators and permanently clear all canvas drawings.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowDiscardConfirm(false)}
                disabled={isDiscarding}
                className="px-3.5 py-2 text-xs sm:text-sm font-semibold text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAdminDiscard}
                disabled={isDiscarding}
                className="px-4 py-2 text-xs sm:text-sm font-bold text-white bg-red-600 hover:bg-red-700 active:scale-95 rounded-xl shadow-lg transition-all flex items-center gap-1.5 disabled:opacity-50"
              >
                {isDiscarding ? (
                  <span>Discarding...</span>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Yes, Discard Room</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Kick Collaborator Confirmation Modal */}
      {userToKick && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[700] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in"
        >
          <div className="w-full max-w-sm sm:max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-5 sm:p-6 text-white space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 shrink-0">
                <UserX className="w-5 h-5 sm:w-6 sm:h-6 text-red-400" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base sm:text-lg font-bold text-white">Remove Collaborator?</h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Are you sure you want to remove <strong className="text-white font-semibold">{userToKick.name}</strong> from the room? They will be disconnected immediately and prevented from interrupting.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setUserToKick(null)}
                disabled={isKicking}
                className="px-3.5 py-2 text-xs sm:text-sm font-semibold text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleConfirmKick(userToKick)}
                disabled={isKicking}
                className="px-4 py-2 text-xs sm:text-sm font-bold text-white bg-red-600 hover:bg-red-700 active:scale-95 rounded-xl shadow-lg transition-all flex items-center gap-1.5 disabled:opacity-50"
              >
                {isKicking ? (
                  <span>Removing...</span>
                ) : (
                  <>
                    <UserX className="w-3.5 h-3.5" />
                    <span>Yes, Remove</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toasts */}
      <div className="fixed bottom-4 right-4 z-[600] space-y-2 pointer-events-none">
        {toasts.map((toast) => (
          <Toast key={toast.id} message={toast.message} type={toast.type} />
        ))}
      </div>
    </div>
  )
}
