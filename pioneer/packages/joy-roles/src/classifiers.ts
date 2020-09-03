import moment from 'moment';

import { Option, u128 } from '@polkadot/types';
import { Balance } from '@polkadot/types/interfaces';

import {
  Application,
  AcceptingApplications, ReviewPeriod,
  WaitingToBeingOpeningStageVariant,
  ActiveOpeningStageVariant,
  Opening,
  OpeningStageKeys,
  Deactivated, OpeningDeactivationCauseKeys,
  StakingPolicy,
  StakingAmountLimitMode, StakingAmountLimitModeKeys,
  ApplicationStageKeys,
  ApplicationDeactivationCause, ApplicationDeactivationCauseKeys,
  UnstakingApplicationStage,
  InactiveApplicationStage
} from '@joystream/types/hiring';

import {
  StakeRequirement,
  ApplicationStakeRequirement,
  RoleStakeRequirement,
  StakeType
} from './StakeRequirement';

export enum CancelledReason {
  ApplicantCancelled = 0,
  HirerCancelledApplication,
  HirerCancelledOpening,
  NoOneHired,
}

export enum OpeningState {
  WaitingToBegin = 0,
  AcceptingApplications,
  InReview,
  Complete,
  Cancelled,
}

export interface OpeningStageClassification {
  state: OpeningState;
  starting_block: number;
  starting_block_hash: string;
  starting_time: Date;
  review_end_time?: Date;
  review_end_block?: number;
}

export interface IBlockQueryer {
  blockHash(height: number): Promise<string>;
  blockTimestamp(height: number): Promise<Date>;
  expectedBlockTime: () => Promise<number>;
}

async function classifyActiveOpeningStageAcceptingApplications (
  queryer: IBlockQueryer,
  stage: AcceptingApplications
): Promise<OpeningStageClassification> {
  const blockNumber = stage.started_accepting_applicants_at_block.toNumber();
  return {
    state: OpeningState.AcceptingApplications,
    starting_block: blockNumber,
    starting_block_hash: await queryer.blockHash(blockNumber),
    starting_time: await queryer.blockTimestamp(blockNumber)
  };
}

async function classifyActiveOpeningStageReviewPeriod (
  opening: Opening,
  queryer: IBlockQueryer,
  stage: ReviewPeriod
): Promise<OpeningStageClassification> {
  const blockNumber = stage.started_review_period_at_block.toNumber();
  const maxReviewLengthInBlocks = opening.max_review_period_length.toNumber();
  const [startDate, blockTime] = await Promise.all([
    queryer.blockTimestamp(blockNumber),
    queryer.expectedBlockTime()
  ]);
  const endDate = moment(startDate).add(maxReviewLengthInBlocks * blockTime, 's');

  return {
    state: OpeningState.InReview,
    starting_block: blockNumber,
    starting_block_hash: await queryer.blockHash(blockNumber),
    starting_time: startDate,
    review_end_time: endDate.toDate(),
    review_end_block: blockNumber + maxReviewLengthInBlocks
  };
}

async function classifyActiveOpeningStageDeactivated (
  queryer: IBlockQueryer,
  stage: Deactivated
): Promise<OpeningStageClassification> {
  const blockNumber = stage.deactivated_at_block.toNumber();
  const [startDate] = await Promise.all([
    queryer.blockTimestamp(blockNumber)
  ]);

  let state: OpeningState;

  switch (stage.cause.type) {
    case OpeningDeactivationCauseKeys.CancelledBeforeActivation:
    case OpeningDeactivationCauseKeys.CancelledAcceptingApplications:
    case OpeningDeactivationCauseKeys.CancelledInReviewPeriod:
    case OpeningDeactivationCauseKeys.ReviewPeriodExpired:
      state = OpeningState.Cancelled;
      break;

    case OpeningDeactivationCauseKeys.Filled:
      state = OpeningState.Complete;
      break;

    default:
      state = OpeningState.Complete;
      break;
  }

  return {
    state: state,
    starting_block: blockNumber,
    starting_block_hash: await queryer.blockHash(blockNumber),
    starting_time: startDate
  };
}

async function classifyActiveOpeningStage (
  opening: Opening,
  queryer: IBlockQueryer,
  stage: ActiveOpeningStageVariant
): Promise<OpeningStageClassification> {
  if (stage.stage.isOfType('AcceptingApplications')) {
    return classifyActiveOpeningStageAcceptingApplications(
      queryer,
      stage.stage.asType('AcceptingApplications')
    );
  }
  if (stage.stage.isOfType('ReviewPeriod')) {
    return classifyActiveOpeningStageReviewPeriod(
      opening,
      queryer,
      stage.stage.asType('ReviewPeriod')
    );
  }
  if (stage.stage.isOfType('Deactivated')) {
    return classifyActiveOpeningStageDeactivated(
      queryer,
      stage.stage.value as Deactivated
    );
  }

  throw new Error('Unknown active opening stage: ' + stage.stage.type);
}

async function classifyWaitingToBeginStage (
  opening: Opening,
  queryer: IBlockQueryer,
  stage: WaitingToBeingOpeningStageVariant
): Promise<OpeningStageClassification> {
  const blockNumber = opening.created.toNumber();
  return {
    state: OpeningState.WaitingToBegin,
    starting_block: blockNumber,
    starting_block_hash: await queryer.blockHash(blockNumber),
    starting_time: await queryer.blockTimestamp(blockNumber)
  };
}

export async function classifyOpeningStage (queryer: IBlockQueryer, opening: Opening): Promise<OpeningStageClassification> {
  switch (opening.stage.type) {
    case OpeningStageKeys.WaitingToBegin:
      return classifyWaitingToBeginStage(
        opening,
        queryer,
        opening.stage.value as WaitingToBeingOpeningStageVariant
      );

    case OpeningStageKeys.Active:
      return classifyActiveOpeningStage(
        opening,
        queryer,
        opening.stage.value as ActiveOpeningStageVariant
      );
  }

  throw new Error('Unknown stage type: ' + opening.stage.type);
}

export type StakeRequirementSetClassification = {
  application: ApplicationStakeRequirement;
  role: RoleStakeRequirement;
}

interface StakeRequirementConstructor<T extends StakeRequirement> {
  new(hard: Balance, stakeType?: StakeType): T;
}

function classifyStakeType (mode: StakingAmountLimitMode): StakeType {
  switch (mode.type) {
    case StakingAmountLimitModeKeys.AtLeast:
      return StakeType.AtLeast;

    case StakingAmountLimitModeKeys.Exact:
      return StakeType.Fixed;
  }

  throw new Error('Unknown stake type: ' + mode.type);
}

function classifyStakeRequirement<T extends StakeRequirement> (
  constructor: StakeRequirementConstructor<T>,
  option: Option<StakingPolicy>
): T {
  if (option.isNone) {
    return new constructor(new u128(0));
  }

  const policy = option.unwrap();

  return new constructor(
    policy.amount,
    classifyStakeType(policy.amount_mode)
  );
}

export function classifyOpeningStakes (opening: Opening): StakeRequirementSetClassification {
  return {
    application: classifyStakeRequirement<ApplicationStakeRequirement>(
      ApplicationStakeRequirement,
      opening.application_staking_policy
    ),
    role: classifyStakeRequirement<RoleStakeRequirement>(
      RoleStakeRequirement,
      opening.role_staking_policy
    )
  };
}

function classifyApplicationCancellationFromCause (cause: ApplicationDeactivationCause): CancelledReason | undefined {
  console.log(cause.type);
  switch (cause.type) {
    case ApplicationDeactivationCauseKeys.External:
      return CancelledReason.ApplicantCancelled;

    case ApplicationDeactivationCauseKeys.OpeningCancelled:
    case ApplicationDeactivationCauseKeys.OpeningFilled:
      return CancelledReason.HirerCancelledOpening;

    case ApplicationDeactivationCauseKeys.ReviewPeriodExpired:
      return CancelledReason.NoOneHired;
  }

  return undefined;
}

export function classifyApplicationCancellation (a: Application): CancelledReason | undefined {
  switch (a.stage.type) {
    case ApplicationStageKeys.Unstaking:
      return classifyApplicationCancellationFromCause(
        (a.stage.value as UnstakingApplicationStage).cause
      );

    case ApplicationStageKeys.Inactive:
      return classifyApplicationCancellationFromCause(
        (a.stage.value as InactiveApplicationStage).cause
      );
  }

  return undefined;
}

export function isApplicationHired (a: Application): boolean {
  switch (a.stage.type) {
    case ApplicationStageKeys.Unstaking:
      return (a.stage.value as UnstakingApplicationStage).cause.type === ApplicationDeactivationCauseKeys.Hired;

    case ApplicationStageKeys.Inactive:
      return (a.stage.value as InactiveApplicationStage).cause.type === ApplicationDeactivationCauseKeys.Hired;
  }

  return false;
}
