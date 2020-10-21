import { Worker, Opening as WGOpening, OpeningType } from '@joystream/types/working-group'
import { Membership } from '@joystream/types/members'
import { OpeningId, Opening, ApplicationStage, StakingPolicy } from '@joystream/types/hiring'
import { AccountId } from '@polkadot/types/interfaces'
import { WorkingGroupKey } from '@joystream/types/common'
import { RewardRelationship } from '@joystream/types/recurring-rewards'
import { stakingPolicyUnstakingPeriodKeys, openingPolicyUnstakingPeriodsKeys } from '../consts/workingGroups'
import BN from 'bn.js'

export type WorkerData = {
  workerId: number
  worker: Worker
  memberId: number
  profile: Membership
  stake?: BN
  reward?: RewardRelationship
  roleAccount: AccountId
  group: WorkingGroupKey
}

export type OpeningPair = {
  id: OpeningId
  opening: WGOpening
  hiringOpening: Opening
}

export type ParsedApplicationStakes = {
  application: BN
  role: BN
  total: BN
}

export type ParsedApplication = {
  wgApplicationId: number
  applicationId: number
  wgOpeningId: number
  member: Membership
  roleAccout: AccountId
  stakes: ParsedApplicationStakes
  humanReadableText: string
  stage: ApplicationStage
}

export type ParsedOpeningStakes = {
  application?: StakingPolicy
  role?: StakingPolicy
}

export enum OpeningStatus {
  WaitingToBegin = 'WaitingToBegin',
  AcceptingApplications = 'AcceptingApplications',
  InReview = 'InReview',
  Complete = 'Complete',
  Cancelled = 'Cancelled',
  Unknown = 'Unknown',
}

export type GroupOpeningStage = {
  status: OpeningStatus
  block?: number
  date?: Date
}

export type ParsedOpening = {
  wgOpeningId: number
  openingId: number
  stage: GroupOpeningStage
  opening: Opening
  stakes: ParsedOpeningStakes
  applications: ParsedApplication[]
  type: OpeningType
  unstakingPeriods: UnstakingPeriods
}

export type StakingPolicyUnstakingPeriodKey = typeof stakingPolicyUnstakingPeriodKeys[number]
export type OpeningPolicyUnstakingPeriodsKey = typeof openingPolicyUnstakingPeriodsKeys[number]
export type UnstakingPeriodsKey =
  | OpeningPolicyUnstakingPeriodsKey
  | 'crowded_out_application_stake_unstaking_period_length'
  | 'crowded_out_role_stake_unstaking_period_length'
  | 'review_period_expired_application_stake_unstaking_period_length'
  | 'review_period_expired_role_stake_unstaking_period_length'

export type UnstakingPeriods = {
  [k in UnstakingPeriodsKey]: number
}
