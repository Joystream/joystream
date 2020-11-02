import { WsProvider } from '@polkadot/api'
import { Api, QueryNodeApi, WorkingGroups } from '../Api'
import { config } from 'dotenv'
import leaderSetup from '../flows/workingGroup/leaderSetup'
import initializeContentDirectory from '../flows/contentDirectory/contentDirectoryInitialization'
import createChannel from '../flows/contentDirectory/creatingChannel'
import createVideo from '../flows/contentDirectory/creatingVideo'
import updateChannel from '../flows/contentDirectory/updatingChannel'
import { ApolloClient, InMemoryCache } from '@apollo/client';

const scenario = async () => {
  // Load env variables
  config()
  const env = process.env

  // Connect api to the chain
  const nodeUrl: string = env.NODE_URL || 'ws://127.0.0.1:9944'
  const provider = new WsProvider(nodeUrl)

  const queryNodeUrl: string = env.QUERY_NODE_URL || 'http://127.0.0.1:8080/graphql'

  const queryNodeProvider = new ApolloClient({
    uri: queryNodeUrl,
    cache: new InMemoryCache()
  });

  const api: QueryNodeApi = await QueryNodeApi.new(provider, queryNodeProvider, env.TREASURY_ACCOUNT_URI || '//Alice', env.SUDO_ACCOUNT_URI || '//Alice')

  const leadKeyPair = await leaderSetup(api, env, WorkingGroups.ContentDirectoryWorkingGroup)

  // Some flows that use the curator lead to perform some tests...
  //

  await initializeContentDirectory(api, leadKeyPair)

  await createChannel(api, leadKeyPair)

  await createVideo(api, leadKeyPair)

  await updateChannel(api, leadKeyPair)
  
  // Note: disconnecting and then reconnecting to the chain in the same process
  // doesn't seem to work!
  api.close()
}

scenario()
