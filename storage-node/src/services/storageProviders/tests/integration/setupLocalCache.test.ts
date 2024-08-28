import { jest, expect, beforeEach, afterEach } from '@jest/globals'
import { getLocalFileNames } from '../../../../services/caching/localFileNames'
import {
  deleteDataObjectIdFromCache,
  getDataObjectIdFromCache,
  loadDataObjectIdCache,
} from '../../../../services/caching/localDataObjects'
import { IConnectionHandler } from '../../IConnectionHandler'
import { getStorageProviderConnection, isStorageProviderConnectionEnabled } from '../../../../commands/server'
import logger from '../../../../services/logger'

describe('loadLocalCache setup test suite', () => {
  ;(logger.error as jest.Mock) = jest.fn()
  let mockConnection = jest.mocked<IConnectionHandler>({
    uploadFileToRemoteBucket: jest.fn() as (filename: string, filePath: string) => Promise<any>,
    getRedirectUrlForObject: jest.fn() as (filename: string) => Promise<string>,
    listFilesOnRemoteBucket: jest.fn().mockResolvedValue(['4', '5', '6'] as never) as () => Promise<string[]>,
    removeObject: jest.fn() as (filename: string) => Promise<void>,
  })
  describe('loadLocalCache happy path', () => {
    beforeEach(() => {
      jest.clearAllMocks()
      ;(getLocalFileNames as jest.Mock) = jest.fn().mockResolvedValue(['1', '2', '3'] as never)
      ;(isStorageProviderConnectionEnabled as jest.Mock) = jest.fn().mockReturnValue(true)
      ;(getStorageProviderConnection as jest.Mock) = jest.fn().mockReturnValue(mockConnection as never)
    })
    afterEach(() => {
      ;[1, 2, 3, 4, 5, 6].map((id) => deleteDataObjectIdFromCache(id.toString()))
    })
    it('should call getLocalFileNames', async () => {
      await loadDataObjectIdCache('uploadDir')
      expect(getLocalFileNames).toHaveBeenCalled()
    })
    it('should call getStorageProviderConnection', async () => {
      await loadDataObjectIdCache('uploadDir')
      expect(getStorageProviderConnection).toHaveBeenCalled()
    })
    it('should contains all the files from local volume', async () => {
      await loadDataObjectIdCache('uploadDir')

      for (let i = 1; i <= 3; i++) {
        const res = await getDataObjectIdFromCache(i.toString())
        expect(res).toBeDefined()
        expect(res!.entry.pinCount).toBe(0)
        expect(res!.entry.onLocalVolume).toBe(true)
      }
    })
    it('should contains all the files from remote bucket', async () => {
      await loadDataObjectIdCache('uploadDir')

      for (let i = 4; i <= 6; i++) {
        const res = await getDataObjectIdFromCache(i.toString())
        expect(res).toBeDefined()
        expect(res!.entry.pinCount).toBe(0)
        expect(res!.entry.onLocalVolume).toBe(false)
      }
    })
  })
  describe('loadLocalCache error path', () => {
    describe('error in reading files from local volume', () => {
      beforeEach(() => {
        jest.clearAllMocks()
        ;(getLocalFileNames as jest.Mock) = jest.fn().mockRejectedValue(new Error('getLocalFileNames error') as never)
        ;(isStorageProviderConnectionEnabled as jest.Mock) = jest.fn().mockReturnValue(true)
        ;(getStorageProviderConnection as jest.Mock) = jest.fn().mockReturnValue(mockConnection as never)
      })
      afterEach(() => {
        ;[4, 5, 6].map((id) => deleteDataObjectIdFromCache(id.toString()))
      })
      it('should throw error when getLocalFileNames throws error', async () => {
        await expect(loadDataObjectIdCache('uploadDir')).resolves.not.toThrow()
      })
      it('should not contains any the files from local volume', async () => {
        await loadDataObjectIdCache('uploadDir')

        for (let i = 1; i <= 3; i++) {
          const res = await getDataObjectIdFromCache(i.toString())
          expect(res).not.toBeDefined()
        }
      })
      it('should contains all the files from remote bucket', async () => {
        await loadDataObjectIdCache('uploadDir')

        for (let i = 4; i <= 6; i++) {
          const res = await getDataObjectIdFromCache(i.toString())
          expect(res).toBeDefined()
          expect(res!.entry.pinCount).toBe(0)
          expect(res!.entry.onLocalVolume).toBe(false)
        }
      })
    })
    describe('error in reading files from remote bucke', () => {
      beforeEach(() => {
        jest.clearAllMocks()
        ;(getLocalFileNames as jest.Mock) = jest.fn().mockResolvedValue(['1', '2', '3'] as never)
        ;(mockConnection.listFilesOnRemoteBucket as jest.Mock) = jest
          .fn()
          .mockRejectedValue(new Error('listFilesOnRemoteBucket error') as never)
        ;(isStorageProviderConnectionEnabled as jest.Mock) = jest.fn().mockReturnValue(true)
        ;(getStorageProviderConnection as jest.Mock) = jest.fn().mockReturnValue(mockConnection as never)
      })
      afterEach(() => {
        ;[1, 2, 3].map((id) => deleteDataObjectIdFromCache(id.toString()))
      })
      it('should throw error when getLocalFileNames throws error', async () => {
        await expect(loadDataObjectIdCache('uploadDir')).resolves.not.toThrow()
      })
      it('should contains all the files from local volume', async () => {
        await loadDataObjectIdCache('uploadDir')

        for (let i = 1; i <= 3; i++) {
          const res = await getDataObjectIdFromCache(i.toString())
          expect(res).toBeDefined()
          expect(res!.entry.pinCount).toBe(0)
          expect(res!.entry.onLocalVolume).toBe(true)
        }
      })
      it('should not contains any the files from remote bucket', async () => {
        await loadDataObjectIdCache('uploadDir')

        for (let i = 4; i <= 6; i++) {
          const res = await getDataObjectIdFromCache(i.toString())
          expect(res).not.toBeDefined()
        }
      })
    })
  })
})
