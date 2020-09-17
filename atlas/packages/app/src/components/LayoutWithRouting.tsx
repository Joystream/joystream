import React from 'react'
import { GlobalStyle } from '@/shared/components'
import { Navbar } from '@/components'
import { HomeView, VideoView, SearchView } from '@/views'
import routes from '@/config/routes'
import { Router } from '@reach/router'

const LayoutWithRouting: React.FC = () => (
  <main>
    <GlobalStyle />
    <Router primary>
      <Navbar default />
    </Router>
    <Router primary={false}>
      <HomeView default />
      <VideoView path={routes.video()} />
      <SearchView path={routes.search()} />
    </Router>
  </main>
)

export default LayoutWithRouting
