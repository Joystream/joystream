import ContentDirectoryCommandBase from '../../base/ContentDirectoryCommandBase'
import chalk from 'chalk'
import ExitCodes from '../../ExitCodes'

export default class SetCuratorGroupStatusCommand extends ContentDirectoryCommandBase {
  static description = 'Set Curator Group status (Active/Inactive).'
  static args = [
    {
      name: 'id',
      required: false,
      description: 'ID of the Curator Group',
    },
    {
      name: 'status',
      required: false,
      description: 'New status of the group (1 - active, 0 - inactive)',
    },
  ]

  static flags = {
    ...ContentDirectoryCommandBase.flags,
  }

  async run(): Promise<void> {
    const lead = await this.getRequiredLeadContext()

    let { id, status } = this.parse(SetCuratorGroupStatusCommand).args

    if (id === undefined) {
      id = await this.promptForCuratorGroup()
    } else {
      await this.getCuratorGroup(id)
    }

    if (status === undefined) {
      status = await this.simplePrompt({
        type: 'list',
        message: 'Select new status',
        choices: [
          { name: 'Active', value: true },
          { name: 'Inactive', value: false },
        ],
      })
    } else {
      if (status !== '0' && status !== '1') {
        this.error('Invalid status provided. Use "1" for Active and "0" for Inactive.', {
          exit: ExitCodes.InvalidInput,
        })
      }
      status = !!parseInt(status)
    }

    await this.sendAndFollowNamedTx(await this.getDecodedPair(lead.roleAccount), 'content', 'setCuratorGroupStatus', [
      id,
      status,
    ])

    console.log(
      chalk.green(
        `Curator Group ${chalk.magentaBright(id)} status successfully changed to: ${chalk.magentaBright(
          status ? 'Active' : 'Inactive'
        )}!`
      )
    )
  }
}
