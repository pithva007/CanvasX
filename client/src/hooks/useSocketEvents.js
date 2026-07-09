import { useEffect } from 'react'
import { useSocket } from '@/context/SocketContext'
import { useWhiteboard } from '@/context/WhiteboardContext'

/**
 * Keeps the collaborator roster in sync with the server. The initial roster is
 * seeded from the room:join response (in JoinPage); this hook applies the
 * incremental join/leave events. Drawing and cursor sync live in useSyncStore.
 */
export function useRoomUsers() {
  const { socket, connected } = useSocket()
  const { roomId, addUser, removeUser } = useWhiteboard()

  useEffect(() => {
    if (!socket || !connected || !roomId) return

    const onJoined = (data) => data?.user && addUser(data.user)
    const onLeft = (data) => data?.userId && removeUser(data.userId)

    socket.on('room:user-joined', onJoined)
    socket.on('room:user-left', onLeft)

    return () => {
      socket.off('room:user-joined', onJoined)
      socket.off('room:user-left', onLeft)
    }
  }, [socket, connected, roomId, addUser, removeUser])
}
