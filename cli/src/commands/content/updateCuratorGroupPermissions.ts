import ContentDirectoryCommandBase from '../../base/ContentDirectoryCommandBase'
import chalk from 'chalk'
import { flags } from '@oclif/command'
import { getInputJson } from '../../helpers/InputOutput'
import { ModerationPermissionsByLevelInputParameters } from '../../Types'
import { ModerationPermissionsByLevelInputSchema } from '../../schemas/ContentDirectory'
import { createType } from '@joystream/types'

export default class UpdateCuratorGroupPermissionsCommand extends ContentDirectoryCommandBase {
  static description = 'Update existing Curator Group.'
  static args = [
    {
      name: 'id',
      required: false,
      description: 'ID of the Curator Group',
    },
  ]

  static flags = {
    permissions: flags.string({
      char: 'p',
      required: true,
      description: `Path to JSON file containing moderation permissions by channel privilege level to use as input`,
    }),
    ...ContentDirectoryCommandBase.flags,
  }

  async run(): Promise<void> {
    let { id } = this.parse(UpdateCuratorGroupPermissionsCommand).args
    const { permissions } = this.parse(UpdateCuratorGroupPermissionsCommand).flags

    if (id === undefined) {
      id = await this.promptForCuratorGroup()
    } else {
      await this.getCuratorGroup(id)
    }

    const lead = await this.getRequiredLeadContext()
    const keypair = await this.getDecodedPair(lead.roleAccount)

    const moderationPermissionsByLevelInput = await getInputJson<ModerationPermissionsByLevelInputParameters>(
      permissions,
      ModerationPermissionsByLevelInputSchema
    )
    console.log(moderationPermissionsByLevelInput)

    const moderationPermissionsByLevel = createType(
      'BTreeMap<u8,BTreeSet<PalletContentPermissionsCuratorGroupContentModerationAction>>',
      new Map(
        moderationPermissionsByLevelInput.map(({ channelPrivilegeLevel, permissions }) => [
          channelPrivilegeLevel,
          permissions,
        ])
      )
    )

    await this.sendAndFollowNamedTx(keypair, 'content', 'updateCuratorGroupPermissions', [
      id,
      moderationPermissionsByLevel,
    ])

    console.log(chalk.green(`Curator Group permissions successfully updated!`))
  }
}
