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
    const { context } = this.parse(DeleteVideoCategoryCommand).flags

    const { videoCategoryId } = this.parse(DeleteVideoCategoryCommand).args

    const videoCategoryIds = await this.getApi().videoCategoryIds()

    if (videoCategoryIds.some((id) => id.toString() === videoCategoryId)) {
      const currentAccount = await this.getRequiredSelectedAccount()
      await this.requestAccountDecoding(currentAccount)

      const actor = context ? await this.getActor(context) : await this.getCategoryManagementActor()

      await this.sendAndFollowNamedTx(currentAccount, 'content', 'deleteVideoCategory', [actor, videoCategoryId])
    } else {
      this.error('Video category under given id does not exist...')
    }
  }
}
