import { flags } from '@oclif/command'
import { IMembershipMetadata, MembershipMetadata } from '@joystream/metadata-protobuf'
import chalk from 'chalk'
import MembershipsCommandBase from '../../base/MembershipsCommandBase'
import { metadataToBytes } from '../../helpers/serialization'

export default class MembershipUpdateCommand extends MembershipsCommandBase {
  static description = 'Update existing membership metadata and/or handle.'
  static flags = {
    newHandle: flags.string({
      required: false,
      description: "Member's new handle",
    }),
    newName: flags.string({
      required: false,
      description: "Member's new first name / full name",
    }),
    newAvatarUri: flags.string({
      required: false,
      description: "Member's new avatar uri",
    }),
    newAbout: flags.string({
      required: false,
      description: "Member's new md-formatted about text (bio)",
    }),
    ...MembershipsCommandBase.flags,
  }

  async run(): Promise<void> {
    const api = this.getOriginalApi()
    const { newHandle, newName, newAvatarUri, newAbout } = this.parse(MembershipUpdateCommand).flags
    const {
      id: memberId,
      membership: { controller_account: controllerKey },
    } = await this.getRequiredMemberContext()

    const newMetadata: IMembershipMetadata | null =
      newName !== undefined || newAvatarUri !== undefined || newAbout !== undefined
        ? {
            name: newName,
            about: newAbout,
            avatarUri: newAvatarUri,
          }
        : null
    this.jsonPrettyPrint(JSON.stringify({ memberId, newHandle, newMetadata }))
    await this.requireConfirmation('Do you confirm the provided input?')

    await this.sendAndFollowTx(
      await this.getDecodedPair(controllerKey),
      api.tx.members.updateProfile(memberId, newHandle ?? null, metadataToBytes(MembershipMetadata, newMetadata))
    )

    this.log(chalk.green(`Membership with id ${chalk.cyanBright(memberId.toString())} successfully updated!`))
  }
}
