import winston, { transport } from 'winston'
import expressWinston from 'express-winston'
import { Handler, ErrorRequestHandler } from 'express'
import { ElasticsearchTransport } from 'winston-elasticsearch'

/**
 * Creates basic Winston logger. Console output redirected to the stderr.
 *
 * @returns Winston logger options
 *
 */
function createDefaultLoggerOptions(): winston.LoggerOptions {
  // Levels
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

  // Colors
  const colors = {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'magenta',
    debug: 'white',
  }
  winston.addColors(colors)

  // Formats
  const format = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
    winston.format.colorize(),
    winston.format.printf((info) => `${info.timestamp} ${info.level}: ${info.message}`)
  )

  // Redirect all logs to the stderr
  const transports = [new winston.transports.Console({ stderrLevels: Object.keys(levels) })]

  return {
    level: level(),
    levels,
    format,
    transports,
  }
}

/**
 * Creates basic Winston logger.
 *
 * @returns Winston logger
 *
 */
function createDefaultLogger(): winston.Logger {
  const defaultOptions = createDefaultLoggerOptions()

  return winston.createLogger(defaultOptions)
}

// Default global logger variable
let InnerLogger = createDefaultLogger()

// Enables changing the underlying logger which is default import in other modules.
const proxy = new Proxy(InnerLogger, {
  get(target: winston.Logger, propKey: symbol) {
    const method = Reflect.get(target, propKey)
    return (...args: unknown[]) => {
      return method.apply(InnerLogger, args)
    }
  },
})

export default proxy

/**
 * Creates Express-Winston logger handler.
 *
 * @param elasticSearchEndpoint - elastic search engine endpoint (optional).
 * @returns  Express-Winston logger handler
 *
 */
export function httpLogger(elasticSearchEndpoint?: string): Handler {
  const transports: winston.transport[] = [new winston.transports.Console()]

  if (elasticSearchEndpoint) {
    const esTransport = createElasticTransport(elasticSearchEndpoint)
    transports.push(esTransport)
  }

  const opts: expressWinston.LoggerOptions = {
    transports,
    format: winston.format.combine(
      winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
      winston.format.json()
    ),
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
/**
 * Creates Winston logger with Elastic search.
 *
 * @returns Winston logger
 *
 */
function createElasticLogger(elasticSearchEndpoint: string): winston.Logger {
  const loggerOptions = createDefaultLoggerOptions()

  // Formats
  loggerOptions.format = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
    winston.format.printf((info) => `${info.timestamp} ${info.level}: ${info.message}`)
  )

  // Transports
  let transports: transport[] = []
  if (loggerOptions.transports !== undefined) {
    transports = Array.isArray(loggerOptions.transports) ? loggerOptions.transports : [loggerOptions.transports]
  }

  const esTransport = createElasticTransport(elasticSearchEndpoint)
  transports.push(esTransport)

  // Logger
  const logger = winston.createLogger(loggerOptions)

  // Handle logger error.
  logger.on('error', (err) => {
    // Allow console for logging errors of the logger.
    /* eslint-disable no-console */
    console.error('Error in logger caught:', err)
  })

  return logger
}

/**
 * Updates the default system logger with elastic search capabilities.
 *
 * @param elasticSearchEndpoint - elastic search engine endpoint.
 */
export function initElasticLogger(elasticSearchEndpoint: string): void {
  InnerLogger = createElasticLogger(elasticSearchEndpoint)
}

/**
 * Creates winston logger transport for the elastic search engine.
 *
 * @param elasticSearchEndpoint - elastic search engine endpoint.
 * @returns elastic search winston transport
 */
function createElasticTransport(elasticSearchEndpoint: string): winston.transport {
  const esTransportOpts = {
    level: 'debug', // TODO: consider changing to warn
    clientOpts: { node: elasticSearchEndpoint, maxRetries: 5 },
    index: 'storage-node',
  }
  return new ElasticsearchTransport(esTransportOpts)
}
