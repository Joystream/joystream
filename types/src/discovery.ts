import { u32, Text } from '@polkadot/types'
import { RegistryTypes } from '@polkadot/types/types'
import { JoyStructDecorated } from './common'

export class IPNSIdentity extends Text {}

export class ServiceProviderRecord extends JoyStructDecorated({
  identity: IPNSIdentity,
  expires_at: u32, // BlockNumber
}) {}

export const discoveryTypes: RegistryTypes = {
  IPNSIdentity,
  ServiceProviderRecord,
}

export default discoveryTypes
