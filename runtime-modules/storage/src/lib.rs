// Ensure we're `no_std` when compiling for Wasm.
#![cfg_attr(not(feature = "std"), no_std)]

pub mod data_directory;
pub mod data_object_storage_registry;
pub mod data_object_type_registry;

mod tests;

pub use common::storage::StorageObjectOwner;

// Alias for the member id.
pub(crate) type MemberId<T> = <T as common::MembershipTypes>::MemberId;

// Alias for the content id.
pub(crate) type ContentId<T> = <T as common::StorageOwnership>::ContentId;

// Alias for the channel id.
pub(crate) type ChannelId<T> = <T as common::StorageOwnership>::ChannelId;

// Alias for the dao id.
pub(crate) type DaoId<T> = <T as common::StorageOwnership>::DAOId;

/// DAO object type id.
pub(crate) type DataObjectTypeId<T> = <T as common::StorageOwnership>::DataObjectTypeId;

/// Storage provider is a worker from the working group module.
pub type StorageProviderId<T> = working_group::WorkerId<T>;

/// Alias for StorageObjectOwner
pub type ObjectOwner<T> = StorageObjectOwner<MemberId<T>, ChannelId<T>, DaoId<T>>;
