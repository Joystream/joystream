import { getTypeRegistry, Bytes, BTreeMap, Option, Enum } from '@polkadot/types';
import { u16, Null } from '@polkadot/types/primitive';
import { AccountId, BlockNumber, Balance } from '@polkadot/types/interfaces';
import { BTreeSet, JoyStruct } from '../common';
import { MemberId, ActorId } from '../members';
import { RewardRelationshipId } from '../recurring-rewards';
import { StakeId } from '../stake';
import { ApplicationId, OpeningId, ApplicationRationingPolicy, StakingPolicy } from '../hiring';

export class RationaleText extends Bytes { };

export type IApplication = {
  role_account_id: AccountId,
  opening_id: OpeningId,
  member_id: MemberId,
  application_id: ApplicationId
};

// This type is also defined in /hiring (and those are incosistent), but here
// it is beeing registered as "ApplicationOf" (which is an alias used by the runtime working-group module),
// so it shouldn't cause any conflicts
export class Application extends JoyStruct<IApplication> {
  constructor (value?: IApplication) {
    super({
      role_account_id: "AccountId",
      opening_id: OpeningId,
      member_id: MemberId,
      application_id: ApplicationId
    }, value);
  }

  get role_account_id(): AccountId {
    return this.getField<AccountId>('role_account_id');
  }

  get opening_id(): OpeningId {
    return this.getField<OpeningId>('opening_id');
  }

  get member_id(): MemberId {
    return this.getField<MemberId>('member_id');
  }

  get application_id(): ApplicationId {
    return this.getField<ApplicationId>('application_id');
  }
}

export class WorkerId extends ActorId { };

export class StorageProviderId extends WorkerId { };

export class ApplicationIdSet extends BTreeSet.with(ApplicationId) { };

export class ApplicationIdToWorkerIdMap extends BTreeMap.with(ApplicationId, WorkerId) { };


export type IRoleStakeProfile = {
  stake_id: StakeId,
  termination_unstaking_period: Option<BlockNumber>,
  exit_unstaking_period: Option<BlockNumber>,
};

export class RoleStakeProfile extends JoyStruct<IRoleStakeProfile> {
  constructor (value?: IRoleStakeProfile) {
    super({
      stake_id: StakeId,
      termination_unstaking_period: "Option<BlockNumber>",
      exit_unstaking_period: "Option<BlockNumber>"
    }, value);
  }

  get stake_id(): StakeId {
    return this.getField<StakeId>('stake_id');
  }

  get termination_unstaking_period(): Option<BlockNumber> {
    return this.getField<Option<BlockNumber>>('termination_unstaking_period');
  }

  get exit_unstaking_period(): Option<BlockNumber> {
    return this.getField<Option<BlockNumber>>('exit_unstaking_period');
  }
}

export type IWorker = {
  member_id: MemberId,
  role_account_id: AccountId,
  reward_relationship: Option<RewardRelationshipId>,
  role_stake_profile: Option<RoleStakeProfile>,
}

export class Worker extends JoyStruct<IWorker> {
  constructor (value?: IWorker) {
    super({
      member_id: MemberId,
      role_account_id: "AccountId",
      reward_relationship: Option.with(RewardRelationshipId),
      role_stake_profile: Option.with(RoleStakeProfile),
    }, value);
  }

  get member_id(): MemberId {
    return this.getField<MemberId>('member_id');
  }

  get role_account_id(): AccountId {
    return this.getField<AccountId>('role_account_id');
  }

  get reward_relationship(): Option<RewardRelationshipId> {
    return this.getField<Option<RewardRelationshipId>>('reward_relationship');
  }

  get role_stake_profile(): Option<RoleStakeProfile> {
    return this.getField<Option<RoleStakeProfile>>('role_stake_profile');
  }

  get is_active(): boolean {
    return !Boolean(this.isEmpty);
  }
}

export type ISlashableTerms = {
  max_count: u16,
  max_percent_pts_per_time: u16,
};

// This type is also defined in /content-working-group, but currently both those definitions are identical
// (I added this defininition here too, because techinicaly those are 2 different types in the runtime.
// Later the definition in /content-working-group will be removed and we can just register this type here)
export class SlashableTerms extends JoyStruct<ISlashableTerms> {
  constructor (value?: ISlashableTerms) {
    super({
      max_count: u16,
      max_percent_pts_per_time: u16,
    }, value);
  }
};

// This type is also defined in /content-working-group (as above)
export class SlashingTerms extends Enum {
  constructor (value?: any, index?: number) {
    super(
      {
        Unslashable: Null,
        Slashable: SlashableTerms,
      },
      value, index);
  }
};

export type IWorkingGroupOpeningPolicyCommitment = {
  application_rationing_policy: Option<ApplicationRationingPolicy>,
  max_review_period_length: BlockNumber,
  application_staking_policy: Option<StakingPolicy>,
  role_staking_policy: Option<StakingPolicy>,
  role_slashing_terms: SlashingTerms,
  fill_opening_successful_applicant_application_stake_unstaking_period: Option<BlockNumber>,
  fill_opening_failed_applicant_application_stake_unstaking_period: Option<BlockNumber>,
  fill_opening_failed_applicant_role_stake_unstaking_period: Option<BlockNumber>,
  terminate_application_stake_unstaking_period: Option<BlockNumber>,
  terminate_role_stake_unstaking_period: Option<BlockNumber>,
  exit_role_application_stake_unstaking_period: Option<BlockNumber>,
  exit_role_stake_unstaking_period: Option<BlockNumber>,
};

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
export class WorkingGroupOpeningPolicyCommitment extends JoyStruct<IWorkingGroupOpeningPolicyCommitment> {
  constructor (value?: WorkingGroupOpeningPolicyCommitment) {
    super({
      application_rationing_policy: Option.with(ApplicationRationingPolicy),
      max_review_period_length: "BlockNumber",
      application_staking_policy: Option.with(StakingPolicy),
      role_staking_policy: Option.with(StakingPolicy),
      role_slashing_terms: SlashingTerms,
      fill_opening_successful_applicant_application_stake_unstaking_period: "Option<BlockNumber>",
      fill_opening_failed_applicant_application_stake_unstaking_period: "Option<BlockNumber>",
      fill_opening_failed_applicant_role_stake_unstaking_period: "Option<BlockNumber>",
      terminate_application_stake_unstaking_period: "Option<BlockNumber>",
      terminate_role_stake_unstaking_period: "Option<BlockNumber>",
      exit_role_application_stake_unstaking_period: "Option<BlockNumber>",
      exit_role_stake_unstaking_period: "Option<BlockNumber>",
    }, value);
  }

  get application_rationing_policy(): Option<ApplicationRationingPolicy> {
    return this.getField<Option<ApplicationRationingPolicy>>('application_rationing_policy')
  }

  get max_review_period_length(): BlockNumber {
    return this.getField<BlockNumber>('max_review_period_length')
  }

  get application_staking_policy(): Option<StakingPolicy> {
    return this.getField<Option<StakingPolicy>>('application_staking_policy')
  }

  get role_staking_policy(): Option<StakingPolicy> {
    return this.getField<Option<StakingPolicy>>('role_staking_policy')
  }

  get role_slashing_terms(): SlashingTerms {
    return this.getField<SlashingTerms>('role_slashing_terms')
  }

  get fill_opening_successful_applicant_application_stake_unstaking_period(): Option<BlockNumber> {
    return this.getField<Option<BlockNumber>>('fill_opening_successful_applicant_application_stake_unstaking_period')
  }

  get fill_opening_failed_applicant_application_stake_unstaking_period(): Option<BlockNumber> {
    return this.getField<Option<BlockNumber>>('fill_opening_failed_applicant_application_stake_unstaking_period')
  }

  get fill_opening_failed_applicant_role_stake_unstaking_period(): Option<BlockNumber> {
    return this.getField<Option<BlockNumber>>('fill_opening_failed_applicant_role_stake_unstaking_period')
  }

  get terminate_application_stake_unstaking_period(): Option<BlockNumber> {
    return this.getField<Option<BlockNumber>>('terminate_application_stake_unstaking_period')
  }

  get terminate_role_stake_unstaking_period(): Option<BlockNumber> {
    return this.getField<Option<BlockNumber>>('terminate_role_stake_unstaking_period')
  }

  get exit_role_application_stake_unstaking_period(): Option<BlockNumber> {
    return this.getField<Option<BlockNumber>>('exit_role_application_stake_unstaking_period')
  }

  get exit_role_stake_unstaking_period(): Option<BlockNumber> {
    return this.getField<Option<BlockNumber>>('exit_role_stake_unstaking_period')
  }
};

export enum OpeningTypeKeys {
  Leader = 'Leader',
  Worker = 'Worker'
};

export class OpeningType extends Enum {
  constructor (value?: any, index?: number) {
    super(
      {
        Leader: Null,
        Worker: Null
      },
      value, index
    );
  }
};

export type IOpening = {
  hiring_opening_id: OpeningId,
  applications: BTreeSet<ApplicationId>,
  policy_commitment: WorkingGroupOpeningPolicyCommitment,
  opening_type: OpeningType
}

// This type is also defined in /hiring (and those are incosistent), but here
// it is beeing registered as "OpeningOf" (which is an alias used by the runtime working-group module),
// so it shouldn't cause any conflicts
export class Opening extends JoyStruct<IOpening> {
  constructor (value?: IWorker) {
    super({
      hiring_opening_id: OpeningId,
      applications: BTreeSet.with(ApplicationId),
      policy_commitment: WorkingGroupOpeningPolicyCommitment,
      opening_type: OpeningType
    }, value);
  }

  get hiring_opening_id(): OpeningId {
    return this.getField<OpeningId>('hiring_opening_id');
  }

  get applications(): BTreeSet<ApplicationId> {
    return this.getField<BTreeSet<ApplicationId>>('applications');
  }

  get policy_commitment(): WorkingGroupOpeningPolicyCommitment {
    return this.getField<WorkingGroupOpeningPolicyCommitment>('policy_commitment');
  }

  get opening_type(): OpeningType {
    return this.getField<OpeningType>('opening_type');
  }
}

// Also defined in "content-working-group" runtime module, but those definitions are the consistent
export type IRewardPolicy = {
  amount_per_payout: Balance,
  next_payment_at_block: BlockNumber,
  payout_interval: Option<BlockNumber>,
};

export class RewardPolicy extends JoyStruct<IRewardPolicy> {
  constructor (value?: IRewardPolicy) {
    super({
      amount_per_payout: 'Balance',
      next_payment_at_block: 'BlockNumber',
      payout_interval: 'Option<BlockNumber>',
    }, value);
  }
};

export function registerWorkingGroupTypes() {
  try {
    getTypeRegistry().register({
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
      'working_group::WorkerId': WorkerId
    });
  } catch (err) {
    console.error('Failed to register custom types of working-group module', err);
  }
}
