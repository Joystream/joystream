import winston, { Logger, LoggerOptions } from 'winston'
import escFormat from '@elastic/ecs-winston-format'
import { ElasticsearchTransport } from 'winston-elasticsearch'
import { ReadonlyConfig } from '../../types'
import { blake2AsHex } from '@polkadot/util-crypto'
import { Format } from 'logform'
import NodeCache from 'node-cache'

const cliColors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'grey',
}

winston.addColors(cliColors)

const pausedLogs = new NodeCache({
  deleteOnExpire: true,
})

// Pause log for a specified time period
const pauseFormat: (opts: { id: string }) => Format = winston.format((info, opts: { id: string }) => {
  if (info['@pauseFor']) {
    const messageHash = blake2AsHex(`${opts.id}:${info.level}:${info.message}`)
    if (!pausedLogs.has(messageHash)) {
      pausedLogs.set(messageHash, null, info['@pauseFor'])
      info.message += ` (this log message will be skipped for the next ${info['@pauseFor']}s)`
      delete info['@pauseFor']
      return info
    }
    return false
  }

  return info
})

const cliFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.metadata({ fillExcept: ['label', 'level', 'timestamp', 'message'] }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) =>
      `${info.timestamp} ${info.label} ${info.level}: ${info.message}` +
      (Object.keys(info.metadata).length ? `\n${JSON.stringify(info.metadata, null, 4)}` : '')
  )
)

export class LoggingService {
  private rootLogger: Logger
  private esTransport: ElasticsearchTransport | undefined

  private constructor(options: LoggerOptions, esTransport?: ElasticsearchTransport) {
    this.esTransport = esTransport
    this.rootLogger = winston.createLogger(options)
  }

  public static withAppConfig(config: ReadonlyConfig): LoggingService {
    const transports: winston.LoggerOptions['transports'] = []

    let esTransport: ElasticsearchTransport | undefined
    if (config.log?.elastic && config.log.elastic !== 'off') {
      if (!config.endpoints.elasticSearch) {
        throw new Error('config.endpoints.elasticSearch must be provided when elasticSeach logging is enabled!')
      }
      esTransport = new ElasticsearchTransport({
        level: config.log.elastic,
        format: winston.format.combine(pauseFormat({ id: 'es' }), escFormat()),
        flushInterval: 5000,
        source: config.id,
        clientOpts: {
          node: {
            url: new URL(config.endpoints.elasticSearch),
          },
        },
      })
      transports.push(esTransport)
    }

    const fileTransport =
      config.log?.file && config.log.file !== 'off'
        ? new winston.transports.File({
            filename: `${config.directories.logs}/logs.json`,
            level: config.log.file,
            format: winston.format.combine(pauseFormat({ id: 'file' }), escFormat()),
          })
        : undefined
    if (fileTransport) {
      transports.push(fileTransport)
    }

    const consoleTransport =
      config.log?.console && config.log.console !== 'off'
        ? new winston.transports.Console({
            level: config.log.console,
            format: winston.format.combine(pauseFormat({ id: 'cli' }), cliFormat),
          })
        : undefined
    if (consoleTransport) {
      transports.push(consoleTransport)
    }

    return new LoggingService(
      {
        transports,
      },
      esTransport
    )
  }

  public static withCLIConfig(): LoggingService {
    return new LoggingService({
      transports: new winston.transports.Console({
        // Log everything to stderr, only the command output value will be written to stdout
        stderrLevels: Object.keys(winston.config.npm.levels),
        format: winston.format.combine(pauseFormat({ id: 'cli' }), cliFormat),
      }),
    })
  }

  public createLogger(label: string, ...meta: unknown[]): Logger {
    return this.rootLogger.child({ label, ...meta })
  }

  public async end(): Promise<void> {
    if (this.esTransport) {
      await this.esTransport.flush()
    }
    this.rootLogger.end()
    await Promise.all(this.rootLogger.transports.map((t) => new Promise((resolve) => t.on('finish', resolve))))
  }
}
