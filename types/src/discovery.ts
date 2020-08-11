import { Text, u32 } from '@polkadot/types'
import { RegistryTypes } from '@polkadot/types/types'
import { JoyStructDecorated } from './common'

export class IPNSIdentity extends Text {}
export class Url extends Text {}

export class StorageProviderAccountInfo extends JoyStructDecorated({
  identity: IPNSIdentity,
  expires_at: u32, // BlockNumber
}) {}

export const discoveryTypes: RegistryTypes = {
  Url,
  IPNSIdentity,
  StorageProviderAccountInfo,
}

export default discoveryTypes
