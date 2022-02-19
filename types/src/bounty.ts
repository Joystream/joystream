import { Null, u32, u64, u128, bool, Option, BTreeSet, BTreeMap } from '@polkadot/types'
import { JoyEnum, JoyStructDecorated, MemberId, AccountId } from './common'

export class BountyId extends u64 {}
export class EntryId extends u64 {}

export class BountyActor extends JoyEnum({
  Council: Null,
  Member: MemberId,
}) {}

// Unless we make this its own type we are getting error:
// Error: Enum: AssuranceContractType: Unhandled nested "BTreeSet" type
//    at /Users/mokhtar/joystream/joystream/node_modules/@polkadot/typegen/generate/tsDef.cjs:98:15
export class AssuranceContractType_Closed extends BTreeSet.with(MemberId) {}

export class AssuranceContractType extends JoyEnum({
  Open: Null,
  Closed: AssuranceContractType_Closed,
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

export class OracleWorkEntryJudgment_Winner extends JoyStructDecorated({
  reward: u128, // Balance
}) {}

export class OracleWorkEntryJudgment extends JoyEnum({
  Winner: OracleWorkEntryJudgment_Winner,
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
}

export default bountyTypes
