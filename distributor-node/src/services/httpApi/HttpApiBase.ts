import cors from 'cors'
import express from 'express'
import * as OpenApiValidator from 'express-openapi-validator'
import { HttpError, OpenApiValidatorOpts } from 'express-openapi-validator/dist/framework/types'
import expressWinston from 'express-winston'
import { Server } from 'http'
import { Logger } from 'winston'
import { ReadonlyConfig } from '../../types/config'
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type HttpApiRoute = ['get' | 'head' | 'post', string, express.RequestHandler<any>]

export abstract class HttpApiBase {
  protected abstract port: number
  protected expressApp: express.Application
  protected config: ReadonlyConfig
  protected logger: Logger
  private httpServer: Server | undefined
  private isInitialized = false
  private isOn = false

  protected routeWrapper(handler: express.RequestHandler) {
    return async (req: express.Request, res: express.Response, next: express.NextFunction): Promise<void> => {
      // Fix for express-winston in order to also log prematurely closed requests
      res.on('close', () => {
        res.locals.prematurelyClosed = !res.writableFinished
      })
      try {
        await handler(req, res, next)
      } catch (err) {
        next(err)
      }
    }
  }

  public constructor(config: ReadonlyConfig, logger: Logger) {
    this.expressApp = express()
    this.logger = logger
    this.config = config
  }

  protected createRoutes(routes: HttpApiRoute[]): void {
    routes.forEach(([type, path, handler]) => {
      // eslint-disable-next-line @typescript-eslint/no-misused-promises
      this.expressApp[type](path, this.routeWrapper(handler))
    })
  }

  protected abstract routes(): HttpApiRoute[]

  protected defaultOpenApiValidatorConfig(): Partial<OpenApiValidatorOpts> {
    // The convention is 'production' but we allow short form also 'prod'
    const isProd = process.env.NODE_ENV === 'prod' || process.env.NODE_ENV === 'production'
    return {
      // Validating responses severely impacts latency when reponses size is large!
      validateResponses: !isProd,
    }
  }

  protected abstract openApiValidatorConfig(): OpenApiValidatorOpts

  protected defaultRequestLoggerConfig(): expressWinston.LoggerOptions {
    return {
      winstonInstance: this.logger,
      level: 'http',
      dynamicMeta: (req, res) => {
        return { prematurelyClosed: res.locals.prematurelyClosed ?? false }
      },
    }
  }

  protected requestLoggerConfig(): expressWinston.LoggerOptions {
    return this.defaultRequestLoggerConfig()
  }

  protected defaultErrorLoggerConfig(): expressWinston.ErrorLoggerOptions {
    return {
      winstonInstance: this.logger,
      level: 'error',
      metaField: null,
      exceptionToMeta: (err) => ({ err }),
    }
  }

  protected errorLoggerConfig(): expressWinston.ErrorLoggerOptions {
    return this.defaultErrorLoggerConfig()
  }

  protected errorHandler() {
    return (err: HttpError, req: express.Request, res: express.Response, next: express.NextFunction): void => {
      if (res.headersSent) {
        return next(err)
      }
      if (err.status && err.status >= 400 && err.status < 500) {
        res
          .status(err.status)
          .json({
            type: 'request_validation',
            message: err.message,
            errors: err.errors,
          })
          .end()
      } else {
        res.status(err.status || 500).json({ type: 'exception', message: err.message })
      }
    }
  }

  protected initApp(): void {
    if (this.isInitialized) {
      return
    }
    const { expressApp: app } = this
    app.use(express.json())
    app.use(cors())
    app.use(expressWinston.logger(this.requestLoggerConfig()))
    app.use(OpenApiValidator.middleware(this.openApiValidatorConfig()))
    this.createRoutes(this.routes())
    app.use(expressWinston.errorLogger(this.errorLoggerConfig()))
    app.use(this.errorHandler())
    this.isInitialized = true
  }

  public start(): boolean {
    if (this.isOn) {
      return false
    }
    if (!this.isInitialized) {
      this.initApp()
    }
    this.httpServer = this.expressApp.listen(this.port, () => {
      this.logger.info(`Express server started listening on port ${this.port}`)
    })
    this.isOn = true
    return true
  }

  public stop(): boolean {
    if (!this.isOn) {
      return false
    }
    this.httpServer?.close()
    this.logger.info(`Express server stopped`)
    this.isOn = false
    return true
  }
}
