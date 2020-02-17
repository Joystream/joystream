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

pub use proposal_types::{ProposalType, TextProposalExecutable, RuntimeUpgradeProposalExecutable};

mod proposal_types;
#[cfg(test)]
mod tests;

use codec::Encode;
use proposal_engine::*;
use rstd::clone::Clone;
use rstd::marker::PhantomData;
use rstd::prelude::*;
use rstd::vec::Vec;
use srml_support::{decl_error, decl_module, ensure};

/// 'Proposals codex' substrate module Trait
pub trait Trait: system::Trait + proposal_engine::Trait {}

use srml_support::traits::Currency;
pub type BalanceOf<T> =
    <<T as stake::Trait>::Currency as Currency<<T as system::Trait>::AccountId>>::Balance;

//TODO: make configurable
const DEFAULT_TEXT_PROPOSAL_MAX_LEN: u32 = 20_000;
const DEFAULT_RUNTIME_PROPOSAL_WASM_MAX_LEN: u32 = 20_000;

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

decl_module! {
    /// 'Proposal codex' substrate module
    pub struct Module<T: Trait> for enum Call where origin: T::Origin {
        /// Predefined errors
        type Error = Error;

        /// Create text (signal) proposal type. On approval prints its content.
        pub fn create_text_proposal(origin, title: Vec<u8>, body: Vec<u8>, text: Vec<u8>) {
            let parameters = crate::ProposalParameters {
                voting_period: T::BlockNumber::from(50000u32),
                grace_period: T::BlockNumber::from(10000u32),
                approval_quorum_percentage: 40,
                approval_threshold_percentage: 51,
                stake: Some(<BalanceOf<T>>::from(500u32))
            };

            ensure!(!text.is_empty(), Error::TextProposalIsEmpty);
            ensure!(text.len() as u32 <= DEFAULT_TEXT_PROPOSAL_MAX_LEN,
                Error::TextProposalSizeExceeded);

            let text_proposal = TextProposalExecutable{
                title: title.clone(),
                body: body.clone(),
                text,
               };
            let proposal_code = text_proposal.encode();

            <proposal_engine::Module<T>>::create_proposal(
                origin,
                parameters,
                title,
                body,
                text_proposal.proposal_type(),
                proposal_code
            )?;
        }

        /// Create runtime upgrade proposal type. On approval prints its content.
        pub fn create_runtime_upgrade_proposal(
            origin,
            title: Vec<u8>,
            body: Vec<u8>,
            wasm: Vec<u8>
        ) {
            let parameters = crate::ProposalParameters {
                voting_period: T::BlockNumber::from(50000u32),
                grace_period: T::BlockNumber::from(10000u32),
                approval_quorum_percentage: 80,
                approval_threshold_percentage: 80,
                stake: Some(<BalanceOf<T>>::from(50000u32))
            };

            ensure!(!wasm.is_empty(), Error::RuntimeProposalIsEmpty);
            ensure!(wasm.len() as u32 <= DEFAULT_RUNTIME_PROPOSAL_WASM_MAX_LEN,
                Error::RuntimeProposalSizeExceeded);

            let proposal = RuntimeUpgradeProposalExecutable{
                title: title.clone(),
                body: body.clone(),
                wasm,
                marker : PhantomData::<T>
               };
            let proposal_code = proposal.encode();

            <proposal_engine::Module<T>>::create_proposal(
                origin,
                parameters,
                title,
                body,
                proposal.proposal_type(),
                proposal_code
            )?;
        }
    }
}
