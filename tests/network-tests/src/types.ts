import { MemberId, PostId, ThreadId } from '@joystream/types/common'
import { CategoryId } from '@joystream/types/forum'
import { MembershipBoughtEvent } from './graphql/generated/schema'
import { ProposalDetails } from '@joystream/types/proposals'
import { CreateInterface } from '@joystream/types'
import { ApiPromise } from '@polkadot/api'
import { AugmentedEvent } from '@polkadot/api/types'
import { IEvent } from '@polkadot/types/types'

// Event-related

export type AnyQueryNodeEvent = Pick<
  MembershipBoughtEvent,
  'createdAt' | 'updatedAt' | 'id' | 'inBlock' | 'inExtrinsic' | 'indexInBlock' | 'network'
>

export type EventSection = keyof ApiPromise['events'] & string
export type EventMethod<Section extends EventSection> = keyof ApiPromise['events'][Section] & string
export type EventType<
  Section extends EventSection,
  Method extends EventMethod<Section>
> = ApiPromise['events'][Section][Method] extends AugmentedEvent<'promise', infer T> ? IEvent<T> : never
export interface EventDetails<T = unknown> {
  event: T
  blockNumber: number
  blockTimestamp: number
  blockHash: string
  indexInBlock: number
}

// Framework
export type KeyGenInfo = {
  start: number
  final: number
  custom: string[]
}

// Membership

export type MemberContext = {
  account: string
  memberId: MemberId
}

export type MetadataInput<T> = {
  value: T | string
  expectFailure?: boolean
}

// Working groups

export type WorkingGroupModuleName =
  | 'storageWorkingGroup'
  | 'contentWorkingGroup'
  | 'forumWorkingGroup'
  | 'membershipWorkingGroup'
  | 'operationsWorkingGroupAlpha'
  | 'gatewayWorkingGroup'
  | 'distributionWorkingGroup'
  | 'operationsWorkingGroupBeta'
  | 'operationsWorkingGroupGamma'

// Proposals:

export type ProposalType = keyof typeof ProposalDetails.typeDefinitions
export type ProposalDetailsJsonByType<T extends ProposalType = ProposalType> = CreateInterface<
  InstanceType<ProposalDetails['typeDefinitions'][T]>
>
// Forum

export type ThreadPath = {
  categoryId: CategoryId
  threadId: ThreadId
}

export type PostPath = {
  categoryId: CategoryId
  threadId: ThreadId
  postId: PostId
}

// Forum init
export type FaucetInfo = {
  suri: string
  memberId: number
}
