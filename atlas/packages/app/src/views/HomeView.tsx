import { css } from '@emotion/core'
import React from 'react'
import { ChannelGallery, Hero, Main, VideoGallery } from '@/components'
import { RouteComponentProps } from '@reach/router'
import { useQuery } from '@apollo/client'
import { GET_FEATURED_VIDEOS, GET_NEWEST_VIDEOS } from '@/api/queries'
import { GetNewestVideos } from '@/api/queries/__generated__/GetNewestVideos'
import { GetFeaturedVideos } from '@/api/queries/__generated__/GetFeaturedVideos'
import { GetNewestChannels } from '@/api/queries/__generated__/GetNewestChannels'
import { GET_NEWEST_CHANNELS } from '@/api/queries/channels'

const backgroundImg = 'https://source.unsplash.com/Nyvq2juw4_o/1920x1080'

const HomeView: React.FC<RouteComponentProps> = () => {
  const { loading: newestVideosLoading, data: newestVideosData } = useQuery<GetNewestVideos>(GET_NEWEST_VIDEOS)
  const { loading: featuredVideosLoading, data: featuredVideosData } = useQuery<GetFeaturedVideos>(GET_FEATURED_VIDEOS)
  const { loading: newestChannelsLoading, data: newestChannelsData } = useQuery<GetNewestChannels>(GET_NEWEST_CHANNELS)

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
        {/*  infinite video loader */}
      </Main>
    </>
  )
}

export default HomeView
