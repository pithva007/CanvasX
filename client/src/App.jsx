import './styles/globals.css'
import { useState } from 'react'
import { SocketProvider } from '@/context/SocketContext'
import { WhiteboardProvider } from '@/context/WhiteboardContext'
import { JoinPage } from '@/pages/JoinPage'
import { WhiteboardPage } from '@/pages/WhiteboardPage'
import { ErrorBoundary } from '@/components/ErrorBoundary'

export default function App() {
  const [currentPage, setCurrentPage] = useState('join')
  const [roomId, setRoomId] = useState(null)

  const handleJoinRoom = (newRoomId) => {
    setRoomId(newRoomId)
    setCurrentPage('whiteboard')
  }

  const handleLeaveRoom = () => {
    setRoomId(null)
    setCurrentPage('join')
  }

  return (
    <ErrorBoundary>
      <SocketProvider>
        <WhiteboardProvider>
          {currentPage === 'join' ? (
            <JoinPage onJoinRoom={handleJoinRoom} />
          ) : (
            <WhiteboardPage roomId={roomId} onLeaveRoom={handleLeaveRoom} />
          )}
        </WhiteboardProvider>
      </SocketProvider>
    </ErrorBoundary>
  )
}
