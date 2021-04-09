import BN from 'bn.js'
import { ElectionStage, Seat } from '@joystream/types/council'
import { Option } from '@polkadot/types'
import { Codec } from '@polkadot/types/types'
import { BlockNumber, Balance, AccountId } from '@polkadot/types/interfaces'
import { DeriveBalancesAll } from '@polkadot/api-derive/types'
import { KeyringPair } from '@polkadot/keyring/types'
import { WorkerId, OpeningType } from '@joystream/types/working-group'
import { Membership, MemberId } from '@joystream/types/members'
import { Opening, StakingPolicy, ApplicationStageKeys } from '@joystream/types/hiring'
import { Validator } from 'inquirer'
import {
  VideoMetadata,
  ChannelMetadata,
  ChannelCategoryMetadata,
  VideoCategoryMetadata,
} from '@joystream/content-metadata-protobuf'
import { ContentId, ContentParameters } from '@joystream/types/storage'

// KeyringPair type extended with mandatory "meta.name"
// It's used for accounts/keys management within CLI.
// If not provided in the account json file, the meta.name value is set to "Unnamed Account"
export type NamedKeyringPair = KeyringPair & {
  meta: {
    name: string
  }
}

// Summary of the account information fetched from the api for "account:current" purposes (currently just balances)
export type AccountSummary = {
  balances: DeriveBalancesAll
}

// This function allows us to easily transform the tuple into the object
// and simplifies the creation of consitent Object and Tuple types (seen below).
export function createCouncilInfoObj(
  activeCouncil: Seat[],
  termEndsAt: BlockNumber,
  autoStart: boolean,
  newTermDuration: BN,
  candidacyLimit: BN,
  councilSize: BN,
  minCouncilStake: Balance,
  minVotingStake: Balance,
  announcingPeriod: BlockNumber,
  votingPeriod: BlockNumber,
  revealingPeriod: BlockNumber,
  round: BN,
  stage: Option<ElectionStage>
) {
  return {
    activeCouncil,
    termEndsAt,
    autoStart,
    newTermDuration,
    candidacyLimit,
    councilSize,
    minCouncilStake,
    minVotingStake,
    announcingPeriod,
    votingPeriod,
    revealingPeriod,
    round,
    stage,
  }
}
// Object/Tuple containing council/councilElection information (council:info).
// The tuple is useful, because that's how api.queryMulti returns the results.
export type CouncilInfoTuple = Parameters<typeof createCouncilInfoObj>
export type CouncilInfoObj = ReturnType<typeof createCouncilInfoObj>

// Object with "name" and "value" properties, used for rendering simple CLI tables like:
// Total balance:   100 JOY
// Free calance:     50 JOY
export type NameValueObj = { name: string; value: string }

// Working groups related types
export enum WorkingGroups {
  StorageProviders = 'storageProviders',
  Curators = 'curators',
  Operations = 'operations',
  Gateway = 'gateway',
}

// In contrast to Pioneer, currently only StorageProviders group is available in CLI
export const AvailableGroups: readonly WorkingGroups[] = [
  WorkingGroups.StorageProviders,
  WorkingGroups.Curators,
  WorkingGroups.Operations,
] as const

export type Reward = {
  totalRecieved: Balance
  value: Balance
  interval?: number
  nextPaymentBlock: number // 0 = no incoming payment
}

// Compound working group types
export type GroupMember = {
  workerId: WorkerId
  memberId: MemberId
  roleAccount: AccountId
  profile: Membership
  stake?: Balance
  reward?: Reward
}

export type GroupApplication = {
  wgApplicationId: number
  applicationId: number
  wgOpeningId: number
  member: Membership | null
  roleAccout: AccountId
  stakes: {
    application: number
    role: number
  }
  humanReadableText: string
  stage: ApplicationStageKeys
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

export type GroupOpeningStakes = {
  application?: StakingPolicy
  role?: StakingPolicy
}

export const stakingPolicyUnstakingPeriodKeys = [
  'crowded_out_unstaking_period_length',
  'review_period_expired_unstaking_period_length',
] as const

export type StakingPolicyUnstakingPeriodKey = typeof stakingPolicyUnstakingPeriodKeys[number]

export const openingPolicyUnstakingPeriodsKeys = [
  'fill_opening_failed_applicant_application_stake_unstaking_period',
  'fill_opening_failed_applicant_role_stake_unstaking_period',
  'fill_opening_successful_applicant_application_stake_unstaking_period',
  'terminate_application_stake_unstaking_period',
  'terminate_role_stake_unstaking_period',
  'exit_role_application_stake_unstaking_period',
  'exit_role_stake_unstaking_period',
] as const

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

export type GroupOpening = {
  wgOpeningId: number
  openingId: number
  stage: GroupOpeningStage
  opening: Opening
  stakes: GroupOpeningStakes
  applications: GroupApplication[]
  type: OpeningType
  unstakingPeriods: UnstakingPeriods
}

// Api-related

// Additional options that can be passed to ApiCommandBase.promptForParam in order to override
// its default behaviour, change param name, add validation etc.
export type ApiParamOptions<ParamType = Codec> = {
  forcedName?: string
  value?: {
    default: ParamType
    locked?: boolean
  }
  validator?: Validator
  nestedOptions?: ApiParamsOptions // For more complex params, like structs
}
export type ApiParamsOptions = {
  [paramName: string]: ApiParamOptions
}

export type ApiMethodArg = Codec
export type ApiMethodNamedArg = {
  name: string
  value: ApiMethodArg
}
export type ApiMethodNamedArgs = ApiMethodNamedArg[]

// Content-related
export enum AssetType {
  AnyAsset = 1,
}

export type InputAsset = {
  path: string
  contentId: ContentId
}

export type InputAssetDetails = InputAsset & {
  parameters: ContentParameters
}

export type VideoFFProbeMetadata = {
  width?: number
  height?: number
  codecName?: string
  codecFullName?: string
  duration?: number
}

export type VideoFileMetadata = VideoFFProbeMetadata & {
  size: number
  container: string
  mimeType: string
}

export type VideoInputParameters = Omit<VideoMetadata.AsObject, 'video' | 'thumbnailPhoto'> & {
  videoPath?: string
  thumbnailPhotoPath?: string
}

export type ChannelInputParameters = Omit<ChannelMetadata.AsObject, 'coverPhoto' | 'avatarPhoto'> & {
  coverPhotoPath?: string
  avatarPhotoPath?: string
  rewardAccount?: string
}

export type ChannelCategoryInputParameters = ChannelCategoryMetadata.AsObject

export type VideoCategoryInputParameters = VideoCategoryMetadata.AsObject
