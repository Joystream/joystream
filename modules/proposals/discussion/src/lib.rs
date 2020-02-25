//! Proposals discussion module for the Joystream platform. Version 2.
//! Contains discussion subsystem for the proposals engine.
//!
//! Supported extrinsics:
//!
//!

// Ensure we're `no_std` when compiling for Wasm.
#![cfg_attr(not(feature = "std"), no_std)]

// Do not delete! Cannot be uncommented by default, because of Parity decl_module! issue.
//#![warn(missing_docs)]

#[cfg(test)]
mod tests;

use codec::Encode;
use rstd::clone::Clone;
use rstd::prelude::*;
use rstd::vec::Vec;
use srml_support::{decl_error, decl_module, decl_storage, ensure};
use system::RawOrigin;

/// 'Proposal discussion' substrate module Trait
pub trait Trait: system::Trait  {}


// Storage for the proposals discussion module
decl_storage! {
    pub trait Store for Module<T: Trait> as ProposalDiscussion {

    }
}

decl_module! {
    /// 'Proposal discussion' substrate module
    pub struct Module<T: Trait> for enum Call where origin: T::Origin {
    }
}

impl<T: Trait> Module<T> {
	/// Create the discussion
	pub fn create_discussion(
		origin: RawOrigin<T::AccountId>,
		title: Vec<u8>,
	) {

	}
}