/**
 * CORS middleware
 */
export function corsMiddleware(req, res, next) {
  res.header('Access-Control-Allow-Origin', process.env.CLIENT_URL || '*')
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
