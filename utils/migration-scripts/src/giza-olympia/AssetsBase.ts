import axios from 'axios'
import stringify from 'fast-safe-stringify'
import { createReadStream, existsSync, statSync, mkdirSync } from 'fs'
import path from 'path'
import { Readable } from 'stream'
import { ContentHash } from './ContentHash'
import { StorageDataObjectFieldsFragment } from './giza-query-node/generated/queries'

export type AssetsBaseConfig = {
  dataDir: string
}

export type AssetsBaseParams = {
  config: AssetsBaseConfig
}

export abstract class AssetsBase {
  protected config: AssetsBaseConfig

  protected constructor(params: AssetsBaseParams) {
    const { config } = params
    this.config = config
    mkdirSync(this.tmpAssetPath(''), { recursive: true })
    mkdirSync(this.assetPath(''), { recursive: true })
  }

  protected tmpAssetPath(dataObjectId: string): string {
    return path.join(this.config.dataDir, 'tmp', dataObjectId)
  }

  protected assetPath(dataObjectId: string): string {
    return path.join(this.config.dataDir, 'objects', dataObjectId)
  }

  protected calcContentHash(assetPath: string): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      const fReadStream = createReadStream(assetPath)
      const hash = new ContentHash()
      fReadStream.on('data', (chunk) => hash.update(chunk))
      fReadStream.on('end', () => resolve(hash.digest()))
      fReadStream.on('error', (err) => reject(err))
    })
  }

  protected async isAssetMissing(dataObject: StorageDataObjectFieldsFragment): Promise<boolean> {
    const assetPath = this.assetPath(dataObject.id)
    if (!existsSync(assetPath)) {
      return true
    }
    const { size } = statSync(assetPath)
    const hash = await this.calcContentHash(assetPath)
    return size.toString() !== dataObject.size || hash !== dataObject.ipfsHash
  }

  private streamToString(stream: Readable) {
    const chunks: Uint8Array[] = []
    return new Promise((resolve, reject) => {
      stream.on('data', (chunk) => chunks.push(Buffer.from(chunk)))
      stream.on('error', (err) => reject(err))
      stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
    })
  }

  protected async reqErrorMessage(e: unknown): Promise<string> {
    if (axios.isAxiosError(e)) {
      let msg = e.message
      if (e.response && typeof e.response.data === 'string') {
        msg += `: ${e.response.data}`
      }
      if (e.response && e.response.data && e.response.data.message) {
        msg += `: ${e.response.data.message}`
      }
      if (e.response && e.response.data && e.response.data instanceof Readable) {
        msg += `: ${await this.streamToString(e.response.data)}`
      }

      return msg
    }
    return e instanceof Error ? e.message : stringify(e)
  }
}
