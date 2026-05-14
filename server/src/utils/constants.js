/**
 * Constants for the application
 */

export const CONSTANTS = {
  // Room limits
  MAX_USERS_PER_ROOM: 2,
  ROOM_INACTIVITY_TIMEOUT: 3600000, // 1 hour
  CLEANUP_INTERVAL: 300000, // 5 minutes

  // Drawing
  MAX_STROKE_WIDTH: 100,
  MIN_STROKE_WIDTH: 1,
  DEFAULT_STROKE_WIDTH: 2,

  // Canvas
  MAX_ZOOM: 5,
  MIN_ZOOM: 0.2,
  DEFAULT_ZOOM: 1,

  // Events
  EVENTS: {
    // Room
    ROOM_JOIN: 'room:join',
    ROOM_LEAVE: 'room:leave',
    ROOM_USER_JOINED: 'room:user-joined',
    ROOM_USER_LEFT: 'room:user-left',
    ROOM_FULL: 'room:full',
    ROOM_GET_STATE: 'room:get-state',

    // Drawing
    DRAW_UPDATE: 'draw:update',
    DRAW_CLEAR: 'draw:clear',

    // Canvas
    CANVAS_ZOOM: 'canvas:zoom',
    CANVAS_PAN: 'canvas:pan',

    // Cursor
    CURSOR_MOVE: 'cursor:move',

    // File
    FILE_UPLOAD: 'file:upload',

    // Connection
    CONNECT: 'connect',
    DISCONNECT: 'disconnect',
    ERROR: 'error',
  },

  // Colors
  DEFAULT_STROKE_COLOR: '#000000',
  DEFAULT_FILL_COLOR: '#ffffff',
}

export default CONSTANTS
