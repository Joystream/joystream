import {
  Null,
  u128,
  u64,
  Text,
  Vec,
  bool,
  GenericAccountId as AccountId,
  BTreeSet,
  BTreeMap,
  Option,
} from '@polkadot/types'
import { RegistryTypes } from '@polkadot/types/types'
import { JoyBTreeSet, JoyEnum, JoyStructDecorated, WorkingGroup } from './common'
import { MemberId } from './members'
import { WorkerId } from './working-group'

export class BalanceOf extends u128 {}
export class DataObjectId extends u64 {}
export class StorageBucketId extends u64 {}

export type StorageBucketsPerBagValueConstraintType = {
  min: u64
  max_min_diff: u64
}

export class StorageBucketsPerBagValueConstraint
  extends JoyStructDecorated({
    min: u64,
    max_min_diff: u64,
  })
  implements StorageBucketsPerBagValueConstraintType {}

export type StorageDataObjectType = {
  accepted: bool
  deletion_prize: BalanceOf
  size: u64
}

// DataObject from the storage pallet. Changed due to the types conflict resolution.
export class StorageDataObject
  extends JoyStructDecorated({
    accepted: bool,
    deletion_prize: BalanceOf,
    size: u64,
  })
  implements StorageDataObjectType {}

export class DataObjectIdSet extends JoyBTreeSet(DataObjectId) {}
export class DistributionBucketId extends u64 {}
export class DistributionBucketFamilyId extends u64 {}
export class StorageBucketIdSet extends JoyBTreeSet(StorageBucketId) {}
export class DistributionBucketSet extends JoyBTreeSet(DistributionBucketId) {}

export type DynamicBagDeletionPrizeTypeDef = {
  account_id: AccountId
  prize: BalanceOf
}

export class DynamicBagDeletionPrize
  extends JoyStructDecorated({
    account_id: AccountId,
    prize: BalanceOf,
  })
  implements DynamicBagDeletionPrizeTypeDef {}

export class DynamicBagDeletionPrizeRecord extends DynamicBagDeletionPrize {}

export type BagTypeDef = {
  objects: BTreeMap<DataObjectId, StorageDataObject>
  stored_by: StorageBucketIdSet
  distributed_by: DistributionBucketSet
  deletion_prize: Option<BalanceOf>
}

export class Bag
  extends JoyStructDecorated({
    objects: BTreeMap.with(DataObjectId, StorageDataObject),
    stored_by: StorageBucketIdSet,
    distributed_by: DistributionBucketSet,
    deletion_prize: Option.with(BalanceOf),
  })
  implements BagTypeDef {}

export type DynamicBagCreationPolicyType = {
  numberOfStorageBuckets: u64
}

export class DynamicBagCreationPolicy
  extends JoyStructDecorated({
    numberOfStorageBuckets: u64,
  })
  implements DynamicBagCreationPolicyType {}

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
export type StaticBagIdKey = keyof typeof StaticBagIdDef
export class StaticBagId extends JoyEnum(StaticBagIdDef) {}

export class Static extends StaticBagId {}

export class ChannelId extends u64 {}
export const DynamicBagIdDef = {
  Member: MemberId,
  Channel: ChannelId,
} as const
export type DynamicBagIdKey = keyof typeof DynamicBagIdDef
export class DynamicBagId extends JoyEnum(DynamicBagIdDef) {}

export class Dynamic extends DynamicBagId {}

export const BagIdDef = {
  Static,
  Dynamic,
} as const
export type BagIdKey = keyof typeof BagIdDef
export class BagId extends JoyEnum(BagIdDef) {}

// Alias
export class BagIdType extends BagId {}

export type VoucherType = {
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
  implements VoucherType {}

export const StorageBucketOperatorStatusDef = {
  Missing: Null,
  InvitedStorageWorker: WorkerId,
  StorageWorker: WorkerId,
} as const
export type StorageBucketOperatorStatusKey = keyof typeof StorageBucketOperatorStatusDef
export class StorageBucketOperatorStatus extends JoyEnum(StorageBucketOperatorStatusDef) {}

export type StorageBucketType = {
  operator_status: StorageBucketOperatorStatus
  accepting_new_bags: bool
  voucher: Voucher
  metadata: Text
}

export class StorageBucket
  extends JoyStructDecorated({
    operator_status: StorageBucketOperatorStatus,
    accepting_new_bags: bool,
    voucher: Voucher,
    metadata: Text,
  })
  implements StorageBucketType {}

export type DataObjectCreationParametersType = {
  size: u64
  ipfsContentId: Text
}

export class DataObjectCreationParameters
  extends JoyStructDecorated({
    size: u64,
    ipfsContentId: Text,
  })
  implements DataObjectCreationParametersType {}

export type UploadParametersType = {
  authenticationKey: Text
  bagId: BagId
  objectCreationList: Vec<DataObjectCreationParameters>
  deletionPrizeSourceAccountId: AccountId
  expectedDataSizeFee: BalanceOf
}

export class UploadParameters
  extends JoyStructDecorated({
    authenticationKey: Text,
    bagId: BagId,
    objectCreationList: Vec.with(DataObjectCreationParameters),
    deletionPrizeSourceAccountId: AccountId,
    expectedDataSizeFee: BalanceOf,
  })
  implements UploadParametersType {}

export class Cid extends Text {}
export class ContentIdSet extends BTreeSet.with(Cid) {}

export type DistributionBucketType = {
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
  implements DistributionBucketType {}

export type DistributionBucketFamilyType = {
  distribution_buckets: BTreeMap<DistributionBucketId, DistributionBucket>
}

export class DistributionBucketFamily
  extends JoyStructDecorated({
    distribution_buckets: BTreeMap.with(DistributionBucketId, DistributionBucket),
  })
  implements DistributionBucketFamilyType {}

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
  StorageDataObject,
  DistributionBucketId,
  DistributionBucketFamilyId,
  DistributionBucket,
  DistributionBucketFamily,
}
export default storageTypes
