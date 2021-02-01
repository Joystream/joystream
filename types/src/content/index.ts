import { /* BTreeMap, Option, Text, Vec, */ Tuple } from '@polkadot/types'
import { bool, u64, u32, Null } from '@polkadot/types/primitive'
import { MemberId } from '../members'
import { JoyStructDecorated, JoyEnum, /* Hash, */ JoyBTreeSet } from '../common'

export class CuratorId extends u64 {}
export class CuratorGroupId extends u64 {}
export class ChannelId extends u64 {}
export class ChannelCategoryId extends u64 {}
export class VideoId extends u64 {}
export class VideoCategoryId extends u64 {}
export class PlaylistId extends u64 {}
export class PersonId extends u64 {}
export class SeriesId extends u64 {}
export class ChannelTransferRequestId extends u64 {}

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

export const contentDirectoryTypes = {
  CuratorId,
  CuratorGroupId,
  CuratorGroup,
  ContentActor,
  ChannelId,
  ChannelCategoryId,
  VideoId,
  VideoCategoryId,
  PlaylistId,
  PersonId,
  SeriesId,
  ChannelTransferRequestId,
}

export default contentDirectoryTypes
