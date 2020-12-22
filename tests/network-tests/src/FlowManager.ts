import { EventEmitter } from 'events'
import { Flow, FlowArgs } from './Flow'
import { Job, JobOutcome } from './Job'

export class FlowManager extends EventEmitter {
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
