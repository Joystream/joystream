//! Proposals codex module for the Joystream platform. Version 2.
//! Contains preset proposal types
//!
//! Supported extrinsics (proposal type):
//! - create_text_proposal
//!

// Ensure we're `no_std` when compiling for Wasm.
#![cfg_attr(not(feature = "std"), no_std)]

// Do not delete! Cannot be uncommented by default, because of Parity decl_module! issue.
//#![warn(missing_docs)]

pub use proposal_types::{ProposalType, RuntimeUpgradeProposalExecutable, TextProposalExecutable};

mod proposal_types;
#[cfg(test)]
mod tests;

use codec::Encode;
use proposal_engine::*;
use rstd::clone::Clone;
use rstd::marker::PhantomData;
use rstd::prelude::*;
use rstd::vec::Vec;
use srml_support::{decl_error, decl_module, decl_storage, ensure};

/// 'Proposals codex' substrate module Trait
pub trait Trait: system::Trait + proposal_engine::Trait {
    /// Defines max allowed text proposal length.
    type TextProposalMaxLength: Get<u32>;

    /// Defines max wasm code length of the runtime upgrade proposal.
    type RuntimeUpgradeWasmProposalMaxLength: Get<u32>;

}
use srml_support::traits::{Currency, Get};

/// Balance alias
pub type BalanceOf<T> =
    <<T as stake::Trait>::Currency as Currency<<T as system::Trait>::AccountId>>::Balance;

/// Balance alias for staking
pub type NegativeImbalance<T> =
    <<T as stake::Trait>::Currency as Currency<<T as system::Trait>::AccountId>>::NegativeImbalance;

decl_error! {
    pub enum Error {
        /// The size of the provided text for text proposal exceeded the limit
        TextProposalSizeExceeded,

        /// Provided text for text proposal is empty
        TextProposalIsEmpty,

        /// The size of the provided WASM code for the runtime upgrade proposal exceeded the limit
        RuntimeProposalSizeExceeded,

        /// Provided WASM code for the runtime upgrade proposal is empty
        RuntimeProposalIsEmpty,
    }
}

// Storage for the proposals codex module
decl_storage! {
    pub trait Store for Module<T: Trait> as ProposalCodex{}
}

decl_module! {
    /// 'Proposal codex' substrate module
    pub struct Module<T: Trait> for enum Call where origin: T::Origin {
        /// Predefined errors
        type Error = Error;

        /// Create text (signal) proposal type. On approval prints its content.
        pub fn create_text_proposal(
            origin,
            title: Vec<u8>,
            description: Vec<u8>,
            text: Vec<u8>,
            stake_balance: Option<BalanceOf<T>>,
        ) {
            let parameters = proposal_types::parameters::text_proposal::<T>();

            ensure!(!text.is_empty(), Error::TextProposalIsEmpty);
            ensure!(text.len() as u32 <=  T::TextProposalMaxLength::get(),
                Error::TextProposalSizeExceeded);

            let text_proposal = TextProposalExecutable{
                title: title.clone(),
                description: description.clone(),
                text,
               };
            let proposal_code = text_proposal.encode();

            <proposal_engine::Module<T>>::create_proposal(
                origin,
                parameters,
                title,
                description,
                stake_balance,
                text_proposal.proposal_type(),
                proposal_code
            )?;
        }

        /// Create runtime upgrade proposal type. On approval prints its content.
        pub fn create_runtime_upgrade_proposal(
            origin,
            title: Vec<u8>,
            description: Vec<u8>,
            wasm: Vec<u8>,
            stake_balance: Option<BalanceOf<T>>,
        ) {
            let parameters = proposal_types::parameters::upgrade_runtime::<T>();

            ensure!(!wasm.is_empty(), Error::RuntimeProposalIsEmpty);
            ensure!(wasm.len() as u32 <= T::RuntimeUpgradeWasmProposalMaxLength::get(),
                Error::RuntimeProposalSizeExceeded);

            let proposal = RuntimeUpgradeProposalExecutable{
                title: title.clone(),
                description: description.clone(),
                wasm,
                marker : PhantomData::<T>
               };
            let proposal_code = proposal.encode();

            <proposal_engine::Module<T>>::create_proposal(
                origin,
                parameters,
                title,
                description,
                stake_balance,
                proposal.proposal_type(),
                proposal_code
            )?;
        }
    }
}
