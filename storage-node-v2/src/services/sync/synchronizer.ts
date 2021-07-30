import { getRuntimeModel } from '../../services/sync/dataObjectsModel'
import _ from 'lodash'
import fs from 'fs'
import path from 'path'
import { pipeline } from 'stream'
import { promisify } from 'util'
import fetch from 'node-fetch'
import urljoin from 'url-join'
const fsPromises = fs.promises

export async function performSync(): Promise<void> {
  const queryNodeUrl = 'http://localhost:8081/graphql'
  const workerId = 1
  const uploadDirectory = '/Users/shamix/uploads'

  // const model = await getRuntimeModel(queryNodeUrl, workerId)
  // console.log(model)

  // const files = await getLocalFileNames(uploadDirectory)
  // console.log(files)

  const [model, files] = await Promise.all([
    getRuntimeModel(queryNodeUrl, workerId),
    getLocalFileNames(uploadDirectory),
  ])
  console.log(model)
  console.log(files)

  const requiredCids = model.dataObjects.map((obj) => obj.cid)

  const added = _.difference(requiredCids, files)
  const deleted = _.difference(files, requiredCids)

  console.log(`Added: ${added}`)
  console.log(`Deleted: ${deleted}`)

  const operatorUrl = 'http://localhost:3333/'

  await Promise.all(
    deleted.map((cid) => fsPromises.unlink(path.join(uploadDirectory, cid)))
  )

  await Promise.all(
    added.map((cid) =>
      download(
        urljoin(operatorUrl, 'api/v1/files', cid),
        path.join(uploadDirectory, cid)
      )
    )
  )
}

async function getLocalFileNames(directory: string): Promise<string[]> {
  return fsPromises.readdir(directory)
}

async function download(url: string, path: string): Promise<void> {
  console.log('Downloading url:' + url)

  const streamPipeline = promisify(pipeline)

  const response = await fetch(url)

  if (!response.ok)
    throw new Error(`Unexpected response ${response.statusText}`)

  // TODO: check for errors, both for response and filesystem
  await streamPipeline(response.body, fs.createWriteStream(path))
}
