import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'
import cors from 'cors'
import dotenv from 'dotenv'
import { v4 as uuidv4 } from 'uuid'
import { RoomManager } from './rooms/RoomManager.js'
import { setupSocketHandlers } from './socket/handlers.js'
import { corsMiddleware, loggerMiddleware, errorHandler, isOriginAllowed } from './middleware/common.js'

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
