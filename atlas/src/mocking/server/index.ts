import { createServer } from 'miragejs'
import { createGraphQLHandler } from '@miragejs/graphql'

import schema from '../../schema.graphql'
import { createMockData } from './data'
import { channelsResolver, featuredVideosResolver, searchResolver, videosResolver } from './resolvers'

createServer({
  routes() {
    const graphQLHandler = createGraphQLHandler(schema, this.schema, {
      resolvers: {
        Query: {
          videosConnection: videosResolver,
          featured_videos: featuredVideosResolver,
          channelsConnection: channelsResolver,
          search: searchResolver,
        },
        // TODO: remove these once the MirageJS bug gets resolved: https://github.com/miragejs/graphql/issues/16
        FreeTextSearchResult: {
          item: ({ item }: any) => item,
        },
        VideoMedia: {
          location: ({ location }: any) => location,
        },
      },
    })

    this.post('/graphql', graphQLHandler, { timing: 1500 }) // include load delay
  },

  seeds(server) {
    createMockData(server)
  },
})
