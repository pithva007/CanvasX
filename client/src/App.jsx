import './styles/globals.css'
import { useState } from 'react'
import { SocketProvider } from '@/context/SocketContext'
import { WhiteboardProvider } from '@/context/WhiteboardContext'
import { JoinPage } from '@/pages/JoinPage'
import { WhiteboardPage } from '@/pages/WhiteboardPage'
import { ErrorBoundary } from '@/components/ErrorBoundary'

function Routes() {
  const [page, setPage] = useState('join')

  return page === 'join' ? (
    <JoinPage onJoinRoom={() => setPage('whiteboard')} />
  ) : (
    <WhiteboardPage onLeaveRoom={() => setPage('join')} />
  )
}

export default function App() {
  return (
    <ErrorBoundary>
      <SocketProvider>
        <WhiteboardProvider>
          <Routes />
        </WhiteboardProvider>
      </SocketProvider>
    </ErrorBoundary>
  )
}
