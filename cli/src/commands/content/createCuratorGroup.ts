import ContentDirectoryCommandBase from '../../base/ContentDirectoryCommandBase'
import chalk from 'chalk'
import { flags } from '@oclif/command'
import { ModerationPermissionsByLevelInputParameters } from '../../Types'
import { getInputJson } from '../../helpers/InputOutput'
import { ModerationPermissionsByLevelInputSchema } from '../../schemas/ContentDirectory'
import { createType } from '@joystream/types'

const CURATOR_GROUP_CREATION_CONTEXTS = ['ACTIVE', 'INACTIVE'] as const

export default class CreateCuratorGroupCommand extends ContentDirectoryCommandBase {
  static description = 'Create new Curator Group.'
  static flags = {
    status: flags.enum({
      required: true,
      description: `Status of newly created Curator Group: (${CURATOR_GROUP_CREATION_CONTEXTS.join('/')})`,
      options: [...CURATOR_GROUP_CREATION_CONTEXTS],
    }),
    permissions: flags.string({
      char: 'p',
      description: `Path to JSON file containing moderation permissions by channel privilege level to use as input`,
    }),
    ...ContentDirectoryCommandBase.flags,
  }

  async run(): Promise<void> {
    const { status, permissions } = this.parse(CreateCuratorGroupCommand).flags
    const lead = await this.getRequiredLeadContext()
    const keypair = await this.getDecodedPair(lead.roleAccount)

    const moderationPermissionsByLevelInput = permissions
      ? await getInputJson<ModerationPermissionsByLevelInputParameters>(
          permissions,
          ModerationPermissionsByLevelInputSchema
        )
      : []

    const moderationPermissionsByLevel = createType(
      'BTreeMap<u8,BTreeSet<PalletContentPermissionsCuratorGroupContentModerationAction>>',
      new Map(
        moderationPermissionsByLevelInput.map(({ channelPrivilegeLevel, permissions }) => [
          channelPrivilegeLevel,
          permissions,
        ])
      )
    )
    await this.sendAndFollowNamedTx(keypair, 'content', 'createCuratorGroup', [
      status === 'ACTIVE',
      moderationPermissionsByLevel,
    ])
    // TODO: Get id from event?
    console.log(chalk.green(`New group successfully created!`))
  }
}
