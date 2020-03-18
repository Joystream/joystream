//! Proposals discussion module for the Joystream platform. Version 2.
//! Contains discussion subsystem for the proposals engine.
//!
//! Supported extrinsics:
//! - add_post - adds a post to existing discussion thread
//! - update_post - updates existing post
//!
//! Public API:
//! - create_discussion - creates a discussion
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
use srml_support::{decl_error, decl_event, decl_module, decl_storage, ensure, Parameter};

use srml_support::traits::Get;
use types::{Post, Thread, ThreadCounter};

use common::origin_validator::ActorOriginValidator;
use membership::origin_validator::MemberId;

decl_event!(
    /// Proposals engine events
    pub enum Event<T>
    where
        <T as Trait>::ThreadId,
        MemberId = MemberId<T>,
        <T as Trait>::PostId,
    {
    	/// Emits on thread creation.
        ThreadCreated(ThreadId, MemberId),

    	/// Emits on post creation.
        PostCreated(PostId, MemberId),

    	/// Emits on post update.
        PostUpdated(PostId, MemberId),
    }
);

/// 'Proposal discussion' substrate module Trait
pub trait Trait: system::Trait + membership::members::Trait {
    /// Engine event type.
    type Event: From<Event<Self>> + Into<<Self as system::Trait>::Event>;

    /// Validates thread author id and origin combination
    type ThreadAuthorOriginValidator: ActorOriginValidator<
        Self::Origin,
        MemberId<Self>,
        Self::AccountId,
    >;

    /// Validates post author id and origin combination
    type PostAuthorOriginValidator: ActorOriginValidator<
        Self::Origin,
        MemberId<Self>,
        Self::AccountId,
    >;

    /// Discussion thread Id type
    type ThreadId: From<u32> + Into<u32> + Parameter + Default + Copy;

    /// Post Id type
    type PostId: From<u32> + Parameter + Default + Copy;

    /// Defines post edition number limit.
    type MaxPostEditionNumber: Get<u32>;

    /// Defines thread title length limit.
    type ThreadTitleLengthLimit: Get<u32>;

    /// Defines post length limit.
    type PostLengthLimit: Get<u32>;

    /// Defines max thread by same author in a row number limit.
    type MaxThreadInARowNumber: Get<u32>;
}

decl_error! {
    pub enum Error {
        /// The size of the provided text for text proposal exceeded the limit
        TextProposalSizeExceeded,

        /// Author should match the post creator
        NotAuthor,

        ///  Post edition limit reached
        PostEditionNumberExceeded,

        /// Discussion cannot have an empty title
        EmptyTitleProvided,

        /// Title is too long
        TitleIsTooLong,

        /// Thread doesn't exist
        ThreadDoesntExist,

        /// Post doesn't exist
        PostDoesntExist,

        /// Post cannot be empty
        EmptyPostProvided,

        /// Post is too long
        PostIsTooLong,

        /// Max number of threads by same author in a row limit exceeded
        MaxThreadInARowLimitExceeded,

        /// Require root origin in extrinsics
        RequireRootOrigin,
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

// Storage for the proposals discussion module
decl_storage! {
    pub trait Store for Module<T: Trait> as ProposalDiscussion {
        /// Map thread identifier to corresponding thread.
        pub ThreadById get(thread_by_id): map T::ThreadId =>
            Thread<MemberId<T>, T::BlockNumber>;

        /// Count of all threads that have been created.
        pub ThreadCount get(fn thread_count): u32;

        /// Map thread id and post id to corresponding post.
        pub PostThreadIdByPostId: double_map T::ThreadId, twox_128(T::PostId) =>
             Post<MemberId<T>, T::BlockNumber, T::ThreadId>;

        /// Count of all posts that have been created.
        pub PostCount get(fn post_count): u32;

        /// Last author thread counter (part of the antispam mechanism)
        pub LastThreadAuthorCounter get(fn last_thread_author_counter):
            Option<ThreadCounter<MemberId<T>>>;
    }
}

decl_module! {
    /// 'Proposal discussion' substrate module
    pub struct Module<T: Trait> for enum Call where origin: T::Origin {
        /// Predefined errors
        type Error = Error;

        /// Emits an event. Default substrate implementation.
        fn deposit_event() = default;

        /// Adds a post with author origin check.
        pub fn add_post(
            origin,
            post_author_id: MemberId<T>,
            thread_id : T::ThreadId,
            text : Vec<u8>
        ) {
            T::PostAuthorOriginValidator::ensure_actor_origin(
                origin,
                post_author_id.clone(),
            )?;
            ensure!(<ThreadById<T>>::exists(thread_id), Error::ThreadDoesntExist);

            ensure!(!text.is_empty(),Error::EmptyPostProvided);
            ensure!(
                text.len() as u32 <= T::PostLengthLimit::get(),
                Error::PostIsTooLong
            );

            // mutation

            let next_post_count_value = Self::post_count() + 1;
            let new_post_id = next_post_count_value;

            let new_post = Post {
                text,
                created_at: Self::current_block(),
                updated_at: Self::current_block(),
                author_id: post_author_id.clone(),
                edition_number : 0,
                thread_id,
            };

            let post_id = T::PostId::from(new_post_id);
            <PostThreadIdByPostId<T>>::insert(thread_id, post_id, new_post);
            PostCount::put(next_post_count_value);
            Self::deposit_event(RawEvent::PostCreated(post_id, post_author_id));
       }

        /// Updates a post with author origin check. Update attempts number is limited.
        pub fn update_post(
            origin,
            post_author_id: MemberId<T>,
            thread_id: T::ThreadId,
            post_id : T::PostId,
            text : Vec<u8>
        ){
            T::PostAuthorOriginValidator::ensure_actor_origin(
                origin,
                post_author_id.clone(),
            )?;

            ensure!(<ThreadById<T>>::exists(thread_id), Error::ThreadDoesntExist);
            ensure!(<PostThreadIdByPostId<T>>::exists(thread_id, post_id), Error::PostDoesntExist);

            ensure!(!text.is_empty(), Error::EmptyPostProvided);
            ensure!(
                text.len() as u32 <= T::PostLengthLimit::get(),
                Error::PostIsTooLong
            );

            let post = <PostThreadIdByPostId<T>>::get(&thread_id, &post_id);

            ensure!(post.author_id == post_author_id, Error::NotAuthor);
            ensure!(post.edition_number < T::MaxPostEditionNumber::get(),
                Error::PostEditionNumberExceeded);

            let new_post = Post {
                text,
                updated_at: Self::current_block(),
                edition_number: post.edition_number + 1,
                ..post
            };

            // mutation

            <PostThreadIdByPostId<T>>::insert(thread_id, post_id, new_post);
            Self::deposit_event(RawEvent::PostUpdated(post_id, post_author_id));
       }
    }
}

impl<T: Trait> Module<T> {
    // Wrapper-function over system::block_number()
    fn current_block() -> T::BlockNumber {
        <system::Module<T>>::block_number()
    }

    /// Create the discussion thread. Cannot add more threads than 'predefined limit = MaxThreadInARowNumber'
    /// times in a row by the same author.
    pub fn create_thread(
        origin: T::Origin,
        thread_author_id: MemberId<T>,
        title: Vec<u8>,
    ) -> Result<T::ThreadId, Error> {
        T::ThreadAuthorOriginValidator::ensure_actor_origin(origin, thread_author_id.clone())?;

        ensure!(!title.is_empty(), Error::EmptyTitleProvided);
        ensure!(
            title.len() as u32 <= T::ThreadTitleLengthLimit::get(),
            Error::TitleIsTooLong
        );

        // get new 'threads in a row' counter for the author
        let current_thread_counter = Self::get_updated_thread_counter(thread_author_id.clone());

        ensure!(
            current_thread_counter.counter as u32 <= T::MaxThreadInARowNumber::get(),
            Error::MaxThreadInARowLimitExceeded
        );

        let next_thread_count_value = Self::thread_count() + 1;
        let new_thread_id = next_thread_count_value;

        let new_thread = Thread {
            title,
            created_at: Self::current_block(),
            author_id: thread_author_id.clone(),
        };

        // mutation

        let thread_id = T::ThreadId::from(new_thread_id);
        <ThreadById<T>>::insert(thread_id, new_thread);
        ThreadCount::put(next_thread_count_value);
        <LastThreadAuthorCounter<T>>::put(current_thread_counter);
        Self::deposit_event(RawEvent::ThreadCreated(thread_id, thread_author_id));

        Ok(thread_id)
    }

    // returns incremented thread counter if last thread author equals with provided parameter
    fn get_updated_thread_counter(author_id: MemberId<T>) -> ThreadCounter<MemberId<T>> {
        // if thread counter exists
        if let Some(last_thread_author_counter) = Self::last_thread_author_counter() {
            // if last(previous) author is the same as current author
            if last_thread_author_counter.author_id == author_id {
                return last_thread_author_counter.increment();
            }
        }

        // else return new counter (set with 1 thread number)
        ThreadCounter::new(author_id)
    }
}
