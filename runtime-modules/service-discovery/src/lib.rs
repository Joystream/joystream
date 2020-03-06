// Ensure we're `no_std` when compiling for Wasm.
#![cfg_attr(not(feature = "std"), no_std)]

pub mod discovery;

mod mock;
mod tests;
