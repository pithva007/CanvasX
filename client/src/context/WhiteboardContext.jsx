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
 * Session-level room state. Drawing state itself lives in the tldraw store
 * (see useSyncStore); this context only tracks room identity, the local user,
 * the roster of collaborators, and the initial sync payload from `room:join`.
 */
export function WhiteboardProvider({ children }) {
  const [roomId, setRoomId] = useState(null)
  const [password, setPassword] = useState(null)
  const [userId, setUserId] = useState(null)
  const [userName, setUserName] = useState('')
  const [users, setUsers] = useState([])
  const [seeding, setSeeding] = useState(null) // { needsInit, snapshot } from room:join

  const addUser = useCallback((user) => {
    setUsers((prev) => [...prev.filter((u) => u.id !== user.id), user])
  }, [])

  const removeUser = useCallback((id) => {
    setUsers((prev) => prev.filter((u) => u.id !== id))
  }, [])

  const resetRoom = useCallback(() => {
    setRoomId(null)
    setPassword(null)
    setUsers([])
    setSeeding(null)
  }, [])

  return (
    <WhiteboardContext.Provider
      value={{
        roomId,
        setRoomId,
        password,
        setPassword,
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
        resetRoom,
      }}
    >
      {children}
    </WhiteboardContext.Provider>
  )
}
