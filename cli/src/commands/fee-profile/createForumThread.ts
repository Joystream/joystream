import FeeProfileCommandBase from '../../base/FeeProfileCommandBase'
import { flags } from '@oclif/command'
import _ from 'lodash'
import { ForumThreadMetadata, IForumThreadMetadata } from '@joystream/metadata-protobuf'
import { metadataToBytes } from '../../helpers/serialization'
import chalk from 'chalk'
import { formatBalance } from '@polkadot/util'

const DEFAULT_TITLE_LENGTH = 20
const DEFAULT_INITIAL_POST_LENGTH = 200
const DEFAULT_TAGS_NUM = 5
const DEFAULT_TAG_LENGTH = 10

export default class FeeProfileCreateForumThread extends FeeProfileCommandBase {
  static description = 'Create fee profile of forum.create_thread extrinsic.'

  static flags = {
    titleLen: flags.integer({
      char: 't',
      default: DEFAULT_TITLE_LENGTH,
      description: 'Thread title (part of thread metadata) length to use for estimating tx fee',
    }),
    initialPostLen: flags.integer({
      char: 'p',
      default: DEFAULT_INITIAL_POST_LENGTH,
      description: "Thread's initial post length to use for estimating tx fee",
    }),
    tagsNum: flags.integer({
      char: 'G',
      default: DEFAULT_TAGS_NUM,
      description: 'Number of forum thread tags (part of thread metadata) to use for estimating tx fee',
    }),
    tagLen: flags.integer({
      char: 'g',
      default: DEFAULT_TAG_LENGTH,
      description: 'Single tag length (part of thread metadata) to use for estimating tx fee',
    }),
    ...super.flags,
  }

  async run(): Promise<void> {
    const api = this.getOriginalApi()
    const { titleLen, initialPostLen, tagsNum, tagLen } = this.parse(FeeProfileCreateForumThread).flags
    const { threadDeposit, postDeposit } = api.consts.forum

    this.log(`Thread deposit: ${chalk.cyanBright(formatBalance(threadDeposit))}`)
    this.log(`Post deposit: ${chalk.cyanBright(formatBalance(postDeposit))}`)
    this.log('Parameters:')
    this.jsonPrettyPrint(
      JSON.stringify({
        titleLen,
        initialPostLen,
        tagsNum,
        tagLen,
      })
    )

    const mockMetadata: IForumThreadMetadata = {
      title: _.repeat('x', titleLen),
      tags: Array.from({ length: tagsNum }, () => _.repeat('x', tagLen)),
    }

    const tx = api.tx.forum.createThread(
      0,
      0,
      metadataToBytes(ForumThreadMetadata, mockMetadata),
      _.repeat('x', initialPostLen)
    )
    const extraCosts = {
      threadDeposit,
      postDeposit,
    }
    await this.profile(tx, extraCosts)
  }
}
