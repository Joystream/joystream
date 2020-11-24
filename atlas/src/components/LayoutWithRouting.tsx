import React from 'react'
import styled from '@emotion/styled'
import { RouteComponentProps, Router, navigate } from '@reach/router'
import * as Sentry from '@sentry/react'

import { GlobalStyle } from '@/shared/components'
import { Navbar, ViewErrorFallback } from '@/components'
import { HomeView, VideoView, SearchView, ChannelView, BrowseView } from '@/views'
import routes from '@/config/routes'

type RouteProps = {
  Component: React.ComponentType
} & RouteComponentProps
const Route: React.FC<RouteProps> = ({ Component, ...pathProps }) => {
  return (
    <Sentry.ErrorBoundary
      fallback={ViewErrorFallback}
      onReset={() => {
        navigate('/')
      }}
    >
      <Component {...pathProps} />
    </Sentry.ErrorBoundary>
  )
}

const LayoutWithRouting: React.FC = () => (
  <>
    <GlobalStyle />
    <GlobalContainer>
      <Navbar default />
      <MainContainer>
        <Router primary={false}>
          <Route default Component={HomeView} />
          <Route path={routes.video()} Component={VideoView} />
          <Route path={routes.search()} Component={SearchView} />
          <Route Component={BrowseView} path={routes.browse()} />
          <Route Component={ChannelView} path={routes.channel()} />
        </Router>
      </MainContainer>
    </GlobalContainer>
  </>
)

const GlobalContainer = styled.div`
  display: flex;
  flex-direction: column;
  overflow: hidden;
  max-height: 100vh;
`

const MainContainer = styled.main`
  padding: 0 var(--global-horizontal-padding);
  overflow: auto;
`

export default LayoutWithRouting
