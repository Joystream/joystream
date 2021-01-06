import ContentDirectoryCommandBase from '../../base/ContentDirectoryCommandBase'
import { Entity } from '@joystream/types/content-directory'
import { createType } from '@joystream/types'
import { ChannelEntity } from '@joystream/cd-schemas/types/entities'

export default class RemoveChannelCommand extends ContentDirectoryCommandBase {
  static description = 'Removes a channel (required controller access).'
  static args = [
    {
      name: 'id',
      required: false,
      description: 'ID of the Channel entity',
    },
  ]

  async run() {
    const {
      args: { id },
    } = this.parse(RemoveChannelCommand)

    const account = await this.getRequiredSelectedAccount()
    const memberId = await this.getRequiredMemberId()
    const actor = createType('Actor', { Member: memberId })

    await this.requestAccountDecoding(account)

    let channelEntity: Entity, channelId: number
    if (id) {
      channelId = parseInt(id)
      channelEntity = await this.getEntity(channelId, 'Channel', memberId)
    } else {
      const [id, channel] = await this.promptForEntityEntry('Select a channel to remove', 'Channel', 'handle', memberId)
      channelId = id.toNumber()
      channelEntity = channel
    }
    const channel = await this.parseToEntityJson<ChannelEntity>(channelEntity)

    await this.requireConfirmation(`Are you sure you want to remove "${channel.handle}" channel?`)

    const api = this.getOriginalApi()
    this.log(`Removing Channel entity (ID: ${channelId})...`)
    await this.sendAndFollowTx(account, api.tx.contentDirectory.removeEntity(actor, channelId))
  }
}
