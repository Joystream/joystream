import ContentDirectoryCommandBase from '../../base/ContentDirectoryCommandBase'

export default class SetFeaturedVideosCommand extends ContentDirectoryCommandBase {
  static description = 'Set featured videos. Requires lead access.'

  static args = [
    {
      name: 'featuredVideoIds',
      required: true,
      description: 'Comma-separated video IDs (ie. 1,2,3)',
    },
  ]

  async run() {
    const { featuredVideoIds } = this.parse(SetFeaturedVideosCommand).args

    const currentAccount = await this.getRequiredSelectedAccount()
    await this.requestAccountDecoding(currentAccount)

    const actor = await this.getActor('Lead')

    await this.sendAndFollowNamedTx(currentAccount, 'content', 'setFeaturedVideos', [
      actor,
      (featuredVideoIds as string).split(','),
    ])
  }
}
