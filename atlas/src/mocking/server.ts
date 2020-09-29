import { createServer } from 'miragejs'
import { createGraphQLHandler, mirageGraphQLFieldResolver } from '@miragejs/graphql'
import { shuffle } from 'lodash'
import faker from 'faker'

import schema from '../schema.graphql'
import { FEATURED_VIDEOS_INDEXES, mockCategories, mockChannels, mockVideos, mockVideosMedia } from '@/mocking/data'
import { SearchVariables } from '@/api/queries/__generated__/Search'
import { ModelInstance } from 'miragejs/-types'
import { ChannelFields } from '@/api/queries/__generated__/ChannelFields'
import { CategoryFields } from '@/api/queries/__generated__/CategoryFields'

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
            const videos = mirageGraphQLFieldResolver(...params) as unknown[]
            return videos.filter((_, idx) => FEATURED_VIDEOS_INDEXES.includes(idx))
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
        duration: mockVideosMedia[mediaIndex].duration,
        channel: channels[idx % channels.length],
        category: categories[idx % categories.length],
        media: videoMedias[mediaIndex],
      })
    })
  },
})
