import axios from 'axios'
import { assert } from 'chai'
import { ContentId } from '@joystream/types/storage'
import { registry } from '@joystream/types'

import { FlowProps } from '../../Flow'
import { Utils } from '../../utils'
import { extendDebug } from '../../Debugger'

export default async function getContentFromStorageNode({ api, query }: FlowProps): Promise<void> {
  const debug = extendDebug('flow:getContentFromStorageNode')
  debug('Started')

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
  const dataObject = await api.getDataByContentId(contentId)

  assert(dataObject, 'dataObject should not be null')

  const response = await axios.get(`${process.env.STORAGE_NODE_URL}/${dataObjectId}`)

  assert(response.headers['content-length'], 'Should have some value')

  const contentLenght = Number.parseInt(response.headers['content-length'])

  assert.equal(contentLenght, dataObject!.size_in_bytes.toJSON(), 'Content should be same size')

  debug('Done')
}
