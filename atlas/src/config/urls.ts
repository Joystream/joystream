const readEnv = (name: string): string | undefined => {
  return process.env[name]
}

const envQueryNodeUrl = readEnv('REACT_APP_QUERY_NODE_URL')
const envOrionUrl = readEnv('REACT_APP_ORION_URL')
const envSentryDNS = readEnv('REACT_APP_SENTRY_DNS')

export const MOCK_QUERY_NODE_GRAPHQL_URL = '/query-node-graphql'
export const QUERY_NODE_GRAPHQL_URL = envQueryNodeUrl || MOCK_QUERY_NODE_GRAPHQL_URL

export const MOCK_ORION_GRAPHQL_URL = '/orion-graphql'
export const ORION_GRAPHQL_URL = envOrionUrl || MOCK_ORION_GRAPHQL_URL

export const SENTRY_DNS = envSentryDNS
