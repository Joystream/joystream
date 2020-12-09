import ContentDirectoryCommandBase from '../../base/ContentDirectoryCommandBase'
import { ChannelEntity } from '@joystream/cd-schemas/types/entities/ChannelEntity'
import { displayTable } from '../../helpers/display'
import chalk from 'chalk'

export default class MyChannelsCommand extends ContentDirectoryCommandBase {
  static description = "Show the list of channels associated with current account's membership."

  async run() {
    const memberId = await this.getRequiredMemberId()

    const props: (keyof ChannelEntity)[] = ['handle', 'isPublic']

    const list = await this.createEntityList('Channel', props, [], memberId)

    if (list.length) {
      displayTable(list, 3)
      this.log(
        `\nTIP: Use ${chalk.bold('content-directory:entity ID')} command to see more details about given channel`
      )
    } else {
      this.log(`No channels created yet! Create a channel with ${chalk.bold('media:createChannel')}`)
    }
  }
}
