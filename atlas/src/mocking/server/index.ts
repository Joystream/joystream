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
import {
  MOCK_ORION_GRAPHQL_URL,
  MOCK_QUERY_NODE_GRAPHQL_URL,
  ORION_GRAPHQL_URL,
  QUERY_NODE_GRAPHQL_URL,
} from '@/config/urls'
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

    this.post(MOCK_QUERY_NODE_GRAPHQL_URL, queryNodeHandler, { timing: MOCKED_SERVER_LOAD_DELAY })
    if (QUERY_NODE_GRAPHQL_URL !== MOCK_QUERY_NODE_GRAPHQL_URL) {
      this.passthrough(QUERY_NODE_GRAPHQL_URL)
    }

    this.post(MOCK_ORION_GRAPHQL_URL, orionHandler, { timing: MOCKED_SERVER_LOAD_DELAY })
    if (ORION_GRAPHQL_URL !== MOCK_ORION_GRAPHQL_URL) {
      this.passthrough(ORION_GRAPHQL_URL)
    }

    // allow Hotjar analytics requests
    this.passthrough((request) => {
      return request.url.includes('hotjar')
    })

    // allow Sentry error reporting
    this.passthrough((request) => {
      return request.url.includes('sentry')
    })
  },

  seeds(server) {
    createMockData(server)
  },
})
