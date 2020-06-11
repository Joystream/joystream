import { getTypeRegistry, Bytes, BTreeMap, Option, Enum } from '@polkadot/types';
import { u16, Null } from '@polkadot/types/primitive';
import { AccountId, BlockNumber } from '@polkadot/types/interfaces';
import { MemberId, ActorId } from '../members';
import { ApplicationId, OpeningId, ApplicationRationingPolicy, StakingPolicy } from '../hiring';
import { RewardRelationshipId } from '../recurring-rewards';
import { StakeId } from '../stake';
import { JoyStruct } from '../JoyStruct';
import { BTreeSet } from '../';

export type ILead = {
  member_id: MemberId,
  role_account_id: AccountId
};

export class Lead extends JoyStruct<ILead> {
  constructor (value?: ILead) {
    super({
      member_id: MemberId,
      role_account_id: "AccountId"
    }, value);
  }

  get member_id(): MemberId {
    return this.getField<MemberId>('member_id')
  }

  get role_account_id(): AccountId {
    return this.getField<AccountId>('role_account_id')
  }
};

export class WorkerApplicationId extends ApplicationId { };

export class WorkerOpeningId extends OpeningId { };

export class RationaleText extends Bytes { };

export type IWorkerApplication = {
  role_account: AccountId,
  worker_opening_id: WorkerOpeningId,
  member_id: MemberId,
  application_id: ApplicationId
};

export class WorkerApplication extends JoyStruct<IWorkerApplication> {
  constructor (value?: IWorkerApplication) {
    super({
      role_account: "AccountId",
      worker_opening_id: WorkerOpeningId,
      member_id: MemberId,
      application_id: ApplicationId
    }, value);
  }

  get role_account(): AccountId {
    return this.getField<AccountId>('role_account');
  }

  get worker_opening_id(): WorkerOpeningId {
    return this.getField<WorkerOpeningId>('worker_opening_id');
  }

  get member_id(): MemberId {
    return this.getField<MemberId>('member_id');
  }

  get application_id(): ApplicationId {
    return this.getField<ApplicationId>('application_id');
  }
}

export class WorkerId extends ActorId { };

export class WorkerApplicationIdSet extends BTreeSet.with(WorkerApplicationId) { };

export class WorkerApplicationIdToWorkerIdMap extends BTreeMap.with(WorkerApplicationId, WorkerId) { };


export type IWorkerRoleStakeProfile = {
  stake_id: StakeId,
  termination_unstaking_period: Option<BlockNumber>,
  exit_unstaking_period: Option<BlockNumber>,
};

export class WorkerRoleStakeProfile extends JoyStruct<IWorkerRoleStakeProfile> {
  constructor (value?: IWorkerRoleStakeProfile) {
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
  role_account: AccountId,
  reward_relationship: Option<RewardRelationshipId>,
  role_stake_profile: Option<WorkerRoleStakeProfile>,
}

export class Worker extends JoyStruct<IWorker> {
  constructor (value?: IWorker) {
    super({
      member_id: MemberId,
      role_account: "AccountId",
      reward_relationship: Option.with(RewardRelationshipId),
      role_stake_profile: Option.with(WorkerRoleStakeProfile),
    }, value);
  }

  get member_id(): MemberId {
    return this.getField<MemberId>('member_id');
  }

  get role_account(): AccountId {
    return this.getField<AccountId>('role_account');
  }

  get reward_relationship(): Option<RewardRelationshipId> {
    return this.getField<Option<RewardRelationshipId>>('reward_relationship');
  }

  get role_stake_profile(): Option<WorkerRoleStakeProfile> {
    return this.getField<Option<WorkerRoleStakeProfile>>('role_stake_profile');
  }
}

export type ISlashableTerms = {
  max_count: u16,
  max_percent_pts_per_time: u16,
};

export class SlashableTerms extends JoyStruct<ISlashableTerms> {
  constructor (value?: ISlashableTerms) {
    super({
      max_count: u16,
      max_percent_pts_per_time: u16,
    }, value);
  }
};

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

export type IBureaucracyOpeningPolicyCommitment = {
  application_rationing_policy: Option<ApplicationRationingPolicy>,
  max_review_period_length: BlockNumber,
  application_staking_policy: Option<StakingPolicy>,
  role_staking_policy: Option<StakingPolicy>,
  role_slashing_terms: SlashingTerms,
  fill_opening_successful_applicant_application_stake_unstaking_period: Option<BlockNumber>,
  fill_opening_failed_applicant_application_stake_unstaking_period: Option<BlockNumber>,
  fill_opening_failed_applicant_role_stake_unstaking_period: Option<BlockNumber>,
  terminate_worker_application_stake_unstaking_period: Option<BlockNumber>,
  terminate_worker_role_stake_unstaking_period: Option<BlockNumber>,
  exit_worker_role_application_stake_unstaking_period: Option<BlockNumber>,
  exit_worker_role_stake_unstaking_period: Option<BlockNumber>,
};

export class BureaucracyOpeningPolicyCommitment extends JoyStruct<IBureaucracyOpeningPolicyCommitment> {
  constructor (value?: BureaucracyOpeningPolicyCommitment) {
    super({
      application_rationing_policy: Option.with(ApplicationRationingPolicy),
      max_review_period_length: "BlockNumber",
      application_staking_policy: Option.with(StakingPolicy),
      role_staking_policy: Option.with(StakingPolicy),
      role_slashing_terms: SlashingTerms,
      fill_opening_successful_applicant_application_stake_unstaking_period: "Option<BlockNumber>",
      fill_opening_failed_applicant_application_stake_unstaking_period: "Option<BlockNumber>",
      fill_opening_failed_applicant_role_stake_unstaking_period: "Option<BlockNumber>",
      terminate_worker_application_stake_unstaking_period: "Option<BlockNumber>",
      terminate_worker_role_stake_unstaking_period: "Option<BlockNumber>",
      exit_worker_role_application_stake_unstaking_period: "Option<BlockNumber>",
      exit_worker_role_stake_unstaking_period: "Option<BlockNumber>",
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

  get terminate_worker_application_stake_unstaking_period(): Option<BlockNumber> {
    return this.getField<Option<BlockNumber>>('terminate_worker_application_stake_unstaking_period')
  }

  get terminate_worker_role_stake_unstaking_period(): Option<BlockNumber> {
    return this.getField<Option<BlockNumber>>('terminate_worker_role_stake_unstaking_period')
  }

  get exit_worker_role_application_stake_unstaking_period(): Option<BlockNumber> {
    return this.getField<Option<BlockNumber>>('exit_worker_role_application_stake_unstaking_period')
  }

  get exit_worker_role_stake_unstaking_period(): Option<BlockNumber> {
    return this.getField<Option<BlockNumber>>('exit_worker_role_stake_unstaking_period')
  }
};

export type IWorkerOpening = {
  opening_id: OpeningId,
  worker_applications: BTreeSet<WorkerApplicationId>,
  policy_commitment: BureaucracyOpeningPolicyCommitment,
}

// FIXME: Because the api still "thinks" that the "commitment" argument of "forumBureaucracy.addWorkerOpening" extrinsic
// is of type "OpeningPolicyCommitment" (instead of "BureaucracyOpeningPolicyCommitment"), the CWG's OpeningPolicyCommitment type
// is used there (it has "terminate_curator_role_stake_unstaking_period" insted of "terminate_worker_role_stake_unstaking_period" etc.)
// Because those types are basically the same structs (only filed names are different) nothing seems to break yet, but it's
// very fragile atm, since any change to this type in bureaucracy module could result in "unsolvable" inconsistencies
// (unless the name is changed too)
export class WorkerOpening extends JoyStruct<IWorkerOpening> {
  constructor (value?: IWorker) {
    super({
      opening_id: OpeningId,
      worker_applications: BTreeSet.with(WorkerApplicationId),
      policy_commitment: BureaucracyOpeningPolicyCommitment,
    }, value);
  }

  get opening_id(): OpeningId {
    return this.getField<OpeningId>('opening_id');
  }

  get worker_applications(): BTreeSet<WorkerApplicationId> {
    return this.getField<BTreeSet<WorkerApplicationId>>('worker_applications');
  }

  get policy_commitment(): BureaucracyOpeningPolicyCommitment {
    return this.getField<BureaucracyOpeningPolicyCommitment>('policy_commitment');
  }
}

export function registerBureaucracyTypes() {
  try {
    getTypeRegistry().register({
      // Note that it actually HAS TO be "LeadOf" in the runtime,
      // otherwise there would be conflicts with the current content-workig-group module
      LeadOf: Lead,
      RationaleText,
      WorkerApplication,
      WorkerApplicationId,
      WorkerApplicationIdSet,
      WorkerApplicationIdToWorkerIdMap,
      WorkerId,
      WorkerOf: Worker,
      WorkerOpening,
      WorkerOpeningId
    });
  } catch (err) {
    console.error('Failed to register custom types of bureaucracy module', err);
  }
}
