import winston from 'winston'
import expressWinston from 'express-winston'
import { Handler, ErrorRequestHandler } from 'express'

/**
 * Creates basic Winston logger. Console output redirected to the stderr.
 *
 * @returns Winston logger
 *
 */
function createDefaultLogger(): winston.Logger {
  const levels = {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4,
  }

  const level = () => {
    const env = process.env.NODE_ENV || 'development'
    const isDevelopment = env === 'development'
    return isDevelopment ? 'debug' : 'warn'
  }

  const colors = {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'magenta',
    debug: 'white',
  }

  winston.addColors(colors)

  const format = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
    winston.format.colorize({ all: true }),
    winston.format.printf((info) => `${info.timestamp} ${info.level}: ${info.message}`)
  )

  // Redirect all logs to the stderr
  const transports = [new winston.transports.Console({ stderrLevels: Object.keys(levels) })]

  return winston.createLogger({
    level: level(),
    levels,
    format,
    transports,
  })
}

const Logger = createDefaultLogger()

export default Logger
/**
 * Creates Express-Winston logger handler.
 *
 * @returns  Express-Winston logger handler
 *
 */
export function httpLogger(): Handler {
  const opts: expressWinston.LoggerOptions = {
    transports: [new winston.transports.Console()],
    format: winston.format.combine(winston.format.json()),
    meta: true,
    msg: 'HTTP {{req.method}} {{req.url}}',
    expressFormat: true,
    colorize: false,
  }

  return expressWinston.logger(opts)
}

/**
 * Creates Express-Winston error logger.
 *
 * @returns  Express-Winston error logger
 *
 */
export function errorLogger(): ErrorRequestHandler {
  return expressWinston.errorLogger({
    transports: [new winston.transports.Console()],
    format: winston.format.combine(winston.format.json()),
  })
}

/**
 * Creates clean Console Winston logger for standard output.
 *
 * @returns Winston logger
 *
 */
export function createStdConsoleLogger(): winston.Logger {
  const levels = {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4,
  }
  const format = winston.format.printf((info) => `${info.message}`)

  const transports = [new winston.transports.Console()]

  return winston.createLogger({
    levels,
    format,
    transports,
  })
}
