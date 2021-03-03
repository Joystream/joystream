import { SubstrateEvent } from '@dzlzv/hydra-common'
import { DatabaseManager } from '@dzlzv/hydra-db-utils'

// enums
import { Network } from '../generated/graphql-server/src/modules/enums/enums'

// input schema models
import { Block } from '../generated/graphql-server/src/modules/block/block.model'
import { Channel } from '../generated/graphql-server/src/modules/channel/channel.model'

/////////////////// Content directory mappings /////////////////////////////////

/* Template from hydra-cli scaffold (generated with the newer version 2.0.1-beta.0)

export async function balancesTransfer(
  db: DatabaseManager,
  event_: SubstrateEvent
) {
  const transfer = new Transfer()
  transfer.from = Buffer.from(event.data.accountIds[0].toHex())
  transfer.to = Buffer.from(event.data.accountIds[1].toHex())
  transfer.value = event.data.balance.toBn()
  transfer.block = event.ctx.blockNumber
  transfer.comment = `Transferred ${transfer.value} from ${transfer.from} to ${transfer.to}`
  transfer.insertedAt = new Date()
  await db.save<Transfer>(transfer)
}
*/

const currentNetwork = Network.BABYLON

enum ProtobufEntity {
  Channel,

}

function readProtobuf(type: ProtobufEntity, metadata: string) {
  // TODO: implement protobuf read operations
  //       - see npm package `google-protobuf`
  //       - read format from folder `content-metadata-protobuf/compiled/`
  //       - parse `metadata`

  if (type == ProtobufEntity.Channel) {
    return {
      coverPhoto: undefined, // TODO: read from protobuf
      avatarPhoto: undefined, // TODO: read from protobuf
      isPublic: true, // TODO: read from protobuf
      language: undefined, // TODO: read language from protobuf and connect it with existing Language (if any)
    }
  }

  throw `Not implemented type: ${type}`
}

// temporary function used before proper block is retrieved
function convertblockNumberToBlock(block: number): Block {
  return new Block({
    block: block,
    executedAt: new Date(), // TODO get real block execution time
    network: currentNetwork,
  })
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export async function content_ChannelCreated(db: DatabaseManager, event: SubstrateEvent): Promise<void> {
  /* event arguments
  ChannelId,
  ChannelOwner<MemberId, CuratorGroupId, DAOId>,
  Vec<NewAsset>,
  ChannelCreationParameters<ContentParameters>,
  */

  const protobufContent = readProtobuf(ProtobufEntity.Channel, (event.params[3] as any).meta) // TODO: get rid of `any` typecast

  // TODO
  const channel = new Channel({
    id: event.params[0].toString(), // ChannelId
    title: 'TODO handle', // TODO
    description: 'TODO description', // TODO
    isCensored: false, // TODO: where this value comes from?
    videos: [],
    happenedIn: convertblockNumberToBlock(event.blockNumber),
    ...protobufContent
  })

  await db.save<Channel>(channel)
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export async function content_ChannelUpdated(
  db: DatabaseManager,
  event: SubstrateEvent
) {
  // TODO
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export async function content_ChannelDeleted(
  db: DatabaseManager,
  event: SubstrateEvent
) {
  // TODO
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export async function content_ChannelCensored(
  db: DatabaseManager,
  event: SubstrateEvent
) {
  // TODO
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export async function content_ChannelUncensored(
  db: DatabaseManager,
  event: SubstrateEvent
) {
  // TODO
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export async function content_ChannelOwnershipTransferRequested(
  db: DatabaseManager,
  event: SubstrateEvent
) {
  // TODO
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export async function content_ChannelOwnershipTransferRequestWithdrawn(
  db: DatabaseManager,
  event: SubstrateEvent
) {
  // TODO
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export async function content_ChannelOwnershipTransferred(
  db: DatabaseManager,
  event: SubstrateEvent
) {
  // TODO
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export async function content_ChannelCategoryCreated(
  db: DatabaseManager,
  event: SubstrateEvent
) {
  // TODO
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export async function content_ChannelCategoryUpdated(
  db: DatabaseManager,
  event: SubstrateEvent
) {
  // TODO
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export async function content_ChannelCategoryDeleted(
  db: DatabaseManager,
  event: SubstrateEvent
) {
  // TODO
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export async function content_VideoCategoryCreated(
  db: DatabaseManager,
  event: SubstrateEvent
) {
  // TODO
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export async function content_VideoCategoryUpdated(
  db: DatabaseManager,
  event: SubstrateEvent
) {
  // TODO
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export async function content_VideoCategoryDeleted(
  db: DatabaseManager,
  event: SubstrateEvent
) {
  // TODO
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export async function content_VideoCreated(
  db: DatabaseManager,
  event: SubstrateEvent
) {
  // TODO
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export async function content_VideoUpdated(
  db: DatabaseManager,
  event: SubstrateEvent
) {
  // TODO
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export async function content_VideoDeleted(
  db: DatabaseManager,
  event: SubstrateEvent
) {
  // TODO
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export async function content_VideoCensored(
  db: DatabaseManager,
  event: SubstrateEvent
) {
  // TODO
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export async function content_VideoUncensored(
  db: DatabaseManager,
  event: SubstrateEvent
) {
  // TODO
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export async function content_FeaturedVideosSet(
  db: DatabaseManager,
  event: SubstrateEvent
) {
  // TODO
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export async function content_PlaylistCreated(
  db: DatabaseManager,
  event: SubstrateEvent
) {
  // TODO
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export async function content_PlaylistUpdated(
  db: DatabaseManager,
  event: SubstrateEvent
) {
  // TODO
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export async function content_PlaylistDeleted(
  db: DatabaseManager,
  event: SubstrateEvent
) {
  // TODO
}
