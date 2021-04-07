import ContentDirectoryCommandBase from '../../base/ContentDirectoryCommandBase'

export default class SetFeaturedVideosCommand extends ContentDirectoryCommandBase {
  static description = 'Set featured videos.'

  static args = [
    {
      name: 'featuredVideoIds',
      required: true,
      description: 'IDs of the featured videos',
    },
  ]

  async run() {
    const { featuredVideoIds } = this.parse(SetFeaturedVideosCommand).args

    const currentAccount = await this.getRequiredSelectedAccount()
    await this.requestAccountDecoding(currentAccount)

    const actor = await this.getActor('Lead')

    await this.sendAndFollowNamedTx(currentAccount, 'content', 'setFeaturedVideos', [actor, featuredVideoIds])
  }
}
