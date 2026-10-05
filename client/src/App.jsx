import './styles/globals.css'
import { useState, useEffect } from 'react'
import { SocketProvider } from '@/context/SocketContext'
import { WhiteboardProvider } from '@/context/WhiteboardContext'
import { JoinPage } from '@/pages/JoinPage'
import { WhiteboardPage } from '@/pages/WhiteboardPage'
import { AdminPage } from '@/pages/AdminPage'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { SystemAnnouncementBanner } from '@/components/SystemAnnouncementBanner'

function Routes() {
  const [page, setPage] = useState(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname
      const search = window.location.search
      if (path.startsWith('/admin') || search.includes('admin=true') || search.includes('admin=1')) {
        return 'admin'
      }
    }
    return 'join'
  })

  // Handle browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname
      const search = window.location.search
      if (path.startsWith('/admin') || search.includes('admin=true') || search.includes('admin=1')) {
        setPage('admin')
      } else {
        setPage('join')
      }
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  if (page === 'admin') {
    return (
      <AdminPage
        onNavigateBack={() => {
          if (window.history.pushState) {
            window.history.pushState({}, '', '/')
          }
          setPage('join')
        }}
      />
    )
  }

  if (page === 'whiteboard') {
    return <WhiteboardPage onLeaveRoom={() => setPage('join')} />
  }

  return (
    <JoinPage
      onJoinRoom={() => setPage('whiteboard')}
      onNavigateToAdmin={() => {
        if (window.history.pushState) {
          window.history.pushState({}, '', '/admin')
        }
        setPage('admin')
      }}
    />
  )
}

export default function App() {
  return (
    <ErrorBoundary>
      <SocketProvider>
        <WhiteboardProvider>
          <SystemAnnouncementBanner />
          <Routes />
        </WhiteboardProvider>
      </SocketProvider>
    </ErrorBoundary>
  )
}

