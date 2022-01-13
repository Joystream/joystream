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
 * Creates Express-Winston logger handler.
 * @param logSource - source tag for log entries.
 * @param elasticSearchEndpoint - elastic search engine endpoint (optional).
 * @returns  Express-Winston logger handler
 *
 */
export function httpLogger(logSource: string, elasticSearchEndpoint?: string): Handler {
  // ElasticSearch server date format.
  const elasticDateFormat = 'YYYY-MM-DDTHH:mm:ss'

  const transports: winston.transport[] = [
    new winston.transports.Console({
      format: winston.format.combine(winston.format.timestamp({ format: elasticDateFormat }), winston.format.json()),
    }),
  ]

  if (elasticSearchEndpoint) {
    const esTransport = createElasticTransport(logSource, elasticSearchEndpoint)
    transports.push(esTransport)
  }

  const opts: expressWinston.LoggerOptions = {
    transports,
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
 * @param logSource - source tag for log entries.
 * @param elasticSearchEndpoint - elastic search engine endpoint.
 * @returns Winston logger
 *
 */
function createElasticLogger(logSource: string, elasticSearchEndpoint: string): winston.Logger {
  const loggerOptions = createDefaultLoggerOptions()

  // Transports
  let transports: transport[] = []
  if (loggerOptions.transports !== undefined) {
    transports = Array.isArray(loggerOptions.transports) ? loggerOptions.transports : [loggerOptions.transports]
  }

  const esTransport = createElasticTransport(logSource, elasticSearchEndpoint)
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
 * @param logSource - source tag for log entries.
 * @param elasticSearchEndpoint - elastic search engine endpoint.
 */
export function initElasticLogger(logSource: string, elasticSearchEndpoint: string): void {
  InnerLogger = createElasticLogger(logSource, elasticSearchEndpoint)
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
