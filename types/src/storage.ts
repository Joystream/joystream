import {Null, u64, Text, Vec, GenericAccountId as AccountId} from "@polkadot/types";
import {RegistryTypes} from "@polkadot/types/types";
import {JoyBTreeSet, JoyEnum, JoyStructDecorated} from './common'

export class DataObjectId extends u64 {}
export class StorageBucketId extends u64 {}

export type StorageBucketsPerBagValueConstraintType = {
    min: u64,
    max_min_diff: u64,
}

export class StorageBucketsPerBagValueConstraint
    extends JoyStructDecorated({
        min: u64,
        max_min_diff: u64,
    })
    implements StorageBucketsPerBagValueConstraintType {}

export class DynamicBagId extends u64 {}
export class DynamicBagType extends u64 {}
export class DynamicBagCreationPolicy extends u64 {}
export class DynamicBag extends u64 {}
export class StaticBag extends u64 {}
export class StorageBucket extends u64 {}


export const StaticBagIdDef = {
    Council: Null,
    WorkingGroup: Null,
} as const
export type StaticBagIdKey = keyof typeof StaticBagIdDef
export class StaticBagId extends JoyEnum(StaticBagIdDef) {}

export class Static extends StaticBagId {}

export const BagIdDef = {
    Static,
    Dynamic: Null,
} as const
export type BagIdKey = keyof typeof BagIdDef
export class BagId extends JoyEnum(BagIdDef) {}

export type VoucherType = {
    sizeLimit: u64,
    objectsLimit: u64,
    sizeUsed: u64,
    objectsUsed: u64,
}

export class Voucher
    extends JoyStructDecorated({
        sizeLimit: u64,
        objectsLimit: u64,
        sizeUsed: u64,
        objectsUsed: u64,
    })
    implements VoucherType {}

export class StorageBucketIdSet extends JoyBTreeSet(StorageBucketId) {}

export class BagIdType extends u64 {}

export type DataObjectCreationParametersType = {
    size: u64,
    ipfsContentId: Text,
}

export class DataObjectCreationParameters
    extends JoyStructDecorated({
        size: u64,
        ipfsContentId: Text,
    })
    implements DataObjectCreationParametersType {}

export type UploadParametersType = {
    authenticationKey: Text,
    bagId: BagId,
    objectCreationList: Vec<DataObjectCreationParameters>,
    deletionPrizeSourceAccountId: AccountId,
}

export class UploadParameters
    extends JoyStructDecorated({
        authenticationKey: Text,
        bagId: BagId,
        objectCreationList: Vec.with(DataObjectCreationParameters),
        deletionPrizeSourceAccountId: AccountId,
    })
    implements UploadParametersType {}


export const storageTypes: RegistryTypes = {
    StorageBucketId,
    StorageBucketsPerBagValueConstraint,
    DataObjectId,
    DynamicBagId,
    Voucher,
    DynamicBagType,
    DynamicBagCreationPolicy,
    DynamicBag,
    StaticBag,
    StorageBucket,
    StaticBagId,
    Static,
    BagId,
    DataObjectCreationParameters,
    BagIdType,
    UploadParameters,
    StorageBucketIdSet,
}
export default storageTypes