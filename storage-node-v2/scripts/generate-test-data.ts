#!/usr/bin/env ts-node

import fs from 'fs'
import path from 'path'
const fsPromises = fs.promises
import { Client, ClientConfig } from 'pg'
import { exit } from 'process'

async function doJob(): Promise<void> {
  const uploadDirectory = '/Users/shamix/uploads2'
  const objectNumber = 100

  const config : ClientConfig = {
    user: 'postgres',
    password: 'postgres',
    database: 'query_node_processor'
  }
  const client = new Client(config)
  await client.connect()
  await client.query('TRUNCATE storage_data_object')
  
  const data = new Uint8Array(100000000)
  const tasks: any[] = []
  for(let i: number = 1; i <= objectNumber; i++){
    const name = i.toString()

    console.log(`Writing ${i} data object...`)

    const fileTask = fsPromises.writeFile(
      path.join(uploadDirectory, name), 
      data
      //Buffer.from(name, 'utf8')
    )

    const dbTask = client.query(
      `INSERT INTO storage_data_object(storage_bag_id, ipfs_hash, id, created_by_id, version, is_accepted, size) 
       values('CO', ${name}, ${name}, 'some', '1', false, 100)`
    )

    tasks.push(dbTask)
    tasks.push(fileTask)
  }

  await Promise.all(tasks)

  await client.end()
}

doJob().then(() => {
  console.log('Done')
}).catch((err) => {
  console.log(err)
  exit(1)
})
