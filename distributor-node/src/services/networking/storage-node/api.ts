import { Configuration } from './generated'
import { FilesApi, StateApi } from './generated/api'
import axios, { AxiosRequestConfig } from 'axios'
import { LoggingService } from '../../logging'
import { Logger } from 'winston'
import { StorageNodeDownloadResponse } from '../../../types'
import { parseAxiosError } from '../../parsers/errors'

export class StorageNodeApi {
  private logger: Logger
  public filesApi: FilesApi
  public stateApi: StateApi
  public endpoint: string

  public constructor(endpoint: string, logging: LoggingService) {
    const config = new Configuration({
      basePath: endpoint,
    })
    this.filesApi = new FilesApi(config)
    this.stateApi = new StateApi(config)
    this.endpoint = new URL(endpoint).toString()
    this.logger = logging.createLogger('StorageNodeApi', { endpoint })
  }

  public async isObjectAvailable(objectId: string): Promise<boolean> {
    this.logger.debug('Checking object availibility', { objectId })
    try {
      await this.filesApi.publicApiGetFileHeaders(objectId)
      this.logger.debug('Data object available', { objectId })
      return true
    } catch (err) {
      if (axios.isAxiosError(err)) {
        this.logger.debug('Data object not available', { objectId, err: parseAxiosError(err) })
        return false
      }
      this.logger.error('Unexpected error while requesting data object', { objectId, err })
      throw err
    }
  }

  public async downloadObject(objectId: string, startAt?: number): Promise<StorageNodeDownloadResponse> {
    this.logger.verbose('Sending download request', { objectId, startAt })
    const options: AxiosRequestConfig = {
      responseType: 'stream',
    }
    if (startAt) {
      options.headers.Range = `bytes=${startAt}-`
    }
    return this.filesApi.publicApiGetFile(objectId, options)
  }
}
