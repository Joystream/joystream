import React from 'react'
import { Provider } from 'react-redux'
import { ApolloProvider } from '@apollo/client'

import store from './store'
import { apolloClient } from '@/api'
import { LayoutWithRouting } from '@/components'

export default function App() {
  return (
    <Provider store={store}>
      <ApolloProvider client={apolloClient}>
        <LayoutWithRouting />
      </ApolloProvider>
    </Provider>
  )
}
