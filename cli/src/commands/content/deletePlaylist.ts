import ContentDirectoryCommandBase from '../../base/ContentDirectoryCommandBase'
import { flags } from '@oclif/command'
import BN from 'bn.js'
import chalk from 'chalk'
import { formatBalance } from '@polkadot/util'
import { createType } from '@joystream/types'
import ExitCodes from '../../ExitCodes'

export default class DeletePlaylistCommand extends ContentDirectoryCommandBase {
  static description = 'Delete the playlist and optionally all associated data objects.'

  protected requiresQueryNode = true

  static flags = {
    playlistId: flags.integer({
      char: 'v',
      required: true,
      description: 'ID of the Playlist',
    }),
    force: flags.boolean({
      char: 'f',
      default: false,
      description: 'Force-remove all associated playlist data objects',
    }),
    context: ContentDirectoryCommandBase.channelManagementContextFlag,
    ...ContentDirectoryCommandBase.flags,
  }

  async getDataObjectsInfo(playlistId: number): Promise<[string, BN][]> {
    const dataObjects = await this.getQNApi().dataObjectsByPlaylistId(playlistId.toString())

    if (dataObjects.length) {
      this.log('Following data objects are still associated with the playlist:')
      dataObjects.forEach((o) => {
        this.log(`${o.id} - ${o.type.__typename}`)
      })
    }

    return dataObjects.map((o) => [o.id, new BN(o.deletionPrize)])
  }

  async run(): Promise<void> {
    const {
      flags: { playlistId, force, context },
    } = this.parse(DeletePlaylistCommand)
    // Context
    const playlist = await this.getApi().videoById(playlistId)
    const channel = await this.getApi().channelById(playlist.in_channel.toNumber())
    const [actor, address] = await this.getChannelManagementActor(channel, context)

    const dataObjectsInfo = await this.getDataObjectsInfo(playlistId)
    if (dataObjectsInfo.length) {
      if (!force) {
        this.error(`Cannot remove associated data objects unless ${chalk.magentaBright('--force')} flag is used`, {
          exit: ExitCodes.InvalidInput,
        })
      }
      const deletionPrize = dataObjectsInfo.reduce((sum, [, prize]) => sum.add(prize), new BN(0))
      this.log(
        `Data objects deletion prize of ${chalk.cyanBright(
          formatBalance(deletionPrize)
        )} will be transferred to ${chalk.magentaBright(address)}`
      )
    }

    await this.requireConfirmation(
      `Are you sure you want to remove playlist ${chalk.magentaBright(playlistId)}${
        force ? ' and all associated data objects' : ''
      }?`
    )

    await this.sendAndFollowNamedTx(await this.getDecodedPair(address), 'content', 'deleteVideo', [
      actor,
      playlistId,
      createType(
        'BTreeSet<DataObjectId>',
        dataObjectsInfo.map(([id]) => id)
      ),
    ])
  }
}
