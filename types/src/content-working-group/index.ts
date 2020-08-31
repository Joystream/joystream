import { getTypeRegistry, BTreeMap, Enum, bool, u8, u32, Text, GenericAccountId, Null , Option, Vec, u16 } from '@polkadot/types';
import { BlockNumber, AccountId } from '@polkadot/types/interfaces';
import { BTreeSet, JoyStruct, OptionText, Credential } from '../common';
import { ActorId, MemberId } from '../members';
import { StakeId } from '../stake';
import { OpeningId, ApplicationId, ApplicationRationingPolicy, StakingPolicy } from '../hiring/index';
import { RewardRelationshipId } from '../recurring-rewards';

import ChannelId from './ChannelId';
export { ChannelId };
export class CuratorId extends ActorId {};
export class CuratorOpeningId extends OpeningId {};
export class CuratorApplicationId extends ApplicationId {};
export class LeadId extends ActorId {};
export class PrincipalId extends Credential {};

export class OptionalText extends OptionText {};

export type ChannelContentTypeValue =
  'Video' |
  'Music' |
  'Ebook';

export const ChannelContentTypeAllValues: ChannelContentTypeValue[] = [
  'Video',
  'Music',
  'Ebook'
];

export class ChannelContentType extends Enum {
  constructor (value?: ChannelContentTypeValue, index?: number) {
    super(
      ChannelContentTypeAllValues,
      value, index);
  }
};

export type ChannelPublicationStatusValue =
  'Public' |
  'Unlisted';

export const ChannelPublicationStatusAllValues: ChannelPublicationStatusValue[] = [
  'Public',
  'Unlisted'
];

export class ChannelPublicationStatus extends Enum {
  constructor (value?: ChannelPublicationStatusValue, index?: number) {
    super(
      ChannelPublicationStatusAllValues,
      value, index);
  }
};

export type ChannelCurationStatusValue =
  'Normal' |
  'Censored';

export const ChannelCurationStatusAllValues: ChannelCurationStatusValue[] = [
  'Normal',
  'Censored'
];

export class ChannelCurationStatus extends Enum {
  constructor (value?: ChannelCurationStatusValue, index?: number) {
    super(
      ChannelCurationStatusAllValues,
      value, index);
  }
};

export type IChannel = {
  verified: bool,
  handle: Text, // Vec<u8>,
  title: OptionalText,
  description: OptionalText,
  avatar: OptionalText,
  banner: OptionalText,
  content: ChannelContentType,
  owner: MemberId,
  role_account: AccountId,
  publication_status: ChannelPublicationStatus,
  curation_status: ChannelCurationStatus,
  created: BlockNumber,
  principal_id: PrincipalId,
};
export class Channel extends JoyStruct<IChannel> {
  constructor (value?: IChannel) {
    super({
      verified: bool,
      handle: Text, // Vec.with(u8),
      title: OptionalText,
      description: OptionalText,
      avatar: OptionalText,
      banner: OptionalText,
      content: ChannelContentType,
      owner: MemberId,
      role_account: GenericAccountId,
      publication_status: ChannelPublicationStatus,
      curation_status: ChannelCurationStatus,
      created: u32, // BlockNumber,
      principal_id: PrincipalId,
    }, value);
  }
};

export class CurationActor extends Enum {
  constructor (value?: any, index?: number) {
    super(
      {
        Lead: Null,
        Curator: CuratorId
      },
      value, index);
  }
};

export class Principal extends Enum {
  constructor (value?: any, index?: number) {
    super(
      {
        Lead: Null,
        Curator: CuratorId,
        ChannelOwner: ChannelId
      },
      value, index);
  }
};

export type ICuratorRoleStakeProfile = {
  stake_id: StakeId,
  termination_unstaking_period: Option<BlockNumber>,
  exit_unstaking_period: Option<BlockNumber>,
};
export class CuratorRoleStakeProfile extends JoyStruct<ICuratorRoleStakeProfile> {
  constructor (value?: ICuratorRoleStakeProfile) {
    super({
      stake_id: StakeId,
      termination_unstaking_period: Option.with(u32),
      exit_unstaking_period: Option.with(u32),
    }, value);
  }

  get stake_id(): StakeId {
    return this.getField<StakeId>('stake_id')
  }
};

export class CuratorExitInitiationOrigin extends Enum {
  constructor (value?: any, index?: number) {
    super(
      {
        Lead: Null,
        Curator: Null,
      },
      value, index);
  }
}

export type ICuratorExitSummary = {
  origin: CuratorExitInitiationOrigin,
  initiated_at_block_number: BlockNumber,
  rationale_text: Vec<u8>,
};
export class CuratorExitSummary extends JoyStruct<ICuratorExitSummary> {
  constructor (value?: ICuratorExitSummary) {
    super({
      origin: CuratorExitInitiationOrigin,
      initiated_at_block_number: u32,
      rationale_text: Text,
    }, value);
  }
};

export enum CuratorRoleStakeKeys {
    Active = 'Active',
    Unstaking = 'Unstaking',
    Exited = 'Exited',
}
export class CuratorRoleStage extends Enum {
  constructor (value?: any, index?: number) {
    super(
      {
        [CuratorRoleStakeKeys.Active]: Null,
        [CuratorRoleStakeKeys.Unstaking]: CuratorExitSummary,
        [CuratorRoleStakeKeys.Exited]: CuratorExitSummary,
      },
      value, index);
  }
};

export type ICuratorInduction = {
  lead: LeadId,
  curator_application_id: CuratorApplicationId,
  at_block: BlockNumber,
};
export class CuratorInduction extends JoyStruct<ICuratorInduction> {
  constructor (value?: ICuratorInduction) {
    super({
      lead: LeadId,
      curator_application_id: CuratorApplicationId,
      at_block: u32,
    }, value);
  }

  get lead(): LeadId {
    return this.getField<LeadId>('lead')
  }

  get curator_application_id(): CuratorApplicationId {
    return this.getField<CuratorApplicationId>('curator_application_id')
  }

  // Helper for working-group compatibility
  get worker_application_id(): CuratorApplicationId {
    return this.curator_application_id;
  }

  get at_block(): u32 {
    return this.getField<u32>('at_block')
  }
};

export type ICurator = {
  role_account: AccountId,
  reward_relationship: Option<RewardRelationshipId>,
  role_stake_profile: Option<CuratorRoleStakeProfile>,
  stage: CuratorRoleStage,
  induction: CuratorInduction,
  principal_id: PrincipalId,
};
export class Curator extends JoyStruct<ICurator> {
  constructor (value?: ICurator) {
    super({
      role_account: GenericAccountId,
      reward_relationship: Option.with(RewardRelationshipId),
      role_stake_profile: Option.with(CuratorRoleStakeProfile),
      stage: CuratorRoleStage,
      induction: CuratorInduction,
      principal_id: PrincipalId,
    }, value);
  }

  get role_account(): GenericAccountId {
    return this.getField<GenericAccountId>('role_account')
  }

  // Helper for working-group compatibility
  get role_account_id(): GenericAccountId {
    return this.role_account;
  }

  get reward_relationship(): Option<RewardRelationshipId> {
    return this.getField<Option<RewardRelationshipId>>('reward_relationship')
  }

  get role_stake_profile(): Option<CuratorRoleStakeProfile> {
    return this.getField<Option<CuratorRoleStakeProfile>>('role_stake_profile')
  }

  get stage(): CuratorRoleStage {
    return this.getField<CuratorRoleStage>('stage')
  }

  get induction(): CuratorInduction {
    return this.getField<CuratorInduction>('induction')
  }

  get principal_id(): PrincipalId {
    return this.getField<PrincipalId>('principal_id')
  }

  get is_active(): boolean {
    return (this.stage.type == CuratorRoleStakeKeys.Active)
  }
};

export type ICuratorApplication = {
  role_account: AccountId,
  curator_opening_id: CuratorOpeningId,
  member_id: MemberId,
  application_id: ApplicationId,
};
export class CuratorApplication extends JoyStruct<ICuratorApplication> {
  constructor (value?: ICuratorApplication) {
    super({
      role_account: GenericAccountId,
      curator_opening_id: CuratorOpeningId,
      member_id: MemberId,
      application_id: ApplicationId,
    }, value);
  }

  get role_account(): GenericAccountId {
    return this.getField<GenericAccountId>('role_account')
  }

  // Helper for working-group compatibility
  get role_account_id(): GenericAccountId {
    return this.role_account;
  }

  get curator_opening_id(): CuratorOpeningId {
    return this.getField<CuratorOpeningId>('curator_opening_id')
  }

  // Helper for working-group compatibility
  get opening_id(): CuratorOpeningId {
    return this.curator_opening_id;
  }

  get member_id(): MemberId {
    return this.getField<MemberId>('member_id')
  }

  get application_id(): ApplicationId {
    return this.getField<ApplicationId>('application_id')
  }
};

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

export type IOpeningPolicyCommitment = {
  application_rationing_policy: Option<ApplicationRationingPolicy>,
  max_review_period_length: BlockNumber,
  application_staking_policy: Option<StakingPolicy>,
  role_staking_policy: Option<StakingPolicy>,
  role_slashing_terms: SlashingTerms,
  fill_opening_successful_applicant_application_stake_unstaking_period: Option<BlockNumber>,
  fill_opening_failed_applicant_application_stake_unstaking_period: Option<BlockNumber>,
  fill_opening_failed_applicant_role_stake_unstaking_period: Option<BlockNumber>,
  terminate_curator_application_stake_unstaking_period: Option<BlockNumber>,
  terminate_curator_role_stake_unstaking_period: Option<BlockNumber>,
  exit_curator_role_application_stake_unstaking_period: Option<BlockNumber>,
  exit_curator_role_stake_unstaking_period: Option<BlockNumber>,
};
export class OpeningPolicyCommitment extends JoyStruct<IOpeningPolicyCommitment> {
  constructor (value?: IOpeningPolicyCommitment) {
    super({
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
    }, value);
  }

  get application_rationing_policy(): Option<ApplicationRationingPolicy> {
    return this.getField<Option<ApplicationRationingPolicy>>('application_rationing_policy')
  }

  get max_review_period_length(): u32 {
    return this.getField<u32>('max_review_period_length')
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

  get fill_opening_successful_applicant_application_stake_unstaking_period(): Option<u32> {
    return this.getField<Option<u32>>('fill_opening_successful_applicant_application_stake_unstaking_period')
  }

  get fill_opening_failed_applicant_application_stake_unstaking_period(): Option<u32> {
    return this.getField<Option<u32>>('fill_opening_failed_applicant_application_stake_unstaking_period')
  }

  get fill_opening_failed_applicant_role_stake_unstaking_period(): Option<u32> {
    return this.getField<Option<u32>>('fill_opening_failed_applicant_role_stake_unstaking_period')
  }

  get terminate_curator_application_stake_unstaking_period(): Option<u32> {
    return this.getField<Option<u32>>('terminate_curator_application_stake_unstaking_period')
  }

  get terminate_curator_role_stake_unstaking_period(): Option<u32> {
    return this.getField<Option<u32>>('terminate_curator_role_stake_unstaking_period')
  }

  get exit_curator_role_application_stake_unstaking_period(): Option<u32> {
    return this.getField<Option<u32>>('exit_curator_role_application_stake_unstaking_period')
  }

  get exit_curator_role_stake_unstaking_period(): Option<u32> {
    return this.getField<Option<u32>>('exit_curator_role_stake_unstaking_period')
  }
};

// Not entierly sure that using BTreeSet will work correctly when reading/decoding this type from chain state
export type ICuratorOpening = {
  opening_id: OpeningId,
  curator_applications: BTreeSet<CuratorApplicationId>,
  policy_commitment: OpeningPolicyCommitment,
};
export class CuratorOpening extends JoyStruct<ICuratorOpening> {
  constructor (value?: ICuratorOpening) {
    super({
      opening_id: OpeningId,
      curator_applications: BTreeSet.with(CuratorApplicationId),
      policy_commitment: OpeningPolicyCommitment,
    }, value);
  }

  get opening_id(): OpeningId {
    return this.getField<OpeningId>('opening_id')
  }

  // Helper for working-group compatibility
  get hiring_opening_id(): OpeningId {
    return this.opening_id;
  }
};

export type IExitedLeadRole = {
  initiated_at_block_number: BlockNumber,
};
export class ExitedLeadRole extends JoyStruct<IExitedLeadRole> {
  constructor (value?: IExitedLeadRole) {
    super({
      initiated_at_block_number: u32,
    }, value);
  }

};

export class LeadRoleState extends Enum {
  constructor (value?: any, index?: number) {
    super(
      {
        Active: Null,
        Exited: ExitedLeadRole,
      },
      value, index);
  }
}

export type ILead = {
  role_account: AccountId,
  reward_relationship: Option<RewardRelationshipId>,
  inducted: BlockNumber,
  stage: LeadRoleState,
};
export class Lead extends JoyStruct<ILead> {
  constructor (value?: ILead) {
    super({
      role_account: GenericAccountId,
      reward_relationship: Option.with(RewardRelationshipId),
      inducted: u32,
      stage: LeadRoleState,
    }, value);
  }

  get role_account(): GenericAccountId {
    return this.getField<GenericAccountId>('role_account')
  }

  // Helper for working-group compatibility
  get role_account_id(): GenericAccountId {
    return this.role_account;
  }

  get reward_relationship(): Option<RewardRelationshipId> {
    return this.getField<Option<RewardRelationshipId>>('reward_relationship')
  }

  get stage(): LeadRoleState {
    return this.getField('stage')
  }
};

export class WorkingGroupUnstaker extends Enum {
  constructor (value?: any, index?: number) {
    super(
      {
        Lead: LeadId,
        Curator: CuratorId,
      },
      value, index);
  }
}

export class CuratorApplicationIdToCuratorIdMap extends BTreeMap<ApplicationId, CuratorId> {
  constructor (value?: any, index?: number) {
    super(
      ApplicationId,
      CuratorId,
      value,
    );
  }
}

export function registerContentWorkingGroupTypes () {
  try {
    getTypeRegistry().register({
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
      CuratorApplicationIdSet: Vec.with(CuratorApplicationId)
    });
  } catch (err) {
    console.error('Failed to register custom types of content working group module', err);
  }
}
