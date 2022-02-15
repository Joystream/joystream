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
import { RuntimeApi } from '../RuntimeApi'
import { Logger } from 'winston'
import { createLogger } from '../logging'
import { AssetsBase } from './AssetsBase'
import { StorageDataObjectFieldsFragment } from './giza-query-node/generated/queries'
import { createType } from '@joystream/types'

export type UploadManagerConfig = {
  uploadSpBucketId: number
  uploadSpEndpoint: string
  dataDir: string
  migrationStatePath: string
}

export type UploadManagerParams = {
  api: RuntimeApi
  config: UploadManagerConfig
}

export type UploadManagerLoadableParams = {
  dataObjectFeePerMB: BN
}

export type AssetsToPrepare = {
  [name: string]: StorageDataObjectFieldsFragment | undefined
}

export type PreparedAsset = {
  params: DataObjectCreationParameters
  index: number
}

export class UploadManager extends AssetsBase {
  private api: RuntimeApi
  protected config: UploadManagerConfig
  public readonly dataObjectFeePerMB: BN
  private queuedUploads: Set<string>
  private isQueueProcessing = false
  private queueFilePath: string
  private logger: Logger

  public get queueSize(): number {
    return this.queuedUploads.size
  }

  public static async create(params: UploadManagerParams): Promise<UploadManager> {
    const { api } = params
    const dataObjectFeePerMB = await api.query.storage.dataObjectPerMegabyteFee()
    return new UploadManager(params, { dataObjectFeePerMB })
  }

  private constructor(params: UploadManagerParams, loadableParams: UploadManagerLoadableParams) {
    super(params)
    const { api, config } = params
    const { dataObjectFeePerMB } = loadableParams
    this.dataObjectFeePerMB = dataObjectFeePerMB
    this.api = api
    this.config = config
    this.queuedUploads = new Set()
    this.logger = createLogger('Assets Manager')
    this.queueFilePath = path.join(this.config.migrationStatePath, `unprocessedUploads_${Date.now()}.json`)
    this.logger.info(`Failed/pending uploads will be saved to ${this.queueFilePath}`)
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
      const msg = await this.reqErrorMessage(e)
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

  private async prepareAsset(
    dataObject: StorageDataObjectFieldsFragment
  ): Promise<DataObjectCreationParameters | undefined> {
    if (this.isAssetMissing(dataObject)) {
      this.logger.warn(`Data object ${dataObject.id} missing in the data directory! Skipping...`)
      return undefined
    }
    return createType<DataObjectCreationParameters, 'DataObjectCreationParameters'>('DataObjectCreationParameters', {
      ipfsContentId: dataObject.ipfsHash,
      size: dataObject.size,
    })
  }

  public async prepareAssets<T extends AssetsToPrepare>(
    assetsToPrepare: T
  ): Promise<{ [K in keyof T]?: PreparedAsset }> {
    const preparedAssets: { [K in keyof T]?: PreparedAsset } = {}
    let assetIndex = 0
    await Promise.all(
      Object.entries(assetsToPrepare).map(async ([assetName, dataObject]) => {
        if (!dataObject) {
          return
        }
        const params = await this.prepareAsset(dataObject)
        if (!params) {
          return
        }
        preparedAssets[assetName as keyof T] = { params, index: assetIndex++ }
      })
    )
    return preparedAssets
  }
}
