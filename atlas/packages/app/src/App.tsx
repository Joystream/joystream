import React from 'react'
import { Provider } from 'react-redux'
import { Router } from '@reach/router'

import store from './store'
import { Layout } from './components'
import { HomeView } from './views'

export default function App() {
  return (
    <Provider store={store}>
      <Layout>
        <Router primary={false}>
          <HomeView default />
        </Router>
      </Layout>
    </Provider>
  )
}
