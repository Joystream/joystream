import ContentDirectoryCommandBase from '../../base/ContentDirectoryCommandBase'
import chalk from 'chalk'

export default class AddMaintainerToClassCommand extends ContentDirectoryCommandBase {
  static description = 'Remove maintainer (Curator Group) from class.'
  static args = [
    {
      name: 'className',
      required: false,
      description: 'Name or ID of the class (ie. Video)',
    },
    {
      name: 'groupId',
      required: false,
      description: 'ID of the Curator Group to remove from maintainers',
    },
  ]

  async run() {
    const account = await this.getRequiredSelectedAccount()
    await this.requireLead()

    let { groupId, className } = this.parse(AddMaintainerToClassCommand).args

    if (className === undefined) {
      className = (await this.promptForClass()).name.toString()
    }

    const [classId, aClass] = await this.classEntryByNameOrId(className)

    if (groupId === undefined) {
      groupId = await this.promptForCuratorGroup('Select a maintainer', aClass.class_permissions.maintainers.toArray())
    } else {
      await this.getCuratorGroup(groupId)
    }

    await this.requestAccountDecoding(account)
    await this.sendAndFollowNamedTx(account, 'contentDirectory', 'removeMaintainerFromClass', [classId, groupId])

    console.log(
      chalk.green(`Curator Group ${chalk.white(groupId)} removed as maintainer of ${chalk.white(className)} class!`)
    )
  }
}
