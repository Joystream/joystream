import { JoyStruct } from '../../../JoyStruct';
import { OperationType } from './operation-types';
import { bool, Option } from '@polkadot/types';
import { Credential } from '../credentials';

type IOperation = {
    with_credential: Option<Credential>,
    as_entity_maintainer: bool,
    peration_type: OperationType,
}

export class Operation extends JoyStruct<IOperation> {
    constructor (value: IOperation) {
        super({
            with_credential: Option.with(Credential),
            as_entity_maintainer: bool,
            peration_type: OperationType,
        }, value);
    }

    // getters...
}