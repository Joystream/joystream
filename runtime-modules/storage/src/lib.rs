// Ensure we're `no_std` when compiling for Wasm.
#![cfg_attr(not(feature = "std"), no_std)]

pub mod data_directory;
pub mod data_object_storage_registry;
pub mod data_object_type_registry;

mod tests;

// The storage working group instance alias.
pub type StorageWorkingGroupInstance = working_group::Instance2;

// Alias for storage working group
pub(crate) type StorageWorkingGroup<T> = working_group::Module<T, StorageWorkingGroupInstance>;

// Alias for the member id.
pub(crate) type MemberId<T> = <T as common::Trait>::MemberId;

// Alias for the content id.
pub(crate) type ContentId<T> = <T as common::Trait>::ContentId;

/// Channel id representation
pub(crate) type ChannelId<T> = <T as common::Trait>::ChannelId;

/// DAO id.
pub(crate) type DAOId<T> = <T as common::Trait>::DAOId;

/// DAO object type id.
pub(crate) type DataObjectTypeId<T> = <T as common::Trait>::DataObjectTypeId;

/// Storage provider is a worker from the working group module.
pub type StorageProviderId<T> = working_group::WorkerId<T>;
