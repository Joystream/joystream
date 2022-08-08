import ContentDirectoryCommandBase from '../../base/ContentDirectoryCommandBase'
import { displayCollapsedRow, displayHeader, displayTable } from '../../helpers/display'
import { PalletContentChannelActionPermission } from '@polkadot/types/lookup'
import { BTreeSet } from '@polkadot/types'
import BN from 'bn.js'
import { formatBalance } from '@polkadot/util'

export default class ChannelCommand extends ContentDirectoryCommandBase {
  static description = 'Show Channel details by id.'
  static args = [
    {
      name: 'channelId',
      required: true,
      description: 'Name or ID of the Channel',
    },
  ]

  static flags = {
    ...ContentDirectoryCommandBase.flags,
  }

  async displayCollaboratorsSet(set: [BN, BTreeSet<PalletContentChannelActionPermission>][]): Promise<void> {
    if (set.length > 0) {
      displayTable(
        set.map(([id, p]) => ({
          'MemberId': id.toString(),
          'Permissions': p.toString(),
        })),
        3
      )
    } else {
      this.log('NONE')
    }
  }

  async run(): Promise<void> {
    const { channelId } = this.parse(ChannelCommand).args
    const channel = await this.getApi().channelById(channelId)
    if (channel) {
      displayCollapsedRow({
        'ID': channelId.toString(),
        'Owner': JSON.stringify(channel.owner.toJSON()),
        'ChannelStateBloatBond': formatBalance(channel.channelStateBloatBond),
        'DataObjects': channel.dataObjects.toString(),
        'PrivilegeLevel': channel.privilegeLevel.toString(),
      })

      displayHeader(`Media`)
      displayCollapsedRow({
        'NumberOfVideos': channel.numVideos.toNumber(),
      })

      displayHeader(`Collaborators`)
      await this.displayCollaboratorsSet([...channel.collaborators])
    } else {
      this.error(`Channel not found by channel id: "${channelId}"!`)
    }
  }
}
