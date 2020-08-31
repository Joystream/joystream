import React, { useCallback } from 'react'
import { css } from '@emotion/core'
import styled from '@emotion/styled'
import { ChannelGallery, Hero, Main, VideoGallery } from '@/components'
import { RouteComponentProps } from '@reach/router'
import { useLazyQuery, useQuery } from '@apollo/client'
import { GET_FEATURED_VIDEOS, GET_NEWEST_VIDEOS, GET_NEWEST_CHANNELS } from '@/api/queries'
import { GetNewestVideos, GetNewestVideosVariables } from '@/api/queries/__generated__/GetNewestVideos'
import { GetFeaturedVideos } from '@/api/queries/__generated__/GetFeaturedVideos'
import { GetNewestChannels } from '@/api/queries/__generated__/GetNewestChannels'
import { InfiniteVideoGrid } from '@/shared/components'

const backgroundImg = 'https://source.unsplash.com/Nyvq2juw4_o/1920x1080'

const HomeView: React.FC<RouteComponentProps> = () => {
  const { loading: newestVideosLoading, data: newestVideosData } = useQuery<GetNewestVideos>(GET_NEWEST_VIDEOS)
  const { loading: featuredVideosLoading, data: featuredVideosData } = useQuery<GetFeaturedVideos>(GET_FEATURED_VIDEOS)
  const { loading: newestChannelsLoading, data: newestChannelsData } = useQuery<GetNewestChannels>(GET_NEWEST_CHANNELS)
  const [getNextVideos, { data: nextVideosData, fetchMore: fetchMoreNextVideos }] = useLazyQuery<
    GetNewestVideos,
    GetNewestVideosVariables
  >(GET_NEWEST_VIDEOS, { fetchPolicy: 'cache-and-network' })

  const loadVideos = useCallback(
    (offset: number, limit: number) => {
      const variables = { offset, limit }
      if (!fetchMoreNextVideos) {
        getNextVideos({ variables })
      } else {
        fetchMoreNextVideos({ variables })
      }
    },
    [getNextVideos, fetchMoreNextVideos]
  )

  return (
    <>
      <Hero backgroundImg={backgroundImg} />
      <Main
        containerCss={css`
          margin: 1rem 0;
          & > * {
            margin-bottom: 3rem;
          }
        `}
      >
        <VideoGallery title="Newest videos" loading={newestVideosLoading} videos={newestVideosData?.videos} />
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
        <StyledInfiniteVideoGrid title="More videos" videos={nextVideosData?.videos} loadVideos={loadVideos} />
      </Main>
    </>
  )
}

const StyledInfiniteVideoGrid = styled(InfiniteVideoGrid)`
  margin: 0;
  padding-bottom: 4rem;
`

export default HomeView
