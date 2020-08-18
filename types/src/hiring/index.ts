import { Null, u128, u64, u32, Option, Text } from '@polkadot/types'
import { BTreeSet } from '@polkadot/types/codec'
import { BlockNumber, Balance } from '@polkadot/types/interfaces'
import { JoyEnum, JoyStructDecorated } from '../common'
import { StakeId } from '../stake'

import { GenericJoyStreamRoleSchema } from './schemas/role.schema.typings'

import ajv from 'ajv'

import * as role_schema_json from './schemas/role.schema.json'
import { RegistryTypes } from '@polkadot/types/types'

export class ApplicationId extends u64 {}
export class OpeningId extends u64 {}

export class CurrentBlock extends Null {}
export class ExactBlock extends u32 {} // BlockNumber

export const ActivateOpeningAtDef = {
  CurrentBlock,
  ExactBlock,
} as const
export const ActivateOpeningAtKeys: { [k in keyof typeof ActivateOpeningAtDef]: k } = {
  CurrentBlock: 'CurrentBlock',
  ExactBlock: 'ExactBlock',
} as const
export type ActivateOpeningAtKey = keyof typeof ActivateOpeningAtDef
export class ActivateOpeningAt extends JoyEnum(ActivateOpeningAtDef) {}

// FIXME: Replace usages with isOfType, asType wherever possible
export enum ApplicationDeactivationCauseKeys {
  External = 'External',
  Hired = 'Hired',
  NotHired = 'NotHired',
  CrowdedOut = 'CrowdedOut',
  OpeningCancelled = 'OpeningCancelled',
  ReviewPeriodExpired = 'ReviewPeriodExpired',
  OpeningFilled = 'OpeningFilled',
}
const ApplicationDeactivationCauseDef = {
  External: Null,
  Hired: Null,
  NotHired: Null,
  CrowdedOut: Null,
  OpeningCancelled: Null,
  ReviewPeriodExpired: Null,
  OpeningFilled: Null,
} as const
export class ApplicationDeactivationCause extends JoyEnum(ApplicationDeactivationCauseDef) {}

export type UnstakingApplicationStageType = {
  deactivation_initiated: BlockNumber
  cause: ApplicationDeactivationCause
}
export class UnstakingApplicationStage
  extends JoyStructDecorated({
    deactivation_initiated: u32, // BlockNumber
    cause: ApplicationDeactivationCause,
  })
  implements UnstakingApplicationStageType {}

export type InactiveApplicationStageType = {
  deactivation_initiated: BlockNumber
  deactivated: BlockNumber
  cause: ApplicationDeactivationCause
}
export class InactiveApplicationStage
  extends JoyStructDecorated({
    deactivation_initiated: u32, // BlockNumber
    deactivated: u32,
    cause: ApplicationDeactivationCause,
  })
  implements InactiveApplicationStageType {}

export class ActiveApplicationStage extends Null {}
// FIXME: Replace usages with isOfType, asType wherever possible
export enum ApplicationStageKeys {
  Active = 'Active',
  Unstaking = 'Unstaking',
  Inactive = 'Inactive',
}
export const ApplicationStageDef = {
  Active: ActiveApplicationStage,
  Unstaking: UnstakingApplicationStage,
  Inactive: InactiveApplicationStage,
} as const
export class ApplicationStage extends JoyEnum(ApplicationStageDef) {}

export type IApplicationRationingPolicy = {
  max_active_applicants: u32
}
export class ApplicationRationingPolicy
  extends JoyStructDecorated({
    max_active_applicants: u32,
  })
  implements IApplicationRationingPolicy {}

export type WaitingToBeingOpeningStageVariantType = {
  begins_at_block: BlockNumber
}
export class WaitingToBeingOpeningStageVariant
  extends JoyStructDecorated({
    begins_at_block: u32,
  })
  implements WaitingToBeingOpeningStageVariantType {}

// FIXME: Replace usages with isOfType, asType wherever possible
export enum OpeningDeactivationCauseKeys {
  CancelledBeforeActivation = 'CancelledBeforeActivation',
  CancelledAcceptingApplications = 'CancelledAcceptingApplications',
  CancelledInReviewPeriod = 'CancelledInReviewPeriod',
  ReviewPeriodExpired = 'ReviewPeriodExpired',
  Filled = 'Filled',
}
const OpeningDeactivationCauseDef = {
  CancelledBeforeActivation: Null,
  CancelledAcceptingApplications: Null,
  CancelledInReviewPeriod: Null,
  ReviewPeriodExpired: Null,
  Filled: Null,
} as const
export class OpeningDeactivationCause extends JoyEnum(OpeningDeactivationCauseDef) {}

export type IAcceptingApplications = {
  started_accepting_applicants_at_block: BlockNumber
}
export class AcceptingApplications
  extends JoyStructDecorated({
    started_accepting_applicants_at_block: u32,
  })
  implements IAcceptingApplications {}

export type IReviewPeriod = {
  started_accepting_applicants_at_block: BlockNumber
  started_review_period_at_block: BlockNumber
}
export class ReviewPeriod
  extends JoyStructDecorated({
    started_accepting_applicants_at_block: u32,
    started_review_period_at_block: u32,
  })
  implements IReviewPeriod {}

export type IDeactivated = {
  cause: OpeningDeactivationCause
  deactivated_at_block: BlockNumber
  started_accepting_applicants_at_block: BlockNumber
  started_review_period_at_block: Option<BlockNumber>
}
export class Deactivated
  extends JoyStructDecorated({
    cause: OpeningDeactivationCause,
    deactivated_at_block: u32,
    started_accepting_applicants_at_block: u32,
    started_review_period_at_block: Option.with(u32),
  })
  implements IDeactivated {}

export const ActiveOpeningStageDef = {
  AcceptingApplications: AcceptingApplications,
  ReviewPeriod: ReviewPeriod,
  Deactivated: Deactivated,
} as const
export type ActiveOpeningStageKey = keyof typeof ActiveOpeningStageDef
export class ActiveOpeningStage extends JoyEnum(ActiveOpeningStageDef) {}

export type ActiveOpeningStageVariantType = {
  stage: ActiveOpeningStage
  applications_added: BTreeSet<ApplicationId>
  active_application_count: u32
  unstaking_application_count: u32
  deactivated_application_count: u32
}
export class ActiveOpeningStageVariant extends JoyStructDecorated({
  stage: ActiveOpeningStage,
  applications_added: BTreeSet.with(ApplicationId),
  active_application_count: u32,
  unstaking_application_count: u32,
  deactivated_application_count: u32,
}) {
  get is_active(): boolean {
    return this.stage.isOfType('AcceptingApplications')
  }
}

// FIXME: Replace usages with isOfType, asType wherever possible
export enum OpeningStageKeys {
  WaitingToBegin = 'WaitingToBegin',
  Active = 'Active',
}
export const OpeningStageDef = {
  WaitingToBegin: WaitingToBeingOpeningStageVariant,
  Active: ActiveOpeningStageVariant,
} as const
export class OpeningStage extends JoyEnum(OpeningStageDef) {}

// FIXME: Replace usages with isOfType, asType wherever possible
export enum StakingAmountLimitModeKeys {
  AtLeast = 'AtLeast',
  Exact = 'Exact',
}
export const StakingAmountLimitModeDef = {
  AtLeast: Null,
  Exact: Null,
} as const
export class StakingAmountLimitMode extends JoyEnum(StakingAmountLimitModeDef) {}

export type IStakingPolicy = {
  amount: Balance
  amount_mode: StakingAmountLimitMode
  crowded_out_unstaking_period_length: Option<BlockNumber>
  review_period_expired_unstaking_period_length: Option<BlockNumber>
}
export class StakingPolicy
  extends JoyStructDecorated({
    amount: u128,
    amount_mode: StakingAmountLimitMode,
    crowded_out_unstaking_period_length: Option.with(u32),
    review_period_expired_unstaking_period_length: Option.with(u32),
  })
  implements IStakingPolicy {}
export const schemaValidator: ajv.ValidateFunction = new ajv({ allErrors: true }).compile(role_schema_json)

const OpeningHRTFallback: GenericJoyStreamRoleSchema = {
  version: 1,
  headline: 'Unknown',
  job: {
    title: 'Unknown',
    description: 'Unknown',
  },
  application: {},
  reward: 'Unknown',
  creator: {
    membership: {
      handle: 'Unknown',
    },
  },
}

export type IOpening = {
  created: BlockNumber
  stage: OpeningStage
  max_review_period_length: BlockNumber
  application_rationing_policy: Option<ApplicationRationingPolicy>
  application_staking_policy: Option<StakingPolicy>
  role_staking_policy: Option<StakingPolicy>
  human_readable_text: Text // Vec<u8>,
}

export class Opening
  extends JoyStructDecorated({
    created: u32,
    stage: OpeningStage,
    max_review_period_length: u32,
    application_rationing_policy: Option.with(ApplicationRationingPolicy),
    application_staking_policy: Option.with(StakingPolicy),
    role_staking_policy: Option.with(StakingPolicy),
    human_readable_text: Text, // Vec.with(u8),
  })
  implements IOpening {
  parse_human_readable_text(): GenericJoyStreamRoleSchema | string | undefined {
    const hrt = this.human_readable_text

    if (!hrt) {
      return undefined
    }

    const str = hrt.toString()

    try {
      const obj = JSON.parse(str)
      if (schemaValidator(obj) === true) {
        return (obj as unknown) as GenericJoyStreamRoleSchema
      }
      console.log('parse_human_readable_text JSON schema validation failed:', schemaValidator.errors)
    } catch (e) {
      console.log('parse_human_readable_text JSON schema validation failed:', e.toString())
    }

    return str
  }

  parse_human_readable_text_with_fallback(): GenericJoyStreamRoleSchema {
    const hrt = this.parse_human_readable_text()

    if (typeof hrt !== 'object') {
      return OpeningHRTFallback
    }

    return hrt
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
  opening_id: OpeningId
  application_index_in_opening: u32
  add_to_opening_in_block: BlockNumber
  active_role_staking_id: Option<StakeId>
  active_application_staking_id: Option<StakeId>
  stage: ApplicationStage
  human_readable_text: Text
}

export class Application
  extends JoyStructDecorated({
    opening_id: OpeningId,
    application_index_in_opening: u32,
    add_to_opening_in_block: u32,
    active_role_staking_id: Option.with(StakeId),
    active_application_staking_id: Option.with(StakeId),
    stage: ApplicationStage,
    human_readable_text: Text,
  })
  implements IApplication {}

export const hiringTypes: RegistryTypes = {
  ApplicationId: 'u64',
  OpeningId: 'u64',
  Application,
  ApplicationStage,
  ActivateOpeningAt,
  ApplicationRationingPolicy,
  OpeningStage,
  StakingPolicy,
  Opening,
  // Expose in registry for api.createType purposes:
  WaitingToBeingOpeningStageVariant,
  ActiveOpeningStageVariant,
  ActiveOpeningStage,
  AcceptingApplications,
  ReviewPeriod,
  Deactivated,
  OpeningDeactivationCause,
  InactiveApplicationStage,
  UnstakingApplicationStage,
  ApplicationDeactivationCause,
}

export default hiringTypes
