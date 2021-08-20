import AwaitLock from 'await-lock'
import sleep from 'sleep-promise'
import { SyncTask } from './tasks'
import logger from '../../services/logger'

export interface TaskSink {
  add(tasks: SyncTask[]): Promise<void>
}

export interface TaskSource {
  get(): Promise<SyncTask | null>
}

export class WorkingStack implements TaskSink, TaskSource {
  workingStack: SyncTask[]
  lock: AwaitLock

  constructor() {
    this.workingStack = []
    this.lock = new AwaitLock()
  }

  async get(): Promise<SyncTask | null> {
    await this.lock.acquireAsync()
    const task = this.workingStack.pop()
    this.lock.release()

    if (task !== undefined) {
      return task
    } else {
      return null
    }
  }

  async add(tasks: SyncTask[]): Promise<void> {
    await this.lock.acquireAsync()

    if (tasks !== null) {
      this.workingStack.push(...tasks)
    }
    this.lock.release()
  }
}

export class TaskProcessorSpawner {
  processNumber: number
  taskSource: TaskSource
  constructor(taskSource: TaskSource, processNumber: number) {
    this.taskSource = taskSource
    this.processNumber = processNumber
  }

  async process(): Promise<void> {
    const processes = []

    for (let i = 0; i < this.processNumber; i++) {
      const processor = new TaskProcessor(this.taskSource)
      processes.push(processor.process())
    }

    await Promise.all(processes)
  }
}

export class TaskProcessor {
  taskSource: TaskSource
  exitOnCompletion: boolean

  constructor(taskSource: TaskSource, exitOnCompletion = true) {
    this.taskSource = taskSource
    this.exitOnCompletion = exitOnCompletion
  }

  async process(): Promise<void> {
    while (true) {
      const task = await this.taskSource.get()

      if (task !== null) {
        logger.debug(task.description())
        await task.execute()
      } else {
        if (this.exitOnCompletion) {
          return
        }

        await sleep(3000)
      }
    }
  }
}
