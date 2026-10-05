import { useEffect } from 'react'
import { useSocket } from '@/context/SocketContext'
import { useWhiteboard } from '@/context/WhiteboardContext'

/**
 * Keeps the collaborator roster, discard timer, and room lifecycle in sync with the server.
 * Incremental join/leave events update the roster.
 * Timer events update single-user 5-minute countdown.
 * Discard event triggers cleanup and redirection.
 */
export function useRoomUsers({ onDiscard, onKicked, onUserJoined, onAdminChanged } = {}) {
  const { socket, connected } = useSocket()
  const {
    roomId,
    addUser,
    removeUser,
    setUsers,
    setAdminId,
    setSingleUserDiscardAt,
  } = useWhiteboard()

  useEffect(() => {
    if (!socket || !connected || !roomId) return

    const onJoined = (data) => {
      if (data?.user) {
        addUser(data.user)
        onUserJoined?.(data.user)
      }
      if (data?.users) {
        setUsers(data.users)
      }
      if (data?.adminId) {
        setAdminId(data.adminId)
      }
    }

    const onLeft = (data) => {
      if (data?.userId) {
        removeUser(data.userId)
      }
      if (data?.users) {
        setUsers(data.users)
      }
      if (data?.adminId) {
        setAdminId(data.adminId)
      }
    }

    const onAdminUpdated = (data) => {
      if (data?.adminId) {
        setAdminId(data.adminId)
      }
      if (data?.users) {
        setUsers(data.users)
      }
      onAdminChanged?.(data)
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
      const msg = data?.message || 'Room was discarded'
      try {
        sessionStorage.setItem('canvasx_discard_toast', msg)
      } catch (_) {}
      onDiscard?.(msg)
    }

    const onKickedEvent = (data) => {
      setSingleUserDiscardAt(null)
      const msg = data?.message || 'You have been removed from the room by the host.'
      try {
        sessionStorage.setItem('canvasx_discard_toast', msg)
      } catch (_) {}
      onKicked?.(msg)
    }

    socket.on('room:user-joined', onJoined)
    socket.on('room:user-left', onLeft)
    socket.on('room:admin-changed', onAdminUpdated)
    socket.on('room:timer-started', onTimerStarted)
    socket.on('room:timer-cancelled', onTimerCancelled)
    socket.on('room:discarded', onDiscarded)
    socket.on('room:kicked', onKickedEvent)

    return () => {
      socket.off('room:user-joined', onJoined)
      socket.off('room:user-left', onLeft)
      socket.off('room:admin-changed', onAdminUpdated)
      socket.off('room:timer-started', onTimerStarted)
      socket.off('room:timer-cancelled', onTimerCancelled)
      socket.off('room:discarded', onDiscarded)
      socket.off('room:kicked', onKickedEvent)
    }
  }, [
    socket,
    connected,
    roomId,
    addUser,
    removeUser,
    setUsers,
    setAdminId,
    setSingleUserDiscardAt,
    onDiscard,
    onKicked,
    onUserJoined,
    onAdminChanged,
  ])
}
