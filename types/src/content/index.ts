import { Text, Vec, Option, Tuple } from '@polkadot/types'
import { bool, u64, u32, u128, Null, Bytes } from '@polkadot/types/primitive'
import { MemberId } from '../members'
import { JoyStructDecorated, JoyEnum, ChannelId, JoyBTreeSet, DAOId } from '../common'
import { ContentParameters } from '../storage'

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

export class CuratorGroup extends JoyStructDecorated({
  curators: JoyBTreeSet(CuratorId),
  active: bool,
  number_of_channels_owned: u32,
}) {}

export class ContentActor extends JoyEnum({
  Curator: Tuple.with([CuratorGroupId, CuratorId]),
  Member: MemberId,
  Lead: Null,
}) {}

export class ChannelOwner extends JoyEnum({
  Nobody: Null,
  Member: MemberId,
  Curators: CuratorGroupId,
  Dao: DAOId,
}) {}

export class Channel extends JoyStructDecorated({
  owner: ChannelOwner,
  in_category: ChannelCategoryId,
  number_of_videos: u32,
  number_of_playlists: u32,
  number_of_series: u32,
  is_curated: bool,
  revenue: u128,
}) {}

export class ChannelCreationParameters extends JoyStructDecorated({
  in_category: ChannelCategoryId,
  meta: Bytes,
}) {}

export class ChannelUpdateParameters extends JoyStructDecorated({
  new_in_category: Option.with(ChannelCategoryId),
  new_meta: Bytes,
}) {}

export class ChannelOwnershipTransferRequest extends JoyStructDecorated({
  channel_id: ChannelId,
  new_owner: ChannelOwner,
  payment: u128,
}) {}

export class ChannelCategory extends JoyStructDecorated({
  number_of_channels_in: u32,
}) {}

export class ChannelCategoryCreationParameters extends JoyStructDecorated({
  meta: Bytes,
}) {}

export class ChannelCategoryUpdateParameters extends JoyStructDecorated({
  new_meta: Bytes,
}) {}

export class VideoCategory extends JoyStructDecorated({
  number_of_videos_in_category: u32,
}) {}

export class VideoCategoryCreationParameters extends JoyStructDecorated({
  meta: Bytes,
}) {}

export class VideoCategoryUpdateParameters extends JoyStructDecorated({
  new_meta: Bytes,
}) {}

export class Video extends JoyStructDecorated({
  in_channel: ChannelId,
  in_series: Vec.with(SeriesId),
  in_playlists: Vec.with(PlaylistId),
  is_curated: bool,
  is_featured: bool,
}) {}

export class VideoCreationParameters extends JoyStructDecorated({
  in_category: VideoCategoryId,
  meta: Bytes,
}) {}

export class VideoUpdateParameters extends JoyStructDecorated({
  new_in_category: Option.with(VideoCategoryId),
  new_meta: Option.with(Bytes),
}) {}

export class Playlist extends JoyStructDecorated({
  in_channel: ChannelId,
  videos: Vec.with(VideoId),
}) {}

export class PlaylistCreationParameters extends JoyStructDecorated({
  videos: Vec.with(VideoId),
  meta: Bytes,
}) {}

export class PlaylistUpdateParameters extends JoyStructDecorated({
  new_videos: Option.with(Vec.with(VideoId)),
  new_meta: Option.with(Bytes),
}) {}

export class EpisodeParemters extends JoyEnum({
  NewVideo: VideoCreationParameters,
  ExistingVideo: VideoId,
}) {}

export class Season extends JoyStructDecorated({
  episodes: Vec.with(VideoId),
}) {}

export class SeasonParameters extends JoyStructDecorated({
  episodes: Option.with(Vec.with(Option.with(EpisodeParemters))),
  meta: Option.with(Bytes),
}) {}

export class Series extends JoyStructDecorated({
  in_channel: ChannelId,
  seasons: Vec.with(Season),
}) {}

export class SeriesParameters extends JoyStructDecorated({
  seasons: Option.with(Vec.with(Option.with(SeasonParameters))),
  meta: Option.with(Bytes),
}) {}

export class PersonController extends JoyEnum({
  Nobody: Null,
  Member: MemberId,
  Curators: Null,
}) {}

export class Person extends JoyStructDecorated({
  controlled_by: PersonController,
  number_of_videos_person_involed_in: u32,
}) {}

export class PersonCreationParameters extends JoyStructDecorated({
  meta: Bytes,
}) {}

export class PersonUpdateParameters extends JoyStructDecorated({
  meta: Bytes,
}) {}

export class PersonActor extends JoyEnum({
  Member: MemberId,
  Curator: CuratorId,
}) {}

export class NewAsset extends JoyEnum({
  Upload: ContentParameters,
  Uri: Text,
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
