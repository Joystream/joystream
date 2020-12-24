import { EventEmitter } from 'events'
import { Flow } from './Flow'
import { Job, JobOutcome } from './Job'
import { ApiFactory } from './Api'
import { QueryNodeApi } from './QueryNodeApi'

export class JobManager extends EventEmitter {
  private _jobs: Job[] = []
  private readonly _apiFactory: ApiFactory
  private readonly _env: NodeJS.ProcessEnv
  private readonly _query: QueryNodeApi

  constructor({ apiFactory, env, query }: { apiFactory: ApiFactory; env: NodeJS.ProcessEnv; query: QueryNodeApi }) {
    super()
    this._apiFactory = apiFactory
    this._env = env
    this._query = query
  }

  public createJob(label: string, flows: Flow[] | Flow): Job {
    const arrFlows: Array<Flow> = []
    const job = new Job(this, arrFlows.concat(flows), label)

    this._jobs.push(job)

    return job
  }

  private getJobProps() {
    return {
      env: this._env,
      query: this._query,
      apiFactory: this._apiFactory,
    }
  }

  public async run(): Promise<void> {
    this.emit('run', this.getJobProps())

    const outcomes = await Promise.all(this._jobs.map((job) => job.outcome))

    // summary of job results
    console.error('Job Results:')
    outcomes.forEach((outcome, i) => {
      const { label } = this._jobs[i]
      console.error(`${label}: ${outcome}`)
    })

    const failed = outcomes.find((outcome) => outcome !== JobOutcome.Succeeded)
    if (failed) {
      throw new Error('Scenario Failed')
    }
  }
}
