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
      },
    })

    this.post('/graphql', graphQLHandler, { timing: 1500 }) // include load delay
  },

  seeds(server) {
    createMockData(server)
  },
})
