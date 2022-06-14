import {
  Null,
  u64,
  Bytes,
  Vec,
  bool,
  GenericAccountId as AccountId,
  BTreeSet,
  BTreeMap,
  u32,
  Tuple,
} from '@polkadot/types'
import { RegistryTypes } from '@polkadot/types/types'
import {
  JoyEnum,
  JoyStructDecorated,
  WorkingGroup,
  BalanceOf,
  MemberId,
  InputValidationLengthConstraintU64,
} from './common'
import { WorkerId } from './working-group'

export class DataObjectId extends u64 {}
export class StorageBucketId extends u64 {}

export type IDataObject = {
  accepted: bool
  state_bloat_bond: BalanceOf
  size: u64
  ipfsContentId: Bytes
}

export class DataObject
  extends JoyStructDecorated({
    accepted: bool,
    state_bloat_bond: BalanceOf,
    size: u64,
    ipfsContentId: Bytes,
  })
  implements IDataObject {}

export class DataObjectIdSet extends BTreeSet.with(DataObjectId) {}
export class DataObjectIdMap extends BTreeMap.with(DataObjectId, DataObject) {}
export class DistributionBucketIndex extends u64 {}
export class DistributionBucketFamilyId extends u64 {}
export class StorageBucketIdSet extends BTreeSet.with(StorageBucketId) {}
export class DistributionBucketIndexSet extends BTreeSet.with(DistributionBucketIndex) {}

export type IDistributionBucketId = {
  distribution_bucket_family_id: DistributionBucketFamilyId
  distribution_bucket_index: DistributionBucketIndex
}

export class DistributionBucketId
  extends JoyStructDecorated({
    distribution_bucket_family_id: DistributionBucketFamilyId,
    distribution_bucket_index: DistributionBucketIndex,
  })
  implements IDistributionBucketId {}

export type IBag = {
  stored_by: BTreeSet<StorageBucketId>
  distributed_by: BTreeSet<DistributionBucketId>
  objects_total_size: u64
  objects_number: u64
}

export class Bag
  extends JoyStructDecorated({
    stored_by: BTreeSet.with(StorageBucketId),
    distributed_by: BTreeSet.with(DistributionBucketId),
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
  StorageWorker: Tuple.with([WorkerId, AccountId]),
} as const
export class StorageBucketOperatorStatus extends JoyEnum(StorageBucketOperatorStatusDef) {}

export type IStorageBucket = {
  operator_status: StorageBucketOperatorStatus
  accepting_new_bags: bool
  voucher: Voucher
  assigned_bags: u64
}

export class StorageBucket
  extends JoyStructDecorated({
    operator_status: StorageBucketOperatorStatus,
    accepting_new_bags: bool,
    voucher: Voucher,
    assigned_bags: u64,
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
  stateBloatBondSourceAccountId: AccountId
  expectedDataSizeFee: BalanceOf
  expectedDataObjectStateBloatBond: BalanceOf
  storageBuckets: BTreeSet<StorageBucketId>
  distributionBuckets: BTreeSet<DistributionBucketId>
}

export class UploadParameters
  extends JoyStructDecorated({
    bagId: BagId,
    objectCreationList: Vec.with(DataObjectCreationParameters),
    stateBloatBondSourceAccountId: AccountId,
    expectedDataSizeFee: BalanceOf,
    expectedDataObjectStateBloatBond: BalanceOf,
    storageBuckets: BTreeSet.with(StorageBucketId),
    distributionBuckets: BTreeSet.with(DistributionBucketId),
  })
  implements IUploadParameters {}

export class DynBagCreationParameters extends JoyStructDecorated({
  bagId: DynamicBagId,
  objectCreationList: Vec.with(DataObjectCreationParameters),
  stateBloatBondSourceAccountId: AccountId,
  expectedDataSizeFee: BalanceOf,
}) {}

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
  next_distribution_bucket_index: DistributionBucketIndex
}

export class DistributionBucketFamily
  extends JoyStructDecorated({
    next_distribution_bucket_index: DistributionBucketIndex,
  })
  implements IDistributionBucketFamily {}

export class DynamicBagCreationPolicyDistributorFamiliesMap extends BTreeMap.with(DistributionBucketFamilyId, u32) {}

export class StorageBucketsPerBagValueConstraint extends InputValidationLengthConstraintU64 {}

export class DistributionBucketsPerBagValueConstraint extends InputValidationLengthConstraintU64 {}

export const storageTypes: RegistryTypes = {
  StorageBucketId,
  DataObjectId,
  DynamicBagId,
  Voucher,
  DynamicBagType,
  DynamicBagCreationPolicy,
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
  DistributionBucketIndex,
  DistributionBucketFamilyId,
  DistributionBucket,
  DistributionBucketFamily,
  StorageBucketsPerBagValueConstraint,
  DistributionBucketsPerBagValueConstraint,
  // Utility types:
  DataObjectIdMap,
  DistributionBucketIndexSet,
  DynBagCreationParameters,
  DynamicBagCreationPolicyDistributorFamiliesMap,
}
export default storageTypes
