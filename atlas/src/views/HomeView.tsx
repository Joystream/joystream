import React from 'react'
import styled from '@emotion/styled'
import { ChannelGallery, FeaturedVideoHeader, VideoGallery } from '@/components'
import { RouteComponentProps } from '@reach/router'
import { useQuery } from '@apollo/client'
import { InfiniteVideoGrid } from '@/shared/components'
import { GET_FEATURED_VIDEOS, GET_NEWEST_CHANNELS, GET_NEWEST_VIDEOS } from '@/api/queries'
import { GetFeaturedVideos } from '@/api/queries/__generated__/GetFeaturedVideos'
import { GetNewestVideos, GetNewestVideosVariables } from '@/api/queries/__generated__/GetNewestVideos'
import { GetNewestChannels, GetNewestChannelsVariables } from '@/api/queries/__generated__/GetNewestChannels'
import { spacing } from '@/shared/theme'

const NEWEST_VIDEOS_COUNT = 8
const NEWEST_CHANNELS_COUNT = 8

const HomeView: React.FC<RouteComponentProps> = () => {
  const { loading: newestVideosLoading, data: videosData } = useQuery<GetNewestVideos, GetNewestVideosVariables>(
    GET_NEWEST_VIDEOS,
    {
      variables: { first: NEWEST_VIDEOS_COUNT },
    }
  )
  const { loading: featuredVideosLoading, data: featuredVideosData } = useQuery<GetFeaturedVideos>(GET_FEATURED_VIDEOS)
  const { loading: newestChannelsLoading, data: newestChannelsData } = useQuery<
    GetNewestChannels,
    GetNewestChannelsVariables
  >(GET_NEWEST_CHANNELS, { variables: { first: NEWEST_CHANNELS_COUNT } })

  const newestVideos = videosData?.videosConnection.edges.slice(0, NEWEST_VIDEOS_COUNT).map((e) => e.node)
  const newestChannels = newestChannelsData?.channelsConnection.edges.map((e) => e.node)

  return (
    <>
      <FeaturedVideoHeader />
      <Container>
        <VideoGallery title="Newest videos" loading={newestVideosLoading} videos={newestVideos} />
        <VideoGallery
          title="Featured videos"
          loading={featuredVideosLoading}
          videos={featuredVideosData?.featured_videos}
        />
        <ChannelGallery title="Newest channels" loading={newestChannelsLoading} channels={newestChannels} />
        <StyledInfiniteVideoGrid title="More videos" skipCount={NEWEST_VIDEOS_COUNT} />
      </Container>
    </>
  )
}

const Container = styled.div`
  position: relative;
  margin: ${spacing.xxxxl} 0;
  & > * {
    margin-bottom: 3rem;
  }
`

const StyledInfiniteVideoGrid = styled(InfiniteVideoGrid)`
  margin: 0;
  padding-bottom: 4rem;
`

export default HomeView
