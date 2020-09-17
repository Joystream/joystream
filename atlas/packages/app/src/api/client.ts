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
          videos: offsetLimitPagination((args) => {
            // make sure queries asking for a specific category are separated in cache
            return args?.where?.categoryId_eq
          }),
        },
      },
      Video: {
        fields: {
          publishedOnJoystreamAt: {
            merge(_, publishedOnJoystreamAt: string | Date): Date {
              if (typeof publishedOnJoystreamAt !== 'string') {
                // TODO: investigate further
                // rarely, for some reason the object that arrives here is already a date object
                // in this case parsing attempt will cause an error
                return publishedOnJoystreamAt
              }
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

// 2020-09-15
// the following code fragment was written as part of solving apollo client pagination issues
// it features an example of more advanced cache handling with custom merge/read operations
// at some point it may prove useful so leaving it here for now

// // based on FieldPolicy from '@apollo/client/cache/inmemory/policies'
// type TypeableFieldMergeFunction<TExisting = any, TIncoming = TExisting, TArgs = Record<string, unknown>> = (
//   existing: SafeReadonly<TExisting> | undefined,
//   incoming: SafeReadonly<TIncoming>,
//   options: FieldFunctionOptions<TArgs, TArgs>
// ) => SafeReadonly<TExisting>
// type TypeableFieldReadFunction<TExisting = any, TReadResult = TExisting, TArgs = Record<string, unknown>> = (
//   existing: SafeReadonly<TExisting> | undefined,
//   options: FieldFunctionOptions<TArgs, TArgs>
// ) => TReadResult | undefined
//
// type VideosFieldPolicy = {
//   merge: TypeableFieldMergeFunction<VideoFields[], VideoFields[], GetVideosVariables>
//   read?: TypeableFieldReadFunction<VideoFields[], VideoFields[], GetVideosVariables>
// }

// {
// merge: (existing, incoming, { variables }) => {
//   // based on offsetLimitPagination from '@apollo/client/utilities'
//   const merged = existing ? existing.slice(0) : []
//   const start = variables?.offset || 0
//   const end = start + incoming.length
//   for (let i = start; i < end; ++i) {
//     merged[i] = incoming[i - start]
//   }
//   // console.log({ merged })
//   return merged
// },
// read: (existing, { variables, readField }) => {
//   // console.log('read')
//   // console.log({ variables })
//   if (variables?.categoryId) {
//     console.log({ existing })
//     const filtered = existing?.filter((v) => {
//       let categoryId = v.category?.id
//       if (!v.category) {
//         const categoryRef = readField('category', v as any)
//         categoryId = readField('id', categoryRef as Reference) as string
//       }
//       return categoryId === variables.categoryId
//     })
//     console.log({ filtered })
//     if (!filtered?.length) {
//       return
//     }
//     return filtered
//   }
//   return existing
// },

// } as VideosFieldPolicy,
