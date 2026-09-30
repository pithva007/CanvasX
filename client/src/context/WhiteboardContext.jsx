import { createContext, useContext, useState, useCallback } from 'react'

const WhiteboardContext = createContext(null)

export const useWhiteboard = () => {
  const context = useContext(WhiteboardContext)
  if (!context) {
    throw new Error('useWhiteboard must be used within WhiteboardProvider')
  }
  return context
}

/**
 * Session-level room state. Drawing state lives in the tldraw store (see useSyncStore).
 * This context tracks room code, user identity, collaborator roster,
 * initial seeding payload, and the 5-minute single-user discard timer.
 */
export function WhiteboardProvider({ children }) {
  const [roomId, setRoomId] = useState(null)
  const [roomCode, setRoomCode] = useState(null)
  const [userId, setUserId] = useState(null)
  const [userName, setUserName] = useState('')
  const [users, setUsers] = useState([])
  const [seeding, setSeeding] = useState(null) // { needsInit, snapshot }
  const [singleUserDiscardAt, setSingleUserDiscardAt] = useState(null)

  const addUser = useCallback((user) => {
    setUsers((prev) => [...prev.filter((u) => u.id !== user.id), user])
  }, [])

  const removeUser = useCallback((id) => {
    setUsers((prev) => prev.filter((u) => u.id !== id))
  }, [])

  const resetRoom = useCallback(() => {
    setRoomId(null)
    setRoomCode(null)
    setUsers([])
    setSeeding(null)
    setSingleUserDiscardAt(null)
  }, [])

  return (
    <WhiteboardContext.Provider
      value={{
        roomId,
        setRoomId,
        roomCode,
        setRoomCode,
        password: roomCode, // Alias for backward compatibility
        setPassword: setRoomCode,
        userId,
        setUserId,
        userName,
        setUserName,
        users,
        setUsers,
        addUser,
        removeUser,
        seeding,
        setSeeding,
        singleUserDiscardAt,
        setSingleUserDiscardAt,
        resetRoom,
      }}
    >
      {children}
    </WhiteboardContext.Provider>
  )
}
