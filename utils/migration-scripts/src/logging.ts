import winston, { Logger } from 'winston'
import stringify from 'fast-safe-stringify'

const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
}
winston.addColors(colors)

export function createLogger(label: string): Logger {
  return winston.createLogger({
    level: process.env.DEBUG ? 'debug' : 'info',
    transports: [new winston.transports.Console()],
    defaultMeta: { label },
    format: winston.format.combine(
      winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
      winston.format.metadata({ fillExcept: ['label', 'level', 'timestamp', 'message'] }),
      winston.format.colorize(),
      winston.format.printf(
        (info) =>
          `${info.timestamp} ${info.label} [${info.level}]: ${info.message}` +
          (Object.keys(info.metadata).length ? `\n${stringify(info.metadata, undefined, 4)}` : '')
      )
    ),
  })
}
