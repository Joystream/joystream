import { Command, flags } from '@oclif/command'
import logger from '../../services/logger'

import { addDataObjectIdToCache, getDataObjectIDs, objectIdInCache } from '../../services/caching/localDataObjects'
import _ from 'lodash'

export default class Test1 extends Command {
  static description = 'Timing test 1'

  static flags = {
    storedCount: flags.integer({
      required: false,
      description: 'Number of stored objects (present in local storage)',
      default: 100_000,
    }),
    obligationCount: flags.integer({
      required: false,
      description: 'Total number of obligations (from query)',
      default: 100_000,
    }),
  }

  async run(): Promise<void> {
    const { flags } = this.parse(Test1)

    logger.info('creating fake files data')
    _.range(0, flags.storedCount).forEach((id) => addDataObjectIdToCache(id.toString()))
    const files = getDataObjectIDs()

    logger.info('creating fake query result data')
    const required = _.range(0, flags.obligationCount).map((id) => ({
      id: id.toString(),
    }))

    logger.info('test _.differenceWith')
    const stop1 = Date.now()
    _.differenceWith(required, files, (required, file) => required.id === file)
    const stop2 = Date.now()

    logger.info('test Array.includes')
    required.filter((obj) => !files.includes(obj.id))
    const stop3 = Date.now()

    logger.info('test Map.has')
    required.filter((obj) => !objectIdInCache(obj.id))
    const stop4 = Date.now()

    logger.info('test _.difference')
    const requiredIds = required.map((obj) => obj.id)
    _.difference(requiredIds, files)
    const stop5 = Date.now()

    logger.info(`_.differenceWith ${stop2 - stop1}ms`) // 14480ms
    logger.info(`filter with array.includes ${stop3 - stop2}ms`) // 8678ms
    logger.info(`filter map.has ${stop4 - stop3}ms`) // 2ms
    logger.info(`_.difference ${stop5 - stop4}ms`) // 23ms
  }
}
