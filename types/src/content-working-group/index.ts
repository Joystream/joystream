import { BTreeMap, BTreeSet, bool, u32, Text, Null, Option, Vec } from '@polkadot/types'
import { BlockNumber } from '@polkadot/types/interfaces'
import { OptionText, Credential, JoyEnum, JoyStructDecorated, SlashingTerms } from '../common'
import { ActorId, MemberId } from '../members'
import { StakeId } from '../stake'
import { OpeningId, ApplicationId, ApplicationRationingPolicy, StakingPolicy } from '../hiring/index'
import { RewardRelationshipId } from '../recurring-rewards'
import ChannelId from './ChannelId'
import AccountId from '@polkadot/types/generic/AccountId'

export { ChannelId }
export class CuratorId extends ActorId {}
export class CuratorOpeningId extends OpeningId {}
export class CuratorApplicationId extends ApplicationId {}
export class LeadId extends ActorId {}
export class PrincipalId extends Credential {}

export class OptionalText extends OptionText {}

export const ChannelContentTypeAllValues = ['Video', 'Music', 'Ebook'] as const
// FIXME: Naming conventions (Keys?)
export type ChannelContentTypeValue = typeof ChannelContentTypeAllValues[number]
export const ChannelContentTypeDef = {
  Video: Null,
  Music: Null,
  Ebook: Null,
} as const
export class ChannelContentType extends JoyEnum(ChannelContentTypeDef) {}

export const ChannelPublicationStatusAllValues = ['Public', 'Unlisted'] as const
// FIXME: Naming conventions (Keys?)
export type ChannelPublicationStatusValue = typeof ChannelPublicationStatusAllValues[number]
export const ChannelPublicationStatusDef = {
  Public: Null,
  Unlisted: Null,
} as const
export class ChannelPublicationStatus extends JoyEnum(ChannelPublicationStatusDef) {}

export const ChannelCurationStatusAllValues = ['Normal', 'Censored'] as const
// FIXME: Naming conventions (Keys?)
export type ChannelCurationStatusValue = typeof ChannelCurationStatusAllValues[number]
export const ChannelCurationStatusDef = {
  Normal: Null,
  Censored: Null,
} as const
export class ChannelCurationStatus extends JoyEnum(ChannelCurationStatusDef) {}

export type IChannel = {
  verified: bool
  handle: Text // Vec<u8>,
  title: OptionalText
  description: OptionalText
  avatar: OptionalText
  banner: OptionalText
  content: ChannelContentType
  owner: MemberId
  role_account: AccountId
  publication_status: ChannelPublicationStatus
  curation_status: ChannelCurationStatus
  created: BlockNumber
  principal_id: PrincipalId
}
export class Channel
  extends JoyStructDecorated({
    verified: bool,
    handle: Text, // Vec.with(u8),
    title: OptionalText,
    description: OptionalText,
    avatar: OptionalText,
    banner: OptionalText,
    content: ChannelContentType,
    owner: MemberId,
    role_account: AccountId,
    publication_status: ChannelPublicationStatus,
    curation_status: ChannelCurationStatus,
    created: u32, // BlockNumber,
    principal_id: PrincipalId,
  })
  implements IChannel {}

export class CurationActor extends JoyEnum({
  Lead: Null,
  Curator: CuratorId,
} as const) {}

export class Principal extends JoyEnum({
  Lead: Null,
  Curator: CuratorId,
  ChannelOwner: ChannelId,
} as const) {}

export type ICuratorRoleStakeProfile = {
  stake_id: StakeId
  termination_unstaking_period: Option<BlockNumber>
  exit_unstaking_period: Option<BlockNumber>
}
export class CuratorRoleStakeProfile
  extends JoyStructDecorated({
    stake_id: StakeId,
    termination_unstaking_period: Option.with(u32),
    exit_unstaking_period: Option.with(u32),
  })
  implements ICuratorRoleStakeProfile {}

export class CuratorExitInitiationOrigin extends JoyEnum({
  Lead: Null,
  Curator: Null,
} as const) {}

export type ICuratorExitSummary = {
  origin: CuratorExitInitiationOrigin
  initiated_at_block_number: BlockNumber
  rationale_text: Text
}
export class CuratorExitSummary
  extends JoyStructDecorated({
    origin: CuratorExitInitiationOrigin,
    initiated_at_block_number: u32,
    rationale_text: Text, // FIXME: Should be: Bytes
  })
  implements ICuratorExitSummary {}

// FIXME: Replace usages with isOfType, asType wherever possible
export enum CuratorRoleStageKeys {
  Active = 'Active',
  Unstaking = 'Unstaking',
  Exited = 'Exited',
}
export const CuratorRoleStageDef = {
  Active: Null,
  Unstaking: CuratorExitSummary,
  Exited: CuratorExitSummary,
} as const
export class CuratorRoleStage extends JoyEnum(CuratorRoleStageDef) {}

export type ICuratorInduction = {
  lead: LeadId
  curator_application_id: CuratorApplicationId
  at_block: BlockNumber
}
export class CuratorInduction
  extends JoyStructDecorated({
    lead: LeadId,
    curator_application_id: CuratorApplicationId,
    at_block: u32,
  })
  implements ICuratorInduction {
  // Helper for working-group compatibility
  get worker_application_id(): CuratorApplicationId {
    return this.curator_application_id
  }
}

export type ICurator = {
  role_account: AccountId
  reward_relationship: Option<RewardRelationshipId>
  role_stake_profile: Option<CuratorRoleStakeProfile>
  stage: CuratorRoleStage
  induction: CuratorInduction
  principal_id: PrincipalId
}
export class Curator
  extends JoyStructDecorated({
    role_account: AccountId,
    reward_relationship: Option.with(RewardRelationshipId),
    role_stake_profile: Option.with(CuratorRoleStakeProfile),
    stage: CuratorRoleStage,
    induction: CuratorInduction,
    principal_id: PrincipalId,
  })
  implements ICurator {
  // Helper for working-group compatibility
  get role_account_id(): AccountId {
    return this.role_account
  }

  get is_active(): boolean {
    return this.stage.type == CuratorRoleStageKeys.Active
  }
}

export type ICuratorApplication = {
  role_account: AccountId
  curator_opening_id: CuratorOpeningId
  member_id: MemberId
  application_id: ApplicationId
}
export class CuratorApplication
  extends JoyStructDecorated({
    role_account: AccountId,
    curator_opening_id: CuratorOpeningId,
    member_id: MemberId,
    application_id: ApplicationId,
  })
  implements ICuratorApplication {
  // Helper for working-group compatibility
  get role_account_id(): AccountId {
    return this.role_account
  }
  // Helper for working-group compatibility
  get opening_id(): CuratorOpeningId {
    return this.curator_opening_id
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
  terminate_curator_application_stake_unstaking_period: Option<BlockNumber>
  terminate_curator_role_stake_unstaking_period: Option<BlockNumber>
  exit_curator_role_application_stake_unstaking_period: Option<BlockNumber>
  exit_curator_role_stake_unstaking_period: Option<BlockNumber>
}
export class OpeningPolicyCommitment
  extends JoyStructDecorated({
    application_rationing_policy: Option.with(ApplicationRationingPolicy),
    max_review_period_length: u32, // BlockNumber,
    application_staking_policy: Option.with(StakingPolicy),
    role_staking_policy: Option.with(StakingPolicy),
    role_slashing_terms: SlashingTerms,
    fill_opening_successful_applicant_application_stake_unstaking_period: Option.with(u32),
    fill_opening_failed_applicant_application_stake_unstaking_period: Option.with(u32),
    fill_opening_failed_applicant_role_stake_unstaking_period: Option.with(u32),
    terminate_curator_application_stake_unstaking_period: Option.with(u32),
    terminate_curator_role_stake_unstaking_period: Option.with(u32),
    exit_curator_role_application_stake_unstaking_period: Option.with(u32),
    exit_curator_role_stake_unstaking_period: Option.with(u32),
  })
  implements IOpeningPolicyCommitment {}

// Not entierly sure that using BTreeSet will work correctly when reading/decoding this type from chain state
export type ICuratorOpening = {
  opening_id: OpeningId
  curator_applications: BTreeSet<CuratorApplicationId>
  policy_commitment: OpeningPolicyCommitment
}
export class CuratorOpening
  extends JoyStructDecorated({
    opening_id: OpeningId,
    curator_applications: BTreeSet.with(CuratorApplicationId),
    policy_commitment: OpeningPolicyCommitment,
  })
  implements ICuratorOpening {
  // Helper for working-group compatibility
  get hiring_opening_id(): OpeningId {
    return this.opening_id
  }
}

export type IExitedLeadRole = {
  initiated_at_block_number: BlockNumber
}
export class ExitedLeadRole
  extends JoyStructDecorated({
    initiated_at_block_number: u32,
  })
  implements IExitedLeadRole {}

export class LeadRoleState extends JoyEnum({
  Active: Null,
  Exited: ExitedLeadRole,
} as const) {}

export type ILead = {
  member_id: MemberId
  role_account: AccountId
  reward_relationship: Option<RewardRelationshipId>
  inducted: BlockNumber
  stage: LeadRoleState
}
export class Lead
  extends JoyStructDecorated({
    member_id: MemberId,
    role_account: AccountId,
    reward_relationship: Option.with(RewardRelationshipId),
    inducted: u32,
    stage: LeadRoleState,
  })
  implements ILead {
  // Helper for working-group compatibility
  get role_account_id(): AccountId {
    return this.role_account
  }
}

export class WorkingGroupUnstaker extends JoyEnum({
  Lead: LeadId,
  Curator: CuratorId,
}) {}

export class CuratorApplicationIdToCuratorIdMap extends BTreeMap.with(ApplicationId, CuratorId) {}

export class CuratorApplicationIdSet extends Vec.with(CuratorApplicationId) {}

export const contentWorkingGroupTypes = {
  ChannelId: 'u64',
  CuratorId: 'u64',
  CuratorOpeningId: 'u64',
  CuratorApplicationId: 'u64',
  LeadId: 'u64',
  PrincipalId: 'u64',
  OptionalText,
  Channel,
  ChannelContentType,
  ChannelCurationStatus,
  ChannelPublicationStatus,
  CurationActor,
  Curator,
  CuratorApplication,
  CuratorOpening,
  Lead,
  OpeningPolicyCommitment,
  Principal,
  WorkingGroupUnstaker,
  CuratorApplicationIdToCuratorIdMap,
  CuratorApplicationIdSet,
  // Expose in registry for api.createType purposes:
  CuratorRoleStakeProfile,
  CuratorRoleStage,
  CuratorExitSummary,
  CuratorExitInitiationOrigin,
  ExitedLeadRole,
  CuratorInduction,
}

export default contentWorkingGroupTypes
