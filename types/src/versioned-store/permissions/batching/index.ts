import { JoyStruct, Credential } from '../../../common';
import { OperationType } from './operation-types';
import { bool, Option } from '@polkadot/types';

type IOperation = {
    with_credential: Option<Credential>,
    as_entity_maintainer: bool,
    operation_type: OperationType,
}

export class Operation extends JoyStruct<IOperation> {
    constructor (value: IOperation) {
        super({
            with_credential: Option.with(Credential),
            as_entity_maintainer: bool,
            operation_type: OperationType,
        }, value);
    }

    get with_credential () : Option<Credential> {
        return this.getField('with_credential');
    }

    get as_entity_maintainer () : bool {
        return this.getField('as_entity_maintainer');
    }

    get operation_type () : OperationType {
        return this.getField('operation_type');
    }
}