import { u16 } from '@polkadot/types'
import ClassId from '../ClassId'
import { JoyStructDecorated } from '../../common'

type IPropertyOfClass = {
  class_id: ClassId
  property_index: u16
}

export default class PropertyOfClass
  extends JoyStructDecorated({
    class_id: ClassId,
    property_index: u16,
  })
  implements IPropertyOfClass {}
