import winston, { Logger, LoggerOptions } from 'winston'
import escFormat from '@elastic/ecs-winston-format'
import { ReadonlyConfig } from '../../types'

export class LoggingService {
  private loggerOptions: LoggerOptions

  public constructor(config: ReadonlyConfig) {
    const transports: winston.LoggerOptions['transports'] = [
      new winston.transports.File({
        filename: `${config.directories.logs}/logs.json`,
        level: config.log?.file || 'debug',
      }),
    ]
    if (config.log?.console) {
      transports.push(
        new winston.transports.Console({
          level: config.log.console,
        })
      )
    }
    this.loggerOptions = {
      format: escFormat(),
      transports,
    }
  }

  public createLogger(label: string): Logger {
    return winston.createLogger({
      ...this.loggerOptions,
      defaultMeta: { label },
    })
  }
}
