import ContentDirectoryCommandBase from '../../base/ContentDirectoryCommandBase'

export default class DeleteVideoCategoryCommand extends ContentDirectoryCommandBase {
  static description = 'Delete video category.'
  static flags = {
    context: ContentDirectoryCommandBase.categoriesContextFlag,
  }

  static args = [
    {
      name: 'videoCategoryId',
      required: true,
      description: 'ID of the Video Category',
    },
  ]

  async run() {
    let { context } = this.parse(DeleteVideoCategoryCommand).flags

    const { videoCategoryId } = this.parse(DeleteVideoCategoryCommand).args

    const videoCategory = await this.getApi().videoCategoryById(videoCategoryId)

    if (videoCategory) {
      if (!context) {
        context = await this.promptForCategoriesContext()
      }

      const currentAccount = await this.getRequiredSelectedAccount()
      await this.requestAccountDecoding(currentAccount)

      const actor = await this.getActor(context)

      await this.sendAndFollowNamedTx(currentAccount, 'content', 'deleteVideoCategory', [actor, videoCategoryId])
    } else {
      this.error('Video category under given id does not exist...')
    }
  }
}
