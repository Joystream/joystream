import { Codec } from '@polkadot/types/types'
import { Balance, AccountId } from '@polkadot/types/interfaces'
import { DeriveBalancesAll } from '@polkadot/api-derive/types'
import { KeyringPair } from '@polkadot/keyring/types'
import { WorkerId, OpeningType } from '@joystream/types/working-group'
import { Membership } from '@joystream/types/members'
import { MemberId } from '@joystream/types/common'
import { Validator } from 'inquirer'
import { ApiPromise } from '@polkadot/api'
import { SubmittableModuleExtrinsics, QueryableModuleStorage, QueryableModuleConsts } from '@polkadot/api/types'
import { ContentId, ContentParameters } from '@joystream/types/storage'

import { JSONSchema7, JSONSchema7Definition } from 'json-schema'
import {
  IChannelMetadata,
  IVideoMetadata,
  IVideoCategoryMetadata,
  IChannelCategoryMetadata,
  IBountyMetadata,
  IBountyWorkData,
} from '@joystream/metadata-protobuf'

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

// Object with "name" and "value" properties, used for rendering simple CLI tables like:
// Total balance:   100 JOY
// Free calance:     50 JOY
export type NameValueObj = { name: string; value: string }

// Working groups related types
export enum WorkingGroups {
  StorageProviders = 'storageProviders',
  Curators = 'curators',
  Forum = 'forum',
  Membership = 'membership',
  Operations = 'operations',
  Gateway = 'gateway',
}

// In contrast to Pioneer, currently only StorageProviders group is available in CLI
export const AvailableGroups: readonly WorkingGroups[] = [
  WorkingGroups.StorageProviders,
  WorkingGroups.Curators,
  WorkingGroups.Forum,
  WorkingGroups.Membership,
  WorkingGroups.Operations,
  WorkingGroups.Gateway,
] as const

export type Reward = {
  totalMissed?: Balance
  valuePerBlock?: Balance
}

// Compound working group types
export type GroupMember = {
  workerId: WorkerId
  memberId: MemberId
  roleAccount: AccountId
  stakingAccount: AccountId
  profile: MemberDetails
  stake: Balance
  reward: Reward
}

export type ApplicationDetails = {
  applicationId: number
  member: MemberDetails
  roleAccout: AccountId
  stakingAccount: AccountId
  rewardAccount: AccountId
  descriptionHash: string
  openingId: number
}

export type OpeningDetails = {
  openingId: number
  stake: {
    value: Balance
    unstakingPeriod: number
  }
  applications: ApplicationDetails[]
  type: OpeningType
  createdAtBlock: number
  rewardPerBlock?: Balance
}

// Extended membership information (including optional query node data)
export type MemberDetails = {
  id: MemberId
  name?: string | null
  handle?: string
  membership: Membership
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

// Api without TypeScript augmentations for "query", "tx" and "consts" (useful when more type flexibility is needed)
export type UnaugmentedApiPromise = Omit<ApiPromise, 'query' | 'tx' | 'consts'> & {
  query: { [key: string]: QueryableModuleStorage<'promise'> }
  tx: { [key: string]: SubmittableModuleExtrinsics<'promise'> }
  consts: { [key: string]: QueryableModuleConsts }
}

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

export type VideoInputParameters = Omit<IVideoMetadata, 'video' | 'thumbnailPhoto'> & {
  videoPath?: string
  thumbnailPhotoPath?: string
}

export type ChannelInputParameters = Omit<IChannelMetadata, 'coverPhoto' | 'avatarPhoto'> & {
  coverPhotoPath?: string
  avatarPhotoPath?: string
  rewardAccount?: string
}

export type ChannelCategoryInputParameters = IChannelCategoryMetadata

export type VideoCategoryInputParameters = IVideoCategoryMetadata

export type FundingTypeLimited = {
  minFundingAmount: number
  maxFundingAmount: number
  fundingPeriod: number
}

export type FundingTypePrepetual = {
  target: number
}

export type BountyInputParameters = IBountyMetadata & {
  // oracle should undefined if bounty actor is Council, and
  // a valid member id if bounty actor is a Member
  oracle?: number
  // contractTypeInput should be emply list in case of Open contract and
  // contain list of members allowed to submit work in case of Closed contarct
  contractTypeInput: string[]
  cherry: number
  entrantStake: number
  // TODO: can this be improved?
  fundingType: FundingTypeLimited | FundingTypePrepetual
  workPeriod: number
  judgementPeriod: number
}

export type BountyWorkDataInputParameters = IBountyWorkData

export type Winner = {
  reward: number
}

export enum Rejected {}

export type OracleJudgmentInputParameters = {
  entryId: number
  judgment: Winner | Rejected
}[]

type AnyNonObject = string | number | boolean | any[] | Long

// JSONSchema utility types
export type JSONTypeName<T> = T extends string
  ? 'string' | ['string', 'null']
  : T extends number
  ? 'number' | ['number', 'null']
  : T extends boolean
  ? 'boolean' | ['boolean', 'null']
  : T extends any[]
  ? 'array' | ['array', 'null']
  : T extends Long
  ? 'number' | ['number', 'null']
  : 'object' | ['object', 'null']

export type PropertySchema<P> = Omit<
  JSONSchema7Definition & {
    type: JSONTypeName<P>
    properties: P extends AnyNonObject ? never : JsonSchemaProperties<P>
  },
  P extends AnyNonObject ? 'properties' : ''
>

export type JsonSchemaProperties<T> = {
  [K in keyof Required<T>]: PropertySchema<Required<T>[K]>
}

export type JsonSchema<T> = JSONSchema7 & {
  type: 'object'
  properties: JsonSchemaProperties<T>
}
