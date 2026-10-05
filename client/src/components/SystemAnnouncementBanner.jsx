import { useState, useEffect } from 'react'
import { useSocket } from '@/context/SocketContext'
import { Info, AlertTriangle, AlertCircle, X, Megaphone } from 'lucide-react'

export function SystemAnnouncementBanner() {
  const { socket } = useSocket()
  const [announcement, setAnnouncement] = useState(null)

  useEffect(() => {
    if (!socket) return

    const handleAnnouncement = (data) => {
      setAnnouncement(data)
    }

    socket.on('system:announcement', handleAnnouncement)

    return () => {
      socket.off('system:announcement', handleAnnouncement)
    }
  }, [socket])

  // Auto-dismiss after 15 seconds
  useEffect(() => {
    if (!announcement) return

    const timer = setTimeout(() => {
      setAnnouncement(null)
    }, 15000)

    return () => clearTimeout(timer)
  }, [announcement])

  if (!announcement) return null

  const levelStyles = {
    info: {
      bg: 'bg-indigo-950/90 border-indigo-500/50 text-indigo-100',
      badge: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
      icon: <Info className="w-5 h-5 text-indigo-400 shrink-0" />,
    },
    warning: {
      bg: 'bg-amber-950/90 border-amber-500/50 text-amber-100',
      badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
      icon: <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />,
    },
    alert: {
      bg: 'bg-rose-950/90 border-rose-500/50 text-rose-100',
      badge: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
      icon: <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />,
    },
  }

  const currentStyle = levelStyles[announcement.level] || levelStyles.info

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[99999] max-w-2xl w-[92%] sm:w-auto animate-bounce-in shadow-2xl">
      <div
        className={`flex items-start sm:items-center gap-3 px-4 py-3 rounded-xl border backdrop-blur-md transition-all ${currentStyle.bg}`}
      >
        <div className="p-1 rounded-lg bg-white/10 shrink-0 mt-0.5 sm:mt-0">
          <Megaphone className="w-5 h-5 text-white" />
        </div>

        <div className="flex-1 min-w-0 pr-2">
          <div className="flex items-center gap-2 mb-0.5">
            <span
              className={`text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full border ${currentStyle.badge}`}
            >
              {announcement.level === 'alert'
                ? 'CRITICAL ALERT'
                : announcement.level === 'warning'
                ? 'SYSTEM WARNING'
                : 'ADMIN ANNOUNCEMENT'}
            </span>
            <span className="text-[11px] text-white/50 font-mono">
              {new Date(announcement.timestamp || Date.now()).toLocaleTimeString()}
            </span>
          </div>
          <p className="text-sm font-medium leading-snug break-words text-white/95">
            {announcement.message}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setAnnouncement(null)}
          className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors shrink-0"
          title="Dismiss notification"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
