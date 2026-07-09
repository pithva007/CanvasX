import { v4 as uuidv4 } from 'uuid'

const DEFAULT_MAX_USERS = Number(process.env.MAX_USERS_PER_ROOM) || 50

/**
 * Room - a single collaborative whiteboard.
 *
 * The room is the authoritative holder of the tldraw *document* snapshot
 * (`{ store, schema }`, document scope only). The first user to enter an empty
 * room seeds this snapshot; every subsequent document diff is applied here so
 * that late joiners always receive the current state. Presence (cursors) is
 * ephemeral and is never stored on the room.
 */
export class Room {
  constructor(roomId, password, sessionId, maxUsers = DEFAULT_MAX_USERS) {
    this.roomId = roomId
    this.password = password
    this.sessionId = sessionId
    this.users = new Map() // userId -> user
    this.snapshot = null // TLStoreSnapshot { store, schema } | null
    this.initializerId = null // socketId currently seeding the snapshot
    this.createdAt = new Date()
    this.lastActivity = new Date()
    this.maxUsers = maxUsers
  }

  touch() {
    this.lastActivity = new Date()
  }

  addUser(user) {
    if (this.users.size >= this.maxUsers) return null
    this.users.set(user.id, user)
    this.touch()
    return user
  }

  removeUser(userId) {
    const user = this.users.get(userId)
    if (user) {
      this.users.delete(userId)
      if (this.initializerId === userId) this.initializerId = null
      this.touch()
    }
    return user
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

  isSeeded() {
    return this.snapshot !== null
  }

  /** Store the initial document snapshot supplied by the seeding client. */
  setSnapshot(snapshot) {
    this.snapshot = snapshot
    this.initializerId = null
    this.touch()
  }

  /**
   * Apply an incoming tldraw store diff to the authoritative snapshot so that
   * late joiners receive up-to-date state. `changes` is the shape produced by
   * `store.listen`: { added: {id: rec}, updated: {id: [from, to]}, removed: {id: rec} }.
   */
  applyDiff(changes) {
    if (!this.snapshot || !this.snapshot.store || !changes) return
    const store = this.snapshot.store

    if (changes.added) {
      for (const record of Object.values(changes.added)) {
        if (record && record.id) store[record.id] = record
      }
    }
    if (changes.updated) {
      for (const pair of Object.values(changes.updated)) {
        const next = Array.isArray(pair) ? pair[1] : pair
        if (next && next.id) store[next.id] = next
      }
    }
    if (changes.removed) {
      for (const record of Object.values(changes.removed)) {
        if (record && record.id) delete store[record.id]
      }
    }
    this.touch()
  }

  getState() {
    return {
      roomId: this.roomId,
      sessionId: this.sessionId,
      users: this.getUsers(),
      userCount: this.users.size,
      maxUsers: this.maxUsers,
      seeded: this.isSeeded(),
      createdAt: this.createdAt,
    }
  }
}

/**
 * RoomManager - owns all active rooms and the user -> room mapping.
 */
export class RoomManager {
  constructor(maxUsers) {
    this.rooms = new Map() // password -> Room
    this.roomsBySessionId = new Map() // sessionId -> Room
    this.userToRoom = new Map() // userId -> sessionId
    // Read the env here (constructed after dotenv.config runs in index.js).
    this.maxUsers = maxUsers || Number(process.env.MAX_USERS_PER_ROOM) || DEFAULT_MAX_USERS
    this.inactivityTimeout = 3600000 // 1 hour
    this.cleanupInterval = 300000 // 5 minutes
    this.startCleanupInterval()
  }

  getOrCreateRoom(password) {
    if (!password || password.trim() === '') {
      throw new Error('Password is required')
    }
    if (this.rooms.has(password)) {
      return this.rooms.get(password)
    }
    const sessionId = uuidv4()
    const room = new Room(password, password, sessionId, this.maxUsers)
    this.rooms.set(password, room)
    this.roomsBySessionId.set(sessionId, room)
    return room
  }

  getRoomBySessionId(sessionId) {
    return this.roomsBySessionId.get(sessionId)
  }

  getRoomByPassword(password) {
    return this.rooms.get(password)
  }

  getRoomForUser(userId) {
    const sessionId = this.userToRoom.get(userId)
    return sessionId ? this.roomsBySessionId.get(sessionId) : undefined
  }

  addUserToRoom(password, user) {
    const room = this.getOrCreateRoom(password)

    if (room.isFull()) {
      return { success: false, message: 'Room is full', room: null }
    }

    room.addUser(user)
    this.userToRoom.set(user.id, room.sessionId)
    return { success: true, room }
  }

  removeUserFromRoom(userId) {
    const sessionId = this.userToRoom.get(userId)
    if (!sessionId) return null

    const room = this.roomsBySessionId.get(sessionId)
    if (!room) {
      this.userToRoom.delete(userId)
      return null
    }

    const user = room.removeUser(userId)
    this.userToRoom.delete(userId)

    if (room.isEmpty()) {
      this.deleteRoom(room.sessionId)
      return { room, user, roomDeleted: true }
    }
    return { room, user, roomDeleted: false }
  }

  deleteRoom(sessionId) {
    const room = this.roomsBySessionId.get(sessionId)
    if (!room) return false
    room.getUsers().forEach((u) => this.userToRoom.delete(u.id))
    this.rooms.delete(room.password)
    this.roomsBySessionId.delete(sessionId)
    return true
  }

  getRoomCount() {
    return this.roomsBySessionId.size
  }

  getUserCount() {
    return this.userToRoom.size
  }

  getRoomState(sessionId) {
    const room = this.roomsBySessionId.get(sessionId)
    return room ? room.getState() : null
  }

  startCleanupInterval() {
    this.cleanupTimer = setInterval(() => {
      const now = Date.now()
      const stale = []
      this.roomsBySessionId.forEach((room, sessionId) => {
        if (room.isEmpty() && now - room.lastActivity.getTime() > this.inactivityTimeout) {
          stale.push(sessionId)
        }
      })
      stale.forEach((sessionId) => this.deleteRoom(sessionId))
      if (stale.length > 0) {
        console.log(`[Cleanup] Removed ${stale.length} inactive room(s)`)
      }
    }, this.cleanupInterval)

    // Don't keep the event loop alive solely for the cleanup timer.
    if (this.cleanupTimer.unref) this.cleanupTimer.unref()
  }
}
