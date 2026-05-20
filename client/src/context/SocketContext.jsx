import { createContext, useContext, useState, useEffect } from 'react'
import io from 'socket.io-client'

const SocketContext = createContext(null)

export const useSocket = () => {
  const context = useContext(SocketContext)
  if (!context) {
    throw new Error('useSocket must be used within SocketProvider')
  }
  return context
}

export function SocketProvider({ children }) {
  const [serverUrl, setServerUrl] = useState(() => {
    return (
      localStorage.getItem('drawtogether_server_url') ||
      import.meta.env.VITE_SOCKET_URL ||
      'http://localhost:3001'
    )
  })
  const [socket, setSocket] = useState(null)
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    if (!serverUrl) return

    const newSocket = io(serverUrl, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    })

    newSocket.on('connect', () => {
      setConnected(true)
    })

    newSocket.on('disconnect', () => {
      setConnected(false)
    })

    setSocket(newSocket)

    return () => {
      newSocket.disconnect()
    }
  }, [serverUrl])

  const updateServerUrl = (url) => {
    let formattedUrl = url.trim()
    if (formattedUrl && !/^https?:\/\//i.test(formattedUrl)) {
      formattedUrl = 'http://' + formattedUrl
    }

    if (formattedUrl) {
      localStorage.setItem('drawtogether_server_url', formattedUrl)
      setServerUrl(formattedUrl)
      setConnected(false)
    }
  }

  return (
    <SocketContext.Provider value={{ socket, connected, serverUrl, updateServerUrl }}>
      {children}
    </SocketContext.Provider>
  )
}
