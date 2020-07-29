import React from 'react'
import { Provider } from 'react-redux'
import { Router } from '@reach/router'

import store from './store'
import { Layout } from './components'
import { HomeView, VideoView } from './views'
import routes from './config/routes'

export default function App() {
  return (
    <Provider store={store}>
      <Layout>
        <Router primary={false}>
          <HomeView default />
          <VideoView path={routes.video} />
        </Router>
      </Layout>
    </Provider>
  )
}
