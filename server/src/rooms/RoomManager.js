import { v4 as uuidv4 } from 'uuid'

/**
 * Room class - represents a single whiteboard room
 */
export class Room {
  constructor(roomId, password, sessionId) {
    this.roomId = roomId
    this.password = password
    this.sessionId = sessionId
    this.users = new Map()
    this.drawing = {}
    this.createdAt = new Date()
    this.lastActivity = new Date()
    this.maxUsers = 2
  }

  addUser(user) {
    if (this.users.size >= this.maxUsers) {
      return null
    }

    this.users.set(user.id, user)
    this.lastActivity = new Date()
    return user
  }

  removeUser(userId) {
    const user = this.users.get(userId)
    if (user) {
      this.users.delete(userId)
      this.lastActivity = new Date()
    }
    return user
  }

  getUser(userId) {
    return this.users.get(userId)
  }

  getUsers() {
    return Array.from(this.users.values())
  }

  isFull() {
    return this.users.size >= this.maxUsers
  }

  isEmpty() {
    return this.users.size === 0
  }

  updateDrawing(data) {
    this.drawing = { ...this.drawing, ...data }
    this.lastActivity = new Date()
  }

  clearDrawing() {
    this.drawing = {}
    this.lastActivity = new Date()
  }

  getState() {
    return {
      roomId: this.roomId,
      sessionId: this.sessionId,
      users: this.getUsers(),
      drawing: this.drawing,
      userCount: this.users.size,
      maxUsers: this.maxUsers,
      createdAt: this.createdAt,
    }
  }
}

/**
 * RoomManager - manages all active rooms
 */
export class RoomManager {
  constructor() {
    this.rooms = new Map() // password -> Room
    this.roomsBySessionId = new Map() // sessionId -> Room
    this.userToRoom = new Map() // userId -> roomId (sessionId)
    this.inactivityTimeout = 3600000 // 1 hour
    this.cleanupInterval = 300000 // 5 minutes

    // Start cleanup interval
    this.startCleanupInterval()
  }

  /**
   * Create or get a room by password
   */
  getOrCreateRoom(password) {
    if (!password || password.trim() === '') {
      throw new Error('Password is required')
    }

    // Check if room with this password exists
    if (this.rooms.has(password)) {
      return this.rooms.get(password)
    }

    // Create new room
    const sessionId = uuidv4()
    const room = new Room(password, password, sessionId)
    this.rooms.set(password, room)
    this.roomsBySessionId.set(sessionId, room)

    return room
  }

  /**
   * Get room by session ID
   */
  getRoomBySessionId(sessionId) {
    return this.roomsBySessionId.get(sessionId)
  }

  /**
   * Get room by password
   */
  getRoomByPassword(password) {
    return this.rooms.get(password)
  }

  /**
   * Add user to room
   */
  addUserToRoom(password, user) {
    const room = this.getOrCreateRoom(password)

    if (room.isFull()) {
      return {
        success: false,
        message: 'Room is full',
        roomId: null,
      }
    }

    room.addUser(user)
    this.userToRoom.set(user.id, room.sessionId)

    return {
      success: true,
      roomId: room.sessionId,
      room: room.getState(),
    }
  }

  /**
   * Remove user from room
   */
  removeUserFromRoom(userId) {
    const roomId = this.userToRoom.get(userId)
    if (!roomId) {
      return null
    }

    const room = this.roomsBySessionId.get(roomId)
    if (!room) {
      return null
    }

    const user = room.removeUser(userId)
    this.userToRoom.delete(userId)

    // Clean up empty rooms
    if (room.isEmpty()) {
      this.deleteRoom(room.sessionId)
    }

    return { room, user }
  }

  /**
   * Delete a room
   */
  deleteRoom(sessionId) {
    const room = this.roomsBySessionId.get(sessionId)
    if (!room) {
      return false
    }

    // Remove all users
    room.getUsers().forEach((user) => {
      this.userToRoom.delete(user.id)
    })

    // Delete room
    this.rooms.delete(room.password)
    this.roomsBySessionId.delete(sessionId)

    return true
  }

  /**
   * Get active room count
   */
  getRoomCount() {
    return this.roomsBySessionId.size
  }

  /**
   * Get total active user count
   */
  getUserCount() {
    return this.userToRoom.size
  }

  /**
   * Update drawing in room
   */
  updateRoomDrawing(roomId, data) {
    const room = this.roomsBySessionId.get(roomId)
    if (room) {
      room.updateDrawing(data)
      return true
    }
    return false
  }

  /**
   * Clear drawing in room
   */
  clearRoomDrawing(roomId) {
    const room = this.roomsBySessionId.get(roomId)
    if (room) {
      room.clearDrawing()
      return true
    }
    return false
  }

  /**
   * Get room state
   */
  getRoomState(roomId) {
    const room = this.roomsBySessionId.get(roomId)
    if (room) {
      return room.getState()
    }
    return null
  }

  /**
   * Cleanup inactive rooms periodically
   */
  startCleanupInterval() {
    setInterval(() => {
      const now = new Date()
      const inactiveRooms = []

      this.roomsBySessionId.forEach((room, sessionId) => {
        const timeSinceLastActivity = now - room.lastActivity
        if (timeSinceLastActivity > this.inactivityTimeout && room.isEmpty()) {
          inactiveRooms.push(sessionId)
        }
      })

      inactiveRooms.forEach((sessionId) => {
        this.deleteRoom(sessionId)
      })

      if (inactiveRooms.length > 0) {
        console.log(`[Cleanup] Removed ${inactiveRooms.length} inactive rooms`)
      }
    }, this.cleanupInterval)
  }
}
