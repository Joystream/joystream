import { Vec, Option, Tuple } from '@polkadot/types'
import { bool, u64, u32, u128, Null, Bytes } from '@polkadot/types/primitive'
import { MemberId } from '../members'
import { JoyStructDecorated, JoyEnum, ChannelId, JoyBTreeSet, DAOId, Url } from '../common'
import { ContentParameters } from '../storage'
import { GenericAccountId as AccountId } from '@polkadot/types/generic/AccountId'

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

export class NewAsset extends JoyEnum({
  Upload: ContentParameters,
  Urls: Vec.with(Url),
}) {}

export class CuratorGroup extends JoyStructDecorated({
  curators: JoyBTreeSet(CuratorId),
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
  Dao: DAOId,
}) {}

export class Channel extends JoyStructDecorated({
  owner: ChannelOwner,
  videos: Vec.with(VideoId),
  playlists: Vec.with(PlaylistId),
  series: Vec.with(SeriesId),
  is_censored: bool,
  reward_account: Option.with(AccountId),
}) {}

export class ChannelCreationParameters extends JoyStructDecorated({
  assets: Vec.with(NewAsset),
  meta: Bytes,
  reward_account: Option.with(AccountId),
}) {}

export class ChannelUpdateParameters extends JoyStructDecorated({
  assets: Option.with(Vec.with(NewAsset)),
  new_meta: Option.with(Bytes),
  reward_account: Option.with(Option.with(AccountId)),
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
  assets: Vec.with(NewAsset),
  meta: Bytes,
}) {}

export class VideoUpdateParameters extends JoyStructDecorated({
  assets: Option.with(Vec.with(NewAsset)),
  new_meta: Option.with(Bytes),
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
  assets: Option.with(Vec.with(NewAsset)),
  episodes: Option.with(Vec.with(Option.with(EpisodeParemters))),
  meta: Option.with(Bytes),
}) {}

export class Series extends JoyStructDecorated({
  in_channel: ChannelId,
  seasons: Vec.with(Season),
}) {}

export class SeriesParameters extends JoyStructDecorated({
  assets: Option.with(Vec.with(NewAsset)),
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
  assets: Vec.with(NewAsset),
  meta: Bytes,
}) {}

export class PersonUpdateParameters extends JoyStructDecorated({
  assets: Option.with(Vec.with(NewAsset)),
  meta: Option.with(Bytes),
}) {}

export class PersonActor extends JoyEnum({
  Member: MemberId,
  Curator: CuratorId,
}) {}

export const contentDirectoryTypes = {
  CuratorId,
  CuratorGroupId,
  CuratorGroup,
  ContentActor,
  NewAsset,
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
}

export default contentDirectoryTypes
