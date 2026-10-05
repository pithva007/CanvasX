import { useState, useEffect, useRef, useMemo } from 'react'
import { useSocket } from '@/context/SocketContext'
import { CONFIG } from '@/config'
import {
  Shield,
  Lock,
  Unlock,
  Users,
  Layers,
  Activity,
  Radio,
  Trash2,
  UserX,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Search,
  Copy,
  Check,
  Eye,
  EyeOff,
  Send,
  Filter,
  Clock,
  ChevronRight,
  ChevronDown,
  Info,
  Zap,
  ArrowLeft,
  LogOut,
  Sparkles,
  Crown,
  MousePointer2,
  Terminal,
  Eraser,
  Megaphone,
} from 'lucide-react'

export function AdminPage({ onNavigateBack }) {
  const { socket, connected, serverUrl } = useSocket()

  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [adminToken, setAdminToken] = useState(() => {
    return sessionStorage.getItem('canvasx_admin_token') || ''
  })
  const [passwordInput, setPasswordInput] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [authError, setAuthError] = useState('')
  const [authLoading, setAuthLoading] = useState(false)

  // Dashboard Data
  const [stats, setStats] = useState({
    activeRooms: 0,
    activeUsers: 0,
    totalShapes: 0,
    totalRoomsCreated: 0,
    uptimeSeconds: 0,
    memory: { rssMb: 0, heapUsedMb: 0, heapTotalMb: 0 },
  })
  const [rooms, setRooms] = useState([])
  const [activityLogs, setActivityLogs] = useState([])

  // UI Navigation
  const [activeTab, setActiveTab] = useState('rooms') // 'rooms' | 'users' | 'activity' | 'inspector' | 'broadcast'
  const [searchQuery, setSearchQuery] = useState('')
  const [roomFilter, setRoomFilter] = useState('all') // 'all' | 'solo' | 'multi' | 'empty'
  const [activityCategory, setActivityCategory] = useState('all')
  const [copiedCode, setCopiedCode] = useState(null)
  const [expandedRooms, setExpandedRooms] = useState({})
  const [autoScrollLogs, setAutoScrollLogs] = useState(true)

  // Selected Room for Inspector
  const [selectedInspectRoomCode, setSelectedInspectRoomCode] = useState('')
  const [inspectedRoomData, setInspectedRoomData] = useState(null)
  const [inspectLoading, setInspectLoading] = useState(false)

  // Broadcast state
  const [broadcastMessage, setBroadcastMessage] = useState('')
  const [broadcastTarget, setBroadcastTarget] = useState('ALL')
  const [broadcastLevel, setBroadcastLevel] = useState('info') // 'info' | 'warning' | 'alert'
  const [broadcastSending, setBroadcastSending] = useState(false)
  const [broadcastSuccess, setBroadcastSuccess] = useState('')
  const [broadcastHistory, setBroadcastHistory] = useState([])

  // Modal Dialogs
  const [confirmModal, setConfirmModal] = useState(null) // { type: 'discard'|'kick'|'clear', title, message, actionBtn, onConfirm }
  const [modalReason, setModalReason] = useState('')

  // Ticking clock for solo timers and relative timestamps
  const [nowTimestamp, setNowTimestamp] = useState(Date.now())
  useEffect(() => {
    const interval = setInterval(() => setNowTimestamp(Date.now()), 1000)
    return () => clearInterval(interval)
  }, [])

  // Auto-verify token from sessionStorage on mount
  useEffect(() => {
    if (!socket || !connected) return
    const storedToken = sessionStorage.getItem('canvasx_admin_token')
    if (storedToken) {
      setAuthLoading(true)
      socket.emit('admin:verify_token', { token: storedToken }, (response) => {
        setAuthLoading(false)
        if (response && response.success) {
          setIsAuthenticated(true)
          setAdminToken(storedToken)
          if (response.stats) setStats(response.stats)
          if (response.rooms) setRooms(response.rooms)
          if (response.recentActivity) setActivityLogs(response.recentActivity)
        } else {
          sessionStorage.removeItem('canvasx_admin_token')
          setAdminToken('')
          setIsAuthenticated(false)
        }
      })
    }
  }, [socket, connected])

  // Listen to real-time admin stream
  useEffect(() => {
    if (!socket || !isAuthenticated) return

    const handleActivity = (entry) => {
      setActivityLogs((prev) => [entry, ...prev.slice(0, 249)])
    }

    const handleRoomsUpdate = (data) => {
      if (data.rooms) setRooms(data.rooms)
      if (data.stats) setStats(data.stats)
    }

    socket.on('admin:activity', handleActivity)
    socket.on('admin:rooms_update', handleRoomsUpdate)

    return () => {
      socket.off('admin:activity', handleActivity)
      socket.off('admin:rooms_update', handleRoomsUpdate)
    }
  }, [socket, isAuthenticated])

  // Periodic poll overview if authenticated
  useEffect(() => {
    if (!socket || !isAuthenticated) return

    const interval = setInterval(() => {
      socket.emit('admin:get_overview', (res) => {
        if (res && res.success) {
          if (res.rooms) setRooms(res.rooms)
          if (res.stats) setStats(res.stats)
          if (res.recentActivity && activityLogs.length === 0) {
            setActivityLogs(res.recentActivity)
          }
        }
      })
    }, 5000)

    return () => clearInterval(interval)
  }, [socket, isAuthenticated, activityLogs.length])

  // Handle Login
  const handleLogin = (e) => {
    e?.preventDefault()
    if (!passwordInput.trim()) {
      setAuthError('Please enter the Master Admin Secret Key.')
      return
    }

    setAuthLoading(true)
    setAuthError('')

    if (socket && connected) {
      socket.emit('admin:auth', { password: passwordInput.trim() }, (response) => {
        setAuthLoading(false)
        if (response && response.success) {
          setIsAuthenticated(true)
          setAdminToken(response.token)
          sessionStorage.setItem('canvasx_admin_token', response.token)
          if (response.stats) setStats(response.stats)
          if (response.rooms) setRooms(response.rooms)
          if (response.recentActivity) setActivityLogs(response.recentActivity)
        } else {
          setAuthError(response?.message || 'Access Denied: Invalid Master Admin Secret Key.')
        }
      })
    } else {
      // Fallback REST login
      fetch(`${serverUrl || CONFIG.API_URL}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: passwordInput.trim() }),
      })
        .then((res) => res.json())
        .then((data) => {
          setAuthLoading(false)
          if (data.success && data.token) {
            setIsAuthenticated(true)
            setAdminToken(data.token)
            sessionStorage.setItem('canvasx_admin_token', data.token)
            if (data.stats) setStats(data.stats)
            if (data.rooms) setRooms(data.rooms)
            if (data.recentActivity) setActivityLogs(data.recentActivity)
          } else {
            setAuthError(data.error || 'Access Denied: Invalid Master Admin Secret Key.')
          }
        })
        .catch(() => {
          setAuthLoading(false)
          setAuthError('Network error connecting to whiteboard server.')
        })
    }
  }

  // Handle Logout
  const handleLogout = () => {
    if (socket) {
      socket.emit('admin:logout', () => {})
    }
    sessionStorage.removeItem('canvasx_admin_token')
    setAdminToken('')
    setIsAuthenticated(false)
    setPasswordInput('')
  }

  // Copy helper
  const handleCopy = (text) => {
    navigator.clipboard?.writeText(text)
    setCopiedCode(text)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  // Toggle room expansion
  const toggleRoomExpand = (roomCode) => {
    setExpandedRooms((prev) => ({
      ...prev,
      [roomCode]: !prev[roomCode],
    }))
  }

  // Refresh data manually
  const handleRefresh = () => {
    if (!socket || !isAuthenticated) return
    socket.emit('admin:get_overview', (res) => {
      if (res && res.success) {
        if (res.rooms) setRooms(res.rooms)
        if (res.stats) setStats(res.stats)
        if (res.recentActivity) setActivityLogs(res.recentActivity)
      }
    })
  }

  // Admin Force Discard Room Action
  const triggerDiscardRoom = (roomCode) => {
    setModalReason('Room terminated by Super Admin')
    setConfirmModal({
      type: 'discard',
      title: `Terminate Room [${roomCode}]?`,
      message: `Are you sure you want to force-discard this room? All active collaborators will be disconnected immediately and canvas drawings will be permanently removed.`,
      actionBtn: 'Force Discard Room',
      onConfirm: (reason) => {
        socket?.emit('admin:force_discard_room', { roomCode, reason }, (res) => {
          if (res?.success) {
            handleRefresh()
          }
        })
        setConfirmModal(null)
      },
    })
  }

  // Admin Force Kick User Action
  const triggerKickUser = (userId, userName, roomCode) => {
    setModalReason('Violated collaboration rules')
    setConfirmModal({
      type: 'kick',
      title: `Kick User "${userName || userId}"?`,
      message: `Are you sure you want to kick this user from room [${roomCode}]? They will be immediately disconnected and prevented from rejoining.`,
      actionBtn: 'Kick Collaborator',
      onConfirm: (reason) => {
        socket?.emit('admin:force_kick_user', { roomCode, userId, reason }, (res) => {
          if (res?.success) {
            handleRefresh()
          }
        })
        setConfirmModal(null)
      },
    })
  }

  // Admin Clear Canvas Action
  const triggerClearCanvas = (roomCode) => {
    setModalReason('')
    setConfirmModal({
      type: 'clear',
      title: `Clear Canvas for Room [${roomCode}]?`,
      message: `Are you sure you want to wipe all drawings from this canvas? The room will remain open, but all existing shapes will be reset.`,
      actionBtn: 'Wipe Canvas Drawings',
      onConfirm: () => {
        socket?.emit('admin:clear_canvas', { roomCode }, (res) => {
          if (res?.success) {
            handleRefresh()
          }
        })
        setConfirmModal(null)
      },
    })
  }

  // Inspect Room
  const handleInspectRoom = (roomCode) => {
    setSelectedInspectRoomCode(roomCode)
    setActiveTab('inspector')
    setInspectLoading(true)
    socket?.emit('admin:inspect_room', { roomCode }, (res) => {
      setInspectLoading(false)
      if (res?.success) {
        setInspectedRoomData(res)
      } else {
        setInspectedRoomData(null)
      }
    })
  }

  // Broadcast Announcement
  const handleSendBroadcast = (e) => {
    e?.preventDefault()
    if (!broadcastMessage.trim()) return

    setBroadcastSending(true)
    setBroadcastSuccess('')

    socket?.emit(
      'admin:broadcast_announcement',
      {
        message: broadcastMessage.trim(),
        targetRoomCode: broadcastTarget,
        level: broadcastLevel,
      },
      (res) => {
        setBroadcastSending(false)
        if (res?.success) {
          setBroadcastSuccess(
            `Broadcast delivered successfully to ${
              broadcastTarget === 'ALL' ? 'all active rooms' : `room [${broadcastTarget}]`
            }!`
          )
          setBroadcastHistory((prev) => [res.payload, ...prev])
          setBroadcastMessage('')
          setTimeout(() => setBroadcastSuccess(''), 5000)
        }
      }
    )
  }

  // Filtered rooms
  const filteredRooms = useMemo(() => {
    return rooms.filter((room) => {
      const matchesSearch =
        !searchQuery ||
        room.roomCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        room.adminName.toLowerCase().includes(searchQuery.toLowerCase())

      if (!matchesSearch) return false

      if (roomFilter === 'solo') return room.singleUserDiscardAt != null
      if (roomFilter === 'multi') return room.userCount > 1
      if (roomFilter === 'empty') return room.userCount === 0
      return true
    })
  }, [rooms, searchQuery, roomFilter])

  // All online users flat list
  const allUsersList = useMemo(() => {
    const list = []
    rooms.forEach((room) => {
      if (room.users) {
        room.users.forEach((user) => {
          list.push({
            ...user,
            roomCode: room.roomCode,
            sessionId: room.sessionId,
          })
        })
      }
    })
    if (!searchQuery) return list
    const q = searchQuery.toLowerCase()
    return list.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.roomCode.toLowerCase().includes(q) ||
        u.id.toLowerCase().includes(q)
    )
  }, [rooms, searchQuery])

  // Filtered activity logs
  const filteredLogs = useMemo(() => {
    return activityLogs.filter((log) => {
      if (activityCategory === 'draw') return log.type === 'draw'
      if (activityCategory === 'joins') return log.type === 'user_join' || log.type === 'user_leave'
      if (activityCategory === 'moderation')
        return log.type === 'user_kick' || log.type === 'room_discard' || log.type === 'admin_action'
      if (activityCategory === 'lasers') return log.type === 'laser' || log.type === 'ping'
      return true
    })
  }, [activityLogs, activityCategory])

  // Format uptime
  const formatUptime = (seconds) => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60
    if (h > 0) return `${h}h ${m}m ${s}s`
    if (m > 0) return `${m}m ${s}s`
    return `${s}s`
  }

  // Format solo timer remaining
  const formatTimerRemaining = (discardAt) => {
    if (!discardAt) return null
    const diff = Math.max(0, Math.floor((discardAt - nowTimestamp) / 1000))
    const m = Math.floor(diff / 60)
    const s = diff % 60
    return `${m}:${s < 10 ? '0' : ''}${s}`
  }

  // -------------------------------------------------------------
  // STATE 1: UNLOCKED SUPER ADMIN CONSOLE
  // -------------------------------------------------------------
  if (isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans select-none antialiased">
        {/* Top Super Admin Navigation Header */}
        <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur-md sticky top-0 z-50 px-4 sm:px-6 py-3">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-500/25">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-bold text-base sm:text-lg tracking-tight text-white flex items-center gap-2">
                    CanvasX
                    <span className="text-xs px-2 py-0.5 rounded-full font-mono bg-purple-500/20 text-purple-300 border border-purple-500/30">
                      SUPER ADMIN
                    </span>
                  </h1>
                  <span className="flex items-center gap-1.5 text-[11px] font-mono font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    LIVE
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-mono">
                  Master Control & Site Surveillance
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-wrap">
              <button
                type="button"
                onClick={() => setActiveTab('broadcast')}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1.5 transition-all shadow-sm"
              >
                <Megaphone className="w-3.5 h-3.5" />
                <span>Broadcast</span>
              </button>

              <button
                type="button"
                onClick={handleRefresh}
                className="p-2 rounded-lg text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                title="Refresh Overview"
              >
                <RefreshCw className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={onNavigateBack}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center gap-1.5 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to App</span>
              </button>

              <button
                type="button"
                onClick={handleLogout}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1.5 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Lock Console</span>
              </button>
            </div>
          </div>
        </header>

        {/* Global Key Metrics Ribbon */}
        <section className="bg-slate-900/40 border-b border-slate-800/80 px-4 sm:px-6 py-4">
          <div className="max-w-7xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* Metric 1 */}
            <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-xl flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-400">Active Rooms</p>
                <p className="text-2xl font-bold font-mono text-white mt-0.5">
                  {stats.activeRooms}
                </p>
                <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                  {rooms.filter((r) => r.singleUserDiscardAt).length} solo timer active
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20">
                <Radio className="w-5 h-5" />
              </div>
            </div>

            {/* Metric 2 */}
            <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-xl flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-400">Online Collaborators</p>
                <p className="text-2xl font-bold font-mono text-white mt-0.5">
                  {stats.activeUsers}
                </p>
                <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                  Across all live canvases
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center border border-cyan-500/20">
                <Users className="w-5 h-5" />
              </div>
            </div>

            {/* Metric 3 */}
            <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-xl flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-400">Canvas Shapes</p>
                <p className="text-2xl font-bold font-mono text-white mt-0.5">
                  {stats.totalShapes}
                </p>
                <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                  Authoritative store records
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center border border-purple-500/20">
                <Layers className="w-5 h-5" />
              </div>
            </div>

            {/* Metric 4 */}
            <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-xl flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-400">Server Health</p>
                <p className="text-sm font-bold font-mono text-white mt-1">
                  Up {formatUptime(stats.uptimeSeconds)}
                </p>
                <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                  Heap: {stats.memory?.heapUsedMb || 0} MB / RSS: {stats.memory?.rssMb || 0} MB
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                <Activity className="w-5 h-5" />
              </div>
            </div>
          </div>
        </section>

        {/* Tab Navigation Navigation Bar */}
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 pt-4">
          <nav className="flex items-center gap-2 border-b border-slate-800 pb-3 overflow-x-auto no-scrollbar">
            <button
              type="button"
              onClick={() => setActiveTab('rooms')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
                activeTab === 'rooms'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                  : 'bg-slate-900/60 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Radio className="w-4 h-4" />
              <span>Active Rooms ({rooms.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('users')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
                activeTab === 'users'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                  : 'bg-slate-900/60 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Collaborators ({allUsersList.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('activity')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
                activeTab === 'activity'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                  : 'bg-slate-900/60 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Terminal className="w-4 h-4" />
              <span>Live Activity Feed</span>
              {activityLogs.length > 0 && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/20">
                  {activityLogs.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('inspector')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
                activeTab === 'inspector'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                  : 'bg-slate-900/60 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Canvas Inspector</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('broadcast')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
                activeTab === 'broadcast'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                  : 'bg-slate-900/60 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Megaphone className="w-4 h-4" />
              <span>System Broadcast</span>
            </button>
          </nav>
        </div>

        {/* Tab Content Body */}
        <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 flex-1">
          {/* TAB 1: ACTIVE ROOMS */}
          {activeTab === 'rooms' && (
            <div className="space-y-4">
              {/* Filter and Search Bar */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="relative w-full sm:w-72">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by code or host..."
                    className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>

                <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto no-scrollbar">
                  {[
                    { id: 'all', label: 'All Rooms' },
                    { id: 'solo', label: '⚠️ Solo Timer' },
                    { id: 'multi', label: 'Multiplayer' },
                    { id: 'empty', label: 'Empty' },
                  ].map((chip) => (
                    <button
                      key={chip.id}
                      type="button"
                      onClick={() => setRoomFilter(chip.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                        roomFilter === chip.id
                          ? 'bg-slate-700 text-white'
                          : 'bg-slate-900/60 text-slate-400 hover:text-white'
                      }`}
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Rooms List */}
              {filteredRooms.length === 0 ? (
                <div className="text-center py-16 bg-slate-900/40 border border-slate-800/80 rounded-2xl">
                  <Radio className="w-12 h-12 text-slate-700 mx-auto mb-3" />
                  <p className="text-sm font-medium text-slate-300">No active rooms found</p>
                  <p className="text-xs text-slate-500 mt-1">
                    {searchQuery
                      ? 'Try adjusting your search criteria'
                      : 'Rooms created by users will appear here in real-time'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredRooms.map((room) => {
                    const isTimerActive = Boolean(room.singleUserDiscardAt)
                    const remainingStr = formatTimerRemaining(room.singleUserDiscardAt)
                    const isExpanded = Boolean(expandedRooms[room.roomCode])

                    return (
                      <div
                        key={room.roomCode}
                        className={`bg-slate-900/90 border rounded-2xl p-5 flex flex-col justify-between transition-all shadow-md ${
                          isTimerActive
                            ? 'border-amber-500/40 shadow-amber-500/5'
                            : 'border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div>
                          {/* Room Header */}
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-lg text-white tracking-wider">
                                  {room.roomCode}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleCopy(room.roomCode)}
                                  className="text-slate-500 hover:text-slate-300 p-1"
                                  title="Copy Code"
                                >
                                  {copiedCode === room.roomCode ? (
                                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                                  ) : (
                                    <Copy className="w-3.5 h-3.5" />
                                  )}
                                </button>
                              </div>
                              <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                                <Crown className="w-3.5 h-3.5 text-amber-400" />
                                <span>Host: {room.adminName}</span>
                              </p>
                            </div>

                            {/* Status Tag */}
                            {isTimerActive ? (
                              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-semibold flex items-center gap-1">
                                <Clock className="w-3 h-3 animate-pulse" />
                                {remainingStr}
                              </span>
                            ) : room.userCount > 1 ? (
                              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                                Multiplayer
                              </span>
                            ) : (
                              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                                Empty Grace
                              </span>
                            )}
                          </div>

                          {/* Stats Grid */}
                          <div className="grid grid-cols-2 gap-2 my-4 pt-3 border-t border-slate-800/80">
                            <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/60">
                              <span className="text-[10px] text-slate-500 font-medium uppercase">
                                Collaborators
                              </span>
                              <p className="text-sm font-mono font-bold text-white mt-0.5">
                                {room.userCount} / {room.maxUsers}
                              </p>
                            </div>

                            <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/60">
                              <span className="text-[10px] text-slate-500 font-medium uppercase">
                                Shapes Stored
                              </span>
                              <p className="text-sm font-mono font-bold text-white mt-0.5">
                                {room.shapeCount}
                              </p>
                            </div>
                          </div>

                          {/* 5-Min Timer Warning Notice */}
                          {isTimerActive && (
                            <div className="p-2.5 mb-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-center gap-2">
                              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
                              <span>
                                5-minute single-user discard timer active. Closes in{' '}
                                <strong className="font-mono">{remainingStr}</strong>.
                              </span>
                            </div>
                          )}

                          {/* Expandable Users List */}
                          <button
                            type="button"
                            onClick={() => toggleRoomExpand(room.roomCode)}
                            className="w-full flex items-center justify-between text-xs text-slate-400 hover:text-white py-1.5 transition-colors"
                          >
                            <span>Participants ({room.users?.length || 0})</span>
                            {isExpanded ? (
                              <ChevronDown className="w-4 h-4" />
                            ) : (
                              <ChevronRight className="w-4 h-4" />
                            )}
                          </button>

                          {isExpanded && (
                            <div className="mt-2 space-y-1.5 max-h-40 overflow-y-auto pr-1">
                              {room.users && room.users.length > 0 ? (
                                room.users.map((u) => (
                                  <div
                                    key={u.id}
                                    className="flex items-center justify-between p-2 rounded-lg bg-slate-950 border border-slate-800/80 text-xs"
                                  >
                                    <div className="flex items-center gap-2 min-w-0">
                                      <span
                                        className="w-2.5 h-2.5 rounded-full shrink-0"
                                        style={{ backgroundColor: u.color || '#3b82f6' }}
                                      />
                                      <span className="font-medium text-white truncate">
                                        {u.name}
                                      </span>
                                      {u.isAdmin && (
                                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-mono">
                                          Host
                                        </span>
                                      )}
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        triggerKickUser(u.id, u.name, room.roomCode)
                                      }
                                      className="text-rose-400 hover:text-rose-300 p-1 hover:bg-rose-500/10 rounded transition-colors"
                                      title="Kick User"
                                    >
                                      <UserX className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                ))
                              ) : (
                                <p className="text-xs text-slate-500 italic py-1">
                                  No participants currently in room
                                </p>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Room Action Buttons */}
                        <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between gap-2 mt-4">
                          <button
                            type="button"
                            onClick={() => handleInspectRoom(room.roomCode)}
                            className="flex-1 py-1.5 px-3 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center gap-1.5 transition-colors"
                          >
                            <Layers className="w-3.5 h-3.5 text-indigo-400" />
                            <span>Inspect</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => triggerClearCanvas(room.roomCode)}
                            className="p-1.5 rounded-lg text-xs bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-amber-400 transition-colors"
                            title="Clear Canvas"
                          >
                            <Eraser className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => triggerDiscardRoom(room.roomCode)}
                            className="p-1.5 rounded-lg text-xs bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition-colors"
                            title="Force Discard Room"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: ONLINE COLLABORATORS */}
          {activeTab === 'users' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div className="relative w-full sm:w-80">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search collaborator name, socket ID, room..."
                    className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <span className="text-xs text-slate-400 font-mono whitespace-nowrap">
                  Total Users: {allUsersList.length}
                </span>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 font-medium">
                      <tr>
                        <th className="px-4 py-3">Collaborator</th>
                        <th className="px-4 py-3">Room Code</th>
                        <th className="px-4 py-3">Role</th>
                        <th className="px-4 py-3">Socket ID</th>
                        <th className="px-4 py-3 text-right">Moderation</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-mono">
                      {allUsersList.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="text-center py-12 text-slate-500">
                            No online collaborators found
                          </td>
                        </tr>
                      ) : (
                        allUsersList.map((user) => (
                          <tr key={user.id} className="hover:bg-slate-800/30 transition-colors">
                            <td className="px-4 py-3 font-sans font-medium text-white flex items-center gap-2">
                              <span
                                className="w-3 h-3 rounded-full shrink-0"
                                style={{ backgroundColor: user.color || '#3b82f6' }}
                              />
                              <span>{user.name}</span>
                            </td>
                            <td className="px-4 py-3 text-slate-300 font-bold">
                              {user.roomCode}
                            </td>
                            <td className="px-4 py-3">
                              {user.isAdmin ? (
                                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px]">
                                  Room Host
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 text-[10px]">
                                  Collaborator
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-slate-500 text-[11px]">
                              {user.id}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <button
                                type="button"
                                onClick={() =>
                                  triggerKickUser(user.id, user.name, user.roomCode)
                                }
                                className="px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-sans transition-colors inline-flex items-center gap-1"
                              >
                                <UserX className="w-3 h-3" />
                                <span>Kick</span>
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: REAL-TIME ACTIVITY STREAM */}
          {activeTab === 'activity' && (
            <div className="space-y-4">
              {/* Category Filter and Controls */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar w-full sm:w-auto">
                  {[
                    { id: 'all', label: 'All Events' },
                    { id: 'draw', label: '🎨 Drawing' },
                    { id: 'joins', label: '👥 Joins / Leaves' },
                    { id: 'moderation', label: '⚡ Moderation & Kicks' },
                    { id: 'lasers', label: '🔦 Lasers & Pings' },
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setActivityCategory(cat.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                        activityCategory === cat.id
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-900 text-slate-400 hover:text-white'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActivityLogs([])}
                    className="px-2.5 py-1 rounded-lg text-xs bg-slate-900 hover:bg-slate-800 text-slate-400 border border-slate-800 transition-colors"
                  >
                    Clear Stream
                  </button>
                </div>
              </div>

              {/* Feed Stream */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 max-h-[600px] overflow-y-auto space-y-2 font-mono text-xs shadow-inner">
                {filteredLogs.length === 0 ? (
                  <div className="text-center py-16 text-slate-500 font-sans">
                    <Terminal className="w-10 h-10 text-slate-700 mx-auto mb-2" />
                    <p className="text-sm">No activity recorded in this category yet</p>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Actions like drawings, joins, pings, and kicks appear here in real-time
                    </p>
                  </div>
                ) : (
                  filteredLogs.map((log) => {
                    const timeStr = new Date(log.timestamp).toLocaleTimeString()
                    return (
                      <div
                        key={log.id}
                        className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80 hover:border-slate-700/80 transition-colors"
                      >
                        <span className="text-slate-500 shrink-0 text-[11px] mt-0.5">
                          {timeStr}
                        </span>

                        <span
                          className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold shrink-0 ${
                            log.type === 'draw'
                              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                              : log.type === 'user_join'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : log.type === 'user_leave'
                              ? 'bg-slate-800 text-slate-400 border border-slate-700'
                              : log.type === 'user_kick'
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              : log.type === 'room_discard'
                              ? 'bg-rose-900/40 text-rose-200 border border-rose-700/50'
                              : log.type === 'laser'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : log.type === 'ping'
                              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                              : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                          }`}
                        >
                          {log.type}
                        </span>

                        {log.roomCode && (
                          <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-bold shrink-0 text-[10px]">
                            [{log.roomCode}]
                          </span>
                        )}

                        <div className="flex-1 text-slate-300 break-words font-sans text-xs">
                          {log.userName && (
                            <strong className="text-white font-semibold mr-1">
                              {log.userName}:
                            </strong>
                          )}
                          <span>{log.details}</span>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          )}

          {/* TAB 4: CANVAS INSPECTOR */}
          {activeTab === 'inspector' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-medium text-slate-400">Select Room to Inspect:</span>
                  <select
                    value={selectedInspectRoomCode}
                    onChange={(e) => handleInspectRoom(e.target.value)}
                    className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">-- Choose Active Room --</option>
                    {rooms.map((r) => (
                      <option key={r.roomCode} value={r.roomCode}>
                        {r.roomCode} ({r.userCount} users, {r.shapeCount} shapes)
                      </option>
                    ))}
                  </select>
                </div>

                {selectedInspectRoomCode && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleInspectRoom(selectedInspectRoomCode)}
                      className="px-3 py-1.5 rounded-lg text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center gap-1.5"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Re-inspect</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => triggerClearCanvas(selectedInspectRoomCode)}
                      className="px-3 py-1.5 rounded-lg text-xs bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1.5"
                    >
                      <Eraser className="w-3.5 h-3.5" />
                      <span>Wipe Drawings</span>
                    </button>
                  </div>
                )}
              </div>

              {inspectLoading ? (
                <div className="text-center py-16 text-slate-400">
                  <RefreshCw className="w-8 h-8 animate-spin mx-auto text-indigo-400 mb-2" />
                  <p className="text-sm">Fetching authoritative canvas document snapshot...</p>
                </div>
              ) : inspectedRoomData ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  {/* Left Column: Metadata */}
                  <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
                    <h3 className="font-bold text-sm text-white">Document Snapshot</h3>
                    <div className="space-y-2 text-xs font-mono">
                      <div className="flex justify-between py-1 border-b border-slate-800">
                        <span className="text-slate-400 font-sans">Room Code</span>
                        <span className="text-white font-bold">{inspectedRoomData.room.roomCode}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-800">
                        <span className="text-slate-400 font-sans">Host User</span>
                        <span className="text-white">{inspectedRoomData.room.adminName}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-800">
                        <span className="text-slate-400 font-sans">Shape Records</span>
                        <span className="text-emerald-400 font-bold">
                          {inspectedRoomData.snapshotMeta?.shapesCount || 0}
                        </span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-800">
                        <span className="text-slate-400 font-sans">Total Store Records</span>
                        <span className="text-white">
                          {inspectedRoomData.snapshotMeta?.recordsCount || 0}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right 2 Columns: Shapes Sample list */}
                  <div className="lg:col-span-2 bg-slate-900/80 border border-slate-800 rounded-2xl p-5">
                    <h3 className="font-bold text-sm text-white mb-3">
                      Canvas Shapes Preview ({inspectedRoomData.shapesSample?.length || 0})
                    </h3>
                    <div className="max-h-96 overflow-y-auto space-y-2 font-mono text-xs">
                      {inspectedRoomData.shapesSample?.length === 0 ? (
                        <p className="text-slate-500 italic py-6 text-center">
                          Canvas is currently blank (0 shapes drawn)
                        </p>
                      ) : (
                        inspectedRoomData.shapesSample.map((s, idx) => (
                          <div
                            key={s.id || idx}
                            className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs"
                          >
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-bold text-[10px]">
                                {s.props?.geo || s.type || 'shape'}
                              </span>
                              <span className="text-slate-400 text-[11px] truncate max-w-xs">
                                ID: {s.id}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 text-[11px] text-slate-500">
                              {s.props?.color && (
                                <span className="flex items-center gap-1">
                                  Color: <strong className="text-white">{s.props.color}</strong>
                                </span>
                              )}
                              <span>
                                pos: ({Math.round(s.x || 0)}, {Math.round(s.y || 0)})
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-16 bg-slate-900/40 border border-slate-800 rounded-2xl text-slate-500">
                  <p className="text-sm">Select a room from the dropdown above to inspect its live canvas state</p>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: SYSTEM BROADCAST */}
          {activeTab === 'broadcast' && (
            <div className="max-w-2xl mx-auto space-y-6">
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Megaphone className="w-5 h-5 text-indigo-400" />
                    <span>Send System Announcement</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Broadcast high-priority notifications to collaborators currently drawing on the site.
                  </p>
                </div>

                <form onSubmit={handleSendBroadcast} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Announcement Message
                    </label>
                    <textarea
                      rows={3}
                      value={broadcastMessage}
                      onChange={(e) => setBroadcastMessage(e.target.value)}
                      placeholder="e.g., Server maintenance scheduled in 15 minutes. Please save your work."
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        Target Audience
                      </label>
                      <select
                        value={broadcastTarget}
                        onChange={(e) => setBroadcastTarget(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                      >
                        <option value="ALL">Global (All Rooms & Visitors)</option>
                        {rooms.map((r) => (
                          <option key={r.roomCode} value={r.roomCode}>
                            Room [{r.roomCode}] ({r.userCount} users)
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        Severity Level
                      </label>
                      <select
                        value={broadcastLevel}
                        onChange={(e) => setBroadcastLevel(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                      >
                        <option value="info">Info (Blue Notice)</option>
                        <option value="warning">Warning (Amber Alert)</option>
                        <option value="alert">Critical Urgent (Red Banner)</option>
                      </select>
                    </div>
                  </div>

                  {/* Live Banner Preview */}
                  {broadcastMessage && (
                    <div className="pt-2">
                      <span className="text-[11px] font-mono text-slate-500 uppercase block mb-1.5">
                        Live Preview as Seen by Users:
                      </span>
                      <div
                        className={`p-3.5 rounded-xl border flex items-center gap-3 ${
                          broadcastLevel === 'alert'
                            ? 'bg-rose-950/80 border-rose-500/50 text-rose-100'
                            : broadcastLevel === 'warning'
                            ? 'bg-amber-950/80 border-amber-500/50 text-amber-100'
                            : 'bg-indigo-950/80 border-indigo-500/50 text-indigo-100'
                        }`}
                      >
                        <Megaphone className="w-5 h-5 shrink-0" />
                        <div className="text-xs">
                          <strong className="block text-[10px] font-bold uppercase tracking-wider mb-0.5">
                            {broadcastLevel === 'alert'
                              ? 'CRITICAL ALERT'
                              : broadcastLevel === 'warning'
                              ? 'SYSTEM WARNING'
                              : 'ADMIN ANNOUNCEMENT'}
                          </strong>
                          <span>{broadcastMessage}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {broadcastSuccess && (
                    <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" />
                      <span>{broadcastSuccess}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={broadcastSending || !broadcastMessage.trim()}
                    className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white flex items-center justify-center gap-2 transition-all shadow-md shadow-indigo-600/20"
                  >
                    {broadcastSending ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                    <span>Broadcast Now to All Users</span>
                  </button>
                </form>
              </div>
            </div>
          )}
        </main>

        {/* Confirmation Modal */}
        {confirmModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-white">{confirmModal.title}</h4>
                  <p className="text-xs text-slate-400 mt-0.5 font-sans leading-relaxed">
                    {confirmModal.message}
                  </p>
                </div>
              </div>

              {confirmModal.type !== 'clear' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Reason provided to collaborators:
                  </label>
                  <input
                    type="text"
                    value={modalReason}
                    onChange={(e) => setModalReason(e.target.value)}
                    placeholder="Enter reason..."
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800/80">
                <button
                  type="button"
                  onClick={() => setConfirmModal(null)}
                  className="px-4 py-2 rounded-xl text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => confirmModal.onConfirm(modalReason)}
                  className="px-4 py-2 rounded-xl text-xs font-medium bg-rose-600 hover:bg-rose-500 text-white transition-colors shadow-lg shadow-rose-600/20"
                >
                  {confirmModal.actionBtn}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  // -------------------------------------------------------------
  // STATE 2: LOCKED MASTER ADMIN LOGIN SCREEN
  // -------------------------------------------------------------
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Background Neon Glow Aura */}
      <div className="absolute w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-3xl pointer-events-none -top-32 -left-32 animate-pulse" />
      <div className="absolute w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-3xl pointer-events-none -bottom-32 -right-32 animate-pulse" />

      <div className="max-w-md w-full bg-slate-900/90 border border-slate-800/90 backdrop-blur-xl rounded-3xl p-7 shadow-2xl relative z-10 space-y-6">
        {/* Header Icon & Title */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-cyan-400 mx-auto flex items-center justify-center shadow-xl shadow-indigo-600/25">
            <Shield className="w-7 h-7 text-white" />
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">Super Admin Console</h2>
          <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
            Restricted access portal for real-time site surveillance, room tracking, and moderation.
          </p>
        </div>

        {/* Error Alert */}
        {authError && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2 animate-shake">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{authError}</span>
          </div>
        )}

        {/* Password Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Master Admin Secret Key
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="Enter secret key..."
                autoFocus
                className="w-full pl-4 pr-10 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors font-mono"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={authLoading}
            className="w-full py-3 px-4 rounded-xl text-sm font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-600/25 active:scale-[0.98]"
          >
            {authLoading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Unlock className="w-4 h-4" />
            )}
            <span>Unlock Console</span>
          </button>
        </form>

        {/* Footer Actions */}
        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-500">
          <button
            type="button"
            onClick={onNavigateBack}
            className="hover:text-slate-300 flex items-center gap-1 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to App</span>
          </button>
          <span className="font-mono text-[11px] text-slate-600">CanvasX v1.0</span>
        </div>
      </div>
    </div>
  )
}
