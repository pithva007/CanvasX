import { useEffect, useRef, useState } from 'react'
import { useSocket } from '@/context/SocketContext'
import { useWhiteboard } from '@/context/WhiteboardContext'
import { useSocketEvents } from '@/hooks/useSocketEvents'
import { useToast } from '@/hooks/useToast'
import { Tldraw } from 'tldraw'
import 'tldraw/tldraw.css'
import { Toolbar } from '@/components/Toolbar'
import { UserPresence } from '@/components/UserPresence'
import { Toast } from '@/components/Toast'
import { Download, LogOut } from 'lucide-react'

export function WhiteboardPage({ roomId: initialRoomId, onLeaveRoom }) {
  const { socket, connected } = useSocket()
  const { roomId, userId, users } = useWhiteboard()
  const { toasts, addToast } = useToast()
  const tlDrawRef = useRef(null)
  const [appState, setAppState] = useState(null)

  useSocketEvents()

  useEffect(() => {
    if (!socket || !connected) return

    // Join room with socket
    socket.emit('room:join', { roomId }, (response) => {
      if (!response.success) {
        addToast(response.message || 'Failed to join room', 'error')
      }
    })

    return () => {
      socket.emit('room:leave', { roomId })
    }
  }, [socket, connected, roomId])

  const handleExport = async (format) => {
    if (!tlDrawRef.current) return

    try {
      if (format === 'png') {
        // Export as PNG
        const canvas = tlDrawRef.current.getCanvas?.()
        if (canvas) {
          const link = document.createElement('a')
          link.href = canvas.toDataURL('image/png')
          link.download = `whiteboard-${Date.now()}.png`
          link.click()
          addToast('Exported as PNG', 'success')
        }
      } else if (format === 'json') {
        // Export as JSON
        const data = JSON.stringify(appState, null, 2)
        const blob = new Blob([data], { type: 'application/json' })
        const link = document.createElement('a')
        link.href = URL.createObjectURL(blob)
        link.download = `whiteboard-${Date.now()}.json`
        link.click()
        addToast('Exported as JSON', 'success')
      }
    } catch (error) {
      addToast('Export failed', 'error')
    }
  }

  const handleLeave = () => {
    if (socket) {
      socket.emit('room:leave', { roomId })
    }
    onLeaveRoom?.()
  }

  return (
    <div className="relative w-full h-screen bg-white dark:bg-dark-900 flex overflow-hidden">
      {/* Tldraw Canvas */}
      <div className="flex-1">
        <Tldraw ref={tlDrawRef} />
      </div>

      {/* Toolbar */}
      <Toolbar onExport={handleExport} />

      {/* User Presence */}
      <UserPresence users={users} currentUserId={userId} />

      {/* Header */}
      <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-black/10 to-transparent backdrop-blur-sm pointer-events-none" />

      {/* Room Info & Controls */}
      <div className="absolute top-4 left-4 z-50 flex items-center gap-3">
        <div className="glass px-4 py-2 rounded-lg pointer-events-auto">
          <p className="text-sm text-white font-medium">Room: {roomId}</p>
          <p className="text-xs text-gray-300">
            {users.length}/2 users connected
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="absolute top-4 right-4 z-50 flex items-center gap-2 pointer-events-auto">
        <button
          onClick={() => handleExport('png')}
          className="btn-secondary p-2 rounded-lg flex items-center gap-2"
          title="Export as PNG"
        >
          <Download className="w-4 h-4" />
        </button>
        <button
          onClick={handleLeave}
          className="btn-secondary p-2 rounded-lg flex items-center gap-2"
          title="Leave room"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>

      {/* Toast Container */}
      <div className="fixed bottom-4 right-4 z-50 space-y-2 pointer-events-none">
        {toasts.map((toast) => (
          <Toast key={toast.id} message={toast.message} type={toast.type} />
        ))}
      </div>
    </div>
  )
}
