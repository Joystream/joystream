import { getRuntimeModel } from '../../services/sync/dataObjectsModel'
import logger from '../../services/logger'
import _ from 'lodash'
import fs from 'fs'
import path from 'path'
import { pipeline } from 'stream'
import { promisify } from 'util'
import fetch from 'node-fetch'
import urljoin from 'url-join'
import AwaitLock from 'await-lock'
import sleep from 'sleep-promise'
const fsPromises = fs.promises

export async function performSync(): Promise<void> {
  const queryNodeUrl = 'http://localhost:8081/graphql'
  const workerId = 1
  const processNumber = 30
  const uploadDirectory = '/Users/shamix/uploads'
  const operatorUrl = 'http://localhost:3333/'

  logger.info('Started syncing...')
  const [model, files] = await Promise.all([
    getRuntimeModel(queryNodeUrl, workerId),
    getLocalFileNames(uploadDirectory),
  ])
  // console.log(model)
  // console.log(files)

  const requiredCids = model.dataObjects.map((obj) => obj.cid)

  const added = _.difference(requiredCids, files)
  const deleted = _.difference(files, requiredCids)

  logger.debug(`Sync - added objects: ${added.length}`)
  logger.debug(`Sync - deleted objects: ${deleted.length}`)

  const deletedTasks = deleted.map(
    (fileName) => new DeleteLocalFileTask(uploadDirectory, fileName)
  )
  const addedTasks = added.map(
    (fileName) => new DownloadFileTask(operatorUrl, fileName, uploadDirectory)
  )

  logger.debug(`Sync - started processing...`)
  const workingStack = new WorkingStack()
  const processSpawner = new TaskProcessorSpawner(workingStack, processNumber)

  workingStack.add(deletedTasks)
  workingStack.add(addedTasks)

  await processSpawner.process()
  logger.info('Sync ended.')
}

async function getLocalFileNames(directory: string): Promise<string[]> {
  return fsPromises.readdir(directory)
}

interface SyncTask {
  description(): string
  execute(): Promise<void>
}

class DeleteLocalFileTask implements SyncTask {
  uploadsDirectory: string
  filename: string

  constructor(uploadsDirectory: string, filename: string) {
    this.uploadsDirectory = uploadsDirectory
    this.filename = filename
  }

  description(): string {
    return `Sync - deleting local file: ${this.filename} ....`
  }

  async execute(): Promise<void> {
    const fullPath = path.join(this.uploadsDirectory, this.filename)
    return fsPromises.unlink(fullPath)
  }
}

class DownloadFileTask implements SyncTask {
  filepath: string
  url: string

  constructor(baseUrl: string, filename: string, uploadsDirectory: string) {
    this.filepath = path.join(uploadsDirectory, filename)
    this.url = urljoin(baseUrl, 'api/v1/files', filename)
  }

  description(): string {
    return `Sync - downloading file: ${this.url} as ${this.filepath} ....`
  }

  async execute(): Promise<void> {
    const streamPipeline = promisify(pipeline)

    const response = await fetch(this.url)

    if (!response.ok)
      throw new Error(`Unexpected response ${response.statusText}`)

    // TODO: check for errors, both for response and filesystem
    await streamPipeline(response.body, fs.createWriteStream(this.filepath))
  }
}

interface TaskSink {
  add(tasks: SyncTask[]): Promise<void>
}

interface TaskSource {
  get(): Promise<SyncTask | null>
}

class WorkingStack implements TaskSink, TaskSource {
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

class TaskProcessorSpawner {
  processNumber: number
  taskSource: TaskSource
  constructor(taskSource: TaskSource, processNumber: number) {
    this.taskSource = taskSource
    this.processNumber = processNumber
  }

  async process(): Promise<void> {
    const processes = []

    for (let i: number = 0; i < this.processNumber; i++) {
      const processor = new TaskProcessor(this.taskSource)
      processes.push(processor.process())
    }

    await Promise.all(processes)
  }
}

class TaskProcessor {
  taskSource: TaskSource
  exitOnCompletion: boolean

  constructor(taskSource: TaskSource, exitOnCompletion: boolean = true) {
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
