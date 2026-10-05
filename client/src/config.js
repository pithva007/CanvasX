/**
 * Client configuration
 */

export const CONFIG = {
  // API
  API_URL: import.meta.env.VITE_API_URL || 'http://localhost:3001',
  SOCKET_URL: import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001',

  // Socket.IO
  SOCKET_OPTIONS: {
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 5,
    transports: ['websocket', 'polling'],
  },

  // UI
  TOAST_DURATION: 3000,
  ANIMATION_DURATION: 300,

  // Drawing
  DEFAULT_STROKE_COLOR: '#000000',
  DEFAULT_FILL_COLOR: '#ffffff',
  DEFAULT_STROKE_WIDTH: 2,
  MIN_STROKE_WIDTH: 1,
  MAX_STROKE_WIDTH: 20,

  // Canvas
  DEFAULT_ZOOM: 1,
  MIN_ZOOM: 0.2,
  MAX_ZOOM: 5,
  ZOOM_STEP: 1.2,

  // Persistence
  STORAGE_PREFIX: 'canvasx_',
  AUTO_SAVE_INTERVAL: 5000,

  // Limits
  MAX_MESSAGE_SIZE: 1000,
  MAX_ROOM_PASSWORD_LENGTH: 50,

  // Debug
  DEBUG: import.meta.env.DEV,
}

export default CONFIG
