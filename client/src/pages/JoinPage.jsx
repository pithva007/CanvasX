import { useState } from 'react'
import { useSocket } from '@/context/SocketContext'
import { useWhiteboard } from '@/context/WhiteboardContext'
import { useToast } from '@/hooks/useToast'
import { Lock, Loader } from 'lucide-react'

export function JoinPage({ onJoinRoom }) {
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const { socket, connected } = useSocket()
  const { setRoomId, setUserId } = useWhiteboard()
  const { addToast } = useToast()

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

    socket.emit('room:join', { password }, (response) => {
      setLoading(false)

      if (response.success) {
        setRoomId(response.roomId)
        setUserId(response.userId)
        addToast('Room joined successfully!', 'success')
        onJoinRoom(response.roomId)
      } else {
        addToast(response.message || 'Failed to join room', 'error')
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
                  autoFocus
                />
              </div>
              <p className="text-xs text-slate-600 mt-2 font-medium">
                Use any password to create or join a room
              </p>
            </div>

            {/* Status */}
            {!connected && (
              <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                <p className="text-sm text-yellow-200">
                  Connecting to server...
                </p>
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
          Maximum 2 users per room
        </p>
      </div>
    </div>
  )
}
