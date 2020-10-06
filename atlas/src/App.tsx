import React from 'react'
import { ApolloProvider } from '@apollo/client'

import { apolloClient } from '@/api'
import { LayoutWithRouting } from '@/components'

export default function App() {
  return (
    <ApolloProvider client={apolloClient}>
      <LayoutWithRouting />
    </ApolloProvider>
  )
}
