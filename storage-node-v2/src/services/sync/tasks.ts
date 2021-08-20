import fs from 'fs'
import path from 'path'
import { pipeline } from 'stream'
import { promisify } from 'util'
import superagent from 'superagent'
import urljoin from 'url-join'
import { v4 as uuidv4 } from 'uuid'
import logger from '../../services/logger'
import { getAvailableData } from './remoteStorageData'
import { TaskSink } from './workingProcess'
import _ from 'lodash'

const fsPromises = fs.promises

export interface SyncTask {
  description(): string
  execute(): Promise<void>
}

export class DeleteLocalFileTask implements SyncTask {
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

export class DownloadFileTask implements SyncTask {
  id: string
  uploadsDirectory: string
  url: string

  constructor(baseUrl: string, id: string, uploadsDirectory: string) {
    this.id = id
    this.uploadsDirectory = uploadsDirectory
    this.url = urljoin(baseUrl, 'api/v1/files', id)
  }

  description(): string {
    return `Sync - downloading file: ${this.url} to ${this.uploadsDirectory} ....`
  }

  async execute(): Promise<void> {
    const streamPipeline = promisify(pipeline)
    const filepath = path.join(this.uploadsDirectory, this.id)

    try {
      const timeoutMs = 30 * 60 * 1000 // 30 min for large files (~ 10 GB)
      // Casting because of:
      // https://stackoverflow.com/questions/38478034/pipe-superagent-response-to-express-response
      const request = superagent
        .get(this.url)
        .timeout(timeoutMs) as unknown as NodeJS.ReadableStream

      // We create tempfile first to mitigate partial downloads on app (or remote node) crash.
      // This partial downloads will be cleaned up during the next sync iteration.
      const tempFilePath = path.join(this.uploadsDirectory, uuidv4())
      const fileStream = fs.createWriteStream(tempFilePath)
      await streamPipeline(request, fileStream)

      await fsPromises.rename(tempFilePath, filepath)
    } catch (err) {
      logger.error(`Sync - fetching data error for ${this.url}: ${err}`)
      try {
        logger.warn(`Cleaning up file ${filepath}`)
        await fs.unlinkSync(filepath)
      } catch (err) {
        logger.error(`Sync - cannot cleanup file ${filepath}: ${err}`)
      }
    }
  }
}

export class PrepareDownloadFileTask implements SyncTask {
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
