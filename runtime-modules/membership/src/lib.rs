// Ensure we're `no_std` when compiling for Wasm.
#![cfg_attr(not(feature = "std"), no_std)]

pub mod genesis;
pub mod members;
pub mod role_types;

pub(crate) mod mock;
mod tests;
