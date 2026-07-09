/**
 * Constants for the application
 */

export const CONSTANTS = {
  // Room limits (override MAX_USERS_PER_ROOM via env)
  MAX_USERS_PER_ROOM: Number(process.env.MAX_USERS_PER_ROOM) || 50,
  ROOM_INACTIVITY_TIMEOUT: 3600000, // 1 hour
  CLEANUP_INTERVAL: 300000, // 5 minutes

  // Events
  EVENTS: {
    // Room
    ROOM_JOIN: 'room:join',
    ROOM_LEAVE: 'room:leave',
    ROOM_USER_JOINED: 'room:user-joined',
    ROOM_USER_LEFT: 'room:user-left',

    // Document sync (tldraw store)
    STORE_INIT: 'store:init',
    STORE_SEEDED: 'store:seeded',
    STORE_REQUEST_SNAPSHOT: 'store:request-snapshot',
    STORE_PLEASE_INIT: 'store:please-init',
    STORE_UPDATE: 'store:update',

    // Presence (cursors) - relayed, never persisted
    PRESENCE_UPDATE: 'presence:update',
    PRESENCE_LEAVE: 'presence:leave',

    // Connection
    CONNECT: 'connect',
    DISCONNECT: 'disconnect',
    ERROR: 'error',
  },
}

export default CONSTANTS
