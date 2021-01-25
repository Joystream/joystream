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
//! - Blogs creation
//! - Blogs locking and unlocking
//! - Creation and editing of posts, associated with given blog
//! - Posts locking/unlocking
//! - Creation and editing of replies, associated with given post
//! - Reactions for both posts and replies
//!
//! ### Terminology
//!
//! - **Lock:** A forbiddance of mutation of any associated information related to a given blog or post.
//!
//! - **Reaction:** A user can react to a post in N different ways, where N is an integer parameter configured through runtime.
//! For each way, the reader can simply react and unreact to a given post. Think of reactions as being things like, unlike,
//! laugh, etc. The semantics of each reaction is not present in the runtime.
//!
//! ## Interface
//!
//! ### Dispatchable Functions
//!
//! - `create_post` - Blog owner can create posts, related to a given blog.
//! - `lock_post` - Blog owner can lock post to forbid mutations of any associated information related to a given post.
//! The origin of this call must be a blog owner.
//! - `unlock_post` - Reverse to lock post.
//! - `edit_post` - Edit post with a new title/or body. The origin of this call must be a blog owner.
//! - `create_reply` - Create either root post reply or direct reply to reply.
//! - `edit_reply` - Edit reply with a new text. The origin of this call must be a reply owner
//! - `react` - Submit either post reaction or reply reaction.
//! - In case, when you resubmit reaction, it`s status will be changed to an opposite one
//!
//! ### Public functions
//!
//! - `create_blog` - Creates new blog with unique identifier via an extrinsic where access is gated
//! by a dedicated EnsureOrigin runtime trait.
//! - `lock_blog` - Locks blog to forbid mutations of any associated information related to a given blog.
//! - `unlock_blog` - Reverse to lock_blog
//!
//! ## Usage
//!
//! The following example shows how to use the Blog module in your custom module.
//!
//! ### Prerequisites
//!
//! Import the Blog module into your custom module and derive the module configuration
//! trait from the blog trait.

#![cfg_attr(not(feature = "std"), no_std)]

use codec::{Codec, Decode, Encode};
use errors::Error;
pub use frame_support::dispatch::{DispatchError, DispatchResult};
use frame_support::traits::EnsureOrigin;
use frame_support::{
    decl_event, decl_module, decl_storage, ensure, traits::Get, Parameter, StorageDoubleMap,
};
use sp_arithmetic::traits::{BaseArithmetic, One};
use sp_runtime::traits::{MaybeSerialize, MaybeSerializeDeserialize, Member};
use sp_std::prelude::*;

mod errors;
mod mock;
mod tests;

type MaxLength = u64;

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

    /// Security/configuration constraints

    /// The maximum length of each post`s title.
    type PostTitleMaxLength: Get<MaxLength>;

    /// The maximum length of each post`s body.
    type PostBodyMaxLength: Get<MaxLength>;

    /// The maximum length of each reply.
    type ReplyMaxLength: Get<MaxLength>;

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
#[derive(Encode, Decode, Clone, PartialEq)]
#[cfg_attr(feature = "std", derive(Debug))]
pub struct Post<T: Trait<I>, I: Instance> {
    /// Locking status
    locked: bool,
    title: Vec<u8>,
    body: Vec<u8>,
    /// Overall replies counter, associated with post
    replies_count: T::ReplyId,
}

/// Default Post
impl<T: Trait<I>, I: Instance> Default for Post<T, I> {
    fn default() -> Self {
        Post {
            locked: Default::default(),
            title: Default::default(),
            body: Default::default(),
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
            title,
            body,
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
            self.title = new_title
        }
        if let Some(new_body) = new_body {
            self.body = new_body
        }
    }
}

/// Enum variant, representing either reply or post id
#[derive(Encode, Decode, Clone, PartialEq)]
#[cfg_attr(feature = "std", derive(Debug))]
pub enum ParentId<T: Trait<I>, I: Instance> {
    Reply(T::ReplyId),
    Post(T::PostId),
}

/// Default parent representation
impl<T: Trait<I>, I: Instance> Default for ParentId<T, I> {
    fn default() -> Self {
        ParentId::Post(T::PostId::default())
    }
}

/// Type, representing either root post reply or direct reply to reply
#[derive(Encode, Decode, Clone, PartialEq)]
#[cfg_attr(feature = "std", derive(Debug))]
pub struct Reply<T: Trait<I>, I: Instance> {
    /// Reply text content
    text: Vec<u8>,
    /// Participant id, associated with a reply owner
    owner: T::ParticipantId,
    /// Reply`s parent id
    parent_id: ParentId<T, I>,
}

/// Default Reply
impl<T: Trait<I>, I: Instance> Default for Reply<T, I> {
    fn default() -> Self {
        Reply {
            text: Default::default(),
            owner: Default::default(),
            parent_id: Default::default(),
        }
    }
}

impl<T: Trait<I>, I: Instance> Reply<T, I> {
    /// Create new reply with given text and owner id
    fn new(text: Vec<u8>, owner: T::ParticipantId, parent_id: ParentId<T, I>) -> Self {
        Self {
            text,
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
        self.text = new_text
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

        // Initializing events
        fn deposit_event() = default;

        // Predefined Errors
        type Error = Error<T, I>;

        // Blog owner can create posts, related to a given blog, if related blog is unlocked
        #[weight = 10_000_000] // TODO: adjust weight
        pub fn create_post(origin, title: Vec<u8>, body: Vec<u8>) -> DispatchResult  {

            // Ensure blog -> owner relation exists
            Self::ensure_blog_ownership(origin)?;

            // Check security/configuration constraints

            // Ensure post title length is valid
            Self::ensure_post_title_is_valid(&title)?;

            // Ensure post body length is valid
            Self::ensure_post_body_is_valid(&body)?;
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

            // Check security/configuration constraints

            // Ensure post title length is valid
            if let Some(ref new_title) = new_title {
                Self::ensure_post_title_is_valid(&new_title)?;
            }

            // Ensure post body length is valid
            if let Some(ref new_body) = new_body {
                Self::ensure_post_body_is_valid(&new_body)?;
            }

            //
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

            // Ensure reply text length is valid
            Self::ensure_reply_text_is_valid(&text)?;

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

            // Check security/configuration constraint
            Self::ensure_reply_text_is_valid(&new_text)?;

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

            // Update reply`s reactions
            <Reactions<T, I>>::mutate((post_id, reply_id), owner, |inner_reactions| {
                let reaction_status = Self::mutate_reactions(inner_reactions, index);
                // Trigger event
                if let Some(reply_id) = reply_id {
                    Self::deposit_event(RawEvent::ReplyReactionsUpdated(owner, post_id, reply_id, index, reaction_status));
                } else {
                    Self::deposit_event(RawEvent::PostReactionsUpdated(owner, post_id, index, reaction_status));
                }
            });
        }

    }
}

impl<T: Trait<I>, I: Instance> Module<T, I> {
    // Get participant id from origin
    fn get_participant(origin: T::Origin) -> Result<T::ParticipantId, &'static str> {
        Ok(T::ParticipantEnsureOrigin::ensure_origin(origin)?)
    }

    /// Flip reaction status under given index and returns the result of that flip.
    /// If there is no reactions under this AccountId entry yet,
    /// initialize a new reactions array and set reaction under given index
    fn mutate_reactions(reactions: &mut [bool], index: ReactionsNumber) -> bool {
        reactions[index as usize] ^= true;
        reactions[index as usize]
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

    fn ensure_post_title_is_valid(title: &[u8]) -> Result<(), DispatchError> {
        ensure!(
            title.len() <= T::PostTitleMaxLength::get() as usize,
            Error::<T, I>::PostTitleTooLong
        );
        Ok(())
    }

    fn ensure_post_body_is_valid(body: &[u8]) -> Result<(), DispatchError> {
        ensure!(
            body.len() <= T::PostBodyMaxLength::get() as usize,
            Error::<T, I>::PostBodyTooLong
        );
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

    fn ensure_reply_text_is_valid(reply_text: &[u8]) -> Result<(), DispatchError> {
        ensure!(
            reply_text.len() <= T::ReplyMaxLength::get() as usize,
            Error::<T, I>::ReplyTextTooLong
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
        Status = bool,
    {
        PostCreated(PostId),
        PostLocked(PostId),
        PostUnlocked(PostId),
        PostEdited(PostId),
        ReplyCreated(ParticipantId, PostId, ReplyId),
        DirectReplyCreated(ParticipantId, PostId, ReplyId, ReplyId),
        ReplyEdited(PostId, ReplyId),
        PostReactionsUpdated(ParticipantId, PostId, ReactionIndex, Status),
        ReplyReactionsUpdated(ParticipantId, PostId, ReplyId, ReactionIndex, Status),
    }
);
