import MediaCommandBase from '../../base/MediaCommandBase'
import { LicenseEntity, VideoEntity } from '@joystream/cd-schemas/types/entities'
import { InputParser } from '@joystream/cd-schemas'
import { Entity } from '@joystream/types/content-directory'
import { createType } from '@joystream/types'

export default class UpdateVideoLicenseCommand extends MediaCommandBase {
  static description = 'Update existing video license (requires controller/maintainer access).'
  // TODO: ...IOFlags, - providing input as json

  static args = [
    {
      name: 'id',
      description: 'ID of the Video',
      required: false,
    },
  ]

  async run() {
    const {
      args: { id },
    } = this.parse(UpdateVideoLicenseCommand)

    const account = await this.getRequiredSelectedAccount()
    const memberId = await this.getRequiredMemberId()
    const actor = createType('Actor', { Member: memberId })

    await this.requestAccountDecoding(account)

    let videoEntity: Entity, videoId: number
    if (id) {
      videoId = parseInt(id)
      videoEntity = await this.getEntity(videoId, 'Video', memberId)
    } else {
      const [id, video] = await this.promptForEntityEntry('Select a video to update', 'Video', 'title', memberId)
      videoId = id.toNumber()
      videoEntity = video
    }

    const video = await this.parseToKnownEntityJson<VideoEntity>(videoEntity)
    const currentLicense = await this.getAndParseKnownEntity<LicenseEntity>(video.license)

    this.log('Current license:', currentLicense)

    const updateInput: Partial<VideoEntity> = {
      license: await this.promptForNewLicense(),
    }

    const api = this.getOriginalApi()
    const inputParser = InputParser.createWithKnownSchemas(this.getOriginalApi())
    const videoUpdateOperations = await inputParser.getEntityUpdateOperations(updateInput, 'Video', videoId)

    this.log('Setting new license...')
    await this.sendAndFollowTx(account, api.tx.contentDirectory.transaction(actor, videoUpdateOperations), true)

    this.log(`Removing old License entity (ID: ${video.license})...`)
    await this.sendAndFollowTx(account, api.tx.contentDirectory.removeEntity(actor, video.license))
  }
}
