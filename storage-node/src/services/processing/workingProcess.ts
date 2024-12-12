import sleep from 'sleep-promise'
import logger from '../logger'

/**
 * Defines a task abstraction.
 */
export interface Task {
  /**
   * Returns human-friendly task description.
   */
  description(): string

  /**
   * Performs the task.
   */
  execute(): Promise<unknown>
}

/**
 * Defines task destination abstraction.
 */
export interface TaskSink {
  /**
   * Adds task array to the pending tasks collection.
   *
   * @param tasks tasks to add.
   */
  add(tasks: Task[]): Promise<void>
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
  get(): Promise<Task | null>

  /**
   * Allows checking whether the source is currently empty.
   *
   * @returns Emptiness status
   */
  isEmpty(): boolean
}

/**
 * Defines pending tasks collections. Implements LIFO semantics.
 */
export class WorkingStack implements TaskSink, TaskSource {
  workingStack: Task[]

  constructor() {
    this.workingStack = []
  }

  isEmpty(): boolean {
    return !this.workingStack.length
  }

  async get(): Promise<Task | null> {
    const task = this.workingStack.pop()

    if (task !== undefined) {
      return task
    } else {
      return null
    }
  }

  async add(tasks: Task[]): Promise<void> {
    // Avoid using:
    //     this.workingStack.push(...tasks)
    // When tasks array is very large, javasctipy call stack size might
    // be exceeded and push() will throw an exception.
    // This is pretty code:
    //      tasks.map((task) => this.workingStack.push(task))
    // ..but slow for large array.
    const len = tasks.length
    for (let i = 0; i < len; i++) {
      this.workingStack.push(tasks[i])
    }
  }
}

/**
 * Defines working process. It consumes and executes tasks from the pending
 * tasks source.
 */
export class TaskProcessor {
  taskSource: TaskSource
  exitOnCompletion: boolean
  sleepTime: number
  isIdle: boolean | null = null

  constructor(taskSource: TaskSource, exitOnCompletion = true, sleepTime = 3000) {
    this.taskSource = taskSource
    this.exitOnCompletion = exitOnCompletion
    this.sleepTime = sleepTime
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
      // To prevent race condition, set isIdle to null (unknown) until
      // async callback is executed after this.taskSource.get()
      this.isIdle = null
      const task = await this.taskSource.get()

      if (task !== null) {
        this.isIdle = false
        logger.debug(task.description())
        try {
          await task.execute()
        } catch (err) {
          // Catch the task failure to avoid the current process worker failing
          logger.warn(`task failed: ${err.message}`)
        }
      } else {
        this.isIdle = true
        if (this.exitOnCompletion) {
          return
        }

        await sleep(this.sleepTime)
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
  exitOnCompletion: boolean
  processors: TaskProcessor[]

  constructor(taskSource: TaskSource, processNumber: number, exitOnCompletion = true) {
    this.taskSource = taskSource
    this.processNumber = processNumber
    this.exitOnCompletion = exitOnCompletion
    this.processors = []
  }

  /**
   * Only returns true if:
   * - taskSource is empty
   * - all processors are idle
   */
  get isIdle(): boolean {
    return this.taskSource.isEmpty() && this.processors.every((p) => p.isIdle)
  }

  /**
   * Starts the task processor pack and waits for its completion.
   *
   * @returns empty promise
   */
  async process(): Promise<void> {
    const processes: Promise<void>[] = []
    for (let i = 0; i < this.processNumber; i++) {
      const processor = new TaskProcessor(this.taskSource, this.exitOnCompletion)
      this.processors.push(processor)
      processes.push(processor.process())
    }

    await Promise.allSettled(processes)
  }
}
