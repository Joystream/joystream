import ContentDirectoryCommandBase from '../../base/ContentDirectoryCommandBase'
import { flags } from '@oclif/command'
import chalk from 'chalk'
import { createTypeFromConstructor, registry } from '@joystream/types'
import { BagId, DataObjectId } from '@joystream/types/storage'
import ExitCodes from '../../ExitCodes'
import { formatBalance } from '@polkadot/util'
import { JoyBTreeSet } from '@joystream/types/common'
import BN from 'bn.js'

export default class DeleteChannelCommand extends ContentDirectoryCommandBase {
  static description = 'Delete the channel and optionally all associated data objects.'

  static flags = {
    channelId: flags.integer({
      char: 'c',
      required: true,
      description: 'ID of the Channel',
    }),
    force: flags.boolean({
      char: 'f',
      default: false,
      description: 'Force-remove all associated channel data objects',
    }),
  }

  async getDataObjectsInfoFromQueryNode(channelId: number): Promise<[string, BN][]> {
    const dataObjects = await this.getQNApi().dataObjectsByBagId(`dynamic:channel:${channelId}`)

    if (dataObjects.length) {
      this.log('Following data objects are still associated with the channel:')
      dataObjects.forEach((o) => {
        let parentStr = ''
        if ('video' in o.type && o.type.video) {
          parentStr = ` (video: ${o.type.video.id})`
        }
        this.log(`- ${o.id} - ${o.type.__typename}${parentStr}`)
      })
    }

    return dataObjects.map((o) => [o.id, new BN(o.deletionPrize)])
  }

  async getDataObjectsInfoFromChain(channelId: number): Promise<[string, BN][]> {
    const dataObjects = await this.getApi().dataObjectsInBag(
      createTypeFromConstructor(BagId, { Dynamic: { Channel: channelId } })
    )

    if (dataObjects.length) {
      const dataObjectIds = dataObjects.map(([id]) => id.toString())
      this.log(`Following data objects are still associated with the channel: ${dataObjectIds.join(', ')}`)
    }

    return dataObjects.map(([id, o]) => [id.toString(), o.deletion_prize])
  }

  async run(): Promise<void> {
    const {
      flags: { channelId, force },
    } = this.parse(DeleteChannelCommand)
    // Context
    const account = await this.getRequiredSelectedAccount()
    const channel = await this.getApi().channelById(channelId)
    const actor = await this.getChannelOwnerActor(channel)
    await this.requestAccountDecoding(account)

    if (channel.num_videos.toNumber()) {
      this.error(
        `This channel still has ${channel.num_videos.toNumber()} associated video(s)!\n` +
          `Delete the videos first using ${chalk.magentaBright('content:deleteVideo')} command`
      )
    }

    const dataObjectsInfo = this.isQueryNodeUriSet()
      ? await this.getDataObjectsInfoFromQueryNode(channelId)
      : await this.getDataObjectsInfoFromChain(channelId)

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
        )} will be transferred to ${chalk.magentaBright(channel.deletion_prize_source_account_id.toString())}`
      )
    }

    await this.requireConfirmation(
      `Are you sure you want to remove channel ${chalk.magentaBright(channelId.toString())}${
        force ? ' and all associated data objects' : ''
      }?`
    )

    await this.sendAndFollowNamedTx(account, 'content', 'deleteChannel', [
      actor,
      channelId,
      new (JoyBTreeSet(DataObjectId))(
        registry,
        dataObjectsInfo.map(([id]) => id)
      ),
    ])
  }
}
