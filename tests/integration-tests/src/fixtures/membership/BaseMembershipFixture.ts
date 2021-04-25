import { BaseQueryNodeFixture } from '../../Fixture'
import { MembershipMetadata } from '@joystream/metadata-protobuf'
import { CreateInterface, createType } from '@joystream/types'
import { BuyMembershipParameters } from '@joystream/types/members'

// Common code for Membership fixtures
// TODO: Refactor to use StandardizedFixture?
export abstract class BaseMembershipFixture extends BaseQueryNodeFixture {
  generateParamsFromAccountId(accountId: string): CreateInterface<BuyMembershipParameters> {
    const metadata = new MembershipMetadata()
    metadata.setName(`name${accountId.substring(0, 14)}`)
    metadata.setAbout(`about${accountId.substring(0, 14)}`)
    // TODO: avatar
    return {
      root_account: accountId,
      controller_account: accountId,
      handle: `handle${accountId.substring(0, 14)}`,
      metadata: createType('Bytes', '0x' + Buffer.from(metadata.serializeBinary()).toString('hex')),
    }
  }
}
