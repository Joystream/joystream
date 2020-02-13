import { getTypeRegistry, BTreeMap, Enum, bool, u8, u32, u128, Text, GenericAccountId, Null , Option, Vec, u16 } from '@polkadot/types';
import { BlockNumber, AccountId, Balance } from '@polkadot/types/interfaces';
import { ActorId, MemberId } from '../members';
import { OpeningId, ApplicationId, ApplicationRationingPolicy, StakingPolicy } from '../hiring/index';
import { Credential } from '../versioned-store/permissions/credentials';
import { RewardRelationshipId } from '../recurring-rewards';
import { StakeId } from '../stake';
import { JoyStruct } from '../JoyStruct';
import { BTreeSet } from '../';

export class ChannelId extends ActorId {};
export class CuratorId extends ActorId {};
export class CuratorOpeningId extends OpeningId {};
export class CuratorApplicationId extends ApplicationId {};
export class LeadId extends ActorId {};
export class PrincipalId extends Credential {};

export class OptionalText extends Option.with(Text) {};

export class ChannelContentType extends Enum {
  constructor (value?: any, index?: number) {
    super(
      [
        'Video',
        'Music',
        'Ebook',
      ],
      value, index);
  }
};

export class ChannelPublicationStatus extends Enum {
  constructor (value?: any, index?: number) {
    super(
      [
        'Public',
        'Unlisted',
      ],
      value, index);
  }
};

export class ChannelCurationStatus extends Enum {
  constructor (value?: any, index?: number) {
    super(
      [
        'Normal',
        'Censored',
      ],
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

export class CuratorRoleStage extends Enum {
  constructor (value?: any, index?: number) {
    super(
      {
        Active: Null,
        Unstaking: CuratorExitSummary,
        Exited: CuratorExitSummary
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

export type IRewardPolicy = {
  amount_per_payout: Balance,
  next_payment_at_block: BlockNumber,
  payout_interval: Option<BlockNumber>,
};
export class RewardPolicy extends JoyStruct<IRewardPolicy> {
  constructor (value?: IRewardPolicy) {
    super({
      amount_per_payout: u128,
      next_payment_at_block: u32,
      payout_interval: Option.with(u32),
    }, value);
  }
};

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
      CuratorApplicationIdSet: Vec.with(CuratorApplicationId),
      RewardPolicy,
    });
  } catch (err) {
    console.error('Failed to register custom types of content working group module', err);
  }
}
