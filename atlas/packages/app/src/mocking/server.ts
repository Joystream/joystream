import { createServer } from 'miragejs'
import { createGraphQLHandler, mirageGraphQLFieldResolver } from '@miragejs/graphql'
import { shuffle } from 'lodash'

import schema from '../schema.graphql'
import { mockChannels, mockVideos } from '@/mocking/data'
import { GetNewestVideosVariables } from '@/api/queries/__generated__/GetNewestVideos'
import { SearchVariables } from '@/api/queries/__generated__/Search'

createServer({
  routes() {
    const graphQLHandler = createGraphQLHandler(schema, this.schema, {
      resolvers: {
        Query: {
          videos: (obj: unknown, args: GetNewestVideosVariables, context: unknown, info: unknown) => {
            const videos = mirageGraphQLFieldResolver(obj, {}, context, info)

            const { limit } = args
            if (!limit) {
              return videos
            }

            const videosCount = videos.length
            const repeatVideosCount = Math.ceil(limit / videosCount)
            const repeatedVideos = Array.from({ length: repeatVideosCount }, () => videos).flat()
            const slicedVideos = repeatedVideos.slice(0, limit)
            return slicedVideos
          },
          featured_videos: (...params: unknown[]) => {
            const videos = mirageGraphQLFieldResolver(...params)
            return shuffle(videos)
          },
          channels: (...params: unknown[]) => {
            const channels = mirageGraphQLFieldResolver(...params)
            return shuffle(channels)
          },
          // FIXME: This resolver is currently broken and returns the same result n times instead of the correct result.
          search: (obj: unknown, { query_string }: SearchVariables, context: unknown, info: unknown) => {
            const items = [...mockVideos, ...mockChannels]

            let rankCount = 0
            const matchQueryStr = (str: string) => str.includes(query_string) || query_string.includes(str)

            const relevantItems = items.reduce((acc: any, item) => {
              const matched =
                item.__typename === 'Channel'
                  ? matchQueryStr(item.handle)
                  : matchQueryStr(item.description) || matchQueryStr(item.title)

              return matched
                ? [
                    ...acc,
                    {
                      __typename: 'FreeTextSearchResult',
                      item,
                      rank: rankCount++,
                    },
                  ]
                : acc
            }, [])
            return relevantItems
          },
        },
      },
    })

    this.post('/graphql', graphQLHandler, { timing: 1500 }) // include load delay
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
