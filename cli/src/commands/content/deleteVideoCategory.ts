// TODO: re-work afer merging metaprotocol content categories PR - https://github.com/Joystream/joystream/pull/3950

import ContentDirectoryCommandBase from '../../base/ContentDirectoryCommandBase'

export default class DeleteVideoCategoryCommand extends ContentDirectoryCommandBase {
  static description = 'Delete video category.'
  static flags = {
    context: ContentDirectoryCommandBase.categoriesContextFlag,
    ...ContentDirectoryCommandBase.flags,
  }

  static args = [
    {
      name: 'videoCategoryId',
      required: true,
      description: 'ID of the Video Category',
    },
  ]

  async run(): Promise<void> {
    const { context } = this.parse(DeleteVideoCategoryCommand).flags

    const { videoCategoryId } = this.parse(DeleteVideoCategoryCommand).args

    const videoCategoryIds: number[] = []

    if (videoCategoryIds.some((id) => id.toString() === videoCategoryId)) {
      const [, address] = context ? await this.getContentActor(context) : await this.getCategoryManagementActor()

      await this.sendAndFollowNamedTx(await this.getDecodedPair(address), 'contentWorkingGroup', 'leadRemark', [
        videoCategoryId,
      ])
    } else {
      this.error('Video category under given id does not exist...')
    }
  }
}
