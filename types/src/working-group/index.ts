import { BTreeMap, Option, Text } from '@polkadot/types'
import { Null, u32, u64, u128, Bytes } from '@polkadot/types/primitive'
import { BlockNumber, Balance } from '@polkadot/types/interfaces'
import { AccountId, ActorId, MemberId, JoyEnum, JoyStructDecorated, JoyBTreeSet } from '../common'
import { RegistryTypes } from '@polkadot/types/types'

export class ApplicationId extends u64 {}
export class OpeningId extends u64 {}
export class WorkerId extends ActorId {}
export class StorageProviderId extends WorkerId {}

export class ApplicationIdSet extends JoyBTreeSet(ApplicationId) {}
export class ApplicationIdToWorkerIdMap extends BTreeMap.with(ApplicationId, WorkerId) {}

export type IApplication = {
  role_account_id: AccountId
  reward_account_id: AccountId
  staking_account_id: AccountId
  member_id: MemberId
  description_hash: Bytes
  opening_id: OpeningId
}

export class Application
  extends JoyStructDecorated({
    role_account_id: AccountId,
    reward_account_id: AccountId,
    staking_account_id: AccountId,
    member_id: MemberId,
    description_hash: Bytes,
    opening_id: OpeningId,
  })
  implements IApplication {}

export type IApplicationInfo = {
  application_id: ApplicationId
  application: Application
}

export class ApplicationInfo
  extends JoyStructDecorated({
    application_id: ApplicationId,
    application: Application,
  })
  implements IApplicationInfo {}

export type IWorker = {
  member_id: MemberId
  role_account_id: AccountId
  staking_account_id: AccountId
  reward_account_id: AccountId
  started_leaving_at: Option<BlockNumber>
  job_unstaking_period: BlockNumber
  reward_per_block: Option<Balance>
  missed_reward: Option<Balance>
  created_at: BlockNumber
}

export class Worker
  extends JoyStructDecorated({
    member_id: MemberId,
    role_account_id: AccountId,
    staking_account_id: AccountId,
    reward_account_id: AccountId,
    started_leaving_at: Option.with(u32),
    job_unstaking_period: u32,
    reward_per_block: Option.with(u128),
    missed_reward: Option.with(u128),
    created_at: u32,
  })
  implements IWorker {
  // FIXME: Won't be needed soon?
  get is_active(): boolean {
    return !this.isEmpty
  }
}

export type IWorkerInfo = {
  worker_id: WorkerId
  worker: Worker
}

export class WorkerInfo
  extends JoyStructDecorated({
    worker_id: WorkerId,
    worker: Worker,
  })
  implements IWorkerInfo {}

export type IStakePolicy = {
  stake_amount: Balance
  leaving_unstaking_period: BlockNumber
}
export class StakePolicy
  extends JoyStructDecorated({
    stake_amount: u128,
    leaving_unstaking_period: u32,
  })
  implements IStakePolicy {}

export type IStakeParameters = {
  stake: Balance
  staking_account_id: AccountId
}

export class StakeParameters
  extends JoyStructDecorated({
    stake: u128,
    staking_account_id: AccountId,
  })
  implements IStakeParameters {}

export type IApplyOnOpeningParameters = {
  member_id: MemberId
  opening_id: OpeningId
  role_account_id: AccountId
  reward_account_id: AccountId
  description: Bytes
  stake_parameters: StakeParameters
}

export class ApplyOnOpeningParameters
  extends JoyStructDecorated({
    member_id: MemberId,
    opening_id: OpeningId,
    role_account_id: AccountId,
    reward_account_id: AccountId,
    description: Bytes,
    stake_parameters: StakeParameters,
  })
  implements IApplyOnOpeningParameters {}

export type IPenalty = {
  slashing_text: Text
  slashing_amount: Balance
}

export class Penalty
  extends JoyStructDecorated({
    slashing_text: Text,
    slashing_amount: u128,
  })
  implements IPenalty {}

export class OpeningType_Leader extends Null {}
export class OpeningType_Regular extends Null {}
export const OpeningTypeDef = {
  Leader: OpeningType_Leader,
  Regular: OpeningType_Regular,
} as const
export type OpeningTypeKey = keyof typeof OpeningTypeDef
export class OpeningType extends JoyEnum(OpeningTypeDef) {}

export type IOpening = {
  opening_type: OpeningType
  created: BlockNumber
  description_hash: Bytes
  stake_policy: StakePolicy
  reward_per_block: Option<Balance>
}

export class Opening
  extends JoyStructDecorated({
    opening_type: OpeningType,
    created: u32,
    description_hash: Bytes,
    stake_policy: StakePolicy,
    reward_per_block: Option.with(u128),
  })
  implements IOpening {}

// Reward payment type enum.
export class RewardPaymentType extends JoyEnum({
  MissedReward: Null,
  RegularReward: Null,
}) {}

export const workingGroupTypes: RegistryTypes = {
  ApplicationId,
  Application,
  ApplicationInfo,
  ApplicationIdSet,
  ApplicationIdToWorkerIdMap,
  WorkerId,
  Worker,
  WorkerInfo,
  Opening,
  OpeningId,
  StakePolicy,
  StakeParameters,
  StorageProviderId,
  OpeningType,
  ApplyOnOpeningParameters,
  Penalty,
  RewardPaymentType,
}

export default workingGroupTypes
