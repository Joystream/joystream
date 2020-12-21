import { config } from 'dotenv'
import { WsProvider } from '@polkadot/api'
import { ApolloClient, InMemoryCache } from '@apollo/client'

import { QueryNodeApi } from '../Api'
import getContentFromStorageNode from '../flows/storageNode/getContentFromStorageNode'

const scenario = async () => {
  // Load env variables
  config()
  const env = process.env

  const queryNodeProvider = new ApolloClient({
    uri: env.QUERY_NODE_URL,
    cache: new InMemoryCache(),
    defaultOptions: { query: { fetchPolicy: 'no-cache', errorPolicy: 'all' } },
  })

  const api: QueryNodeApi = await QueryNodeApi.new(
    new WsProvider(env.NODE_URL),
    queryNodeProvider,
    env.TREASURY_ACCOUNT_URI || '//Alice',
    env.SUDO_ACCOUNT_URI || '//Alice'
  )

  await getContentFromStorageNode(api)

  // Note: disconnecting and then reconnecting to the chain in the same process
  // doesn't seem to work!
  api.close()
}

scenario()
