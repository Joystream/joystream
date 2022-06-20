import { getInputJson } from '../../helpers/InputOutput'
import { ChannelCreationInputParameters } from '../../Types'
import { asValidatedMetadata, metadataToBytes } from '../../helpers/serialization'
import { flags } from '@oclif/command'
import { createType } from '@joystream/types'
import { ChannelCreationParameters, CuratorGroupId } from '@joystream/types/content'
import { ChannelCreationInputSchema } from '../../schemas/ContentDirectory'
import ContentDirectoryCommandBase from '../../base/ContentDirectoryCommandBase'
import UploadCommandBase from '../../base/UploadCommandBase'
import chalk from 'chalk'
import { ChannelMetadata } from '@joystream/metadata-protobuf'
import { ChannelId, MemberId } from '@joystream/types/common'
import { DistributionBucketId, StorageBucketId } from '@joystream/types/storage'
import { BTreeSet } from '@polkadot/types'

export default class CreateChannelCommand extends UploadCommandBase {
  static description = 'Create channel inside content directory.'
  static flags = {
    context: ContentDirectoryCommandBase.channelCreationContextFlag,
    ownerId: flags.string({
      char: 'o',
      required: false,
      description: `ID of owner member or curator group`,
    }),
    input: flags.string({
      char: 'i',
      required: true,
      description: `Path to JSON file to use as input`,
    }),
    ...UploadCommandBase.flags,
  }

  async run(): Promise<void> {
    let { context, ownerId, input } = this.parse(CreateChannelCommand).flags

    // Context
    if (!context) {
      context = await this.promptForChannelCreationContext()
    }
    const [channelOwner, address] = await this.getChannelOwner(
      context,
      (ownerId as unknown) as MemberId | CuratorGroupId
    )
    const { id: memberId } = await this.getRequiredMemberContext(true)
    const keypair = await this.getDecodedPair(address)

    const channelInput = await getInputJson<ChannelCreationInputParameters>(input, ChannelCreationInputSchema)
    const meta = asValidatedMetadata(ChannelMetadata, channelInput)
    const { collaborators } = channelInput

    if (collaborators) {
      await this.validateMemberIdsSet(
        collaborators.map(([memberId]) => memberId),
        'collaborator'
      )
    }

    const { coverPhotoPath, avatarPhotoPath } = channelInput
    const [resolvedAssets, assetIndices] = await this.resolveAndValidateAssets(
      { coverPhotoPath, avatarPhotoPath },
      input
    )
    meta.coverPhoto = assetIndices.coverPhotoPath
    meta.avatarPhoto = assetIndices.avatarPhotoPath

    const storageBuckets = await this.getApi().selectStorageBucketsForNewChannel()
    const distributionBuckets = await this.getApi().selectDistributionBucketsForNewChannel()

    const assets = await this.prepareAssetsForExtrinsic(resolvedAssets)
    const channelCreationParameters = createType<ChannelCreationParameters, 'ChannelCreationParameters'>(
      'ChannelCreationParameters',
      {
        assets,
        meta: metadataToBytes(ChannelMetadata, meta),
        storage_buckets: createType<BTreeSet<StorageBucketId>, 'BTreeSet<StorageBucketId>'>(
          'BTreeSet<StorageBucketId>',
          storageBuckets
        ),
        distribution_buckets: createType<BTreeSet<DistributionBucketId>, 'BTreeSet<DistributionBucketId>'>(
          'BTreeSet<DistributionBucketId>',
          distributionBuckets
        ),
      }
    )

    this.jsonPrettyPrint(JSON.stringify({ assets: assets?.toJSON(), metadata: meta, collaborators }))

    await this.requireConfirmation('Do you confirm the provided input?', true)

    const result = await this.sendAndFollowNamedTx(keypair, 'content', 'createChannel', [
      channelOwner,
      channelCreationParameters,
    ])

    const channelCreatedEvent = this.getEvent(result, 'content', 'ChannelCreated')
    const channelId: ChannelId = channelCreatedEvent.data[0]
    this.log(chalk.green(`Channel with id ${chalk.cyanBright(channelId.toString())} successfully created!`))
    this.output(channelId.toString())

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
