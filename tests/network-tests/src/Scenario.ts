import { WsProvider } from '@polkadot/api'
import { Api } from './Api'
import { QueryNodeApi } from './QueryNodeApi'
import { config } from 'dotenv'
import { ApolloClient, InMemoryCache } from '@apollo/client'
import Debugger from 'debug'
import { EventEmitter } from 'events'

function noop() {
  // No-Op
}

class InvertedPromise<T> {
  public resolve: (value: T) => void = noop
  public reject: (reason?: any) => void = noop
  public readonly promise: Promise<T>

  constructor() {
    this.promise = new Promise((resolve, reject) => {
      this.resolve = resolve
      this.reject = reject
    })
  }
}

export type FlowArgs = { api: Api; env: NodeJS.ProcessEnv; query: QueryNodeApi }
export type Flow = (args: FlowArgs) => Promise<void>

enum JobOutcome {
  Succeeded,
  Failed,
  Skipped,
}

class Job {
  private required: Job[] = []
  private dependencies: Job[] = []
  private flows: Flow[]
  private manager: FlowManager
  private _outcome: InvertedPromise<JobOutcome>
  private locked = false
  private name: string
  private debug: Debugger.Debugger

  constructor(manager: FlowManager, flows: Flow[], name: string) {
    this.name = name
    this.manager = manager
    this.flows = flows
    this._outcome = new InvertedPromise<JobOutcome>()
    this.manager.on('run', this.run.bind(this))
    this.debug = Debugger(`job:${this.name}`)
  }

  // Depend on another job to complete successfully
  public requires(job: Job): Job {
    if (this.locked) throw new Error('Job is locked')
    if (job === this) throw new Error('Job Cannot depend on itself')
    if (job.hasDependencyOn(this)) {
      throw new Error('Job Circualr dependency')
    }
    this.required.push(job)
    return this
  }

  // Depend on another job to complete (does not matter if it is successful)
  public after(job: Job): Job {
    if (this.locked) throw new Error('Job is locked')
    if (job === this) throw new Error('Job Cannot depend on itself')
    if (job.hasDependencyOn(this)) {
      throw new Error('Job Circualr dependency')
    }
    this.dependencies.push(job)
    return this
  }

  public then(job: Job): Job {
    job.requires(this)
    return job
  }

  public hasDependencyOn(job: Job): boolean {
    return !!this.required.find((j) => j === job) || !!this.dependencies.find((j) => j === job)
  }

  // configure to have flows run serially instead of in parallel
  // public serially(): Job {
  //   return this
  // }

  get outcome(): Promise<JobOutcome> {
    return this._outcome.promise
  }

  private async run(flowArgs: FlowArgs): Promise<void> {
    // prevent any additional changes to configuration
    this.locked = true

    // wait for all required dependencies to complete successfully
    const requiredOutcomes = await Promise.all(this.required.map((job) => job.outcome))
    if (requiredOutcomes.find((outcome) => outcome !== JobOutcome.Succeeded)) {
      this.debug('Skipped because required jobs not successful')
      return this._outcome.resolve(JobOutcome.Skipped)
    }

    // Wait for other jobs to complete, irrespective of outcome
    await Promise.all(this.dependencies.map((job) => job.outcome))

    this.debug('Running flows')
    const flowRunResults = await Promise.allSettled(this.flows.map((flow) => flow(flowArgs)))
    this.debug('Flow run complete')

    if (flowRunResults.find((result) => result.status === 'rejected')) {
      this.debug('Failed')
      this._outcome.resolve(JobOutcome.Failed)
    } else {
      this.debug('Succeeded')
      this._outcome.resolve(JobOutcome.Succeeded)
    }
  }
}

class FlowManager extends EventEmitter {
  private readonly flowArgs: FlowArgs
  private _jobs: Job[] = []

  constructor(flowArgs: FlowArgs) {
    super()
    this.flowArgs = flowArgs
  }

  public createJob(label: string, flows: Flow[] | Flow): Job {
    const arrFlows: Array<Flow> = []
    const job = new Job(this, arrFlows.concat(flows), label)

    this._jobs.push(job)

    return job
  }

  public async run(): Promise<void> {
    this.emit('run', this.flowArgs)

    const jobOutcomes = await Promise.all(this._jobs.map((job) => job.outcome))

    const someJobDidNotSucceed = jobOutcomes.find((outcome) => outcome !== JobOutcome.Succeeded)
    if (someJobDidNotSucceed) {
      throw new Error('Some jobs failed or skipped')
    }
  }
}

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
