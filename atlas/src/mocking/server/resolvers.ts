import { mirageGraphQLFieldResolver } from '@miragejs/graphql'
import { FEATURED_VIDEOS_INDEXES, mockChannels, mockVideos } from '@/mocking/data'
import { SearchVariables } from '@/api/queries/__generated__/Search'

// eslint-disable-next-line @typescript-eslint/ban-types
type QueryResolver<T extends object = Record<string, unknown>> = (
  obj: unknown,
  args: T,
  context: unknown,
  info: unknown
) => unknown

type VideoQueryArgs = {
  first: number | null
  after: string | null
  where: {
    categoryId_eq: string | null
  } | null
}

export const videosResolver: QueryResolver<VideoQueryArgs> = (obj, args, context, info) => {
  const baseResolverArgs = {
    first: args.first,
    after: args.after,
  }
  const extraResolverArgs = args.where?.categoryId_eq
    ? {
        categoryId: args.where.categoryId_eq,
      }
    : {}
  const resolverArgs = {
    ...baseResolverArgs,
    ...extraResolverArgs,
  }

  const paginatedVideos = mirageGraphQLFieldResolver(obj, resolverArgs, context, info)
  const allVideos = mirageGraphQLFieldResolver(obj, extraResolverArgs, context, info)

  return {
    ...paginatedVideos,
    totalCount: allVideos.edges.length,
  }
}

export const featuredVideosResolver: QueryResolver = (...params) => {
  const videos = mirageGraphQLFieldResolver(...params) as unknown[]
  return videos.filter((_, idx) => FEATURED_VIDEOS_INDEXES.includes(idx))
}

export const channelsResolver: QueryResolver = (obj, args, context, info) => {
  const paginatedChannels = mirageGraphQLFieldResolver(obj, args, context, info)
  const allChannels = mirageGraphQLFieldResolver(obj, {}, context, info)
  return {
    ...paginatedChannels,
    totalCount: allChannels.edges.length,
  }
}

// FIXME: This resolver is currently broken and returns the same result n times instead of the correct result.
export const searchResolver: QueryResolver<SearchVariables> = (_, { query_string }) => {
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
}
