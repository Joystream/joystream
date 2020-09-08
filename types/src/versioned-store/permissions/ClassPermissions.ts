import { u32, bool } from '@polkadot/types'
import { BlockNumber } from '@polkadot/types/interfaces'
import { CredentialSet, JoyStructDecorated } from '../../common'
import EntityPermissions from './EntityPermissions'
import { ReferenceConstraint } from './reference-constraint'

type IClassPermissions = {
  entity_permissions: EntityPermissions
  entities_can_be_created: bool
  add_schemas: CredentialSet
  create_entities: CredentialSet
  reference_constraint: ReferenceConstraint
  admins: CredentialSet
  last_permissions_update: BlockNumber
}

export default class ClassPermissionsType
  extends JoyStructDecorated({
    entity_permissions: EntityPermissions,
    entities_can_be_created: bool,
    add_schemas: CredentialSet,
    create_entities: CredentialSet,
    reference_constraint: ReferenceConstraint,
    admins: CredentialSet,
    last_permissions_update: u32, // BlockNumber,
  })
  implements IClassPermissions {}
