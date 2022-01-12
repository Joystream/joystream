import AccountsCommandBase from '../../command-base/accounts'
import DefaultCommandBase, { flags } from '../../command-base/default'
import FormData from 'form-data'
import imgGen from 'js-image-generator'
import { SubmittableExtrinsic } from '@polkadot/api/types'
import { BagIdParserService } from '../../services/parsers/BagIdParserService'
import axios from 'axios'
import { ContentHash } from '../../services/crypto/ContentHash'
import urljoin from 'url-join'

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
    endpoint: flags.string({
      char: 'e',
      required: true,
    }),
  }

  async run(): Promise<void> {
    const { api } = this
    const { bagId, bucketId, batchSize, batchesCount, endpoint } = this.parse(DevBatchUpload).flags
    const sudoKey = (await api.query.sudo.key()).toHuman()
    const dataFee = await api.query.storage.dataObjectPerMegabyteFee()

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
          const formData = new FormData()
          formData.append('dataObjectId', dataObjectId.toString())
          formData.append('storageBucketId', bucketId.toString())
          formData.append('bagId', bagId)
          formData.append('file', dataObject, { filename: 'test.jpg', knownLength: dataObject.byteLength })
          this.log(`Uploading object ${dataObjectId}`)
          try {
            await axios({
              method: 'POST',
              url: urljoin(endpoint, 'api/v1/files'),
              data: formData,
              headers: {
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
