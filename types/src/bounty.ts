import { Null, u32, u128, bool, Option, BTreeSet, BTreeMap } from '@polkadot/types'
import { JoyEnum, JoyStructDecorated, MemberId, AccountId } from './common'

export class BountyId extends u32 {}
export class EntryId extends u32 {}

export class BountyActor extends JoyEnum({
  Council: Null,
  Member: MemberId,
}) {}

export class AssuranceContractType extends JoyEnum({
  Open: Null,
  Closed: BTreeSet.with(MemberId),
}) {}

export class FundingType_Perpetual extends JoyStructDecorated({
  target: u128, // Balance
}) {}

export class FundingType_Limited extends JoyStructDecorated({
  min_funding_amount: u128, // Balance
  max_funding_amount: u128, // Balance
  funding_period: u32, // BlockNumber
}) {}

export class FundingType extends JoyEnum({
  Perpetual: FundingType_Perpetual,
  Limited: FundingType_Limited,
}) {}

export class BountyCreationParameters extends JoyStructDecorated({
  oracle: BountyActor,
  contract_type: AssuranceContractType,
  creator: BountyActor,
  cherry: u128, // Balance
  entrant_stake: u128, // Balance
  funding_type: FundingType,
  work_period: u32, // BlockNumber
  judging_period: u32, // BlockNumber
}) {}

export class OracleJudgment_Winner extends JoyStructDecorated({
  reward: u128, // Balance
}) {}

export class OracleWorkEntryJudgment extends JoyEnum({
  Winner: OracleJudgment_Winner,
  Rejected: Null,
}) {}

export class OracleJudgment extends BTreeMap.with(EntryId, OracleWorkEntryJudgment) {}
export class Entry extends JoyStructDecorated({
  member_id: MemberId,
  staking_account_id: AccountId,
  submitted_at: u32, // BlockNumber
  work_submitted: bool,
  oracle_judgment_result: Option.with(OracleJudgment),
}) {}

export class BountyMilestone_Created extends JoyStructDecorated({
  created_at: u32, // BlockNumber
  has_contributions: bool,
}) {}

export class BountyMilestone_BountyMaxFundingReached extends JoyStructDecorated({
  max_funding_reached_at: u32, // BlockNumber
}) {}

export class BountyMilestone_WorkSubmitted extends JoyStructDecorated({
  work_period_started_at: u32, // BlockNumber
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

export class JSBounty extends JoyStructDecorated({
  creation_params: BountyCreationParameters,
  total_funding: u128,
  milestone: BountyMilestone,
  active_work_entry_count: u32,
}) {}

export const bountyTypes = {
  BountyId,
  JSBounty,
  BountyMilestone,
  EntryId,
  BountyActor,
  AssuranceContractType,
  FundingType_Limited,
  FundingType_Perpetual,
  FundingType,
  BountyCreationParameters,
  OracleJudgment_Winner,
  OracleWorkEntryJudgment,
  OracleJudgment,
  Entry,
}

export default bountyTypes
