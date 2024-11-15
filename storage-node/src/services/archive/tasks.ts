import { promises as fsp } from 'fs'
import { Task } from '../processing/workingProcess'
import _ from 'lodash'
import path from 'path'
import logger from '../../services/logger'
import { blake2AsHex } from '@polkadot/util-crypto'
import { IConnectionHandler } from '../s3/IConnectionHandler'
import { ArchivesTrackingService, ObjectTrackingService } from './tracking'
import { StorageClass } from '@aws-sdk/client-s3'
import { CompressionService } from './compression'
import { StatsCollectingService } from './stats'
import { Logger } from 'winston'

/**
 * Compresses provided files into an archive and removes them.
 */
export class CompressFilesTask implements Task {
  private dataObjectPaths: string[]
  private archiveFileName: string
  private tmpArchiveFilePath: string
  private archiveFilePath: string
  private ext: string
  private logger: Logger

  constructor(
    private uploadsDirectory: string,
    private dataObjectIds: string[],
    private compressionService: CompressionService,
    private statsCollectingService: StatsCollectingService,
    private objectTrackingService: ObjectTrackingService
  ) {
    this.archiveFileName = blake2AsHex(_.sortBy(this.dataObjectIds, (id) => parseInt(id)).join(',')).substring(2)
    this.ext = this.compressionService.getExt()
    this.tmpArchiveFilePath = path.join(this.uploadsDirectory, `${this.archiveFileName}.tmp.${this.ext}`)
    this.archiveFilePath = path.join(this.uploadsDirectory, `${this.archiveFileName}.${this.ext}`)
    this.dataObjectPaths = dataObjectIds.map((id) => path.join(uploadsDirectory, id))
    this.logger = logger.child({
      label: `CompressFilesTask (${this.archiveFileName})`,
    })
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
      this.logger.error(`Failed to get compression stats: ${e.toString()}`)
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

  private async handleFailure(error: Error): Promise<void> {
    const pathsToClean = [this.tmpArchiveFilePath, this.archiveFilePath, ...this.dataObjectPaths]
    // Untrack data objects so that they can be re-downloaded
    // and remove data objects and any archives that were created from uploadsDir
    try {
      for (const id of this.dataObjectIds) {
        await this.objectTrackingService.untrack(id)
      }
      await Promise.all(pathsToClean.map((p) => fsp.rm(p, { force: true })))
    } catch (e) {
      this.logger.error(`Compression failed: ${e.toString()}`)
      this.logger.error(`Failed to clean up local data: ${e.toString()}`)
      this.logger.error(`Exiting due to cirtical error...`)
      process.exit(1)
    }
    throw new Error(`Compression task failed: ${error.toString()}`)
  }

  private async clenaup(): Promise<void> {
    // Remove packed objects from uploadsDir
    try {
      await Promise.all(this.dataObjectPaths.map((p) => fsp.rm(p)))
    } catch (e) {
      this.logger.error(`Cleanup failed: ${e.toString()}`)
      this.logger.error(`Exiting due to cirtical error...`)
      process.exit(1)
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
      await this.handleFailure(e)
    }
  }
}

/**
 * Uploads a specified file to S3.
 */
export class UploadArchiveFileTask implements Task {
  private logger: Logger

  constructor(
    private archiveFilePath: string,
    private objectKey: string,
    private uploadsDirectory: string,
    private archivesTrackingService: ArchivesTrackingService,
    private objectTrackingService: ObjectTrackingService,
    private connectionHandler: IConnectionHandler<StorageClass>,
    private compressionService: CompressionService,
    private statsCollectingService: StatsCollectingService,
    private dataObjectIds?: string[]
  ) {
    this.logger = logger.child({
      label: `UploadArchiveFileTask (${this.objectKey})`,
    })
  }

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
      this.logger.error(`Cleanup failed: ${e.toString()}`)
      this.logger.error(`Exiting due to cirtical error...`)
      process.exit(1)
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
      this.logger.error(`Failed to get upload stats: ${e.toString()}`)
    }
  }

  private async handleFailure(error: Error, dataObjectIds: string[]): Promise<void> {
    // Untrack the data objects so that they can be re-downloaded and remove the archive file
    try {
      for (const id of dataObjectIds) {
        await this.objectTrackingService.untrack(id)
      }
      await fsp.rm(this.archiveFilePath, { force: true })
    } catch (e) {
      this.logger.error(`Upload failed: ${e.toString()}`)
      this.logger.error(`Failed to clean up local data: ${e.toString()}`)
      this.logger.error(`Exiting due to cirtical error...`)
      process.exit(1)
    }
    throw new Error(`Upload failed: ${error.toString()}`)
  }

  public async execute(): Promise<void> {
    const dataObjectIds = this.dataObjectIds || (await this.getPackedFiles())
    try {
      const startTime = process.hrtime.bigint()
      await this.connectionHandler.uploadFileToRemoteBucket(this.objectKey, this.archiveFilePath)
      await this.archivesTrackingService.track({ name: this.objectKey, dataObjectIds: dataObjectIds })
      await this.logUploadStats(startTime)
      await this.cleanup(dataObjectIds)
      this.logger.info(`Successfully uploaded to S3!`)
    } catch (e) {
      await this.handleFailure(e, dataObjectIds)
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
    private objectTrackingService: ObjectTrackingService,
    private connectionHandler: IConnectionHandler<StorageClass>,
    private compressionService: CompressionService,
    private statsCollectingService: StatsCollectingService
  ) {
    this.compressTask = new CompressFilesTask(
      this.uploadsDirectory,
      this.dataObjectIds,
      this.compressionService,
      this.statsCollectingService,
      this.objectTrackingService
    )
    this.archiveFilePath = this.compressTask.getArchiveFilePath()
    this.archiveFileName = path.basename(this.archiveFilePath)
    this.uploadTask = new UploadArchiveFileTask(
      this.archiveFilePath,
      this.archiveFileName,
      this.uploadsDirectory,
      this.archivesTrackingService,
      this.objectTrackingService,
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
