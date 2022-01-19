import ContentDirectoryCommandBase from '../../base/ContentDirectoryCommandBase'
// import chalk from 'chalk'
import { displayTable, shortAddress } from '../../helpers/display'

export default class ChannelsCommand extends ContentDirectoryCommandBase {
  static description = 'List existing content directory channels.'

  async run(): Promise<void> {
    const channels = await this.getApi().availableChannels()

    if (channels.length > 0) {
      displayTable(
        channels.map(([id, c]) => ({
          'ID': id.toString(),
          'Owner': JSON.stringify(c.owner.toJSON()),
          'IsCensored': c.is_censored.toString(),
          'RewardAccount': c.reward_account ? shortAddress(c.reward_account.toString()) : 'NONE',
          'Collaborators': c.collaborators.size,
          'Moderators': c.moderators.size,
        })),
        3
      )
    } else {
      this.log('There are no channels yet')
    }
  }
}
