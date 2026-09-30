import { useEffect } from 'react'
import { useSocket } from '@/context/SocketContext'
import { useWhiteboard } from '@/context/WhiteboardContext'

/**
 * Keeps the collaborator roster, discard timer, and room lifecycle in sync with the server.
 * Incremental join/leave events update the roster.
 * Timer events update single-user 5-minute countdown.
 * Discard event triggers cleanup and redirection.
 */
export function useRoomUsers({ onDiscard, onUserJoined } = {}) {
  const { socket, connected } = useSocket()
  const {
    roomId,
    addUser,
    removeUser,
    setSingleUserDiscardAt,
  } = useWhiteboard()

  useEffect(() => {
    if (!socket || !connected || !roomId) return

    const onJoined = (data) => {
      if (data?.user) {
        addUser(data.user)
        onUserJoined?.(data.user)
      }
    }

    const onLeft = (data) => {
      if (data?.userId) {
        removeUser(data.userId)
      }
    }

    const onTimerStarted = (data) => {
      if (data?.discardAt) {
        setSingleUserDiscardAt(data.discardAt)
      }
    }

    const onTimerCancelled = () => {
      setSingleUserDiscardAt(null)
    }

    const onDiscarded = (data) => {
      setSingleUserDiscardAt(null)
      onDiscard?.(data?.message || 'Room was discarded')
    }

    socket.on('room:user-joined', onJoined)
    socket.on('room:user-left', onLeft)
    socket.on('room:timer-started', onTimerStarted)
    socket.on('room:timer-cancelled', onTimerCancelled)
    socket.on('room:discarded', onDiscarded)

    return () => {
      socket.off('room:user-joined', onJoined)
      socket.off('room:user-left', onLeft)
      socket.off('room:timer-started', onTimerStarted)
      socket.off('room:timer-cancelled', onTimerCancelled)
      socket.off('room:discarded', onDiscarded)
    }
  }, [socket, connected, roomId, addUser, removeUser, setSingleUserDiscardAt, onDiscard, onUserJoined])
}
