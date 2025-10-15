/**
 * Server-side logger
 */

const isDev = process.env.NODE_ENV !== 'production'

function createLogger(context) {
  const prefix = `[${context}]`

  return {
    log: (...args) => {
      if (isDev) {
        console.log(prefix, ...args)
      }
    },
    error: (...args) => {
      console.error(prefix, '[ERROR]', ...args)
    },
    warn: (...args) => {
      if (isDev) {
        console.warn(prefix, '[WARN]', ...args)
      }
    },
    debug: (...args) => {
      if (isDev) {
        console.log(prefix, '[DEBUG]', ...args)
      }
    },
    info: (...args) => {
      console.log(prefix, '[INFO]', ...args)
    }
  }
}

module.exports = { createLogger }

