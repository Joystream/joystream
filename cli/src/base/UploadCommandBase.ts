import ContentDirectoryCommandBase from './ContentDirectoryCommandBase'
import { VideoFFProbeMetadata, VideoFileMetadata, AssetType, InputAsset, InputAssetDetails } from '../Types'
import { ContentId, ContentParameters } from '@joystream/types/storage'
import { MultiBar, Options, SingleBar } from 'cli-progress'
import { Assets } from '../json-schemas/typings/Assets.schema'
import ExitCodes from '../ExitCodes'
import ipfsHash from 'ipfs-only-hash'
import fs from 'fs'
import _ from 'lodash'
import axios, { AxiosRequestConfig } from 'axios'
import ffprobeInstaller from '@ffprobe-installer/ffprobe'
import ffmpeg from 'fluent-ffmpeg'
import path from 'path'
import chalk from 'chalk'
import mimeTypes from 'mime-types'

ffmpeg.setFfprobePath(ffprobeInstaller.path)

/**
 * Abstract base class for commands that require uploading functionality
 */
export default abstract class UploadCommandBase extends ContentDirectoryCommandBase {
  private fileSizeCache: Map<string, number> = new Map<string, number>()
  private progressBarOptions: Options = {
    format: `{barTitle} | {bar} | {value}/{total} KB processed`,
  }

  getFileSize(path: string): number {
    const cachedSize = this.fileSizeCache.get(path)
    return cachedSize !== undefined ? cachedSize : fs.statSync(path).size
  }

  normalizeEndpoint(endpoint: string) {
    return endpoint.endsWith('/') ? endpoint : endpoint + '/'
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
      const message = e.message || e
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

  async calculateFileIpfsHash(filePath: string): Promise<string> {
    const { fileStream } = this.createReadStreamWithProgressBar(filePath, 'Calculating file hash')
    const hash: string = await ipfsHash.of(fileStream)

    return hash
  }

  validateFile(filePath: string): void {
    // Basic file validation
    if (!fs.existsSync(filePath)) {
      this.error(`${filePath} - file does not exist under provided path!`, { exit: ExitCodes.FileNotFound })
    }
  }

  assetUrl(endpointRoot: string, contentId: ContentId): string {
    // This will also make sure the resulting url is a valid url
    return new URL(`asset/v0/${contentId.encode()}`, this.normalizeEndpoint(endpointRoot)).toString()
  }

  async getRandomProviderEndpoint(): Promise<string | null> {
    const endpoints = _.shuffle(await this.getApi().allStorageProviderEndpoints())
    for (const endpoint of endpoints) {
      try {
        const url = new URL('swagger.json', this.normalizeEndpoint(endpoint)).toString()
        await axios.head(url)
        return endpoint
      } catch (e) {
        continue
      }
    }

    return null
  }

  async generateContentParameters(filePath: string, type: AssetType): Promise<ContentParameters> {
    return this.createType('ContentParameters', {
      content_id: ContentId.generate(this.getTypesRegistry()),
      type_id: type,
      size: this.getFileSize(filePath),
      ipfs_content_id: await this.calculateFileIpfsHash(filePath),
    })
  }

  async prepareInputAssets(paths: string[], basePath?: string): Promise<InputAssetDetails[]> {
    // Resolve assets
    if (basePath) {
      paths = paths.map((p) => basePath && path.resolve(path.dirname(basePath), p))
    }
    // Validate assets
    paths.forEach((p) => this.validateFile(p))

    // Return data
    return await Promise.all(
      paths.map(async (path) => {
        const parameters = await this.generateContentParameters(path, AssetType.AnyAsset)
        return {
          path,
          contentId: parameters.content_id,
          parameters,
        }
      })
    )
  }

  async uploadAsset(contentId: ContentId, filePath: string, endpoint?: string, multiBar?: MultiBar): Promise<void> {
    const providerEndpoint = endpoint || (await this.getRandomProviderEndpoint())
    if (!providerEndpoint) {
      this.error('No active provider found!', { exit: ExitCodes.ActionCurrentlyUnavailable })
    }
    const uploadUrl = this.assetUrl(providerEndpoint, contentId)
    const fileSize = this.getFileSize(filePath)
    const { fileStream, progressBar } = this.createReadStreamWithProgressBar(
      filePath,
      `Uploading ${contentId.encode()}`,
      multiBar
    )
    fileStream.on('end', () => {
      // Temporarly disable because with Promise.all it breaks the UI
      // cli.action.start('Waiting for the file to be processed...')
    })

    try {
      const config: AxiosRequestConfig = {
        headers: {
          'Content-Type': '', // https://github.com/Joystream/storage-node-joystream/issues/16
          'Content-Length': fileSize.toString(),
        },
      }
      await axios.put(uploadUrl, fileStream, config)
    } catch (e) {
      progressBar.stop()
      const msg = (e.response && e.response.data && e.response.data.message) || e.message || e
      this.error(`Unexpected error when trying to upload a file: ${msg}`, {
        exit: ExitCodes.ExternalInfrastructureError,
      })
    }
  }

  async uploadAssets(
    assets: InputAsset[],
    inputFilePath: string,
    outputFilePostfix = '__rejectedContent'
  ): Promise<void> {
    const endpoint = await this.getRandomProviderEndpoint()
    if (!endpoint) {
      this.warn('No storage provider is currently available!')
      this.handleRejectedUploads(
        assets,
        assets.map(() => false),
        inputFilePath,
        outputFilePostfix
      )
      this.exit(ExitCodes.ActionCurrentlyUnavailable)
    }
    const multiBar = new MultiBar(this.progressBarOptions)
    // Workaround replacement for Promise.allSettled (which is only available in ES2020)
    const results = await Promise.all(
      assets.map(async (a) => {
        try {
          await this.uploadAsset(a.contentId, a.path, endpoint, multiBar)
          return true
        } catch (e) {
          return false
        }
      })
    )
    this.handleRejectedUploads(assets, results, inputFilePath, outputFilePostfix)
    multiBar.stop()
  }

  private handleRejectedUploads(
    assets: InputAsset[],
    results: boolean[],
    inputFilePath: string,
    outputFilePostfix: string
  ): void {
    // Try to save rejected contentIds and paths for reupload purposes
    const rejectedAssetsOutput: Assets = []
    results.forEach(
      (r, i) =>
        r === false && rejectedAssetsOutput.push({ contentId: assets[i].contentId.encode(), path: assets[i].path })
    )
    if (rejectedAssetsOutput.length) {
      this.warn(
        `Some assets were not uploaded succesfully. Try reuploading them with ${chalk.white('content:reuploadAssets')}!`
      )
      console.log(rejectedAssetsOutput)
      const outputPath = inputFilePath.replace('.json', `${outputFilePostfix}.json`)
      try {
        fs.writeFileSync(outputPath, JSON.stringify(rejectedAssetsOutput, null, 4))
        this.log(`Rejected content ids succesfully saved to: ${chalk.white(outputPath)}!`)
      } catch (e) {
        console.error(e)
        this.warn(
          `Could not write rejected content output to ${outputPath}. Try copying the output above and creating the file manually!`
        )
      }
    }
  }
}
