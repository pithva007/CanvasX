import { useState } from 'react'
import { useSocket } from '@/context/SocketContext'
import { useWhiteboard } from '@/context/WhiteboardContext'
import { useRoomUsers } from '@/hooks/useSocketEvents'
import { useSyncStore } from '@/hooks/useSyncStore'
import { useToast } from '@/hooks/useToast'
import { Tldraw } from 'tldraw'
import 'tldraw/tldraw.css'
import { Toast } from '@/components/Toast'
import { LogOut, Copy, Check, Users } from 'lucide-react'

export function WhiteboardPage({ onLeaveRoom }) {
  const { socket, connected } = useSocket()
  const { roomId, userId, userName, password, users, seeding } = useWhiteboard()
  const { toasts, addToast } = useToast()
  const [copied, setCopied] = useState(false)

  useRoomUsers()
  const storeWithStatus = useSyncStore({
    socket,
    connected,
    roomId,
    userId,
    userName,
    seeding,
  })

  const handleLeave = () => {
    if (socket) socket.emit('room:leave')
    onLeaveRoom?.()
  }

  const copyPassword = async () => {
    try {
      await navigator.clipboard.writeText(password || '')
      setCopied(true)
      addToast('Room password copied', 'success')
      setTimeout(() => setCopied(false), 1500)
    } catch {
      addToast('Could not copy password', 'error')
    }
  }

  return (
    <div className="relative w-full h-screen overflow-hidden bg-white">
      {/* tldraw provides the full drawing UI (tools, styles, export, zoom). */}
      <Tldraw
        store={storeWithStatus}
        onMount={(editor) => {
          // Escape hatch for debugging / automation.
          if (typeof window !== 'undefined') window.editor = editor
        }}
      />

      {/* Room bar (top-right corner, out of tldraw's default UI zones). */}
      <div className="absolute top-2 right-2 z-[500] flex items-center gap-2 pointer-events-auto">
        <button
          onClick={copyPassword}
          title="Copy room password to share"
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/85 text-white text-sm font-medium shadow-lg hover:bg-slate-900 transition-colors"
        >
          <span className="text-slate-400">Room</span>
          <span className="font-semibold">{password}</span>
          {copied ? (
            <Check className="w-4 h-4 text-green-400" />
          ) : (
            <Copy className="w-4 h-4 text-slate-300" />
          )}
        </button>

        <div
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900/85 text-white text-sm font-medium shadow-lg"
          title={users.map((u) => u.name).join(', ')}
        >
          <Users className="w-4 h-4 text-slate-300" />
          <span>{Math.max(users.length, 1)}</span>
        </div>

        <button
          onClick={handleLeave}
          title="Leave room"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600/90 text-white text-sm font-medium shadow-lg hover:bg-red-600 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Leave
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
