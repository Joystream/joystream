import { ParametrizedPropertyValue } from './parametrized-property-value'
import { u16 } from '@polkadot/types'
import { JoyStructDecorated } from '../../../common'

type IParametrizedClassPropertyValue = {
  in_class_index: u16
  value: ParametrizedPropertyValue
}

export default class ParametrizedClassPropertyValue
  extends JoyStructDecorated({
    in_class_index: u16,
    value: ParametrizedPropertyValue,
  })
  implements IParametrizedClassPropertyValue {}
