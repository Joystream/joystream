import express from 'express'
import path from 'path'
import { OpenApiValidatorOpts } from 'express-openapi-validator/dist/framework/types'
import { Config } from '../../types/config'
import { LoggingService } from '../logging'
import jwt from 'jsonwebtoken'
import { OperatorApiController } from './controllers/operator'
import { HttpApiBase, HttpApiRoute } from './HttpApiBase'
import { PublicApiService } from './PublicApiService'
import _ from 'lodash'
import { App } from '../../app'

const OPENAPI_SPEC_PATH = path.join(__dirname, '../../api-spec/operator.yml')
const JWT_TOKEN_MAX_AGE = '5m'

export class OperatorApiService extends HttpApiBase {
  protected port: number
  protected operatorSecretKey: string
  protected config: Config
  protected app: App
  protected publicApi: PublicApiService
  protected logging: LoggingService

  public constructor(config: Config, app: App, logging: LoggingService, publicApi: PublicApiService) {
    super(config, logging.createLogger('OperatorApi'))
    if (!config.operatorApi) {
      throw new Error('Cannot construct OperatorApiService - missing operatorApi config!')
    }
    this.port = config.operatorApi.port
    this.operatorSecretKey = config.operatorApi.hmacSecret
    this.config = config
    this.app = app
    this.logging = logging
    this.publicApi = publicApi
    this.initApp()
  }

  protected openApiValidatorConfig(): OpenApiValidatorOpts {
    return {
      apiSpec: OPENAPI_SPEC_PATH,
      validateSecurity: {
        handlers: {
          OperatorAuth: this.operatorRequestValidator(),
        },
      },
      ...this.defaultOpenApiValidatorConfig(),
    }
  }

  protected routes(): HttpApiRoute[] {
    const controller = new OperatorApiController(this.config, this.app, this.publicApi, this.logging)
    return [
      ['post', '/api/v1/stop-api', controller.stopApi.bind(controller)],
      ['post', '/api/v1/start-api', controller.startApi.bind(controller)],
      ['post', '/api/v1/shutdown', controller.shutdown.bind(controller)],
      ['post', '/api/v1/set-worker', controller.setWorker.bind(controller)],
      ['post', '/api/v1/set-buckets', controller.setBuckets.bind(controller)],
    ]
  }

  private operatorRequestValidator() {
    return (req: express.Request): boolean => {
      const authHeader = req.headers.authorization
      if (!authHeader) {
        throw new Error('Authrorization header missing')
      }

      const [authType, token] = authHeader.split(' ')
      if (authType.toLowerCase() !== 'bearer') {
        throw new Error(`Unexpected authorization type: ${authType}`)
      }

      if (!token) {
        throw new Error(`Bearer token missing`)
      }

      const decoded = jwt.verify(token, this.operatorSecretKey, { maxAge: JWT_TOKEN_MAX_AGE }) as jwt.JwtPayload

      if (!_.isEqual(req.body, decoded.reqBody)) {
        throw new Error('Invalid token: Request body does not match')
      }

      if (req.originalUrl !== decoded.reqUrl) {
        throw new Error('Invalid token: Request url does not match')
      }

      return true
    }
  }
}
