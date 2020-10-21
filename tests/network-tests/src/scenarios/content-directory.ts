import { WsProvider } from '@polkadot/api'
import { Api, WorkingGroups } from '../Api'
import { config } from 'dotenv'
import leaderSetup from '../flows/workingGroup/leaderSetup'
import initializeContentDirectory from '../flows/contentDirectory/contentDirectoryInitialization'
import createChannel from '../flows/contentDirectory/creatingChannel'

const scenario = async () => {
  // Load env variables
  config()
  const env = process.env

  // Connect api to the chain
  const nodeUrl: string = env.NODE_URL || 'ws://127.0.0.1:9944'
  const provider = new WsProvider(nodeUrl)
  const api: Api = await Api.create(provider, env.TREASURY_ACCOUNT_URI || '//Alice', env.SUDO_ACCOUNT_URI || '//Alice')

  await leaderSetup(api, env, WorkingGroups.ContentDirectoryWorkingGroup)

  // Some flows that use the curator lead to perform some tests...
  //

  await initializeContentDirectory(api)

  await createChannel(api)

  // Note: disconnecting and then reconnecting to the chain in the same process
  // doesn't seem to work!
  api.close()
}

scenario()
