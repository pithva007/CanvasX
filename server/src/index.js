import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'
import cors from 'cors'
import dotenv from 'dotenv'
import { v4 as uuidv4 } from 'uuid'
import { RoomManager } from './rooms/RoomManager.js'
import { setupSocketHandlers } from './socket/handlers.js'
import { corsMiddleware, loggerMiddleware, errorHandler, isOriginAllowed } from './middleware/common.js'
import { verifyAdminPassword, createAdminSession, adminAuthMiddleware } from './admin/adminAuth.js'

dotenv.config()

const app = express()
const server = createServer(app)
const PORT = process.env.PORT || 3001
const NODE_ENV = process.env.NODE_ENV || 'development'
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173'

// Determine allowed origin for CORS
const allowedOrigin = CLIENT_URL ? CLIENT_URL.replace(/\/$/, '') : '*'

// Middleware
app.use(corsMiddleware)
app.use(loggerMiddleware)
app.use(express.json())
app.use(express.static('public'))

// Socket.IO setup with proper CORS
const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      if (!origin || isOriginAllowed(origin)) {
        callback(null, true)
      } else {
        callback(new Error('Not allowed by CORS'))
      }
    },
    methods: ['GET', 'POST'],
    credentials: true,
  },
  transports: ['websocket', 'polling'],
  allowEIO3: true,
})

// Room manager
const roomManager = new RoomManager()

// Store io and roomManager in app for later use
app.locals.io = io
app.locals.roomManager = roomManager

// Basic routes
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: NODE_ENV,
    activeRooms: roomManager.getRoomCount(),
    activeUsers: roomManager.getUserCount(),
  })
})

app.get('/api/stats', (req, res) => {
  res.json({
    rooms: roomManager.getRoomCount(),
    users: roomManager.getUserCount(),
    timestamp: new Date().toISOString(),
  })
})

// Super Admin REST API
app.post('/api/admin/login', (req, res) => {
  const { password } = req.body || {}
  if (!verifyAdminPassword(password)) {
    return res.status(401).json({
      success: false,
      error: 'Invalid Super Admin Secret Key. Access Denied.',
    })
  }

  const token = createAdminSession()
  res.json({
    success: true,
    token,
    role: 'super_admin',
    stats: roomManager.getGlobalStats(),
    rooms: roomManager.getDetailedRoomsList(),
    recentActivity: roomManager.getActivityLogs(100),
  })
})

app.get('/api/admin/overview', adminAuthMiddleware, (req, res) => {
  res.json({
    success: true,
    stats: roomManager.getGlobalStats(),
    rooms: roomManager.getDetailedRoomsList(),
    users: roomManager.getAllUsersList(),
    recentActivity: roomManager.getActivityLogs(100),
  })
})

app.post('/api/admin/broadcast', adminAuthMiddleware, (req, res) => {
  const { message, targetRoomCode, level = 'info' } = req.body || {}
  if (!message || !message.trim()) {
    return res.status(400).json({ error: 'Message is required' })
  }

  const payload = {
    id: `ann_${Date.now()}`,
    message: message.trim(),
    level,
    sender: 'Super Admin',
    timestamp: Date.now(),
  }

  if (targetRoomCode && targetRoomCode !== 'ALL') {
    const room = roomManager.getRoomByCode(targetRoomCode)
    if (!room) return res.status(404).json({ error: 'Room not found' })
    io.to(room.sessionId).emit('system:announcement', payload)
    roomManager.logActivity({
      type: 'broadcast',
      roomCode: room.roomCode,
      details: `Broadcast to [${room.roomCode}]: "${payload.message}"`,
    })
  } else {
    io.emit('system:announcement', payload)
    roomManager.logActivity({
      type: 'broadcast',
      roomCode: 'ALL_ROOMS',
      details: `Global broadcast: "${payload.message}"`,
    })
  }

  res.json({ success: true, payload })
})

app.post('/api/admin/rooms/:roomCode/discard', adminAuthMiddleware, (req, res) => {
  const { roomCode } = req.params
  const { reason } = req.body || {}
  const room = roomManager.getRoomByCode(roomCode)
  if (!room) return res.status(404).json({ error: 'Room not found' })

  const discardReason = reason || 'Terminated by Super Admin'
  roomManager.logActivity({
    type: 'room_discard',
    roomCode: room.roomCode,
    details: `Super Admin force-discarded room: "${discardReason}"`,
  })

  roomManager.discardRoom(room.sessionId, discardReason)
  res.json({ success: true, roomCode })
})

app.post('/api/admin/users/:userId/kick', adminAuthMiddleware, (req, res) => {
  const { userId } = req.params
  const { reason, roomCode } = req.body || {}
  const room = roomCode ? roomManager.getRoomByCode(roomCode) : roomManager.getRoomForUser(userId)
  if (!room) return res.status(404).json({ error: 'User/Room not found' })

  const targetSocket = io.sockets.sockets.get(userId)
  if (targetSocket) {
    targetSocket.data = targetSocket.data || {}
    targetSocket.data.kicked = true
    targetSocket.leave(room.sessionId)
  }

  const kickReason = reason || 'Removed by Super Admin'
  io.to(userId).emit('room:kicked', { message: kickReason, roomCode: room.roomCode })

  room.kickUser(userId)
  const removeResult = roomManager.removeUserFromRoom(userId)
  if (removeResult && !removeResult.roomDeleted) {
    io.to(room.sessionId).emit('room:user-left', {
      userId,
      users: room.getUsers().map((u) => ({
        id: u.id,
        name: u.name,
        color: u.color,
        isAdmin: u.id === room.adminId,
      })),
      adminId: room.adminId,
    })
    io.to(room.sessionId).emit('presence:leave', { userId })
  }

  roomManager.logActivity({
    type: 'user_kick',
    roomCode: room.roomCode,
    userId,
    details: `Super Admin kicked user ${userId}`,
  })

  res.json({ success: true, userId })
})

// Setup Socket.IO event handlers
setupSocketHandlers(io, roomManager)

// Error handling middleware
app.use(errorHandler)

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    path: req.path,
  })
})

// Start server
server.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════╗
║  CanvasX - Whiteboard Server           ║
║  Version: 1.0.0                        ║
║  Environment: ${NODE_ENV.padEnd(29)}║
║  Server running on port ${PORT}               ║
╚════════════════════════════════════════╝

API Health: http://localhost:${PORT}/health
CORS Origin: ${allowedOrigin}
  `)
})

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\nShutting down gracefully...')
  server.close(() => {
    console.log('Server closed')
    process.exit(0)
  })
})

process.on('SIGTERM', () => {
  console.log('\n\nTerminating...')
  server.close(() => {
    console.log('Server closed')
    process.exit(0)
  })
})

export { app, server, io, roomManager }
