import { Bytes, BTreeMap, BTreeSet, Option } from '@polkadot/types'
import { Null, u32, u128 } from '@polkadot/types/primitive'
import { GenericAccountId as AccountId } from '@polkadot/types/generic/AccountId'
import { BlockNumber, Balance } from '@polkadot/types/interfaces'
import { MemberId, ActorId } from '../members'
import { RewardRelationshipId } from '../recurring-rewards'
import { StakeId } from '../stake'
import { ApplicationId, OpeningId, ApplicationRationingPolicy, StakingPolicy } from '../hiring'
import { JoyEnum, JoyStructDecorated, SlashingTerms, JoyBTreeSet } from '../common'
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

export class ApplicationIdSet extends JoyBTreeSet(ApplicationId) {}

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

export type IOpeningPolicyCommitment = {
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

export class OpeningPolicyCommitment
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
  implements IOpeningPolicyCommitment {}

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
  policy_commitment: OpeningPolicyCommitment
  opening_type: OpeningType
}

// This type is also defined in /hiring (and those are incosistent), but here
// it is beeing registered as "OpeningOf" (which is an alias used by the runtime working-group module),
// so it shouldn't cause any conflicts
export class Opening
  extends JoyStructDecorated({
    hiring_opening_id: OpeningId,
    applications: JoyBTreeSet(ApplicationId),
    policy_commitment: OpeningPolicyCommitment,
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
  // Expose in registry for api.createType purposes:
  OpeningPolicyCommitment,
  RoleStakeProfile,
}

export default workingGroupTypes
