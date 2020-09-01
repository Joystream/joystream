import { createServer } from 'miragejs'
import { createGraphQLHandler, mirageGraphQLFieldResolver } from '@miragejs/graphql'
import { shuffle } from 'lodash'

import schema from '../schema.graphql'
import { mockChannels, mockVideos } from '@/mocking/data'

createServer({
  routes() {
    const graphQLHandler = createGraphQLHandler(schema, this.schema, {
      resolvers: {
        Query: {
          videos: (...params: unknown[]) => {
            const videos = mirageGraphQLFieldResolver(...params)
            return shuffle(videos)
          },
          featured_videos: (...params: unknown[]) => {
            const videos = mirageGraphQLFieldResolver(...params)
            return shuffle(videos)
          },
          channels: (...params: unknown[]) => {
            const channels = mirageGraphQLFieldResolver(...params)
            return shuffle(channels)
          },
        },
      },
    })

    this.post('/graphql', graphQLHandler)
  },

  seeds(server) {
    const channels = mockChannels.map((channel) => {
      const models = server.create('Channel', {
        ...channel,
      })
      return models
    })

    const location = server.schema.create('HTTPVideoMediaLocation', {
      id: 'locationID',
      host: 'https://js-video-example.s3.eu-central-1.amazonaws.com/waves.mp4',
    })

    const media = server.schema.create('VideoMedia', {
      id: 'videoMediaID',
      entityID: 'videoMediaEntityID',
      encoding: 'H264_mpeg4',
      pixelWidth: 1920,
      pixelHeight: 1080,
      location,
    })

    mockVideos.forEach((video, idx) =>
      server.create('Video', {
        ...video,
        media,
        channel: channels[idx % channels.length],
      })
    )
  },
})
