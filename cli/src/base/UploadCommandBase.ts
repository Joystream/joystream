import ContentDirectoryCommandBase from './ContentDirectoryCommandBase'
import {
  AssetToUpload,
  ResolvedAsset,
  StorageNodeInfo,
  TokenRequest,
  TokenRequestData,
  VideoFFProbeMetadata,
  VideoFileMetadata,
} from '../Types'
import { MultiBar, Options, SingleBar } from 'cli-progress'
import ExitCodes from '../ExitCodes'
import fs from 'fs'
import _ from 'lodash'
import axios from 'axios'
import ffprobeInstaller from '@ffprobe-installer/ffprobe'
import ffmpeg from 'fluent-ffmpeg'
import path from 'path'
import mimeTypes from 'mime-types'
import { Assets } from '../schemas/typings/Assets.schema'
import chalk from 'chalk'
import { DataObjectCreationParameters } from '@joystream/types/storage'
import { createHash } from 'blake3'
import * as multihash from 'multihashes'
import { u8aToHex, formatBalance } from '@polkadot/util'
import { KeyringPair } from '@polkadot/keyring/types'
import FormData from 'form-data'
import BN from 'bn.js'
import { createTypeFromConstructor } from '@joystream/types'
import { NewAssets } from '@joystream/types/content'

ffmpeg.setFfprobePath(ffprobeInstaller.path)

/**
 * Abstract base class for commands that require uploading functionality
 */
export default abstract class UploadCommandBase extends ContentDirectoryCommandBase {
  private fileSizeCache: Map<string, number> = new Map<string, number>()
  private maxFileSize: undefined | BN = undefined
  private progressBarOptions: Options = {
    format: `{barTitle} | {bar} | {value}/{total} KB processed`,
  }

  protected requiresQueryNode = true

  getFileSize(path: string): number {
    const cachedSize = this.fileSizeCache.get(path)
    return cachedSize !== undefined ? cachedSize : fs.statSync(path).size
  }

  createReadStreamWithProgressBar(
    filePath: string,
    barTitle: string,
    multiBar?: MultiBar
  ): {
    fileStream: fs.ReadStream
    progressBar: SingleBar
  } {
    // Progress CLI UX:
    // https://github.com/oclif/cli-ux#cliprogress
    // https://www.npmjs.com/package/cli-progress
    const fileSize = this.getFileSize(filePath)
    let processedKB = 0
    const fileSizeKB = Math.ceil(fileSize / 1024)
    const progress = multiBar
      ? multiBar.create(fileSizeKB, processedKB, { barTitle })
      : new SingleBar(this.progressBarOptions)

    progress.start(fileSizeKB, processedKB, { barTitle })
    return {
      fileStream: fs
        .createReadStream(filePath)
        .pause() // Explicitly pause to prevent switching to flowing mode (https://nodejs.org/api/stream.html#stream_event_data)
        .on('error', () => {
          progress.stop()
          this.error(`Error while trying to read data from: ${filePath}!`, {
            exit: ExitCodes.FsOperationFailed,
          })
        })
        .on('data', (data) => {
          processedKB += data.length / 1024
          progress.update(processedKB)
        })
        .on('end', () => {
          progress.update(fileSizeKB)
          progress.stop()
        }),
      progressBar: progress,
    }
  }

  async getVideoFFProbeMetadata(filePath: string): Promise<VideoFFProbeMetadata> {
    return new Promise<VideoFFProbeMetadata>((resolve, reject) => {
      ffmpeg.ffprobe(filePath, (err, data) => {
        if (err) {
          reject(err)
          return
        }
        const videoStream = data.streams.find((s) => s.codec_type === 'video')
        if (videoStream) {
          resolve({
            width: videoStream.width,
            height: videoStream.height,
            codecName: videoStream.codec_name,
            codecFullName: videoStream.codec_long_name,
            duration: videoStream.duration !== undefined ? Math.ceil(Number(videoStream.duration)) || 0 : undefined,
          })
        } else {
          reject(new Error('No video stream found in file'))
        }
      })
    })
  }

  async getVideoFileMetadata(filePath: string): Promise<VideoFileMetadata> {
    let ffProbeMetadata: VideoFFProbeMetadata = {}
    try {
      ffProbeMetadata = await this.getVideoFFProbeMetadata(filePath)
    } catch (e) {
      const message = e instanceof Error ? e.message : e
      this.warn(`Failed to get video metadata via ffprobe (${message})`)
    }

    const size = this.getFileSize(filePath)
    const container = path.extname(filePath).slice(1)
    const mimeType = mimeTypes.lookup(container) || `unknown`
    return {
      size,
      container,
      mimeType,
      ...ffProbeMetadata,
    }
  }

  async calculateFileHash(filePath: string): Promise<string> {
    const { fileStream } = this.createReadStreamWithProgressBar(filePath, 'Calculating file hash')
    let blake3Hash: Uint8Array
    return new Promise<string>((resolve, reject) => {
      fileStream
        .pipe(createHash())
        .on('data', (data) => (blake3Hash = data))
        .on('end', () => resolve(multihash.toB58String(multihash.encode(blake3Hash, 'blake3'))))
        .on('error', (err) => reject(err))
    })
  }

  async validateFile(filePath: string): Promise<void> {
    // Basic file validation
    if (!fs.existsSync(filePath)) {
      this.error(`${filePath} - file does not exist under provided path!`, { exit: ExitCodes.FileNotFound })
    }
    if (!this.maxFileSize) {
      this.maxFileSize = await this.getOriginalApi().consts.storage.maxDataObjectSize
    }
    if (this.maxFileSize.ltn(this.getFileSize(filePath))) {
      this.error(`${filePath} - file is too big. Max file size is ${this.maxFileSize.toString()} bytes`)
    }
  }

  async getRandomActiveStorageNodeInfo(bagId: string, retryTime = 6, retryCount = 5): Promise<StorageNodeInfo | null> {
    for (let i = 0; i <= retryCount; ++i) {
      const nodesInfo = _.shuffle(await this.getApi().storageNodesInfoByBagId(bagId))
      for (const info of nodesInfo) {
        try {
          // TODO: Use a status endpoint once available?
          await axios.get(info.apiEndpoint, {
            validateStatus: (s) => s === 404, // we expect 404 on root endpoint
            headers: {
              connection: 'close',
            },
          })
          return info
        } catch (err) {
          continue
        }
      }
      if (i !== retryCount) {
        this.log(`No storage provider can serve the request yet, retrying in ${retryTime}s (${i + 1}/${retryCount})...`)
        await new Promise((resolve) => setTimeout(resolve, retryTime * 1000))
      }
    }

    return null
  }

  async generateDataObjectParameters(filePath: string): Promise<DataObjectCreationParameters> {
    return createTypeFromConstructor(DataObjectCreationParameters, {
      size: this.getFileSize(filePath),
      ipfsContentId: await this.calculateFileHash(filePath),
    })
  }

  async resolveAndValidateAssets(paths: string[], basePath: string): Promise<ResolvedAsset[]> {
    // Resolve assets
    if (basePath) {
      paths = paths.map((p) => basePath && path.resolve(path.dirname(basePath), p))
    }
    // Validate assets
    await Promise.all(paths.map((p) => this.validateFile(p)))

    // Return data
    return await Promise.all(
      paths.map(async (path) => {
        const parameters = await this.generateDataObjectParameters(path)
        return {
          path,
          parameters,
        }
      })
    )
  }

  async getStorageNodeUploadToken(
    storageNodeInfo: StorageNodeInfo,
    account: KeyringPair,
    memberId: number,
    objectId: BN,
    bagId: string
  ): Promise<string> {
    const data: TokenRequestData = {
      storageBucketId: storageNodeInfo.bucketId,
      accountId: account.address,
      bagId,
      memberId,
      dataObjectId: objectId.toNumber(),
    }
    const message = JSON.stringify(data)
    const signature = u8aToHex(account.sign(message))
    const postData: TokenRequest = { data, signature }
    const {
      data: { token },
    } = await axios.post(`${storageNodeInfo.apiEndpoint}authToken`, postData)
    if (!token) {
      this.error('Recieved empty token from the storage node!', { exit: ExitCodes.StorageNodeError })
    }

    return token
  }

  async uploadAsset(
    account: KeyringPair,
    memberId: number,
    objectId: BN,
    bagId: string,
    filePath: string,
    storageNode?: StorageNodeInfo,
    multiBar?: MultiBar
  ): Promise<void> {
    const storageNodeInfo = storageNode || (await this.getRandomActiveStorageNodeInfo(bagId))
    if (!storageNodeInfo) {
      this.error('No active storage node found!', { exit: ExitCodes.ActionCurrentlyUnavailable })
    }
    this.log(`Chosen storage node endpoint: ${storageNodeInfo.apiEndpoint}`)
    const token = await this.getStorageNodeUploadToken(storageNodeInfo, account, memberId, objectId, bagId)
    const { fileStream, progressBar } = this.createReadStreamWithProgressBar(
      filePath,
      `Uploading ${filePath}`,
      multiBar
    )
    fileStream.on('end', () => {
      // Temporarly disable because with Promise.all it breaks the UI
      // cli.action.start('Waiting for the file to be processed...')
    })
    const formData = new FormData()
    formData.append('dataObjectId', objectId.toString())
    formData.append('storageBucketId', storageNodeInfo.bucketId)
    formData.append('bagId', bagId)
    formData.append('file', fileStream, {
      filename: path.basename(filePath),
      filepath: filePath,
      knownLength: this.getFileSize(filePath),
    })
    this.log(`Uploading object ${objectId.toString()} (${filePath})`)
    try {
      await axios.post(`${storageNodeInfo.apiEndpoint}files`, formData, {
        headers: {
          'x-api-key': token,
          'content-type': 'multipart/form-data',
          ...formData.getHeaders(),
        },
      })
    } catch (e) {
      progressBar.stop()
      if (axios.isAxiosError(e)) {
        const msg = e.response && e.response.data ? JSON.stringify(e.response.data) : e.message
        this.error(`Unexpected error when trying to upload a file: ${msg}`, {
          exit: ExitCodes.StorageNodeError,
        })
      } else {
        throw e
      }
    }
  }

  async uploadAssets(
    account: KeyringPair,
    memberId: number,
    bagId: string,
    assets: AssetToUpload[],
    inputFilePath: string,
    outputFilePostfix = '__rejectedContent'
  ): Promise<void> {
    const storageNodeInfo = await this.getRandomActiveStorageNodeInfo(bagId)
    if (!storageNodeInfo) {
      this.warn('No storage provider is currently available!')
      this.handleRejectedUploads(
        bagId,
        assets,
        assets.map(() => false),
        inputFilePath,
        outputFilePostfix
      )
      this.exit(ExitCodes.ActionCurrentlyUnavailable)
    }
    const multiBar = new MultiBar(this.progressBarOptions)
    const errors: [string, string][] = []
    // Workaround replacement for Promise.allSettled (which is only available in ES2020)
    const results = await Promise.all(
      assets.map(async (a) => {
        try {
          await this.uploadAsset(account, memberId, a.dataObjectId, bagId, a.path, storageNodeInfo, multiBar)
          return true
        } catch (e) {
          errors.push([a.dataObjectId.toString(), e instanceof Error ? e.message : 'Unknown error'])
          return false
        }
      })
    )
    errors.forEach(([objectId, message]) => this.warn(`Upload of object ${objectId} failed: ${message}`))
    this.handleRejectedUploads(bagId, assets, results, inputFilePath, outputFilePostfix)
    multiBar.stop()
  }

  public assetsIndexes(originalPaths: (string | undefined)[], filteredPaths: string[]): (number | undefined)[] {
    let lastIndex = -1
    return originalPaths.map((path) => (filteredPaths.includes(path as string) ? ++lastIndex : undefined))
  }

  async prepareAssetsForExtrinsic(resolvedAssets: ResolvedAsset[]): Promise<NewAssets | undefined> {
    const feePerMB = await this.getOriginalApi().query.storage.dataObjectPerMegabyteFee()
    if (resolvedAssets.length) {
      const totalBytes = resolvedAssets
        .reduce((a, b) => {
          return a.add(b.parameters.getField('size'))
        }, new BN(0))
        .toNumber()
      const totalFee = feePerMB.muln(Math.ceil(totalBytes / 1024 / 1024))
      await this.requireConfirmation(
        `Total fee of ${chalk.cyan(formatBalance(totalFee))} ` +
          `will have to be paid in order to store the provided assets. Are you sure you want to continue?`
      )
      return createTypeFromConstructor(NewAssets, {
        Upload: {
          expected_data_size_fee: feePerMB,
          object_creation_list: resolvedAssets.map((a) => a.parameters),
        },
      })
    }

    return undefined
  }

  private handleRejectedUploads(
    bagId: string,
    assets: AssetToUpload[],
    results: boolean[],
    inputFilePath: string,
    outputFilePostfix: string
  ): void {
    // Try to save rejected contentIds and paths for reupload purposes
    const rejectedAssetsOutput: Assets = { bagId, assets: [] }
    results.forEach(
      (r, i) =>
        r === false &&
        rejectedAssetsOutput.assets.push({ objectId: assets[i].dataObjectId.toString(), path: assets[i].path })
    )
    if (rejectedAssetsOutput.assets.length) {
      this.warn(
        `Some assets were not uploaded successfully. Try reuploading them with ${chalk.magentaBright(
          'content:reuploadAssets'
        )}!`
      )
      console.log(rejectedAssetsOutput)
      const outputPath = inputFilePath.replace('.json', `${outputFilePostfix}.json`)
      try {
        fs.writeFileSync(outputPath, JSON.stringify(rejectedAssetsOutput, null, 4))
        this.log(`Rejected content ids successfully saved to: ${chalk.magentaBright(outputPath)}!`)
      } catch (e) {
        console.error(e)
        this.warn(
          `Could not write rejected content output to ${outputPath}. Try copying the output above and creating the file manually!`
        )
      }
    }
  }
}
