import { Option, U8aFixed } from '@polkadot/types/codec'
import { Vec } from '@polkadot/types'
import { BlockNumber, Balance, Hash } from '@polkadot/types/interfaces'
import { u32, u128 } from '@polkadot/types/primitive'
import { RegistryTypes } from '@polkadot/types/types'
import { JoyStructDecorated } from '../JoyStruct'
import { JoyEnum } from '../JoyEnum'
import AccountId from '@polkadot/types/generic/AccountId'

export type ITransferableStake = {
  seat: Balance
  backing: Balance
}
export class TransferableStake
  extends JoyStructDecorated({
    seat: u128,
    backing: u128,
  })
  implements ITransferableStake {}

export type IElectionStake = {
  new: Balance
  transferred: Balance
}
export class ElectionStake
  extends JoyStructDecorated({
    new: u128,
    transferred: u128,
  })
  implements IElectionStake {}

export class Backer extends JoyStructDecorated({
  member: AccountId,
  stake: u128, // Balance
}) {}

export class Backers extends Vec.with(Backer) {}
export class Seat extends JoyStructDecorated({
  member: AccountId,
  stake: u128, // Balance
  backers: Backers,
}) {}

export class Seats extends Vec.with(Seat) {}

export type ISealedVote = {
  voter: AccountId
  commitment: Hash
  stake: ElectionStake
  vote: Option<AccountId>
}
export class SealedVote
  extends JoyStructDecorated({
    voter: AccountId,
    commitment: U8aFixed, // Hash
    stake: ElectionStake,
    vote: Option.with(AccountId),
  })
  implements ISealedVote {}

export class Announcing extends u32 {}
export class Voting extends u32 {}
export class Revealing extends u32 {}

export class ElectionStage extends JoyEnum({
  Announcing,
  Voting,
  Revealing,
} as const) {}

export type AnyElectionStage = Announcing | Voting | Revealing

export type IElectionParameters = {
  announcing_period: BlockNumber
  voting_period: BlockNumber
  revealing_period: BlockNumber
  council_size: u32
  candidacy_limit: u32
  new_term_duration: BlockNumber
  min_council_stake: Balance
  min_voting_stake: Balance
}

export class ElectionParameters
  extends JoyStructDecorated({
    announcing_period: u32, // BlockNumber
    voting_period: u32, // BlockNumber
    revealing_period: u32, // BlockNumber
    council_size: u32,
    candidacy_limit: u32,
    new_term_duration: u32, // BlockNumber
    min_council_stake: u128, // Balance
    min_voting_stake: u128, // Balance
  })
  implements IElectionParameters {}

export const councilTypes: RegistryTypes = {
  ElectionStage,
  ElectionStake,
  SealedVote,
  TransferableStake,
  ElectionParameters,
  Seat,
  Seats,
  Backer,
  Backers,
}

export default councilTypes
