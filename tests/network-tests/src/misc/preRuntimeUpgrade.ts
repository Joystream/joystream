import { assert } from 'chai'
import { FlowProps } from '../Flow'
import { extendDebug } from '../Debugger'
import type { u32 } from '@polkadot/types-codec'
import { CreateCuratorGroupFixture } from '../fixtures/content'

export default async function assertValues({ api, query }: FlowProps): Promise<void> {
  const debug = extendDebug('flow:preRuntimeUpdateChecks')
  debug('Started')

  debug('Check runtime spec version')
  const version = await api.rpc.state.getRuntimeVersion()
  assert.equal(version.specVersion.toNumber(), 2001)

  debug('Check forum sub category limit')
  const subCategoryLimit = api.consts.forum.maxDirectSubcategoriesInCategory.toNumber()
  assert.equal(subCategoryLimit, 5)

  debug('Check workers limit')
  for (const group of ['storageWorkingGroup', 'distributionWorkingGroup']) {
    const workerLimit = (api.consts[group].maxWorkerNumberLimit as u32).toNumber()
    assert.equal(workerLimit, 30)
  }

  // Add curator groups as test cases for the content pallet runtime migration
  // We used a pre computed call hex for the older runtime, as new runtime types cannot be used
  // without some hacks.
  // Paste the call hex string into: https://polkadot.js.org/apps/#/extrinsics/decode to confirm what it does!
  const tx = '0x54041a00010800100002060305010110010204040500'
  // const call = '0x1a00010800100002060305010110010204040500'
  // we construct a fixture just to re-use a helper function
  const contentLeadAccountId = await new CreateCuratorGroupFixture(api, query, []).getContentWgLeadAccount()
  await api.signAndSend(api.tx(tx), contentLeadAccountId)
  await api.signAndSend(api.tx(tx), contentLeadAccountId)
  await api.signAndSend(api.tx(tx), contentLeadAccountId)

  debug('Done')
}
