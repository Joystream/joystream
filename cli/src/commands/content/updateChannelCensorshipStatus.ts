import ContentDirectoryCommandBase from '../../base/ContentDirectoryCommandBase'
import chalk from 'chalk'
import ExitCodes from '../../ExitCodes'
import { flags } from '@oclif/command'

export default class UpdateChannelCensorshipStatusCommand extends ContentDirectoryCommandBase {
  static description = 'Update Channel censorship status (Censored / Not censored).'
  static flags = {
    rationale: flags.string({
      name: 'rationale',
      required: false,
      description: 'rationale',
    }),
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
      description: 'New censorship status of the channel (1 - censored, 0 - not censored)',
    },
  ]

  async run() {
    let {
      args: { id, status },
      flags: { rationale },
    } = this.parse(UpdateChannelCensorshipStatusCommand)

    const currentAccount = await this.getRequiredSelectedAccount()

    const channel = await this.getApi().channelById(id)
    const actor = await this.getCurationActorByChannel(channel)

    await this.requestAccountDecoding(currentAccount)

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

    if (rationale === undefined) {
      rationale = await this.simplePrompt({ message: 'Please provide the rationale for updating the status' })
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
