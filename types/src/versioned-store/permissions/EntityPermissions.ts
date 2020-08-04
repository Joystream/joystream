import { JoyStruct } from '../../JoyStruct';
import { bool } from '@polkadot/types';
import { CredentialSet } from '../../common';

type IEntityPermissions = {
    update: CredentialSet,
    maintainer_has_all_permissions: bool
};

export default class EntityPermissions extends JoyStruct<IEntityPermissions> {
    constructor (value: IEntityPermissions) {
        super({
            update: CredentialSet,
            maintainer_has_all_permissions: bool
        }, value);
    }

    get update () : CredentialSet {
        return this.getField('update');
    }

    get maintainer_has_all_permissions() : bool {
        return this.getField('maintainer_has_all_permissions');
    }
}