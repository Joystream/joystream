import { Option, Vec } from '@polkadot/types/codec'
import { BlockNumber, Balance } from '@polkadot/types/interfaces'
import { Null, u32, u64, u128 } from '@polkadot/types/primitive'
import { RegistryTypes } from '@polkadot/types/types'
import { JoyStructDecorated } from '../JoyStruct'
import { JoyEnum } from '../JoyEnum'
import { MemberId, Hash } from '../common'

export class VotePower extends u128 {} // Balance

export type IOptionResult = {
  option_id: MemberId
  vote_power: VotePower
}

export class OptionResult
  extends JoyStructDecorated({
    option_id: MemberId,
    vote_power: VotePower,
  })
  implements IOptionResult {}

export type IReferendumStageVoting = {
  started: BlockNumber
  winning_target_count: u64
  current_cycle_id: u64
}

export class ReferendumStageVoting
  extends JoyStructDecorated({
    started: u32,
    winning_target_count: u64,
    current_cycle_id: u64,
  })
  implements IReferendumStageVoting {}

export type IReferendumStageRevealing = {
  started: BlockNumber
  winning_target_count: u64
  intermediate_winners: Vec<OptionResult>
  current_cycle_id: u64
}

export class ReferendumStageRevealing
  extends JoyStructDecorated({
    started: u32,
    winning_target_count: u64,
    intermediate_winners: Vec.with(OptionResult),
    current_cycle_id: u64,
  })
  implements IReferendumStageRevealing {}

export class ReferendumStage extends JoyEnum({
  Inactive: Null,
  Voting: ReferendumStageVoting,
  Revealing: ReferendumStageRevealing,
} as const) {}

export type ICastVote = {
  commitment: Hash
  cycle_id: u64
  stake: Balance
  vote_for: Option<MemberId>
}

export class CastVote
  extends JoyStructDecorated({
    commitment: Hash,
    cycle_id: u64,
    stake: u128,
    vote_for: Option.with(MemberId),
  })
  implements ICastVote {}

export const referendumTypes: RegistryTypes = {
  ReferendumStageVoting,
  ReferendumStageRevealing,
  ReferendumStage,
  OptionResult,
  VotePower,
}

export default referendumTypes
