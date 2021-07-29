import express from 'express'
import path from 'path'
import cors from 'cors'
import * as OpenApiValidator from 'express-openapi-validator'
import { HttpError } from 'express-openapi-validator/dist/framework/types'
import { ReadonlyConfig } from '../../types/config'
import expressWinston from 'express-winston'
import { LoggingService } from '../../services/logging'
import { PublicApiController } from './controllers/public'
import { StateCacheService } from '../cache/StateCacheService'
import { NetworkingService } from '../networking'
import { Logger } from 'winston'
import { ContentService } from '../content/ContentService'

const OPENAPI_SPEC_PATH = path.join(__dirname, '../../api-spec/openapi.yml')

export class ServerService {
  private config: ReadonlyConfig
  private logger: Logger
  private expressApp: express.Application

  private routeWrapper<T>(
    handler: (req: express.Request<T>, res: express.Response, next: express.NextFunction) => Promise<void>
  ) {
    return async (req: express.Request<T>, res: express.Response, next: express.NextFunction) => {
      try {
        await handler(req, res, next)
      } catch (err) {
        next(err)
      }
    }
  }

  public constructor(
    config: ReadonlyConfig,
    stateCache: StateCacheService,
    content: ContentService,
    logging: LoggingService,
    networking: NetworkingService
  ) {
    this.logger = logging.createLogger('ExpressServer')
    this.config = config

    const publicController = new PublicApiController(logging, networking, stateCache, content)

    const app = express()
    app.use(cors())
    app.use(express.json())

    // Request logger
    app.use(
      expressWinston.logger({
        winstonInstance: this.logger,
      })
    )

    // Setup OpenAPiValidator
    app.use(
      OpenApiValidator.middleware({
        apiSpec: OPENAPI_SPEC_PATH,
        validateApiSpec: true,
        validateResponses: true,
        validateRequests: true,
      })
    )

    // Routes
    app.use('/api/v1/asset/:objectId', this.routeWrapper(publicController.asset.bind(publicController)))

    // Error logger
    app.use(
      expressWinston.errorLogger({
        winstonInstance: this.logger,
      })
    )

    // Error handler
    app.use((err: HttpError, req: express.Request, res: express.Response, next: express.NextFunction) => {
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
    })

    this.expressApp = app
  }

  public start(): void {
    const { port } = this.config
    this.expressApp.listen(port, () => {
      this.logger.info(`Express server started listening on port ${port}`)
    })
  }
}
