// Ensure we're `no_std` when compiling for Wasm.
#![cfg_attr(not(feature = "std"), no_std)]

pub mod data_directory;
pub mod data_object_storage_registry;
pub mod data_object_type_registry;

mod tests;

pub use common::MemberId;

/// Storage provider is a worker from the working group module.
pub type StorageProviderId<T> = working_group::WorkerId<T>;
