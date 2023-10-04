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

  /*
  Add curator groups as test cases for the content pallet runtime migration to cover case with actions
  we need to be sure are migrated correctly. We used a pre-computed tx hex-string for the older runtime,
  as new runtime types cannot be used without some hacks.
  Paste the call hex string into: https://polkadot.js.org/apps/#/extrinsics/decode to confirm it corresponds to
  the call: content.createCuratorGroup(isActive, permissionsByLevel) with following arguments:

    isActive: bool
      Yes
    permissionsByLevel: BTreeMap<u8, BTreeSet<PalletContentPermissionsCuratorGroupIterableEnumsContentModerationAction>>
    {
      0: [
        HideVideo
        {
          ChangeChannelFeatureStatus: CreatorTokenIssuance
        }
        DeleteVideo // This will get removed in the migration
        {
          DeleteVideoAssets: true
        }
      ]
      1: [
        HideChannel
        {
          ChangeChannelFeatureStatus: VideoUpdate
        }
        DeleteChannel // This will get removed in the migration
        {
          DeleteVideoAssets: false
        }
      ]
    }

  */
  const tx = '0x54041a00010800100002060305010110010204040500'
  const contentLeadAccountId = await new CreateCuratorGroupFixture(api, query, []).getContentWgLeadAccount()
  await api.signAndSend(api.tx(tx), contentLeadAccountId)
  await api.signAndSend(api.tx(tx), contentLeadAccountId)
  await api.signAndSend(api.tx(tx), contentLeadAccountId)

  debug('Done')
}
