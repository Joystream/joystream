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

mod proposal_types;
#[cfg(test)]
mod tests;

use codec::Encode;
use rstd::clone::Clone;
use rstd::prelude::*;
use rstd::str::from_utf8;
use rstd::vec::Vec;
use srml_support::{decl_error, decl_module, decl_storage, ensure, print};
use system::{ensure_root, RawOrigin};

use common::origin_validator::ActorOriginValidator;
use proposal_engine::ProposalParameters;

/// 'Proposals codex' substrate module Trait
pub trait Trait:
    system::Trait + proposal_engine::Trait + membership::members::Trait + proposal_discussion::Trait
{
    /// Defines max allowed text proposal length.
    type TextProposalMaxLength: Get<u32>;

    /// Defines max wasm code length of the runtime upgrade proposal.
    type RuntimeUpgradeWasmProposalMaxLength: Get<u32>;

    /// Validates member id and origin combination
    type MembershipOriginValidator: ActorOriginValidator<
        Self::Origin,
        MemberId<Self>,
        Self::AccountId,
    >;
}
use srml_support::traits::{Currency, Get};

/// Balance alias
pub type BalanceOf<T> =
    <<T as stake::Trait>::Currency as Currency<<T as system::Trait>::AccountId>>::Balance;

/// Balance alias for staking
pub type NegativeImbalance<T> =
    <<T as stake::Trait>::Currency as Currency<<T as system::Trait>::AccountId>>::NegativeImbalance;

type MemberId<T> = <T as membership::members::Trait>::MemberId;

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

        /// Require root origin in extrinsics
        RequireRootOrigin,

        /// Errors from the proposal engine
        ProposalsEngineError
    }
}

impl From<system::Error> for Error {
    fn from(error: system::Error) -> Self {
        match error {
            system::Error::Other(msg) => Error::Other(msg),
            system::Error::RequireRootOrigin => Error::RequireRootOrigin,
            _ => Error::Other(error.into()),
        }
    }
}

impl From<proposal_engine::Error> for Error {
    fn from(error: proposal_engine::Error) -> Self {
        match error {
            proposal_engine::Error::Other(msg) => Error::Other(msg),
            proposal_engine::Error::RequireRootOrigin => Error::RequireRootOrigin,
            _ => Error::Other(error.into()),
        }
    }
}

impl From<proposal_discussion::Error> for Error {
    fn from(error: proposal_discussion::Error) -> Self {
        match error {
            proposal_discussion::Error::Other(msg) => Error::Other(msg),
            proposal_discussion::Error::RequireRootOrigin => Error::RequireRootOrigin,
            _ => Error::Other(error.into()),
        }
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
            member_id: MemberId<T>,
            title: Vec<u8>,
            description: Vec<u8>,
            text: Vec<u8>,
            stake_balance: Option<BalanceOf<T>>,
        ) {
            let account_id = T::MembershipOriginValidator::ensure_actor_origin(origin, member_id.clone())?;

            let parameters = proposal_types::parameters::text_proposal::<T>();

            ensure!(!text.is_empty(), Error::TextProposalIsEmpty);
            ensure!(text.len() as u32 <=  T::TextProposalMaxLength::get(),
                Error::TextProposalSizeExceeded);

            <proposal_engine::Module<T>>::ensure_create_proposal_parameters_are_valid(
                &parameters,
                &title,
                &description,
                stake_balance,
            )?;

            <proposal_discussion::Module<T>>::ensure_can_create_thread(
                &title,
                member_id.clone(),
            )?;

            let proposal_code = <Call<T>>::text_proposal(title.clone(), description.clone(), text);

            let discussion_thread_id = <proposal_discussion::Module<T>>::create_thread(
                member_id,
                title.clone(),
            )?;

            let proposal_id = <proposal_engine::Module<T>>::create_proposal(
                account_id,
                member_id,
                parameters,
                title,
                description,
                stake_balance,
                proposal_code.encode(),
            )?;

             <ThreadIdByProposalId<T>>::insert(proposal_id, discussion_thread_id);
        }

        /// Create runtime upgrade proposal type. On approval prints its content.
        pub fn create_runtime_upgrade_proposal(
            origin,
            member_id: MemberId<T>,
            title: Vec<u8>,
            description: Vec<u8>,
            wasm: Vec<u8>,
            stake_balance: Option<BalanceOf<T>>,
        ) {
            let account_id = T::MembershipOriginValidator::ensure_actor_origin(origin, member_id.clone())?;

            let parameters = proposal_types::parameters::upgrade_runtime::<T>();

            ensure!(!wasm.is_empty(), Error::RuntimeProposalIsEmpty);
            ensure!(wasm.len() as u32 <= T::RuntimeUpgradeWasmProposalMaxLength::get(),
                Error::RuntimeProposalSizeExceeded);

            <proposal_engine::Module<T>>::ensure_create_proposal_parameters_are_valid(
                &parameters,
                &title,
                &description,
                stake_balance,
            )?;

            <proposal_discussion::Module<T>>::ensure_can_create_thread(
                &title,
                member_id.clone(),
            )?;

            let proposal_code = <Call<T>>::text_proposal(title.clone(), description.clone(), wasm);

            let discussion_thread_id = <proposal_discussion::Module<T>>::create_thread(
                member_id,
                title.clone(),
            )?;

            let proposal_id = <proposal_engine::Module<T>>::create_proposal(
                account_id,
                member_id,
                parameters,
                title,
                description,
                stake_balance,
                proposal_code.encode(),
            )?;

            <ThreadIdByProposalId<T>>::insert(proposal_id, discussion_thread_id);
        }

// *************** Extrinsic to execute

        /// Text proposal extrinsic. Should be used as callable object to pass to the engine module.
        fn text_proposal(
            origin,
            title: Vec<u8>,
            _description: Vec<u8>,
            _text: Vec<u8>,
        ) {
            ensure_root(origin)?;
            print("Text proposal: ");
            let title_string_result = from_utf8(title.as_slice());
            if let Ok(title_string) = title_string_result{
                print(title_string);
            }
        }

        /// Runtime upgrade proposal extrinsic.
        /// Should be used as callable object to pass to the engine module.
        fn runtime_upgrade_proposal(
            origin,
            title: Vec<u8>,
            _description: Vec<u8>,
            wasm: Vec<u8>,
        ) {
            let (cloned_origin1, cloned_origin2) =  Self::double_origin(origin);
            ensure_root(cloned_origin1)?;

            print("Runtime upgrade proposal: ");
            let title_string_result = from_utf8(title.as_slice());
            if let Ok(title_string) = title_string_result{
                print(title_string);
            }

            <system::Module<T>>::set_code(cloned_origin2, wasm)?;
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
