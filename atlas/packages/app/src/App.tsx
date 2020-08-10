import React from 'react'
import { Provider } from 'react-redux'
import { Router } from '@reach/router'
import { ApolloProvider } from '@apollo/client'

import store from './store'
import { Layout } from './components'
import { HomeView, VideoView } from './views'
import routes from './config/routes'
import { apolloClient } from '@/api'

export default function App() {
  return (
    <Provider store={store}>
      <ApolloProvider client={apolloClient}>
        <Layout>
          <Router primary={false}>
            <HomeView default />
            <VideoView path={routes.video} />
          </Router>
        </Layout>
      </ApolloProvider>
    </Provider>
  )
}
