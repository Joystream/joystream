import { Configuration as ArgusClientConfig, DefaultApi as ArgusClient } from '@joystream/distributor-node-client'
import { AxiosResponse } from 'axios'
import { assert } from 'chai'

export class ArgusApi {
  public client: ArgusClient

  constructor(url: string) {
    const config = new ArgusClientConfig({
      basePath: url,
    })
    this.client = new ArgusClient(config)
  }

  public async fetchAssetAsBuffer(assetId: string): Promise<AxiosResponse<Buffer>> {
    const originalResponse = (await this.client.publicAsset(assetId, {
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
}
