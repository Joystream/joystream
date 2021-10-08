import ContentDirectoryCommandBase from '../../base/ContentDirectoryCommandBase'
import chalk from 'chalk'
import ExitCodes from '../../ExitCodes'
import { flags } from '@oclif/command'

export default class UpdateVideoCensorshipStatusCommand extends ContentDirectoryCommandBase {
  static description = 'Update Video censorship status (Censored / Not censored).'
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
      description: 'ID of the Video',
    },
    {
      name: 'status',
      required: false,
      description: 'New video censorship status (1 - censored, 0 - not censored)',
    },
  ]

  async run() {
    let {
      args: { id, status },
      flags: { rationale },
    } = this.parse(UpdateVideoCensorshipStatusCommand)

    const video = await this.getApi().videoById(id)
    const channel = await this.getApi().channelById(video.in_channel.toNumber())
    const [actor, address] = await this.getCurationActorByChannel(channel)

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

    if (rationale === undefined) {
      rationale = (await this.simplePrompt({
        message: 'Please provide the rationale for updating the status',
      })) as string
    }

    await this.sendAndFollowNamedTx(await this.getDecodedPair(address), 'content', 'updateVideoCensorshipStatus', [
      actor,
      id,
      status,
      rationale,
    ])

    console.log(
      chalk.green(
        `Video ${chalk.magentaBright(id)} censorship status successfully changed to: ${chalk.magentaBright(
          status ? 'Censored' : 'Not censored'
        )}!`
      )
    )
  }
}
