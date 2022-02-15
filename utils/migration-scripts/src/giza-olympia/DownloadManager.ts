import { Logger } from 'winston'
import { createLogger } from '../logging'
import { MAX_RESULTS_PER_QUERY, QueryNodeApi } from './giza-query-node/api'
import { createWriteStream, existsSync, renameSync, statSync } from 'fs'
import axios from 'axios'
import {
  StorageDataObjectConnectionFieldsFragment,
  StorageDataObjectFieldsFragment,
} from './giza-query-node/generated/queries'
import urljoin from 'url-join'
import { pipeline, Readable } from 'stream'
import { promisify } from 'util'
import { DistributionBucketOperatorStatus } from './giza-query-node/generated/schema'
import _ from 'lodash'
import { AssetsBase } from './AssetsBase'
import moment from 'moment'

export type DownloadManagerConfig = {
  objectsPerBatch: number
  dataDir: string
}

export type DownloadManagerParams = {
  config: DownloadManagerConfig
  queryNodeApi: QueryNodeApi
}

export class DownloadManager extends AssetsBase {
  name = 'Download Manager'
  protected logger: Logger
  protected config: DownloadManagerConfig
  protected queryNodeApi: QueryNodeApi

  public constructor(params: DownloadManagerParams) {
    super(params)
    this.config = params.config
    this.queryNodeApi = params.queryNodeApi
    this.logger = createLogger(this.name)
  }

  private async fetchAsset(dataObject: StorageDataObjectFieldsFragment, endpoint: string): Promise<void> {
    const assetEndpoint = urljoin(endpoint, `api/v1/assets/${dataObject.id}`)
    const response = await axios.get<Readable>(assetEndpoint, { responseType: 'stream', timeout: 5000 })
    const pipe = promisify(pipeline)
    const destPath = this.tmpAssetPath(dataObject.id)
    const fWriteStream = createWriteStream(destPath)
    await pipe(response.data, fWriteStream)
    const { size } = statSync(destPath)
    if (size !== parseInt(dataObject.size)) {
      throw new Error('Invalid file size')
    }
    renameSync(destPath, this.assetPath(dataObject.id))
  }

  private async fetchAssetWithRetry(
    dataObject: StorageDataObjectFieldsFragment,
    distributors: Map<string, string[]>
  ): Promise<void> {
    const endpoints = distributors.get(dataObject.storageBagId) || []
    let lastError: Error | undefined
    for (const endpoint of endpoints) {
      try {
        this.logger.debug(`Trying to fetch data object ${dataObject.id} from ${endpoint}...`)
        await this.fetchAsset(dataObject, endpoint)
        return
      } catch (e) {
        this.logger.debug(`Fetching ${dataObject.id} from ${endpoint} failed: ${(e as Error).message}`)
        lastError = e as Error
        continue
      }
    }
    this.logger.error(
      `Could not fetch data object ${dataObject.id} from any distributor. Last error: ${
        lastError && (await this.reqErrorMessage(lastError))
      }`
    )
  }

  private async getDistributors(dataObjects: StorageDataObjectFieldsFragment[]): Promise<Map<string, string[]>> {
    this.logger.info(`Fetching the distributors for ${dataObjects.length} data objects...`)
    const bagIds = _.uniq(dataObjects.map((o) => o.storageBagId))
    const buckets = await this.queryNodeApi.getDistributorsByBagIds(bagIds)
    this.logger.info(`Fetched the data of ${buckets.length} unique distribution buckets`)

    const endpointsByBagId = new Map<string, string[]>()
    for (const bucket of buckets) {
      for (const operator of bucket.operators) {
        if (operator.status === DistributionBucketOperatorStatus.Active && operator.metadata?.nodeEndpoint) {
          for (const bag of bucket.bags) {
            const currEndpoints = endpointsByBagId.get(bag.id) || []
            endpointsByBagId.set(bag.id, [...currEndpoints, operator.metadata.nodeEndpoint])
          }
        }
      }
    }

    return endpointsByBagId
  }

  protected async fetchIfMissing(
    dataObject: StorageDataObjectFieldsFragment,
    knownDistributors: Map<string, string[]>
  ): Promise<boolean> {
    const missing = this.isAssetMissing(dataObject)
    if (missing) {
      this.logger.debug(`Object ${dataObject.id} missing, fetching...`)
      await this.fetchAssetWithRetry(dataObject, knownDistributors)
      return true
    }

    this.logger.debug(`Object ${dataObject.id} already exists, skipping...`)
    return false
  }

  public async fetchAllDataObjects(updatedAfter?: Date, continously = false, idleTimeSec?: number): Promise<void> {
    do {
      let currentPage: StorageDataObjectConnectionFieldsFragment | undefined
      let lastObjectUpdatedAt: Date | undefined
      this.logger.info(
        `Fetching all data objects${updatedAfter ? ` updated after ${updatedAfter.toISOString()}` : ''}...`
      )
      do {
        this.logger.info(`Fetching a page of up to ${MAX_RESULTS_PER_QUERY} data objects from the query node...`)
        currentPage = await this.queryNodeApi.getStorageDataObjectsPage(
          updatedAfter,
          MAX_RESULTS_PER_QUERY,
          currentPage?.pageInfo.endCursor || undefined
        )
        const objects = currentPage.edges.map((e) => e.node)
        const maxUpdatedAt = _.maxBy(objects, (o) => moment(o.updatedAt).unix())?.updatedAt
        lastObjectUpdatedAt = maxUpdatedAt ? new Date(maxUpdatedAt) : undefined
        this.logger.info(`Fetched ${objects.length} data object rows`)
        if (objects.length) {
          const distributors = await this.getDistributors(objects)
          while (objects.length) {
            const batch = objects.splice(0, this.config.objectsPerBatch)
            this.logger.info(`Processing a batch of ${batch.length} data objects...`)
            const results = await Promise.all(batch.map((o) => this.fetchIfMissing(o, distributors)))
            const downloadedObjectsLength = results.reduce((a, b) => a + (b ? 1 : 0), 0)
            this.logger.info(`Downloaded ${downloadedObjectsLength} new data objects...`)
          }
        }
      } while (currentPage.pageInfo.hasNextPage)
      if (continously && idleTimeSec) {
        this.logger.info(`Waiting ${idleTimeSec} seconds...`)
        await new Promise((resolve) => setTimeout(resolve, 1000 * idleTimeSec))
      }
      updatedAfter = updatedAfter || lastObjectUpdatedAt
      // eslint-disable-next-line no-unmodified-loop-condition
    } while (continously)
  }
}
