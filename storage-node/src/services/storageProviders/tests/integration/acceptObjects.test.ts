import { expect, describe, it, jest, beforeAll } from '@jest/globals'
import { AcceptPendingObjectsService } from '../../../sync/acceptPendingObjects'
import { QueryNodeApi } from '../../../queryNode/api'
import { KeyringPair } from '@polkadot/keyring/types'
import { ApiPromise } from '@polkadot/api'
import { isStorageProviderConnectionEnabled, getStorageProviderConnection } from '../../../../commands/server'
import { IConnectionHandler } from '../../IConnectionHandler'
import { addDataObjectIdToCache } from '../../../../services/caching/localDataObjects'
import { registerNewDataObjectId } from '../../../../services/caching/newUploads'
import { unlink, access, copyFile } from 'fs/promises'

const WORKER_ID = 1
const UPLOAD_DIRECTORY = __dirname + '/uploads'
const PENDING_DIRECTORY = __dirname + '/pending'
const UPLOAD_BUCKETS = ['bucket1']
const MAX_BATCH_SIZE = 10
const INTERVAL_MS = 1000
const FILENAME = 'test'
// const FILE_SIZE_BYTES = 5 * 1024 * 1024 // 5MB

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

describe('AcceptPendingObjectsService::moveToAcceptedLocation', () => {
  AcceptPendingObjectsService.prototype.runWithInterval = jest.fn()
  let mockStorageProvider: jest.Mocked<IConnectionHandler>
  beforeAll(() => {
    mockStorageProvider = {
      uploadFileToRemoteBucket: jest.fn(),
      getRedirectUrlForObject: jest.fn(),
      listFilesOnRemoteBucket: jest.fn(),
      removeObject: jest.fn(),
    }
  })
  describe('happy path connection enabled', () => {
    let service: AcceptPendingObjectsService
    let oldPath = PENDING_DIRECTORY + '/' + FILENAME
    beforeAll(async () => {
      //given
      ;(isStorageProviderConnectionEnabled as jest.Mock) = jest.fn().mockReturnValue(true)
      ;(access as jest.Mock) = jest.fn().mockRejectedValue(undefined as never) // file should not exists
      ;(unlink as jest.Mock) = jest.fn().mockResolvedValue(undefined as never)
      ;(copyFile as jest.Mock) = jest.fn().mockRejectedValue(undefined as never)
      ;(getStorageProviderConnection as jest.Mock) = jest.fn().mockReturnValue(mockStorageProvider)
      ;(registerNewDataObjectId as jest.Mock) = jest.fn().mockReturnValue(undefined as never)
      ;(addDataObjectIdToCache as jest.Mock) = jest.fn().mockResolvedValue(undefined as never)
      service = await createMockAcceptPendingObjectsService()

      // when
      await service.moveToAcceptedLocation(FILENAME)
    })
    // then
    it('should check for storage connection enabled', () => {
      expect(isStorageProviderConnectionEnabled).toHaveBeenCalled()
    })
    it('should successfully move from pending to uploads buckets when cloud connection enabled', () => {
      expect(mockStorageProvider.uploadFileToRemoteBucket).toHaveBeenCalledWith(FILENAME, oldPath)
    })
    it('should unlink file after uploading', () => {
      expect(unlink).toHaveBeenCalledWith(oldPath)
    })
    it('should add the file in the object cache', () => {
      expect(addDataObjectIdToCache).toHaveBeenCalledWith(FILENAME, true)
    })
    it('should register the file with expiration', () => {
      expect(registerNewDataObjectId).toHaveBeenCalledWith(FILENAME)
    })
  })
})
