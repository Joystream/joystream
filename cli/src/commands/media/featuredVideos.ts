import ContentDirectoryCommandBase from '../../base/ContentDirectoryCommandBase'
import { displayTable } from '../../helpers/display'
import { FeaturedVideoEntity, VideoEntity } from '@joystream/cd-schemas/types/entities'
import chalk from 'chalk'

export default class FeaturedVideosCommand extends ContentDirectoryCommandBase {
  static description = 'Show a list of currently featured videos.'

  async run() {
    const featuredEntries = await this.entitiesByClassAndOwner('FeaturedVideo')
    const featured = await Promise.all(
      featuredEntries
        .filter(([, entity]) => entity.supported_schemas.toArray().length) // Ignore FeaturedVideo entities without schema
        .map(([, entity]) => this.parseToKnownEntityJson<FeaturedVideoEntity>(entity))
    )

    const videoIds: number[] = featured.map(({ video: videoId }) => videoId)

    const videos = await Promise.all(videoIds.map((videoId) => this.getAndParseKnownEntity<VideoEntity>(videoId)))

    if (videos.length) {
      displayTable(
        videos.map(({ title, channel }, index) => ({
          featuredVideoEntityId: featuredEntries[index][0].toNumber(),
          videoId: videoIds[index],
          channelId: channel,
          title,
        })),
        3
      )
      this.log(`\nTIP: Use ${chalk.bold('content-directory:entity ID')} command to see more details about given video`)
    } else {
      this.log(`No videos have been featured yet! Set some with ${chalk.bold('media:setFeaturedVideos')}`)
    }
  }
}
