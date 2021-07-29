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
} from '../../types'
import queue from 'queue'
import _ from 'lodash'

// TODO: Adjust limits and intervals
const MAX_CONCURRENT_RESPONSE_TIME_CHECKS = 10
const MAX_CONCURRENT_DOWNLOADS = 10
const MAX_CONCURRENT_AVAILABILITY_CHECKS_PER_DOWNLOAD = 10 // 10 pending download * 10 availibility checks per download = 100 concurrent requests

const STORAGE_NODE_ENDPOINTS_CHECK_INTERVAL_MS = 60000
const STORAGE_NODE_ENDPOINT_CHECK_TIMEOUT = 5000

export class NetworkingService {
  private config: ReadonlyConfig
  private queryNodeApi: QueryNodeApi
  // private runtimeApi: RuntimeApi
  private logging: LoggingService
  private stateCache: StateCacheService
  private logger: Logger

  private storageNodeEndpointsCheckInterval: NodeJS.Timeout
  private testLatencyQueue = queue({ concurrency: MAX_CONCURRENT_RESPONSE_TIME_CHECKS, autostart: true })

  constructor(config: ReadonlyConfig, stateCache: StateCacheService, logging: LoggingService) {
    this.config = config
    this.logging = logging
    this.stateCache = stateCache
    this.logger = logging.createLogger('NetworkingManager')
    this.queryNodeApi = new QueryNodeApi(config.endpoints.queryNode)
    // this.runtimeApi = new RuntimeApi(config.endpoints.substrateNode)
    this.checkActiveStorageNodeEndpoints()
    this.storageNodeEndpointsCheckInterval = setInterval(
      this.checkActiveStorageNodeEndpoints.bind(this),
      STORAGE_NODE_ENDPOINTS_CHECK_INTERVAL_MS
    )
  }

  public clearIntervals(): void {
    clearInterval(this.storageNodeEndpointsCheckInterval)
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
        this.logger.warn('Invalid storage endpoint detected!', {
          bucketId: b.bucketId,
          endpoint: b.endpoint,
          err,
        })
        return false
      }
    })
  }

  private prepareStorageNodeEndpoints(details: DataObjectDetailsFragment) {
    const endpointsData = details.storageBag.storedBy
      .filter(
        (b) => b.operatorStatus.__typename === 'StorageBucketOperatorStatusActive' && b.operatorMetadata?.nodeEndpoint
      )
      .map((b) => ({
        bucketId: b.id,
        endpoint: b.operatorMetadata!.nodeEndpoint!,
      }))

    return this.filterStorageNodeEndpoints(endpointsData)
  }

  private parseDataObjectAccessPoints(details: DataObjectDetailsFragment): DataObjectAccessPoints {
    return {
      storageNodes: this.prepareStorageNodeEndpoints(details),
    }
  }

  public async dataObjectInfo(objectId: string): Promise<DataObjectInfo> {
    const details = await this.queryNodeApi.getDataObjectDetails(objectId)
    if (details) {
      this.stateCache.setObjectContentHash(objectId, details.ipfsHash)
    }
    return {
      exists: !!details,
      isSupported: this.config.buckets.some((bucketId) =>
        details?.storageBag.distributedBy.map((b) => b.id).includes(bucketId.toString())
      ),
      data: details
        ? {
            objectId,
            accessPoints: this.parseDataObjectAccessPoints(details),
            contentHash: details.ipfsHash,
            size: parseInt(details.size),
          }
        : undefined,
    }
  }

  private sortEndpointsByMeanResponseTime(endpoints: string[]) {
    return endpoints.sort((a, b) => {
      const dataA = this.stateCache.getStorageNodeEndpointData(a)
      const dataB = this.stateCache.getStorageNodeEndpointData(b)
      return (
        _.mean(dataA?.responseTimes || [STORAGE_NODE_ENDPOINT_CHECK_TIMEOUT]) -
        _.mean(dataB?.responseTimes || [STORAGE_NODE_ENDPOINT_CHECK_TIMEOUT])
      )
    })
  }

  public downloadDataObject(objectData: DataObjectData): Promise<StorageNodeDownloadResponse> | null {
    const { contentHash, accessPoints, size } = objectData

    if (this.stateCache.getPendingDownload(contentHash)) {
      // Already downloading
      return null
    }

    const downloadPromise = new Promise<StorageNodeDownloadResponse>((resolve, reject) => {
      const storageEndpoints = this.sortEndpointsByMeanResponseTime(
        accessPoints?.storageNodes.map((n) => n.endpoint) || []
      )

      this.logger.info('Downloading new data object', { contentHash, storageEndpoints })
      if (!storageEndpoints.length) {
        reject(new Error('No storage endpoints available to download the data object from'))
        return
      }

      const availabilityQueue = queue({ concurrency: MAX_CONCURRENT_AVAILABILITY_CHECKS_PER_DOWNLOAD, autostart: true })
      const downloadQueue = queue({ concurrency: 1, autostart: true })

      storageEndpoints.forEach(async (endpoint) => {
        availabilityQueue.push(async () => {
          const api = new StorageNodeApi(endpoint, this.logging)
          const available = await api.isObjectAvailable(contentHash)
          if (!available) {
            throw new Error('Not avilable')
          }
          return endpoint
        })
      })

      availabilityQueue.on('success', (endpoint) => {
        availabilityQueue.stop()
        const job = () => {
          const api = new StorageNodeApi(endpoint, this.logging)
          return api.downloadObject(contentHash)
        }
        downloadQueue.push(job)
      })

      availabilityQueue.on('error', () => {
        /*
        Do nothing.
        The handler is needed to avoid unhandled promise rejection
        */
      })

      downloadQueue.on('error', (err) => {
        this.logger.error('Download attempt from storage node failed after availability was confirmed:', { err })
      })

      downloadQueue.on('end', () => {
        if (availabilityQueue.length) {
          availabilityQueue.start()
        } else {
          reject(new Error('Failed to download the object from any availablable storage provider'))
        }
      })

      availabilityQueue.on('end', () => {
        if (!downloadQueue.length) {
          reject(new Error('Failed to download the object from any availablable storage provider'))
        }
      })

      downloadQueue.on('success', (response: StorageNodeDownloadResponse) => {
        availabilityQueue.removeAllListeners().end()
        downloadQueue.removeAllListeners().end()
        resolve(response)
      })
    })

    this.stateCache.newPendingDownload(contentHash, size, downloadPromise)

    return downloadPromise
  }

  async fetchSupportedDataObjects(): Promise<DataObjectData[]> {
    const data = await this.queryNodeApi.getDistributionBucketsWithObjects(
      this.config.buckets.map((id) => id.toString())
    )
    const objectsData: DataObjectData[] = []
    data.forEach((bucket) => {
      bucket.distributedBags.forEach((bag) => {
        bag.objects.forEach((object) => {
          const { ipfsHash, id, size } = object
          objectsData.push({ contentHash: ipfsHash, objectId: id, size })
        })
      })
    })

    return objectsData
  }

  async checkActiveStorageNodeEndpoints(): Promise<void> {
    const activeStorageOperators = await this.queryNodeApi.getActiveStorageBucketOperatorsData()
    const endpoints = this.filterStorageNodeEndpoints(
      activeStorageOperators.map(({ id, operatorMetadata }) => ({
        bucketId: id,
        endpoint: operatorMetadata!.nodeEndpoint!,
      }))
    )
    this.logger.verbose('Checking nearby storage nodes...', { validEndpointsCount: endpoints.length })

    endpoints.forEach(({ endpoint }) => this.testLatencyQueue.push(() => this.checkResponseTime(endpoint)))
  }

  async checkResponseTime(endpoint: string): Promise<void> {
    const start = Date.now()
    this.logger.debug(`Sending storage node response-time check request to: ${endpoint}`, { endpoint })
    try {
      // TODO: Use a status endpoint once available?
      await axios.get(endpoint, { timeout: STORAGE_NODE_ENDPOINT_CHECK_TIMEOUT })
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 404) {
        // This is the expected outcome currently
        const responseTime = Date.now() - start
        this.logger.debug(`${endpoint} check request response time: ${responseTime}`, { endpoint, responseTime })
        this.stateCache.setStorageNodeEndpointResponseTime(endpoint, responseTime)
      } else {
        this.logger.warn('Storage node giving unexpected reponse on root endpoint!', { err })
      }
    }
  }
}
