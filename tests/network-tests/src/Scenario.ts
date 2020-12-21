import { WsProvider } from '@polkadot/api'
import { Api } from './Api'
import { QueryNodeApi } from './QueryNodeApi'
import { config } from 'dotenv'
import { ApolloClient, InMemoryCache } from '@apollo/client'
import Debugger from 'debug'

export type FlowArgs = { api: Api; env: NodeJS.ProcessEnv; query: QueryNodeApi }
export type Flow = (args: FlowArgs) => Promise<void>

class Job {
  private dependencies: Job[]
  private flowArgs: FlowArgs
  private flows: Flow[]
  private manager: FlowManager

  constructor(manager: FlowManager, flowArgs: FlowArgs, flows: Flow[]) {
    this.manager = manager
    this.flowArgs = flowArgs
    this.flows = flows
  }

  // Depend on another job to complete
  public afterSuccessOf(job: Job): Job {
    this.dependencies.push(job)
    return this
  }

  // Depend on another job to complete
  public afterSuccessOrFailureOf(job: Job): Job {
    this.dependencies.push(job)
    return this
  }

  // Allows job to fail (one or more flows failing) without interrupting the scenario
  // The scenario will still result in failure, but allows other jobs and flows to be tested
  public allowFailure(): Job {
    return this
  }

  // configure to have flows run serially instead of in parallel
  public serially(): Job {
    return this
  }
}

class FlowManager {
  private readonly flowArgs: FlowArgs
  private pendingJobs: Job[]
  private completedJobs: Job[]

  constructor(flowArgs: FlowArgs) {
    this.flowArgs = flowArgs
  }

  public createJob(flows: Flow[]): Job {
    const job = new Job(this, this.flowArgs, flows)

    this.pendingJobs.push(job)

    // TODO: return a limited interface only for configuring job before it runs
    return job
  }

  // Run the jobs in parallel where possible, followed by their dependents
  public async run(): Promise<void> {
    
  }
}

export async function scenario(
  fn: (cfg: {
    api: Api
    query: QueryNodeApi
    env: NodeJS.ProcessEnv
    debug: Debugger.Debugger
    job: (flows: Flow[]) => Job
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

  await flowManager.run()

  // Note: disconnecting and then reconnecting to the chain in the same process
  // doesn't seem to work!
  api.close()
}
