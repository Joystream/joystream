import React from 'react'
import styled from '@emotion/styled'
import { Router } from '@reach/router'

import { GlobalStyle } from '@/shared/components'
import { Navbar } from '@/components'
import { BrowseView, ChannelView, HomeView, SearchView, VideoView } from '@/views'
import routes from '@/config/routes'

const LayoutWithRouting: React.FC = () => (
  <>
    <GlobalStyle />
    <Router primary>
      <Navbar default />
    </Router>
    <MainContainer>
      <Router primary={false}>
        <HomeView default />
        <VideoView path={routes.video()} />
        <SearchView path={routes.search()} />
        <BrowseView path={routes.browse()} />
        <ChannelView path={routes.channel()} />
      </Router>
    </MainContainer>
  </>
)

const MainContainer = styled.main`
  padding: 0 var(--global-horizontal-padding);
`

export default LayoutWithRouting
