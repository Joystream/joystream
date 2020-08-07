import { Credential, JoyStructDecorated } from '../../../common'
import { OperationType } from './operation-types'
import { bool, Option } from '@polkadot/types'

type IOperation = {
  with_credential: Option<Credential>
  as_entity_maintainer: bool
  operation_type: OperationType
}

export class Operation
  extends JoyStructDecorated({
    with_credential: Option.with(Credential),
    as_entity_maintainer: bool,
    operation_type: OperationType,
  })
  implements IOperation {}
