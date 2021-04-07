import ContentDirectoryCommandBase from '../../base/ContentDirectoryCommandBase'
// import chalk from 'chalk'
import { displayTable } from '../../helpers/display'

export default class ChannelsCommand extends ContentDirectoryCommandBase {
  static description = 'List existing content directory channels.'

  async run() {
    const channels = await this.getApi().availableChannels()

    if (channels.length > 0) {
      displayTable(
        channels.map(([id, c]) => ({
          'ID': id.toString(),
          'Owner': JSON.stringify(c.owner.toJSON()),
          'IsCensored': c.is_censored.toString(),
          'RewardAccount': c.reward_account ? c.reward_account.toString() : 'NONE',
        })),
        3
      )
    } else {
      this.log('There are no channels yet')
    }
  }
}
