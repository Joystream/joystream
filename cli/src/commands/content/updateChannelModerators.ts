import ContentDirectoryCommandBase from '../../base/ContentDirectoryCommandBase'
import chalk from 'chalk'
import { flags } from '@oclif/command'
import { BTreeSet } from '@polkadot/types'
import { createType } from '@joystream/types'
import { MemberId } from '@joystream/types/common'

export default class UpdateChannelModeratorsCommand extends ContentDirectoryCommandBase {
  static description = "Update Channel's moderator set."
  static flags = {
    channelId: flags.integer({
      char: 'c',
      required: true,
      description: 'Channel id',
    }),
    moderators: flags.integer({
      char: 'm',
      required: false,
      multiple: true,
      description: 'New set of moderators',
    }),
    ...ContentDirectoryCommandBase.flags,
  }

  static examples = ['$ content:updateChannelModerators -c 1 -m 1 2 3']

  async run(): Promise<void> {
    const {
      flags: { channelId, moderators },
    } = this.parse(UpdateChannelModeratorsCommand)

    const channel = await this.getApi().channelById(channelId)
    const [actor, address] = await this.getChannelOwnerActor(channel)

    this.jsonPrettyPrint(
      JSON.stringify({
        channelId,
        moderators: moderators || [],
      })
    )
    await this.requireConfirmation('Do you confirm the provided input?', true)

    await this.sendAndFollowNamedTx(await this.getDecodedPair(address), 'content', 'updateModeratorSet', [
      actor,
      createType<BTreeSet<MemberId>, 'BTreeSet<MemberId>'>('BTreeSet<MemberId>', moderators || []),
      channelId,
    ])

    console.log(
      chalk.green(
        `Channel ${chalk.magentaBright(channelId)} moderator set successfully updated to: ${
          moderators?.length ? moderators.map((mId) => chalk.magentaBright(mId.toString())).join(', ') : '<empty set>'
        }!`
      )
    )
  }
}
