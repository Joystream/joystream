import { assert } from 'chai'
import { PalletContentIterableEnumsChannelActionPermission as ChannelActionPermission } from '@polkadot/types/lookup'

export function assertCuratorCollaboratorPermissions(
  expectedPermissions: ChannelActionPermission['type'][],
  permissions: string[]
) {
  const expectedPermissionsStrings = expectedPermissions.map((item) => item.toString())
  const permissionsStrings = [...permissions]

  expectedPermissionsStrings.sort()
  permissionsStrings.sort()

  assert.equal(permissionsStrings.length, expectedPermissionsStrings.length)
  permissionsStrings.forEach((item, index) => assert.equal(item, expectedPermissionsStrings[index]))
}
