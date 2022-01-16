import { WsProvider } from '@polkadot/api'
import { ApiFactory, Api } from './Api'
import { QueryNodeApi } from './QueryNodeApi'
import { config } from 'dotenv'
import { ApolloClient, InMemoryCache, HttpLink } from '@apollo/client'
import { Debugger, extendDebug } from './Debugger'
import { Flow } from './Flow'
import { Job } from './Job'
import { JobManager } from './JobManager'
import { ResourceManager } from './Resources'
import fetch from 'cross-fetch'
import fs from 'fs'
import { CliApi } from './CliApi'

export type ScenarioProps = {
  env: NodeJS.ProcessEnv
  debug: Debugger.Debugger
  job: (label: string, flows: Flow[] | Flow) => Job
}

function writeOutput(api: Api, miniSecret: string) {
  const outputFilename = 'output.json'
  console.error('Writing generated account to', outputFilename)
  // account to key ids
  const accounts = api.getAllGeneratedAccounts()

  // first and last key id used to generate keys in this scenario
  const keyIds = api.keyGenInfo()

  const output = {
    accounts,
    keyIds,
    miniSecret,
  }

  fs.writeFileSync(outputFilename, JSON.stringify(output, undefined, 2))
}

export async function scenario(scene: (props: ScenarioProps) => Promise<void>): Promise<void> {
  // Load env variables
  config()
  const env = process.env

  // Connect api to the chain
  const nodeUrl: string = env.NODE_URL || 'ws://127.0.0.1:9944'
  const provider = new WsProvider(nodeUrl)
  const miniSecret = env.SURI_MINI_SECRET || ''
  const apiFactory = await ApiFactory.create(
    provider,
    env.TREASURY_ACCOUNT_URI || '//Alice',
    env.SUDO_ACCOUNT_URI || '//Alice',
    miniSecret
  )

  const api = apiFactory.getApi('Key Generation')

  // Generate all key ids before START_KEY_ID
  const startKeyId = parseInt(env.START_KEY_ID || '0')
  if (startKeyId) {
    api.createKeyPairs(startKeyId)
  }

  const queryNodeUrl: string = env.QUERY_NODE_URL || 'http://127.0.0.1:8081/graphql'

  const queryNodeProvider = new ApolloClient({
    link: new HttpLink({ uri: queryNodeUrl, fetch }),
    cache: new InMemoryCache(),
    defaultOptions: { query: { fetchPolicy: 'no-cache', errorPolicy: 'all' } },
  })

  const query = new QueryNodeApi(queryNodeProvider)

  const cli = new CliApi()

  const debug = extendDebug('scenario')

  const jobs = new JobManager({ apiFactory, query, env, cli })

  await scene({ env, debug, job: jobs.createJob.bind(jobs) })

  const resources = new ResourceManager()

  process.on('SIGINT', () => {
    console.error('Aborting scenario')
    writeOutput(api, miniSecret)
    process.exit(0)
  })

  let exitCode = 0

  try {
    await jobs.run(resources)
  } catch (err) {
    console.error(err)
    exitCode = -1
  }

  writeOutput(api, miniSecret)

  // Note: disconnecting and then reconnecting to the chain in the same process
  // doesn't seem to work!
  // Disconnecting is causing error to be thrown:
  // RPC-CORE: getStorage(key: StorageKey, at?: BlockHash): StorageData:: disconnected from ws://127.0.0.1:9944: 1000:: Normal connection closure
  // Are there subsciptions somewhere?
  // apiFactory.close()
  process.exit(exitCode)
}
