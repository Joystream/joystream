import { expect, jest } from '@jest/globals'
import { AcceptPendingDataObjectsParams, AcceptPendingObjectsService } from '../../../sync/acceptPendingObjects'
import { acceptObject } from '../../../helpers/acceptObject'
import { acceptPendingDataObjectsBatch } from '../../../runtime/extrinsics'
import { ApiPromise } from '@polkadot/api'
import logger from '../../../logger'
import { addDataObjectIdToCache, deleteDataObjectIdFromCache } from '../../../caching/localDataObjects'

AcceptPendingObjectsService.prototype.runWithInterval = jest.fn()
const createAcceptObjectServiceMock = async () => {
  return await AcceptPendingObjectsService.create(
    {} as any,
    {} as any,
    1,
    'uploadsDir',
    'pendingDataObjectsDir',
    new Map(),
    ['bucket1'],
    10,
    1000
  )
}
describe('accept pending object flow test suite', () => {
  describe('accept pending object happy path', () => {
    let service: AcceptPendingObjectsService
    beforeEach(async () => {
      jest.clearAllMocks()
      service = await createAcceptObjectServiceMock()
      ;(acceptObject as jest.Mock) = jest.fn().mockResolvedValue(undefined as never)
      ;(acceptPendingDataObjectsBatch as jest.Mock) = jest.fn(
        async (_api: ApiPromise, _workerId: number, pendingObjects: AcceptPendingDataObjectsParams[]) => {
          Promise.resolve(pendingObjects.map((obj) => obj.storageBucket.bags.map((b) => b.dataObjects)).flat(2))
        }
      ) as any
      ;(addDataObjectIdToCache as jest.Mock) = jest.fn().mockResolvedValue(undefined as never)
      ;(logger.error as jest.Mock) = jest.fn()
    })
    afterEach(() => {
      ;[1, 2, 3, 4].map((id) => {
        try {
          deleteDataObjectIdFromCache(id.toString())
        } catch (e) {}
      })
    })
    it('should accept object', async () => {
      await expect(
        service.acceptPendingDataObjects(
          {} as ApiPromise,
          1,
          [
            ['1', ['bucket1', 'bag1']],
            ['2', ['bucket1', 'bag1']],
          ],
          10
        )
      ).resolves.toBeUndefined()
    })
    it('should call accept objects/maxTxBatchSize times', async () => {
      await service.acceptPendingDataObjects(
        {} as ApiPromise,
        1,
        [
          ['1', ['bucket1', 'bag1']],
          ['2', ['bucket1', 'bag1']],
          ['3', ['bucket2', 'bag2']],
          ['4', ['bucket2', 'bag2']],
        ],
        2
      )

      expect(acceptPendingDataObjectsBatch).toHaveBeenCalledTimes(2)
      expect(acceptObject).toHaveBeenCalledTimes(2)
      expect(addDataObjectIdToCache).toHaveBeenCalledTimes(2)
    })
  })
  describe('accept pending object error path', () => {})
})
