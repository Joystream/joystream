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

  static flags = {
    ...ContentDirectoryCommandBase.flags,
  }

  async run(): Promise<void> {
    const { featuredVideoIds } = this.parse(SetFeaturedVideosCommand).args

    const [actor, address] = await this.getContentActor('Lead')

    await this.sendAndFollowNamedTx(await this.getDecodedPair(address), 'content', 'setFeaturedVideos', [
      actor,
      (featuredVideoIds as string).split(','),
    ])
  }
}
