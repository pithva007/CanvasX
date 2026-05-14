import { createContext, useContext, useState, useCallback } from 'react'

const WhiteboardContext = createContext(null)

export const useWhiteboard = () => {
  const context = useContext(WhiteboardContext)
  if (!context) {
    throw new Error('useWhiteboard must be used within WhiteboardProvider')
  }
  return context
}

export function WhiteboardProvider({ children }) {
  const [roomId, setRoomId] = useState(null)
  const [userId, setUserId] = useState(null)
  const [drawing, setDrawing] = useState({})
  const [darkMode, setDarkMode] = useState(true)
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [selectedTool, setSelectedTool] = useState('draw')
  const [strokeColor, setStrokeColor] = useState('#000000')
  const [fillColor, setFillColor] = useState('#ffffff')
  const [strokeWidth, setStrokeWidth] = useState(2)
  const [users, setUsers] = useState([])
  const [cursors, setCursors] = useState({})

  const updateDrawing = useCallback((updates) => {
    setDrawing((prev) => ({ ...prev, ...updates }))
  }, [])

  const addUser = useCallback((user) => {
    setUsers((prev) => [...prev.filter((u) => u.id !== user.id), user])
  }, [])

  const removeUser = useCallback((userId) => {
    setUsers((prev) => prev.filter((u) => u.id !== userId))
  }, [])

  const updateCursor = useCallback((userId, position) => {
    setCursors((prev) => ({ ...prev, [userId]: position }))
  }, [])

  const clearCanvas = useCallback(() => {
    setDrawing({})
  }, [])

  return (
    <WhiteboardContext.Provider
      value={{
        roomId,
        setRoomId,
        userId,
        setUserId,
        drawing,
        updateDrawing,
        darkMode,
        setDarkMode,
        zoom,
        setZoom,
        pan,
        setPan,
        selectedTool,
        setSelectedTool,
        strokeColor,
        setStrokeColor,
        fillColor,
        setFillColor,
        strokeWidth,
        setStrokeWidth,
        users,
        addUser,
        removeUser,
        cursors,
        updateCursor,
        clearCanvas,
      }}
    >
      {children}
    </WhiteboardContext.Provider>
  )
}
