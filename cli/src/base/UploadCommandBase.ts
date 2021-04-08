import ContentDirectoryCommandBase from './ContentDirectoryCommandBase'
import { VideoFFProbeMetadata, VideoFileMetadata, AssetType, InputAssetDetails } from '../Types'
import { ContentId, ContentParameters } from '@joystream/types/storage'
import { MultiBar, Options, SingleBar } from 'cli-progress'
import ExitCodes from '../ExitCodes'
import ipfsHash from 'ipfs-only-hash'
import fs from 'fs'
import _ from 'lodash'
import axios, { AxiosRequestConfig } from 'axios'
import ffprobeInstaller from '@ffprobe-installer/ffprobe'
import ffmpeg from 'fluent-ffmpeg'
import path from 'path'

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
    const mimeType = `video/${container}` // TODO: Is this enough?
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
    return new URL(`asset/v0/${contentId.encode()}`, endpointRoot).toString()
  }

  async getRandomProviderEndpoint(): Promise<string> {
    const endpoints = _.shuffle(await this.getApi().allStorageProviderEndpoints())
    for (const endpoint of endpoints) {
      try {
        const url = new URL(endpoint).toString()
        // TODO: Some better way to test if provider is online?
        await axios.get(url, { validateStatus: (s) => s === 404 /* 404 is expected */ })
        return endpoint
      } catch (e) {
        continue
      }
    }

    this.error('No active storage provider found', { exit: ExitCodes.ActionCurrentlyUnavailable })
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
      paths.map(async (path) => ({
        path,
        parameters: await this.generateContentParameters(path, AssetType.AnyAsset),
      }))
    )
  }

  async uploadAsset(contentId: ContentId, filePath: string, endpoint?: string, multiBar?: MultiBar): Promise<void> {
    const providerEndpoint = endpoint || (await this.getRandomProviderEndpoint())
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
      multiBar ? multiBar.stop() : progressBar.stop()
      const msg = (e.response && e.response.data && e.response.data.message) || e.message || e
      this.error(`Unexpected error when trying to upload a file: ${msg}`, {
        exit: ExitCodes.ExternalInfrastructureError,
      })
    }
  }

  async uploadAssets(assets: InputAssetDetails[]): Promise<void> {
    const endpoint = await this.getRandomProviderEndpoint()
    const multiBar = new MultiBar(this.progressBarOptions)
    await Promise.all(assets.map((a) => this.uploadAsset(a.parameters.content_id, a.path, endpoint, multiBar)))
    multiBar.stop()
  }
}
