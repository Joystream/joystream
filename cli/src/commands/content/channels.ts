import { formatBalance } from '@polkadot/util'
import ContentDirectoryCommandBase from '../../base/ContentDirectoryCommandBase'
// import chalk from 'chalk'
import { displayTable } from '../../helpers/display'

export default class ChannelsCommand extends ContentDirectoryCommandBase {
  static description = 'List existing content directory channels.'

  static flags = {
    ...ContentDirectoryCommandBase.flags,
  }

  async run(): Promise<void> {
    const channels = await this.getApi().availableChannels()

    if (channels.length > 0) {
      displayTable(
        channels.map(([id, c]) => ({
          'ID': id.toString(),
          'Owner': JSON.stringify(c.owner.toJSON()),
          'Collaborators': c.collaborators.size,
          'ChannelStateBloatBond': formatBalance(c.channelStateBloatBond),
          'DataObjects': c.dataObjects.toString(),
          'PrivilegeLevel': c.privilegeLevel.toString(),
          'NumberOfVideos': c.numVideos.toNumber(),
        })),
        3
      )
    } else {
      this.log('There are no channels yet')
    }
  }
}
