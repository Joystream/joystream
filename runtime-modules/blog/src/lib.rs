//! # Blog Module
//!
//! The Blog module provides functionality for handling blogs
//!
//! - [`timestamp::Trait`](./trait.Trait.html)
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
//! - Reactions for both posts and replies
//!
//! ### Terminology
//!
//! - **Lock:** A forbiddance of mutation of any associated information related to a given post.
//!
//! - **Reaction:** A user can react to a post in N different ways, where N is an integer parameter configured through runtime.
//! For each way, the reader can simply react and unreact to a given post. Think of reactions as being things like, unlike,
//! laugh, etc. The semantics of each reaction is not present in the runtime.
//!
//! ## Interface
//! You need to provide an `EnsureOrigin` for `BlogOwnerEnsureOrigin` so that
//! there are a number of origins that can create posts
//!
//! ## Supported extrinsics
//!
//! - [create_post](./struct.Module.html#method.create_post)
//! - [lock_post](./struct.Module.html#method.lock_post)
//! - [unlock_post](./struct.Module.html#method.unlock_post)
//! - [edit_post](./struct.Module.html#method.edit_post)
//! - [create_reply](./struct.Module.html#method.create_reply)
//! - [edit_reply](./struct.Module.html#method.create_reply)
//! - [react](./struct.Module.html#method.create_reply)

#![cfg_attr(not(feature = "std"), no_std)]

use codec::{Codec, Decode, Encode};
use errors::Error;
pub use frame_support::dispatch::{DispatchError, DispatchResult};
use frame_support::traits::EnsureOrigin;
use frame_support::{
    decl_event, decl_module, decl_storage, ensure, traits::Get, Parameter, StorageDoubleMap,
};
use sp_arithmetic::traits::{BaseArithmetic, One};
use sp_runtime::traits::{Hash, MaybeSerialize, MaybeSerializeDeserialize, Member};
use sp_std::prelude::*;

mod benchmarking;
mod errors;
mod mock;
mod tests;

type MaxNumber = u64;

/// Type, representing reactions number
type ReactionsNumber = u64;

/// Number of reactions, presented in runtime
pub const REACTIONS_MAX_NUMBER: ReactionsNumber = 5;

// The pallet's configuration trait.
pub trait Trait<I: Instance = DefaultInstance>: frame_system::Trait {
    /// Origin from which blog owner must come.
    type BlogOwnerEnsureOrigin: EnsureOrigin<Self::Origin, Success = Self::AccountId>;

    /// Origin from which participant must come.
    type ParticipantEnsureOrigin: EnsureOrigin<Self::Origin, Success = Self::ParticipantId>;

    /// The overarching event type.
    type Event: From<Event<Self, I>> + Into<<Self as frame_system::Trait>::Event>;

    /// The maximum number of posts in a blog.
    type PostsMaxNumber: Get<MaxNumber>;

    /// The maximum number of replies to a post.
    type RepliesMaxNumber: Get<MaxNumber>;

    /// Type for the participant id.
    type ParticipantId: Parameter
        + Default
        + Clone
        + Copy
        + Member
        + MaybeSerializeDeserialize
        + Ord;

    /// Type of identifier for blog posts.
    type PostId: Parameter
        + Member
        + BaseArithmetic
        + Codec
        + Default
        + Copy
        + MaybeSerialize
        + PartialEq
        + From<u64>
        + Into<u64>;

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
}

/// Type, representing blog related post structure
#[cfg_attr(feature = "std", derive(Debug))]
#[derive(Encode, Decode, Clone)]
pub struct Post<T: Trait<I>, I: Instance> {
    /// Locking status
    locked: bool,
    title_hash: T::Hash,
    body_hash: T::Hash,
    /// Overall replies counter, associated with post
    replies_count: T::ReplyId,
}

// Note: we derive it by hand because the derive wasn't working
impl<T: Trait<I>, I: Instance> PartialEq for Post<T, I> {
    fn eq(&self, other: &Post<T, I>) -> bool {
        self.locked == other.locked
            && self.title_hash == other.title_hash
            && self.body_hash == other.body_hash
            && self.replies_count == other.replies_count
    }
}

/// Default Post
// Note: We implement it by hand because it couldn't automatically derive it
impl<T: Trait<I>, I: Instance> Default for Post<T, I> {
    fn default() -> Self {
        Post {
            locked: Default::default(),
            title_hash: Default::default(),
            body_hash: Default::default(),
            replies_count: Default::default(),
        }
    }
}

impl<T: Trait<I>, I: Instance> Post<T, I> {
    /// Create a new post with given title and body
    fn new(title: Vec<u8>, body: Vec<u8>) -> Self {
        Self {
            // Post default locking status
            locked: false,
            title_hash: T::Hashing::hash(&title),
            body_hash: T::Hashing::hash(&body),
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
    fn is_locked(&self) -> bool {
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
    fn update(&mut self, new_title: Option<Vec<u8>>, new_body: Option<Vec<u8>>) {
        if let Some(new_title) = new_title {
            self.title_hash = T::Hashing::hash(&new_title)
        }
        if let Some(new_body) = new_body {
            self.body_hash = T::Hashing::hash(&new_body)
        }
    }
}

/// Enum variant, representing either reply or post id
#[derive(Encode, Decode, Clone, PartialEq)]
#[cfg_attr(feature = "std", derive(Debug))]
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
#[cfg_attr(feature = "std", derive(Debug))]
pub struct Reply<T: Trait<I>, I: Instance> {
    /// Reply text hash
    text_hash: T::Hash,
    /// Participant id, associated with a reply owner
    owner: T::ParticipantId,
    /// Reply`s parent id
    parent_id: ParentId<T::ReplyId, T::PostId>,
}

/// Reply comparator
impl<T: Trait<I>, I: Instance> PartialEq for Reply<T, I> {
    fn eq(&self, other: &Reply<T, I>) -> bool {
        self.text_hash == other.text_hash
            && self.owner == other.owner
            && self.parent_id == other.parent_id
    }
}

/// Default Reply
impl<T: Trait<I>, I: Instance> Default for Reply<T, I> {
    fn default() -> Self {
        Reply {
            text_hash: Default::default(),
            owner: Default::default(),
            parent_id: Default::default(),
        }
    }
}

impl<T: Trait<I>, I: Instance> Reply<T, I> {
    /// Create new reply with given text and owner id
    fn new(
        text: Vec<u8>,
        owner: T::ParticipantId,
        parent_id: ParentId<T::ReplyId, T::PostId>,
    ) -> Self {
        Self {
            text_hash: T::Hashing::hash(&text),
            owner,
            parent_id,
        }
    }

    /// Check if account_id is reply owner
    fn is_owner(&self, account_id: &T::ParticipantId) -> bool {
        self.owner == *account_id
    }

    /// Update reply`s text
    fn update(&mut self, new_text: Vec<u8>) {
        self.text_hash = T::Hashing::hash(&new_text)
    }
}

// Blog`s pallet storage items.
decl_storage! {
    trait Store for Module<T: Trait<I>, I: Instance=DefaultInstance> as BlogModule {

        /// Maps, representing id => item relationship for blogs, posts and replies related structures

        /// Post count
        PostCount get(fn post_count): T::PostId;

        /// Post by unique blog and post identificators
        PostById get(fn post_by_id): map hasher(blake2_128_concat) T::PostId => Post<T, I>;

        /// Reply by unique blog, post and reply identificators
        ReplyById get (fn reply_by_id): double_map hasher(blake2_128_concat) T::PostId, hasher(blake2_128_concat) T::ReplyId => Reply<T, I>;

        /// Mapping, representing AccountId -> All presented reactions state mapping by unique post or reply identificators.
        pub Reactions get(fn reactions): double_map hasher(blake2_128_concat) (T::PostId, Option<T::ReplyId>), hasher(blake2_128_concat) T::ParticipantId => [bool; REACTIONS_MAX_NUMBER as usize];
    }
}

// Blog`s pallet dispatchable functions.
decl_module! {
    pub struct Module<T: Trait<I>, I: Instance=DefaultInstance> for enum Call where origin: T::Origin {

        /// Setup events
        fn deposit_event() = default;

        /// Predefined errors
        type Error = Error<T, I>;

        /// Blog owner can create posts, related to a given blog, if related blog is unlocked
        #[weight = 10_000_000] // TODO: adjust weight
        pub fn create_post(origin, title: Vec<u8>, body: Vec<u8>) -> DispatchResult  {

            // Ensure blog -> owner relation exists
            Self::ensure_blog_ownership(origin)?;

            // Check security/configuration constraints

            let posts_count = Self::ensure_posts_limit_not_reached()?;

            //
            // == MUTATION SAFE ==
            //

            //<PostCount<T, I>>::mutate(|count| *count += 1);
            let post_count = <PostCount<T, I>>::get();
            <PostCount<T, I>>::put(post_count + One::one());

            // New post creation
            let post = Post::new(title, body);
            <PostById<T, I>>::insert(posts_count, post);

            // Trigger event
            Self::deposit_event(RawEvent::PostCreated(posts_count));
            Ok(())
        }

        /// Blog owner can lock posts, related to a given blog,
        /// making post immutable to any actions (replies creation, post editing, reactions, etc.)
        #[weight = 10_000_000] // TODO: adjust weight
        pub fn lock_post(origin, post_id: T::PostId) -> DispatchResult {

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
        #[weight = 10_000_000] // TODO: adjust weight
        pub fn unlock_post(origin, post_id: T::PostId) -> DispatchResult {

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
        #[weight = 10_000_000] // TODO: adjust weight
        pub fn edit_post(
            origin,
            post_id: T::PostId,
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
            <PostById<T, I>>::mutate(post_id, |inner_post| inner_post.update(new_title, new_body));

            // Trigger event
            Self::deposit_event(RawEvent::PostEdited(post_id));
            Ok(())
        }

        /// Create either root post reply or direct reply to reply
        /// (Only accessible, if related blog and post are unlocked)
        #[weight = 10_000_000] // TODO: adjust weight
        pub fn create_reply(
            origin,
            post_id: T::PostId,
            reply_id: Option<T::ReplyId>,
            text: Vec<u8>
        ) -> DispatchResult {
            let reply_owner = Self::get_participant(origin)?;

            // Ensure post with given id exists
            let post = Self::ensure_post_exists(post_id)?;

            // Ensure post unlocked, so mutations can be performed
            Self::ensure_post_unlocked(&post)?;

            // Ensure root replies limit not reached
            Self::ensure_replies_limit_not_reached(&post)?;

            // New reply creation
            let reply = if let Some(reply_id) = reply_id {
                // Check parent reply existance in case of direct reply
                Self::ensure_reply_exists(post_id, reply_id)?;
                Reply::<T, I>::new(text, reply_owner, ParentId::Reply(reply_id))
            } else {
                Reply::<T, I>::new(text, reply_owner, ParentId::Post(post_id))
            };

            //
            // == MUTATION SAFE ==
            //

            // Update runtime storage with new reply
            let post_replies_count = post.replies_count();
            <ReplyById<T, I>>::insert(post_id, post_replies_count, reply);

            // Increment replies counter, associated with given post
            <PostById<T, I>>::mutate(post_id, |inner_post| inner_post.increment_replies_counter());

            if let Some(reply_id) = reply_id {
                // Trigger event
                Self::deposit_event(RawEvent::DirectReplyCreated(reply_owner, post_id, reply_id, post_replies_count));
            } else {
                // Trigger event
                Self::deposit_event(RawEvent::ReplyCreated(reply_owner, post_id, post_replies_count));
            }
            Ok(())
        }

        /// Reply owner can edit reply with a new text
        /// (Only accessible, if related blog and post are unlocked)
        #[weight = 10_000_000] // TODO: adjust weight
        pub fn edit_reply(
            origin,
            post_id: T::PostId,
            reply_id: T::ReplyId,
            new_text: Vec<u8>
        ) -> DispatchResult {
            let reply_owner = Self::get_participant(origin)?;

            // Ensure post with given id exists
            let post = Self::ensure_post_exists(post_id)?;

            // Ensure post unlocked, so mutations can be performed
            Self::ensure_post_unlocked(&post)?;

            // Ensure reply with given id exists
            let reply = Self::ensure_reply_exists(post_id, reply_id)?;

            // Ensure reply -> owner relation exists
            Self::ensure_reply_ownership(&reply, &reply_owner)?;

            //
            // == MUTATION SAFE ==
            //

            // Update reply with new text
            <ReplyById<T, I>>::mutate(post_id, reply_id, |inner_reply| inner_reply.update(new_text));

            // Trigger event
            Self::deposit_event(RawEvent::ReplyEdited(post_id, reply_id));
            Ok(())
        }

        /// Submit either post reaction or reply reaction
        /// In case, when you resubmit reaction, it`s status will be changed to an opposite one
        #[weight = 10_000_000] // TODO: adjust weight
        pub fn react(
            origin,
            // reaction index in array
            index: ReactionsNumber,
            post_id: T::PostId,
            reply_id: Option<T::ReplyId>
        ) {
            let owner = Self::get_participant(origin)?;

            // Ensure index is valid & reaction under given index exists
            Self::ensure_reaction_index_is_valid(index)?;

            // Ensure post with given id exists
            let post = Self::ensure_post_exists(post_id)?;

            // Ensure post unlocked, so mutations can be performed
            Self::ensure_post_unlocked(&post)?;

            // Ensure reply with given id exists
            if let Some(reply_id) = reply_id {
                Self::ensure_reply_exists(post_id, reply_id)?;
            }

            //
            // == MUTATION SAFE ==
            //

            // Trigger event
            if let Some(reply_id) = reply_id {
                Self::deposit_event(RawEvent::ReplyReactionsUpdated(owner, post_id, reply_id, index));
            } else {
                Self::deposit_event(RawEvent::PostReactionsUpdated(owner, post_id, index));
            }
        }

    }
}

impl<T: Trait<I>, I: Instance> Module<T, I> {
    // Get participant id from origin
    fn get_participant(origin: T::Origin) -> Result<T::ParticipantId, DispatchError> {
        Ok(T::ParticipantEnsureOrigin::ensure_origin(origin)?)
    }

    fn ensure_post_exists(post_id: T::PostId) -> Result<Post<T, I>, DispatchError> {
        ensure!(
            <PostById<T, I>>::contains_key(post_id),
            Error::<T, I>::PostNotFound
        );
        Ok(Self::post_by_id(post_id))
    }

    fn ensure_reply_exists(
        post_id: T::PostId,
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
            T::BlogOwnerEnsureOrigin::ensure_origin(blog_owner).is_ok(),
            Error::<T, I>::BlogOwnershipError
        );

        Ok(())
    }

    fn ensure_reply_ownership(
        reply: &Reply<T, I>,
        reply_owner: &T::ParticipantId,
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

    fn ensure_posts_limit_not_reached() -> Result<T::PostId, DispatchError> {
        // Get posts count, associated with given blog
        let posts_count = Self::post_count();

        ensure!(
            posts_count < T::PostsMaxNumber::get().into(),
            Error::<T, I>::PostLimitReached
        );

        Ok(posts_count)
    }

    fn ensure_replies_limit_not_reached(post: &Post<T, I>) -> Result<(), DispatchError> {
        // Get replies count, associated with given post
        let root_replies_count = post.replies_count();

        ensure!(
            root_replies_count < T::RepliesMaxNumber::get().into(),
            Error::<T, I>::RepliesLimitReached
        );

        Ok(())
    }

    fn ensure_reaction_index_is_valid(index: ReactionsNumber) -> Result<(), DispatchError> {
        ensure!(
            index < REACTIONS_MAX_NUMBER,
            Error::<T, I>::InvalidReactionIndex
        );
        Ok(())
    }
}

decl_event!(
    pub enum Event<T, I = DefaultInstance>
    where
        ParticipantId = <T as Trait<I>>::ParticipantId,
        PostId = <T as Trait<I>>::PostId,
        ReplyId = <T as Trait<I>>::ReplyId,
        ReactionIndex = ReactionsNumber,
    {
        /// A post was created
        PostCreated(PostId),

        /// A post was locked
        PostLocked(PostId),

        /// A post was unlocked
        PostUnlocked(PostId),

        /// A post was edited
        PostEdited(PostId),

        /// A reply to a post was created
        ReplyCreated(ParticipantId, PostId, ReplyId),

        /// A reply to a reply was created
        DirectReplyCreated(ParticipantId, PostId, ReplyId, ReplyId),

        /// A reply was edited
        ReplyEdited(PostId, ReplyId),

        /// A post reaction was created or changed
        PostReactionsUpdated(ParticipantId, PostId, ReactionIndex),

        /// A reply creation was created or changed
        ReplyReactionsUpdated(ParticipantId, PostId, ReplyId, ReactionIndex),
    }
);
