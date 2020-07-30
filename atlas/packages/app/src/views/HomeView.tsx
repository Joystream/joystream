import { css } from '@emotion/core'
import React from 'react'
import { ChannelGallery, Hero, Main, VideoGallery } from '@/components'
import { RouteComponentProps } from '@reach/router'

const backgroundImg = 'https://source.unsplash.com/Nyvq2juw4_o/1920x1080'

const HomeView: React.FC<RouteComponentProps> = () => (
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
      <VideoGallery title="Newest videos" />
      <VideoGallery title="Featured videos" />
      <ChannelGallery title="Newest channels" />
      {/*  infinite video loader */}
    </Main>
  </>
)

export default HomeView
