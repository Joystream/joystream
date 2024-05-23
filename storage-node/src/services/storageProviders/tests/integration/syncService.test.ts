import { describe, jest, beforeAll, expect } from '@jest/globals'
import { withRandomUrls } from '../../../../services/sync/tasks/utils'
import { addDataObjectIdToCache } from '../../../../services/caching/localDataObjects'
import { ProviderSyncTask } from '../../../../services/sync/tasks'
import { hashFile } from '../../../../services/helpers/hashing'
import { IConnectionHandler } from '../../IConnectionHandler'
import { getStorageProviderConnection } from '../../../../commands/server'
import _ from 'lodash'

const DATA_OBJECT_ID = 'dataObjectId'
const EXPECTED_HASH = 'expectedHash'
const UPLOAD_DIRECTORY = __dirname + '/uploads'
const TEMP_DIRECTORY = __dirname + '/temp'
const OPERATOR_ENDPOINTS = ['http://operator1.net', 'http://operator2.net']

function createMockProviderSyncTask() {
  return new ProviderSyncTask(
    OPERATOR_ENDPOINTS,
    DATA_OBJECT_ID,
    EXPECTED_HASH,
    UPLOAD_DIRECTORY,
    TEMP_DIRECTORY,
    10,
    'hostId'
  )
}

describe('Sync Service : storage provider connection enabled', () => {
  let mockStorageProvider: jest.Mocked<IConnectionHandler> = {
    uploadFileToRemoteBucket: jest.fn(),
    getRedirectUrlForObject: jest.fn(),
    listFilesOnRemoteBucket: jest.fn(),
    removeObject: jest.fn(),
  }
  describe('happy path connection enabled', () => {
    let service: ProviderSyncTask
    let operatorUrls = OPERATOR_ENDPOINTS.map((baseUrl) => baseUrl + '/api/v1/files/' + DATA_OBJECT_ID)
    beforeAll(async () => {
      jest.clearAllMocks()
      //   ;(withRandomUrls as jest.Mock) = jest.fn().mockResolvedValue(undefined as never)
      ;(addDataObjectIdToCache as jest.Mock) = jest.fn().mockResolvedValue(undefined as never)
      ;(hashFile as jest.Mock) = jest.fn().mockResolvedValue('expectedHash' as never)
      ;(getStorageProviderConnection as jest.Mock) = jest.fn().mockReturnValue(mockStorageProvider)
      ;(ProviderSyncTask.prototype.tryDownloadTemp as jest.Mock) = jest.fn()
      ;(_.shuffle as jest.Mock) = jest.fn().mockReturnValue(OPERATOR_ENDPOINTS)
      service = createMockProviderSyncTask()
    })
    it('should call execute and not throw any errors', async () => {
      await expect(service.execute()).resolves.not.toThrow()
    })
    it('should call withRandomUrls with the expected urls', async () => {
      ;(withRandomUrls as jest.Mock) = jest.fn().mockResolvedValue(undefined as never)
      await expect(service.execute()).resolves.not.toThrow()
      expect(withRandomUrls).toHaveBeenCalledWith(operatorUrls, expect.any(Function))
    })
    it('should have called tryDownloadTemp once with the expected arguments', async () => {
      await expect(service.execute()).resolves.not.toThrow()
      expect((service as any).tryDownloadTemp).toHaveBeenCalledTimes(1)
      expect((service as any).tryDownloadTemp).toHaveBeenCalledWith(
        operatorUrls[0]
        expect.any(String)
      ) // any string because the id is uuid4
    })
    it('should have called uploadFileToRemoteBucket just once in order to upload file to remote bucket', () => {
      expect(mockStorageProvider.uploadFileToRemoteBucket).toHaveBeenCalledTimes(1)
      expect(mockStorageProvider.uploadFileToRemoteBucket).toHaveBeenCalledWith(DATA_OBJECT_ID, expect.any(String))
    })
    it('should add Object Id to cache', () => {
      expect(addDataObjectIdToCache).toHaveBeenCalledWith(DATA_OBJECT_ID)
    })
  })
})
