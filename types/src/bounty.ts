import { Null, u32, u64, bool, Option, BTreeSet, BTreeMap } from '@polkadot/types'
import { JoyEnum, JoyStructDecorated, MemberId, AccountId, Balance, BlockNumber } from './common'

export class BountyId extends u64 {}
export class EntryId extends u64 {}

export class BountyActor extends JoyEnum({
  Council: Null,
  Member: MemberId,
}) {}

export class AssuranceContractType_Closed extends BTreeSet.with(MemberId) {}

export class AssuranceContractType extends JoyEnum({
  Open: Null,
  Closed: AssuranceContractType_Closed,
}) {}

export class FundingType_Perpetual extends JoyStructDecorated({
  target: Balance,
}) {}

export class FundingType_Limited extends JoyStructDecorated({
  min_funding_amount: Balance,
  max_funding_amount: Balance,
  funding_period: BlockNumber,
}) {}

export class FundingType extends JoyEnum({
  Perpetual: FundingType_Perpetual,
  Limited: FundingType_Limited,
}) {}

export class BountyCreationParameters extends JoyStructDecorated({
  oracle: BountyActor,
  contract_type: AssuranceContractType,
  creator: BountyActor,
  cherry: Balance,
  entrant_stake: Balance,
  funding_type: FundingType,
  work_period: BlockNumber,
  judging_period: BlockNumber,
}) {}

export class OracleWorkEntryJudgment_Winner extends JoyStructDecorated({
  reward: Balance,
}) {}

export class OracleWorkEntryJudgment extends JoyEnum({
  Winner: OracleWorkEntryJudgment_Winner,
  Rejected: Null,
}) {}

export class OracleJudgment extends BTreeMap.with(EntryId, OracleWorkEntryJudgment) {}

export class Entry extends JoyStructDecorated({
  member_id: MemberId,
  staking_account_id: AccountId,
  submitted_at: BlockNumber,
  work_submitted: bool,
  oracle_judgment_result: Option.with(OracleWorkEntryJudgment),
}) {}

export class BountyMilestone_Created extends JoyStructDecorated({
  created_at: BlockNumber,
  has_contributions: bool,
}) {}

export class BountyMilestone_BountyMaxFundingReached extends JoyStructDecorated({
  max_funding_reached_at: BlockNumber,
}) {}

export class BountyMilestone_WorkSubmitted extends JoyStructDecorated({
  work_period_started_at: BlockNumber,
}) {}

export class BountyMilestone_JudgmentSubmitted extends JoyStructDecorated({
  successful_bounty: bool,
}) {}

export class BountyMilestone extends JoyEnum({
  Created: BountyMilestone_Created,
  BountyMaxFundingReached: BountyMilestone_BountyMaxFundingReached,
  WorkSubmitted: BountyMilestone_WorkSubmitted,
  JudgmentSubmitted: BountyMilestone_JudgmentSubmitted,
}) {}

export class Bounty extends JoyStructDecorated({
  creation_params: BountyCreationParameters,
  total_funding: Balance,
  milestone: BountyMilestone,
  active_work_entry_count: u32,
}) {}

export const bountyTypes = {
  BountyId,
  EntryId,
  BountyActor,
  AssuranceContractType_Closed,
  AssuranceContractType,
  FundingType_Limited,
  FundingType_Perpetual,
  FundingType,
  BountyCreationParameters,
  OracleWorkEntryJudgment_Winner,
  OracleWorkEntryJudgment,
  OracleJudgment,
  Entry,
  BountyMilestone_Created,
  BountyMilestone_BountyMaxFundingReached,
  BountyMilestone_WorkSubmitted,
  BountyMilestone_JudgmentSubmitted,
  BountyMilestone,
  Bounty,
}

export default bountyTypes
