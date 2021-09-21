//! # Proposals discussion module
//! Proposals `discussion` module for the Joystream platform.
//! It contains discussion subsystem of the proposals.
//!
//! ## Overview
//!
//! The proposals discussion module is used by the codex module to provide a platform for
//! discussions about different proposals. It allows to create discussion threads and then add and
//! update related posts.
//!
//! ## Supported extrinsics
//! - [add_post](./struct.Module.html#method.add_post) - adds a post to an existing discussion thread
//! - [update_post](./struct.Module.html#method.update_post) - updates existing post
//! - [change_thread_mode](./struct.Module.html#method.change_thread_mode) - changes thread
//! - [delete_post](./struct.Module.html#method.delete_post) - Removes thread from storage
//! permission mode
//!
//! ## Public API methods
//! - [create_thread](./struct.Module.html#method.create_thread) - creates a discussion thread
//! - [ensure_can_create_thread](./struct.Module.html#method.ensure_can_create_thread) - ensures
//! safe thread creation
//!
//! ## Usage
//!
//! ```
//! use frame_support::decl_module;
//! use frame_system::ensure_root;
//! use pallet_proposals_discussion::{self as discussions, ThreadMode};
//!
//! pub trait Trait: discussions::Trait + common::membership::Trait {}
//!
//! decl_module! {
//!     pub struct Module<T: Trait> for enum Call where origin: T::Origin {
//!         #[weight = 10_000_000]
//!         pub fn create_discussion(origin, title: Vec<u8>, author_id : T::MemberId) {
//!             ensure_root(origin)?;
//!             let thread_mode = ThreadMode::Open;
//!             <discussions::Module<T>>::ensure_can_create_thread(&thread_mode)?;
//!             <discussions::Module<T>>::create_thread(author_id, thread_mode)?;
//!         }
//!     }
//! }
//! # fn main() {}
//! ```

// Ensure we're `no_std` when compiling for Wasm.
#![cfg_attr(not(feature = "std"), no_std)]

// Do not delete! Cannot be uncommented by default, because of Parity decl_module! issue.
//#![warn(missing_docs)]

mod benchmarking;
#[cfg(test)]
mod tests;
mod types;

use frame_support::dispatch::{DispatchError, DispatchResult};
use frame_support::sp_runtime::ModuleId;
use frame_support::sp_runtime::SaturatedConversion;
use frame_support::traits::Get;
use frame_support::traits::{Currency, ExistenceRequirement};
use frame_support::{
    decl_error, decl_event, decl_module, decl_storage, ensure, weights::Weight, Parameter,
};
use sp_runtime::traits::{AccountIdConversion, Saturating};
use sp_std::clone::Clone;
use sp_std::vec::Vec;

use common::council::CouncilOriginValidator;
use common::membership::MemberOriginValidator;
use common::MemberId;
use types::{DiscussionPost, DiscussionThread};

pub use types::ThreadMode;

/// Balance alias for `balances` module.
pub type BalanceOf<T> = <T as balances::Trait>::Balance;

type Balances<T> = balances::Module<T>;

/// Proposals discussion WeightInfo.
/// Note: This was auto generated through the benchmark CLI using the `--weight-trait` flag
pub trait WeightInfo {
    fn add_post(j: u32) -> Weight;
    fn update_post(j: u32) -> Weight;
    fn delete_post() -> Weight;
    fn change_thread_mode(i: u32) -> Weight;
}

type WeightInfoDiscussion<T> = <T as Trait>::WeightInfo;

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
        PostCreated(PostId, MemberId, ThreadId, Vec<u8>, bool),

        /// Emits on post update.
        PostUpdated(PostId, MemberId, ThreadId, Vec<u8>),

        /// Emits on thread mode change.
        ThreadModeChanged(ThreadId, ThreadMode<MemberId>, MemberId),

        /// Emits on post deleted
        PostDeleted(MemberId, ThreadId, PostId, bool),
    }
);

/// Defines whether the member is an active councilor.
pub trait CouncilMembership<AccountId, MemberId> {
    /// Defines whether the member is an active councilor.
    fn is_council_member(account_id: &AccountId, member_id: &MemberId) -> bool;
}

/// 'Proposal discussion' substrate module Trait
pub trait Trait: frame_system::Trait + balances::Trait + common::membership::Trait {
    /// Discussion event type.
    type Event: From<Event<Self>> + Into<<Self as frame_system::Trait>::Event>;

    /// Validates post author id and origin combination
    type AuthorOriginValidator: MemberOriginValidator<Self::Origin, MemberId<Self>, Self::AccountId>;

    /// Defines whether the member is an active councilor.
    type CouncilOriginValidator: CouncilOriginValidator<
        Self::Origin,
        MemberId<Self>,
        Self::AccountId,
    >;

    /// Discussion thread Id type
    type ThreadId: From<u64> + Into<u64> + Parameter + Default + Copy;

    /// Post Id type
    type PostId: From<u64> + Parameter + Default + Copy;

    /// Defines author list size limit for the Closed discussion.
    type MaxWhiteListSize: Get<u32>;

    /// Weight information for extrinsics in this pallet.
    type WeightInfo: WeightInfo;

    /// Fee for creating a post
    type PostDeposit: Get<Self::Balance>;

    /// The proposal_discussion module Id, used to derive the account Id to hold the thread bounty
    type ModuleId: Get<ModuleId>;

    /// Maximum number of blocks before a post can be erased by anyone
    type PostLifeTime: Get<Self::BlockNumber>;
}

decl_error! {
    /// Discussion module predefined errors
    pub enum Error for Module<T: Trait> {
        /// Thread doesn't exist
        ThreadDoesntExist,

        /// Post doesn't exist
        PostDoesntExist,

        /// Require root origin in extrinsics
        RequireRootOrigin,

        /// The thread has Closed mode. And post author doesn't belong to council or allowed members.
        CannotPostOnClosedThread,

        /// Should be thread author or councilor.
        NotAuthorOrCouncilor,

        /// Max allowed authors list limit exceeded.
        MaxWhiteListSizeExceeded,

        /// Account has insufficient balance to create a post
        InsufficientBalanceForPost,

        /// Account can't delete post at the moment
        CannotDeletePost,
    }
}

// Storage for the proposals discussion module
decl_storage! {
    pub trait Store for Module<T: Trait> as ProposalDiscussion {
        /// Map thread identifier to corresponding thread.
        pub ThreadById get(fn thread_by_id): map hasher(blake2_128_concat)
            T::ThreadId => DiscussionThread<MemberId<T>, T::BlockNumber, MemberId<T>>;

        /// Count of all threads that have been created.
        pub ThreadCount get(fn thread_count): u64;

        /// Map thread id and post id to corresponding post.
        pub PostThreadIdByPostId:
            double_map hasher(blake2_128_concat) T::ThreadId, hasher(blake2_128_concat) T::PostId =>
                DiscussionPost<MemberId<T>, BalanceOf<T>, T::BlockNumber>;

        /// Count of all posts that have been created.
        pub PostCount get(fn post_count): u64;
    }
}

decl_module! {
    /// 'Proposal discussion' substrate module
    pub struct Module<T: Trait> for enum Call where origin: T::Origin {
        /// Predefined errors
        type Error = Error<T>;

        /// Emits an event. Default substrate implementation.
        fn deposit_event() = default;

        /// Adds a post with author origin check.
        ///
        /// <weight>
        ///
        /// ## Weight
        /// `O (L)` where:
        /// - `L` is the length of `text`
        /// - DB:
        ///    - O(1) doesn't depend on the state or parameters
        /// # </weight>
        #[weight = WeightInfoDiscussion::<T>::add_post(text.len().saturated_into())]
        pub fn add_post(
            origin,
            post_author_id: MemberId<T>,
            thread_id: T::ThreadId,
            text: Vec<u8>,
            editable: bool
        ) {
            let account_id = T::AuthorOriginValidator::ensure_member_controller_account_origin(
                origin.clone(),
                post_author_id,
            )?;

            ensure!(<ThreadById<T>>::contains_key(thread_id), Error::<T>::ThreadDoesntExist);

            Self::ensure_thread_mode(origin, post_author_id, thread_id)?;

            // Ensure account has enough funds
            if editable {
                ensure!(
                    Balances::<T>::usable_balance(&account_id) >= T::PostDeposit::get(),
                    Error::<T>::InsufficientBalanceForPost,
                );
            }

            // mutation

            if editable {
                Self::transfer_to_state_cleanup_treasury_account(
                    T::PostDeposit::get(),
                    thread_id,
                    &account_id,
                )?;
            }

            let next_post_count_value = Self::post_count() + 1;
            let new_post_id = next_post_count_value;
            let post_id = T::PostId::from(new_post_id);

            if editable {
                let new_post = DiscussionPost {
                    author_id: post_author_id,
                    cleanup_pay_off: T::PostDeposit::get(),
                    last_edited: frame_system::Module::<T>::block_number(),
                };

                <PostThreadIdByPostId<T>>::insert(thread_id, post_id, new_post);
            }

            PostCount::put(next_post_count_value);
            Self::deposit_event(RawEvent::PostCreated(post_id, post_author_id, thread_id, text, editable));
       }

        /// Remove post from storage, with the last parameter indicating whether to also hide it
        /// in the UI.
        ///
        /// <weight>
        ///
        /// ## Weight
        /// `O (1)`
        /// - DB:
        ///    - O(1) doesn't depend on the state or parameters
        /// # </weight>
        #[weight = WeightInfoDiscussion::<T>::delete_post()]
        pub fn delete_post(
            origin,
            deleter_id: MemberId<T>,
            post_id : T::PostId,
            thread_id: T::ThreadId,
            hide: bool,
        ) {
            let account_id = T::AuthorOriginValidator::ensure_member_controller_account_origin(
                origin.clone(),
                deleter_id,
            )?;

            ensure!(
                <PostThreadIdByPostId<T>>::contains_key(thread_id, post_id),
                Error::<T>::PostDoesntExist
            );

            T::AuthorOriginValidator::ensure_member_controller_account_origin(
                origin,
                deleter_id,
            )?;

            let post = <PostThreadIdByPostId<T>>::get(thread_id, post_id);
            if !Self::anyone_can_delete_post(thread_id, post_id) {
                ensure!(
                    post.author_id == deleter_id,
                    Error::<T>::CannotDeletePost
                );
            }

            // mutation

            Self::pay_off(
                thread_id,
                T::PostDeposit::get(),
                &account_id,
            )?;

            <PostThreadIdByPostId<T>>::remove(thread_id, post_id);
            Self::deposit_event(RawEvent::PostDeleted(deleter_id, thread_id, post_id, hide));
        }

        /// Updates a post with author origin check. Update attempts number is limited.
        ///
        /// <weight>
        ///
        /// ## Weight
        /// `O (L)` where:
        /// - `L` is the length of `text`
        /// - DB:
        ///    - O(1) doesn't depend on the state or parameters
        /// # </weight>
        #[weight = WeightInfoDiscussion::<T>::update_post(text.len().saturated_into())]
        pub fn update_post(
            origin,
            thread_id: T::ThreadId,
            post_id : T::PostId,
            text : Vec<u8>
        ){
            ensure!(<ThreadById<T>>::contains_key(thread_id), Error::<T>::ThreadDoesntExist);
            ensure!(
                <PostThreadIdByPostId<T>>::contains_key(thread_id, post_id),
                Error::<T>::PostDoesntExist
            );

            let post_author_id = <PostThreadIdByPostId<T>>::get(&thread_id, &post_id).author_id;

            T::AuthorOriginValidator::ensure_member_controller_account_origin(
                origin,
                post_author_id,
            )?;

            // mutation

            <PostThreadIdByPostId<T>>::mutate(
                thread_id,
                post_id,
                |new_post| new_post.last_edited = frame_system::Module::<T>::block_number()
            );
            Self::deposit_event(RawEvent::PostUpdated(post_id, post_author_id, thread_id, text));
       }

        /// Changes thread permission mode.
        ///
        /// <weight>
        ///
        /// ## Weight
        /// `O (W)` if ThreadMode is close or O(1) otherwise where:
        /// - `W` is the number of whitelisted members in `mode`
        /// - DB:
        ///    - O(1) doesn't depend on the state or parameters
        /// # </weight>
        #[weight = WeightInfoDiscussion::<T>::change_thread_mode(
            if let ThreadMode::Closed(ref list) = mode {
                list.len().saturated_into()
            } else {
                0
            }
        )]
        pub fn change_thread_mode(
            origin,
            member_id: MemberId<T>,
            thread_id : T::ThreadId,
            mode : ThreadMode<MemberId<T>>
        ) {
            T::AuthorOriginValidator::ensure_member_controller_account_origin(origin.clone(), member_id)?;

            ensure!(<ThreadById<T>>::contains_key(thread_id), Error::<T>::ThreadDoesntExist);

            if let ThreadMode::Closed(ref list) = mode{
                ensure!(
                    list.len() <= (T::MaxWhiteListSize::get()).saturated_into(),
                    Error::<T>::MaxWhiteListSizeExceeded
                );
            }

            let thread = Self::thread_by_id(&thread_id);

            let is_councilor =
                    T::CouncilOriginValidator::ensure_member_consulate(origin, member_id)
                        .is_ok();
            let is_thread_author = thread.author_id == member_id;

            ensure!(is_thread_author || is_councilor, Error::<T>::NotAuthorOrCouncilor);

            // mutation

            <ThreadById<T>>::mutate(thread_id, |thread| {
                thread.mode = mode.clone();
            });

            Self::deposit_event(RawEvent::ThreadModeChanged(thread_id, mode, member_id));
       }
    }
}

impl<T: Trait> Module<T> {
    /// Create the discussion thread.
    /// times in a row by the same author.
    pub fn create_thread(
        thread_author_id: MemberId<T>,
        mode: ThreadMode<MemberId<T>>,
    ) -> Result<T::ThreadId, DispatchError> {
        Self::ensure_can_create_thread(&mode)?;

        let next_thread_count_value = Self::thread_count() + 1;
        let new_thread_id = next_thread_count_value;

        let new_thread = DiscussionThread {
            activated_at: Self::current_block(),
            author_id: thread_author_id,
            mode,
        };

        // mutation

        let thread_id = T::ThreadId::from(new_thread_id);
        <ThreadById<T>>::insert(thread_id, new_thread);
        ThreadCount::put(next_thread_count_value);
        Self::deposit_event(RawEvent::ThreadCreated(thread_id, thread_author_id));

        Ok(thread_id)
    }

    /// Ensures thread can be created.
    /// Checks:
    /// - max allowed authors for the Closed thread mode
    pub fn ensure_can_create_thread(mode: &ThreadMode<MemberId<T>>) -> DispatchResult {
        if let ThreadMode::Closed(list) = mode {
            ensure!(
                list.len() <= (T::MaxWhiteListSize::get()).saturated_into(),
                Error::<T>::MaxWhiteListSizeExceeded
            );
        }

        Ok(())
    }
}

impl<T: Trait> Module<T> {
    // Wrapper-function over System::block_number()
    fn current_block() -> T::BlockNumber {
        <frame_system::Module<T>>::block_number()
    }

    fn anyone_can_delete_post(thread_id: T::ThreadId, post_id: T::PostId) -> bool {
        let thread_exists = <ThreadById<T>>::contains_key(thread_id);
        let post = <PostThreadIdByPostId<T>>::get(thread_id, post_id);
        !thread_exists
            && frame_system::Module::<T>::block_number().saturating_sub(post.last_edited)
                >= T::PostLifeTime::get()
    }

    fn pay_off(
        thread_id: T::ThreadId,
        amount: BalanceOf<T>,
        account_id: &T::AccountId,
    ) -> DispatchResult {
        let state_cleanup_treasury_account = T::ModuleId::get().into_sub_account(thread_id);
        <Balances<T> as Currency<T::AccountId>>::transfer(
            &state_cleanup_treasury_account,
            account_id,
            amount,
            ExistenceRequirement::AllowDeath,
        )
    }

    fn transfer_to_state_cleanup_treasury_account(
        amount: BalanceOf<T>,
        thread_id: T::ThreadId,
        account_id: &T::AccountId,
    ) -> DispatchResult {
        let state_cleanup_treasury_account = T::ModuleId::get().into_sub_account(thread_id);
        <Balances<T> as Currency<T::AccountId>>::transfer(
            account_id,
            &state_cleanup_treasury_account,
            amount,
            ExistenceRequirement::AllowDeath,
        )
    }

    fn ensure_thread_mode(
        origin: T::Origin,
        thread_author_id: MemberId<T>,
        thread_id: T::ThreadId,
    ) -> DispatchResult {
        let thread = Self::thread_by_id(thread_id);

        match thread.mode {
            ThreadMode::Open => Ok(()),
            ThreadMode::Closed(members) => {
                let is_thread_author = thread_author_id == thread.author_id;
                let is_councilor =
                    T::CouncilOriginValidator::ensure_member_consulate(origin, thread_author_id)
                        .is_ok();
                let is_allowed_member = members
                    .iter()
                    .any(|member_id| *member_id == thread_author_id);

                if is_thread_author || is_councilor || is_allowed_member {
                    Ok(())
                } else {
                    Err(Error::<T>::CannotPostOnClosedThread.into())
                }
            }
        }
    }
}
