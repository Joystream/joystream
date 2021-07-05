/*
eslint-disable @typescript-eslint/naming-convention
*/
import { EventContext, StoreContext } from '@joystream/hydra-common'

// BUCKETS

export async function storage_StorageBucketCreated({ event, store }: EventContext & StoreContext): Promise<void> {
  // To be implemented
}

export async function storage_StorageOperatorMetadataSet({ event, store }: EventContext & StoreContext): Promise<void> {
  // To be implemented
}

export async function storage_StorageBucketStatusUpdated({ event, store }: EventContext & StoreContext): Promise<void> {
  // To be implemented
}

export async function storage_StorageBucketInvitationAccepted({
  event,
  store,
}: EventContext & StoreContext): Promise<void> {
  // To be implemented
}

export async function storage_StorageBucketInvitationCancelled({
  event,
  store,
}: EventContext & StoreContext): Promise<void> {
  // To be implemented
}

export async function storage_StorageBucketOperatorInvited({
  event,
  store,
}: EventContext & StoreContext): Promise<void> {
  // To be implemented
}

export async function storage_StorageBucketOperatorRemoved({
  event,
  store,
}: EventContext & StoreContext): Promise<void> {
  // To be implemented
}

export async function storage_StorageBucketsUpdatedForBag({
  event,
  store,
}: EventContext & StoreContext): Promise<void> {
  // To be implemented
}

export async function storage_StorageBucketDeleted({ event, store }: EventContext & StoreContext): Promise<void> {
  // To be implemented
}

// DYNAMIC BAGS
export async function storage_DynamicBagCreated({ event, store }: EventContext & StoreContext): Promise<void> {
  // To be implemented
}

export async function storage_DynamicBagDeleted({ event, store }: EventContext & StoreContext): Promise<void> {
  // To be implemented
}

// DATA OBJECTS

// Note: "Uploaded" here actually means "created" (the real upload happens later)
export async function storage_DataObjectdUploaded({ event, store }: EventContext & StoreContext): Promise<void> {
  // To be implemented
}

export async function storage_PendingDataObjectsAccepted({ event, store }: EventContext & StoreContext): Promise<void> {
  // To be implemented
}

export async function storage_DataObjectsMoved({ event, store }: EventContext & StoreContext): Promise<void> {
  // To be implemented
}

export async function storage_DataObjectsDeleted({ event, store }: EventContext & StoreContext): Promise<void> {
  // To be implemented
}

// BLACKLIST
export async function storage_UpdateBlacklist({ event, store }: EventContext & StoreContext): Promise<void> {
  // To be implemented
}

export async function storage_StorageBucketVoucherLimitsSet({
  event,
  store,
}: EventContext & StoreContext): Promise<void> {
  // To be implemented
}

export async function storage_UploadingBlockStatusUpdated({
  event,
  store,
}: EventContext & StoreContext): Promise<void> {
  // To be implemented
}

export async function storage_DataObjectPerMegabyteFeeUpdated({
  event,
  store,
}: EventContext & StoreContext): Promise<void> {
  // To be implemented
}

export async function storage_StorageBucketsPerBagLimitUpdated({
  event,
  store,
}: EventContext & StoreContext): Promise<void> {
  // To be implemented
}

export async function storage_StorageBucketsVoucherMaxLimitsUpdated({
  event,
  store,
}: EventContext & StoreContext): Promise<void> {
  // To be implemented
}

export async function storage_DeletionPrizeChanged({ event, store }: EventContext & StoreContext): Promise<void> {
  // To be implemented
}

export async function storage_VoucherChanged({ event, store }: EventContext & StoreContext): Promise<void> {
  // To be implemented
}

export async function storage_NumberOfStorageBucketsInDynamicBagCreationPolicyUpdated({
  event,
  store,
}: EventContext & StoreContext): Promise<void> {
  // To be implemented
}
