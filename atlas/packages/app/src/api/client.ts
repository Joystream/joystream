import { ApolloClient, InMemoryCache } from '@apollo/client'
import { parseISO } from 'date-fns'
import '@/mocking/server'
import { offsetLimitPagination } from '@apollo/client/utilities'

const apolloClient = new ApolloClient({
  uri: '/graphql',
  cache: new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          videos: offsetLimitPagination(),
        },
      },
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
    possibleTypes: {
      FreeTextSearchResultItemType: ['Video', 'Channel'],
    },
  }),
})

export default apolloClient
