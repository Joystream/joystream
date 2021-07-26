import { Null, u64, Bytes, Vec, bool, GenericAccountId as AccountId, BTreeSet, BTreeMap, Option } from '@polkadot/types'
import { RegistryTypes } from '@polkadot/types/types'
import { JoyBTreeSet, JoyEnum, JoyStructDecorated, WorkingGroup, BalanceOf } from './common'
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
}

export class DataObject
  extends JoyStructDecorated({
    accepted: bool,
    deletion_prize: BalanceOf,
    size: u64,
  })
  implements IDataObject {}

export class DataObjectIdSet extends JoyBTreeSet(DataObjectId) {}
export class DistributionBucketId extends u64 {}
export class DistributionBucketFamilyId extends u64 {}
export class StorageBucketIdSet extends JoyBTreeSet(StorageBucketId) {}
export class DistributionBucketSet extends JoyBTreeSet(DistributionBucketId) {}

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
  objects: BTreeMap<DataObjectId, DataObject>
  stored_by: StorageBucketIdSet
  distributed_by: DistributionBucketSet
  deletion_prize: Option<BalanceOf>
}

export class Bag
  extends JoyStructDecorated({
    objects: BTreeMap.with(DataObjectId, DataObject),
    stored_by: StorageBucketIdSet,
    distributed_by: DistributionBucketSet,
    deletion_prize: Option.with(BalanceOf),
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

export const DynamicBagIdDef = {
  Member: MemberId,
  Channel: ChannelId,
}
export type DynamicBagIdKey = keyof typeof DynamicBagIdDef
export class DynamicBagIdType extends JoyEnum(DynamicBagIdDef) {}

// Runtime alias
export class DynamicBagId extends DynamicBagIdType {}

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
  authenticationKey: Bytes
  bagId: BagId
  objectCreationList: Vec<DataObjectCreationParameters>
  deletionPrizeSourceAccountId: AccountId
  expectedDataSizeFee: BalanceOf
}

export class UploadParameters
  extends JoyStructDecorated({
    authenticationKey: Bytes,
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

export type IDistributionBucketFamily = {
  distribution_buckets: BTreeMap<DistributionBucketId, DistributionBucket>
}

export class DistributionBucketFamily
  extends JoyStructDecorated({
    distribution_buckets: BTreeMap.with(DistributionBucketId, DistributionBucket),
  })
  implements IDistributionBucketFamily {}

export class DistributionBucket extends JoyStructDecorated({
  acceptingNewBags: bool,
  distributing: bool,
  pendingInvitations: JoyBTreeSet(WorkerId),
  operators: JoyBTreeSet(WorkerId),
}) {}

export class DistributionBucketFamily extends JoyStructDecorated({
  distributionBuckets: BTreeMap.with(DistributionBucketId, DistributionBucket),
}) {}

export class DynamicBagCreationPolicyDistributorFamiliesMap extends BTreeMap.with(DistributionBucketFamilyId, u32) {}

export const storageTypes: RegistryTypes = {
  StorageBucketId,
  StorageBucketsPerBagValueConstraint,
  DataObjectId,
  DynamicBagIdType,
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
}
export default storageTypes
