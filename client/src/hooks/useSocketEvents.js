import { useEffect } from 'react'
import { useSocket } from '@/context/SocketContext'
import { useWhiteboard } from '@/context/WhiteboardContext'

export function useSocketEvents() {
  const { socket, connected } = useSocket()
  const {
    roomId,
    userId,
    updateDrawing,
    addUser,
    removeUser,
    updateCursor,
    setZoom,
    setPan,
  } = useWhiteboard()

  useEffect(() => {
    if (!socket || !connected || !roomId) return

    // Room events
    socket.on('room:user-joined', (data) => {
      addUser(data.user)
    })

    socket.on('room:user-left', (data) => {
      removeUser(data.userId)
    })

    socket.on('room:full', () => {
      // Handle room full error
    })

    // Drawing events
    socket.on('draw:update', (data) => {
      updateDrawing(data)
    })

    socket.on('draw:clear', () => {
      // Clear canvas
    })

    // Cursor events
    socket.on('cursor:move', (data) => {
      updateCursor(data.userId, data.position)
    })

    // Canvas state events
    socket.on('canvas:zoom', (data) => {
      setZoom(data.zoom)
    })

    socket.on('canvas:pan', (data) => {
      setPan(data.pan)
    })

    return () => {
      socket.off('room:user-joined')
      socket.off('room:user-left')
      socket.off('room:full')
      socket.off('draw:update')
      socket.off('draw:clear')
      socket.off('cursor:move')
      socket.off('canvas:zoom')
      socket.off('canvas:pan')
    }
  }, [socket, connected, roomId, userId])

  return socket
}
