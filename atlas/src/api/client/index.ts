import { ApolloClient } from '@apollo/client'
import { wrapSchema } from '@graphql-tools/wrap'
import { mergeSchemas } from '@graphql-tools/merge'
import { buildASTSchema } from 'graphql'
import { SchemaLink } from '@apollo/client/link/schema'

import extendedQueryNodeSchema from '../schemas/extendedQueryNode.graphql'
import orionSchema from '../schemas/orion.graphql'

import cache from './cache'
import { orionExecutor, queryNodeExecutor } from './executors'
import { queryNodeStitchingResolvers } from './resolvers'

const executableQueryNodeSchema = wrapSchema({
  schema: buildASTSchema(extendedQueryNodeSchema),
  executor: queryNodeExecutor,
})
const executableOrionSchema = wrapSchema({
  schema: buildASTSchema(orionSchema),
  executor: orionExecutor,
})

const mergedSchema = mergeSchemas({
  schemas: [executableQueryNodeSchema, executableOrionSchema],
  resolvers: queryNodeStitchingResolvers(executableQueryNodeSchema, executableOrionSchema),
})

const link = new SchemaLink({ schema: mergedSchema })

const apolloClient = new ApolloClient({ link, cache })

export default apolloClient
