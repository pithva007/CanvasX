import { useState, useEffect } from 'react'
import { useSocket } from '@/context/SocketContext'
import { useWhiteboard } from '@/context/WhiteboardContext'
import { useToast } from '@/hooks/useToast'
import {
  Sparkles,
  LogIn,
  Loader,
  Server,
  Check,
  ChevronUp,
  User,
  Hash,
  Users,
  Clock,
  ArrowRight,
} from 'lucide-react'

export function JoinPage({ onJoinRoom }) {
  const [name, setName] = useState(() => localStorage.getItem('drawtogether_name') || '')

  // Read ?room=... from URL if provided (invite link)
  const [urlRoomCode, setUrlRoomCode] = useState(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      return (params.get('room') || '').trim().toUpperCase()
    }
    return ''
  })

  // Mode: 'create' or 'join' (default to 'join' if invite code was in URL)
  const [activeTab, setActiveTab] = useState(() => (urlRoomCode ? 'join' : 'create'))
  const [inputRoomCode, setInputRoomCode] = useState(urlRoomCode)
  const [loading, setLoading] = useState(false)

  const { socket, connected, serverUrl, updateServerUrl } = useSocket()
  const {
    setRoomId,
    setRoomCode,
    setUserId,
    setUserName,
    setUsers,
    setSeeding,
    setSingleUserDiscardAt,
  } = useWhiteboard()
  const { toasts, addToast } = useToast()

  const [showSettingsHint, setShowSettingsHint] = useState(false)
  const [showServerSettings, setShowServerSettings] = useState(false)
  const [tempServerUrl, setTempServerUrl] = useState(serverUrl)

  useEffect(() => {
    let timer
    if (!connected) {
      timer = setTimeout(() => {
        setShowSettingsHint(true)
      }, 3000)
    } else {
      setShowSettingsHint(false)
      setShowServerSettings(false)
    }
    return () => clearTimeout(timer)
  }, [connected])

  const handleCreateRoom = async (e) => {
    e.preventDefault()

    if (!connected || !socket) {
      addToast('Connecting to server...', 'info')
      return
    }

    setLoading(true)
    const trimmedName = name.trim()
    localStorage.setItem('drawtogether_name', trimmedName)

    socket.emit('room:create', { name: trimmedName }, (response) => {
      setLoading(false)

      if (response && response.success) {
        setRoomId(response.roomId)
        setRoomCode(response.roomCode)
        setUserId(response.userId)
        setUserName(response.name)
        setUsers(response.users || [])
        setSeeding({ needsInit: response.needsInit, snapshot: response.snapshot })
        setSingleUserDiscardAt(response.singleUserDiscardAt)

        // Clean up URL if there was an old ?room= param
        if (typeof window !== 'undefined' && window.history.replaceState) {
          const cleanUrl = window.location.pathname
          window.history.replaceState({}, '', cleanUrl)
        }

        addToast(`Room ${response.roomCode} created!`, 'success')
        onJoinRoom(response.roomId)
      } else {
        addToast((response && response.message) || 'Failed to create room', 'error')
      }
    })
  }

  const handleJoinRoom = async (e) => {
    e.preventDefault()

    const trimmedCode = inputRoomCode.trim().toUpperCase()
    if (!trimmedCode) {
      addToast('Please enter a room code', 'error')
      return
    }

    if (!connected || !socket) {
      addToast('Connecting to server...', 'info')
      return
    }

    setLoading(true)
    const trimmedName = name.trim()
    localStorage.setItem('drawtogether_name', trimmedName)

    socket.emit('room:join', { roomCode: trimmedCode, name: trimmedName }, (response) => {
      setLoading(false)

      if (response && response.success) {
        setRoomId(response.roomId)
        setRoomCode(response.roomCode)
        setUserId(response.userId)
        setUserName(response.name)
        setUsers(response.users || [])
        setSeeding({ needsInit: response.needsInit, snapshot: response.snapshot })
        setSingleUserDiscardAt(response.singleUserDiscardAt)

        addToast(`Joined room ${response.roomCode}!`, 'success')
        onJoinRoom(response.roomId)
      } else {
        addToast((response && response.message) || 'Failed to join room', 'error')
      }
    })
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-600/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-600/20 rounded-full blur-3xl animate-pulse" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-500 via-indigo-500 to-purple-600 shadow-xl mb-4">
            <svg
              className="w-9 h-9 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
              />
            </svg>
          </div>

          <h1 className="text-3xl font-extrabold text-white tracking-tight">DrawTogether</h1>
          <p className="text-slate-400 text-sm mt-1">Instant Real-time Collaborative Whiteboard</p>
        </div>

        {/* Main Card */}
        <div className="bg-white/95 backdrop-blur-xl rounded-2xl p-6 sm:p-8 shadow-2xl border border-white/20">
          {/* Invited Banner */}
          {urlRoomCode && (
            <div className="mb-6 p-3.5 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2.5 text-xs text-blue-900 font-semibold">
                <Users className="w-4 h-4 text-blue-600 shrink-0" />
                <span>Invited to Room: <strong className="font-mono text-sm text-blue-700">{urlRoomCode}</strong></span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setUrlRoomCode('')
                  setInputRoomCode('')
                }}
                className="text-[11px] text-slate-500 hover:text-slate-800 underline"
              >
                Clear
              </button>
            </div>
          )}

          {/* Name Field (Shared across both modes) */}
          <div className="mb-6">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              Your Display Name
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name (e.g. Alex)"
                maxLength={40}
                disabled={!connected || loading}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all disabled:opacity-50"
                autoFocus
              />
            </div>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex bg-slate-100 p-1 rounded-xl mb-6 border border-slate-200">
            <button
              type="button"
              onClick={() => setActiveTab('create')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-bold rounded-lg transition-all ${
                activeTab === 'create'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Create Room</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('join')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-bold rounded-lg transition-all ${
                activeTab === 'join'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Join Room</span>
            </button>
          </div>

          {/* TAB 1: CREATE ROOM */}
          {activeTab === 'create' && (
            <form onSubmit={handleCreateRoom} className="space-y-4">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs text-slate-600">
                <div className="flex items-center gap-2 font-semibold text-slate-800">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>Start a New Collaborative Canvas</span>
                </div>
                <p className="leading-relaxed">
                  Generates a unique Room Code and instant invite link you can share with your team.
                </p>
                <div className="flex items-start gap-1.5 pt-1 text-[11px] text-amber-700 font-medium">
                  <Clock className="w-3.5 h-3.5 mt-0.5 shrink-0 text-amber-600" />
                  <span>Rooms require at least 2 people within 5 minutes or they will be automatically discarded.</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={!connected || loading}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold text-sm shadow-md hover:shadow-lg active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? <Loader className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                <span>{loading ? 'Creating Canvas...' : 'Create Room & Start Drawing'}</span>
              </button>
            </form>
          )}

          {/* TAB 2: JOIN ROOM */}
          {activeTab === 'join' && (
            <form onSubmit={handleJoinRoom} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  Room Code
                </label>
                <div className="relative">
                  <Hash className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={inputRoomCode}
                    onChange={(e) => setInputRoomCode(e.target.value.toUpperCase())}
                    placeholder="e.g. ART-4821"
                    maxLength={30}
                    disabled={!connected || loading}
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-mono font-bold tracking-wider placeholder:font-sans placeholder:font-normal placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all disabled:opacity-50 uppercase"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1.5 font-medium">
                  Enter the Room Code shared by your collaborator
                </p>
              </div>

              <button
                type="submit"
                disabled={!connected || loading}
                className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-md hover:shadow-lg active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? <Loader className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                <span>{loading ? 'Joining Room...' : 'Join Room'}</span>
              </button>
            </form>
          )}

          {/* Server Connection Fallback Card */}
          {!connected && (
            <div className="mt-5 space-y-3">
              <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Loader className="w-4 h-4 text-yellow-600 animate-spin" />
                  <p className="text-xs text-yellow-800 font-semibold">
                    Connecting to backend server...
                  </p>
                </div>
                {showSettingsHint && !showServerSettings && (
                  <button
                    type="button"
                    onClick={() => setShowServerSettings(true)}
                    className="text-xs text-blue-600 hover:text-blue-700 font-bold underline transition-colors"
                  >
                    Configure
                  </button>
                )}
              </div>

              {showServerSettings && (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-slate-800 font-semibold text-xs">
                      <Server className="w-4 h-4 text-slate-600" />
                      <span>Custom Server URL</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowServerSettings(false)}
                      className="text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                  </div>

                  <p className="text-[11px] text-slate-500 leading-normal font-medium">
                    If backend is deployed on Render/Vercel, enter its URL:
                  </p>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={tempServerUrl}
                      onChange={(e) => setTempServerUrl(e.target.value)}
                      placeholder="https://your-backend.onrender.com"
                      className="flex-1 text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        updateServerUrl(tempServerUrl)
                        addToast('Reconnecting with new URL...', 'info')
                      }}
                      className="px-3 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 active:scale-95 transition-all flex items-center gap-1"
                    >
                      <Check className="w-3.5 h-3.5" />
                      Set
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Features highlight */}
          <div className="mt-6 pt-5 border-t border-slate-200 grid grid-cols-2 gap-2 text-[11px] text-slate-600 font-medium">
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>Real-time co-drawing</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              <span>Live cursor tracking</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
              <span>Infinite vector canvas</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              <span>No password needed</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-slate-400 text-xs mt-6 font-medium">
          Create a room and share the code or link with your collaborators to draw together.
        </p>
      </div>
    </div>
  )
}
