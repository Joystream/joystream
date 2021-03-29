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
    let { context } = this.parse(DeleteChannelCategoryCommand).flags

    const { channelCategoryId } = this.parse(DeleteChannelCategoryCommand).args

    const channelCategory = await this.getApi().channelCategoryById(channelCategoryId)

    if (channelCategory) {
      if (!context) {
        context = await this.promptForCategoriesContext()
      }

      const currentAccount = await this.getRequiredSelectedAccount()
      await this.requestAccountDecoding(currentAccount)

      const actor = await this.getActor(context)

      await this.sendAndFollowNamedTx(currentAccount, 'content', 'deleteChannelCategory', [actor, channelCategoryId])
    } else {
      this.error('Channel category under given id does not exist...')
    }
  }
}
