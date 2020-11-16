import { GraphQLSchema } from 'graphql'
import { delegateToSchema } from '@graphql-tools/delegate'
import type { IResolvers } from '@graphql-tools/utils'
import { TransformOrionViewsField, ORION_VIEWS_FIELD_NAME, RemoveQueryNodeViewsField } from './transforms'

export const queryNodeStitchingResolvers = (
  queryNodeSchema: GraphQLSchema,
  orionSchema: GraphQLSchema
): IResolvers => ({
  Query: {
    videosConnection: async (parent, args, context, info) => {
      return await delegateToSchema({
        schema: queryNodeSchema,
        operation: 'query',
        fieldName: 'videosConnection',
        args,
        context,
        info,
        transforms: [RemoveQueryNodeViewsField],
      })
    },
  },
  Video: {
    // TODO: Resolve the views count in parallel to the videosConnection query
    // this can be done by writing a resolver for the query itself in which two requests in the same fashion as below would be made
    // then the results could be combined
    views: async (parent, args, context, info) => {
      try {
        return await delegateToSchema({
          schema: orionSchema,
          operation: 'query',
          fieldName: ORION_VIEWS_FIELD_NAME,
          args: {
            videoID: parent.id,
          },
          context,
          info,
          transforms: [TransformOrionViewsField],
        })
      } catch (error) {
        console.warn('Failed to resolve views field', { error })
        return null
      }
    },
  },
})
