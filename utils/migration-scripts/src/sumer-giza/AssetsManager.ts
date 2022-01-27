import { DataObjectFieldsFragment } from './sumer-query-node/generated/queries'
import BN from 'bn.js'
import urljoin from 'url-join'
import axios from 'axios'
import fs from 'fs'
import path from 'path'
import { BagId, DataObjectCreationParameters, DataObjectId, UploadParameters } from '@joystream/types/storage'
import { IEvent } from '@polkadot/types/types'
import { Vec } from '@polkadot/types'
import { Balance } from '@polkadot/types/interfaces'
import FormData from 'form-data'
import { ImageResizer } from './ImageResizer'
import { QueryNodeApi } from './sumer-query-node/api'
import { RuntimeApi } from '../RuntimeApi'
import { ContentHash } from './ContentHash'
import { promisify } from 'util'
import { createType } from '@joystream/types'
import { Readable, pipeline } from 'stream'
import { Logger } from 'winston'
import _ from 'lodash'
import { createLogger } from '../logging'

export type AssetsManagerConfig = {
  preferredDownloadSpEndpoints?: string[]
  uploadSpBucketId: number
  uploadSpEndpoint: string
  dataDir: string
  migrationStatePath: string
}

export type AssetsManagerParams = {
  api: RuntimeApi
  queryNodeApi?: QueryNodeApi
  config: AssetsManagerConfig
}

export type AssetsManagerLoadableParams = {
  dataObjectFeePerMB: BN
  sumerStorageProviderEndpoints: string[]
}

export type AssetsToPrepare = {
  [name: string]: {
    data?: DataObjectFieldsFragment
    targetSize?: [number, number]
  }
}

export type PreparedAsset = {
  params: DataObjectCreationParameters
  index: number
}

export class AssetsManager {
  private api: RuntimeApi
  private config: AssetsManagerConfig
  public readonly dataObjectFeePerMB: BN
  private sumerStorageProviderEndpoints: string[]
  private resizer: ImageResizer
  private queuedUploads: Set<string>
  private isQueueProcessing = false
  private queueFilePath: string
  private logger: Logger

  public get queueSize(): number {
    return this.queuedUploads.size
  }

  public static async create(params: AssetsManagerParams): Promise<AssetsManager> {
    const { api } = params
    const dataObjectFeePerMB = await api.query.storage.dataObjectPerMegabyteFee()
    const sumerStorageProviderEndpoints = params.queryNodeApi
      ? await AssetsManager.getSumerStorageProviderEndpoints(params.queryNodeApi)
      : []
    return new AssetsManager(params, { dataObjectFeePerMB, sumerStorageProviderEndpoints })
  }

  private constructor(params: AssetsManagerParams, loadableParams: AssetsManagerLoadableParams) {
    const { api, config } = params
    const { dataObjectFeePerMB, sumerStorageProviderEndpoints } = loadableParams
    this.dataObjectFeePerMB = dataObjectFeePerMB
    this.sumerStorageProviderEndpoints = sumerStorageProviderEndpoints
    this.api = api
    this.config = config
    this.resizer = new ImageResizer()
    this.queuedUploads = new Set()
    this.logger = createLogger('Assets Manager')
    fs.mkdirSync(this.tmpAssetPath(''), { recursive: true })
    fs.mkdirSync(this.assetPath(''), { recursive: true })
    this.queueFilePath = path.join(this.config.migrationStatePath, `unprocessedUploads_${Date.now()}.json`)
    this.logger.info(`Failed/pending uploads will be saved to ${this.queueFilePath}`)
  }

  private static async getSumerStorageProviderEndpoints(queryNodeApi: QueryNodeApi): Promise<string[]> {
    const endpoints: string[] = []
    const workers = await queryNodeApi.getStorageWorkers()
    workers.forEach((w) => w.metadata && endpoints.push(w.metadata))
    return endpoints
  }

  private tmpAssetPath(contentId: string): string {
    return path.join(this.config.dataDir, 'tmp', contentId)
  }

  private assetPath(contentHash: string): string {
    return path.join(this.config.dataDir, contentHash)
  }

  public calcDataObjectsFee(params: DataObjectCreationParameters[]): BN {
    const { dataObjectFeePerMB, api } = this
    const deletionPrize = api.consts.storage.dataObjectDeletionPrize
    const totalSize = params
      .reduce((a, b) => {
        return a.add(b.getField('size'))
      }, new BN(0))
      .toNumber()
    const totalStorageFee = dataObjectFeePerMB.muln(Math.ceil(totalSize / 1024 / 1024))
    const totalDeletionPrize = deletionPrize.muln(params.length)
    return totalStorageFee.add(totalDeletionPrize)
  }

  private async prepareAsset(
    data: DataObjectFieldsFragment,
    targetSize?: [number, number]
  ): Promise<DataObjectCreationParameters | undefined> {
    if (data.liaisonJudgement !== 'ACCEPTED') {
      this.logger.warn(
        `Data object ${data.joystreamContentId} has invalid liason judgement: ${data.liaisonJudgement}. Skipping...`
      )
      return
    }
    let objectSize = new BN(data.size).toNumber()
    const path = await this.fetchAssetWithRetry(data.joystreamContentId, objectSize)
    if (targetSize) {
      try {
        await this.resizer.resize(path, targetSize)
        // Re-estabilish object size
        objectSize = fs.statSync(path).size
      } catch (e) {
        this.logger.error(
          `Could not resize image ${path} to target size ${targetSize[0]}/${targetSize[1]}: ${(e as Error).message}`
        )
      }
    }
    const hash = await this.calcContentHash(path)
    // Move asset to final path
    fs.renameSync(path, this.assetPath(hash))
    return createType<DataObjectCreationParameters, 'DataObjectCreationParameters'>('DataObjectCreationParameters', {
      ipfsContentId: hash,
      size: objectSize,
    })
  }

  public async prepareAssets<T extends AssetsToPrepare>(
    assetsToPrepare: T
  ): Promise<{ [K in keyof T]?: PreparedAsset }> {
    const preparedAssets: { [K in keyof T]?: PreparedAsset } = {}
    let assetIndex = 0
    await Promise.all(
      Object.entries(assetsToPrepare).map(async ([assetName, { data, targetSize }]) => {
        if (!data) {
          return
        }
        const params = await this.prepareAsset(data, targetSize)
        if (!params) {
          return
        }
        preparedAssets[assetName as keyof T] = { params, index: assetIndex++ }
      })
    )
    return preparedAssets
  }

  private calcContentHash(assetPath: string): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      const fReadStream = fs.createReadStream(assetPath)
      const hash = new ContentHash()
      fReadStream.on('data', (chunk) => hash.update(chunk))
      fReadStream.on('end', () => resolve(hash.digest()))
      fReadStream.on('error', (err) => reject(err))
    })
  }

  private async fetchAsset(endpoint: string, contentId: string, expectedSize: number): Promise<string> {
    const assetEndpoint = urljoin(endpoint, `asset/v0/${contentId}`)
    const response = await axios.get<Readable>(assetEndpoint, { responseType: 'stream', timeout: 5000 })
    const pipe = promisify(pipeline)
    const destPath = this.tmpAssetPath(contentId)
    const fWriteStream = fs.createWriteStream(destPath)
    await pipe(response.data, fWriteStream)
    const { size } = fs.statSync(destPath)
    if (size !== expectedSize) {
      throw new Error('Invalid file size')
    }
    return destPath
  }

  private async fetchAssetWithRetry(contentId: string, expectedSize: number): Promise<string> {
    const preferredDownloadSpEndpoints = this.config.preferredDownloadSpEndpoints || []
    const alternativeEndpoints = _.difference(this.sumerStorageProviderEndpoints, preferredDownloadSpEndpoints)
    const endpoints = _.shuffle(preferredDownloadSpEndpoints).concat(_.shuffle(alternativeEndpoints))
    let lastError: Error | undefined
    for (const endpoint of endpoints) {
      try {
        this.logger.debug(`Trying to fetch asset ${contentId} from ${endpoint}...`)
        const tmpAssetPath = await this.fetchAsset(endpoint, contentId, expectedSize)
        return tmpAssetPath
      } catch (e) {
        this.logger.debug(`Fetching ${contentId} from ${endpoint} failed: ${(e as Error).message}`)
        lastError = e as Error
        continue
      }
    }
    throw new Error(
      `Could not fetch asset ${contentId} from any provider. Last error: ${
        lastError && this.reqErrorMessage(lastError)
      }`
    )
  }

  private reqErrorMessage(e: unknown): string {
    if (axios.isAxiosError(e)) {
      return e.response ? JSON.stringify(e.response.data) : e.message
    }
    return e instanceof Error ? e.message : JSON.stringify(e)
  }

  private async uploadDataObject(bagId: string, dataObjectId: number): Promise<void> {
    const {
      config: { uploadSpBucketId, uploadSpEndpoint },
    } = this
    const dataObject = await this.api.query.storage.dataObjectsById(
      { Dynamic: { Channel: bagId.split(':')[2] } },
      dataObjectId
    )
    const dataPath = this.assetPath(Buffer.from(dataObject.ipfsContentId.toHex().replace('0x', ''), 'hex').toString())
    if (!fs.existsSync(dataPath)) {
      throw new Error(`Cannot upload object: ${dataObjectId}: ${dataPath} not found`)
    }

    const fileStream = fs.createReadStream(dataPath)
    const formData = new FormData()
    formData.append('dataObjectId', dataObjectId)
    formData.append('storageBucketId', uploadSpBucketId)
    formData.append('bagId', bagId)
    formData.append('file', fileStream, { filename: path.basename(dataPath) })
    let uploadSuccesful: boolean
    try {
      await axios({
        method: 'POST',
        url: urljoin(uploadSpEndpoint, 'api/v1/files'),
        data: formData,
        maxBodyLength: Infinity,
        headers: {
          'content-type': 'multipart/form-data',
          ...formData.getHeaders(),
        },
      })
      uploadSuccesful = true
    } catch (e) {
      uploadSuccesful = false
      const msg = this.reqErrorMessage(e)
      this.logger.error(`Upload of object ${dataObjectId} to ${uploadSpEndpoint} failed: ${msg}`)
    }

    if (uploadSuccesful) {
      this.finalizeUpload(bagId, dataObjectId, dataPath)
    }
  }

  public async processQueuedUploads(): Promise<void> {
    if (this.isQueueProcessing) {
      throw new Error('Uploads queue is already beeing processed!')
    }
    this.isQueueProcessing = true
    this.logger.info(`Uploading ${this.queueSize} data objects...`)
    await Promise.all(
      Array.from(this.queuedUploads).map((queuedUpload) => {
        const [bagId, objectId] = queuedUpload.split('|')
        return this.uploadDataObject(bagId, parseInt(objectId))
      })
    )
    this.isQueueProcessing = false
  }

  public loadQueue(queueFilePath: string): void {
    const queue: string[] = JSON.parse(fs.readFileSync(queueFilePath).toString())
    this.queuedUploads = new Set(queue)
  }

  public saveQueue(): void {
    fs.writeFileSync(this.queueFilePath, JSON.stringify(Array.from(this.queuedUploads)))
    this.logger.debug(`${this.queueFilePath} updated`, { queueSize: this.queuedUploads.size })
  }

  private queueUpload(bagId: BagId, objectId: DataObjectId): void {
    const bagIdStr = `dynamic:channel:${bagId.asType('Dynamic').asType('Channel').toString()}`
    this.queuedUploads.add(`${bagIdStr}|${objectId.toString()}`)
    this.saveQueue()
  }

  private finalizeUpload(bagId: string, dataObjectId: number, dataPath: string) {
    this.queuedUploads.delete(`${bagId}|${dataObjectId}`)
    this.saveQueue()
    try {
      fs.rmSync(dataPath)
    } catch (e) {
      this.logger.error(`Could not remove file "${dataPath}" after succesful upload...`)
    }
  }

  public queueUploadsFromEvents(events: IEvent<[Vec<DataObjectId>, UploadParameters, Balance]>[]): void {
    let queuedUploads = 0
    events.map(({ data: [objectIds, uploadParams] }) => {
      objectIds.forEach((objectId) => {
        this.queueUpload(uploadParams.bagId, objectId)
        ++queuedUploads
      })
    })
    this.logger.info(`Added ${queuedUploads} new data object uploads to the upload queue`)
  }
}
