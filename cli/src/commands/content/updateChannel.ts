import { getInputJson } from '../../helpers/InputOutput'
import { asValidatedMetadata, metadataToBytes } from '../../helpers/serialization'
import { ChannelUpdateInputParameters } from '../../Types'
import { flags } from '@oclif/command'
import UploadCommandBase from '../../base/UploadCommandBase'
import { createType } from '@joystream/types'
import { ChannelUpdateInputSchema } from '../../schemas/ContentDirectory'
import { ChannelMetadata } from '@joystream/metadata-protobuf'
import { DataObjectInfoFragment } from '../../graphql/generated/queries'
import BN from 'bn.js'
import { formatBalance } from '@polkadot/util'
import chalk from 'chalk'
import ContentDirectoryCommandBase from '../../base/ContentDirectoryCommandBase'
import ExitCodes from '../../ExitCodes'
import { PalletContentChannelActionPermission as ChannelActionPermission } from '@polkadot/types/lookup'

export default class UpdateChannelCommand extends UploadCommandBase {
  static description = 'Update existing content directory channel.'
  static flags = {
    context: ContentDirectoryCommandBase.channelManagementContextFlag,
    input: flags.string({
      char: 'i',
      required: true,
      description: `Path to JSON file to use as input`,
    }),
    ...UploadCommandBase.flags,
  }

  static args = [
    {
      name: 'channelId',
      required: true,
      description: 'ID of the Channel',
    },
  ]

  async getAssetsToRemove(
    channelId: number,
    coverPhotoIndex: number | undefined,
    avatarPhotoIndex: number | undefined
  ): Promise<number[]> {
    let assetsToRemove: DataObjectInfoFragment[] = []
    if (coverPhotoIndex !== undefined || avatarPhotoIndex !== undefined) {
      const currentAssets = await this.getQNApi().dataObjectsByChannelId(channelId.toString())
      const currentCovers = currentAssets.filter((a) => a.type.__typename === 'DataObjectTypeChannelCoverPhoto')
      const currentAvatars = currentAssets.filter((a) => a.type.__typename === 'DataObjectTypeChannelAvatar')
      if (currentCovers.length && coverPhotoIndex !== undefined) {
        assetsToRemove = assetsToRemove.concat(currentCovers)
      }
      if (currentAvatars.length && avatarPhotoIndex !== undefined) {
        assetsToRemove = assetsToRemove.concat(currentAvatars)
      }
      if (assetsToRemove.length) {
        this.log(`\nData objects to be removed due to replacement:`)
        assetsToRemove.forEach((a) => this.log(`- ${a.id} (${a.type.__typename})`))
        const totalStateBloatBond = assetsToRemove.reduce(
          (sum, { stateBloatBond }) => sum.add(new BN(stateBloatBond)),
          new BN(0)
        )
        this.log(`Total state bloat bond: ${chalk.cyanBright(formatBalance(totalStateBloatBond))}\n`)
      }
    }

    return assetsToRemove.map((a) => Number(a.id))
  }

  async run(): Promise<void> {
    const {
      flags: { input, context },
      args: { channelId },
    } = this.parse(UpdateChannelCommand)

    // Context
    const channel = await this.getApi().channelById(channelId)
    const [actor, address] = await this.getChannelManagementActor(channel, context)
    const keypair = await this.getDecodedPair(address)

    const channelInput = await getInputJson<ChannelUpdateInputParameters>(input, ChannelUpdateInputSchema)
    const meta = asValidatedMetadata(ChannelMetadata, channelInput)
    const { collaborators, coverPhotoPath, avatarPhotoPath } = channelInput

    if (collaborators) {
      await this.validateMemberIdsSet(
        collaborators.map(({ memberId }) => memberId),
        'collaborator'
      )
    }

    const [resolvedAssets, assetIndices] = await this.resolveAndValidateAssets(
      { coverPhotoPath, avatarPhotoPath },
      input
    )
    // Set assets indices in the metadata
    // "undefined" values will be omitted when the metadata is encoded. It's not possible to "unset" an asset this way.
    meta.coverPhoto = assetIndices.coverPhotoPath
    meta.avatarPhoto = assetIndices.avatarPhotoPath

    // Prepare and send the extrinsic
    const serializedMeta = metadataToBytes(ChannelMetadata, meta)
    const expectedDataObjectStateBloatBond = await this.getApi().dataObjectStateBloatBond()
    const assetsToUpload = await this.prepareAssetsForExtrinsic(resolvedAssets)
    const assetsToRemove = await this.getAssetsToRemove(
      channelId,
      assetIndices.coverPhotoPath,
      assetIndices.avatarPhotoPath
    )

    // Ensure actor is authorized to perform channel update
    const requiredPermissions: ChannelActionPermission['type'][] = []
    if (collaborators) {
      requiredPermissions.push('ManageChannelCollaborators')
    }
    if (assetsToUpload || assetsToRemove.length) {
      requiredPermissions.push('ManageNonVideoChannelAssets')
    }
    if (serializedMeta.length) {
      requiredPermissions.push('UpdateChannelMetadata')
    }
    if (!(await this.hasRequiredChannelAgentPermissions(actor, channel, requiredPermissions))) {
      this.error(`Only channelOwner or collaborator with ${requiredPermissions} permission can perform this update!`, {
        exit: ExitCodes.AccessDenied,
      })
    }

    const channelUpdateParameters = createType('PalletContentChannelUpdateParametersRecord', {
      expectedDataObjectStateBloatBond,
      assetsToUpload,
      assetsToRemove,
      newMeta: serializedMeta.length ? serializedMeta : null,
      collaborators: collaborators?.length
        ? new Map(collaborators?.map(({ memberId, channelAgentPermissions }) => [memberId, channelAgentPermissions]))
        : null,
    })
    this.jsonPrettyPrint(
      JSON.stringify({
        assetsToUpload: assetsToUpload?.toJSON(),
        assetsToRemove,
        metadata: meta,
        collaborators,
      })
    )

    await this.requireConfirmation('Do you confirm the provided input?', true)

    const result = await this.sendAndFollowNamedTx(keypair, 'content', 'updateChannel', [
      actor,
      channelId,
      channelUpdateParameters,
    ])
    const channelUpdatedEvent = this.findEvent(result, 'content', 'ChannelUpdated')
    if (channelUpdatedEvent) {
      const objectIds = channelUpdatedEvent.data[3]
      await this.uploadAssets(
        `dynamic:channel:${channelId.toString()}`,
        [...objectIds].map((id, index) => ({ dataObjectId: id, path: resolvedAssets[index].path })),
        input
      )
    }
  }
}
