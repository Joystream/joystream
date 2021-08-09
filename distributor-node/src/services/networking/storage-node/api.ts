import { Configuration } from './generated'
import { PublicApi } from './generated/api'
import axios, { AxiosRequestConfig } from 'axios'
import { LoggingService } from '../../logging'
import { Logger } from 'winston'
import { StorageNodeDownloadResponse } from '../../../types'

const AXIOS_TIMEOUT = 10000

export class StorageNodeApi {
  private logger: Logger
  private publicApi: PublicApi
  private endpoint: string

  public constructor(endpoint: string, logging: LoggingService) {
    const axiosConfig: AxiosRequestConfig = {
      timeout: AXIOS_TIMEOUT,
    }
    const config = new Configuration({
      basePath: endpoint,
      baseOptions: axiosConfig,
    })
    this.publicApi = new PublicApi(config)
    this.endpoint = new URL(endpoint).toString()
    this.logger = logging.createLogger('StorageNodeApi', { endpoint })
  }

  public async isObjectAvailable(contentHash: string): Promise<boolean> {
    const options: AxiosRequestConfig = {
      headers: {
        Range: 'bytes=0-0',
      },
    }
    this.logger.info('Checking object availibility', { contentHash })
    try {
      await this.publicApi.publicApiFiles(contentHash, options)
      this.logger.info('Data object available', { contentHash })
      return true
    } catch (err) {
      if (axios.isAxiosError(err)) {
        this.logger.info('Data object not available', { err })
        return false
      }
      this.logger.error('Unexpected error while requesting data object', { err })
      throw err
    }
  }

  public async downloadObject(contentHash: string, startAt?: number): Promise<StorageNodeDownloadResponse> {
    this.logger.info('Sending download request', { contentHash, startAt })
    const options: AxiosRequestConfig = {
      responseType: 'stream',
    }
    if (startAt) {
      options.headers.Range = `bytes=${startAt}-`
    }
    return this.publicApi.publicApiFiles(contentHash, options)
  }
}
