import ContentDirectoryCommandBase from '../../base/ContentDirectoryCommandBase'

export default class DeleteChannelCategoryCommand extends ContentDirectoryCommandBase {
  static description = 'Delete channel category.'
  static flags = {
    context: ContentDirectoryCommandBase.categoriesContextFlag,
  }

  static args = [
    {
      name: 'channelCategoryId',
      required: true,
      description: 'ID of the Channel Category',
    },
  ]

  async run() {
    const { context } = this.parse(DeleteChannelCategoryCommand).flags

    const { channelCategoryId } = this.parse(DeleteChannelCategoryCommand).args

    const channelCategoryIds = await this.getApi().channelCategoryIds()

    if (channelCategoryIds.some((id) => id.toString() === channelCategoryId)) {
      const currentAccount = await this.getRequiredSelectedAccount()
      await this.requestAccountDecoding(currentAccount)

      const actor = context ? await this.getActor(context) : await this.getCategoryManagementActor()

      await this.sendAndFollowNamedTx(currentAccount, 'content', 'deleteChannelCategory', [actor, channelCategoryId])
    } else {
      this.error('Channel category under given id does not exist...')
    }
  }
}
