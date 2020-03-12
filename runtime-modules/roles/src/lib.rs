// Ensure we're `no_std` when compiling for Wasm.
#![cfg_attr(not(feature = "std"), no_std)]

pub mod actors;
pub mod traits;

mod mock;
mod tests;
