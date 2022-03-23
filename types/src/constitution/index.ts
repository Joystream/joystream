import { JoyStructDecorated } from '../JoyStruct'
import { Hash } from '../common'
import { RegistryTypes } from '@polkadot/types/types'

export class ConstitutionInfo extends JoyStructDecorated({
  text_hash: Hash,
}) {}

export const constitutionTypes: RegistryTypes = {
  ConstitutionInfo,
}

export default constitutionTypes
