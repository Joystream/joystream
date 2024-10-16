import { Configuration, FilesApi, StateApi } from '@joystream/storage-node-client'
import { AxiosResponse } from 'axios'
import { assert } from 'chai'

export class ColossusApi {
  public filesApi: FilesApi
  public stateApi: StateApi

  constructor(url: string) {
    const config = new Configuration({
      basePath: url,
    })
    this.filesApi = new FilesApi(config)
    this.stateApi = new StateApi(config)
  }

  public async fetchAssetAsBuffer(assetId: string): Promise<AxiosResponse<Buffer>> {
    const originalResponse = (await this.filesApi.filesApiGetFile(assetId, {
      responseType: 'arraybuffer',
    })) as AxiosResponse<ArrayBuffer>
    return {
      ...originalResponse,
      data: Buffer.from(originalResponse.data),
    }
  }

  public async fetchAndVerifyAsset(assetId: string, expectedData: Buffer, expectedMimeType: string): Promise<void> {
    const response = await this.fetchAssetAsBuffer(assetId)
    assert.equal(response.data.length, expectedData.length)
    assert.deepEqual([...response.data], [...expectedData])
    assert.equal(response.headers['content-type'], expectedMimeType)
  }

  public async expectAssetNotFound(assetId: string): Promise<AxiosResponse<unknown>> {
    return this.filesApi.filesApiGetFile(assetId, { validateStatus: (status) => status === 404 })
  }
}
