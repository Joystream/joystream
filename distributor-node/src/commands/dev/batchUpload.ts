import AccountsCommandBase from '../../command-base/accounts'
import DefaultCommandBase, { flags } from '../../command-base/default'
import { FilesApi, Configuration, TokenRequest } from '../../services/networking/storage-node/generated'
import { u8aToHex } from '@polkadot/util'
import FormData from 'form-data'
import imgGen from 'js-image-generator'
import { SubmittableExtrinsic } from '@polkadot/api/types'
import { BagIdParserService } from '../../services/parsers/BagIdParserService'
import axios from 'axios'
import { ContentHash } from '../../services/crypto/ContentHash'

async function generateRandomImage(): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    imgGen.generateImage(10, 10, 80, function (err: unknown, image: { data: Buffer }) {
      if (err) {
        reject(err)
      } else {
        resolve(image.data)
      }
    })
  })
}

export default class DevBatchUpload extends AccountsCommandBase {
  static flags = {
    ...DefaultCommandBase.flags,
    bagId: flags.string({
      char: 'b',
      required: true,
    }),
    bucketId: flags.integer({
      char: 'B',
      description: 'Storage bucket id',
      required: true,
    }),
    batchSize: flags.integer({
      char: 'S',
      required: true,
    }),
    batchesCount: flags.integer({
      char: 'C',
      required: true,
    }),
  }

  async run(): Promise<void> {
    const { api } = this
    const { bagId, bucketId, batchSize, batchesCount } = this.parse(DevBatchUpload).flags
    const sudoKey = (await api.query.sudo.key()).toHuman()
    const dataFee = await api.query.storage.dataObjectPerMegabyteFee()
    const storageApi = new FilesApi(
      new Configuration({
        basePath: 'http://127.0.0.1:3333/api/v1',
      })
    )

    for (let i = 0; i < batchesCount; ++i) {
      const nextObjectId = (await api.query.storage.nextDataObjectId()).toNumber()
      // Generate batch
      const batch: [SubmittableExtrinsic<'promise'>, Buffer][] = []
      for (let j = 0; j < batchSize; ++j) {
        const dataObject = await generateRandomImage()
        const dataHash = new ContentHash().update(dataObject).digest()
        batch.push([
          api.tx.sudo.sudo(
            api.tx.storage.sudoUploadDataObjects({
              deletionPrizeSourceAccountId: sudoKey,
              objectCreationList: [
                {
                  Size: dataObject.byteLength,
                  IpfsContentId: dataHash,
                },
              ],
              expectedDataSizeFee: dataFee,
              bagId: new BagIdParserService(bagId).parse(),
            })
          ),
          dataObject,
        ])
      }
      // Send batch
      await this.sendAndFollowTx(this.getPair(sudoKey), api.tx.utility.batch(batch.map(([tx]) => tx)))

      // Send storage node uploads
      await Promise.all(
        batch.map(async ([, dataObject], k) => {
          const dataObjectId = nextObjectId + k
          const data: TokenRequest['data'] = {
            accountId: sudoKey,
            bagId,
            dataObjectId,
            memberId: 0,
            storageBucketId: bucketId,
          }
          const message = JSON.stringify(data)
          const signature = u8aToHex(this.getPair(sudoKey).sign(message))
          const {
            data: { token },
          } = await storageApi.publicApiAuthTokenForUploading({
            data,
            signature,
          })
          if (!token) {
            throw new Error('Received empty token!')
          }

          const formData = new FormData()
          formData.append('dataObjectId', dataObjectId.toString())
          formData.append('storageBucketId', bucketId.toString())
          formData.append('bagId', bagId)
          formData.append('file', dataObject, { filename: 'test.jpg', knownLength: dataObject.byteLength })
          this.log(`Uploading object ${dataObjectId}`)
          try {
            await axios({
              method: 'POST',
              url: 'http://127.0.0.1:3333/api/v1/files',
              data: formData,
              headers: {
                'x-api-key': token,
                'content-type': 'multipart/form-data',
                ...formData.getHeaders(),
              },
            })
          } catch (e) {
            if (axios.isAxiosError(e)) {
              console.log(e.response?.data)
            }
          }
        })
      )
    }
  }
}
