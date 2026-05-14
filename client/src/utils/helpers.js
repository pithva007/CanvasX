/**
 * Utility functions
 */

/**
 * Validate password
 */
export function validatePassword(password) {
  if (!password || password.trim().length === 0) {
    return { valid: false, error: 'Password is required' }
  }
  if (password.length < 1) {
    return { valid: false, error: 'Password must be at least 1 character' }
  }
  if (password.length > 50) {
    return { valid: false, error: 'Password must be less than 50 characters' }
  }
  return { valid: true, error: null }
}

/**
 * Format room ID for display
 */
export function formatRoomId(roomId) {
  if (!roomId) return 'Unknown'
  return roomId.substring(0, 8).toUpperCase()
}

/**
 * Format timestamp
 */
export function formatTime(timestamp) {
  return new Date(timestamp).toLocaleTimeString()
}

/**
 * Generate random color
 */
export function randomColor() {
  const colors = [
    '#FF6B6B',
    '#4ECDC4',
    '#45B7D1',
    '#FFA07A',
    '#98D8C8',
    '#F7DC6F',
    '#BB8FCE',
    '#85C1E2',
  ]
  return colors[Math.floor(Math.random() * colors.length)]
}

/**
 * Debounce function
 */
export function debounce(func, wait) {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

/**
 * Throttle function
 */
export function throttle(func, limit) {
  let inThrottle
  return function (...args) {
    if (!inThrottle) {
      func.apply(this, args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}
