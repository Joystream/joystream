import { assert } from 'chai'
import { FlowProps } from '../Flow'
import { extendDebug } from '../Debugger'

export default async function assertValues({ api }: FlowProps): Promise<void> {
  const debug = extendDebug('flow:postMigrationAssertions')
  debug('Started')

  debug('Check runtime spec version')
  const version = await api.rpc.state.getRuntimeVersion()
  assert.equal(version.specVersion.toNumber(), 2002)

  debug('Check forum sub category limit')
  const subCategoryLimit = api.consts.forum.maxDirectSubcategoriesInCategory.toNumber()
  assert.equal(subCategoryLimit, 10)

  debug('Done')
}
