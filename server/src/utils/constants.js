/**
 * Constants for the application
 */

export const CONSTANTS = {
  // Room limits (override MAX_USERS_PER_ROOM via env)
  MAX_USERS_PER_ROOM: Number(process.env.MAX_USERS_PER_ROOM) || 50,
  ROOM_INACTIVITY_TIMEOUT: 3600000, // 1 hour
  CLEANUP_INTERVAL: 300000, // 5 minutes

  // Single user room discard timeout (5 minutes)
  SINGLE_USER_TIMEOUT: 5 * 60 * 1000,
  // Grace period before an empty room is deleted (allows page refreshes and network reconnection)
  EMPTY_ROOM_GRACE_PERIOD: Number(process.env.EMPTY_ROOM_GRACE_PERIOD_MS) || 60000,

  // Events
  EVENTS: {
    // Room
    ROOM_CREATE: 'room:create',
    ROOM_JOIN: 'room:join',
    ROOM_LEAVE: 'room:leave',
    ROOM_USER_JOINED: 'room:user-joined',
    ROOM_USER_LEFT: 'room:user-left',
    ROOM_TIMER_STARTED: 'room:timer-started',
    ROOM_TIMER_CANCELLED: 'room:timer-cancelled',
    ROOM_DISCARDED: 'room:discarded',

    // Document sync (tldraw store)
    STORE_INIT: 'store:init',
    STORE_SEEDED: 'store:seeded',
    STORE_REQUEST_SNAPSHOT: 'store:request-snapshot',
    STORE_PLEASE_INIT: 'store:please-init',
    STORE_UPDATE: 'store:update',

    // Presence (cursors) - relayed, never persisted
    PRESENCE_UPDATE: 'presence:update',
    PRESENCE_LEAVE: 'presence:leave',

    // Laser & Radar Ping - relayed, never persisted
    LASER_POINTS: 'laser:points',
    PING_CREATE: 'ping:create',

    // Connection
    CONNECT: 'connect',
    DISCONNECT: 'disconnect',
    ERROR: 'error',
  },
}

export default CONSTANTS
