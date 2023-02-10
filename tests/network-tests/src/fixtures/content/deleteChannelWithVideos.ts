import { Api } from '../../Api'
import { BaseQueryNodeFixture } from '../../Fixture'
import { QueryNodeApi } from '../../QueryNodeApi'
import { JoystreamCLI } from '../../cli/joystream'
import { Utils } from '../../utils'

export class DeleteChannelWithVideosFixture extends BaseQueryNodeFixture {
  private cli: JoystreamCLI
  private channelIds: number[]

  constructor(api: Api, query: QueryNodeApi, cli: JoystreamCLI, channelIds: number[]) {
    super(api, query)
    this.cli = cli
    this.channelIds = channelIds
  }

  /*
    Execute this Fixture.
  */
  public async execute(): Promise<void> {
    // Delete channels
    for (const channelId of this.channelIds) {
      this.debug(`Deleting channel ${channelId} & all of it's videos`)

      const channel = await this.query.channelById(channelId.toString())
      Utils.assert(channel, `Channel ${channelId} not found in query node`)
      const { videos } = channel

      // Delete videos
      for (const video of videos) {
        await this.cli.deleteVideo(Number(video.id))

        // Ensure video has been deleted
        await this.query.tryQueryWithTimeout(
          () => this.query.videoById(video.id),
          (qEvent) => {
            Utils.assert(qEvent === null, `Video ${video.id} under channel ${channelId} was not deleted!`)
          }
        )
      }

      await this.cli.deleteChannel(Number(channelId))

      // Ensure channel has been deleted
      await this.query.tryQueryWithTimeout(
        () => this.query.channelById(channelId.toString()),
        (qEvent) => {
          Utils.assert(qEvent === null, `Channel ${channelId} was not deleted!`)
        }
      )
    }

    this.debug('Done')
  }
}
