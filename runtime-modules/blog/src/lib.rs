//! # Blog Module
//!
//!
//! The Blog module provides functionality for handling blogs
//!
//! - [`timestamp::Config`](./trait.Config.html)
//! - [`Call`](./enum.Call.html)
//! - [`Module`](./struct.Module.html)
//!
//! ## Overview
//!
//! The blog module provides functions for:
//!
//! - Creation and editing of posts, associated with given blog
//! - Posts locking/unlocking
//! - Creation and editing of replies, associated with given post
//!
//! ### Terminology
//!
//! - **Lock:** A forbiddance of mutation of any associated information related to a given post.
//!
//! ## Interface
//! The posts creation/edition/locking/unlocking are done through proposals
//! To reply to posts you need to be a member
//!
//! ## Supported extrinsics
//!
//! - [create_post](./struct.Module.html#method.create_post)
//! - [lock_post](./struct.Module.html#method.lock_post)
//! - [unlock_post](./struct.Module.html#method.unlock_post)
//! - [edit_post](./struct.Module.html#method.edit_post)
//! - [create_reply](./struct.Module.html#method.create_reply)
//! - [edit_reply](./struct.Module.html#method.edit_reply)
//! - [delete_replies](./struct.Module.html#method.delete_replies)

#![cfg_attr(not(feature = "std"), no_std)]
#![allow(clippy::unused_unit)]

use codec::{Codec, Decode, Encode};
use common::membership::MemberOriginValidator;
use errors::Error;
pub use frame_support::dispatch::{DispatchError, DispatchResult};
use frame_support::traits::{Currency, ExistenceRequirement};
use frame_support::weights::Weight;
use frame_support::{
    decl_event, decl_module, decl_storage, ensure, traits::Get, Parameter, StorageDoubleMap,
};
use sp_arithmetic::traits::{BaseArithmetic, One};
use sp_runtime::SaturatedConversion;
use sp_runtime::{
    traits::{AccountIdConversion, Hash, MaybeSerialize, Member, Saturating},
    ModuleId,
};
use sp_std::collections::btree_map::BTreeMap;
use sp_std::prelude::*;

mod benchmarking;
mod errors;
mod mock;
mod tests;

// Type for maximum number of posts/replies
type MaxNumber = u64;

/// Type for post IDs
pub type PostId = u64;

/// Blogger participant ID alias for the member of the system.
pub type ParticipantId<T> = common::MemberId<T>;

/// Balance alias for `balances` module.
pub type BalanceOf<T> = <T as balances::Config>::Balance;

type Balances<T> = balances::Module<T>;

/// blog WeightInfo.
/// Note: This was auto generated through the benchmark CLI using the `--weight-trait` flag
pub trait WeightInfo {
    fn create_post(t: u32, b: u32) -> Weight;
    fn lock_post() -> Weight;
    fn unlock_post() -> Weight;
    fn edit_post(t: u32, b: u32) -> Weight;
    fn create_reply_to_post(t: u32) -> Weight;
    fn create_reply_to_reply(t: u32) -> Weight;
    fn edit_reply(t: u32) -> Weight;
    fn delete_replies(i: u32) -> Weight;
}

type BlogWeightInfo<T, I> = <T as Config<I>>::WeightInfo;

// The pallet's configuration trait.
pub trait Config<I: Instance = DefaultInstance>:
    frame_system::Config + common::membership::Config + balances::Config
{
    /// Origin from which participant must come.
    type ParticipantEnsureOrigin: MemberOriginValidator<
        Self::Origin,
        ParticipantId<Self>,
        Self::AccountId,
    >;

    /// The overarching event type.
    type Event: From<Event<Self, I>> + Into<<Self as frame_system::Config>::Event>;

    /// The maximum number of posts in a blog.
    type PostsMaxNumber: Get<MaxNumber>;

    /// Type of identifier for replies.
    type ReplyId: Parameter
        + Member
        + BaseArithmetic
        + Codec
        + Default
        + Copy
        + MaybeSerialize
        + PartialEq
        + From<u64>
        + Into<u64>;

    /// Weight information for extrinsics in this pallet.
    type WeightInfo: WeightInfo;

    /// Deposit needed to create a reply
    type ReplyDeposit: Get<Self::Balance>;

    /// The forum module Id, used to derive the account Id to hold the thread bounty
    type ModuleId: Get<ModuleId>;

    /// Time a reply can live until it can be deleted by anyone
    type ReplyLifetime: Get<Self::BlockNumber>;
}

/// Type, representing blog related post structure
#[derive(Encode, Decode, Clone)]
pub struct Post<T: Config<I>, I: Instance> {
    /// Locking status
    locked: bool,
    title_hash: T::Hash,
    body_hash: T::Hash,
    /// Overall replies counter, associated with post
    replies_count: T::ReplyId,
}

// Note: we derive it by hand because the derive isn't working because of a Rust problem
// where the generic parameters need to comply with the bounds instead of the associated traits
// see: https://github.com/rust-lang/rust/issues/26925
impl<T: Config<I>, I: Instance> sp_std::fmt::Debug for Post<T, I> {
    fn fmt(&self, f: &mut sp_std::fmt::Formatter<'_>) -> sp_std::fmt::Result {
        f.debug_struct("Post")
            .field("locked", &self.locked)
            .field("title_hash", &self.title_hash)
            .field("body_hash", &self.body_hash)
            .field("replies_count", &self.replies_count)
            .finish()
    }
}

// Note: we derive it by hand because the derive isn't working because of a Rust problem
// where the generic parameters need to comply with the bounds instead of the associated traits
// see: https://github.com/rust-lang/rust/issues/26925
impl<T: Config<I>, I: Instance> PartialEq for Post<T, I> {
    fn eq(&self, other: &Post<T, I>) -> bool {
        self.locked == other.locked
            && self.title_hash == other.title_hash
            && self.body_hash == other.body_hash
            && self.replies_count == other.replies_count
    }
}

/// Default Post
// Note: we derive it by hand because the derive isn't working because of a Rust problem
// where the generic parameters need to comply with the bounds instead of the associated traits
// see: https://github.com/rust-lang/rust/issues/26925
impl<T: Config<I>, I: Instance> Default for Post<T, I> {
    fn default() -> Self {
        Post {
            locked: Default::default(),
            title_hash: Default::default(),
            body_hash: Default::default(),
            replies_count: Default::default(),
        }
    }
}

impl<T: Config<I>, I: Instance> Post<T, I> {
    /// Create a new post with given title and body
    pub fn new(title: &[u8], body: &[u8]) -> Self {
        Self {
            // Post default locking status
            locked: false,
            title_hash: T::Hashing::hash(title),
            body_hash: T::Hashing::hash(body),
            // Set replies count of newly created post to zero
            replies_count: T::ReplyId::default(),
        }
    }

    /// Make all data, associated with this post immutable
    fn lock(&mut self) {
        self.locked = true;
    }

    /// Inverse to lock
    fn unlock(&mut self) {
        self.locked = false;
    }

    /// Get current locking status
    pub fn is_locked(&self) -> bool {
        self.locked
    }

    /// Get overall replies count, associated with this post
    fn replies_count(&self) -> T::ReplyId {
        self.replies_count
    }

    /// Increase replies counter, associated with given post by 1
    fn increment_replies_counter(&mut self) {
        self.replies_count += T::ReplyId::one()
    }

    /// Update post title and body, if Option::Some(_)
    fn update(&mut self, new_title: &Option<Vec<u8>>, new_body: &Option<Vec<u8>>) {
        if let Some(ref new_title) = new_title {
            self.title_hash = T::Hashing::hash(new_title)
        }
        if let Some(ref new_body) = new_body {
            self.body_hash = T::Hashing::hash(new_body)
        }
    }
}

/// Enum variant, representing either reply or post id
#[derive(Encode, Decode, Clone, PartialEq, Debug)]
pub enum ParentId<ReplyId, PostId: Default> {
    Reply(ReplyId),
    Post(PostId),
}

/// Default parent representation
impl<ReplyId, PostId: Default> Default for ParentId<ReplyId, PostId> {
    fn default() -> Self {
        ParentId::Post(PostId::default())
    }
}

/// Type, representing either root post reply or direct reply to reply
#[derive(Encode, Decode, Clone)]
pub struct Reply<T: Config<I>, I: Instance> {
    /// Reply text hash
    text_hash: T::Hash,
    /// Participant id, associated with a reply owner
    owner: ParticipantId<T>,
    /// Reply`s parent id
    parent_id: ParentId<T::ReplyId, PostId>,
    /// Pay off by deleting post
    cleanup_pay_off: T::Balance,
    /// Last time reply was edited
    last_edited: T::BlockNumber,
}

// Note: we derive it by hand because the derive isn't working because of a Rust problem
// where the generic parameters need to comply with the bounds instead of the associated traits
// see: https://github.com/rust-lang/rust/issues/26925
impl<T: Config<I>, I: Instance> sp_std::fmt::Debug for Reply<T, I> {
    fn fmt(&self, f: &mut sp_std::fmt::Formatter<'_>) -> sp_std::fmt::Result {
        f.debug_struct("Reply")
            .field("text_hash", &self.text_hash)
            .field("owner", &self.owner)
            .field("parent_id", &self.parent_id)
            .field("cleanup_pay_off", &self.cleanup_pay_off)
            .field("last_edited", &self.last_edited)
            .finish()
    }
}

/// Reply comparator
// Note: we derive it by hand because the derive isn't working because of a Rust problem
// where the generic parameters need to comply with the bounds instead of the associated traits
// see: https://github.com/rust-lang/rust/issues/26925
impl<T: Config<I>, I: Instance> PartialEq for Reply<T, I> {
    fn eq(&self, other: &Reply<T, I>) -> bool {
        self.text_hash == other.text_hash
            && self.owner == other.owner
            && self.parent_id == other.parent_id
            && self.cleanup_pay_off == other.cleanup_pay_off
            && self.last_edited == other.last_edited
    }
}

/// Default Reply
// Note: we derive it by hand because the derive isn't working because of a Rust problem
// where the generic parameters need to comply with the bounds instead of the associated traits
// see: https://github.com/rust-lang/rust/issues/26925
impl<T: Config<I>, I: Instance> Default for Reply<T, I> {
    fn default() -> Self {
        Reply {
            text_hash: Default::default(),
            owner: Default::default(),
            parent_id: Default::default(),
            cleanup_pay_off: Default::default(),
            last_edited: Default::default(),
        }
    }
}

impl<T: Config<I>, I: Instance> Reply<T, I> {
    /// Create new reply with given text and owner id
    fn new(
        text: Vec<u8>,
        owner: ParticipantId<T>,
        parent_id: ParentId<T::ReplyId, PostId>,
        cleanup_pay_off: T::Balance,
    ) -> Self {
        Self {
            text_hash: T::Hashing::hash(&text),
            owner,
            parent_id,
            cleanup_pay_off,
            last_edited: frame_system::Module::<T>::block_number(),
        }
    }

    /// Check if account_id is reply owner
    fn is_owner(&self, account_id: &ParticipantId<T>) -> bool {
        self.owner == *account_id
    }

    /// Update reply`s text
    fn update(&mut self, new_text: Vec<u8>) {
        self.text_hash = T::Hashing::hash(&new_text);
        self.last_edited = frame_system::Module::<T>::block_number()
    }
}

/// Represents a single reply that will be deleted by `delete_replies`
#[derive(Encode, Decode, Clone, Debug, Default, PartialEq)]
pub struct ReplyToDelete<ReplyId> {
    /// Id of the post corresponding to the reply that will be deleted
    post_id: PostId,
    /// Id of the reply to be deleted
    reply_id: ReplyId,
    /// Whether to hide the reply or just remove it from the storage
    hide: bool,
}

// Blog`s pallet storage items.
decl_storage! {
    trait Store for Module<T: Config<I>, I: Instance=DefaultInstance> as BlogModule {

        /// Maps, representing id => item relationship for blogs, posts and replies related structures

        /// Post count
        PostCount get(fn post_count): PostId;

        /// Post by unique blog and post identificators
        PostById get(fn post_by_id): map hasher(blake2_128_concat) PostId => Post<T, I>;

        /// Reply by unique blog, post and reply identificators
        ReplyById get (fn reply_by_id): double_map hasher(blake2_128_concat) PostId, hasher(blake2_128_concat) T::ReplyId => Reply<T, I>;

    }
}

// Blog`s pallet dispatchable functions.
decl_module! {
    pub struct Module<T: Config<I>, I: Instance=DefaultInstance> for enum Call where origin: T::Origin {

        /// Setup events
        fn deposit_event() = default;

        /// Predefined errors
        type Error = Error<T, I>;

        /// Blog owner can create posts, related to a given blog, if related blog is unlocked
        ///
        /// <weight>
        ///
        /// ## Weight
        /// `O (T + B)` where:
        /// - `T` is the length of the title
        /// - `B` is the length of the body
        /// - DB:
        ///    - O(1) doesn't depend on the state or parameters
        /// # </weight>
        #[weight = BlogWeightInfo::<T, I>::create_post(
                title.len().saturated_into(),
                body.len().saturated_into()
        )]
        pub fn create_post(origin, title: Vec<u8>, body: Vec<u8>) -> DispatchResult  {

            // Ensure blog -> owner relation exists
            Self::ensure_blog_ownership(origin)?;

            // Check security/configuration constraints

            let posts_count = Self::ensure_posts_limit_not_reached()?;

            //
            // == MUTATION SAFE ==
            //

            let post_count = <PostCount<I>>::get();
            <PostCount<I>>::put(post_count + 1);

            // New post creation
            let post = Post::new(&title, &body);
            <PostById<T, I>>::insert(posts_count, post);

            // Trigger event
            Self::deposit_event(RawEvent::PostCreated(posts_count, title, body));
            Ok(())
        }

        /// Blog owner can lock posts, related to a given blog,
        /// making post immutable to any actions (replies creation, post editing, etc.)
        ///
        /// <weight>
        ///
        /// ## Weight
        /// `O (1)` doesn't depends on the state or parameters
        /// - DB:
        ///    - O(1) doesn't depend on the state or parameters
        /// # </weight>
        #[weight = BlogWeightInfo::<T, I>::lock_post()]
        pub fn lock_post(origin, post_id: PostId) -> DispatchResult {

            // Ensure blog -> owner relation exists
            Self::ensure_blog_ownership(origin)?;

            // Ensure post with given id exists
            Self::ensure_post_exists(post_id)?;

            //
            // == MUTATION SAFE ==
            //

            // Update post lock status, associated with given id
            <PostById<T, I>>::mutate(post_id, |inner_post| inner_post.lock());

            // Trigger event
            Self::deposit_event(RawEvent::PostLocked(post_id));
            Ok(())
        }

        /// Blog owner can unlock posts, related to a given blog,
        /// making post accesible to previously forbidden actions
        ///
        /// <weight>
        ///
        /// ## Weight
        /// `O (1)` doesn't depends on the state or parameters
        /// - DB:
        ///    - O(1) doesn't depend on the state or parameters
        /// # </weight>
        #[weight = BlogWeightInfo::<T, I>::unlock_post()]
        pub fn unlock_post(origin, post_id: PostId) -> DispatchResult {

            // Ensure blog -> owner relation exists
            Self::ensure_blog_ownership(origin)?;

            // Ensure post with given id exists
            Self::ensure_post_exists(post_id)?;

            //
            // == MUTATION SAFE ==
            //

            // Update post lock status, associated with given id
            <PostById<T, I>>::mutate(post_id, |inner_post| inner_post.unlock());

            // Trigger event
            Self::deposit_event(RawEvent::PostUnlocked(post_id));
            Ok(())
        }

        /// Blog owner can edit post, related to a given blog (if unlocked)
        /// with a new title and/or body
        /// <weight>
        ///
        /// ## Weight
        /// `O (T + B)` where:
        /// - `T` is the length of the `new_title`
        /// - `B` is the length of the `new_body`
        /// - DB:
        ///    - O(1) doesn't depend on the state or parameters
        /// # </weight>
        #[weight = Module::<T, I>::edit_post_weight(&new_title, &new_body)]
        pub fn edit_post(
            origin,
            post_id: PostId,
            new_title: Option<Vec<u8>>,
            new_body: Option<Vec<u8>>
        ) -> DispatchResult {
            // Ensure blog -> owner relation exists
            Self::ensure_blog_ownership(origin)?;

            // Ensure post with given id exists
            let post = Self::ensure_post_exists(post_id)?;

            // Ensure post unlocked, so mutations can be performed
            Self::ensure_post_unlocked(&post)?;

            // == MUTATION SAFE ==
            //

            // Update post with new text
            <PostById<T, I>>::mutate(
                post_id,
                |inner_post| inner_post.update(&new_title, &new_body)
            );

            // Trigger event
            Self::deposit_event(RawEvent::PostEdited(post_id, new_title, new_body));
            Ok(())
        }

        /// Create either root post reply or direct reply to reply
        /// (Only accessible, if related blog and post are unlocked)
        /// <weight>
        ///
        /// ## Weight
        /// `O (T)` where:
        /// - `T` is the length of the `text`
        /// - DB:
        ///    - O(1) doesn't depend on the state or parameters
        /// # </weight>
        #[weight = Module::<T, I>::create_reply_weight(text.len())]
        pub fn create_reply(
            origin,
            participant_id: ParticipantId<T>,
            post_id: PostId,
            reply_id: Option<T::ReplyId>,
            text: Vec<u8>,
            editable: bool,
        ) -> DispatchResult {
            let account_id = Self::ensure_valid_participant(origin, participant_id)?;

            // Ensure post with given id exists
            let post = Self::ensure_post_exists(post_id)?;

            // Ensure post unlocked, so mutations can be performed
            Self::ensure_post_unlocked(&post)?;

            if let Some(reply_id) = reply_id {
                // Check parent existed at some point in time(whether it is in storage or not)
                ensure!(reply_id < post.replies_count(), Error::<T, I>::ReplyNotFound);
            }

            if editable {
                ensure!(
                    Balances::<T>::usable_balance(&account_id) >= T::ReplyDeposit::get(),
                    Error::<T, I>::InsufficientBalanceForReply
                );
            }

            //
            // == MUTATION SAFE ==
            //

            if editable {
                Self::transfer_to_state_cleanup_treasury_account(
                    T::ReplyDeposit::get(),
                    post_id,
                    &account_id
                )?;
            }

            // Update runtime storage with new reply
            let post_replies_count = post.replies_count();

            // Increment replies counter, associated with given post
            <PostById<T, I>>::mutate(post_id, |inner_post| inner_post.increment_replies_counter());

            if editable {
                let parent_id = if let Some(reply_id) = reply_id {
                    ParentId::Reply(reply_id)
                } else {
                    ParentId::Post(post_id)
                };


                let reply = Reply::<T, I>::new(
                    text.clone(),
                    participant_id,
                    parent_id,
                    T::ReplyDeposit::get()
                );

                <ReplyById<T, I>>::insert(post_id, post_replies_count, reply);
            }

            if let Some(reply_id) = reply_id {
                // Trigger event
                Self::deposit_event(RawEvent::DirectReplyCreated(participant_id, post_id, reply_id, post_replies_count, text, editable));
            } else {
                // Trigger event
                Self::deposit_event(RawEvent::ReplyCreated(participant_id, post_id, post_replies_count, text, editable));
            }
            Ok(())
        }

        /// Reply owner can edit reply with a new text
        /// (Only accessible, if related blog and post are unlocked)
        ///
        /// <weight>
        ///
        /// ## Weight
        /// `O (T)` where:
        /// - `T` is the length of the `new_text`
        /// - DB:
        ///    - O(1) doesn't depend on the state or parameters
        /// # </weight>
        #[weight = BlogWeightInfo::<T, I>::edit_reply(new_text.len().saturated_into())]
        pub fn edit_reply(
            origin,
            participant_id: ParticipantId<T>,
            post_id: PostId,
            reply_id: T::ReplyId,
            new_text: Vec<u8>
        ) -> DispatchResult {
            Self::ensure_valid_participant(origin, participant_id)?;

            // Ensure post with given id exists
            let post = Self::ensure_post_exists(post_id)?;

            // Ensure post unlocked, so mutations can be performed
            Self::ensure_post_unlocked(&post)?;

            // Ensure reply with given id exists
            let reply = Self::ensure_reply_exists(post_id, reply_id)?;

            // Ensure reply -> owner relation exists
            Self::ensure_reply_ownership(&reply, &participant_id)?;

            //
            // == MUTATION SAFE ==
            //

            // Update reply with new text
            <ReplyById<T, I>>::mutate(
                post_id,
                reply_id,
                |inner_reply| inner_reply.update(new_text.clone())
            );

            // Trigger event
            Self::deposit_event(RawEvent::ReplyEdited(participant_id, post_id, reply_id, new_text));
            Ok(())
        }

        /// Remove reply from storage
        ///
        /// <weight>
        ///
        /// ## Weight
        /// `O (R)` where
        /// - R is the number of replies to be deleted
        /// - DB:
        ///    - O(R)
        /// # </weight>
        #[weight = BlogWeightInfo::<T, I>::delete_replies(replies.len().saturated_into())]
        pub fn delete_replies(
            origin,
            participant_id: ParticipantId<T>,
            replies: Vec<ReplyToDelete<T::ReplyId>>,
        ) -> DispatchResult {
            let account_id = Self::ensure_valid_participant(origin, participant_id)?;

            let mut erase_replies = Vec::new();
            let mut pay_off_map = BTreeMap::new();
            for ReplyToDelete { post_id, reply_id, hide } in replies {
                // Ensure post with given id exists
                let post = Self::ensure_post_exists(post_id)?;

                // Ensure post unlocked, so mutations can be performed
                Self::ensure_post_unlocked(&post)?;

                // Ensure reply with given id exists
                let reply = Self::ensure_reply_exists(post_id, reply_id)?;

                // Ensure reply -> owner relation exists if post lifetime hasn't ran out
                if (frame_system::Module::<T>::block_number().saturating_sub(reply.last_edited)) <
                    T::ReplyLifetime::get()
                {
                    Self::ensure_reply_ownership(&reply, &participant_id)?;
                }

                if !reply.is_owner(&participant_id) {
                    ensure!(!hide, Error::<T, I>::ReplyOwnershipError);
                }

                *pay_off_map.entry(post_id).or_default() += reply.cleanup_pay_off;
                erase_replies.push((post_id, reply_id, reply.cleanup_pay_off, hide));
            }

            for (post_id, post_deposit) in pay_off_map.into_iter() {
                ensure!(
                    Balances::<T>::usable_balance(
                        &Self::get_treasury_account(post_id)
                    ) >= post_deposit,
                    Error::<T, I>::InsufficientBalanceInPostAccount

                );
            }

            //
            // == MUTATION SAFE ==
            //

            for (post_id, reply_id, cleanup_pay_off, hide) in erase_replies {
                Self::pay_off(post_id, cleanup_pay_off, &account_id)?;

                // Update reply with new text
                <ReplyById<T, I>>::remove(post_id, reply_id);

                // Trigger event
                Self::deposit_event(RawEvent::ReplyDeleted(participant_id, post_id, reply_id, hide));
            }
            Ok(())
        }

    }
}

impl<T: Config<I>, I: Instance> Module<T, I> {
    fn get_treasury_account(post_id: PostId) -> T::AccountId {
        T::ModuleId::get().into_sub_account(post_id)
    }

    fn pay_off(post_id: PostId, amount: BalanceOf<T>, account_id: &T::AccountId) -> DispatchResult {
        <Balances<T> as Currency<T::AccountId>>::transfer(
            &Self::get_treasury_account(post_id),
            account_id,
            amount,
            ExistenceRequirement::AllowDeath,
        )
    }

    fn transfer_to_state_cleanup_treasury_account(
        amount: BalanceOf<T>,
        post_id: PostId,
        account_id: &T::AccountId,
    ) -> DispatchResult {
        <Balances<T> as Currency<T::AccountId>>::transfer(
            account_id,
            &Self::get_treasury_account(post_id),
            amount,
            ExistenceRequirement::AllowDeath,
        )
    }
    // edit_post_weight
    fn edit_post_weight(title: &Option<Vec<u8>>, body: &Option<Vec<u8>>) -> Weight {
        let title_len: u32 = title.as_ref().map_or(0, |t| t.len().saturated_into());
        let body_len: u32 = body.as_ref().map_or(0, |b| b.len().saturated_into());

        BlogWeightInfo::<T, I>::edit_post(title_len, body_len)
    }

    // calculate create_reply weight
    fn create_reply_weight(text_len: usize) -> Weight {
        let text_len: u32 = text_len.saturated_into();
        BlogWeightInfo::<T, I>::create_reply_to_post(text_len)
            .max(BlogWeightInfo::<T, I>::create_reply_to_reply(text_len))
    }

    // Get participant id from origin
    fn ensure_valid_participant(
        origin: T::Origin,
        participant_id: ParticipantId<T>,
    ) -> Result<T::AccountId, DispatchError> {
        let account_id = frame_system::ensure_signed(origin)?;
        ensure!(
            T::ParticipantEnsureOrigin::is_member_controller_account(&participant_id, &account_id),
            Error::<T, I>::MembershipError
        );
        Ok(account_id)
    }

    fn ensure_post_exists(post_id: PostId) -> Result<Post<T, I>, DispatchError> {
        ensure!(
            <PostById<T, I>>::contains_key(post_id),
            Error::<T, I>::PostNotFound
        );
        Ok(Self::post_by_id(post_id))
    }

    fn ensure_reply_exists(
        post_id: PostId,
        reply_id: T::ReplyId,
    ) -> Result<Reply<T, I>, DispatchError> {
        ensure!(
            <ReplyById<T, I>>::contains_key(post_id, reply_id),
            Error::<T, I>::ReplyNotFound
        );
        Ok(Self::reply_by_id(post_id, reply_id))
    }

    fn ensure_blog_ownership(blog_owner: T::Origin) -> Result<(), DispatchError> {
        ensure!(
            frame_system::ensure_root(blog_owner).is_ok(),
            Error::<T, I>::BlogOwnershipError
        );

        Ok(())
    }

    fn ensure_reply_ownership(
        reply: &Reply<T, I>,
        reply_owner: &ParticipantId<T>,
    ) -> Result<(), DispatchError> {
        ensure!(
            reply.is_owner(reply_owner),
            Error::<T, I>::ReplyOwnershipError
        );
        Ok(())
    }

    fn ensure_post_unlocked(post: &Post<T, I>) -> Result<(), DispatchError> {
        ensure!(!post.is_locked(), Error::<T, I>::PostLockedError);
        Ok(())
    }

    fn ensure_posts_limit_not_reached() -> Result<PostId, DispatchError> {
        // Get posts count, associated with given blog
        let posts_count = Self::post_count();

        ensure!(
            posts_count < T::PostsMaxNumber::get(),
            Error::<T, I>::PostLimitReached
        );

        Ok(posts_count)
    }
}

decl_event!(
    pub enum Event<T, I = DefaultInstance>
    where
        ParticipantId = ParticipantId<T>,
        PostId = PostId,
        ReplyId = <T as Config<I>>::ReplyId,
        Title = Vec<u8>,
        Text = Vec<u8>,
        UpdatedTitle = Option<Vec<u8>>,
        UpdatedBody = Option<Vec<u8>>,
    {
        /// A post was created
        PostCreated(PostId, Title, Text),

        /// A post was locked
        PostLocked(PostId),

        /// A post was unlocked
        PostUnlocked(PostId),

        /// A post was edited
        PostEdited(PostId, UpdatedTitle, UpdatedBody),

        /// A reply to a post was created
        ReplyCreated(ParticipantId, PostId, ReplyId, Text, bool),

        /// A reply to a reply was created
        DirectReplyCreated(ParticipantId, PostId, ReplyId, ReplyId, Text, bool),

        /// A reply was deleted from storage
        ReplyDeleted(ParticipantId, PostId, ReplyId, bool),

        /// A reply was edited
        ReplyEdited(ParticipantId, PostId, ReplyId, Text),
    }
);
