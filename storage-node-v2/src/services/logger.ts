import winston, { transport } from 'winston'
import ecsformat from '@elastic/ecs-winston-format'
import expressWinston from 'express-winston'
import { Handler, ErrorRequestHandler } from 'express'
import { ElasticsearchTransport } from 'winston-elasticsearch'
/**
 * Possible log levels.
 */
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
}

/**
 * Creates basic Winston logger. Console output redirected to the stderr.
 *
 * @returns Winston logger options
 *
 */
function createDefaultLoggerOptions(): winston.LoggerOptions {
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
  const transports = [new winston.transports.Console({ stderrLevels: Object.keys(levels), format })]

  return {
    level: level(),
    levels,
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
 * Creates Express-Winston logger options.
 *
 */
export function createExpressLoggerOptions(): expressWinston.LoggerOptions {
  return {
    winstonInstance: proxy,
    level: 'http',
  }
}

/**
 * Creates Express-Winston error logger.
 *
 * @param options - express winston logger options.
 * @returns  Express-Winston error logger
 *
 */
export function errorLogger(options: expressWinston.LoggerOptions): ErrorRequestHandler {
  return expressWinston.errorLogger(options)
}

/**
 * Creates Express-Winston logger handler.
 *
 * @param options - express winston logger options.
 * @returns  Express-Winston logger handler
 *
 */
export function httpLogger(options: expressWinston.LoggerOptions): Handler {
  return expressWinston.logger(options)
}

/**
 * Creates Winston logger with ElasticSearch and File transports.
 * @param logSource - source tag for log entries.
 * @param elasticSearchEndpoint - elastic search engine endpoint.
 * @returns Winston logger
 *
 */
function createCustomLogger(customOptions: {
  logSource: string
  elasticSearchEndpoint?: string
  filename?: string
}): winston.Logger {
  const loggerOptions = createDefaultLoggerOptions()

  // Transports
  let transports: transport[] = []
  if (loggerOptions.transports !== undefined) {
    transports = Array.isArray(loggerOptions.transports) ? loggerOptions.transports : [loggerOptions.transports]
  }

  if (customOptions.elasticSearchEndpoint) {
    transports.push(createElasticTransport(customOptions.logSource, customOptions.elasticSearchEndpoint))
  }
  if (customOptions.filename) {
    transports.push(createFileTransport(customOptions.filename))
  }

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
 * @param logSource - source tag for log entries.
 * @param elasticSearchEndpoint - elastic search engine endpoint.
 * @param filename - absolute path to the log file.
 */
export function initNewLogger(options: { logSource: string; elasticSearchEndpoint?: string; filename?: string }): void {
  InnerLogger = createCustomLogger(options)
}

/**
 * Creates winston logger transport for the elastic search engine.
 *
 * @param logSource - source tag for log entries.
 * @param elasticSearchEndpoint - elastic search engine endpoint.
 * @returns elastic search winston transport
 */
function createElasticTransport(logSource: string, elasticSearchEndpoint: string): winston.transport {
  const possibleLevels = ['warn', 'error', 'debug', 'info']

  let elasticLogLevel = process.env.ELASTIC_LOG_LEVEL ?? ''
  elasticLogLevel = elasticLogLevel.toLowerCase().trim()

  if (!possibleLevels.includes(elasticLogLevel)) {
    elasticLogLevel = 'debug' // default
  }

  const esTransportOpts = {
    level: elasticLogLevel,
    clientOpts: { node: elasticSearchEndpoint, maxRetries: 5 },
    index: 'storage-node',
    format: ecsformat(),
    source: logSource,
  }
  return new ElasticsearchTransport(esTransportOpts)
}

/**
 * Creates winston logger file transport.
 *
 * @param fileName - log file name.
 * @returns winston file transport
 */
function createFileTransport(filename: string): winston.transport {
  const options = {
    filename,
    maxsize: 50000000, // 50 MB
    maxFiles: 3,
    level: 'debug',
    format: ecsformat(),
  }
  return new winston.transports.File(options)
}
