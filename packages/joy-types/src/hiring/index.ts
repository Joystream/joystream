import { getTypeRegistry, Null, u128, u64, u32, Vec, Option, Text } from '@polkadot/types';
import { Enum } from '@polkadot/types/codec';
import { BlockNumber, Balance } from '@polkadot/types/interfaces';
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

export class ApplicationDeactivationCause extends Enum {
  constructor(value?: any, index?: number) {
    super(
      [
        'External',
        'Hired',
        'NotHired',
        'CrowdedOut',
        'OpeningCancelled',
        'ReviewPeriodExpired',
        'OpeningFilled',
      ],
      value, index);
  }
};

export type UnstakingApplicationStageType = {
  deactivation_initiated: BlockNumber,
  case: ApplicationDeactivationCause
};
export class UnstakingApplicationStage extends JoyStruct<UnstakingApplicationStageType> {
  constructor(value?: UnstakingApplicationStageType) {
    super({
      deactivation_initiated: u32, // BlockNumber
      cause: ApplicationDeactivationCause,
    }, value);
  }
};

export type InactiveApplicationStageType = {
  deactivation_initiated: BlockNumber,
  deactivated: BlockNumber,
  case: ApplicationDeactivationCause
};
export class InactiveApplicationStage extends JoyStruct<InactiveApplicationStageType> {
  constructor(value?: InactiveApplicationStageType) {
    super({
      deactivation_initiated: u32, // BlockNumber
      deactivated: u32,
      cause: ApplicationDeactivationCause,
    }, value);
  }
};

export class ActiveApplicationStage extends Null { };

export class ApplicationStage extends Enum {
  constructor(value?: any, index?: number) {
    super(
      {
        'Active': Null,
        'Unstaking': UnstakingApplicationStage,
        'Inactive': InactiveApplicationStage,
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
};

export class OpeningDeactivationCause extends Enum {
  constructor(value?: any, index?: number) {
    super(
      [
        'CancelledBeforeActivation',
        'CancelledAcceptingApplications',
        'CancelledInReviewPeriod',
        'ReviewPeriodExpired',
        'Filled',
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
};

export class ActiveOpeningStage extends Enum {
  constructor(value?: any, index?: number) {
    super(
      {
        'AcceptingApplications': AcceptingApplications,
        'ReviewPeriod': ReviewPeriod,
        'Deactivated': Deactivated,
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
}

export class OpeningStage extends Enum {
  constructor(value?: any, index?: number) {
    super(
      {
        'WaitingToBegin': WaitingToBeingOpeningStageVariant,
        'Active': ActiveOpeningStageVariant,
      },
      value, index);
  }
};

export class StakingAmountLimitMode extends Enum {
  constructor(value?: any, index?: number) {
    super(
      [
        'AtLeast',
        'Exact',
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

  get human_readable_text(): GenericJoyStreamRoleSchema | string | undefined {
    const hrt = this.get('human_readable_text')

    if (typeof hrt === "undefined") {
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

  get stage(): OpeningStage {
    return this.getField<OpeningStage>('stage')
  }

  get max_review_period_length(): BlockNumber {
    return this.getField<BlockNumber>('max_review_period_length')
  }
}

export function registerHiringTypes() {
  try {
    getTypeRegistry().register({
      ApplicationId,
      OpeningId,
      // Make into a ts type
      Application: {
        opening_id: 'OpeningId',
        application_index_in_opening: 'u32',
        add_to_opening_in_block: 'BlockNumber',
        active_role_staking_id: 'Option<StakeId>',
        active_application_staking_id: 'Option<StakeId>',
        stage: 'ApplicationStage',
        human_readable_text: 'Text'
      },
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
