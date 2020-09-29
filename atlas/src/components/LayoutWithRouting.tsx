import React from 'react'
import styled from '@emotion/styled'
import { Router } from '@reach/router'

import { GlobalStyle } from '@/shared/components'
import { Navbar } from '@/components'
import { HomeView, VideoView, SearchView, ChannelView, BrowseView } from '@/views'
import routes from '@/config/routes'
import { sizes } from '@/shared/theme'

const LayoutWithRouting: React.FC = () => (
  <MainContainer>
    <GlobalStyle />
    <Router primary>
      <Navbar default />
    </Router>
    <Router primary={false}>
      <HomeView default />
      <VideoView path={routes.video()} />
      <SearchView path={routes.search()} />
      <BrowseView path={routes.browse()} />
      <ChannelView path={routes.channel()} />
    </Router>
  </MainContainer>
)

const MainContainer = styled.main`
  padding: 0 ${sizes.b8}px;
`

export default LayoutWithRouting
