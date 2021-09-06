#!/usr/bin/env ts-node

import fs from 'fs'
import path from 'path'
const fsPromises = fs.promises
import { Client, ClientConfig,QueryResult } from 'pg'
import { exit } from 'process'

async function doJob(): Promise<void> {
  const uploadDirectory = '/Users/shamix/uploads5'
  const fileSize = 1000

  const objectNumber = 10000
  const bagNumber = 10
  const bucketNumber = 10

  const urls = [
    `http://localhost:3333/`,
    `http://localhost:3334/`,
    `http://localhost:3335/`,
  ]

  const updateDb = false
  const generateFiles = true

  if (updateDb) {
    const config : ClientConfig = {
      user: 'postgres',
      password: 'postgres',
      database: 'query_node_processor',
      host: 'localhost'
    }
    const client = new Client(config)
    await client.connect()

    // Cleanup
    await client.query('TRUNCATE storage_data_object')
    await client.query('TRUNCATE storage_bucket CASCADE')
    await client.query('TRUNCATE storage_bag CASCADE')
    await client.query('TRUNCATE storage_bag_storage_bucket')
  
    // Generate objects
    await createBags(client, bagNumber)
    await createBuckets(client, bucketNumber)
    await createBagBucketLinks(client)
    await createBucketWorkerLinks(client)
    await createBucketOperatorUrls(client, urls)
    const dbTasks = createDataObjects(client, objectNumber)
    await Promise.all(dbTasks)

    await client.end()
  }
  
  if (generateFiles) {
    await createFiles(uploadDirectory, fileSize, objectNumber)
  }
}

function createDataObjects(client: Client, objectNumber: number): Promise<QueryResult<any>>[] {
  const tasks: any[] = []

  const bagId = '1'
  for(let i: number = 1; i <= objectNumber; i++){
    const name = i.toString()

    console.log(`Writing ${i} data object...`)

    const dbTask = client.query(
      `INSERT INTO storage_data_object(storage_bag_id, ipfs_hash, id, created_by_id, version, is_accepted, size) 
       values(${bagId}, ${name}, ${name}, 'some', '1', true, 100)`
    )

    tasks.push(dbTask)
  }

  return tasks
}

async function createFiles(uploadDirectory: string, fileSize: number, objectNumber: number): Promise<void> {
  const data = new Uint8Array(fileSize)
  let tasks: any[] = []
  for(let i: number = 1; i <= objectNumber; i++){
    const name = i.toString()

    console.log(`Writing ${i} file...`)

    const fileTask = fsPromises.writeFile(
      path.join(uploadDirectory, name), 
      data
    )

    tasks.push(fileTask)

    if (i % 100 === 0){
      await Promise.all(tasks)
      tasks.length = 0
    }
  }

  if (tasks.length > 0) {
    await Promise.all(tasks)
  }
}

async function createBags(client: Client, bagNumber: number): Promise<void> {
  for(let i: number = 1; i <= bagNumber; i++){
    const name = i.toString()

    console.log(`Writing ${i} bag...`)

    await client.query(
      `INSERT INTO storage_bag(id, created_by_id, version, owner) 
       values(${name}, 'some', '1',  '{}')`
    )
  }
}

async function createBuckets(client: Client, bucketNumber: number): Promise<void> {
  const missingWorkerId = `{"isTypeOf": "StorageBucketOperatorStatusMissing"}`
  for(let i: number = 1; i <= bucketNumber; i++){
    const name = i.toString()

    console.log(`Writing ${i} bucket...`)

    await client.query(
      `INSERT INTO storage_bucket(id, created_by_id, version, operator_status, accepting_new_bags, data_objects_size_limit,data_object_count_limit) 
       values(${name}, 'some', '1',  '${missingWorkerId}', true, 100000000, 100000000)`
    )
  }
}


async function createBagBucketLinks(client: Client): Promise<void> {
    console.log(`Writing bag to bucket links...`)

    // Bucket1 to Bag1
    await client.query(
      `INSERT INTO storage_bag_storage_bucket(storage_bag_id, storage_bucket_id) 
       values('1', '1')`
    )
    // Bucket2 to Bag1
    await client.query(
      `INSERT INTO storage_bag_storage_bucket(storage_bag_id, storage_bucket_id) 
       values('1', '2')`
    )    
    // Bucket3 to Bag1
    await client.query(
      `INSERT INTO storage_bag_storage_bucket(storage_bag_id, storage_bucket_id) 
       values('1', '3')`
    )
}

async function createBucketWorkerLinks(client: Client): Promise<void> {
    console.log(`Writing bucket worker links...`)

    const assignedWorker0 = `{"isTypeOf": "StorageBucketOperatorStatusActive", "workerId": 0}`
    const assignedWorker1 = `{"isTypeOf": "StorageBucketOperatorStatusActive", "workerId": 1}`
    const assignedWorker2 = `{"isTypeOf": "StorageBucketOperatorStatusActive", "workerId": 2}`

    // Bucket1 to Worker0
    await client.query(
      `UPDATE storage_bucket
       SET operator_status = '${assignedWorker0}'
       WHERE id = '1'`
    )
    // Bucket2 to Worker1
    await client.query(
      `UPDATE storage_bucket
       SET operator_status = '${assignedWorker1}'
       WHERE id = '2'`
    )   
     // Bucket3 to Worker2
    await client.query(
      `UPDATE storage_bucket
       SET operator_status = '${assignedWorker2}'
       WHERE id = '3'`
    )
}

async function createBucketOperatorUrls(client: Client, urls: string[]): Promise<void> {
    console.log(`Writing bucket operator URLs...`)

    for (let i = 0; i < urls.length; i++) {
      const bucketId = i + 1
      const metadata = urls[i]

      await client.query(
        `UPDATE storage_bucket
         SET operator_metadata = '${metadata}'
         WHERE id = '${bucketId}'`
      )
    }
}

doJob().then(() => {
  console.log('Done')
}).catch((err) => {
  console.log(err)
  exit(1)
})
