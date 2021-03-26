import ContentDirectoryCommandBase from '../../base/ContentDirectoryCommandBase'
import chalk from 'chalk'
import ExitCodes from '../../ExitCodes'

export default class UpdateChannelCensorshipStatusCommand extends ContentDirectoryCommandBase {
  static description = 'Update Channel censorship status (Censored / Not censored).'
  static flags = {
    context: ContentDirectoryCommandBase.ownerContextFlag,
  }

  static args = [
    {
      name: 'id',
      required: true,
      description: 'ID of the Channel',
    },
    {
      name: 'status',
      required: false,
      description: 'New status of the channel (1 - censored, 0 - not censored)',
    },
    {
      name: 'rationale',
      required: true,
      description: 'rationale',
    },
  ]

  async run() {
    let { context } = this.parse(UpdateChannelCensorshipStatusCommand).flags

    let { id, status, rationale } = this.parse(UpdateChannelCensorshipStatusCommand).args

    if (!context) {
      context = await this.promptForOwnerContext()
    }

    const currentAccount = await this.getRequiredSelectedAccount()
    await this.requestAccountDecoding(currentAccount)

    const actor = await this.getActor(context)

    if (status === undefined) {
      status = await this.simplePrompt({
        type: 'list',
        message: 'Select new status',
        choices: [
          { name: 'Censored', value: true },
          { name: 'Not censored', value: false },
        ],
      })
    } else {
      if (status !== '0' && status !== '1') {
        this.error('Invalid status provided. Use "1" for censored and "0" for not censored.', {
          exit: ExitCodes.InvalidInput,
        })
      }
      status = !!parseInt(status)
    }

    await this.sendAndFollowNamedTx(currentAccount, 'content', 'updateChannelCensorshipStatus', [
      actor,
      id,
      status,
      rationale,
    ])

    console.log(
      chalk.green(
        `Channel ${chalk.white(id)} censorship status succesfully changed to: ${chalk.white(
          status ? 'Censored' : 'Not censored'
        )}!`
      )
    )
  }
}
