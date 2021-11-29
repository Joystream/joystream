import path from 'path'
import { ReadonlyConfig } from '../../types/config'
import { LoggingService } from '../logging'
import { PublicApiController } from './controllers/public'
import { StateCacheService } from '../cache/StateCacheService'
import { NetworkingService } from '../networking'
import { ContentService } from '../content/ContentService'
import { HttpApiBase, HttpApiRoute } from './HttpApiBase'
import { OpenApiValidatorOpts } from 'express-openapi-validator/dist/openapi.validator'

const OPENAPI_SPEC_PATH = path.join(__dirname, '../../api-spec/public.yml')

export class PublicApiService extends HttpApiBase {
  protected port: number

  private loggingService: LoggingService
  private networkingService: NetworkingService
  private stateCache: StateCacheService
  private contentService: ContentService

  public constructor(
    config: ReadonlyConfig,
    stateCache: StateCacheService,
    content: ContentService,
    logging: LoggingService,
    networking: NetworkingService
  ) {
    super(config, logging.createLogger('PublicApi'))
    this.stateCache = stateCache
    this.loggingService = logging
    this.networkingService = networking
    this.contentService = content
    this.port = config.publicApi.port
    this.initApp()
  }

  protected openApiValidatorConfig(): OpenApiValidatorOpts {
    return {
      apiSpec: OPENAPI_SPEC_PATH,
      ...this.defaultOpenApiValidatorConfig(),
    }
  }

  protected routes(): HttpApiRoute[] {
    const publicController = new PublicApiController(
      this.config,
      this.loggingService,
      this.networkingService,
      this.stateCache,
      this.contentService
    )

    return [
      ['head', '/api/v1/assets/:objectId', publicController.assetHead.bind(publicController)],
      ['get', '/api/v1/assets/:objectId', publicController.asset.bind(publicController)],
      ['get', '/api/v1/status', publicController.status.bind(publicController)],
      ['get', '/api/v1/buckets', publicController.buckets.bind(publicController)],
    ]
  }
}
