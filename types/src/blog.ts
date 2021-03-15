import { JoyStructDecorated, MemberId, Hash, PostId } from './common'
import { Text, Option, u64 } from '@polkadot/types'

export class ParticipantId extends MemberId {}
export class Title extends Text {}
export class UpdatedTitle extends Option.with(Text) {}
export class UpdatedBody extends Option.with(Text) {}
export class ReplyId extends u64 {}

export class Reply extends JoyStructDecorated({
  text_hash: Hash,
  owner: ParticipantId,
  parent_id: PostId,
}) {}

export default {
  ParticipantId,
  Title,
  UpdatedTitle,
  UpdatedBody,
  ReplyId,
  Reply,
}
