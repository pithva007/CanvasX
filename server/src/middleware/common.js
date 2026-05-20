const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:3000',
]

if (process.env.CLIENT_URL) {
  allowedOrigins.push(process.env.CLIENT_URL.replace(/\/$/, ''))
}

/**
 * Validates whether a request origin is allowed under our CORS policy.
 */
export function isOriginAllowed(origin) {
  if (!origin) return true // Allow same-origin or non-browser requests

  const cleanOrigin = origin.replace(/\/$/, '')

  // Exact match in configured/standard origins
  if (allowedOrigins.includes(cleanOrigin)) {
    return true
  }

  // Dynamic subdomain matching for Render
  if (cleanOrigin.endsWith('.onrender.com')) {
    return true
  }

  // Dynamic subdomain matching for Vercel
  if (cleanOrigin.endsWith('.vercel.app')) {
    return true
  }

  return false
}

/**
 * CORS middleware
 */
export function corsMiddleware(req, res, next) {
  const origin = req.headers.origin

  if (isOriginAllowed(origin)) {
    res.header('Access-Control-Allow-Origin', origin || '*')
  } else {
    res.header('Access-Control-Allow-Origin', allowedOrigins[0])
  }

  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  res.header('Access-Control-Allow-Credentials', 'true')

  if (req.method === 'OPTIONS') {
    res.sendStatus(200)
  } else {
    next()
  }
}

/**
 * Request logging middleware
 */
export function loggerMiddleware(req, res, next) {
  const start = Date.now()
  res.on('finish', () => {
    const duration = Date.now() - start
    console.log(
      `[${new Date().toISOString()}] ${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`
    )
  })
  next()
}

/**
 * Error handling middleware
 */
export function errorHandler(err, req, res, next) {
  console.error('[Error]', err)

  const status = err.status || 500
  const message = err.message || 'Internal server error'

  res.status(status).json({
    error: true,
    status,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  })
}
