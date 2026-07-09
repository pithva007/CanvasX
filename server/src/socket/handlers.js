import { validateRoomPassword, sanitizeInput } from '../utils/validators.js'

/**
 * Setup all Socket.IO event handlers.
 *
 * Collaboration model (tldraw "DIY multiplayer"):
 *  - The room owns the authoritative document snapshot.
 *  - The first user into an empty room is the *initializer*: it seeds the
 *    snapshot via `store:init`. Everyone else either receives the current
 *    snapshot immediately (room already seeded) or waits for `store:seeded`
 *    and then pulls the current snapshot with `store:request-snapshot`.
 *  - Document edits flow as `store:update` diffs, applied to the room snapshot
 *    and relayed to peers. Presence (cursors) flows as `presence:update` and is
 *    relayed but never stored.
 */
export function setupSocketHandlers(io, roomManager) {
  io.on('connection', (socket) => {
    console.log(`[Socket] Connected: ${socket.id}`)

    let currentRoom = null // Room instance
    let currentUserId = null // === socket.id

    const usersPayload = (room) =>
      room.getUsers().map((u) => ({ id: u.id, name: u.name, color: u.color }))

    /**
     * Promote a new initializer if the current one leaves before seeding.
     */
    const handleInitializerDeparture = (room, departingId) => {
      if (!room || room.isSeeded() || room.isEmpty()) return
      if (room.initializerId && room.initializerId !== departingId) return

      const next = room.getUsers()[0]
      if (next) {
        room.initializerId = next.id
        io.to(next.id).emit('store:please-init')
        console.log(`[Room ${room.sessionId}] Promoted ${next.id} to initializer`)
      }
    }

    /**
     * Room: join (create-or-join by password, or join an existing sessionId).
     */
    socket.on('room:join', (data = {}, callback) => {
      const respond = typeof callback === 'function' ? callback : () => {}
      try {
        const { password, roomId, name } = data

        const validation = validateRoomPassword(password)
        if (!validation.valid && !roomId) {
          return respond({ success: false, message: validation.error })
        }

        let room
        if (roomId) {
          room = roomManager.getRoomBySessionId(roomId)
          if (!room) return respond({ success: false, message: 'Room not found' })
          if (room.password !== password) {
            return respond({ success: false, message: 'Invalid password' })
          }
          if (room.isFull()) {
            return respond({ success: false, message: 'Room is full' })
          }
        } else {
          const existing = roomManager.getRoomByPassword(password)
          if (existing && existing.isFull()) {
            return respond({ success: false, message: 'Room is full' })
          }
        }

        const userId = socket.id
        const displayName = sanitizeInput(name) || `User-${userId.substring(0, 5)}`
        const user = {
          id: userId,
          name: displayName,
          color: colorForId(userId),
          connectedAt: new Date(),
        }

        const result = roomManager.addUserToRoom(password, user)
        if (!result.success) {
          return respond({ success: false, message: result.message })
        }

        room = result.room
        currentRoom = room
        currentUserId = userId
        socket.join(room.sessionId)

        // Decide seeding role.
        let needsInit = false
        let snapshot = null
        if (room.isSeeded()) {
          snapshot = room.snapshot
        } else if (!room.initializerId) {
          room.initializerId = userId
          needsInit = true
        }
        // else: someone is already initializing -> this client waits for `store:seeded`.

        // Notify existing members.
        socket.to(room.sessionId).emit('room:user-joined', {
          user: { id: user.id, name: user.name, color: user.color },
          users: usersPayload(room),
        })

        respond({
          success: true,
          roomId: room.sessionId,
          userId,
          name: displayName,
          users: usersPayload(room),
          needsInit,
          snapshot,
        })

        console.log(
          `[Room ${room.sessionId}] ${displayName} joined ` +
            `(${room.users.size}/${room.maxUsers}, needsInit=${needsInit})`
        )
      } catch (error) {
        console.error('[Socket Error] room:join:', error)
        respond({ success: false, message: 'Failed to join room' })
      }
    })

    /**
     * Store: initializer seeds the authoritative snapshot.
     */
    socket.on('store:init', (data = {}) => {
      try {
        if (!currentRoom) return
        if (currentRoom.isSeeded()) return // first-writer-wins
        if (currentRoom.initializerId && currentRoom.initializerId !== currentUserId) return
        if (!data.snapshot || !data.snapshot.store) return

        currentRoom.setSnapshot(data.snapshot)
        socket.to(currentRoom.sessionId).emit('store:seeded')
        console.log(`[Room ${currentRoom.sessionId}] Seeded by ${currentUserId}`)
      } catch (error) {
        console.error('[Socket Error] store:init:', error)
      }
    })

    /**
     * Store: a waiting client pulls the current authoritative snapshot.
     */
    socket.on('store:request-snapshot', (_data, callback) => {
      const respond = typeof callback === 'function' ? callback : () => {}
      try {
        respond({ snapshot: currentRoom ? currentRoom.snapshot : null })
      } catch (error) {
        console.error('[Socket Error] store:request-snapshot:', error)
        respond({ snapshot: null })
      }
    })

    /**
     * Store: relay a document diff and fold it into the room snapshot.
     */
    socket.on('store:update', (data = {}) => {
      try {
        if (!currentRoom || !data.changes) return
        currentRoom.applyDiff(data.changes)
        socket.to(currentRoom.sessionId).emit('store:update', {
          changes: data.changes,
          userId: currentUserId,
        })
      } catch (error) {
        console.error('[Socket Error] store:update:', error)
      }
    })

    /**
     * Presence: relay a cursor/presence record (never stored).
     */
    socket.on('presence:update', (data = {}) => {
      try {
        if (!currentRoom || !data.presence) return
        socket.to(currentRoom.sessionId).emit('presence:update', {
          presence: data.presence,
          userId: currentUserId,
        })
      } catch (error) {
        console.error('[Socket Error] presence:update:', error)
      }
    })

    /**
     * Room: leave.
     */
    socket.on('room:leave', () => leaveRoom())

    /**
     * Disconnect.
     */
    socket.on('disconnect', (reason) => {
      leaveRoom()
      console.log(`[Socket] Disconnected: ${socket.id} (${reason})`)
    })

    socket.on('error', (error) => {
      console.error('[Socket Error]:', error)
    })

    function leaveRoom() {
      if (!currentRoom || !currentUserId) return
      const room = currentRoom
      const userId = currentUserId
      const wasInitializer = room.initializerId === userId

      const result = roomManager.removeUserFromRoom(userId)
      socket.leave(room.sessionId)

      if (result && !result.roomDeleted) {
        socket.to(room.sessionId).emit('room:user-left', {
          userId,
          users: usersPayload(room),
        })
        socket.to(room.sessionId).emit('presence:leave', { userId })
        if (wasInitializer) handleInitializerDeparture(room, userId)
      }

      console.log(`[Room ${room.sessionId}] ${userId} left`)
      currentRoom = null
      currentUserId = null
    }
  })
}

const PRESENCE_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA94D',
  '#9775FA', '#38D9A9', '#F783AC', '#748FFC',
]

function colorForId(id) {
  let hash = 0
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) | 0
  return PRESENCE_COLORS[Math.abs(hash) % PRESENCE_COLORS.length]
}
