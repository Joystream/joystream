import { promises as fsp } from 'fs'
import { Task } from '../processing/workingProcess'
import _ from 'lodash'
import path from 'path'
import logger from '../../services/logger'
import { blake2AsHex } from '@polkadot/util-crypto'
import { IConnectionHandler } from '../s3/IConnectionHandler'
import { ArchivesTrackingService } from './tracking'
import { StorageClass } from '@aws-sdk/client-s3'
import { CompressionService } from './compression'
import { StatsCollectingService } from './stats'

/**
 * Compresses provided files into an archive and removes them.
 */
export class CompressFilesTask implements Task {
  private dataObjectPaths: string[]
  private archiveFileName: string
  private tmpArchiveFilePath: string
  private archiveFilePath: string
  private ext: string

  constructor(
    private uploadsDirectory: string,
    private dataObjectIds: string[],
    private compressionService: CompressionService,
    private statsCollectingService: StatsCollectingService
  ) {
    this.archiveFileName = blake2AsHex(_.sortBy(this.dataObjectIds, (id) => parseInt(id)).join(',')).substring(2)
    this.ext = this.compressionService.getExt()
    this.tmpArchiveFilePath = path.join(this.uploadsDirectory, `${this.archiveFileName}.tmp.${this.ext}`)
    this.archiveFilePath = path.join(this.uploadsDirectory, `${this.archiveFileName}.${this.ext}`)
    this.dataObjectPaths = dataObjectIds.map((id) => path.join(uploadsDirectory, id))
  }

  public description(): string {
    return `Compressing data objects: (${this.dataObjectIds.join(', ')})...`
  }

  public getArchiveFilePath(): string {
    return this.archiveFilePath
  }

  private async getPreCompressionSize(): Promise<number> {
    const stats = await Promise.all(this.dataObjectPaths.map((p) => fsp.stat(p)))
    return stats.reduce((a, b) => a + b.size, 0)
  }

  private async getPostCompressionSize(): Promise<number> {
    const { size } = await fsp.stat(this.archiveFilePath)
    return size
  }

  private async logCompressionStats(startTime: bigint): Promise<void> {
    try {
      const preCompressionSize = await this.getPreCompressionSize()
      const postCompressionSize = await this.getPostCompressionSize()
      this.statsCollectingService.addCompressionJobStats({
        size: preCompressionSize,
        sizeAfter: postCompressionSize,
        start: startTime,
        end: process.hrtime.bigint(),
      })
    } catch (e) {
      logger.error(`Failed to get compression stats for archive ${this.archiveFilePath}: ${e.toString()}`)
    }
  }

  private async verifyAndMoveArchive(): Promise<void> {
    try {
      await fsp.access(this.tmpArchiveFilePath, fsp.constants.W_OK | fsp.constants.R_OK)
    } catch (e) {
      throw new Error(`${this.tmpArchiveFilePath} access error: ${e.toString()}`)
    }

    const packedObjects = await this.compressionService.listFiles(this.tmpArchiveFilePath)
    if (_.difference(this.dataObjectIds, packedObjects).length) {
      throw new Error(`${this.tmpArchiveFilePath} is missing some files`)
    }

    try {
      await fsp.rename(this.tmpArchiveFilePath, this.archiveFilePath)
    } catch (e) {
      throw new Error(`Cannot rename ${this.tmpArchiveFilePath} to ${this.archiveFilePath}: ${e.toString()}`)
    }
  }

  private async clenaup(): Promise<void> {
    // Remove packed objects from uploadsDir
    try {
      await Promise.all(this.dataObjectPaths.map((p) => fsp.rm(p)))
    } catch (e) {
      logger.error(`Couldn't fully cleanup files after compression: ${e.toString()}`)
    }
  }

  public async execute(): Promise<void> {
    try {
      const startTime = process.hrtime.bigint()
      await this.compressionService.compressFiles(this.dataObjectPaths, this.tmpArchiveFilePath)
      await this.verifyAndMoveArchive()
      await this.logCompressionStats(startTime)
      await this.clenaup()
    } catch (e) {
      throw new Error(`Compression task failed: ${e.toString()}`)
    }
  }
}

/**
 * Uploads a specified file to S3.
 */
export class UploadArchiveFileTask implements Task {
  // eslint-disable-next-line no-useless-constructor
  constructor(
    private archiveFilePath: string,
    private objectKey: string,
    private uploadsDirectory: string,
    private archivesTrackingService: ArchivesTrackingService,
    private connectionHandler: IConnectionHandler<StorageClass>,
    private compressionService: CompressionService,
    private statsCollectingService: StatsCollectingService,
    private dataObjectIds?: string[]
  ) {}

  public description(): string {
    return `Uploading ${this.archiveFilePath} to S3 (key: ${this.objectKey})...`
  }

  private async getPackedFiles(): Promise<string[]> {
    const packedFiles = await this.compressionService.listFiles(this.archiveFilePath)
    return packedFiles
  }

  private async cleanup(dataObjectIds: string[]): Promise<void> {
    const paths = [this.archiveFilePath, ...dataObjectIds.map((id) => path.join(this.uploadsDirectory, id))]
    try {
      await Promise.all(paths.map((p) => fsp.rm(p, { force: true })))
    } catch (e) {
      logger.error(`Upload task cleanup failed: ${e.toString()}`)
    }
  }

  private async logUploadStats(startTime: bigint): Promise<void> {
    try {
      const { size } = await fsp.stat(this.archiveFilePath)
      this.statsCollectingService.addUploadJobStats({
        size,
        start: startTime,
        end: process.hrtime.bigint(),
      })
    } catch (e) {
      logger.error(`Failed to get compression stats for archive ${this.archiveFilePath}: ${e.toString()}`)
    }
  }

  public async execute(): Promise<void> {
    const dataObjectIds = this.dataObjectIds || (await this.getPackedFiles())
    try {
      const startTime = process.hrtime.bigint()
      await this.connectionHandler.uploadFileToRemoteBucket(this.objectKey, this.archiveFilePath)
      await this.archivesTrackingService.track({ name: this.objectKey, dataObjectIds: dataObjectIds })
      await this.logUploadStats(startTime)
      await this.cleanup(dataObjectIds)
      logger.info(`${this.archiveFilePath} successfully uploaded to S3!`)
    } catch (e) {
      logger.error(`Upload job failed for ${this.archiveFilePath}: ${e.toString()}`)
    }
  }
}

/**
 * Compresses data objects into an archive and uploads them to S3.
 */
export class CompressAndUploadTask implements Task {
  private archiveFilePath: string
  private archiveFileName: string
  private compressTask: CompressFilesTask
  private uploadTask: UploadArchiveFileTask

  constructor(
    private uploadsDirectory: string,
    private dataObjectIds: string[],
    private archivesTrackingService: ArchivesTrackingService,
    private connectionHandler: IConnectionHandler<StorageClass>,
    private compressionService: CompressionService,
    private statsCollectingService: StatsCollectingService
  ) {
    this.compressTask = new CompressFilesTask(
      this.uploadsDirectory,
      this.dataObjectIds,
      this.compressionService,
      this.statsCollectingService
    )
    this.archiveFilePath = this.compressTask.getArchiveFilePath()
    this.archiveFileName = path.basename(this.archiveFilePath)
    this.uploadTask = new UploadArchiveFileTask(
      this.archiveFilePath,
      this.archiveFileName,
      this.uploadsDirectory,
      this.archivesTrackingService,
      this.connectionHandler,
      this.compressionService,
      this.statsCollectingService,
      this.dataObjectIds
    )
  }

  public description(): string {
    return `Compressing data objects and uploading them to S3...`
  }

  public async execute(): Promise<void> {
    logger.debug(this.compressTask.description())
    await this.compressTask.execute()
    logger.debug(this.uploadTask.description())
    await this.uploadTask.execute()
  }
}
