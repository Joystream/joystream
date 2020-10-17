import ContentDirectoryCommandBase from '../../base/ContentDirectoryCommandBase'
import chalk from 'chalk'

export default class AddMaintainerToClassCommand extends ContentDirectoryCommandBase {
  static description = 'Add maintainer (Curator Group) to a class.'
  static args = [
    {
      name: 'className',
      required: false,
      description: 'Name or ID of the class (ie. Video)',
    },
    {
      name: 'groupId',
      required: false,
      description: 'ID of the Curator Group to add as class maintainer',
    },
  ]

  async run() {
    const account = await this.getRequiredSelectedAccount()
    await this.requireLead()

    let { groupId, className } = this.parse(AddMaintainerToClassCommand).args

    if (className === undefined) {
      className = (await this.promptForClass()).name.toString()
    }

    const classId = (await this.classEntryByNameOrId(className))[0].toNumber()

    if (groupId === undefined) {
      groupId = await this.promptForCuratorGroup()
    } else {
      await this.getCuratorGroup(groupId)
    }

    await this.requestAccountDecoding(account)
    await this.sendAndFollowNamedTx(account, 'contentDirectory', 'addMaintainerToClass', [classId, groupId])

    console.log(
      chalk.green(`Curator Group ${chalk.white(groupId)} added as maintainer to ${chalk.white(className)} class!`)
    )
  }
}
