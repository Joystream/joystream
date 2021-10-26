import {
  Null,
  u64,
  Bytes,
  Vec,
  bool,
  GenericAccountId as AccountId,
  BTreeSet,
  BTreeMap,
  Option,
  u32,
  u128,
} from '@polkadot/types'
import { Balance } from '@polkadot/types/interfaces'
import { RegistryTypes } from '@polkadot/types/types'
import { JoyEnum, JoyStructDecorated, WorkingGroup, BalanceOf } from './common'
import { MemberId } from './members'
import { WorkerId } from './working-group'

export class DataObjectId extends u64 {}
export class StorageBucketId extends u64 {}

export type IStorageBucketsPerBagValueConstraint = {
  min: u64
  max_min_diff: u64
}

export class StorageBucketsPerBagValueConstraint
  extends JoyStructDecorated({
    min: u64,
    max_min_diff: u64,
  })
  implements IStorageBucketsPerBagValueConstraint {}

export type IDataObject = {
  accepted: bool
  deletion_prize: BalanceOf
  size: u64
  ipfsContentId: Bytes
}

export class DataObject
  extends JoyStructDecorated({
    accepted: bool,
    deletion_prize: BalanceOf,
    size: u64,
    ipfsContentId: Bytes,
  })
  implements IDataObject {}

export class DataObjectIdSet extends BTreeSet.with(DataObjectId) {}
export class DataObjectIdMap extends BTreeMap.with(DataObjectId, DataObject) {}
export class DistributionBucketId extends u64 {}
export class DistributionBucketFamilyId extends u64 {}
export class StorageBucketIdSet extends BTreeSet.with(StorageBucketId) {}
export class DistributionBucketIdSet extends BTreeSet.with(DistributionBucketId) {}

export type IDynamicBagDeletionPrize = {
  account_id: AccountId
  prize: BalanceOf
}

export class DynamicBagDeletionPrize
  extends JoyStructDecorated({
    account_id: AccountId,
    prize: BalanceOf,
  })
  implements IDynamicBagDeletionPrize {}

export class DynamicBagDeletionPrizeRecord extends DynamicBagDeletionPrize {}

export type IBag = {
  stored_by: BTreeSet<StorageBucketId>
  distributed_by: BTreeSet<DistributionBucketId>
  deletion_prize: Option<Balance>
  objects_total_size: u64
  objects_number: u64
}

export class Bag
  extends JoyStructDecorated({
    stored_by: BTreeSet.with(StorageBucketId),
    distributed_by: BTreeSet.with(DistributionBucketId),
    deletion_prize: Option.with(u128),
    objects_total_size: u64,
    objects_number: u64,
  })
  implements IBag {}

export type IDynamicBagCreationPolicy = {
  numberOfStorageBuckets: u64
  families: BTreeMap<DistributionBucketFamilyId, u32>
}

export class DynamicBagCreationPolicy
  extends JoyStructDecorated({
    numberOfStorageBuckets: u64,
    families: BTreeMap.with(DistributionBucketFamilyId, u32),
  })
  implements IDynamicBagCreationPolicy {}

export const DynamicBagTypeDef = {
  Member: Null,
  Channel: Null,
} as const
export type DynamicBagTypeKey = keyof typeof DynamicBagTypeDef
export class DynamicBagType extends JoyEnum(DynamicBagTypeDef) {}

export const StaticBagIdDef = {
  Council: Null,
  WorkingGroup: WorkingGroup,
} as const
export class StaticBagId extends JoyEnum(StaticBagIdDef) {}
export class Static extends StaticBagId {}

// This type should be imported from content-directory/common types once the Olympia release is merged.
export class ChannelId extends u64 {}

export const DynamicBagIdDef = {
  Member: MemberId,
  Channel: ChannelId,
} as const
export class DynamicBagId extends JoyEnum(DynamicBagIdDef) {}
export class Dynamic extends DynamicBagId {}

export const BagIdDef = {
  Static,
  Dynamic,
} as const
export class BagId extends JoyEnum(BagIdDef) {}

// Alias
export class BagIdType extends BagId {}

export type IVoucher = {
  sizeLimit: u64
  objectsLimit: u64
  sizeUsed: u64
  objectsUsed: u64
}

export class Voucher
  extends JoyStructDecorated({
    sizeLimit: u64,
    objectsLimit: u64,
    sizeUsed: u64,
    objectsUsed: u64,
  })
  implements IVoucher {}

export const StorageBucketOperatorStatusDef = {
  Missing: Null,
  InvitedStorageWorker: WorkerId,
  StorageWorker: WorkerId,
} as const
export class StorageBucketOperatorStatus extends JoyEnum(StorageBucketOperatorStatusDef) {}

export type IStorageBucket = {
  operator_status: StorageBucketOperatorStatus
  accepting_new_bags: bool
  voucher: Voucher
  metadata: Bytes
}

export class StorageBucket
  extends JoyStructDecorated({
    operator_status: StorageBucketOperatorStatus,
    accepting_new_bags: bool,
    voucher: Voucher,
    metadata: Bytes,
  })
  implements IStorageBucket {}

export type IDataObjectCreationParameters = {
  size: u64
  ipfsContentId: Bytes
}

export class DataObjectCreationParameters
  extends JoyStructDecorated({
    size: u64,
    ipfsContentId: Bytes,
  })
  implements IDataObjectCreationParameters {}

export type IUploadParameters = {
  bagId: BagId
  objectCreationList: Vec<DataObjectCreationParameters>
  deletionPrizeSourceAccountId: AccountId
  expectedDataSizeFee: BalanceOf
}

export class UploadParameters
  extends JoyStructDecorated({
    bagId: BagId,
    objectCreationList: Vec.with(DataObjectCreationParameters),
    deletionPrizeSourceAccountId: AccountId,
    expectedDataSizeFee: BalanceOf,
  })
  implements IUploadParameters {}

export class Cid extends Bytes {}
export class ContentIdSet extends BTreeSet.with(Cid) {}

export type IDistributionBucket = {
  accepting_new_bags: bool
  distributing: bool
  pending_invitations: BTreeSet<WorkerId>
  operators: BTreeSet<WorkerId>
  assigned_bags: u64
}

export class DistributionBucket
  extends JoyStructDecorated({
    accepting_new_bags: bool,
    distributing: bool,
    pending_invitations: BTreeSet.with(WorkerId),
    operators: BTreeSet.with(WorkerId),
    assigned_bags: u64,
  })
  implements IDistributionBucket {}

export type IDistributionBucketState = {
  accepting_new_bags: bool
}

export class DistributionBucketState
  extends JoyStructDecorated({
    accepting_new_bags: bool,
  })
  implements IDistributionBucketState {}

export type IDistributionBucketFamily = {
  distribution_buckets: BTreeMap<DistributionBucketId, DistributionBucketState>
}

export class DistributionBucketFamily
  extends JoyStructDecorated({
    distribution_buckets: BTreeMap.with(DistributionBucketId, DistributionBucketState),
  })
  implements IDistributionBucketFamily {}

export class DynamicBagCreationPolicyDistributorFamiliesMap extends BTreeMap.with(DistributionBucketFamilyId, u32) {}

export const storageTypes: RegistryTypes = {
  StorageBucketId,
  StorageBucketsPerBagValueConstraint,
  DataObjectId,
  DynamicBagId,
  Voucher,
  DynamicBagType,
  DynamicBagCreationPolicy,
  DynamicBagDeletionPrize,
  DynamicBagDeletionPrizeRecord,
  Bag,
  StorageBucket,
  StaticBagId,
  Static,
  Dynamic,
  BagId,
  DataObjectCreationParameters,
  BagIdType,
  UploadParameters,
  StorageBucketIdSet,
  DataObjectIdSet,
  ContentIdSet,
  Cid,
  StorageBucketOperatorStatus,
  DataObject,
  DistributionBucketId,
  DistributionBucketFamilyId,
  DistributionBucket,
  DistributionBucketFamily,
  // Utility types:
  DataObjectIdMap,
  DistributionBucketIdSet,
  DynamicBagCreationPolicyDistributorFamiliesMap,
}
export default storageTypes
