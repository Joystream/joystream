// Ensure we're `no_std` when compiling for Wasm.
#![cfg_attr(not(feature = "std"), no_std)]

pub mod council;
pub mod election;
pub mod election_params;
pub mod proposals;

mod sealed_vote;
mod stake;

mod mock;
