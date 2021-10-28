import { ReadonlyConfig } from '../../types/config'
import { QueryNodeApi } from './query-node/api'
import { Logger } from 'winston'
import { LoggingService } from '../logging'
import { StorageNodeApi } from './storage-node/api'
import { StateCacheService } from '../cache/StateCacheService'
import { DataObjectDetailsFragment } from './query-node/generated/queries'
import axios from 'axios'
import {
  StorageNodeEndpointData,
  DataObjectAccessPoints,
  DataObjectData,
  DataObjectInfo,
  StorageNodeDownloadResponse,
  DownloadData,
} from '../../types'
import queue from 'queue'
import { DistributionBucketOperatorStatus } from './query-node/generated/schema'
import http from 'http'
import https from 'https'
import { parseAxiosError } from '../parsers/errors'
import { PendingDownload, PendingDownloadStatusType } from './PendingDownload'

// Concurrency limits
export const MAX_CONCURRENT_AVAILABILITY_CHECKS_PER_OBJECT = 10
export const MAX_CONCURRENT_RESPONSE_TIME_CHECKS = 10

export class NetworkingService {
  private config: ReadonlyConfig
  private queryNodeApi: QueryNodeApi
  private logging: LoggingService
  private stateCache: StateCacheService
  private logger: Logger

  private testLatencyQueue: queue
  private downloadQueue: queue

  constructor(config: ReadonlyConfig, stateCache: StateCacheService, logging: LoggingService) {
    axios.defaults.timeout = config.limits.outboundRequestsTimeoutMs
    const httpConfig: http.AgentOptions | https.AgentOptions = {
      keepAlive: true,
      timeout: config.limits.outboundRequestsTimeoutMs,
      maxSockets: config.limits.maxConcurrentOutboundConnections,
    }
    axios.defaults.httpAgent = new http.Agent(httpConfig)
    axios.defaults.httpsAgent = new https.Agent(httpConfig)
    this.config = config
    this.logging = logging
    this.stateCache = stateCache
    this.logger = logging.createLogger('NetworkingManager')
    this.queryNodeApi = new QueryNodeApi(config.endpoints.queryNode, this.logging)
    void this.checkActiveStorageNodeEndpoints()
    // Queues
    this.testLatencyQueue = queue({ concurrency: MAX_CONCURRENT_RESPONSE_TIME_CHECKS, autostart: true }).on(
      'end',
      () => {
        this.logger.verbose('Mean response times updated', {
          responseTimes: this.stateCache.getStorageNodeEndpointsMeanResponseTimes(),
        })
      }
    )
    this.downloadQueue = queue({ concurrency: config.limits.maxConcurrentStorageNodeDownloads, autostart: true })
    this.downloadQueue.on('error', (err) => {
      this.logger.error('Data object download failed', { err })
    })
  }

  private validateNodeEndpoint(endpoint: string): void {
    const endpointUrl = new URL(endpoint)
    if (endpointUrl.protocol !== 'http:' && endpointUrl.protocol !== 'https:') {
      throw new Error(`Invalid endpoint protocol: ${endpointUrl.protocol}`)
    }
  }

  private filterStorageNodeEndpoints(input: StorageNodeEndpointData[]): StorageNodeEndpointData[] {
    return input.filter((b) => {
      try {
        this.validateNodeEndpoint(b.endpoint)
        return true
      } catch (err) {
        this.logger.warn(`Invalid storage node endpoint: ${b.endpoint} for bucket ${b.bucketId}`, {
          bucketId: b.bucketId,
          endpoint: b.endpoint,
          err,
          '@pauseFor': 900,
        })
        return false
      }
    })
  }

  private getApiEndpoint(rootEndpoint: string) {
    return rootEndpoint.endsWith('/') ? rootEndpoint + 'api/v1' : rootEndpoint + '/api/v1'
  }

  private prepareStorageNodeEndpoints(details: DataObjectDetailsFragment) {
    const endpointsData = details.storageBag.storageAssignments
      .filter((a) => a.storageBucket.operatorStatus.__typename === 'StorageBucketOperatorStatusActive')
      .map((a) => {
        const rootEndpoint = a.storageBucket.operatorMetadata?.nodeEndpoint
        const apiEndpoint = rootEndpoint ? this.getApiEndpoint(rootEndpoint) : ''
        return {
          bucketId: a.storageBucket.id,
          endpoint: apiEndpoint,
        }
      })

    return this.filterStorageNodeEndpoints(endpointsData)
  }

  private parseDataObjectAccessPoints(details: DataObjectDetailsFragment): DataObjectAccessPoints {
    return {
      storageNodes: this.prepareStorageNodeEndpoints(details),
    }
  }

  private getDataObjectActiveDistributorsSet(objectDetails: DataObjectDetailsFragment): Set<number> {
    const activeDistributorsSet = new Set<number>()
    const { distirbutionAssignments } = objectDetails.storageBag
    const distributionBuckets = distirbutionAssignments.map((a) => a.distributionBucket)
    for (const bucket of distributionBuckets) {
      for (const operator of bucket.operators) {
        if (operator.status === DistributionBucketOperatorStatus.Active) {
          activeDistributorsSet.add(operator.workerId)
        }
      }
    }
    return activeDistributorsSet
  }

  public async dataObjectInfo(objectId: string): Promise<DataObjectInfo> {
    const details = await this.queryNodeApi.getDataObjectDetails(objectId)
    let exists = false
    let isSupported = false
    let data: DataObjectData | undefined
    if (details) {
      exists = true
      if (this.config.buckets === 'all') {
        const distributors = this.getDataObjectActiveDistributorsSet(details)
        isSupported = distributors.has(this.config.workerId)
      } else {
        const supportedBucketIds = this.config.buckets.map((id) => id.toString())
        isSupported = details.storageBag.distirbutionAssignments.some((a) =>
          supportedBucketIds.includes(a.distributionBucket.id)
        )
      }
      data = {
        objectId,
        accessPoints: this.parseDataObjectAccessPoints(details),
        contentHash: details.ipfsHash,
        size: parseInt(details.size),
      }
    }

    return { exists, isSupported, data }
  }

  private sortEndpointsByMeanResponseTime(endpoints: string[]) {
    return endpoints.sort(
      (a, b) =>
        this.stateCache.getStorageNodeEndpointMeanResponseTime(a) -
        this.stateCache.getStorageNodeEndpointMeanResponseTime(b)
    )
  }

  private async checkObjectAvailability(objectId: string, endpoint: string): Promise<void> {
    const api = new StorageNodeApi(endpoint, this.logging, this.config)
    const available = await api.isObjectAvailable(objectId)
    if (!available) {
      throw new Error('Not available')
    }
  }

  private createDataObjectAvailabilityCheckQueue(objectId: string, storageEndpoints: string[]) {
    const availabilityQueue = queue({
      concurrency: MAX_CONCURRENT_AVAILABILITY_CHECKS_PER_OBJECT,
      autostart: true,
    })

    storageEndpoints.forEach(async (endpoint) => {
      availabilityQueue.push(async () => {
        await this.checkObjectAvailability(objectId, endpoint)
        return endpoint
      })
    })

    availabilityQueue.on('error', () => {
      /*
      Do nothing.
      The handler is needed to avoid unhandled promise rejection
      */
    })

    return availabilityQueue
  }

  public async getDataObjectDownloadSource(objectData: DataObjectData): Promise<string> {
    const { objectId } = objectData
    const cachedSource = await this.checkCachedDataObjectSource(objectId)
    if (cachedSource) {
      this.logger.info(`Found active download source for object ${objectId} in cache`, { objectId, cachedSource })
      return cachedSource
    }
    return this.findDataObjectDownloadSource(objectData)
  }

  private async checkCachedDataObjectSource(objectId: string): Promise<string | undefined> {
    const cachedSource = this.stateCache.getCachedDataObjectSource(objectId)
    if (cachedSource) {
      try {
        await this.checkObjectAvailability(objectId, cachedSource)
      } catch (err) {
        this.stateCache.dropCachedDataObjectSource(objectId, cachedSource)
        return undefined
      }
      return cachedSource
    }
  }

  private findDataObjectDownloadSource({ objectId, accessPoints }: DataObjectData): Promise<string> {
    return new Promise((resolve, reject) => {
      const storageEndpoints = this.sortEndpointsByMeanResponseTime(
        accessPoints?.storageNodes.map((n) => n.endpoint) || []
      )

      this.logger.info('Looking for data object source', {
        objectId,
        possibleSources: storageEndpoints.map((e) => ({
          endpoint: e,
          meanResponseTime: this.stateCache.getStorageNodeEndpointMeanResponseTime(e),
        })),
      })
      if (!storageEndpoints.length) {
        return reject(new Error('No storage endpoints available to download the data object from'))
      }

      const availabilityQueue = this.createDataObjectAvailabilityCheckQueue(objectId, storageEndpoints)

      availabilityQueue.on('success', (endpoint) => {
        availabilityQueue.stop()
        this.stateCache.cacheDataObjectSource(objectId, endpoint)
        return resolve(endpoint)
      })

      availabilityQueue.on('end', () => {
        return reject(new Error('Failed to find data object download source'))
      })
    })
  }

  private downloadJob(
    pendingDownload: PendingDownload,
    downloadData: DownloadData,
    onSourceFound: (response: StorageNodeDownloadResponse) => void,
    onError: (error: Error) => void,
    onFinished?: () => void
  ): Promise<void> {
    const {
      objectData: { objectId, accessPoints },
      startAt,
    } = downloadData

    pendingDownload.setStatus({ type: PendingDownloadStatusType.LookingForSource })

    return new Promise<void>((resolve, reject) => {
      // Handlers:
      const fail = (message: string) => {
        this.stateCache.dropPendingDownload(objectId)
        onError(new Error(message))
        reject(new Error(message))
      }

      const sourceFound = (endpoint: string, response: StorageNodeDownloadResponse) => {
        this.logger.info('Download source chosen', { objectId, source: endpoint })
        pendingDownload.setStatus({
          type: PendingDownloadStatusType.Downloading,
          source: endpoint,
          contentType: response.headers['content-type'],
        })
        onSourceFound(response)
      }

      const finish = () => {
        onFinished && onFinished()
        resolve()
      }

      const storageEndpoints = this.sortEndpointsByMeanResponseTime(
        accessPoints?.storageNodes.map((n) => n.endpoint) || []
      )

      this.logger.info('Downloading new data object', {
        objectId,
        possibleSources: storageEndpoints.map((e) => ({
          endpoint: e,
          meanResponseTime: this.stateCache.getStorageNodeEndpointMeanResponseTime(e),
        })),
      })
      if (!storageEndpoints.length) {
        return fail(`No storage endpoints available to download the data object: ${objectId}`)
      }

      const availabilityQueue = this.createDataObjectAvailabilityCheckQueue(objectId, storageEndpoints)
      const objectDownloadQueue = queue({ concurrency: 1, autostart: true })

      availabilityQueue.on('success', (endpoint) => {
        availabilityQueue.stop()
        const job = async () => {
          const api = new StorageNodeApi(endpoint, this.logging, this.config)
          const response = await api.downloadObject(objectId, startAt)
          return [endpoint, response]
        }
        objectDownloadQueue.push(job)
      })

      availabilityQueue.on('end', () => {
        if (!objectDownloadQueue.length) {
          fail(`Failed to download object ${objectId} from any availablable storage provider`)
        }
      })

      objectDownloadQueue.on('error', (err) => {
        this.logger.error('Download attempt from storage node failed after availability was confirmed:', { err })
      })

      objectDownloadQueue.on('end', () => {
        if (availabilityQueue.length) {
          availabilityQueue.start()
        } else {
          fail(`Failed to download object ${objectId} from any availablable storage provider`)
        }
      })

      objectDownloadQueue.on('success', ([endpoint, response]: [string, StorageNodeDownloadResponse]) => {
        availabilityQueue.removeAllListeners().end()
        objectDownloadQueue.removeAllListeners().end()
        response.data.on('close', finish).on('error', finish).on('end', finish)
        sourceFound(endpoint, response)
      })
    })
  }

  public downloadDataObject(downloadData: DownloadData): Promise<StorageNodeDownloadResponse> | null {
    const {
      objectData: { objectId, size },
    } = downloadData
    if (this.stateCache.getPendingDownload(objectId)) {
      // Already downloading
      return null
    }
    const pendingDownload = this.stateCache.addPendingDownload(new PendingDownload(objectId, size))
    return new Promise<StorageNodeDownloadResponse>((resolve, reject) => {
      const onSourceFound = resolve
      const onError = reject
      // Queue the download
      this.downloadQueue.push(() => this.downloadJob(pendingDownload, downloadData, onSourceFound, onError))
    })
  }

  async fetchSupportedDataObjects(): Promise<Map<string, DataObjectData>> {
    const data =
      this.config.buckets === 'all'
        ? await this.queryNodeApi.getDistributionBucketsWithObjectsByWorkerId(this.config.workerId)
        : await this.queryNodeApi.getDistributionBucketsWithObjectsByIds(this.config.buckets.map((id) => id.toString()))
    const objectsData = new Map<string, DataObjectData>()
    data.forEach((bucket) => {
      bucket.bagAssignments.forEach((a) => {
        a.storageBag.objects.forEach((object) => {
          const { ipfsHash, id, size } = object
          objectsData.set(id, { contentHash: ipfsHash, objectId: id, size: parseInt(size) })
        })
      })
    })

    return objectsData
  }

  async checkActiveStorageNodeEndpoints(): Promise<void> {
    try {
      const activeStorageOperators = await this.queryNodeApi.getActiveStorageBucketOperatorsData()
      const endpoints = this.filterStorageNodeEndpoints(
        activeStorageOperators.map(({ id, operatorMetadata }) => ({
          bucketId: id,
          endpoint: operatorMetadata?.nodeEndpoint ? this.getApiEndpoint(operatorMetadata.nodeEndpoint) : '',
        }))
      )
      this.logger.verbose('Checking nearby storage nodes...', { validEndpointsCount: endpoints.length })

      endpoints.forEach(({ endpoint }) =>
        this.testLatencyQueue.push(async () => {
          await this.checkResponseTime(endpoint)
        })
      )
    } catch (err) {
      this.logger.error("Couldn't check active storage node endpooints", { err })
    }
  }

  async checkResponseTime(endpoint: string): Promise<void> {
    const start = Date.now()
    this.logger.debug(`Sending storage node response-time check request to: ${endpoint}`, { endpoint })
    try {
      const api = new StorageNodeApi(endpoint, this.logging, this.config)
      await api.getVersion()
      const responseTime = Date.now() - start
      this.logger.debug(`${endpoint} check request response time: ${responseTime}`, { endpoint, responseTime })
      this.stateCache.setStorageNodeEndpointResponseTime(endpoint, responseTime)
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const parsedErr = parseAxiosError(err)
        this.logger.warn(`${endpoint} check request error: ${parsedErr.message}`, {
          endpoint,
          err: parsedErr,
          '@pauseFor': 900,
        })
      } else {
        const message = err instanceof Error ? err.message : 'Unknown'
        this.logger.error(`${endpoint} check unexpected error: ${message}`, { endpoint, err, '@pauseFor': 900 })
      }
    }
  }
}
