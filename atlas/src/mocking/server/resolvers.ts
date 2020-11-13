import { mirageGraphQLFieldResolver } from '@miragejs/graphql'
import { getRecords } from '@miragejs/graphql/lib/orm/records'
import { FEATURED_VIDEOS_INDEXES } from '@/mocking/data'
import { Search_search, SearchVariables } from '@/api/queries/__generated__/Search'
import { VideoFields } from '@/api/queries/__generated__/VideoFields'
import {
  GetNewestChannels_channelsConnection,
  GetNewestChannelsVariables,
} from '@/api/queries/__generated__/GetNewestChannels'
import { GetNewestVideos_videosConnection } from '@/api/queries/__generated__/GetNewestVideos'
import { ChannelFields } from '@/api/queries/__generated__/ChannelFields'

type QueryResolver<ArgsType extends object = Record<string, unknown>, ReturnType = unknown> = (
  obj: unknown,
  args: ArgsType,
  context: { mirageSchema: any },
  info: unknown
) => ReturnType

type VideoQueryArgs = {
  first: number | null
  after: string | null
  where: {
    categoryId_eq: string | null
  } | null
}

export const videosResolver: QueryResolver<VideoQueryArgs, GetNewestVideos_videosConnection> = (
  obj,
  args,
  context,
  info
) => {
  return null
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
  return paginatedVideos
}

export const featuredVideosResolver: QueryResolver<object, VideoFields[]> = (...params) => {
  const videos = mirageGraphQLFieldResolver(...params) as VideoFields[]
  return videos.filter((_, idx) => FEATURED_VIDEOS_INDEXES.includes(idx))
}

export const channelsResolver: QueryResolver<GetNewestChannelsVariables, GetNewestChannels_channelsConnection> = (
  obj,
  args,
  context,
  info
) => {
  return null
  const resolverArgs = {
    first: args.first,
    after: args.after,
  }

  const paginatedChannels = mirageGraphQLFieldResolver(obj, resolverArgs, context, info)
  return paginatedChannels
}

// FIXME: This resolver is currently broken and returns the same result n times instead of the correct result.
export const searchResolver: QueryResolver<SearchVariables, Search_search[]> = (_, { query_string }, context) => {
  return null
  const { mirageSchema: schema } = context
  const videos = getRecords({ name: 'Video' }, {}, schema) as VideoFields[]
  const channels = getRecords({ name: 'Channel' }, {}, schema) as ChannelFields[]

  const items = [...videos, ...channels]

  let rankCount = 0
  const matchQueryStr = (str: string) => str.includes(query_string) || query_string.includes(str)

  const relevantItems = items.reduce((acc, item) => {
    const matched =
      item.__typename === 'Channel'
        ? matchQueryStr(item.handle)
        : matchQueryStr(item.description) || matchQueryStr(item.title)

    if (!matched) {
      return acc
    }

    const result: Search_search = {
      __typename: 'FreeTextSearchResult',
      item,
      rank: rankCount++,
    }

    return [...acc, result]
  }, [] as Search_search[])
  return relevantItems
}

type VideoViewsArgs = {
  videoID: string
}

export const videoViewsResolver: QueryResolver<VideoViewsArgs> = (obj, args, context, info) => {
  return mirageGraphQLFieldResolver(obj, { id: args.videoID }, context, info)
}

export const addVideoViewResolver: QueryResolver<VideoViewsArgs> = (obj, args, context, info) => {
  const videoInfo = context.mirageSchema.videoViewsInfos.find(args.videoID)
  videoInfo.update({
    views: videoInfo.views + 1,
  })
  return videoInfo
}
