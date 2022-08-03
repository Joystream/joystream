import { createType, keysOf } from '@joystream/types'
import { flags } from '@oclif/command'
import { PalletContentChannelActionPermission as ChannelActionPermission } from '@polkadot/types/lookup'
import chalk from 'chalk'
import ContentDirectoryCommandBase from '../../base/ContentDirectoryCommandBase'

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

  static flags = {
    permissions: flags.string({
      options: keysOf<ChannelActionPermission, 'PalletContentChannelActionPermission'>(
        'PalletContentChannelActionPermission'
      ),
      char: 'p',
      description: `List of permissions to associate with the curator, e.g. -p ManageChannelCollaborators UpdateVideoMetadata`,
      required: false,
      multiple: true,
    }),
    ...ContentDirectoryCommandBase.flags,
  }

  async run(): Promise<void> {
    const lead = await this.getRequiredLeadContext()

    let { groupId, curatorId } = this.parse(AddCuratorToGroupCommand).args
    const { permissions } = this.parse(AddCuratorToGroupCommand).flags

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

    await this.sendAndFollowNamedTx(await this.getDecodedPair(lead.roleAccount), 'content', 'addCuratorToGroup', [
      groupId,
      curatorId,
      createType(
        'BTreeSet<PalletContentChannelActionPermission>',
        (typeof permissions === 'string' ? [permissions] : permissions) as ChannelActionPermission['type'][]
      ),
    ])

    console.log(
      chalk.green(
        `Curator ${chalk.magentaBright(curatorId)} successfully added to group ${chalk.magentaBright(groupId)}!`
      )
    )
  }
}
