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
use system::RawOrigin;

/// 'Proposals codex' substrate module Trait
pub trait Trait: system::Trait + proposal_engine::Trait + proposal_discussion::Trait {
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
    pub trait Store for Module<T: Trait> as ProposalCodex{
        /// Map proposal id to its discussion thread id
        pub ThreadIdByProposalId get(fn thread_id_by_proposal_id):
            map T::ProposalId => T::ThreadId;
    }
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

            let (cloned_origin1, cloned_origin2) =  Self::double_origin(origin);

            let discussion_thread_id = <proposal_discussion::Module<T>>::create_thread(
                cloned_origin1,
                title.clone(),
            )?;

            let proposal_id = <proposal_engine::Module<T>>::create_proposal(
                cloned_origin2,
                parameters,
                title,
                description,
                stake_balance,
                text_proposal.proposal_type(),
                proposal_code,
            )?;

             <ThreadIdByProposalId<T>>::insert(proposal_id, discussion_thread_id);
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

            let (cloned_origin1, cloned_origin2) =  Self::double_origin(origin);

            let discussion_thread_id = <proposal_discussion::Module<T>>::create_thread(
                cloned_origin1,
                title.clone(),
            )?;

            let proposal_id = <proposal_engine::Module<T>>::create_proposal(
                cloned_origin2,
                parameters,
                title,
                description,
                stake_balance,
                proposal.proposal_type(),
                proposal_code,
            )?;

            <ThreadIdByProposalId<T>>::insert(proposal_id, discussion_thread_id);
        }
    }
}

impl<T: Trait> Module<T> {
    // Multiplies the T::Origin.
    // In our current substrate version system::Origin doesn't support clone(),
    // but it will be supported in latest up-to-date substrate version.
    // TODO: delete when T::Origin will support the clone()
    fn double_origin(origin: T::Origin) -> (T::Origin, T::Origin) {
        let coerced_origin = origin.into().ok().unwrap_or(RawOrigin::None);

        let (cloned_origin1, cloned_origin2) = match coerced_origin {
            RawOrigin::None => (RawOrigin::None, RawOrigin::None),
            RawOrigin::Root => (RawOrigin::Root, RawOrigin::Root),
            RawOrigin::Signed(account_id) => (
                RawOrigin::Signed(account_id.clone()),
                RawOrigin::Signed(account_id),
            ),
        };

        (cloned_origin1.into(), cloned_origin2.into())
    }
}
