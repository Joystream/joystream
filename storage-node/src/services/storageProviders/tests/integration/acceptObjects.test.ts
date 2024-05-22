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
  let mockStorageProvider: jest.Mocked<IConnectionHandler> = {
    uploadFileToRemoteBucket: jest.fn(),
    getRedirectUrlForObject: jest.fn(),
    listFilesOnRemoteBucket: jest.fn(),
    removeObject: jest.fn(),
  }
  let service: AcceptPendingObjectsService
  let oldPath = PENDING_DIRECTORY + '/' + FILENAME

  describe('happy path connection enabled', () => {
    beforeAll(async () => {
      jest.clearAllMocks()
      ;(isStorageProviderConnectionEnabled as jest.Mock) = jest.fn().mockReturnValue(true)
      ;(access as jest.Mock) = jest.fn().mockRejectedValue(undefined as never) // file should not exists
      ;(unlink as jest.Mock) = jest.fn().mockResolvedValue(undefined as never)
      ;(copyFile as jest.Mock) = jest.fn().mockRejectedValue(undefined as never)
      ;(getStorageProviderConnection as jest.Mock) = jest.fn().mockReturnValue(mockStorageProvider)
      ;(registerNewDataObjectId as jest.Mock) = jest.fn().mockReturnValue(undefined as never)
      ;(addDataObjectIdToCache as jest.Mock) = jest.fn().mockResolvedValue(undefined as never)
      ;(mockStorageProvider.uploadFileToRemoteBucket as jest.Mock) = jest.fn().mockResolvedValue(undefined as never)
      service = await createMockAcceptPendingObjectsService()
    })
    it('should correctly call the move function without errors', () => {
      expect(service.moveToAcceptedLocation(FILENAME)).resolves.not.toThrowError()
    })
    // then
    it('should check for storage connection enabled', () => {
      expect(isStorageProviderConnectionEnabled).toHaveBeenCalled()
    })
    it('should successfully moved from pending to uploads buckets when cloud connection enabled', () => {
      expect(mockStorageProvider.uploadFileToRemoteBucket).toHaveBeenCalledWith(FILENAME, oldPath)
      expect(isStorageProviderConnectionEnabled).not.toThrowError()
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
  describe('unhappy path connection enabled, upload error', () => {
    beforeAll(async () => {
      jest.clearAllMocks()
      ;(isStorageProviderConnectionEnabled as jest.Mock) = jest.fn().mockReturnValue(true)
      ;(access as jest.Mock) = jest.fn().mockRejectedValue(undefined as never) // file should not exists
      ;(mockStorageProvider.uploadFileToRemoteBucket as jest.Mock) = jest.fn().mockImplementation(() => {
        throw new Error('S3 upload error')
      })
      ;(getStorageProviderConnection as jest.Mock) = jest.fn().mockReturnValue(mockStorageProvider)
      ;(unlink as jest.Mock) = jest.fn().mockResolvedValue(undefined as never)
      ;(copyFile as jest.Mock) = jest.fn().mockRejectedValue(undefined as never)
      ;(registerNewDataObjectId as jest.Mock) = jest.fn().mockReturnValue(undefined as never)
      ;(addDataObjectIdToCache as jest.Mock) = jest.fn().mockResolvedValue(undefined as never)
      service = await createMockAcceptPendingObjectsService()
    })
    it('should throw error when upload fails', async () => {
      try {
        await service.moveToAcceptedLocation(FILENAME)
      } catch (err) {
        expect(err).toEqual(new Error('S3 upload error'))
      }
    })

    it('should throw error when upload fails', () => {
      expect(mockStorageProvider.uploadFileToRemoteBucket).toHaveBeenCalledWith(FILENAME, oldPath)
      expect(mockStorageProvider.uploadFileToRemoteBucket).toThrowError()
    })
    it('should not unlink file after failed upload', () => {
      expect(unlink).not.toHaveBeenCalled()
    })
    it('should not add the file in the object cache', () => {
      expect(addDataObjectIdToCache).not.toHaveBeenCalled()
    })
    it('should not register the file with expiration', () => {
      expect(registerNewDataObjectId).not.toHaveBeenCalled()
    })
  })
})
