import React from 'react'
import styled from '@emotion/styled'
import { ChannelGallery, ErrorFallback, FeaturedVideoHeader, VideoGallery } from '@/components'

import { RouteComponentProps } from '@reach/router'
import { useQuery } from '@apollo/client'
import * as Sentry from '@sentry/react'
import { InfiniteVideoGrid } from '@/shared/components'
import { GET_FEATURED_VIDEOS, GET_NEWEST_CHANNELS, GET_NEWEST_VIDEOS } from '@/api/queries'
import { GetFeaturedVideos } from '@/api/queries/__generated__/GetFeaturedVideos'
import { GetNewestVideos, GetNewestVideosVariables } from '@/api/queries/__generated__/GetNewestVideos'
import { GetNewestChannels, GetNewestChannelsVariables } from '@/api/queries/__generated__/GetNewestChannels'

const NEWEST_VIDEOS_COUNT = 8
const NEWEST_CHANNELS_COUNT = 8

const HomeView: React.FC<RouteComponentProps> = () => {
  const {
    loading: newestVideosLoading,
    data: videosData,
    error: newestVideosError,
    refetch: refetchNewestVideos,
  } = useQuery<GetNewestVideos, GetNewestVideosVariables>(GET_NEWEST_VIDEOS, {
    variables: { first: NEWEST_VIDEOS_COUNT },
    notifyOnNetworkStatusChange: true,
  })
  const {
    loading: featuredVideosLoading,
    data: featuredVideosData,
    error: featuredVideosError,
    refetch: refetchFeaturedVideos,
  } = useQuery<GetFeaturedVideos>(GET_FEATURED_VIDEOS, {
    notifyOnNetworkStatusChange: true,
  })
  const {
    loading: newestChannelsLoading,
    data: newestChannelsData,
    error: newestChannelsError,
    refetch: refetchNewestChannels,
  } = useQuery<GetNewestChannels, GetNewestChannelsVariables>(GET_NEWEST_CHANNELS, {
    variables: { first: NEWEST_CHANNELS_COUNT },
    notifyOnNetworkStatusChange: true,
  })

  const newestVideos = videosData?.videosConnection.edges.slice(0, NEWEST_VIDEOS_COUNT).map((e) => e.node)
  const newestChannels = newestChannelsData?.channelsConnection.edges.map((e) => e.node)
  const hasNewestVideosError = newestVideosError && !newestVideosLoading
  const hasFeaturedVideosError = featuredVideosError && !featuredVideosLoading
  const hasNewestChannelsError = newestChannelsError && !newestChannelsLoading

  return (
    <>
      <FeaturedVideoHeader />
      <Container>
        {!hasNewestVideosError ? (
          <VideoGallery title="Newest videos" loading={newestVideosLoading} videos={newestVideos} />
        ) : (
          <ErrorFallback error={newestVideosError as Error} resetError={() => refetchNewestVideos()} />
        )}

        {!hasFeaturedVideosError ? (
          <VideoGallery
            title="Featured videos"
            loading={featuredVideosLoading}
            videos={featuredVideosData?.featured_videos}
          />
        ) : (
          <ErrorFallback error={featuredVideosError as Error} resetError={() => refetchFeaturedVideos()} />
        )}

        {!hasNewestChannelsError ? (
          <ChannelGallery title="Newest channels" loading={newestChannelsLoading} channels={newestChannels} />
        ) : (
          <ErrorFallback error={newestChannelsError as Error} resetError={() => refetchNewestChannels()} />
        )}
        <Sentry.ErrorBoundary fallback={ErrorFallback}>
          <StyledInfiniteVideoGrid title="More videos" skipCount={NEWEST_VIDEOS_COUNT} />
        </Sentry.ErrorBoundary>
      </Container>
    </>
  )
}

const Container = styled.div`
  position: relative;
  & > * {
    margin-bottom: 3rem;
  }
`

const StyledInfiniteVideoGrid = styled(InfiniteVideoGrid)`
  margin: 0;
  padding-bottom: 4rem;
`

export default HomeView
