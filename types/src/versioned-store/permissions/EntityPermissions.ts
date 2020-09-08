import { JoyStructDecorated } from '../../JoyStruct'
import { bool } from '@polkadot/types'
import { CredentialSet } from '../../common'

type IEntityPermissions = {
  update: CredentialSet
  maintainer_has_all_permissions: bool
}

export default class EntityPermissions
  extends JoyStructDecorated({
    update: CredentialSet,
    maintainer_has_all_permissions: bool,
  })
  implements IEntityPermissions {}
