import FeeProfileCommandBase from '../../base/FeeProfileCommandBase'
import { flags } from '@oclif/command'
import _ from 'lodash'
import { IMemberRemarked, MemberRemarked } from '@joystream/metadata-protobuf'
import { metadataToBytes } from '../../helpers/serialization'
import Long from 'long'

const DEFAULT_COMMENT_LENGTH = 50

export default class FeeProfileAddVideoComment extends FeeProfileCommandBase {
  static description = 'Create fee profile of members.member_remark extrinsic (video comment case).'

  static flags = {
    commentLen: flags.integer({
      char: 'c',
      default: DEFAULT_COMMENT_LENGTH,
      description: 'Comment length to use for estimating tx fee',
    }),
    ...super.flags,
  }

  async run(): Promise<void> {
    const api = this.getOriginalApi()
    const { commentLen } = this.parse(FeeProfileAddVideoComment).flags

    this.log('Parameters:')
    this.jsonPrettyPrint(JSON.stringify({ commentLen }))

    const mockMetadata: IMemberRemarked = {
      createComment: {
        videoId: Long.fromNumber(0),
        body: _.repeat('x', commentLen),
      },
    }
    const tx = api.tx.members.memberRemark(0, metadataToBytes(MemberRemarked, mockMetadata))
    const txFee = await this.getApi().estimateFee(this.pairs.alice, tx)
    this.profile({ txFee })
  }
}
