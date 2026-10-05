import {
  verifyAdminPassword,
  createAdminSession,
  validateAdminToken,
  revokeAdminSession,
} from '../admin/adminAuth.js'

/**
 * Setup Super Admin Socket.IO event handlers.
 *
 * All operations require valid super admin authentication.
 * Connected admin dashboards receive real-time streams of:
 *  - admin:activity (user draws, joins, leaves, kicks, timers, pings, lasers)
 *  - admin:rooms_update (active rooms, participant counts, shape counts)
 *  - admin:stats_update (uptime, memory, totals)
 */
export function setupAdminHandlers(io, roomManager) {
  // Real-time broadcast hooks when events happen anywhere in the server
  roomManager.setOnActivityLogged((entry) => {
    io.to('admin_dashboard').emit('admin:activity', entry)
  })

  roomManager.setOnRoomsChanged(() => {
    io.to('admin_dashboard').emit('admin:rooms_update', {
      rooms: roomManager.getDetailedRoomsList(),
      stats: roomManager.getGlobalStats(),
    })
  })

  io.on('connection', (socket) => {
    /**
     * Authenticate Super Admin using secret key.
     */
    socket.on('admin:auth', (data = {}, callback) => {
      const respond = typeof callback === 'function' ? callback : () => {}
      try {
        const { password } = data
        if (!verifyAdminPassword(password)) {
          roomManager.logActivity({
            type: 'admin_action',
            details: `Unauthorized admin login attempt rejected from socket ${socket.id}`,
          })
          return respond({
            success: false,
            message: 'Invalid Super Admin Secret Key. Access Denied.',
          })
        }

        const token = createAdminSession()
        socket.data = socket.data || {}
        socket.data.isAdmin = true
        socket.data.adminToken = token
        socket.join('admin_dashboard')

        roomManager.logActivity({
          type: 'admin_action',
          details: 'Super Admin successfully logged into console',
        })

        respond({
          success: true,
          token,
          rooms: roomManager.getDetailedRoomsList(),
          stats: roomManager.getGlobalStats(),
          recentActivity: roomManager.getActivityLogs(100),
        })
      } catch (err) {
        console.error('[Admin Socket Error] admin:auth:', err)
        respond({ success: false, message: 'Authentication error' })
      }
    })

    /**
     * Restore session with existing admin token.
     */
    socket.on('admin:verify_token', (data = {}, callback) => {
      const respond = typeof callback === 'function' ? callback : () => {}
      try {
        const { token } = data
        if (!validateAdminToken(token)) {
          return respond({
            success: false,
            message: 'Admin session expired or invalid. Please log in again.',
          })
        }

        socket.data = socket.data || {}
        socket.data.isAdmin = true
        socket.data.adminToken = token
        socket.join('admin_dashboard')

        respond({
          success: true,
          token,
          rooms: roomManager.getDetailedRoomsList(),
          stats: roomManager.getGlobalStats(),
          recentActivity: roomManager.getActivityLogs(100),
        })
      } catch (err) {
        console.error('[Admin Socket Error] admin:verify_token:', err)
        respond({ success: false, message: 'Token verification error' })
      }
    })

    /**
     * Admin logout.
     */
    socket.on('admin:logout', (callback) => {
      const respond = typeof callback === 'function' ? callback : () => {}
      try {
        if (socket.data?.adminToken) {
          revokeAdminSession(socket.data.adminToken)
        }
        if (socket.data) {
          socket.data.isAdmin = false
          socket.data.adminToken = null
        }
        socket.leave('admin_dashboard')
        respond({ success: true })
      } catch (err) {
        console.error('[Admin Socket Error] admin:logout:', err)
        respond({ success: false })
      }
    })

    /**
     * Fetch complete overview (stats, active rooms, users, logs).
     */
    socket.on('admin:get_overview', (callback) => {
      const respond = typeof callback === 'function' ? callback : () => {}
      if (!socket.data?.isAdmin) {
        return respond({ success: false, message: 'Unauthorized: Admin privileges required' })
      }

      respond({
        success: true,
        rooms: roomManager.getDetailedRoomsList(),
        stats: roomManager.getGlobalStats(),
        users: roomManager.getAllUsersList(),
        recentActivity: roomManager.getActivityLogs(100),
      })
    })

    /**
     * Super Admin force discard/terminate any room.
     */
    socket.on('admin:force_discard_room', (data = {}, callback) => {
      const respond = typeof callback === 'function' ? callback : () => {}
      if (!socket.data?.isAdmin) {
        return respond({ success: false, message: 'Unauthorized: Super Admin privileges required' })
      }

      try {
        const { roomCode, reason } = data
        const room = roomManager.getRoomByCode(roomCode)
        if (!room) {
          return respond({ success: false, message: 'Room not found or already closed' })
        }

        const discardReason = reason || 'Room terminated by Super Admin.'
        roomManager.logActivity({
          type: 'room_discard',
          roomCode: room.roomCode,
          details: `Super Admin force-discarded room: "${discardReason}"`,
        })

        roomManager.discardRoom(room.sessionId, discardReason)
        respond({ success: true, roomCode })
      } catch (err) {
        console.error('[Admin Socket Error] admin:force_discard_room:', err)
        respond({ success: false, message: 'Failed to discard room' })
      }
    })

    /**
     * Super Admin force kick any user from any room.
     */
    socket.on('admin:force_kick_user', (data = {}, callback) => {
      const respond = typeof callback === 'function' ? callback : () => {}
      if (!socket.data?.isAdmin) {
        return respond({ success: false, message: 'Unauthorized: Super Admin privileges required' })
      }

      try {
        const { roomCode, userId, reason } = data
        const room = roomCode
          ? roomManager.getRoomByCode(roomCode)
          : roomManager.getRoomForUser(userId)

        if (!room) {
          return respond({ success: false, message: 'Room not found' })
        }

        const targetUser = room.users.get(userId)
        const kickReason = reason || 'You were removed from the room by the Super Admin.'

        // Mark socket and remove from channel
        const targetSocket = io.sockets.sockets.get(userId)
        if (targetSocket) {
          targetSocket.data = targetSocket.data || {}
          targetSocket.data.kicked = true
          targetSocket.leave(room.sessionId)
        }

        // Direct kick alert to user
        io.to(userId).emit('room:kicked', {
          message: kickReason,
          roomCode: room.roomCode,
        })

        // Remove from room manager
        room.kickUser(userId)
        const removeResult = roomManager.removeUserFromRoom(userId)

        // Notify remaining participants
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
          userName: targetUser?.name || userId,
          details: `Super Admin kicked user ${targetUser?.name || userId} (${kickReason})`,
        })

        respond({ success: true, userId, userName: targetUser?.name })
      } catch (err) {
        console.error('[Admin Socket Error] admin:force_kick_user:', err)
        respond({ success: false, message: 'Failed to kick user' })
      }
    })

    /**
     * Broadcast system announcement to all rooms or a specific room.
     */
    socket.on('admin:broadcast_announcement', (data = {}, callback) => {
      const respond = typeof callback === 'function' ? callback : () => {}
      if (!socket.data?.isAdmin) {
        return respond({ success: false, message: 'Unauthorized: Super Admin privileges required' })
      }

      try {
        const { message, targetRoomCode, level = 'info' } = data
        if (!message || !message.trim()) {
          return respond({ success: false, message: 'Announcement message is required' })
        }

        const announcementPayload = {
          id: `ann_${Date.now()}`,
          message: message.trim(),
          level, // 'info' | 'warning' | 'alert'
          sender: 'Super Admin',
          timestamp: Date.now(),
        }

        if (targetRoomCode && targetRoomCode !== 'ALL') {
          const room = roomManager.getRoomByCode(targetRoomCode)
          if (!room) {
            return respond({ success: false, message: 'Target room not found' })
          }
          io.to(room.sessionId).emit('system:announcement', announcementPayload)
          roomManager.logActivity({
            type: 'broadcast',
            roomCode: room.roomCode,
            details: `Broadcast to [${room.roomCode}]: "${announcementPayload.message}"`,
          })
        } else {
          io.emit('system:announcement', announcementPayload)
          roomManager.logActivity({
            type: 'broadcast',
            roomCode: 'ALL_ROOMS',
            details: `Global broadcast to all rooms: "${announcementPayload.message}"`,
          })
        }

        respond({ success: true, payload: announcementPayload })
      } catch (err) {
        console.error('[Admin Socket Error] admin:broadcast_announcement:', err)
        respond({ success: false, message: 'Failed to send announcement' })
      }
    })

    /**
     * Clear canvas for a room (e.g. content moderation).
     */
    socket.on('admin:clear_canvas', (data = {}, callback) => {
      const respond = typeof callback === 'function' ? callback : () => {}
      if (!socket.data?.isAdmin) {
        return respond({ success: false, message: 'Unauthorized: Super Admin privileges required' })
      }

      try {
        const { roomCode } = data
        const room = roomManager.getRoomByCode(roomCode)
        if (!room) {
          return respond({ success: false, message: 'Room not found' })
        }

        room.clearCanvas()
        io.to(room.sessionId).emit('canvas:cleared', {
          message: 'Canvas was cleared by the Super Admin.',
        })

        roomManager.logActivity({
          type: 'admin_action',
          roomCode: room.roomCode,
          details: 'Super Admin wiped canvas drawings for room',
        })

        respond({ success: true, roomCode })
      } catch (err) {
        console.error('[Admin Socket Error] admin:clear_canvas:', err)
        respond({ success: false, message: 'Failed to clear canvas' })
      }
    })

    /**
     * Inspect room details and store snapshot.
     */
    socket.on('admin:inspect_room', (data = {}, callback) => {
      const respond = typeof callback === 'function' ? callback : () => {}
      if (!socket.data?.isAdmin) {
        return respond({ success: false, message: 'Unauthorized: Super Admin privileges required' })
      }

      try {
        const { roomCode } = data
        const room = roomManager.getRoomByCode(roomCode)
        if (!room) {
          return respond({ success: false, message: 'Room not found' })
        }

        const snapshot = room.snapshot
        const shapes = []
        if (snapshot && snapshot.store) {
          for (const [id, rec] of Object.entries(snapshot.store)) {
            if (id.startsWith('shape:') || (rec && rec.typeName === 'shape')) {
              shapes.push({
                id: rec.id,
                type: rec.type,
                props: rec.props,
                x: rec.x,
                y: rec.y,
              })
            }
          }
        }

        respond({
          success: true,
          room: room.getDetailedInfo(),
          snapshotMeta: {
            shapesCount: shapes.length,
            recordsCount: snapshot && snapshot.store ? Object.keys(snapshot.store).length : 0,
            schemaVersion: snapshot?.schema?.schemaVersion || null,
          },
          shapesSample: shapes.slice(0, 50),
        })
      } catch (err) {
        console.error('[Admin Socket Error] admin:inspect_room:', err)
        respond({ success: false, message: 'Failed to inspect room' })
      }
    })
  })
}
