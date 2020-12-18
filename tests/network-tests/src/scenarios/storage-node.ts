import { config } from 'dotenv'
import { WsProvider } from '@polkadot/api'
import { ApolloClient, InMemoryCache } from '@apollo/client'

import { Api } from '../Api'
import { QueryNodeApi } from '../QueryNodeApi'
import getContentFromStorageNode from '../flows/storageNode/getContentFromStorageNode'

const scenario = async () => {
  // Load env variables
  config()
  const env = process.env

  // Connect api to the chain
  const nodeUrl: string = env.NODE_URL || 'ws://127.0.0.1:9944'
  const provider = new WsProvider(nodeUrl)

  const api = await Api.create(provider, env.TREASURY_ACCOUNT_URI || '//Alice', env.SUDO_ACCOUNT_URI || '//Alice')

  const queryNodeUrl: string = env.QUERY_NODE_URL || 'http://127.0.0.1:8081/graphql'

  const queryNodeProvider = new ApolloClient({
    uri: queryNodeUrl,
    cache: new InMemoryCache(),
    defaultOptions: { query: { fetchPolicy: 'no-cache', errorPolicy: 'all' } },
  })

  const query = new QueryNodeApi(queryNodeProvider)

  await getContentFromStorageNode(api, query)

  // Note: disconnecting and then reconnecting to the chain in the same process
  // doesn't seem to work!
  api.close()
}

scenario()
