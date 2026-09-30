import { v4 as uuidv4 } from 'uuid'

const DEFAULT_MAX_USERS = Number(process.env.MAX_USERS_PER_ROOM) || 50
const SINGLE_USER_TIMEOUT_MS = 5 * 60 * 1000 // 5 minutes
const EMPTY_ROOM_GRACE_PERIOD_MS = Number(process.env.EMPTY_ROOM_GRACE_PERIOD_MS) || 60 * 1000 // 60 seconds

const CODE_WORDS = [
  'ART', 'DRAW', 'SKETCH', 'LINE', 'PEN', 'INK',
  'GLOW', 'BOLD', 'FLOW', 'MINT', 'PEAK', 'WAVE',
  'SPARK', 'STAR', 'ZEN', 'CHALK', 'CANVAS', 'VIBE'
]

/**
 * Room - a single collaborative whiteboard.
 *
 * The room is the authoritative holder of the tldraw *document* snapshot
 * (`{ store, schema }`, document scope only).
 *
 * 5-Minute Discard Rule:
 * Whenever only a single user is in the room (e.g. freshly created or others left),
 * a 5-minute discard timer runs. If a second user joins, the timer is cleared.
 * If 5 minutes elapse with only one user, the room is discarded.
 *
 * Empty Room Grace Period:
 * If a room becomes empty (e.g. page refresh, network blip), a 60-second grace
 * timer runs before deleting the room so drawings are not instantly wiped.
 */
export class Room {
  constructor(roomCode, sessionId, maxUsers = DEFAULT_MAX_USERS) {
    this.roomCode = roomCode.toUpperCase()
    this.sessionId = sessionId
    this.users = new Map() // userId -> user
    this.snapshot = null // TLStoreSnapshot { store, schema } | null
    this.initializerId = null // socketId currently seeding the snapshot
    this.createdAt = new Date()
    this.lastActivity = new Date()
    this.maxUsers = maxUsers
    this.singleUserTimer = null
    this.singleUserDiscardAt = null // Timestamp (ms)
    this.emptyTimer = null // Grace timer before deleting empty room
  }

  // Alias for backward compatibility
  get roomId() {
    return this.roomCode
  }

  get password() {
    return this.roomCode
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

  isAlone() {
    return this.users.size === 1
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

  /**
   * Start 5-minute single-user discard timer.
   */
  startSingleUserTimer(onDiscardCallback) {
    this.clearSingleUserTimer()
    this.singleUserDiscardAt = Date.now() + SINGLE_USER_TIMEOUT_MS
    this.singleUserTimer = setTimeout(() => {
      this.singleUserTimer = null
      if (typeof onDiscardCallback === 'function') {
        onDiscardCallback(this)
      }
    }, SINGLE_USER_TIMEOUT_MS)

    if (this.singleUserTimer.unref) this.singleUserTimer.unref()
    return this.singleUserDiscardAt
  }

  /**
   * Clear 5-minute single-user discard timer when 2+ users are present.
   */
  clearSingleUserTimer() {
    if (this.singleUserTimer) {
      clearTimeout(this.singleUserTimer)
      this.singleUserTimer = null
    }
    this.singleUserDiscardAt = null
  }

  /**
   * Start grace period timer before deleting an empty room.
   */
  startEmptyTimer(onExpireCallback, durationMs) {
    this.clearEmptyTimer()
    const ms = durationMs != null ? durationMs : (Number(process.env.EMPTY_ROOM_GRACE_PERIOD_MS) || 60000)
    this.emptyTimer = setTimeout(() => {
      this.emptyTimer = null
      if (typeof onExpireCallback === 'function') {
        onExpireCallback(this)
      }
    }, ms)

    if (this.emptyTimer.unref) this.emptyTimer.unref()
  }

  /**
   * Clear empty room grace timer when a user rejoins.
   */
  clearEmptyTimer() {
    if (this.emptyTimer) {
      clearTimeout(this.emptyTimer)
      this.emptyTimer = null
    }
  }

  getState() {
    return {
      roomCode: this.roomCode,
      roomId: this.roomCode,
      sessionId: this.sessionId,
      users: this.getUsers(),
      userCount: this.users.size,
      maxUsers: this.maxUsers,
      seeded: this.isSeeded(),
      createdAt: this.createdAt,
      singleUserDiscardAt: this.singleUserDiscardAt,
    }
  }
}

/**
 * RoomManager - owns all active rooms, user mapping, and discard timers.
 */
export class RoomManager {
  constructor(maxUsers, emptyGracePeriodMs) {
    this.rooms = new Map() // roomCode (uppercase) -> Room
    this.roomsBySessionId = new Map() // sessionId -> Room
    this.userToRoom = new Map() // userId -> sessionId
    this.maxUsers = maxUsers || Number(process.env.MAX_USERS_PER_ROOM) || DEFAULT_MAX_USERS
    this.emptyGracePeriodMs = emptyGracePeriodMs != null ? emptyGracePeriodMs : (Number(process.env.EMPTY_ROOM_GRACE_PERIOD_MS) || 60000)
    this.inactivityTimeout = 3600000 // 1 hour for abandoned rooms
    this.cleanupInterval = 300000 // 5 minutes
    this.onRoomDiscardCallback = null
    this.startCleanupInterval()
  }

  setOnRoomDiscard(callback) {
    this.onRoomDiscardCallback = callback
  }

  generateRoomCode() {
    for (let attempts = 0; attempts < 100; attempts++) {
      const prefix = CODE_WORDS[Math.floor(Math.random() * CODE_WORDS.length)]
      const suffix = Math.floor(1000 + Math.random() * 9000)
      const code = `${prefix}-${suffix}`
      if (!this.rooms.has(code)) {
        return code
      }
    }
    return `ROOM-${uuidv4().substring(0, 6).toUpperCase()}`
  }

  /**
   * Create a new room with a unique human-friendly code.
   */
  createRoom(customCode) {
    let code = customCode ? customCode.trim().toUpperCase() : this.generateRoomCode()
    if (this.rooms.has(code)) {
      code = this.generateRoomCode()
    }
    const sessionId = uuidv4()
    const room = new Room(code, sessionId, this.maxUsers)
    this.rooms.set(code, room)
    this.roomsBySessionId.set(sessionId, room)
    return room
  }

  getRoomByCode(roomCode) {
    if (!roomCode || typeof roomCode !== 'string') return undefined
    return this.rooms.get(roomCode.trim().toUpperCase())
  }

  getRoomByPassword(password) {
    return this.getRoomByCode(password)
  }

  getRoomBySessionId(sessionId) {
    return this.roomsBySessionId.get(sessionId)
  }

  getRoomForUser(userId) {
    const sessionId = this.userToRoom.get(userId)
    return sessionId ? this.roomsBySessionId.get(sessionId) : undefined
  }

  /**
   * Add a user to an existing room.
   */
  addUserToRoom(roomCode, user) {
    const room = this.getRoomByCode(roomCode)
    if (!room) {
      return { success: false, message: 'Room not found or has expired', room: null }
    }

    if (room.isFull()) {
      return { success: false, message: 'Room is full', room: null }
    }

    // Cancel empty room grace timer if active (user rejoined before grace period expired!)
    room.clearEmptyTimer()

    room.addUser(user)
    this.userToRoom.set(user.id, room.sessionId)

    // Single-user 5-minute discard timer check:
    // If only 1 user, start timer. If 2+ users, clear timer!
    if (room.users.size === 1) {
      room.startSingleUserTimer((r) => {
        this.discardRoom(r.sessionId, 'Room discarded because no other collaborators joined within 5 minutes')
      })
    } else if (room.users.size > 1) {
      room.clearSingleUserTimer()
    }

    return { success: true, room }
  }

  /**
   * Remove a user from a room.
   */
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
      // Pause single-user timer while room is empty
      room.clearSingleUserTimer()
      // Give a 60-second grace period before deleting so quick page refreshes
      // and temporary network disconnects don't destroy the room and wipe drawings.
      const graceMs = this.emptyGracePeriodMs
      room.startEmptyTimer((r) => {
        if (r.isEmpty()) {
          console.log(`[Room ${r.roomCode}] Deleted after ${graceMs / 1000}s empty grace period`)
          this.deleteRoom(r.sessionId)
        }
      }, graceMs)
      return { room, user, roomDeleted: false, userCount: 0 }
    }

    // If down to only 1 user, start the 5-minute single-user discard timer!
    if (room.users.size === 1) {
      room.startSingleUserTimer((r) => {
        this.discardRoom(r.sessionId, 'Room discarded because no other collaborators joined within 5 minutes')
      })
    }

    return { room, user, roomDeleted: false, userCount: room.users.size }
  }

  discardRoom(sessionId, reason) {
    const room = this.roomsBySessionId.get(sessionId)
    if (!room) return false

    console.log(`[Room ${room.roomCode}] Discarded: ${reason}`)
    if (this.onRoomDiscardCallback) {
      this.onRoomDiscardCallback(room, reason)
    }

    this.deleteRoom(sessionId)
    return true
  }

  deleteRoom(sessionId) {
    const room = this.roomsBySessionId.get(sessionId)
    if (!room) return false

    room.clearSingleUserTimer()
    room.clearEmptyTimer()
    room.getUsers().forEach((u) => this.userToRoom.delete(u.id))
    this.rooms.delete(room.roomCode)
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

    if (this.cleanupTimer.unref) this.cleanupTimer.unref()
  }
}
