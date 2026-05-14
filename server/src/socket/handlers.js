import { v4 as uuidv4 } from 'uuid'

/**
 * Setup all Socket.IO event handlers
 */
export function setupSocketHandlers(io, roomManager) {
  io.on('connection', (socket) => {
    console.log(`[Socket] User connected: ${socket.id}`)

    let currentRoomId = null
    let currentUserId = null

    /**
     * Room: Join room with password
     */
    socket.on('room:join', (data, callback) => {
      try {
        const { password, roomId } = data

        // If roomId provided, join existing room
        if (roomId) {
          const room = roomManager.getRoomBySessionId(roomId)
          if (!room) {
            return callback({
              success: false,
              message: 'Room not found',
            })
          }

          // Check if room password matches
          if (room.password !== password) {
            return callback({
              success: false,
              message: 'Invalid password',
            })
          }

          currentRoomId = roomId
          currentUserId = socket.id
        } else if (password) {
          // Create or get room by password
          const userId = socket.id
          const user = {
            id: userId,
            socketId: socket.id,
            name: `User-${userId.substring(0, 6)}`,
            connectedAt: new Date(),
            cursor: { x: 0, y: 0 },
          }

          const result = roomManager.addUserToRoom(password, user)

          if (!result.success) {
            return callback({
              success: false,
              message: result.message,
            })
          }

          currentRoomId = result.roomId
          currentUserId = userId
        } else {
          return callback({
            success: false,
            message: 'Password or roomId required',
          })
        }

        // Join socket to room
        socket.join(currentRoomId)

        // Notify others in room
        socket.to(currentRoomId).emit('room:user-joined', {
          user: {
            id: currentUserId,
            name: `User-${currentUserId.substring(0, 6)}`,
            connectedAt: new Date(),
          },
          userCount: roomManager.getRoomState(currentRoomId)?.users.length || 1,
        })

        // Send current room state to user
        const roomState = roomManager.getRoomState(currentRoomId)
        callback({
          success: true,
          roomId: currentRoomId,
          userId: currentUserId,
          roomState: roomState,
        })

        console.log(`[Room] User ${currentUserId} joined room ${currentRoomId}`)
      } catch (error) {
        console.error('[Socket Error] room:join:', error)
        callback({
          success: false,
          message: 'Failed to join room',
        })
      }
    })

    /**
     * Room: Leave room
     */
    socket.on('room:leave', (data) => {
      try {
        if (!currentRoomId) return

        const result = roomManager.removeUserFromRoom(currentUserId)

        socket.leave(currentRoomId)
        socket.to(currentRoomId).emit('room:user-left', {
          userId: currentUserId,
          userCount: roomManager.getRoomState(currentRoomId)?.users.length || 0,
        })

        console.log(`[Room] User ${currentUserId} left room ${currentRoomId}`)

        currentRoomId = null
        currentUserId = null
      } catch (error) {
        console.error('[Socket Error] room:leave:', error)
      }
    })

    /**
     * Drawing: Update drawing
     */
    socket.on('draw:update', (data) => {
      try {
        if (!currentRoomId) return

        roomManager.updateRoomDrawing(currentRoomId, data)

        // Broadcast to room
        socket.to(currentRoomId).emit('draw:update', {
          ...data,
          userId: currentUserId,
          timestamp: Date.now(),
        })
      } catch (error) {
        console.error('[Socket Error] draw:update:', error)
      }
    })

    /**
     * Drawing: Clear canvas
     */
    socket.on('draw:clear', (data) => {
      try {
        if (!currentRoomId) return

        roomManager.clearRoomDrawing(currentRoomId)

        // Broadcast to room
        socket.to(currentRoomId).emit('draw:clear', {
          userId: currentUserId,
          timestamp: Date.now(),
        })
      } catch (error) {
        console.error('[Socket Error] draw:clear:', error)
      }
    })

    /**
     * Cursor: Move cursor
     */
    socket.on('cursor:move', (data) => {
      try {
        if (!currentRoomId) return

        socket.to(currentRoomId).emit('cursor:move', {
          userId: currentUserId,
          position: data.position || { x: 0, y: 0 },
          timestamp: Date.now(),
        })
      } catch (error) {
        console.error('[Socket Error] cursor:move:', error)
      }
    })

    /**
     * Canvas: Update zoom
     */
    socket.on('canvas:zoom', (data) => {
      try {
        if (!currentRoomId) return

        socket.to(currentRoomId).emit('canvas:zoom', {
          zoom: data.zoom,
          userId: currentUserId,
          timestamp: Date.now(),
        })
      } catch (error) {
        console.error('[Socket Error] canvas:zoom:', error)
      }
    })

    /**
     * Canvas: Update pan
     */
    socket.on('canvas:pan', (data) => {
      try {
        if (!currentRoomId) return

        socket.to(currentRoomId).emit('canvas:pan', {
          pan: data.pan || { x: 0, y: 0 },
          userId: currentUserId,
          timestamp: Date.now(),
        })
      } catch (error) {
        console.error('[Socket Error] canvas:pan:', error)
      }
    })

    /**
     * File: Upload image
     */
    socket.on('file:upload', (data) => {
      try {
        if (!currentRoomId) return

        socket.to(currentRoomId).emit('file:upload', {
          fileData: data.fileData,
          fileName: data.fileName,
          userId: currentUserId,
          timestamp: Date.now(),
        })
      } catch (error) {
        console.error('[Socket Error] file:upload:', error)
      }
    })

    /**
     * Room: Get current state
     */
    socket.on('room:get-state', (data, callback) => {
      try {
        if (!currentRoomId) {
          return callback(null)
        }

        const roomState = roomManager.getRoomState(currentRoomId)
        callback(roomState)
      } catch (error) {
        console.error('[Socket Error] room:get-state:', error)
        callback(null)
      }
    })

    /**
     * Disconnect handler
     */
    socket.on('disconnect', () => {
      try {
        if (currentRoomId && currentUserId) {
          const result = roomManager.removeUserFromRoom(currentUserId)

          // Notify others in room
          socket.to(currentRoomId).emit('room:user-left', {
            userId: currentUserId,
            userCount: roomManager.getRoomState(currentRoomId)?.users.length || 0,
          })

          console.log(
            `[Room] User ${currentUserId} disconnected from room ${currentRoomId}`
          )
        }

        console.log(`[Socket] User disconnected: ${socket.id}`)
      } catch (error) {
        console.error('[Socket Error] disconnect:', error)
      }
    })

    /**
     * Error handler
     */
    socket.on('error', (error) => {
      console.error('[Socket Error]:', error)
    })
  })
}
