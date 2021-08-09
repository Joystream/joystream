import winston, { Logger, LoggerOptions } from 'winston'
import escFormat from '@elastic/ecs-winston-format'
import { ReadonlyConfig } from '../../types'

const cliColors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'grey',
}

winston.addColors(cliColors)

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

  private constructor(options: LoggerOptions) {
    this.rootLogger = winston.createLogger(options)
  }

  public static withAppConfig(config: ReadonlyConfig): LoggingService {
    const transports: winston.LoggerOptions['transports'] = [
      new winston.transports.File({
        filename: `${config.directories.logs}/logs.json`,
        level: config.log?.file || 'debug',
        format: escFormat(),
      }),
    ]
    if (config.log?.console) {
      transports.push(
        new winston.transports.Console({
          level: config.log.console,
          format: cliFormat,
        })
      )
    }
    return new LoggingService({
      transports,
    })
  }

  public static withCLIConfig(): LoggingService {
    return new LoggingService({
      transports: new winston.transports.Console({
        // Log everything to stderr, only the command output value will be written to stdout
        stderrLevels: Object.keys(winston.config.npm.levels),
        format: cliFormat,
      }),
    })
  }

  public createLogger(label: string, ...meta: unknown[]): Logger {
    return this.rootLogger.child({ label, ...meta })
  }

  public end(): void {
    this.rootLogger.end()
  }
}
