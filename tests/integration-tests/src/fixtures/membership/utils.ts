import { MembershipMetadata } from '@joystream/metadata-protobuf'
import { CreateInterface } from '@joystream/types'
import { BuyMembershipParameters } from '@joystream/types/members'
import { Utils } from '../../utils'

// Common code for Membership fixtures
export function generateParamsFromAccountId(accountId: string): CreateInterface<BuyMembershipParameters> {
  const metadataBytes = Utils.metadataToBytes(MembershipMetadata, {
    name: `name${accountId.substring(0, 14)}`,
    about: `about${accountId.substring(0, 14)}`,
  })

  return {
    root_account: accountId,
    controller_account: accountId,
    handle: `handle${accountId.substring(0, 14)}`,
    metadata: metadataBytes,
  }
}
