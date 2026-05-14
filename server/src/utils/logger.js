/**
 * Server logger utility
 */

const LOG_LEVELS = {
  ERROR: 'ERROR',
  WARN: 'WARN',
  INFO: 'INFO',
  DEBUG: 'DEBUG',
}

export class Logger {
  constructor(module) {
    this.module = module
  }

  _log(level, message, data = null) {
    const timestamp = new Date().toISOString()
    const prefix = `[${timestamp}] [${level}] [${this.module}]`

    if (data) {
      console.log(prefix, message, data)
    } else {
      console.log(prefix, message)
    }
  }

  error(message, data) {
    this._log(LOG_LEVELS.ERROR, message, data)
  }

  warn(message, data) {
    this._log(LOG_LEVELS.WARN, message, data)
  }

  info(message, data) {
    this._log(LOG_LEVELS.INFO, message, data)
  }

  debug(message, data) {
    if (process.env.NODE_ENV === 'development') {
      this._log(LOG_LEVELS.DEBUG, message, data)
    }
  }
}

export default Logger
