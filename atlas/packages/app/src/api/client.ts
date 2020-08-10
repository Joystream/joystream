import { ApolloClient, InMemoryCache } from '@apollo/client'
import { parseISO } from 'date-fns'
import '@/mocking/server'

const apolloClient = new ApolloClient({
  uri: '/graphql',
  cache: new InMemoryCache({
    typePolicies: {
      Video: {
        fields: {
          publishedOnJoystreamAt: {
            merge(_, publishedOnJoystreamAt: string): Date {
              return parseISO(publishedOnJoystreamAt)
            },
          },
        },
      },
    },
  }),
})

export default apolloClient
