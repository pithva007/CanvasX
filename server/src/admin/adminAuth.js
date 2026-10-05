import crypto from 'crypto'

/**
 * Super Admin Authentication & Session Management
 *
 * Provides master password verification and cryptographically secure
 * session token issuance for the exclusive CanvasX Super Admin Panel.
 */

// Master Admin Password from environment or secure default
export const getAdminSecretKey = () => {
  return process.env.ADMIN_SECRET_KEY || 'CanvasX@Admin2026!'
}

// In-memory active admin sessions: token -> { createdAt, lastActive }
const adminSessions = new Map()

// Session expiry: 24 hours
const SESSION_EXPIRY_MS = 24 * 60 * 60 * 1000

/**
 * Verify provided password against the master admin secret key.
 * Uses timing-safe buffer comparison to prevent timing attacks.
 */
export function verifyAdminPassword(password) {
  if (!password || typeof password !== 'string') return false
  const secret = getAdminSecretKey().trim()
  const candidate = password.trim()

  if (candidate.length !== secret.length) return false

  try {
    const bufA = Buffer.from(candidate, 'utf8')
    const bufB = Buffer.from(secret, 'utf8')
    return crypto.timingSafeEqual(bufA, bufB)
  } catch (_) {
    return candidate === secret
  }
}

/**
 * Create a new cryptographically secure admin session token.
 */
export function createAdminSession() {
  const token = crypto.randomBytes(32).toString('hex')
  adminSessions.set(token, {
    createdAt: Date.now(),
    lastActive: Date.now(),
  })
  return token
}

/**
 * Validate an existing admin session token.
 */
export function validateAdminToken(token) {
  if (!token || typeof token !== 'string') return false
  const session = adminSessions.get(token)
  if (!session) return false

  const now = Date.now()
  if (now - session.createdAt > SESSION_EXPIRY_MS) {
    adminSessions.delete(token)
    return false
  }

  session.lastActive = now
  return true
}

/**
 * Revoke an admin session token on logout.
 */
export function revokeAdminSession(token) {
  if (token && adminSessions.has(token)) {
    adminSessions.delete(token)
    return true
  }
  return false
}

/**
 * Express middleware for protecting REST admin endpoints.
 */
export function adminAuthMiddleware(req, res, next) {
  const authHeader = req.headers.authorization
  const token =
    (authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null) ||
    req.headers['x-admin-token'] ||
    req.query.token

  if (!token || !validateAdminToken(token)) {
    return res.status(401).json({
      error: 'Unauthorized: Super Admin access required',
      code: 'ADMIN_UNAUTHORIZED',
    })
  }

  req.adminToken = token
  next()
}
