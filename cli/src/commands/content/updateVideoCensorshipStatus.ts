import ContentDirectoryCommandBase from '../../base/ContentDirectoryCommandBase'
import chalk from 'chalk'
import ExitCodes from '../../ExitCodes'

export default class UpdateVideoCensorshipStatusCommand extends ContentDirectoryCommandBase {
  static description = 'Update Video censorship status (Censored / Not censored).'
  static flags = {
    context: ContentDirectoryCommandBase.ownerContextFlag,
  }

  static args = [
    {
      name: 'id',
      required: true,
      description: 'ID of the Video',
    },
    {
      name: 'status',
      required: false,
      description: 'New video censorship status (1 - censored, 0 - not censored)',
    },
    {
      name: 'rationale',
      required: true,
      description: 'rationale',
    },
  ]

  async run() {
    let { context } = this.parse(UpdateVideoCensorshipStatusCommand).flags

    let { id, status, rationale } = this.parse(UpdateVideoCensorshipStatusCommand).args

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
        this.error('Invalid status provided. Use "1" for Censored and "0" for Not censored.', {
          exit: ExitCodes.InvalidInput,
        })
      }
      status = !!parseInt(status)
    }

    await this.sendAndFollowNamedTx(currentAccount, 'content', 'updateVideoCensorshipStatus', [
      actor,
      id,
      status,
      rationale,
    ])

    console.log(
      chalk.green(
        `Video ${chalk.white(id)} censorship status succesfully changed to: ${chalk.white(
          status ? 'Censored' : 'Not censored'
        )}!`
      )
    )
  }
}
