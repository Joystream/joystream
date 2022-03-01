import { MembershipMetadata } from '@joystream/metadata-protobuf'
import { Utils } from '../../utils'
import { Bytes } from '@polkadot/types'

type MemberCreationParams = {
  root_account: string
  controller_account: string
  handle: string
  name?: string
  about?: string
  metadata: Bytes
}

// Common code for Membership fixtures
export function generateParamsFromAccountId(accountId: string): MemberCreationParams {
  const name = `name${accountId.substring(0, 14)}`
  const about = `about${accountId.substring(0, 14)}`
  const metadataBytes = Utils.metadataToBytes(MembershipMetadata, { name, about })

  return {
    root_account: accountId,
    controller_account: accountId,
    handle: `handle${accountId.substring(0, 14)}`,
    name,
    about,
    metadata: metadataBytes,
  }
}
