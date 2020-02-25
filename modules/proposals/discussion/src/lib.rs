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
mod types;

use rstd::clone::Clone;
use rstd::prelude::*;
use rstd::vec::Vec;
use runtime_primitives::traits::EnsureOrigin;
use srml_support::{decl_module, decl_storage, Parameter};

use types::Thread;

//TODO: create_thread() ensures

/// 'Proposal discussion' substrate module Trait
pub trait Trait: system::Trait {
    /// Origin from which author must come.
    type AuthorOrigin: EnsureOrigin<Self::Origin, Success = Self::AccountId>;

    /// Discussion thread Id type
    type ThreadId: From<u32> + Parameter + Default + Copy;

    /// Type for the author id. Should be authenticated by account id.
    type AuthorId: From<Self::AccountId> + Parameter + Default;
}

// Storage for the proposals discussion module
decl_storage! {
    pub trait Store for Module<T: Trait> as ProposalDiscussion {
        /// Map thread identifier to corresponding thread.
        pub ThreadById get(thread_by_id): map T::ThreadId => Thread<T::AuthorId, T::BlockNumber>;

        /// Count of all threads that have been created.
        pub ThreadCount get(fn thread_count): u32;
    }
}

decl_module! {
    /// 'Proposal discussion' substrate module
    pub struct Module<T: Trait> for enum Call where origin: T::Origin {
    }
}

impl<T: Trait> Module<T> {
    // Wrapper-function over system::block_number()
    fn current_block() -> T::BlockNumber {
        <system::Module<T>>::block_number()
    }

    /// Create the discussion
    pub fn create_discussion(origin: T::Origin, title: Vec<u8>) -> Result<(), &'static str> {
        let account_id = T::AuthorOrigin::ensure_origin(origin)?;
        let author_id = T::AuthorId::from(account_id);

        let next_thread_count_value = Self::thread_count() + 1;
        let new_thread_id = next_thread_count_value;

        let new_thread = Thread {
            title,
            created_at: Self::current_block(),
            author_id,
        };

        let thread_id = T::ThreadId::from(new_thread_id);
        <ThreadById<T>>::insert(thread_id, new_thread);
        ThreadCount::put(next_thread_count_value);

        Ok(())
    }
}
