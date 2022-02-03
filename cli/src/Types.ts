import BN from 'bn.js'
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
import { JSONSchema4 } from 'json-schema'
import {
  IChannelMetadata,
  IVideoMetadata,
  IVideoCategoryMetadata,
  IChannelCategoryMetadata,
} from '@joystream/metadata-protobuf'
import { DataObjectCreationParameters } from '@joystream/types/storage'

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
  OperationsAlpha = 'operationsAlpha',
  OperationsBeta = 'operationsBeta',
  OperationsGamma = 'operationsGamma',
  Gateway = 'gateway',
  Distribution = 'distributors',
}

export const AvailableGroups: readonly WorkingGroups[] = [
  WorkingGroups.StorageProviders,
  WorkingGroups.Curators,
  WorkingGroups.Forum,
  WorkingGroups.Membership,
  WorkingGroups.Gateway,
  WorkingGroups.OperationsAlpha,
  WorkingGroups.OperationsBeta,
  WorkingGroups.OperationsGamma,
  WorkingGroups.Distribution,
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

export type AssetToUpload = {
  dataObjectId: BN
  path: string
}

export type ResolvedAsset = {
  path: string
  parameters: DataObjectCreationParameters
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
  enableComments?: boolean
}

export type ChannelCreationInputParameters = Omit<IChannelMetadata, 'coverPhoto' | 'avatarPhoto'> & {
  coverPhotoPath?: string
  avatarPhotoPath?: string
  rewardAccount?: string
  collaborators?: number[]
  moderators?: number[]
}

export type ChannelUpdateInputParameters = Omit<ChannelCreationInputParameters, 'moderators'>

export type ChannelCategoryInputParameters = IChannelCategoryMetadata

export type VideoCategoryInputParameters = IVideoCategoryMetadata

type AnyNonObject = string | number | boolean | any[] | Long

// JSONSchema utility types

// Based on: https://stackoverflow.com/questions/51465182/how-to-remove-index-signature-using-mapped-types
type RemoveIndex<T> = {
  [K in keyof T as string extends K ? never : number extends K ? never : K]: T[K]
}

type AnyJSONSchema = RemoveIndex<JSONSchema4>

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

export type PropertySchema<P> = Omit<AnyJSONSchema, 'type' | 'properties'> & {
  type: JSONTypeName<P>
} & (P extends AnyNonObject ? { properties?: never } : { properties: JsonSchemaProperties<P> })

export type JsonSchemaProperties<T> = {
  [K in keyof Required<T>]: PropertySchema<Required<T>[K]>
}

export type JsonSchema<T> = Omit<AnyJSONSchema, 'type' | 'properties'> & {
  type: 'object'
  properties: JsonSchemaProperties<T>
}

// Storage node related types

export type StorageNodeInfo = {
  bucketId: number
  apiEndpoint: string
}

export type TokenRequest = {
  data: TokenRequestData
  signature: string
}

export type TokenRequestData = {
  memberId: number
  accountId: string
  dataObjectId: number
  storageBucketId: number
  bagId: string
}
