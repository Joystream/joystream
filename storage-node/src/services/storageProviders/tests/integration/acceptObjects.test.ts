import { beforeAll, afterAll, describe, it, jest } from '@jest/globals'
import { AcceptPendingObjectsService } from '../../../sync/acceptPendingObjects'

jest.mock('../../../../commands/server')
jest.mock('../../../../services/caching/localDataObjects')
AcceptPendingObjectsService.prototype.runWithInterval = jest.fn()

import { expect } from 'chai'
import { QueryNodeApi } from '../../../queryNode/api'
import { KeyringPair } from '@polkadot/keyring/types'
import * as fs from 'fs'
import { ApiPromise } from '@polkadot/api'
import { assert } from 'console'

const WORKER_ID = 1
const UPLOAD_DIRECTORY = __dirname + '/uploads'
const PENDING_DIRECTORY = __dirname + '/pending'
const UPLOAD_BUCKETS = ['bucket1']
const MAX_BATCH_SIZE = 10
const INTERVAL_MS = 1000
const FILENAME = 'test'
const FILE_SIZE_BYTES = 5 * 1024 * 1024 // 5MB

async function createMockAcceptPendingObjectsService() {
  return await AcceptPendingObjectsService.create(
    {} as ApiPromise,
    {} as QueryNodeApi,
    WORKER_ID,
    UPLOAD_DIRECTORY,
    PENDING_DIRECTORY,
    {} as Map<string, KeyringPair>,
    UPLOAD_BUCKETS,
    MAX_BATCH_SIZE,
    INTERVAL_MS
  )
}

describe('AcceptPendingObjectsService', () => {
  beforeAll(() => {
    if (!fs.existsSync(UPLOAD_DIRECTORY)) {
      fs.mkdirSync(UPLOAD_DIRECTORY)
    }
    if (!fs.existsSync(PENDING_DIRECTORY)) {
      fs.mkdirSync(PENDING_DIRECTORY)
    }

    const filePath = PENDING_DIRECTORY + '/' + FILENAME
    const fileContent = 'A'.repeat(FILE_SIZE_BYTES)

    fs.writeFileSync(filePath, fileContent)
    assert(fs.existsSync(filePath))
  })
  afterAll(() => {
    if (fs.existsSync(UPLOAD_DIRECTORY)) {
      fs.rmSync(UPLOAD_DIRECTORY, { recursive: true, force: true })
    }
    if (fs.existsSync(PENDING_DIRECTORY)) {
      fs.rmSync(PENDING_DIRECTORY, { recursive: true, force: true })
    }
  })

  describe('moveToAcceptedLocation', () => {
    it('should move the data object to the accepted location to remote cloud', async () => {
      // Create a mock instance of AcceptPendingObjectsService
      const service = await createMockAcceptPendingObjectsService()
      /* mock dependencies here */

      // Define the input parameters
      const dataObjectId = FILENAME

      // Call the method
      await service.moveToAcceptedLocation(dataObjectId)

      // Assert the expected behavior
      // Add your assertions here
    })

    it('should handle errors gracefully', async () => {
      // Create a mock instance of AcceptPendingObjectsService
      const service = await createMockAcceptPendingObjectsService()
      /* mock dependencies here */

      // Define the input parameters
      const dataObjectId = FILENAME

      // Call the method
      try {
        await service.moveToAcceptedLocation(dataObjectId)
        // Assert that the method throws an error
        expect.fail('Expected an error to be thrown')
      } catch (error) {
        // Assert the expected error message or behavior
        // Add your assertions here
      }
    })
  })
})
