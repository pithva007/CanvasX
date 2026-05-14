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
 * Validate room password
 */
export function validateRoomPassword(password) {
  if (!password || typeof password !== 'string') {
    return { valid: false, error: 'Invalid password format' }
  }

  const trimmed = password.trim()
  if (trimmed.length === 0) {
    return { valid: false, error: 'Password cannot be empty' }
  }

  if (trimmed.length > 50) {
    return { valid: false, error: 'Password too long' }
  }

  return { valid: true, error: null }
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
