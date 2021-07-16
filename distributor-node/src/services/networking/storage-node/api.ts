import { Configuration } from './generated'
import { PublicApi } from './generated/api'
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios'
import { LoggingService } from '../../logging'
import { Logger } from 'winston'

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
    this.logger = logging.createLogger('StorageNodeApi')
  }

  public async isObjectAvailable(contentHash: string): Promise<boolean> {
    const options: AxiosRequestConfig = {
      headers: {
        Range: 'bytes=0-0',
      },
    }
    this.logger.info('Checking object availibility', { endpoint: this.endpoint, contentHash })
    try {
      await this.publicApi.publicApiFiles(contentHash, options)
      this.logger.info('Data object available', { contentHash, endpoint: this.endpoint })
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

  public async downloadObject(contentHash: string): Promise<AxiosResponse<NodeJS.ReadableStream>> {
    const options: AxiosRequestConfig = {
      responseType: 'stream',
    }
    return this.publicApi.publicApiFiles(contentHash, options)
  }
}
