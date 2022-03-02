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
import fs, { existsSync, readFileSync } from 'fs'
import { KeyGenInfo } from './types'

export type ScenarioProps = {
  env: NodeJS.ProcessEnv
  debug: Debugger.Debugger
  job: (label: string, flows: Flow[] | Flow) => Job
}

const OUTPUT_FILE_PATH = 'output.json'

type TestsOutput = {
  accounts: { [k: string]: number }
  keyIds: KeyGenInfo
  miniSecret: string
}

function writeOutput(api: Api, miniSecret: string) {
  console.error('Writing generated account to', OUTPUT_FILE_PATH)
  // account to key ids
  const accounts = api.getAllGeneratedAccounts()

  // first and last key id used to generate keys in this scenario
  const keyIds = api.keyGenInfo()

  const output: TestsOutput = {
    accounts,
    keyIds,
    miniSecret,
  }

  fs.writeFileSync(OUTPUT_FILE_PATH, JSON.stringify(output, undefined, 2))
}

export async function scenario(label: string, scene: (props: ScenarioProps) => Promise<void>): Promise<void> {
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

  // Generate all key ids based on REUSE_KEYS or START_KEY_ID (if provided)
  const reuseKeys = Boolean(env.REUSE_KEYS)
  let startKeyId: number
  let customKeys: string[] = []
  if (reuseKeys && existsSync(OUTPUT_FILE_PATH)) {
    const output = JSON.parse(readFileSync(OUTPUT_FILE_PATH).toString()) as TestsOutput
    startKeyId = output.keyIds.final
    customKeys = output.keyIds.custom
  } else {
    startKeyId = parseInt(env.START_KEY_ID || '0')
  }

  await api.createKeyPairs(startKeyId, false)
  customKeys.forEach((k) => api.createCustomKeyPair(k))

  const queryNodeUrl: string = env.QUERY_NODE_URL || 'http://127.0.0.1:8081/graphql'

  const queryNodeProvider = new ApolloClient({
    link: new HttpLink({ uri: queryNodeUrl, fetch }),
    cache: new InMemoryCache(),
    defaultOptions: { query: { fetchPolicy: 'no-cache', errorPolicy: 'all' } },
  })

  const query = new QueryNodeApi(queryNodeProvider)

  const debug = extendDebug('scenario')

  debug(label)

  const jobs = new JobManager({ apiFactory, query, env })

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
