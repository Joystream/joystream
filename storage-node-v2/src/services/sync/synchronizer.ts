import { getRuntimeModel, Model } from '../../services/sync/dataObjectsModel'
import { getAvailableData } from '../../services/sync/remoteData'
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

// TODO: use caching
export async function getLocalDataObjects(
  uploadDirectory: string
): Promise<string[]> {
  const localCids = await getLocalFileNames(uploadDirectory)

  return localCids
}

export async function performSync(
  workerId: number,
  syncWorkersNumber: number,
  queryNodeUrl: string,
  uploadDirectory: string,
  operatorUrl?: string
): Promise<void> {
  logger.info('Started syncing...')
  const [model, files] = await Promise.all([
    getRuntimeModel(queryNodeUrl, workerId),
    getLocalFileNames(uploadDirectory),
  ])

  const requiredCids = model.dataObjects.map((obj) => obj.cid)

  const added = _.difference(requiredCids, files)
  const deleted = _.difference(files, requiredCids)

  logger.debug(`Sync - added objects: ${added.length}`)
  logger.debug(`Sync - deleted objects: ${deleted.length}`)

  const workingStack = new WorkingStack()
  const deletedTasks = deleted.map(
    (fileName) => new DeleteLocalFileTask(uploadDirectory, fileName)
  )

  let addedTasks: SyncTask[]
  if (operatorUrl !== null) {
    addedTasks = await getPrepareDownloadTasks(
      model,
      added,
      uploadDirectory,
      workingStack
    )
  } else {
    addedTasks = await getDownloadTasks(operatorUrl, added, uploadDirectory)
  }

  logger.debug(`Sync - started processing...`)

  const processSpawner = new TaskProcessorSpawner(
    workingStack,
    syncWorkersNumber
  )

  await workingStack.add(addedTasks)
  await workingStack.add(deletedTasks)

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

    try {
      const response = await fetch(this.url, {
        timeout: 30 * 60 * 1000, // 30 min for large files (~ 10 GB)
      })

      if (response.ok) {
        await streamPipeline(response.body, fs.createWriteStream(this.filepath))
      } else {
        logger.error(
          `Sync - unexpected response for ${this.url}: ${response.statusText}`
        )
      }
    } catch (err) {
      logger.error(`Sync - fetching data error for ${this.url}: ${err}`)
      try {
        await fs.unlinkSync(this.filepath)
      } catch (err) {
        logger.error(
          `Sync - cannot cleanup file on failed download ${this.filepath}: ${err}`
        )
      }
    }
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

    for (let i = 0; i < this.processNumber; i++) {
      const processor = new TaskProcessor(this.taskSource)
      processes.push(processor.process())
    }

    await Promise.all(processes)
  }
}

class TaskProcessor {
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

async function getPrepareDownloadTasks(
  model: Model,
  addedCids: string[],
  uploadDirectory: string,
  taskSink: TaskSink
): Promise<PrepareDownloadFileTask[]> {
  const cidMap = new Map()
  for (const entry of model.dataObjects) {
    cidMap.set(entry.cid, entry.bagId)
  }

  const bucketMap = new Map()
  for (const entry of model.storageBuckets) {
    bucketMap.set(entry.id, entry.operatorUrl)
  }

  const bagMap = new Map()
  for (const entry of model.bags) {
    const operatorUrls = []

    for (const bucket of entry.buckets) {
      if (bucketMap.has(bucket)) {
        const operatorUrl = bucketMap.get(bucket)
        if (operatorUrl) {
          operatorUrls.push(operatorUrl)
        }
      }
    }

    bagMap.set(entry.id, operatorUrls)
  }

  const tasks = addedCids.map((cid) => {
    let operatorUrls: string[] = [] // can be empty after look up
    if (cidMap.has(cid)) {
      const bagid = cidMap.get(cid)
      if (bagMap.has(bagid)) {
        operatorUrls = bagMap.get(bagid)
      }
    }

    return new PrepareDownloadFileTask(
      operatorUrls,
      cid,
      uploadDirectory,
      taskSink
    )
  })

  return tasks
}

async function getDownloadTasks(
  operatorUrl: string,
  addedCids: string[],
  uploadDirectory: string
): Promise<DownloadFileTask[]> {
  const addedTasks = addedCids.map(
    (fileName) => new DownloadFileTask(operatorUrl, fileName, uploadDirectory)
  )

  return addedTasks
}

class PrepareDownloadFileTask implements SyncTask {
  cid: string
  operatorUrlCandidates: string[]
  taskSink: TaskSink
  uploadsDirectory: string

  constructor(
    operatorUrlCandidates: string[],
    cid: string,
    uploadsDirectory: string,
    taskSink: TaskSink
  ) {
    this.cid = cid
    this.taskSink = taskSink
    // TODO: remove heavy operation
    // Cloning is critical here. The list will be modified.
    this.operatorUrlCandidates = _.cloneDeep(operatorUrlCandidates)
    this.uploadsDirectory = uploadsDirectory
  }

  description(): string {
    return `Sync - preparing for download of: ${this.cid} ....`
  }

  async execute(): Promise<void> {
    while (!_.isEmpty(this.operatorUrlCandidates)) {
      const randomUrl = _.sample(this.operatorUrlCandidates)
      if (!randomUrl) {
        break // cannot get random URL
      }

      // Remove random url from the original list.
      _.remove(this.operatorUrlCandidates, (url) => url === randomUrl)

      try {
        const chosenBaseUrl = randomUrl
        const remoteOperatorCids: string[] = await getAvailableData(
          chosenBaseUrl
        )

        if (remoteOperatorCids.includes(this.cid)) {
          const newTask = new DownloadFileTask(
            chosenBaseUrl,
            this.cid,
            this.uploadsDirectory
          )

          return this.taskSink.add([newTask])
        }
      } catch (err) {
        logger.error(`Sync - fetching data error for ${this.cid}: ${err}`)
      }
    }

    logger.warn(`Sync - cannot get operator URLs for ${this.cid}`)
  }
}
