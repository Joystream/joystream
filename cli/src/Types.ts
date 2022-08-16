import BN from 'bn.js'
import { Codec, IEvent } from '@polkadot/types/types'
import { Balance, AccountId } from '@polkadot/types/interfaces'
import { DeriveBalancesAll } from '@polkadot/api-derive/types'
import { KeyringPair } from '@polkadot/keyring/types'
import {
  PalletMembershipMembershipObject as Membership,
  PalletWorkingGroupOpeningType as OpeningType,
  PalletStorageDataObjectCreationParameters as DataObjectCreationParameters,
  PalletContentChannelActionPermission as ChannelActionPermission,
  PalletContentPermissionsCuratorGroupContentModerationAction as ContentModerationAction,
} from '@polkadot/types/lookup'
import { MemberId, WorkerId } from '@joystream/types/primitives'
import { Validator } from 'inquirer'
import { ApiPromise } from '@polkadot/api'
import {
  SubmittableModuleExtrinsics,
  QueryableModuleStorage,
  QueryableModuleConsts,
  AugmentedEvent,
} from '@polkadot/api/types'
import { JSONSchema4 } from 'json-schema'
import {
  IChannelMetadata,
  IVideoMetadata,
  ICreateVideoCategory,
  IOpeningMetadata,
  IWorkingGroupMetadata,
} from '@joystream/metadata-protobuf'
import {
  MembershipFieldsFragment,
  WorkingGroupApplicationDetailsFragment,
  WorkingGroupOpeningDetailsFragment,
} from './graphql/generated/queries'
import { EnumVariant } from '@joystream/types'

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
// Free balance:     50 JOY
export type NameValueObj = { name: string; value: string }

// Working groups related types
export enum WorkingGroups {
  StorageProviders = 'storageProviders',
  Curators = 'curators',
  Forum = 'forum',
  Membership = 'membership',
  Builders = 'builders',
  HumanResources = 'humanResources',
  Marketing = 'marketing',
  Gateway = 'gateway',
  Distribution = 'distributors',
}

export const AvailableGroups: readonly WorkingGroups[] = [
  WorkingGroups.StorageProviders,
  WorkingGroups.Curators,
  WorkingGroups.Forum,
  WorkingGroups.Membership,
  WorkingGroups.Gateway,
  WorkingGroups.Builders,
  WorkingGroups.HumanResources,
  WorkingGroups.Marketing,
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
  roleAccount: AccountId
  stakingAccount: AccountId
  rewardAccount: AccountId
  descriptionHash: string
  openingId: number
  answers?: WorkingGroupApplicationDetailsFragment['answers']
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
  metadata?: WorkingGroupOpeningDetailsFragment['metadata']
}

// Extended membership information (including optional query node data)
export type MemberDetails = {
  id: MemberId
  meta?: MembershipFieldsFragment['metadata']
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

// Event-related types
export type EventSection = keyof ApiPromise['events'] & string
export type EventMethod<Section extends EventSection> = keyof ApiPromise['events'][Section] & string
export type EventType<
  Section extends EventSection,
  Method extends EventMethod<Section>
> = ApiPromise['events'][Section][Method] extends AugmentedEvent<'promise', infer T> ? IEvent<T> & Codec : never

export type EventDetails<E> = {
  event: E
  blockNumber: number
  blockHash: string
  blockTimestamp: number
  indexInBlock: number
}

// Storage
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
  collaborators?: { memberId: number; channelAgentPermissions: ChannelActionPermission['type'][] }[]
  privilegeLevel?: number
}

export type ContentModerationActionNullEnumLiteral = Exclude<
  ContentModerationAction['type'],
  'ChangeChannelFeatureStatus' | 'DeleteVideoAssets'
>

export type ContentModerationActionNullEnum = Exclude<
  EnumVariant<{
    [K in ContentModerationActionNullEnumLiteral]: null
  }>,
  ContentModerationActionNullEnumLiteral
>

export type ModerationPermissionsByLevelInputParameters = {
  channelPrivilegeLevel: number
  permissions: (
    | ContentModerationActionNullEnum
    | { DeleteVideoAssets: boolean }
    | { ChangeChannelFeatureStatus: ContentModerationAction['asChangeChannelFeatureStatus']['type'] }
  )[]
}[]

export type ChannelUpdateInputParameters = ChannelCreationInputParameters

export type VideoCategoryInputParameters = ICreateVideoCategory

export type WorkingGroupOpeningInputParameters = Omit<IOpeningMetadata, 'applicationFormQuestions'> & {
  stakingPolicy: {
    amount: number
    unstakingPeriod: number
  }
  rewardPerBlock?: number
  applicationFormQuestions?: {
    question: string
    type: 'TEXTAREA' | 'TEXT'
  }[]
}

export type WorkingGroupUpdateStatusInputParameters = IWorkingGroupMetadata

type AnyPrimitive = string | number | boolean | Long

// JSONSchema utility types

// Based on: https://stackoverflow.com/questions/51465182/how-to-remove-index-signature-using-mapped-types
type RemoveIndex<T> = {
  [K in keyof T as string extends K ? never : number extends K ? never : K]: T[K]
}

type AnyJSONSchema = RemoveIndex<JSONSchema4>

type IsBoolean<T> = T | boolean extends boolean ? true : false

export type JSONTypeName<T> = T extends string
  ? 'string' | ['string', 'null']
  : T extends number
  ? 'number' | ['number', 'null'] | 'integer' | ['integer', 'null']
  : T extends boolean
  ? 'boolean' | ['boolean', 'null']
  : T extends any[]
  ? 'array' | ['array', 'null']
  : T extends Long
  ? 'number' | ['number', 'null'] | 'integer' | ['integer', 'null']
  : 'object' | ['object', 'null']

// tweaked version of https://stackoverflow.com/questions/53953814/typescript-check-if-a-type-is-a-union
type IsUnion<T, U extends T = T> = (T extends unknown ? (U extends T ? false : true) : never) extends false
  ? false
  : IsBoolean<T> extends true
  ? false
  : true

export type PropertySchema<P> = Omit<AnyJSONSchema, 'type' | 'properties'> & {
  type: JSONTypeName<P>
} & (IsUnion<NonNullable<P>> extends true
    ? { enum?: P[] }
    : P extends AnyPrimitive
    ? { properties?: never }
    : P extends (infer T)[]
    ? { properties?: never; items: PropertySchema<T> }
    : { properties: JsonSchemaProperties<P> })

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
