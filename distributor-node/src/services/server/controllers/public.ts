import * as express from 'express'
import { Logger } from 'winston'
import send from 'send'
import { StateCacheService } from '../../../services/cache/StateCacheService'
import { NetworkingService } from '../../../services/networking'
import { ErrorResponse, RouteParams } from '../../../types/api'
import { LoggingService } from '../../logging'
import { ContentService, DEFAULT_CONTENT_TYPE } from '../../content/ContentService'
import proxy from 'express-http-proxy'

export class PublicApiController {
  private logger: Logger
  private networking: NetworkingService
  private stateCache: StateCacheService
  private content: ContentService

  public constructor(
    logging: LoggingService,
    networking: NetworkingService,
    stateCache: StateCacheService,
    content: ContentService
  ) {
    this.logger = logging.createLogger('PublicApiController')
    this.networking = networking
    this.stateCache = stateCache
    this.content = content
  }

  private serveAvailableAsset(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
    contentHash: string
  ): void {
    // TODO: FIXME: Actually check if we are still supposed to serve it and just remove after responding if not
    this.stateCache.useContent(contentHash)

    const path = this.content.path(contentHash)
    const stream = send(req, path)
    const mimeType = this.stateCache.getContentMimeType(contentHash)

    stream.on('headers', (res) => {
      res.setHeader('content-disposition', 'inline')
      res.setHeader('content-type', mimeType || DEFAULT_CONTENT_TYPE)
    })

    stream.on('error', (err) => {
      this.logger.error('SendStream error while trying to serve an asset', { err })
      // General error
      const statusCode = err.status || 500
      const errorRes: ErrorResponse = {
        type: 'sendstream_error',
        message: err.toString(),
      }

      res.status(statusCode).json(errorRes)
    })

    stream.pipe(res)
  }

  private async servePendingDownloadAsset(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
    contentHash: string
  ) {
    const pendingDownload = this.stateCache.getPendingDownload(contentHash)
    if (!pendingDownload) {
      throw new Error('Trying to serve pending download asset that is not pending download!')
    }

    const { promise } = pendingDownload
    const response = await promise
    const source = new URL(response.config.url!)

    this.logger.info(`Proxying request to ${source.href}`, { source: source.href })

    // Proxy the request to download source
    await proxy(source.origin, {
      proxyReqPathResolver: () => source.pathname,
    })(req, res, next)
  }

  public async asset(
    req: express.Request<RouteParams<'public.asset'>>,
    res: express.Response,
    next: express.NextFunction
  ): Promise<void> {
    req.on('close', () => {
      res.end()
    })
    // TODO: objectId validation
    const objectId = req.params.objectId
    const contentHash = this.stateCache.getObjectContentHash(objectId)
    const pendingDownload = contentHash && this.stateCache.getPendingDownload(contentHash)

    this.logger.verbose('Data object state', { contentHash, pendingDownload })

    if (contentHash && !pendingDownload && this.content.exists(contentHash)) {
      this.logger.info('Requested file found in filesystem', { path: this.content.path(contentHash) })
      this.stateCache.useContent(contentHash)
      return this.serveAvailableAsset(req, res, next, contentHash)
    } else if (contentHash && pendingDownload) {
      this.logger.info('Requested file is in pending download state', { path: this.content.path(contentHash) })
      return this.servePendingDownloadAsset(req, res, next, contentHash)
    } else {
      this.logger.info('Requested file not found in filesystem')
      const objectInfo = await this.networking.dataObjectInfo(objectId)
      if (!objectInfo.exists) {
        const errorRes: ErrorResponse = {
          message: 'Data object does not exist',
        }
        res.status(404).json(errorRes)
        // TODO: UNCOMMENT!
        // } else if (!objectInfo.isSupported) {
        //   const errorRes: ErrorResponse = {
        //     message: 'Data object not served by this node',
        //   }
        //   res.status(400).json(errorRes)
        //   // TODO: Redirect to other node that supports it?
      } else {
        const { data: objectData } = objectInfo
        if (!objectData) {
          throw new Error('Missing data object data')
        }
        const { contentHash } = objectData
        const downloadResponse = await this.networking.downloadDataObject(objectData)

        if (downloadResponse) {
          this.content.handleNewContent(contentHash, downloadResponse.data)
        }
        return this.servePendingDownloadAsset(req, res, next, contentHash)
      }
    }
  }
}
