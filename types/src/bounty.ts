import { Null, u8, u32, u64, bool, Vec, BTreeSet, BTreeMap, UInt } from '@polkadot/types'
import { JoyEnum, JoyStructDecorated, MemberId, AccountId, Balance, BlockNumber } from './common'

export class BountyId extends u64 {}
export class EntryId extends u64 {}
export class Perbill extends UInt.with(32, 'Perbill') {}

export class BountyActor extends JoyEnum({
  Council: Null,
  Member: MemberId,
}) {}

export class AssuranceContractTypeClosed extends BTreeSet.with(MemberId) {}

export class AssuranceContractType extends JoyEnum({
  Open: Null,
  Closed: AssuranceContractTypeClosed,
}) {}

export class FundingTypePerpetual extends JoyStructDecorated({
  target: Balance,
}) {}

export class FundingTypeLimited extends JoyStructDecorated({
  target: Balance,
  funding_period: BlockNumber,
}) {}

export class FundingType extends JoyEnum({
  Perpetual: FundingTypePerpetual,
  Limited: FundingTypeLimited,
}) {}

export class BountyCreationParameters extends JoyStructDecorated({
  oracle: BountyActor,
  contract_type: AssuranceContractType,
  creator: BountyActor,
  cherry: Balance,
  oracle_reward: Balance,
  entrant_stake: Balance,
  funding_type: FundingType,
}) {}

export class OracleWorkEntryJudgmentWinner extends JoyStructDecorated({
  reward: Balance,
}) {}

export class OracleWorkEntryJudgmentRejected extends JoyStructDecorated({
  slashing_share: Perbill,
  action_justification: Vec.with(u8),
}) {}

export class OracleWorkEntryJudgment extends JoyEnum({
  Winner: OracleWorkEntryJudgmentWinner,
  Rejected: OracleWorkEntryJudgmentRejected,
}) {}

export class OracleJudgment extends BTreeMap.with(EntryId, OracleWorkEntryJudgment) {}

export class Entry extends JoyStructDecorated({
  member_id: MemberId,
  staking_account_id: AccountId,
  submitted_at: BlockNumber,
  work_submitted: bool,
}) {}

export class BountyStageFunding extends JoyStructDecorated({
  has_contribution: bool,
}) {}

export class BountyStage extends JoyStructDecorated({
  Funding: BountyStageFunding,
  NoFundingContributed: Null,
  WorkSubmission: Null,
  Judgment: Null,
  SuccessfulBountyWithdrawal: Null,
  FailedBountyWithdrawal: Null,
}) {}

export class BountyMilestoneCreated extends JoyStructDecorated({
  created_at: BlockNumber,
  has_contributions: bool,
}) {}

export class BountyMilestoneJudgmentSubmitted extends JoyStructDecorated({
  successful_bounty: bool,
}) {}

export class BountyMilestone extends JoyEnum({
  Created: BountyMilestoneCreated,
  BountyMaxFundingReached: Null,
  WorkSubmitted: Null,
  Terminated: Null,
  JudgmentSubmitted: BountyMilestoneJudgmentSubmitted,
}) {}

export class Bounty extends JoyStructDecorated({
  creation_params: BountyCreationParameters,
  total_funding: Balance,
  milestone: BountyMilestone,
  active_work_entry_count: u32,
  has_unpaid_oracle_reward: bool,
}) {}

export class Contribution extends JoyStructDecorated({
  amount: Balance,
  funder_state_bloat_bond_amount: Balance,
}) {}

export const bountyTypes = {
  BountyId,
  EntryId,
  BountyActor,
  Contribution,
  AssuranceContractType,
  AssuranceContractTypeClosed,
  FundingType,
  BountyCreationParameters,
  OracleWorkEntryJudgmentWinner,
  OracleWorkEntryJudgmentRejected,
  OracleWorkEntryJudgment,
  OracleJudgment,
  Entry,
  BountyMilestone,
  Bounty,
  BountyStage,
  BountyStageFunding,
}

export default bountyTypes
