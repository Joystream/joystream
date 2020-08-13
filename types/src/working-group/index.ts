import { Bytes, BTreeMap, BTreeSet, Option } from '@polkadot/types'
import { Null, u32, u128 } from '@polkadot/types/primitive'
import AccountId from '@polkadot/types/generic/AccountId'
import { BlockNumber, Balance } from '@polkadot/types/interfaces'
import { MemberId, ActorId } from '../members'
import { RewardRelationshipId } from '../recurring-rewards'
import { StakeId } from '../stake'
import { ApplicationId, OpeningId, ApplicationRationingPolicy, StakingPolicy } from '../hiring'
import { JoyEnum, JoyStructDecorated, SlashingTerms } from '../common'
import { RegistryTypes } from '@polkadot/types/types'

export class RationaleText extends Bytes {}

export type IApplication = {
  role_account_id: AccountId
  opening_id: OpeningId
  member_id: MemberId
  application_id: ApplicationId
}

// This type is also defined in /hiring (and those are incosistent), but here
// it is beeing registered as "ApplicationOf" (which is an alias used by the runtime working-group module),
// so it shouldn't cause any conflicts
export class Application
  extends JoyStructDecorated({
    role_account_id: AccountId,
    opening_id: OpeningId,
    member_id: MemberId,
    application_id: ApplicationId,
  })
  implements IApplication {}

export class WorkerId extends ActorId {}

export class StorageProviderId extends WorkerId {}

export class ApplicationIdSet extends BTreeSet.with(ApplicationId) {}

export class ApplicationIdToWorkerIdMap extends BTreeMap.with(ApplicationId, WorkerId) {}

export type IRoleStakeProfile = {
  stake_id: StakeId
  termination_unstaking_period: Option<BlockNumber>
  exit_unstaking_period: Option<BlockNumber>
}

export class RoleStakeProfile
  extends JoyStructDecorated({
    stake_id: StakeId,
    termination_unstaking_period: Option.with(u32), // Option<BlockNumber>
    exit_unstaking_period: Option.with(u32), // Option<BlockNumber>
  })
  implements IRoleStakeProfile {}

export type IWorker = {
  member_id: MemberId
  role_account_id: AccountId
  reward_relationship: Option<RewardRelationshipId>
  role_stake_profile: Option<RoleStakeProfile>
}

export class Worker
  extends JoyStructDecorated({
    member_id: MemberId,
    role_account_id: AccountId,
    reward_relationship: Option.with(RewardRelationshipId),
    role_stake_profile: Option.with(RoleStakeProfile),
  })
  implements IWorker {
  // FIXME: Won't be needed soon?
  get is_active(): boolean {
    return !this.isEmpty
  }
}

export type IWorkingGroupOpeningPolicyCommitment = {
  application_rationing_policy: Option<ApplicationRationingPolicy>
  max_review_period_length: BlockNumber
  application_staking_policy: Option<StakingPolicy>
  role_staking_policy: Option<StakingPolicy>
  role_slashing_terms: SlashingTerms
  fill_opening_successful_applicant_application_stake_unstaking_period: Option<BlockNumber>
  fill_opening_failed_applicant_application_stake_unstaking_period: Option<BlockNumber>
  fill_opening_failed_applicant_role_stake_unstaking_period: Option<BlockNumber>
  terminate_application_stake_unstaking_period: Option<BlockNumber>
  terminate_role_stake_unstaking_period: Option<BlockNumber>
  exit_role_application_stake_unstaking_period: Option<BlockNumber>
  exit_role_stake_unstaking_period: Option<BlockNumber>
}

// This type represents OpeningPolicyCommitment defined inside the runtime's working-grpup module.
// The only difference between this and the one defined in /content-working-group is in the names of some fields.
//
// There is also a minor issue here:
// Because api metadata still says that ie. the "commitment" argument of "storageWorkingGroup.addOpening" extrinsic
// is of type "OpeningPolicyCommitment" (not the "WorkingGroupOpeningPolicyCommitment" defined here), the CWG's OpeningPolicyCommitment
// type is used when sending this extrinsic (it has "terminate_curator_role_stake_unstaking_period" field insted
// of "terminate_role_stake_unstaking_period" etc.).
// Since both those types are basically the same structs (only filed names are different) nothing seems to break, but it's
// very fragile atm and any change to this type in working-group module could result in "unsolvable" inconsistencies
// (this won't be an issue after CWG gets refactored to use the working-grpup module too)
export class WorkingGroupOpeningPolicyCommitment
  extends JoyStructDecorated({
    application_rationing_policy: Option.with(ApplicationRationingPolicy),
    max_review_period_length: u32, // BlockNumber
    application_staking_policy: Option.with(StakingPolicy),
    role_staking_policy: Option.with(StakingPolicy),
    role_slashing_terms: SlashingTerms,
    fill_opening_successful_applicant_application_stake_unstaking_period: Option.with(u32),
    fill_opening_failed_applicant_application_stake_unstaking_period: Option.with(u32),
    fill_opening_failed_applicant_role_stake_unstaking_period: Option.with(u32),
    terminate_application_stake_unstaking_period: Option.with(u32),
    terminate_role_stake_unstaking_period: Option.with(u32),
    exit_role_application_stake_unstaking_period: Option.with(u32),
    exit_role_stake_unstaking_period: Option.with(u32),
  })
  implements IWorkingGroupOpeningPolicyCommitment {}

export class OpeningType_Leader extends Null {}
export class OpeningType_Worker extends Null {}
export const OpeningTypeDef = {
  Leader: OpeningType_Leader,
  Worker: OpeningType_Worker,
} as const
export type OpeningTypeKey = keyof typeof OpeningTypeDef
export class OpeningType extends JoyEnum(OpeningTypeDef) {}

export type IOpening = {
  hiring_opening_id: OpeningId
  applications: BTreeSet<ApplicationId>
  policy_commitment: WorkingGroupOpeningPolicyCommitment
  opening_type: OpeningType
}

// This type is also defined in /hiring (and those are incosistent), but here
// it is beeing registered as "OpeningOf" (which is an alias used by the runtime working-group module),
// so it shouldn't cause any conflicts
export class Opening
  extends JoyStructDecorated({
    hiring_opening_id: OpeningId,
    applications: BTreeSet.with(ApplicationId),
    policy_commitment: WorkingGroupOpeningPolicyCommitment,
    opening_type: OpeningType,
  })
  implements IOpening {}

// Also defined in "content-working-group" runtime module, but those definitions are the consistent
export type IRewardPolicy = {
  amount_per_payout: Balance
  next_payment_at_block: BlockNumber
  payout_interval: Option<BlockNumber>
}

export class RewardPolicy
  extends JoyStructDecorated({
    amount_per_payout: u128, // Balance
    next_payment_at_block: u32, // BlockNumber
    payout_interval: Option.with(u32), // Option<BlockNumber>
  })
  implements IRewardPolicy {}

// Needed for types augment tool
export { OpeningId, ApplicationId }

export const workingGroupTypes: RegistryTypes = {
  RationaleText,
  ApplicationOf: Application,
  ApplicationIdSet,
  ApplicationIdToWorkerIdMap,
  WorkerId,
  WorkerOf: Worker,
  OpeningOf: Opening,
  StorageProviderId,
  OpeningType,
  /// Alias used by the runtime working-group module
  HiringApplicationId: ApplicationId,
  RewardPolicy,
  'working_group::OpeningId': OpeningId,
  'working_group::WorkerId': WorkerId,
  // Expose in registry for api.createType purposes:
  WorkingGroupOpeningPolicyCommitment,
  RoleStakeProfile,
}

export default workingGroupTypes
