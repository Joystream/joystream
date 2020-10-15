import { print } from 'graphql'
import { ORION_GRAPHQL_URL, QUERY_NODE_GRAPHQL_URL } from '@/config/urls'
import { Executor } from '@graphql-tools/delegate'

// TODO: Switch back to using Apollo HTTP links with `linkToExecutor`
// That can be done once the following issues are resolved:
// https://github.com/ardatan/graphql-tools/issues/2105
// https://github.com/ardatan/graphql-tools/issues/2111
const buildExecutor = (uri: string): Executor => async ({ document, variables }) => {
  const query = print(document)
  const fetchResult = await fetch(uri, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query, variables }),
  })
  return fetchResult.json()
}

export const queryNodeExecutor = buildExecutor(QUERY_NODE_GRAPHQL_URL)
export const orionExecutor = buildExecutor(ORION_GRAPHQL_URL)
