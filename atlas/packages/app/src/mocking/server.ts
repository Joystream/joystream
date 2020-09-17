import { createServer } from 'miragejs'
import { createGraphQLHandler, mirageGraphQLFieldResolver } from '@miragejs/graphql'
import { shuffle } from 'lodash'

import schema from '../schema.graphql'
import { mockCategories, mockChannels, mockVideos } from '@/mocking/data'
import { SearchVariables } from '@/api/queries/__generated__/Search'

createServer({
  routes() {
    const graphQLHandler = createGraphQLHandler(schema, this.schema, {
      resolvers: {
        Query: {
          videos: (obj: unknown, { limit, offset, where: { categoryId_eq } }: any, context: unknown, info: unknown) => {
            const resolverArgs = categoryId_eq ? { categoryId: categoryId_eq } : {}
            const videos = mirageGraphQLFieldResolver(obj, resolverArgs, context, info)

            if (!limit && !offset) {
              return videos
            }

            const start = offset || 0
            const end = limit ? start + limit : videos.length

            return videos.slice(start, end)
          },
          featured_videos: (...params: unknown[]) => {
            const videos = mirageGraphQLFieldResolver(...params)
            return shuffle(videos.slice(0, 16))
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

    const categories = mockCategories.map((category) => {
      const models = server.create('Category', {
        ...category,
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

    // repeat videos 15 times
    // TODO: expand as part of https://github.com/Joystream/joystream/issues/1270
    const fakedMockVideos = Array.from({ length: 15 }, (_, idx) =>
      mockVideos.map((v) => ({ ...v, id: `${v.id}${idx}` }))
    ).flat()

    fakedMockVideos.forEach((video, idx) =>
      server.create('Video', {
        ...video,
        media,
        channel: channels[idx % channels.length],
        category: categories[idx % categories.length],
      })
    )
  },
})
