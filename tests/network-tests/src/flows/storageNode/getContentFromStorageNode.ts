import axios from 'axios'
import { assert } from 'chai'
import { ContentId } from '@joystream/types/media'
import { registry } from '@joystream/types'

import { Api } from '../../Api'
import { QueryNodeApi } from '../../QueryNodeApi'
import { Utils } from '../../utils'

export default async function getContentFromStorageNode(api: Api, query: QueryNodeApi): Promise<void> {
  const videoTitle = 'Storage node test'

  // Temporary solution (wait 2 minutes)
  await Utils.wait(120000)

  // Query video by title with where expression
  const videoWhereQueryResult = await query.performWhereQueryByVideoTitle(videoTitle)

  assert.equal(1, videoWhereQueryResult.data.videos.length, 'Should fetch only one video')

  // Get dataObjectId from the queried video's media location
  const dataObjectId = videoWhereQueryResult.data.videos[0].media.location.dataObjectId

  assert(dataObjectId.length > 2, 'dataObjectId should not be empty')

  const contentId = ContentId.decode(registry, dataObjectId)

  // Decode data object
  const dataObject = await api.getDataObjectByContentId(contentId)

  assert(dataObject, 'dataObject should not be null')

  const response = await axios.get(`${process.env.STORAGE_NODE_URL}/${dataObjectId}`)

  assert(response.headers['content-length'], 'Should have some value')

  const contentLenght = Number.parseInt(response.headers['content-length'])

  assert.equal(contentLenght, dataObject!.size_in_bytes.toJSON(), 'Content should be same size')
}
