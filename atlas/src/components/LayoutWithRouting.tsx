import React from 'react'
import styled from '@emotion/styled'
import { RouteComponentProps, Router, navigate } from '@reach/router'
import { ErrorBoundary } from 'react-error-boundary'

import { GlobalStyle } from '@/shared/components'
import { Navbar, ViewErrorFallback } from '@/components'
import { HomeView, VideoView, SearchView, ChannelView, BrowseView } from '@/views'
import routes from '@/config/routes'

type RouteProps = {
  Component: React.ComponentType
} & RouteComponentProps
const Route: React.FC<RouteProps> = ({ Component, ...pathProps }) => {
  return (
    <MainContainer>
      <ErrorBoundary
        FallbackComponent={ViewErrorFallback}
        onReset={() => {
          navigate('/')
        }}
      >
        <Component {...pathProps} />
      </ErrorBoundary>
    </MainContainer>
  )
}

const LayoutWithRouting: React.FC = () => (
  <>
    <GlobalStyle />

    <Navbar default />
    <Router primary={false}>
      <Route default Component={HomeView} />
      <Route path={routes.video()} Component={VideoView} />
      <Route path={routes.search()} Component={SearchView} />
      <Route Component={BrowseView} path={routes.browse()} />
      <Route Component={ChannelView} path={routes.channel()} />
    </Router>
  </>
)

const MainContainer = styled.main`
  padding: 0 var(--global-horizontal-padding);
`

export default LayoutWithRouting
