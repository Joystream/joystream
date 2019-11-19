import { JoyStruct } from '../../JoyStruct';
import { u32, bool } from '@polkadot/types';
import EntityPermissions from './EntityPermissions';
import { CredentialSet } from './credentials';
import { ReferenceConstraint } from './reference-constraint';
import { BlockNumber } from '@polkadot/types/interfaces';

type IClassPermissions = {
    entity_permissions: EntityPermissions,
    entities_can_be_created: bool,
    add_schemas: CredentialSet,
    create_entities: CredentialSet,
    reference_constraint: ReferenceConstraint,
    admins: CredentialSet,
    last_permissions_update: BlockNumber,
};

export default class ClassPermissionsType extends JoyStruct<IClassPermissions> {
    constructor (value: IClassPermissions) {
        super({
            entity_permissions: EntityPermissions,
            entities_can_be_created: bool,
            add_schemas: CredentialSet,
            create_entities: CredentialSet,
            reference_constraint: ReferenceConstraint,
            admins: CredentialSet,
            last_permissions_update: u32, // BlockNumber,
        }, value);
    }

    // getters..
}