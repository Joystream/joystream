import { Vec, Option, Tuple, BTreeSet } from '@polkadot/types'
import { bool, u64, u32, u128, Null, Bytes } from '@polkadot/types/primitive'
import { MemberId } from '../members'
import { JoyStructDecorated, JoyEnum, ChannelId } from '../common'
import { GenericAccountId as AccountId } from '@polkadot/types/generic/AccountId'
import { DataObjectId, DataObjectCreationParameters } from '../storage'

export class CuratorId extends u64 {}
export class CuratorGroupId extends u64 {}
export class ChannelCategoryId extends u64 {}
export class VideoId extends u64 {}
export class VideoCategoryId extends u64 {}
export class PlaylistId extends u64 {}
export class PersonId extends u64 {}
export class SeriesId extends u64 {}
export class ChannelOwnershipTransferRequestId extends u64 {}
export class MaxNumber extends u32 {}
export class IsCensored extends bool {}

export class StorageAssets extends JoyStructDecorated({
  object_creation_list: Vec.with(DataObjectCreationParameters),
  expected_data_size_fee: u128,
}) {}

export class CuratorGroup extends JoyStructDecorated({
  curators: BTreeSet.with(CuratorId),
  active: bool,
}) {}

export class ContentActor extends JoyEnum({
  Curator: Tuple.with([CuratorGroupId, CuratorId]),
  Member: MemberId,
  Lead: Null,
}) {}

export class ChannelOwner extends JoyEnum({
  Member: MemberId,
  Curators: CuratorGroupId,
}) {}

export class Channel extends JoyStructDecorated({
  owner: ChannelOwner,
  num_videos: u64,
  is_censored: bool,
  reward_account: Option.with(AccountId),
  deletion_prize_source_account_id: AccountId,
}) {}

export class ChannelCreationParameters extends JoyStructDecorated({
  assets: Option.with(StorageAssets),
  meta: Option.with(Bytes),
  reward_account: Option.with(AccountId),
}) {}

export class ChannelUpdateParameters extends JoyStructDecorated({
  assets_to_upload: Option.with(StorageAssets),
  new_meta: Option.with(Bytes),
  reward_account: Option.with(Option.with(AccountId)),
  assets_to_remove: BTreeSet.with(DataObjectId),
}) {}

export class ChannelOwnershipTransferRequest extends JoyStructDecorated({
  channel_id: ChannelId,
  new_owner: ChannelOwner,
  payment: u128,
  new_reward_account: Option.with(AccountId),
}) {}

export class ChannelCategory extends JoyStructDecorated({
  // No runtime information is currently stored for a Category.
}) {}

export class ChannelCategoryCreationParameters extends JoyStructDecorated({
  meta: Bytes,
}) {}

export class ChannelCategoryUpdateParameters extends JoyStructDecorated({
  new_meta: Bytes,
}) {}

export class VideoCategory extends JoyStructDecorated({
  // No runtime information is currently stored for a Category.
}) {}

export class VideoCategoryCreationParameters extends JoyStructDecorated({
  meta: Bytes,
}) {}

export class VideoCategoryUpdateParameters extends JoyStructDecorated({
  new_meta: Bytes,
}) {}

export class Video extends JoyStructDecorated({
  in_channel: ChannelId,
  in_series: Option.with(SeriesId),
  is_censored: bool,
}) {}

export class VideoCreationParameters extends JoyStructDecorated({
  assets: Option.with(StorageAssets),
  meta: Option.with(Bytes),
}) {}

export class VideoUpdateParameters extends JoyStructDecorated({
  assets_to_upload: Option.with(StorageAssets),
  new_meta: Option.with(Bytes),
  assets_to_remove: BTreeSet.with(DataObjectId),
}) {}

export class Playlist extends JoyStructDecorated({
  in_channel: ChannelId,
}) {}

export class PlaylistCreationParameters extends JoyStructDecorated({
  meta: Bytes,
}) {}

export class PlaylistUpdateParameters extends JoyStructDecorated({
  new_meta: Bytes,
}) {}

export class EpisodeParemters extends JoyEnum({
  NewVideo: VideoCreationParameters,
  ExistingVideo: VideoId,
}) {}

export class Season extends JoyStructDecorated({
  episodes: Vec.with(VideoId),
}) {}

export class SeasonParameters extends JoyStructDecorated({
  assets: Option.with(StorageAssets),
  episodes: Option.with(Vec.with(Option.with(EpisodeParemters))),
  meta: Option.with(Bytes),
}) {}

export class Series extends JoyStructDecorated({
  in_channel: ChannelId,
  seasons: Vec.with(Season),
}) {}

export class SeriesParameters extends JoyStructDecorated({
  assets: Option.with(StorageAssets),
  seasons: Option.with(Vec.with(Option.with(SeasonParameters))),
  meta: Option.with(Bytes),
}) {}

export class PersonController extends JoyEnum({
  Member: MemberId,
  Curators: Null,
}) {}

export class Person extends JoyStructDecorated({
  controlled_by: PersonController,
}) {}

export class PersonCreationParameters extends JoyStructDecorated({
  assets: StorageAssets,
  meta: Bytes,
}) {}

export class PersonUpdateParameters extends JoyStructDecorated({
  assets: Option.with(StorageAssets),
  meta: Option.with(Bytes),
}) {}

export class PersonActor extends JoyEnum({
  Member: MemberId,
  Curator: CuratorId,
}) {}

export class VideoMigrationConfig extends JoyStructDecorated({
  current_id: VideoId,
  final_id: VideoId,
}) {}
export class ChannelMigrationConfig extends JoyStructDecorated({
  current_id: ChannelId,
  final_id: ChannelId,
}) {}
export const contentTypes = {
  CuratorId,
  CuratorGroupId,
  CuratorGroup,
  ContentActor,
  StorageAssets,
  Channel,
  ChannelOwner,
  ChannelCategoryId,
  ChannelCategory,
  ChannelCategoryCreationParameters,
  ChannelCategoryUpdateParameters,
  ChannelCreationParameters,
  ChannelUpdateParameters,
  ChannelOwnershipTransferRequestId,
  ChannelOwnershipTransferRequest,
  Video,
  VideoId,
  VideoCategoryId,
  VideoCategory,
  VideoCategoryCreationParameters,
  VideoCategoryUpdateParameters,
  VideoCreationParameters,
  VideoUpdateParameters,
  Person,
  PersonId,
  PersonController,
  PersonActor,
  PersonCreationParameters,
  PersonUpdateParameters,
  Playlist,
  PlaylistId,
  PlaylistCreationParameters,
  PlaylistUpdateParameters,
  SeriesId,
  Series,
  Season,
  SeriesParameters,
  SeasonParameters,
  EpisodeParemters,
  MaxNumber,
  IsCensored,
  VideoMigrationConfig,
  ChannelMigrationConfig,
}

export default contentTypes
