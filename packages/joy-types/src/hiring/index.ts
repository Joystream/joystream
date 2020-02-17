import { getTypeRegistry, Null, u128, u64, u32, Vec, Option, Text } from '@polkadot/types';
import { Enum } from '@polkadot/types/codec';
import { BlockNumber, Balance } from '@polkadot/types/interfaces';
import { StakeId } from '../stake';
import { JoyStruct } from '../JoyStruct';

import { GenericJoyStreamRoleSchema } from './schemas/role.schema'

import ajv from 'ajv'

export class ApplicationId extends u64 { };
export class OpeningId extends u64 { };

export class CurrentBlock extends Null { };
export class ExactBlock extends u32 { }; // BlockNumber

export class ActivateOpeningAt extends Enum {
  constructor(value?: any, index?: number) {
    super(
      {
        CurrentBlock,
        ExactBlock,
      },
      value, index);
  }
}

export enum ApplicationDeactivationCauseKeys {
  External = 'External',
  Hired = 'Hired',
  NotHired = 'NotHired',
  CrowdedOut = 'CrowdedOut',
  OpeningCancelled = 'OpeningCancelled',
  ReviewPeriodExpired = 'ReviewPeriodExpired',
  OpeningFilled = 'OpeningFilled',
}

export class ApplicationDeactivationCause extends Enum {
  constructor(value?: any, index?: number) {
    super(
      [
        ApplicationDeactivationCauseKeys.External,
        ApplicationDeactivationCauseKeys.Hired,
        ApplicationDeactivationCauseKeys.NotHired,
        ApplicationDeactivationCauseKeys.CrowdedOut,
        ApplicationDeactivationCauseKeys.OpeningCancelled,
        ApplicationDeactivationCauseKeys.ReviewPeriodExpired,
        ApplicationDeactivationCauseKeys.OpeningFilled,
      ],
      value, index);
  }
};

export type UnstakingApplicationStageType = {
  deactivation_initiated: BlockNumber,
  cause: ApplicationDeactivationCause
};
export class UnstakingApplicationStage extends JoyStruct<UnstakingApplicationStageType> {
  constructor(value?: UnstakingApplicationStageType) {
    super({
      deactivation_initiated: u32, // BlockNumber
      cause: ApplicationDeactivationCause,
    }, value);
  }

  get cause(): ApplicationDeactivationCause {
    return this.getField<ApplicationDeactivationCause>('cause')
  }
};

export type InactiveApplicationStageType = {
  deactivation_initiated: BlockNumber,
  deactivated: BlockNumber,
  cause: ApplicationDeactivationCause
};
export class InactiveApplicationStage extends JoyStruct<InactiveApplicationStageType> {
  constructor(value?: InactiveApplicationStageType) {
    super({
      deactivation_initiated: u32, // BlockNumber
      deactivated: u32,
      cause: ApplicationDeactivationCause,
    }, value);
  }

  get cause(): ApplicationDeactivationCause {
    return this.getField<ApplicationDeactivationCause>('cause')
  }
};

export class ActiveApplicationStage extends Null { };

export enum ApplicationStageKeys {
  Active = 'Active',
  Unstaking = 'Unstaking',
  Inactive = 'Inactive',
}

export class ApplicationStage extends Enum {
  constructor(value?: any, index?: number) {
    super(
      {
        [ApplicationStageKeys.Active]: Null,
        [ApplicationStageKeys.Unstaking]: UnstakingApplicationStage,
        [ApplicationStageKeys.Inactive]: InactiveApplicationStage,
      },
      value, index);
  }
}

export type IApplicationRationingPolicy = {
  max_active_applicants: u32,
};
export class ApplicationRationingPolicy extends JoyStruct<IApplicationRationingPolicy> {
  constructor(value?: IApplicationRationingPolicy) {
    super({
      max_active_applicants: u32,
    }, value);
  }

  get max_active_applicants(): u32 {
    return this.getField<u32>('max_active_applicants')
  }
};

export type WaitingToBeingOpeningStageVariantType = {
  begins_at_block: BlockNumber,
};
export class WaitingToBeingOpeningStageVariant extends JoyStruct<WaitingToBeingOpeningStageVariantType> {
  constructor(value?: WaitingToBeingOpeningStageVariantType) {
    super({
      begins_at_block: u32,
    }, value);
  }

  get begins_at_block(): BlockNumber {
    return this.getField<BlockNumber>('begins_at_block')
  }
};

export enum OpeningDeactivationCauseKeys {
  CancelledBeforeActivation = 'CancelledBeforeActivation',
  CancelledAcceptingApplications = 'CancelledAcceptingApplications',
  CancelledInReviewPeriod = 'CancelledInReviewPeriod',
  ReviewPeriodExpired = 'ReviewPeriodExpired',
  Filled = 'Filled',
}

export class OpeningDeactivationCause extends Enum {
  constructor(value?: any, index?: number) {
    super(
      [
        OpeningDeactivationCauseKeys.CancelledBeforeActivation,
        OpeningDeactivationCauseKeys.CancelledAcceptingApplications,
        OpeningDeactivationCauseKeys.CancelledInReviewPeriod,
        OpeningDeactivationCauseKeys.ReviewPeriodExpired,
        OpeningDeactivationCauseKeys.Filled,
      ],
      value, index);
  }
};

export type IAcceptingApplications = {
  started_accepting_applicants_at_block: BlockNumber,
};
export class AcceptingApplications extends JoyStruct<IAcceptingApplications> {
  constructor(value?: IAcceptingApplications) {
    super({
      started_accepting_applicants_at_block: u32,
    }, value);
  }

  get started_accepting_applicants_at_block(): BlockNumber {
    return this.getField<BlockNumber>('started_accepting_applicants_at_block')
  }
};

export type IReviewPeriod = {
  started_accepting_applicants_at_block: BlockNumber,
  started_review_period_at_block: BlockNumber,
};
export class ReviewPeriod extends JoyStruct<IReviewPeriod> {
  constructor(value?: IReviewPeriod) {
    super({
      started_accepting_applicants_at_block: u32,
      started_review_period_at_block: u32,
    }, value);
  }

  get started_accepting_applicants_at_block(): BlockNumber {
    return this.getField<BlockNumber>('started_accepting_applicants_at_block')
  }

  get started_review_period_at_block(): BlockNumber {
    return this.getField<BlockNumber>('started_review_period_at_block')
  }
};

export type IDeactivated = {
  cause: OpeningDeactivationCause,
  deactivated_at_block: BlockNumber,
  started_accepting_applicants_at_block: BlockNumber,
  started_review_period_at_block: Option<BlockNumber>,
};
export class Deactivated extends JoyStruct<IDeactivated> {
  constructor(value?: IDeactivated) {
    super({
      cause: OpeningDeactivationCause,
      deactivated_at_block: u32,
      started_accepting_applicants_at_block: u32,
      started_review_period_at_block: Option.with(u32),
    }, value);
  }

  get cause(): OpeningDeactivationCause {
    return this.getField<OpeningDeactivationCause>('cause')
  }

  get deactivated_at_block(): BlockNumber {
    return this.getField<BlockNumber>('deactivated_at_block')
  }

  get started_accepting_applicants_at_block(): BlockNumber {
    return this.getField<BlockNumber>('started_accepting_applicants_at_block')
  }

  get started_review_period_at_block(): BlockNumber {
    return this.getField<BlockNumber>('started_review_period_at_block')
  }
};

export enum ActiveOpeningStageKeys {
  AcceptingApplications = 'AcceptingApplications',
  ReviewPeriod = 'ReviewPeriod',
  Deactivated = 'Deactivated',
}

export class ActiveOpeningStage extends Enum {
  constructor(value?: any, index?: number) {
    super(
      {
        [ActiveOpeningStageKeys.AcceptingApplications]: AcceptingApplications,
        [ActiveOpeningStageKeys.ReviewPeriod]: ReviewPeriod,
        [ActiveOpeningStageKeys.Deactivated]: Deactivated,
      },
      value, index);
  }
}

export type ActiveOpeningStageVariantType = {
  stage: ActiveOpeningStage,
  applications_added: Vec<ApplicationId>,//BTreeSet<ApplicationId>,
  active_application_count: u32,
  unstaking_application_count: u32,
  deactivated_application_count: u32,
}
export class ActiveOpeningStageVariant extends JoyStruct<ActiveOpeningStageVariantType> {
  constructor(value?: ActiveOpeningStageVariantType) {
    super({
      stage: ActiveOpeningStage,
      applications_added: Vec.with(ApplicationId),//BTreeSet<ApplicationId>,
      active_application_count: u32,
      unstaking_application_count: u32,
      deactivated_application_count: u32,
    }, value);
  }

  get stage(): ActiveOpeningStage {
    return this.getField<ActiveOpeningStage>('stage')
  }

  get is_active(): boolean {
    switch (this.stage.type) {
      case ActiveOpeningStageKeys.AcceptingApplications:
        return true
    }

	  return false
  }
}

export enum OpeningStageKeys {
  WaitingToBegin = 'WaitingToBegin',
  Active = 'Active',
}

export class OpeningStage extends Enum {
  constructor(value?: any, index?: number) {
    super(
      {
        [OpeningStageKeys.WaitingToBegin]: WaitingToBeingOpeningStageVariant,
        [OpeningStageKeys.Active]: ActiveOpeningStageVariant,
      },
      value, index);
  }
};

export enum StakingAmountLimitModeKeys {
  AtLeast = 'AtLeast',
  Exact = 'Exact',
}

export class StakingAmountLimitMode extends Enum {
  constructor(value?: any, index?: number) {
    super(
      [
        StakingAmountLimitModeKeys.AtLeast,
        StakingAmountLimitModeKeys.Exact,
      ],
      value, index);
  }
};

export type IStakingPolicy = {
  amount: Balance,
  amount_mode: StakingAmountLimitMode,
  crowded_out_unstaking_period_length: Option<BlockNumber>,
  review_period_expired_unstaking_period_length: Option<BlockNumber>,
};
export class StakingPolicy extends JoyStruct<IStakingPolicy> {
  constructor(value?: IStakingPolicy) {
    super({
      amount: u128,
      amount_mode: StakingAmountLimitMode,
      crowded_out_unstaking_period_length: Option.with(u32),
      review_period_expired_unstaking_period_length: Option.with(u32),
    }, value);
  }

  get amount(): u128 {
    return this.getField<u128>('amount')
  }

  get amount_mode(): StakingAmountLimitMode {
    return this.getField<StakingAmountLimitMode>('amount_mode')
  }

  get crowded_out_unstaking_period_length(): Option<u32> {
    return this.getField<Option<u32>>('crowded_out_unstaking_period_length')
  }

  get review_period_expired_unstaking_period_length(): Option<u32> {
    return this.getField<Option<u32>>('review_period_expired_unstaking_period_length')
  }

};

const schemaValidator = new ajv({ allErrors: true }).compile(require('./schemas/role.schema.json'))

export type IOpening = {
  created: BlockNumber,
  stage: OpeningStage,
  max_review_period_length: BlockNumber,
  application_rationing_policy: Option<ApplicationRationingPolicy>,
  application_staking_policy: Option<StakingPolicy>,
  role_staking_policy: Option<StakingPolicy>,
  human_readable_text: Text, // Vec<u8>,
};

export class Opening extends JoyStruct<IOpening> {
  constructor(value?: IOpening) {
    super({
      created: u32,
      stage: OpeningStage,
      max_review_period_length: u32,
      application_rationing_policy: Option.with(ApplicationRationingPolicy),
      application_staking_policy: Option.with(StakingPolicy),
      role_staking_policy: Option.with(StakingPolicy),
      human_readable_text: Text, // Vec.with(u8),
    }, value);
  }

  parse_human_readable_text(): GenericJoyStreamRoleSchema | string | undefined {
    const hrt = this.getField<Text>('human_readable_text')

    if (!hrt) {
      return undefined
    }

    const str = hrt.toString()

    try {
      const obj = JSON.parse(str)
      if (schemaValidator(obj) === true) {
        return obj as unknown as GenericJoyStreamRoleSchema
      }
    } catch (e) {
      console.log("JSON schema validation failed:", e.toString())
    }

    return str
  }

  get created(): BlockNumber {
    return this.getField<BlockNumber>('created')
  }

  get stage(): OpeningStage {
    return this.getField<OpeningStage>('stage')
  }

  get max_review_period_length(): BlockNumber {
    return this.getField<BlockNumber>('max_review_period_length')
  }

  get application_rationing_policy(): Option<ApplicationRationingPolicy> {
    return this.getField<Option<ApplicationRationingPolicy>>('application_rationing_policy')
  }

  get application_staking_policy(): Option<StakingPolicy> {
    return this.getField<Option<StakingPolicy>>('application_staking_policy')
  }

  get role_staking_policy(): Option<StakingPolicy> {
    return this.getField<Option<StakingPolicy>>('role_staking_policy')
  }

  get max_applicants(): number {
    const appPolicy = this.application_rationing_policy
    if (appPolicy.isNone) {
      return 0
    }
    return appPolicy.unwrap().max_active_applicants.toNumber()
  }

  get is_active(): boolean {
    switch (this.stage.type) {
      case OpeningStageKeys.WaitingToBegin:
        return true

      case OpeningStageKeys.Active:
        return (this.stage.value as ActiveOpeningStageVariant).is_active
    }

	  return false
  }
}

export type IApplication = {
  opening_id: OpeningId,
  application_index_in_opening: u32,
  add_to_opening_in_block: BlockNumber,
  active_role_staking_id: Option<StakeId>,
  active_application_staking_id: Option<StakeId>,
  stage: ApplicationStage,
  human_readable_text: Text,
}

export class Application extends JoyStruct<IApplication> {
  constructor(value?: IOpening) {
    super({
      opening_id: OpeningId,
      application_index_in_opening: u32,
      add_to_opening_in_block: u32,
      active_role_staking_id: Option.with(StakeId),
      active_application_staking_id: Option.with(StakeId),
      stage: ApplicationStage,
      human_readable_text: Text,
    }, value);
  }

  get stage(): ApplicationStage {
    return this.getField<ApplicationStage>('stage')
  }

  get active_role_staking_id(): Option<StakeId> {
    return this.getField<Option<StakeId>>('active_role_staking_id')
  }

  get active_application_staking_id(): Option<StakeId> {
    return this.getField<Option<StakeId>>('active_application_staking_id')
  }
}

export function registerHiringTypes() {
  try {
    getTypeRegistry().register({
      ApplicationId,
      OpeningId,
      Application,
      ApplicationStage,
      // why the prefix? is there some other identically named type?
      'hiring::ActivateOpeningAt': ActivateOpeningAt,
      ApplicationRationingPolicy,
      OpeningStage,
      StakingPolicy,
      Opening,
    });
  } catch (err) {
    console.error('Failed to register custom types of hiring module', err);
  }
}
