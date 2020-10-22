import { ModelInstance } from 'miragejs/-types'
import faker from 'faker'

import { mockCategories, mockChannels, mockVideos, mockVideosMedia } from '@/mocking/data'
import { ChannelFields } from '@/api/queries/__generated__/ChannelFields'
import { CategoryFields } from '@/api/queries/__generated__/CategoryFields'

export const createMockData = (server: any) => {
  const channels = mockChannels.map((channel) => {
    return server.schema.create('Channel', {
      ...channel,
    }) as ModelInstance<ChannelFields>
  })

  const categories = mockCategories.map((category) => {
    return server.schema.create('Category', {
      ...category,
    }) as ModelInstance<CategoryFields>
  })

  const videoMedias = mockVideosMedia.map((videoMedia) => {
    // FIXME: This suffers from the same behaviour as the search resolver - all the returned items have the same location
    const location = server.schema.create('HTTPVideoMediaLocation', {
      id: faker.random.uuid(),
      ...videoMedia.location,
    })

    const model = server.schema.create('VideoMedia', {
      ...videoMedia,
      location,
    })
    return model
  })

  mockVideos.forEach((video, idx) => {
    const mediaIndex = idx % mockVideosMedia.length

    server.schema.create('Video', {
      ...video,
      views: undefined,
      duration: mockVideosMedia[mediaIndex].duration,
      channel: channels[idx % channels.length],
      category: categories[idx % categories.length],
      media: videoMedias[mediaIndex],
    })

    server.create('VideoViewsInfo', {
      id: video.id,
      views: video.views,
    })
  })
}
