import { createDBConnection } from '@dzlzv/hydra-processor/lib/db'
import { DatabaseManager, makeDatabaseManager } from '@dzlzv/hydra-db-utils'
import { Connection, getManager } from 'typeorm'

import { bootMembers, IBootstrapMember } from './members';
import { bootWorkers, IBootstrapWorker, IBootstrapWorkers } from './workers';
import { Worker, WorkerType } from 'query-node'
import { FindConditions } from 'typeorm'
import fs from 'fs'
import path from 'path'


init()

async function init() {
    const [databaseManager, connection] = await createDatabaseManager()
    const data = loadData()

    if (await isDbInitialized(databaseManager)) {
        await connection.close()
        return
    }

    await bootMembers(databaseManager, data.members)
    await bootWorkers(databaseManager, data.workers)

    await connection.close()
}

async function isDbInitialized(db: DatabaseManager): Promise<boolean> {
    // simple way to check if db is bootstrapped already - check if there is at least 1 storage provider
    const membership = await db.get(Worker, {
        where: {
          type: WorkerType.STORAGE,
        } as FindConditions<Worker>
    })

    return !!membership
}


//async function createDatabaseManager(): Promise<DatabaseManager> {
async function createDatabaseManager(): Promise<[DatabaseManager, Connection]> {
    // paths in `entities` should be the same as `entities` set in `manifest.yml`
    const entities = [
        'generated/graphql-server/dist/**/*.model.js'
    ]

    const connection = await createDBConnection(entities)
    const entityManager = getManager(connection.name)
    const databaseManager = makeDatabaseManager(entityManager)

    return [databaseManager, connection]
}

interface IBootstrapData {
    members: IBootstrapMember[]
    workers: IBootstrapWorkers
}

function loadData(): IBootstrapData {
    return {
        members: JSON.parse(fs.readFileSync(process.env.BOOTSTRAP_DATA_FOLDER + '/members.json').toString()),
        workers: JSON.parse(fs.readFileSync(process.env.BOOTSTRAP_DATA_FOLDER + '/workers.json').toString()),
    }
}
