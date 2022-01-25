import { flags } from '@oclif/command'
import chalk from 'chalk'
import ForumCommandBase from '../../base/ForumCommandBase'
import { ForumPostMetadata, IForumPostMetadata } from '@joystream/metadata-protobuf'
import { metadataToBytes } from '../../helpers/serialization'
import { PostId } from '@joystream/types/common'

export default class ForumAddPostCommand extends ForumCommandBase {
  static description = 'Add forum post.'
  static flags = {
    categoryId: flags.integer({
      required: true,
      description: 'Id of the forum category of the parent thread',
    }),
    threadId: flags.integer({
      required: true,
      description: "Post's parent thread",
    }),
    text: flags.string({
      required: true,
      description: 'Post content (md-formatted text)',
    }),
    editable: flags.boolean({
      required: false,
      description: 'Whether the post should be editable',
    }),
    ...ForumCommandBase.flags,
  }

  async run(): Promise<void> {
    const api = await this.getOriginalApi()
    const { categoryId, threadId, text, editable } = this.parse(ForumAddPostCommand).flags

    await this.ensureThreadExists(categoryId, threadId)
    await this.ensureCategoryMutable(categoryId)
    const member = await this.getRequiredMemberContext()

    const metadata: IForumPostMetadata = { text }
    this.jsonPrettyPrint(JSON.stringify({ categoryId, threadId, text, editable }))
    await this.requireConfirmation('Do you confirm the provided input?', true)

    const result = await this.sendAndFollowTx(
      await this.getDecodedPair(member.membership.controller_account),
      // Polls not supported atm
      api.tx.forum.addPost(member.id, categoryId, threadId, metadataToBytes(ForumPostMetadata, metadata), editable)
    )

    const postId: PostId = this.getEvent(result, 'forum', 'PostAdded').data[0]
    this.log(chalk.green(`ForumPost with id ${chalk.magentaBright(postId.toString())} successfully created!`))
    this.output(postId.toString())
  }
}
