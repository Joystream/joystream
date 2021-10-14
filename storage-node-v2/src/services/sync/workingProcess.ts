import AwaitLock from 'await-lock'
import sleep from 'sleep-promise'
import { SyncTask } from './tasks'
import logger from '../../services/logger'

/**
 * Defines task destination abstraction.
 */
export interface TaskSink {
  /**
   * Adds task array to the pending tasks collection.
   *
   * @param tasks tasks to add.
   */
  add(tasks: SyncTask[]): Promise<void>
}

/**
 * Defines task source abstraction.
 */
export interface TaskSource {
  /**
   * Gets the next task from the pending tasks collection.
   *
   * @returns next task or null if empty.
   */
  get(): Promise<SyncTask | null>
}

/**
 * Defines pending tasks collections. Implements LIFO semantics.
 */
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

/**
 * Defines working process. It consumes and executes tasks from the pending
 * tasks source.
 */
export class TaskProcessor {
  taskSource: TaskSource
  exitOnCompletion: boolean

  constructor(taskSource: TaskSource, exitOnCompletion = true) {
    this.taskSource = taskSource
    this.exitOnCompletion = exitOnCompletion
  }

  /**
   * Starts the task processor that pick tasks one by one from the pending task
   * collection and executes them. It exits on empty task source or pauses
   * depending on the configuration.
   *
   * @returns empty promise
   */
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

/**
 * Manages task processors pack. Runs multiple instances and waits for their
 * execution.
 */
export class TaskProcessorSpawner {
  processNumber: number
  taskSource: TaskSource
  constructor(taskSource: TaskSource, processNumber: number) {
    this.taskSource = taskSource
    this.processNumber = processNumber
  }

  /**
   * Starts the task processor pack and waits for its completion.
   *
   * @returns empty promise
   */
  async process(): Promise<void> {
    const processes = []

    for (let i = 0; i < this.processNumber; i++) {
      const processor = new TaskProcessor(this.taskSource)
      processes.push(processor.process())
    }

    await Promise.all(processes)
  }
}
