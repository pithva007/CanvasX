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

const cleanUrl = (url) => {
  if (!url) return ''
  let cleaned = url.trim()
  cleaned = cleaned.replace(/\/+$/, '')
  cleaned = cleaned.replace(/\/socket\.io$/i, '')
  cleaned = cleaned.replace(/\/+$/, '')
  return cleaned
}

export function SocketProvider({ children }) {
  const [serverUrl, setServerUrl] = useState(() => {
    const rawUrl =
      localStorage.getItem('drawtogether_server_url') ||
      import.meta.env.VITE_SOCKET_URL ||
      'http://localhost:3001'
    return cleanUrl(rawUrl)
  })
  const [socket, setSocket] = useState(null)
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    if (!serverUrl) return

    const newSocket = io(serverUrl, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      // Keep retrying forever — on hosts like Render the WebSocket can drop and
      // giving up (the old default of 5) would permanently break sync.
      reconnectionAttempts: Infinity,
      transports: ['websocket', 'polling'],
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

    const cleaned = cleanUrl(formattedUrl)

    if (cleaned) {
      localStorage.setItem('drawtogether_server_url', cleaned)
      setServerUrl(cleaned)
      setConnected(false)
    }
  }

  return (
    <SocketContext.Provider value={{ socket, connected, serverUrl, updateServerUrl }}>
      {children}
    </SocketContext.Provider>
  )
}
