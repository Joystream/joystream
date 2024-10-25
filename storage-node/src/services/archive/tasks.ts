import { promises as fsp } from 'fs'
import { Task } from '../processing/workingProcess'
import _ from 'lodash'
import path from 'path'
import logger from '../../services/logger'
import { blake2AsHex } from '@polkadot/util-crypto'
import { IConnectionHandler } from '../s3/IConnectionHandler'
import { SevenZipService } from './SevenZipService'
import { ArchivesTrackingService } from './tracking'

/**
 * Compresses provided files into a 7zip archive and removes them.
 */
export class CompressFilesTask implements Task {
  private dataObjectPaths: string[]
  private archiveFileName: string
  private tmpArchiveFilePath: string
  private archiveFilePath: string
  private _7z: SevenZipService

  constructor(private uploadsDirectory: string, private dataObjectIds: string[]) {
    this.archiveFileName = blake2AsHex(_.sortBy(this.dataObjectIds, (id) => parseInt(id)).join(',')).substring(2)
    this.tmpArchiveFilePath = path.join(this.uploadsDirectory, `${this.archiveFileName}.tmp.7z`)
    this.archiveFilePath = path.join(this.uploadsDirectory, `${this.archiveFileName}.7z`)
    this.dataObjectPaths = dataObjectIds.map((id) => path.join(uploadsDirectory, id))
    this._7z = new SevenZipService()
  }

  public description(): string {
    return `Compressing data objects: (${this.dataObjectIds.join(', ')})...`
  }

  public getArchiveFilePath(): string {
    return this.archiveFilePath
  }

  private async verifyAndMoveArchive(): Promise<void> {
    try {
      await fsp.access(this.tmpArchiveFilePath, fsp.constants.W_OK | fsp.constants.R_OK)
    } catch (e) {
      throw new Error(`7z archive access error: ${e.toString()}`)
    }

    const packedObjects = await this._7z.listFiles(this.tmpArchiveFilePath)
    if (_.difference(this.dataObjectIds, packedObjects).length) {
      throw new Error(`7z archive is missing some files`)
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
    return new Promise((resolve, reject) => {
      this._7z.spawnCompressionProcess(this.tmpArchiveFilePath, this.dataObjectPaths, (exitCode) => {
        if (exitCode === 0) {
          this.verifyAndMoveArchive()
            .then(() => this.clenaup())
            .then(() => resolve())
            .catch((e) => reject(Error(`Compression task failed: ${e.toString()}`)))
        } else {
          reject(Error(`Compression task failed: 7z process failed with exit code: ${exitCode || 'null'}`))
        }
      })
    })
  }
}

/**
 * Uploads a specified file to S3.
 */
export class UploadArchiveFileTask implements Task {
  private _7z: SevenZipService

  constructor(
    private archiveFilePath: string,
    private objectKey: string,
    private uploadsDirectory: string,
    private archivesTrackingService: ArchivesTrackingService,
    private connectionHandler: IConnectionHandler
  ) {
    this._7z = new SevenZipService()
  }

  public description(): string {
    return `Uploading ${this.archiveFilePath} to S3 (key: ${this.objectKey})...`
  }

  public async getPackedFiles(): Promise<string[]> {
    const packedFiles = await this._7z.listFiles(this.archiveFilePath)
    return packedFiles
  }

  public async cleanup(dataObjectIds: string[]): Promise<void> {
    const paths = [this.archiveFilePath, ...dataObjectIds.map((id) => path.join(this.uploadsDirectory, id))]
    try {
      await Promise.all(paths.map((p) => fsp.rm(p, { force: true })))
    } catch (e) {
      logger.error(`Upload task cleanup failed: ${e.toString()}`)
    }
  }

  public async execute(): Promise<void> {
    const dataObjectIds = await this.getPackedFiles()
    try {
      await this.connectionHandler.uploadFileToRemoteBucket(this.objectKey, this.archiveFilePath)
      await this.archivesTrackingService.track({ name: this.objectKey, dataObjectIds: dataObjectIds })
      logger.info(`${this.archiveFilePath} successfully uploaded to S3!`)
    } catch (e) {
      logger.error(`Upload job failed for ${this.archiveFilePath}: ${e.toString()}`)
    }
    await this.cleanup(dataObjectIds)
  }
}
