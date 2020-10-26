import { createServer } from 'miragejs'
import { createGraphQLHandler } from '@miragejs/graphql'

import extendedQueryNodeSchema from '@/api/schemas/extendedQueryNode.graphql'
import orionSchema from '@/api/schemas/orion.graphql'

import { createMockData } from './data'
import {
  addVideoViewResolver,
  channelsResolver,
  featuredVideosResolver,
  searchResolver,
  videosResolver,
  videoViewsResolver,
} from './resolvers'
import { ORION_GRAPHQL_URL, QUERY_NODE_GRAPHQL_URL } from '@/config/urls'
import { MOCKED_SERVER_LOAD_DELAY } from '@/config/misc'

createServer({
  routes() {
    const queryNodeHandler = createGraphQLHandler(extendedQueryNodeSchema, this.schema, {
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

    const orionHandler = createGraphQLHandler(orionSchema, this.schema, {
      resolvers: {
        Query: {
          videoViews: videoViewsResolver,
        },
        Mutation: {
          addVideoView: addVideoViewResolver,
        },
      },
    })

    this.post(QUERY_NODE_GRAPHQL_URL, queryNodeHandler, { timing: MOCKED_SERVER_LOAD_DELAY })

    this.post(ORION_GRAPHQL_URL, orionHandler, { timing: MOCKED_SERVER_LOAD_DELAY })
    // this.passthrough(ORION_GRAPHQL_URL)

    // allow Hotjar analytics requests
    this.passthrough((request) => {
      return request.url.includes('hotjar')
    })
  },

  seeds(server) {
    createMockData(server)
  },
})
