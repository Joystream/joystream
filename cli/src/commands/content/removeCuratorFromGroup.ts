import ContentDirectoryCommandBase from '../../base/ContentDirectoryCommandBase'
import chalk from 'chalk'

export default class RemoveCuratorFromGroupCommand extends ContentDirectoryCommandBase {
  static description = 'Remove Curator from Curator Group.'
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

    let { groupId, curatorId } = this.parse(RemoveCuratorFromGroupCommand).args

    if (groupId === undefined) {
      groupId = await this.promptForCuratorGroup()
    }

    const group = await this.getCuratorGroup(groupId)
    const groupCuratorIds = group.curators.toArray().map((id) => id.toNumber())

    if (curatorId === undefined) {
      curatorId = await this.promptForCurator('Choose a Curator to remove', groupCuratorIds)
    } else {
      if (!groupCuratorIds.includes(parseInt(curatorId))) {
        this.error(`Curator ${chalk.white(curatorId)} is not part of group ${chalk.white(groupId)}`)
      }
      await this.getCurator(curatorId)
    }

    await this.requestAccountDecoding(account)
    await this.sendAndFollowNamedTx(account, 'content', 'removeCuratorFromGroup', [groupId, curatorId])

    this.log(chalk.green(`Curator ${chalk.white(curatorId)} successfully removed from group ${chalk.white(groupId)}!`))
  }
}
