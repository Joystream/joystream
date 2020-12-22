import Debugger from 'debug'
import { EventEmitter } from 'events'

import { Flow, FlowArgs } from './Flow'

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

export enum JobOutcome {
  Succeeded = 'Succeeded',
  Failed = 'Failed',
  Skipped = 'Skipped',
}

export class Job {
  private _required: Job[] = []
  private _after: Job[] = []
  private _locked = false
  private readonly _flows: Flow[]
  private readonly _manager: EventEmitter
  private readonly _outcome: InvertedPromise<JobOutcome>
  private readonly _label: string
  private readonly debug: Debugger.Debugger

  constructor(manager: EventEmitter, flows: Flow[], label: string) {
    this._label = label
    this._manager = manager
    this._flows = flows
    this._outcome = new InvertedPromise<JobOutcome>()
    this._manager.on('run', this.run.bind(this))
    this.debug = Debugger(`job:${this._label}`)
  }

  // Depend on another job to complete successfully
  public requires(job: Job): Job {
    if (this._locked) throw new Error('Job is locked')
    if (job === this) throw new Error('Job Cannot depend on itself')
    if (job.hasDependencyOn(this)) {
      throw new Error('Job Circualr dependency')
    }
    this._required.push(job)
    return this
  }

  // Depend on another job to complete (does not matter if it is successful)
  public after(job: Job): Job {
    if (this._locked) throw new Error('Job is locked')
    if (job === this) throw new Error('Job Cannot depend on itself')
    if (job.hasDependencyOn(this)) {
      throw new Error('Job Circualr dependency')
    }
    this._after.push(job)
    return this
  }

  public then(job: Job): Job {
    job.requires(this)
    return job
  }

  public hasDependencyOn(job: Job): boolean {
    return !!this._required.find((j) => j === job) || !!this._after.find((j) => j === job)
  }

  // configure to have flows run serially instead of in parallel
  // public serially(): Job {
  //   return this
  // }

  get outcome(): Promise<JobOutcome> {
    return this._outcome.promise
  }

  get label(): string {
    return this._label
  }

  private async run(flowArgs: FlowArgs): Promise<void> {
    // prevent any additional changes to configuration
    this._locked = true

    // wait for all required dependencies to complete successfully
    const requiredOutcomes = await Promise.all(this._required.map((job) => job.outcome))
    if (requiredOutcomes.find((outcome) => outcome !== JobOutcome.Succeeded)) {
      this.debug('[Skipping] - Required jobs not successful!')
      return this._outcome.resolve(JobOutcome.Skipped)
    }

    // Wait for other jobs to complete, irrespective of outcome
    await Promise.all(this._after.map((job) => job.outcome))

    this.debug('Running')
    const flowRunResults = await Promise.allSettled(this._flows.map((flow) => flow(flowArgs)))

    flowRunResults.forEach((result, ix) => {
      if (result.status === 'rejected') {
        this.debug(`flow ${ix} failed:`)
        console.error(result.reason)
      }
    })

    if (flowRunResults.find((result) => result.status === 'rejected')) {
      this.debug('[Failed]')
      this._outcome.resolve(JobOutcome.Failed)
    } else {
      this.debug('[Succeeded]')
      this._outcome.resolve(JobOutcome.Succeeded)
    }
  }
}
