import { WsProvider } from '@polkadot/api'
import { Api } from './Api'
import { QueryNodeApi } from './QueryNodeApi'
import { config } from 'dotenv'
import { ApolloClient, InMemoryCache } from '@apollo/client'
import Debugger from 'debug'
import { Flow } from './Flow'
import { Job } from './Job'
import { FlowManager } from './FlowManager'

export async function scenario(
  fn: (cfg: {
    api: Api
    query: QueryNodeApi
    env: NodeJS.ProcessEnv
    debug: Debugger.Debugger
    job: (label: string, flows: Flow[] | Flow) => Job
  }) => Promise<void>
): Promise<void> {
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

  const debug = Debugger('scenario')

  const flowManager = new FlowManager({ api, query, env })

  // Does the scenario really need the flow args?
  await fn({ api, query, env, debug, job: flowManager.createJob.bind(flowManager) })

  try {
    await flowManager.run()
  } catch (err) {
    console.error(err)
    process.exit(-1)
  }

  // Note: disconnecting and then reconnecting to the chain in the same process
  // doesn't seem to work!
  api.close()
}
