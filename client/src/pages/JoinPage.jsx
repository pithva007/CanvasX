import { useState, useEffect } from 'react'
import { useSocket } from '@/context/SocketContext'
import { useWhiteboard } from '@/context/WhiteboardContext'
import { useToast } from '@/hooks/useToast'
import { Lock, Loader, Server, Check, ChevronUp, User } from 'lucide-react'

export function JoinPage({ onJoinRoom }) {
  const [name, setName] = useState(() => localStorage.getItem('drawtogether_name') || '')
  const [password, setPassword] = useState('Drawing24')
  const [loading, setLoading] = useState(false)
  const { socket, connected, serverUrl, updateServerUrl } = useSocket()
  const {
    setRoomId,
    setPassword: setRoomPassword,
    setUserId,
    setUserName,
    setUsers,
    setSeeding,
  } = useWhiteboard()
  const { addToast } = useToast()

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

  const handleJoin = async (e) => {
    e.preventDefault()

    if (!password.trim()) {
      addToast('Please enter a room password', 'error')
      return
    }

    if (!connected || !socket) {
      addToast('Connecting to server...', 'info')
      return
    }

    setLoading(true)
    const trimmedName = name.trim()
    localStorage.setItem('drawtogether_name', trimmedName)

    socket.emit('room:join', { password, name: trimmedName }, (response) => {
      setLoading(false)

      if (response && response.success) {
        setRoomId(response.roomId)
        setRoomPassword(password)
        setUserId(response.userId)
        setUserName(response.name)
        setUsers(response.users || [])
        setSeeding({ needsInit: response.needsInit, snapshot: response.snapshot })
        addToast('Room joined successfully!', 'success')
        onJoinRoom(response.roomId)
      } else {
        addToast((response && response.message) || 'Failed to join room', 'error')
      }
    })
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-600/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-600/20 rounded-full blur-3xl animate-pulse" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 mb-6">
            <svg
              className="w-8 h-8 text-white"
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

          <h1 className="text-4xl font-bold text-white mb-2">DrawTogether</h1>
          <p className="text-slate-400 text-lg">Real-time Collaborative Whiteboard</p>
        </div>

        {/* Main Card */}
        <div className="bg-white/95 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-white/20">
          <form onSubmit={handleJoin} className="space-y-6">
            {/* Name Input */}
            <div>
              <label className="block text-sm font-semibold text-slate-800 mb-3">
                Your Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your display name"
                  maxLength={40}
                  disabled={!connected || loading}
                  className="input input pl-10 bg-white border-2 border-slate-300 text-slate-900 placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                  autoFocus
                />
              </div>
              <p className="text-xs text-slate-600 mt-2 font-medium">
                Shown to collaborators on your cursor
              </p>
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-sm font-semibold text-slate-800 mb-3">
                Room Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter room password"
                  disabled={!connected || loading}
                  className="input input pl-10 bg-white border-2 border-slate-300 text-slate-900 placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                />
              </div>
              <p className="text-xs text-slate-600 mt-2 font-medium">
                Share this password so others can join the same room
              </p>
            </div>

            {/* Status & Server Settings */}
            {!connected && (
              <div className="space-y-3">
                <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Loader className="w-4 h-4 text-yellow-600 animate-spin" />
                    <p className="text-sm text-yellow-700 font-semibold">
                      Connecting to server...
                    </p>
                  </div>
                  {showSettingsHint && !showServerSettings && (
                    <button
                      type="button"
                      onClick={() => setShowServerSettings(true)}
                      className="text-xs text-blue-600 hover:text-blue-700 font-bold underline transition-colors"
                    >
                      Configure Server
                    </button>
                  )}
                </div>

                {/* Dynamic Server Configuration Card */}
                {showServerSettings && (
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-slate-800 font-semibold text-xs">
                        <Server className="w-4 h-4 text-slate-600" />
                        <span>Server Connection Settings</span>
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
                      If your backend is deployed under a different domain (e.g. on Render), enter its URL below to connect.
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
                        Update
                      </button>
                    </div>

                    <div className="pt-1.5 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-500">
                      <span className="font-semibold">Current URL:</span>
                      <code className="text-slate-600 font-mono select-all truncate max-w-[200px]" title={serverUrl}>
                        {serverUrl}
                      </code>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!connected || loading}
              className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading && <Loader className="w-4 h-4 animate-spin" />}
              {loading ? 'Joining...' : 'Join Room'}
            </button>
          </form>

          {/* Features */}
          <div className="mt-8 pt-6 border-t border-slate-300">
            <p className="text-xs font-semibold text-slate-700 mb-4">Features:</p>
            <div className="space-y-2 text-sm text-slate-700 font-medium">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                <span>Draw together in real-time</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                <span>Live cursor tracking</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                <span>Infinite canvas</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-pink-500" />
                <span>All drawing tools included</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-slate-600 text-xs mt-8 font-semibold">
          Anyone with the password can join and draw together
        </p>
      </div>
    </div>
  )
}
