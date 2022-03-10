import { getInputJson } from '../../helpers/InputOutput'
import { asValidatedMetadata, metadataToBytes } from '../../helpers/serialization'
import { ChannelInputParameters } from '../../Types'
import { flags } from '@oclif/command'
import UploadCommandBase from '../../base/UploadCommandBase'
import { CreateInterface, createType } from '@joystream/types'
import { ChannelUpdateParameters } from '@joystream/types/content'
import { ChannelInputSchema } from '../../schemas/ContentDirectory'
import { ChannelMetadata } from '@joystream/metadata-protobuf'
import { DataObjectInfoFragment } from '../../graphql/generated/queries'
import BN from 'bn.js'
import { formatBalance } from '@polkadot/util'
import chalk from 'chalk'
import ContentDirectoryCommandBase from '../../base/ContentDirectoryCommandBase'
import ExitCodes from '../../ExitCodes'

export default class UpdateChannelCommand extends UploadCommandBase {
  static description = 'Update existing content directory channel.'
  static flags = {
    context: ContentDirectoryCommandBase.channelManagementContextFlag,
    input: flags.string({
      char: 'i',
      required: true,
      description: `Path to JSON file to use as input`,
    }),
  }

  static args = [
    {
      name: 'channelId',
      required: true,
      description: 'ID of the Channel',
    },
  ]

  parseRewardAccountInput(rewardAccount?: string | null): string | null | Uint8Array {
    if (rewardAccount === undefined) {
      // Reward account remains unchanged
      return null
    } else if (rewardAccount === null) {
      // Reward account changed to empty
      return new Uint8Array([1, 0])
    } else {
      // Reward account set to new account
      return rewardAccount
    }
  }

  async getAssetsToRemove(
    channelId: number,
    coverPhotoIndex: number | undefined,
    avatarPhotoIndex: number | undefined
  ): Promise<string[]> {
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
        const totalPrize = assetsToRemove.reduce((sum, { deletionPrize }) => sum.add(new BN(deletionPrize)), new BN(0))
        this.log(`Total deletion prize: ${chalk.cyanBright(formatBalance(totalPrize))}\n`)
      }
    }

    return assetsToRemove.map((a) => a.id)
  }

  async run(): Promise<void> {
    const {
      flags: { input, context },
      args: { channelId },
    } = this.parse(UpdateChannelCommand)

    // Context
    const channel = await this.getApi().channelById(channelId)
    const [actor, address] = await this.getChannelManagementActor(channel, context)
    const [memberId] = await this.getRequiredMemberContext()
    const keypair = await this.getDecodedPair(address)

    const channelInput = await getInputJson<ChannelInputParameters>(input, ChannelInputSchema)
    const meta = asValidatedMetadata(ChannelMetadata, channelInput)

    if (channelInput.rewardAccount !== undefined && actor.type === 'Collaborator') {
      this.error("Collaborators are not allowed to update channel's reward account!", { exit: ExitCodes.AccessDenied })
    }

    if (channelInput.collaborators !== undefined && actor.type === 'Collaborator') {
      this.error("Collaborators are not allowed to update channel's collaborators!", { exit: ExitCodes.AccessDenied })
    }

    if (channelInput.collaborators) {
      await this.validateCollaborators(channelInput.collaborators)
    }

    const { coverPhotoPath, avatarPhotoPath, rewardAccount } = channelInput
    const [resolvedAssets, assetIndices] = await this.resolveAndValidateAssets(
      { coverPhotoPath, avatarPhotoPath },
      input
    )
    // Set assets indices in the metadata
    // "undefined" values will be omitted when the metadata is encoded. It's not possible to "unset" an asset this way.
    meta.coverPhoto = assetIndices.coverPhotoPath
    meta.avatarPhoto = assetIndices.avatarPhotoPath

    // Preare and send the extrinsic
    const assetsToUpload = await this.prepareAssetsForExtrinsic(resolvedAssets)
    const assetsToRemove = await this.getAssetsToRemove(
      channelId,
      assetIndices.coverPhotoPath,
      assetIndices.avatarPhotoPath
    )

    const collaborators = createType('Option<BTreeSet<MemberId>>', channelInput.collaborators)
    const channelUpdateParameters: CreateInterface<ChannelUpdateParameters> = {
      assets_to_upload: assetsToUpload,
      assets_to_remove: createType('BTreeSet<DataObjectId>', assetsToRemove),
      new_meta: metadataToBytes(ChannelMetadata, meta),
      reward_account: this.parseRewardAccountInput(rewardAccount),
      collaborators,
    }

    this.jsonPrettyPrint(
      JSON.stringify({ assetsToUpload: assetsToUpload?.toJSON(), assetsToRemove, metadata: meta, rewardAccount })
    )

    await this.requireConfirmation('Do you confirm the provided input?', true)

    const result = await this.sendAndFollowNamedTx(keypair, 'content', 'updateChannel', [
      actor,
      channelId,
      channelUpdateParameters,
    ])
    const dataObjectsUploadedEvent = this.findEvent(result, 'storage', 'DataObjectsUploaded')
    if (dataObjectsUploadedEvent) {
      const [objectIds] = dataObjectsUploadedEvent.data
      await this.uploadAssets(
        keypair,
        memberId.toNumber(),
        `dynamic:channel:${channelId.toString()}`,
        objectIds.map((id, index) => ({ dataObjectId: id, path: resolvedAssets[index].path })),
        input
      )
    }
  }
}
