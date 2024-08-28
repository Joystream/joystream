import { expect, jest } from '@jest/globals'
import { moveFile } from '../../../../services/helpers/moveFile'
import { acceptObject } from '../../../../services/helpers/acceptObject'
import { getStorageProviderConnection, isStorageProviderConnectionEnabled } from '../../../../commands/server'
import { IConnectionHandler } from '../../IConnectionHandler'
import { addDataObjectIdToCache } from '../../../../services/caching/localDataObjects'
import fs from 'fs'

describe('acceptObject', () => {
  describe('when toBeAcceptedOnLocalVolume is true', () => {
    describe('accept object happy path', () => {
      beforeEach(() => {
        jest.clearAllMocks()
        ;(isStorageProviderConnectionEnabled as jest.Mock) = jest.fn().mockReturnValue(false)
        ;(moveFile as jest.Mock) = jest.fn().mockReturnValue(false)
        ;(addDataObjectIdToCache as jest.Mock) = jest.fn()
      })
      it('should call moveFile happy path', async () => {
        await acceptObject('filename', 'src', 'dst')
        expect(moveFile).toHaveBeenCalledWith('src', 'dst')
      })
      it('should throw error when dest is undefined', async () => {
        await expect(acceptObject('filename', 'src')).rejects.toThrow('Destination path is undefined')
      })
      it('should call add object to cache', async () => {
        await acceptObject('filename', 'src', 'dst')
        expect(addDataObjectIdToCache).toHaveBeenCalledWith('filename')
      })
    })
    describe('accept object error path', () => {
      beforeEach(() => {
        jest.clearAllMocks()
        ;(isStorageProviderConnectionEnabled as jest.Mock) = jest.fn().mockReturnValue(false)
        ;(addDataObjectIdToCache as jest.Mock) = jest.fn()
      })
      it('should throw error when moveFile throws error', async () => {
        ;(moveFile as jest.Mock) = jest.fn().mockRejectedValue(new Error('moveFile error') as never)
        await expect(acceptObject('filename', 'src', 'dst')).rejects.toThrow('moveFile error')
      })
      it('should throw error when destination is not specified', async () => {
        await expect(acceptObject('filename', 'src', undefined)).rejects.toThrow('Destination path is undefined')
      })
      it('should not have been called add object to cache', () => {
        expect(addDataObjectIdToCache).not.toHaveBeenCalled()
      })
    })
  })
  describe('when toBeAcceptedOnLocalVolume is false', () => {
    let mockConnection = jest.mocked<IConnectionHandler>({
      uploadFileToRemoteBucket: jest.fn() as (filename: string, filePath: string) => Promise<any>,
      getRedirectUrlForObject: jest.fn() as (filename: string) => Promise<string>,
      listFilesOnRemoteBucket: jest.fn() as () => Promise<string[]>,
      removeObject: jest.fn() as (filename: string) => Promise<void>,
    })
    describe('accept object happy path', () => {
      beforeEach(() => {
        jest.clearAllMocks()
        ;(isStorageProviderConnectionEnabled as jest.Mock) = jest.fn().mockReturnValue(true)
        ;(getStorageProviderConnection as jest.Mock) = jest.fn().mockReturnValue(mockConnection)
        ;(fs.promises.unlink as jest.Mock) = jest.fn()
      })
      it('should call uploadFileToRemoteBucket happy path', async () => {
        await acceptObject('filename', 'src')
        expect(moveFile).not.toHaveBeenCalled()
      })
      it('should call uploadFileToRemoteBucket with correct arguments', async () => {
        await acceptObject('filename', 'src')
        expect(mockConnection.uploadFileToRemoteBucket).toHaveBeenCalledWith('filename', 'src')
      })
      it('should call add object to cache', async () => {
        await acceptObject('filename', 'src', 'dst')
        expect(addDataObjectIdToCache).toHaveBeenCalledWith('filename')
      })
      it('should have called unlink the file', async () => {
        await acceptObject('filename', 'src', 'dst')
        expect(fs.promises.unlink).toHaveBeenCalledWith('src')
      })
    })
    describe('accept object error path', () => {
      beforeEach(() => {
        jest.clearAllMocks()
        ;(isStorageProviderConnectionEnabled as jest.Mock) = jest.fn().mockReturnValue(true)
        ;(mockConnection.uploadFileToRemoteBucket as jest.Mock) = jest
          .fn()
          .mockRejectedValue(new Error('uploadFileToRemoteBucket error') as never)
        ;(getStorageProviderConnection as jest.Mock) = jest.fn().mockReturnValue(mockConnection)
        ;(fs.promises.unlink as jest.Mock) = jest.fn()
        ;(addDataObjectIdToCache as jest.Mock) = jest.fn()
      })
      it('should throw error when uploadFileToRemoteBucket throws error and not add object to cache', async () => {
        await expect(acceptObject('filename', 'src')).rejects.toThrow('uploadFileToRemoteBucket error')
        expect(addDataObjectIdToCache).not.toHaveBeenCalled()
      })
      it('should not have called unlink the file', () => {
        expect(fs.promises.unlink).not.toHaveBeenCalled()
      })
    })
  })
})
