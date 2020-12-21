import ContentDirectoryCommandBase from '../../base/ContentDirectoryCommandBase'
import { Entity } from '@joystream/types/content-directory'
import { VideoEntity } from '@joystream/cd-schemas/types/entities'
import { createType } from '@joystream/types'

export default class RemoveVideoCommand extends ContentDirectoryCommandBase {
  static description = 'Remove given Video entity and associated entities (VideoMedia, License) from content directory.'
  static args = [
    {
      name: 'id',
      required: false,
      description: 'ID of the Video entity',
    },
  ]

  async run() {
    const {
      args: { id },
    } = this.parse(RemoveVideoCommand)

    const account = await this.getRequiredSelectedAccount()
    const memberId = await this.getRequiredMemberId()
    const actor = createType('Actor', { Member: memberId })

    await this.requestAccountDecoding(account)

    let videoEntity: Entity, videoId: number
    if (id) {
      videoId = parseInt(id)
      videoEntity = await this.getEntity(videoId, 'Video', memberId)
    } else {
      const [id, video] = await this.promptForEntityEntry('Select a video to remove', 'Video', 'title', memberId)
      videoId = id.toNumber()
      videoEntity = video
    }

    const video = await this.parseToEntityJson<VideoEntity>(videoEntity)

    await this.requireConfirmation(`Are you sure you want to remove the "${video.title}" video?`)

    const api = this.getOriginalApi()
    this.log(`Removing the Video entity (ID: ${videoId})...`)
    await this.sendAndFollowTx(account, api.tx.contentDirectory.removeEntity(actor, videoId))
    this.log(`Removing the VideoMedia entity (ID: ${video.media})...`)
    await this.sendAndFollowTx(account, api.tx.contentDirectory.removeEntity(actor, video.media))
    this.log(`Removing the License entity (ID: ${video.license})...`)
    await this.sendAndFollowTx(account, api.tx.contentDirectory.removeEntity(actor, video.license))
  }
}
