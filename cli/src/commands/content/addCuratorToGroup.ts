import ContentDirectoryCommandBase from '../../base/ContentDirectoryCommandBase'
import chalk from 'chalk'

export default class AddCuratorToGroupCommand extends ContentDirectoryCommandBase {
  static description = 'Add Curator to existing Curator Group.'
  static args = [
    {
      name: 'groupId',
      required: false,
      description: 'ID of the Curator Group',
    },
    {
      name: 'curatorId',
      required: false,
      description: 'ID of the curator',
    },
  ]

  async run() {
    const account = await this.getRequiredSelectedAccount()
    await this.requireLead()

    let { groupId, curatorId } = this.parse(AddCuratorToGroupCommand).args

    if (groupId === undefined) {
      groupId = await this.promptForCuratorGroup()
    } else {
      await this.getCuratorGroup(groupId)
    }

    if (curatorId === undefined) {
      curatorId = await this.promptForCurator()
    } else {
      await this.getCurator(curatorId)
    }

    await this.requestAccountDecoding(account)
    await this.sendAndFollowNamedTx(account, 'content', 'addCuratorToGroup', [groupId, curatorId])

    console.log(
      chalk.green(
        `Curator ${chalk.magentaBright(curatorId)} successfully added to group ${chalk.magentaBright(groupId)}!`
      )
    )
  }
}
