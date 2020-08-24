import React from 'react'
import { GlobalStyle } from '@/shared/components'
import { HomeView, VideoView } from '@/views'
import routes from '@/config/routes'
import { Router } from '@reach/router'

const LayoutWithRouting: React.FC = () => (
  <main>
    <GlobalStyle />
    <Router primary={false}>
      <HomeView default />
      <VideoView path={routes.video()} />
    </Router>
  </main>
)

export default LayoutWithRouting
