import * as express from 'express'
import { Logger } from 'winston'
import send from 'send'
import { StateCacheService } from '../../cache/StateCacheService'
import { NetworkingService } from '../../networking'
import { AssetRouteParams, BucketsResponse, ErrorResponse, StatusResponse } from '../../../types/api'
import { LoggingService } from '../../logging'
import { ContentService, DEFAULT_CONTENT_TYPE } from '../../content/ContentService'
import proxy from 'express-http-proxy'
import { DataObjectData, ObjectStatusType, ReadonlyConfig } from '../../../types'

const CACHED_MAX_AGE = 31536000
const PENDING_MAX_AGE = 180

export class PublicApiController {
  private config: ReadonlyConfig
  private logger: Logger
  private networking: NetworkingService
  private stateCache: StateCacheService
  private content: ContentService

  public constructor(
    config: ReadonlyConfig,
    logging: LoggingService,
    networking: NetworkingService,
    stateCache: StateCacheService,
    content: ContentService
  ) {
    this.config = config
    this.logger = logging.createLogger('PublicApiController')
    this.networking = networking
    this.stateCache = stateCache
    this.content = content
  }

  private createErrorResponse(message: string, type?: string): ErrorResponse {
    return { type, message }
  }

  private async serveMissingAsset(
    req: express.Request<AssetRouteParams>,
    res: express.Response,
    next: express.NextFunction,
    objectData: DataObjectData
  ): Promise<void> {
    const { objectId, size, contentHash } = objectData

    const downloadResponse = await this.networking.downloadDataObject({ objectData })

    if (downloadResponse) {
      // Note: Await will only wait unil the file is created, so we may serve the response from it
      await this.content.handleNewContent(objectId, size, contentHash, downloadResponse.data)
      res.setHeader('x-cache', 'miss')
    } else {
      res.setHeader('x-cache', 'pending')
    }
    return this.servePendingDownloadAsset(req, res, next, objectId)
  }

  private serveAssetFromFilesystem(
    req: express.Request<AssetRouteParams>,
    res: express.Response,
    next: express.NextFunction,
    objectId: string
  ): void {
    // TODO: Limit the number of times useContent is trigerred for similar requests?
    // (for example: same ip, 3 different request within a minute = 1 request)
    this.stateCache.useContent(objectId)

    const path = this.content.path(objectId)
    const stream = send(req, path, {
      maxAge: CACHED_MAX_AGE,
      lastModified: false,
    })
    const mimeType = this.stateCache.getContentMimeType(objectId)

    stream.on('headers', (res) => {
      res.setHeader('x-cache', 'hit')
      res.setHeader('x-data-source', 'local')
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
    req: express.Request<AssetRouteParams>,
    res: express.Response,
    next: express.NextFunction,
    objectId: string
  ) {
    const pendingDownload = this.stateCache.getPendingDownload(objectId)
    if (!pendingDownload) {
      throw new Error('Trying to serve pending download asset that is not pending download!')
    }

    const { promise, objectSize } = pendingDownload
    const response = await promise
    const source = new URL(response.config.url || '')
    const contentType = response.headers['content-type'] || DEFAULT_CONTENT_TYPE
    res.setHeader('content-type', contentType)
    // Allow caching pendingDownload reponse only for very short period of time and requite revalidation,
    // since the data coming from the source may not be valid
    res.setHeader('cache-control', `max-age=${PENDING_MAX_AGE}, must-revalidate`)

    // Handle request using pending download file if this makes sense in current context:
    if (this.content.exists(objectId)) {
      const partiallyDownloadedContentSize = this.content.fileSize(objectId)
      const range = req.range(objectSize)
      if (!range || range === -1 || range === -2 || range.length !== 1 || range.type !== 'bytes') {
        // Range is not provided / invalid - serve data from pending download file
        return this.servePendingDownloadAssetFromFile(req, res, next, objectId, objectSize)
      } else if (range[0].start <= partiallyDownloadedContentSize) {
        // Range starts at the already downloaded part of the content - serve data from pending download file
        return this.servePendingDownloadAssetFromFile(req, res, next, objectId, objectSize, range[0])
      }
    }

    // Range doesn't start from the beginning of the content or the file was not found - froward request to source storage node
    this.logger.verbose(`Forwarding request to ${source.href}`, { source: source.href })
    res.setHeader('x-data-source', 'external')
    return proxy(source.origin, { proxyReqPathResolver: () => source.pathname })(req, res, next)
  }

  private async servePendingDownloadAssetFromFile(
    req: express.Request<AssetRouteParams>,
    res: express.Response,
    next: express.NextFunction,
    objectId: string,
    objectSize: number,
    range?: { start: number; end: number }
  ) {
    this.logger.verbose(`Serving pending download asset from file`, { objectId, objectSize, range })
    const stream = this.content.createContinousReadStream(objectId, {
      start: range?.start,
      end: range !== undefined ? range.end : objectSize - 1,
    })
    res.status(range !== undefined ? 206 : 200)
    res.setHeader('accept-ranges', 'bytes')
    res.setHeader('x-data-source', 'local')
    res.setHeader('content-disposition', 'inline')
    if (range !== undefined) {
      res.setHeader('content-range', `bytes ${range.start}-${range.end}/${objectSize}`)
    }
    stream.pipe(res)
    req.on('close', () => {
      stream.destroy()
      res.destroy()
    })
  }

  public async assetHead(req: express.Request<AssetRouteParams>, res: express.Response): Promise<void> {
    const { objectId } = req.params
    const objectStatus = await this.content.objectStatus(objectId)

    res.setHeader('timing-allow-origin', '*')
    res.setHeader('accept-ranges', 'bytes')
    res.setHeader('content-disposition', 'inline')

    switch (objectStatus.type) {
      case ObjectStatusType.Available:
        res.status(200)
        res.setHeader('x-cache', 'hit')
        res.setHeader('cache-control', `max-age=${CACHED_MAX_AGE}`)
        res.setHeader('content-type', this.stateCache.getContentMimeType(objectId) || DEFAULT_CONTENT_TYPE)
        res.setHeader('content-length', this.content.fileSize(objectId))
        break
      case ObjectStatusType.PendingDownload:
        res.status(200)
        res.setHeader('x-cache', 'pending')
        res.setHeader('cache-control', `max-age=${PENDING_MAX_AGE}, must-revalidate`)
        res.setHeader('content-length', objectStatus.pendingDownloadData.objectSize)
        break
      case ObjectStatusType.NotFound:
        res.status(404)
        break
      case ObjectStatusType.NotSupported:
        res.status(421)
        break
      case ObjectStatusType.Missing:
        res.status(200)
        res.setHeader('x-cache', 'miss')
        res.setHeader('cache-control', `max-age=${PENDING_MAX_AGE}, must-revalidate`)
        res.setHeader('content-length', objectStatus.objectData.size)
        break
    }

    res.send()
  }

  public async asset(
    req: express.Request<AssetRouteParams>,
    res: express.Response,
    next: express.NextFunction
  ): Promise<void> {
    const { objectId } = req.params
    const objectStatus = await this.content.objectStatus(objectId)

    this.logger.verbose('Data object requested', {
      objectId,
      objectStatus,
    })

    res.setHeader('timing-allow-origin', '*')

    switch (objectStatus.type) {
      case ObjectStatusType.Available:
        return this.serveAssetFromFilesystem(req, res, next, objectId)
      case ObjectStatusType.PendingDownload:
        res.setHeader('x-cache', 'pending')
        return this.servePendingDownloadAsset(req, res, next, objectId)
      case ObjectStatusType.NotFound:
        res.status(404).json(this.createErrorResponse('Data object does not exist'))
        return
      case ObjectStatusType.NotSupported:
        res.status(421).json(this.createErrorResponse('Data object not served by this node'))
        return
      case ObjectStatusType.Missing:
        return this.serveMissingAsset(req, res, next, objectStatus.objectData)
    }
  }

  public async status(req: express.Request, res: express.Response<StatusResponse>): Promise<void> {
    const data: StatusResponse = {
      id: this.config.id,
      objectsInCache: this.stateCache.getCachedObjectsCount(),
      storageLimit: this.config.limits.storage,
      storageUsed: this.content.usedSpace,
      uptime: Math.floor(process.uptime()),
      downloadsInProgress: this.stateCache.getPendingDownloadsCount(),
    }
    res.status(200).json(data)
  }

  public async buckets(req: express.Request, res: express.Response<BucketsResponse>): Promise<void> {
    res
      .status(200)
      .json(
        this.config.buckets === 'all'
          ? { allByWorkerId: this.config.workerId }
          : { bucketIds: [...this.config.buckets] }
      )
  }
}
