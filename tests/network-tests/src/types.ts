import { MemberId, ForumPostId, ForumThreadId, ForumCategoryId } from '@joystream/types/primitives'
import { MembershipBoughtEvent } from './graphql/generated/schema'
import { PalletProposalsCodexProposalDetails as ProposalDetails } from '@polkadot/types/lookup'
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

export type ProposalType = ProposalDetails['type']
// export type ProposalDetailsJsonByType<T extends ProposalType = ProposalType> = CreateInterface<
//   InstanceType<ProposalDetails['type'][T]>
// >

export type ProposalDetailsJsonByType<T extends ProposalType = ProposalType> = ProposalDetails[`as${T}`]
// Forum

export type ThreadPath = {
  categoryId: ForumCategoryId
  threadId: ForumThreadId
}

export type PostPath = {
  categoryId: ForumCategoryId
  threadId: ForumThreadId
  postId: ForumPostId
}

// Forum init
export type FaucetInfo = {
  suri: string
}
