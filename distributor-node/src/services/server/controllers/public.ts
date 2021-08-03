import * as express from 'express'
import { Logger } from 'winston'
import send from 'send'
import { StateCacheService } from '../../../services/cache/StateCacheService'
import { NetworkingService } from '../../../services/networking'
import { ErrorResponse, RouteParams } from '../../../types/api'
import { LoggingService } from '../../logging'
import { ContentService, DEFAULT_CONTENT_TYPE } from '../../content/ContentService'
import proxy from 'express-http-proxy'

const CACHE_MAX_AGE = 31536000

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

  private serveAssetFromFilesystem(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
    contentHash: string
  ): void {
    // TODO: FIXME: Actually check if we are still supposed to serve it and just remove after responding if not
    // TODO: Limit the number of times useContent is trigerred for similar requests
    // (for example: same ip, 3 different request within a minute = 1 request)
    this.stateCache.useContent(contentHash)

    const path = this.content.path(contentHash)
    const stream = send(req, path, {
      maxAge: CACHE_MAX_AGE,
      lastModified: false,
    })
    const mimeType = this.stateCache.getContentMimeType(contentHash)

    stream.on('headers', (res) => {
      res.setHeader('x-cache', 'hit')
      res.setHeader('x-data-source', 'cache')
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

    const { promise, objectSize } = pendingDownload
    const response = await promise
    const source = new URL(response.config.url!)
    // TODO: FIXME: This may not be available soon! (may be removed from storage node)
    const contentType = response.headers['content-type'] || DEFAULT_CONTENT_TYPE
    res.setHeader('content-type', contentType)
    // Allow caching pendingDownload reponse only for very short period of time and requite revalidation,
    // since the data coming from the source may not be valid
    res.setHeader('cache-control', `max-age=180, must-revalidate`)

    // Handle request using pending download file if this makes sense in current context:
    if (this.content.exists(contentHash)) {
      const range = req.range(objectSize)
      if (!range || range === -1 || range === -2 || range.length !== 1 || range.type !== 'bytes') {
        // Range is not provided / invalid - serve data from pending download file
        return this.servePendingDownloadAssetFromFile(req, res, next, contentHash, objectSize)
      } else if (range[0].start === 0) {
        // Range starts from the beginning of the content - serve data from pending download file
        return this.servePendingDownloadAssetFromFile(req, res, next, contentHash, objectSize, range[0].end)
      }
    }

    // Range doesn't start from the beginning of the content or the file was not found - froward request to source storage node
    this.logger.info(`Forwarding request to ${source.href}`, { source: source.href })
    res.setHeader('x-data-source', 'external')
    return proxy(source.origin, { proxyReqPathResolver: () => source.pathname })(req, res, next)
  }

  private async servePendingDownloadAssetFromFile(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
    contentHash: string,
    objectSize: number,
    rangeEnd?: number
  ) {
    const isRange = rangeEnd !== undefined
    this.logger.info(`Serving pending download asset from file`, { contentHash, isRange, objectSize, rangeEnd })
    const stream = this.content.createContinousReadStream(contentHash, {
      end: isRange ? rangeEnd || 0 : objectSize - 1,
    })
    req.on('close', () => {
      res.end()
      stream.destroy()
    })
    res.status(isRange ? 206 : 200)
    res.setHeader('accept-ranges', 'bytes')
    res.setHeader('x-data-source', 'partial-cache')
    res.setHeader('content-disposition', 'inline')
    if (isRange) {
      res.setHeader('content-range', `bytes 0-${rangeEnd}/${objectSize}`)
    }
    stream.pipe(res)
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
      return this.serveAssetFromFilesystem(req, res, next, contentHash)
    } else if (contentHash && pendingDownload) {
      this.logger.info('Requested file is in pending download state', { path: this.content.path(contentHash) })
      res.setHeader('x-cache', 'pending')
      return this.servePendingDownloadAsset(req, res, next, contentHash)
    } else {
      this.logger.info('Requested file not found in filesystem')
      const objectInfo = await this.networking.dataObjectInfo(objectId)
      if (!objectInfo.exists) {
        const errorRes: ErrorResponse = {
          message: 'Data object does not exist',
        }
        res.status(404).json(errorRes)
        // TODO: FIXME: UNCOMMENT!
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
        const { contentHash, size } = objectData

        const downloadResponse = await this.networking.downloadDataObject(objectData)

        if (downloadResponse) {
          // Note: Await will only wait unil the file is created, so we may serve the response from it
          await this.content.handleNewContent(contentHash, size, downloadResponse.data)
          res.setHeader('x-cache', 'fetch-triggered')
        } else {
          res.setHeader('x-cache', 'pending')
        }
        return this.servePendingDownloadAsset(req, res, next, contentHash)
      }
    }
  }
}
