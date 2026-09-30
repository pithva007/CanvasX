/**
 * Server utility functions
 */

/**
 * Generate unique user ID
 */
export function generateUserId() {
  return `user_${Math.random().toString(36).substring(2, 9)}`
}

/**
 * Validate room code
 */
export function validateRoomCode(roomCode) {
  if (!roomCode || typeof roomCode !== 'string') {
    return { valid: false, error: 'Room code is required' }
  }

  const trimmed = roomCode.trim().toUpperCase()
  if (trimmed.length === 0) {
    return { valid: false, error: 'Room code cannot be empty' }
  }

  if (trimmed.length < 3 || trimmed.length > 30) {
    return { valid: false, error: 'Room code must be between 3 and 30 characters' }
  }

  return { valid: true, error: null, code: trimmed }
}

/**
 * Validate room password (backward compatibility)
 */
export function validateRoomPassword(password) {
  return validateRoomCode(password)
}

/**
 * Sanitize user input
 */
export function sanitizeInput(input) {
  if (typeof input !== 'string') return ''
  return input.trim().substring(0, 100)
}

/**
 * Check if user is in room
 */
export function isUserInRoom(room, userId) {
  return room && room.users.has(userId)
}

/**
 * Get room info for logging
 */
export function getRoomInfo(room) {
  return {
    roomId: room.sessionId,
    password: '***', // Don't log password
    userCount: room.users.size,
    createdAt: room.createdAt,
  }
}
