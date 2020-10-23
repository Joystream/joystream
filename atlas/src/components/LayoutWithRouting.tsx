import React from 'react'
import styled from '@emotion/styled'
import { RouteComponentProps, Router, navigate } from '@reach/router'
import { ErrorBoundary } from 'react-error-boundary'

import { GlobalStyle } from '@/shared/components'
import { Navbar, ErrorFallback } from '@/components'
import { HomeView, VideoView, SearchView, ChannelView, BrowseView } from '@/views'
import routes from '@/config/routes'

type RouteProps = {
  Component: React.ComponentType
} & RouteComponentProps
const Route: React.FC<RouteProps> = ({ Component, ...pathProps }) => {
  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onReset={() => {
        navigate('/')
      }}
    >
      <Component {...pathProps} />
    </ErrorBoundary>
  )
}

const LayoutWithRouting: React.FC = () => (
  <>
    <GlobalStyle />
    <Router primary>
      <Navbar default />
    </Router>
    <MainContainer>
      <Router primary={false}>
        <Route default Component={HomeView} />
        <Route path={routes.video()} Component={VideoView} />
        <Route path={routes.search()} Component={SearchView} />
        <Route Component={BrowseView} path={routes.browse()} />
        <Route Component={ChannelView} path={routes.channel()} />
      </Router>
    </MainContainer>
  </>
)

const MainContainer = styled.main`
  padding: 0 var(--global-horizontal-padding);
`

export default LayoutWithRouting
