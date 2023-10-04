import { assert } from 'chai'
import { FlowProps } from '../Flow'
import { extendDebug } from '../Debugger'
import type { u32 } from '@polkadot/types-codec'
import { createType } from '@joystream/types'

export default async function assertValues({ api }: FlowProps): Promise<void> {
  const debug = extendDebug('flow:postRuntimeUpdateChecks')
  debug('Started')

  debug('Check runtime spec version')
  const version = await api.rpc.state.getRuntimeVersion()
  assert.equal(version.specVersion.toNumber(), 2002)

  debug('Check forum sub category limit')
  const subCategoryLimit = api.consts.forum.maxDirectSubcategoriesInCategory.toNumber()
  assert.equal(subCategoryLimit, 10)

  debug('Check workers limit')
  for (const group of ['storageWorkingGroup', 'distributionWorkingGroup']) {
    const workerLimit = (api.consts[group].maxWorkerNumberLimit as u32).toNumber()
    assert.equal(workerLimit, 50, `${group} invalid limit of workers`)
  }

  for (const group of [
    'forumWorkingGroup',
    'contentWorkingGroup',
    'membershipWorkingGroup',
    'appWorkingGroup',
    'operationsWorkingGroupAlpha',
    'operationsWorkingGroupBeta',
    'operationsWorkingGroupGamma',
  ]) {
    const workerLimit = (api.consts[group].maxWorkerNumberLimit as u32).toNumber()
    assert.equal(workerLimit, 30, `${group} invalid limit of workers`)
  }

  const expectedPermissions = createType(
    'BTreeMap<u8,BTreeSet<PalletContentPermissionsCuratorGroupIterableEnumsContentModerationAction>>',
    new Map([
      [
        0,
        [
          { 'HideVideo': null },
          { 'ChangeChannelFeatureStatus': { 'CreatorTokenIssuance': null } },
          { 'DeleteVideoAssets': true },
        ],
      ],
      [
        1,
        [
          { 'HideChannel': null },
          { 'ChangeChannelFeatureStatus': { 'VideoUpdate': null } },
          { 'DeleteVideoAssets': false },
        ],
      ],
    ])
  )

  const lastCuratorGroup = (await api.query.content.nextCuratorGroupId()).subn(1)
  const curatorGroup = await api.query.content.curatorGroupById(lastCuratorGroup)
  assert(curatorGroup.active.eq(true))
  // This would be cleaner but doesn't work correctly
  // assert.deepEqual(curatorGroup.permissionsByLevel, expectedPermissions)
  assert.equal(`${curatorGroup.permissionsByLevel}`, `${expectedPermissions}`)

  debug('Done')
}
