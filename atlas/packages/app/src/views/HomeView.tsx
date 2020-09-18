import React, { useCallback } from 'react'
import styled from '@emotion/styled'
import { ChannelGallery, Hero, VideoGallery } from '@/components'
import { RouteComponentProps } from '@reach/router'
import { useQuery } from '@apollo/client'
import { GET_FEATURED_VIDEOS, GET_NEWEST_CHANNELS, GET_VIDEOS } from '@/api/queries'
import { GetFeaturedVideos } from '@/api/queries/__generated__/GetFeaturedVideos'
import { GetNewestChannels } from '@/api/queries/__generated__/GetNewestChannels'
import { GetVideos, GetVideosVariables } from '@/api/queries/__generated__/GetVideos'
import { InfiniteVideoGrid } from '@/shared/components'

const backgroundImg = 'https://eu-central-1.linodeobjects.com/atlas-assets/hero.jpeg'

const NEWEST_VIDEOS_COUNT = 8

const HomeView: React.FC<RouteComponentProps> = () => {
  const { loading: newestVideosLoading, data: videosData, fetchMore: fetchMoreVideos } = useQuery<
    GetVideos,
    GetVideosVariables
  >(GET_VIDEOS, {
    variables: { limit: 8, offset: 0 },
  })
  const { loading: featuredVideosLoading, data: featuredVideosData } = useQuery<GetFeaturedVideos>(GET_FEATURED_VIDEOS)
  const { loading: newestChannelsLoading, data: newestChannelsData } = useQuery<GetNewestChannels>(GET_NEWEST_CHANNELS)

  const newestVideos = videosData?.videos.slice(0, NEWEST_VIDEOS_COUNT)
  const nextVideos = videosData?.videos.slice(NEWEST_VIDEOS_COUNT)

  const loadVideos = useCallback(
    (offset: number, limit: number) => {
      const variables = { offset, limit }
      fetchMoreVideos({ variables })
    },
    [fetchMoreVideos]
  )

  return (
    <>
      <Hero backgroundImg={backgroundImg} />
      <Container>
        <VideoGallery title="Newest videos" loading={newestVideosLoading} videos={newestVideos} />
        <VideoGallery
          title="Featured videos"
          loading={featuredVideosLoading}
          videos={featuredVideosData?.featured_videos} // eslint-disable-line camelcase
        />
        <ChannelGallery
          title="Newest channels"
          loading={newestChannelsLoading}
          channels={newestChannelsData?.channels}
        />
        <StyledInfiniteVideoGrid
          title="More videos"
          videos={nextVideos}
          loadVideos={loadVideos}
          initialOffset={NEWEST_VIDEOS_COUNT}
        />
      </Container>
    </>
  )
}

const Container = styled.div`
  margin: 1rem 0;
  & > * {
    margin-bottom: 3rem;
  }
`

const StyledInfiniteVideoGrid = styled(InfiniteVideoGrid)`
  margin: 0;
  padding-bottom: 4rem;
`

export default HomeView
