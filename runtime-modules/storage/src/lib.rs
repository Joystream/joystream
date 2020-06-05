// Ensure we're `no_std` when compiling for Wasm.
#![cfg_attr(not(feature = "std"), no_std)]

pub mod data_directory;
pub mod data_object_storage_registry;
pub mod data_object_type_registry;

mod tests;

// Alias for storage working group bureaucracy
pub(crate) type StorageBureaucracy<T> = bureaucracy::Module<T, bureaucracy::Instance2>;
