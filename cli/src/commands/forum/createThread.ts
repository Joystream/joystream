import { flags } from '@oclif/command'
import chalk from 'chalk'
import ForumCommandBase from '../../base/ForumCommandBase'
import { ForumThreadMetadata, IForumThreadMetadata } from '@joystream/metadata-protobuf'
import { metadataToBytes } from '../../helpers/serialization'
import { ThreadId } from '@joystream/types/common'

export default class ForumCreateThreadCommand extends ForumCommandBase {
  static description = 'Create forum thread.'
  static flags = {
    categoryId: flags.integer({
      required: true,
      description: 'Id of the forum category the thread should be created in',
    }),
    title: flags.string({
      required: true,
      description: 'Thread title',
    }),
    tags: flags.string({
      required: false,
      multiple: true,
      description: 'Space-separated tags to associate with the thread',
    }),
    text: flags.string({
      required: true,
      description: 'Initial post text',
    }),
    ...ForumCommandBase.flags,
  }

  async run(): Promise<void> {
    const api = await this.getOriginalApi()
    const { categoryId, title, tags, text } = this.parse(ForumCreateThreadCommand).flags

    await this.ensureCategoryMutable(categoryId)
    const member = await this.getRequiredMemberContext()

    const metadata: IForumThreadMetadata = { title, tags }
    this.jsonPrettyPrint(JSON.stringify({ categoryId, metadata }))
    await this.requireConfirmation('Do you confirm the provided input?', true)

    const result = await this.sendAndFollowTx(
      await this.getDecodedPair(member.membership.controller_account),
      // Polls not supported atm
      api.tx.forum.createThread(member.id, categoryId, metadataToBytes(ForumThreadMetadata, metadata), text, null)
    )

    const threadId: ThreadId = this.getEvent(result, 'forum', 'ThreadCreated').data[1]
    this.log(chalk.green(`ForumThread with id ${chalk.magentaBright(threadId.toString())} successfully created!`))
    this.output(threadId.toString())
  }
}
