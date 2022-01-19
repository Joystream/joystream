import ContentDirectoryCommandBase from '../../base/ContentDirectoryCommandBase'
import { displayCollapsedRow, displayHeader, memberHandle } from '../../helpers/display'
import { BTreeSet } from '@polkadot/types'
import { MemberId } from '@joystream/types/common'

export default class ChannelCommand extends ContentDirectoryCommandBase {
  static description = 'Show Channel details by id.'
  static args = [
    {
      name: 'channelId',
      required: true,
      description: 'Name or ID of the Channel',
    },
  ]

  async displayMembersSet(set: BTreeSet<MemberId>): Promise<void> {
    const ids = Array.from(set)
    const members = await this.getApi().membersDetailsByIds(ids)
    this.log(members.length ? members.map((m) => `${m.id} (${memberHandle(m)})`).join(', ') : 'NONE')
  }

  async run(): Promise<void> {
    const { channelId } = this.parse(ChannelCommand).args
    const channel = await this.getApi().channelById(channelId)
    if (channel) {
      displayCollapsedRow({
        'ID': channelId.toString(),
        'Owner': JSON.stringify(channel.owner.toJSON()),
        'IsCensored': channel.is_censored.toString(),
        'RewardAccount': channel.reward_account.unwrapOr('NONE').toString(),
      })

      displayHeader(`Media`)
      displayCollapsedRow({
        'NumberOfVideos': channel.num_videos.toNumber(),
      })

      displayHeader(`Collaborators`)
      await this.displayMembersSet(channel.collaborators)

      displayHeader('Moderators')
      await this.displayMembersSet(channel.moderators)
    } else {
      this.error(`Channel not found by channel id: "${channelId}"!`)
    }
  }
}
