import FeeProfileCommandBase from '../../base/FeeProfileCommandBase'
import { flags } from '@oclif/command'
import _ from 'lodash'
import { IMembershipMetadata, MembershipMetadata } from '@joystream/metadata-protobuf'
import { metadataToBytes } from '../../helpers/serialization'
import { createType } from '@joystream/types'
import chalk from 'chalk'
import { formatBalance } from '@polkadot/util'

const DEFAULT_HANDLE_LENGTH = 10
const DEFAULT_NAME_LENGTH = 10
const DEFAULT_ABOUT_LENGTH = 0
const DEFAULT_AVATAR_URI_LENGTH = 25

export default class FeeProfileBuyMembershipCommand extends FeeProfileCommandBase {
  static description = 'Create fee profile of members.buy_membership extrinsic.'

  static flags = {
    handleLength: flags.integer({
      char: 'h',
      default: DEFAULT_HANDLE_LENGTH,
      description: 'Length of the membership handle to use for estimating tx fee',
    }),
    nameLength: flags.integer({
      char: 'n',
      default: DEFAULT_NAME_LENGTH,
      description: "Length of the member's name (part of metadata) to use for estimating tx fee",
    }),
    aboutLength: flags.integer({
      char: 'a',
      default: DEFAULT_ABOUT_LENGTH,
      description: "Length of the member's about text (part of metadata) to use for estimating tx fee",
    }),
    avatarUriLength: flags.integer({
      char: 'u',
      default: DEFAULT_AVATAR_URI_LENGTH,
      description: "Length of the member's avatar uri (part of metadata) to use for estimating tx fee",
    }),
    ...super.flags,
  }

  async run(): Promise<void> {
    const api = await this.getOriginalApi()
    const { handleLength, nameLength, aboutLength, avatarUriLength } = this.parse(FeeProfileBuyMembershipCommand).flags
    const membershipPrice = await api.query.members.membershipPrice()

    this.log(`Membership price: ${chalk.cyanBright(formatBalance(membershipPrice))}`)
    this.log('Parameters:')
    this.jsonPrettyPrint(JSON.stringify({ handleLength, nameLength, aboutLength, avatarUriLength }))

    const metadata: IMembershipMetadata = {
      name: _.repeat('x', nameLength),
      about: _.repeat('x', aboutLength),
      avatarUri: _.repeat('x', avatarUriLength),
    }
    const tx = api.tx.members.buyMembership(
      createType('PalletMembershipBuyMembershipParameters', {
        handle: _.repeat('x', handleLength),
        rootAccount: this.pairs.alice.address,
        controllerAccount: this.pairs.bob.address,
        metadata: metadataToBytes(MembershipMetadata, metadata),
        referrerId: null,
      })
    )
    const txFee = await this.getApi().estimateFee(this.pairs.alice, tx)
    const costs = { membershipPrice, txFee }
    this.profile(costs)
  }
}
