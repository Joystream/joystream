import { ReadonlyConfig } from '../../types/config'
import { QueryNodeApi } from './query-node/api'
import { Logger } from 'winston'
import { LoggingService } from '../logging'
import { DataObjectAccessPoints, DataObjectData, DataObjectInfo } from '../../types/dataObject'
import { StorageNodeApi } from './storage-node/api'
import { StateCacheService } from '../cache/StateCacheService'
import { DataObjectDetailsFragment } from './query-node/generated/queries'
import { AxiosResponse } from 'axios'

export class NetworkingService {
  private config: ReadonlyConfig
  private queryNodeApi: QueryNodeApi
  // private runtimeApi: RuntimeApi
  private logging: LoggingService
  private stateCache: StateCacheService
  private logger: Logger

  constructor(config: ReadonlyConfig, stateCache: StateCacheService, logging: LoggingService) {
    this.config = config
    this.logging = logging
    this.stateCache = stateCache
    this.logger = logging.createLogger('NetworkingManager')
    this.queryNodeApi = new QueryNodeApi(config.endpoints.queryNode)
    // this.runtimeApi = new RuntimeApi(config.endpoints.substrateNode)
  }

  private validateNodeEndpoint(endpoint: string): void {
    const endpointUrl = new URL(endpoint)
    if (endpointUrl.protocol !== 'http:' && endpointUrl.protocol !== 'https:') {
      throw new Error(`Invalid endpoint protocol: ${endpointUrl.protocol}`)
    }
  }

  private prepareStorageNodeEndpoints(details: DataObjectDetailsFragment) {
    return details.storageBag.storedBy
      .filter((b) => b.operatorStatus.__typename === 'StorageBucketOperatorStatusActive')
      .map((b) => ({
        bucketId: b.id,
        endpoint: Buffer.from(b.operatorMetadata.replace('0x', ''), 'hex').toString(),
      }))
      .filter((b) => {
        try {
          this.validateNodeEndpoint(b.endpoint)
          return true
        } catch (e) {
          this.logger.warn('Invalid storage endpoint detected', {
            bucketId: b.bucketId,
            endpoint: b.endpoint,
            error: e.toString(),
          })
          return false
        }
      })
  }

  private parseDataObjectAccessPoints(details: DataObjectDetailsFragment): DataObjectAccessPoints {
    return {
      storageNodes: this.prepareStorageNodeEndpoints(details),
      // TODO:
      distributorNodes: [],
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

  public downloadDataObject(objectData: DataObjectData): Promise<AxiosResponse<NodeJS.ReadableStream>> | null {
    const { contentHash, accessPoints, size } = objectData

    if (this.stateCache.getPendingDownload(contentHash)) {
      return null
    }

    const pendingDownload = this.stateCache.newPendingDownload(contentHash, size)

    return new Promise<AxiosResponse<NodeJS.ReadableStream>>((resolve, reject) => {
      const storageEndpoints = accessPoints?.storageNodes.map((n) => n.endpoint)

      this.logger.info('Downloading new data object', { contentHash, storageEndpoints })
      if (!storageEndpoints || !storageEndpoints.length) {
        return reject(new Error('No storage endpoints available to download the data object from'))
      }
      const availabilityPromises = storageEndpoints.map(async (endpoint) => {
        const api = new StorageNodeApi(endpoint, this.logging)
        const available = await api.isObjectAvailable(contentHash)
        if (!available) {
          throw new Error('Not avilable')
        }
        return endpoint
      })

      pendingDownload.pendingAvailabilityEndpointsCount = availabilityPromises.length
      availabilityPromises.forEach((availableNodePromise) =>
        availableNodePromise
          .then(async (endpoint) => {
            pendingDownload.availableEndpoints.push(endpoint)
            if (!pendingDownload.isAttemptPending) {
              this.attemptDataObjectDownload(contentHash)
                .then(resolve)
                .catch(() => {
                  if (!pendingDownload.pendingAvailabilityEndpointsCount && !pendingDownload.isAttemptPending) {
                    return reject(new Error('Cannot download data object from any node'))
                  }
                })
            }
          })
          .finally(() => --pendingDownload.pendingAvailabilityEndpointsCount)
      )
    })
  }

  private async attemptDataObjectDownload(contentHash: string): Promise<AxiosResponse<NodeJS.ReadableStream>> {
    const pendingDownload = this.stateCache.getPendingDownload(contentHash)
    if (!pendingDownload) {
      throw new Error('Attempting data object download with missing pending download data')
    }
    if (pendingDownload.isAttemptPending) {
      throw new Error('Attempting data object download during an already pending attempt')
    }
    const endpoint = pendingDownload.availableEndpoints.shift()
    if (!endpoint) {
      throw new Error('Attempting data object download without any available endpoint')
    }
    pendingDownload.isAttemptPending = true
    this.logger.info('Requesting data object from storage node', { contentHash, endpoint })
    const api = new StorageNodeApi(endpoint, this.logging)
    try {
      const response = await api.downloadObject(contentHash)
      ++pendingDownload.downloadAttempts
      pendingDownload.isAttemptPending = false
      // TODO: Validate reponse? (ie. object size etc.)
      return response
    } catch (e) {
      ++pendingDownload.downloadAttempts
      pendingDownload.isAttemptPending = false
      if (pendingDownload.availableEndpoints.length) {
        return this.attemptDataObjectDownload(contentHash)
      } else {
        throw e
      }
    }
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
}
