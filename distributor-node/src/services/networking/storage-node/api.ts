import { Configuration, VersionResponse } from './generated'
import { FilesApi, StateApi } from './generated/api'
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios'
import { LoggingService } from '../../logging'
import { Logger } from 'winston'
import { ReadonlyConfig, StorageNodeDownloadResponse } from '../../../types'
import { parseAxiosError } from '../../parsers/errors'

export class StorageNodeApi {
  private logger: Logger
  private filesApi: FilesApi
  private stateApi: StateApi
  private config: ReadonlyConfig
  public endpoint: string

  public constructor(endpoint: string, logging: LoggingService, config: ReadonlyConfig) {
    this.config = config
    const apiConfig = new Configuration({
      basePath: endpoint,
    })
    this.filesApi = new FilesApi(apiConfig)
    this.stateApi = new StateApi(apiConfig)
    this.endpoint = new URL(endpoint).toString()
    this.logger = logging.createLogger('StorageNodeApi', { endpoint })
  }

  // Adds timeout for the request which can additionaly take into account response processing time.
  private reqConfigWithTimeout(options: AxiosRequestConfig, timeoutMs: number): [AxiosRequestConfig, NodeJS.Timeout] {
    const source = axios.CancelToken.source()
    const timeout = setTimeout(() => {
      this.logger.error(`Request timeout of ${timeoutMs}ms reached`, { timeoutMs })
      source.cancel('Request timeout')
    }, timeoutMs)
    return [
      {
        ...options,
        cancelToken: source.token,
      },
      timeout,
    ]
  }

  public async isObjectAvailable(objectId: string): Promise<boolean> {
    const [options, timeout] = this.reqConfigWithTimeout({}, this.config.limits.outboundRequestsTimeoutMs)
    this.logger.debug('Checking object availibility', { objectId })
    try {
      await this.filesApi.publicApiGetFileHeaders(objectId, options)
      this.logger.debug('Data object available', { objectId })
      return true
    } catch (err) {
      if (axios.isAxiosError(err)) {
        this.logger.debug('Data object not available', { objectId, err: parseAxiosError(err) })
        return false
      }
      this.logger.error('Unexpected error while requesting data object', { objectId, err })
      throw err
    } finally {
      clearTimeout(timeout)
    }
  }

  public async downloadObject(objectId: string, startAt?: number): Promise<StorageNodeDownloadResponse> {
    this.logger.verbose('Sending download request', { objectId, startAt })
    const [options, timeout] = this.reqConfigWithTimeout(
      {
        responseType: 'stream',
      },
      this.config.limits.pendingDownloadTimeoutSec * 1000
    )
    if (startAt) {
      options.headers.Range = `bytes=${startAt}-`
    }
    try {
      const response: StorageNodeDownloadResponse = await this.filesApi.publicApiGetFile(objectId, options)
      response.data.on('end', () => clearTimeout(timeout))
      response.data.on('error', () => clearTimeout(timeout))
      return response
    } catch (err) {
      clearTimeout(timeout)
      throw err
    }
  }

  public async getVersion(): Promise<AxiosResponse<VersionResponse>> {
    const [options, timeout] = this.reqConfigWithTimeout(
      {
        headers: {
          connection: 'close',
        },
      },
      this.config.limits.outboundRequestsTimeoutMs
    )
    try {
      const response = await this.stateApi.stateApiGetVersion(options)
      return response
    } finally {
      clearTimeout(timeout)
    }
  }
}
