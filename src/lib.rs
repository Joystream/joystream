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
//! 
//! ### Create a blog 
//!
//! ```
//! use frame_support::{decl_module, dispatch};
//! # use substrate_blog_module as blog_module;
//! use frame_system::{self as system, ensure_signed};
//!
//! pub trait Trait: blog_module::Trait {}
//!
//! decl_module! {
//! 	pub struct Module<T: Trait> for enum Call where origin: T::Origin {
//! 		#[weight = frame_support::weights::SimpleDispatchInfo::default()]
//! 		pub fn create_blog(origin) -> dispatch::DispatchResult {
//! 			let _sender = ensure_signed(origin)?;
//! 			let _now = <blog_module::Module<T>>::create_blog(_sender);
//! 			Ok(())
//! 		}
//! 	}
//! }
//! # fn main() {}
//! ```

#![cfg_attr(not(feature = "std"), no_std)]

use codec::{Codec, Decode, Encode};
use rstd::collections::btree_map::BTreeMap;
use rstd::fmt::Debug;
use rstd::prelude::*;
use runtime_primitives::traits::MaybeDisplay;
use runtime_primitives::traits::{
    EnsureOrigin, MaybeSerialize, MaybeSerializeDeserialize, Member, One, SimpleArithmetic, Zero,
};
use srml_support::{
    decl_event, decl_module, decl_storage, dispatch, ensure, traits::Get, Parameter, StorageDoubleMap
};

mod error_messages;
mod mock;
mod tests;

use error_messages::*;

type MaxLength = u32;

type MaxNumber = u32;

type MaxConsecutiveRepliesNumber = u16;

// The pallet's configuration trait.
pub trait Trait: system::Trait + Default {
    /// Origin from which blog owner must come.
    type BlogOwnerEnsureOrigin: EnsureOrigin<Self::Origin, Success = Self::AccountId>;

    /// Origin from which participant must come.
    type ParticipantEnsureOrigin: EnsureOrigin<Self::Origin, Success = Self::AccountId>;

    /// The overarching event type.
    type Event: From<Event<Self>> + Into<<Self as system::Trait>::Event>;

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

    /// The maximum number of direct replies to a reply.
    type DirectRepliesMaxNumber: Get<MaxNumber>;

    /// The maximum number of consecutive (in time) replies by
    /// the same actor (reader or author) to the same post or reply.
    type ConsecutiveRepliesMaxNumber: Get<MaxConsecutiveRepliesNumber>;

    /// The maximum cosecutive replies interval in blocks passed
    type ConsecutiveRepliesInterval: Get<Self::BlockNumber>;

    /// Type, representing reactions number
    type ReactionsNumber: Parameter
        + Member
        + SimpleArithmetic
        + Codec
        + Default
        + Copy
        + MaybeSerialize
        + PartialEq
        + Into<u32>
        + From<u32>;

    /// Number of reactions, presented in runtime
    type ReactionsMaxNumber: Get<Self::ReactionsNumber>;

    /// Type for the blog owner id. Should be authenticated by account id.
    type BlogOwnerId: From<Self::AccountId> + Parameter + Default + Clone + Copy;

    /// Type for the participant id. Should be authenticated by account id.
    type ParticipantId: From<Self::AccountId>
        + Parameter
        + Default
        + Clone
        + Copy
        + Member
        + MaybeSerializeDeserialize
        + Debug
        + MaybeDisplay
        + Ord;

    /// Type of identifier for blogs.
    type BlogId: Parameter
        + Member
        + SimpleArithmetic
        + Codec
        + Default
        + Copy
        + MaybeSerialize
        + PartialEq;

    /// Type of identifier for blog posts.
    type PostId: Parameter
        + Member
        + SimpleArithmetic
        + Codec
        + Default
        + Copy
        + MaybeSerialize
        + PartialEq;

    /// Type of identifier for replies.
    type ReplyId: Parameter
        + Member
        + SimpleArithmetic
        + Codec
        + Default
        + Copy
        + MaybeSerialize
        + PartialEq;
}

/// Type, representing blog structure
#[cfg_attr(feature = "std", derive(Debug))]
#[derive(Encode, Decode, Default, Clone, PartialEq)]
pub struct Blog<T: Trait> {
    /// Locking status
    locked: bool,
    /// Overall posts counter, associated with blog
    posts_count: T::PostId,
    /// Blog owner id, associated with blog owner
    owner: T::BlogOwnerId,
}

impl<T: Trait> Blog<T> {
    /// Create a new blog, related to a given blog owner
    fn new(owner: T::BlogOwnerId) -> Self {
        Self {
            // Blog default locking status
            locked: false,
            // Set posts count of newly created blog to zero
            posts_count: T::PostId::default(),
            owner,
        }
    }

    /// Make all data, associated with this blog immutable
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

    /// Check if account_id is blog owner
    fn is_owner(&self, account_id: &T::BlogOwnerId) -> bool {
        self.owner == *account_id
    }

    /// Get overall posts count, associated with this blog
    fn posts_count(&self) -> T::PostId {
        self.posts_count
    }

    /// Increase posts count, associated with given blog by 1
    fn increment_posts_counter(&mut self) {
        self.posts_count += T::PostId::one()
    }
}

/// Type, representing blog related post structure
#[derive(Encode, Default, Decode, Clone, PartialEq)]
#[cfg_attr(feature = "std", derive(Debug))]
pub struct Post<T: Trait> {
    /// Locking status
    locked: bool,
    title: Vec<u8>,
    body: Vec<u8>,
    /// Overall replies counter, associated with post
    replies_count: T::ReplyId,
    /// Root replies counter, associated with a post
    root_replies_count: T::ReplyId,
    /// Block numbers of last created root replies
    // (needed for max consecutive replies constraint check)
    last_root_replies_block_numbers: Vec<T::BlockNumber>,
    /// AccountId -> All presented reactions state mapping
    reactions: BTreeMap<T::ParticipantId, Vec<bool>>,
}

impl<T: Trait> Post<T> {
    /// Create a new post with given title and body
    fn new(title: Vec<u8>, body: Vec<u8>) -> Self {
        Self {
            // Post default locking status
            locked: false,
            title,
            body,
            // Set replies count of newly created post to zero
            replies_count: T::ReplyId::default(),
            // Set root replies count of newly created post to zero
            root_replies_count: T::ReplyId::default(),
            // Initialize with blank (default) collection
            last_root_replies_block_numbers: vec![],
            // Initialize with blank (default) collection
            reactions: BTreeMap::default(),
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

    /// Get root replies count, associated with this post
    fn root_replies_count(&self) -> T::ReplyId {
        self.root_replies_count
    }

    /// Increase replies counter, associated with given post by 1
    fn increment_replies_counter(&mut self) {
        self.replies_count += T::ReplyId::one()
    }

    /// Recalculate last consecutive replies count and add last reply block number
    fn add_last_root_reply(&mut self, block_number: T::BlockNumber) {
        Module::<T>::recalculate_last_replies_count(&mut self.last_root_replies_block_numbers, block_number);
        Module::<T>::push_reply_block_number(&mut self.last_root_replies_block_numbers, block_number);
        // Increase root replies counter, associated with given post by 1
        self.root_replies_count += T::ReplyId::one()
    }

    /// Get last consecutive root replies count
    fn calculate_last_root_replies_count(&self, current_block_number: T::BlockNumber) -> usize {
        Module::<T>::calculate_last_replies_count(
            &self.last_root_replies_block_numbers,
            current_block_number,
        )
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

    /// Update reactions state
    fn update_reactions(&mut self, owner: &T::ParticipantId, index: T::ReactionsNumber) -> bool {
        Module::<T>::mutate_reactions(&mut self.reactions, owner, index)
    }

    /// Get reactions state, associated with reaction owner
    pub fn get_reactions(&self, owner: &T::ParticipantId) -> Option<&Vec<bool>> {
        self.reactions.get(owner)
    }

    /// Get reference to all rections, associated with post
    pub fn get_reactions_map(&self) -> &BTreeMap<T::ParticipantId, Vec<bool>> {
        &self.reactions
    }
}


/// Type, representing either root post reply or direct reply to reply
#[derive(Encode, Decode, Clone, Default, PartialEq)]
#[cfg_attr(feature = "std", derive(Debug))]
pub struct Reply<T: Trait> {
    /// Reply text content
    text: Vec<u8>,
    /// Participant id, associated with a reply owner
    owner: T::ParticipantId,
    /// Block numbers of last created direct replies
    // (needed for max consecutive replies constraint check)
    last_direct_replies_block_numbers: Vec<T::BlockNumber>,
    /// Direct replies counter, associated with this reply
    direct_replies_count: T::ReplyId,
    /// AccountId -> All presented reactions state mapping
    reactions: BTreeMap<T::ParticipantId, Vec<bool>>,
}

impl<T: Trait> Reply<T> {
    /// Create new reply with given text and owner id
    fn new(text: Vec<u8>, owner: T::ParticipantId) -> Self {
        Self {
            text,
            owner,
            // Initialize with blank (default) collection
            last_direct_replies_block_numbers: vec![],
            // Set direct replies count of newly created reply to zero
            direct_replies_count: T::ReplyId::default(),
            // Initialize with blank (default) collection
            reactions: BTreeMap::new(),
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

    /// Update reactions state
    fn update_reactions(&mut self, owner: &T::ParticipantId, index: T::ReactionsNumber) -> bool {
        Module::<T>::mutate_reactions(&mut self.reactions, owner, index)
    }

    /// Get reactions state, associated with reaction owner
    pub fn get_reactions(&self, owner: &T::ParticipantId) -> Option<&Vec<bool>> {
        self.reactions.get(owner)
    }

    /// Get reference to all rections, associated with reply
    pub fn get_reactions_map(&self) -> &BTreeMap<T::ParticipantId, Vec<bool>> {
        &self.reactions
    }

    /// Get direct replies count, associated with this reply
    fn direct_replies_count(&self) -> T::ReplyId {
        self.direct_replies_count
    }

    /// Recalculate last consecutive replies count and add last reply block number
    fn add_last_direct_reply(&mut self, block_number: T::BlockNumber) {
        Module::<T>::recalculate_last_replies_count(&mut self.last_direct_replies_block_numbers, block_number);
        Module::<T>::push_reply_block_number(&mut self.last_direct_replies_block_numbers, block_number);
        // Increase direct replies counter, associated with given reply by 1
        self.direct_replies_count += T::ReplyId::one()
    }

    /// Get last consecutive direct replies count
    fn calculate_last_direct_replies_count(
        &self,
        current_block_number: T::BlockNumber,
    ) -> usize {
        Module::<T>::calculate_last_replies_count(
            &self.last_direct_replies_block_numbers,
            current_block_number,
        )
    }
}

// Blog`s pallet storage items.
decl_storage! {
    trait Store for Module<T: Trait> as BlogModule {

        /// Maps, representing id => item relationship for blogs, posts and replies related structures

        /// Blog by unique blog identificator
       
        BlogById get(fn blog_by_id): map T::BlogId => Blog<T>;

        /// Post by unique blog and post identificators
        
        PostById get(fn post_by_id): double_map hasher(blake2_128) T::BlogId, blake2_128(T::PostId) => Post<T>;

        /// Reply by unique blog, post and reply identificators

        ReplyById get (fn reply_by_id): double_map hasher(blake2_128) (T::BlogId, T::PostId), blake2_128(T::ReplyId) => Reply<T>;

        /// Overall blogs counter

        BlogsCount get(fn blogs_count): T::BlogId;
    }
}

// Blog`s pallet dispatchable functions.
decl_module! {
    pub struct Module<T: Trait> for enum Call where origin: T::Origin {

        // Initializing events
        fn deposit_event() = default;

        /// Blog owner can create posts, related to a given blog, if related blog is unlocked
        pub fn create_post(origin, blog_id: T::BlogId, title: Vec<u8>, body: Vec<u8>) -> dispatch::Result  {
            let blog_owner = Self::get_blog_owner(origin)?;

            // Ensure blog with given id exists
            let blog = Self::ensure_blog_exists(blog_id)?;

            // Ensure blog -> owner relation exists
            Self::ensure_blog_ownership(&blog, &blog_owner)?;

            // Ensure blog unlocked, so mutations can be performed
            Self::ensure_blog_unlocked(&blog)?;

            // Check security/configuration constraints


            // Ensure post title length is valid
            Self::ensure_post_title_is_valid(&title)?;

            // Ensure post body length is valid
            Self::ensure_post_body_is_valid(&body)?;
            let posts_count = Self::ensure_posts_limit_not_reached(&blog)?;

            //
            // == MUTATION SAFE ==
            //

            // New post creation
            let post = Post::new(title, body);
            <PostById<T>>::insert(blog_id, posts_count, post);

            // Increment blog posts counter, associated with given blog
            <BlogById<T>>::mutate(blog_id, |inner_blog| inner_blog.increment_posts_counter());

            // Trigger event
            Self::deposit_event(RawEvent::PostCreated(blog_id, posts_count));
            Ok(())
        }

        /// Blog owner can lock posts, related to a given blog,
        /// making post immutable to any actions (replies creation, post editing, reactions, etc.)
        pub fn lock_post(origin, blog_id: T::BlogId, post_id: T::PostId) -> dispatch::Result {
            let blog_owner = Self::get_blog_owner(origin)?;

            // Ensure blog with given id exists
            let blog = Self::ensure_blog_exists(blog_id)?;

            // Ensure blog -> owner relation exists
            Self::ensure_blog_ownership(&blog, &blog_owner)?;

            // Ensure post with given id exists
            Self::ensure_post_exists(blog_id, post_id)?;

            //
            // == MUTATION SAFE ==
            //

            // Update post lock status, associated with given id
            <PostById<T>>::mutate(blog_id, post_id, |inner_post| inner_post.lock());

            // Trigger event
            Self::deposit_event(RawEvent::PostLocked(blog_id, post_id));
            Ok(())
        }

        /// Blog owner can unlock posts, related to a given blog,
        /// making post accesible to previously forbidden actions
        pub fn unlock_post(origin, blog_id: T::BlogId, post_id: T::PostId) -> dispatch::Result {
            let blog_owner = Self::get_blog_owner(origin)?;

            // Ensure blog with given id exists
            let blog = Self::ensure_blog_exists(blog_id)?;

            // Ensure blog -> owner relation exists
            Self::ensure_blog_ownership(&blog, &blog_owner)?;

            // Ensure post with given id exists
            Self::ensure_post_exists(blog_id, post_id)?;

            //
            // == MUTATION SAFE ==
            //

            // Update post lock status, associated with given id
            <PostById<T>>::mutate(blog_id, post_id, |inner_post| inner_post.unlock());

            // Trigger event
            Self::deposit_event(RawEvent::PostUnlocked(blog_id, post_id));
            Ok(())
        }

        /// Blog owner can edit post, related to a given blog (if unlocked)
        /// with a new title and/or body
        pub fn edit_post(
            origin,
            blog_id: T::BlogId,
            post_id: T::PostId,
            new_title: Option<Vec<u8>>,
            new_body: Option<Vec<u8>>
        ) -> dispatch::Result {
            let blog_owner = Self::get_blog_owner(origin)?;

            // Ensure blog with given id exists
            let blog = Self::ensure_blog_exists(blog_id)?;

            // Ensure blog -> owner relation exists
            Self::ensure_blog_ownership(&blog, &blog_owner)?;

            // Ensure blog unlocked, so mutations can be performed
            Self::ensure_blog_unlocked(&blog)?;

            // Ensure post with given id exists
            let post = Self::ensure_post_exists(blog_id, post_id)?;

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
            <PostById<T>>::mutate(blog_id, post_id, |inner_post| inner_post.update(new_title, new_body));

            // Trigger event
            Self::deposit_event(RawEvent::PostEdited(blog_id, post_id));
            Ok(())
        }

        /// Create either root post reply or direct reply to reply
        /// (Only accessible, if related blog and post are unlocked)
        pub fn create_reply(
            origin,
            blog_id: T::BlogId,
            post_id: T::PostId,
            reply_id: Option<T::ReplyId>,
            text: Vec<u8>
        ) -> dispatch::Result {
            let reply_owner = Self::get_participant(origin)?;

            // Ensure blog with given id exists
            let blog = Self::ensure_blog_exists(blog_id)?;

            // Ensure blog unlocked, so mutations can be performed
            Self::ensure_blog_unlocked(&blog)?;

            // Ensure post with given id exists
            let post = Self::ensure_post_exists(blog_id, post_id)?;

            // Ensure post unlocked, so mutations can be performed
            Self::ensure_post_unlocked(&post)?;

            // Ensure reply text length is valid
            Self::ensure_reply_text_is_valid(&text)?;

            let current_block_number = <system::Module<T>>::block_number();

            if let Some(reply_id) = reply_id {
                // Check parent reply existance in case of direct reply
                let reply = Self::ensure_reply_exists(blog_id, post_id, reply_id)?;
                // Ensure, maximum number direct replies per reply limit not reached
                Self::ensure_direct_replies_limit_not_reached(&reply)?;
                // Ensure maximum number of consecutive replies in time limit not reached
                let last_direct_replies_count = reply.calculate_last_direct_replies_count(current_block_number);
                Self::ensure_consecutive_replies_limit_not_reached(last_direct_replies_count)?;
            } else {
                // Ensure root replies limit not reached
                Self::ensure_replies_limit_not_reached(&post)?;
                // Ensure maximum number of consecutive replies in time limit not reached
                let last_root_replies_count = post.calculate_last_root_replies_count(current_block_number);
                Self::ensure_consecutive_replies_limit_not_reached(last_root_replies_count)?;
            };
            
            //
            // == MUTATION SAFE ==
            //

            // New reply creation
            let reply = Reply::<T>::new(text, reply_owner);

            // Update runtime storage with new reply
            let post_replies_count = post.replies_count();
            <ReplyById<T>>::insert((blog_id, post_id), post_replies_count, reply);

            // Increment replies counter, associated with given post
            <PostById<T>>::mutate(blog_id, post_id, |inner_post| inner_post.increment_replies_counter());

            if let Some(reply_id) = reply_id {
                <ReplyById<T>>::mutate((blog_id, post_id), reply_id, |inner_reply|  {
                    inner_reply.add_last_direct_reply(current_block_number);
                });
                // Trigger event
                Self::deposit_event(RawEvent::DirectReplyCreated(reply_owner, blog_id, post_id, reply_id, post_replies_count));
            } else {
                <PostById<T>>::mutate(blog_id, post_id, |inner_post|  {
                    inner_post.add_last_root_reply(current_block_number);
                });
                // Trigger event
                Self::deposit_event(RawEvent::ReplyCreated(reply_owner, blog_id, post_id, post_replies_count));
            }
            Ok(())
        }

        /// Reply owner can edit reply with a new text
        /// (Only accessible, if related blog and post are unlocked)
        pub fn edit_reply(
            origin,
            blog_id: T::BlogId,
            post_id: T::PostId,
            reply_id: T::ReplyId,
            new_text: Vec<u8>
        ) -> dispatch::Result {
            let reply_owner = Self::get_participant(origin)?;

            // Ensure blog with given id exists
            let blog = Self::ensure_blog_exists(blog_id)?;

            // Ensure blog unlocked, so mutations can be performed
            Self::ensure_blog_unlocked(&blog)?;

            // Ensure post with given id exists
            let post = Self::ensure_post_exists(blog_id, post_id)?;

            // Ensure post unlocked, so mutations can be performed
            Self::ensure_post_unlocked(&post)?;

            // Ensure reply with given id exists
            let reply = Self::ensure_reply_exists(blog_id, post_id, reply_id)?;

            // Ensure reply -> owner relation exists
            Self::ensure_reply_ownership(&reply, &reply_owner)?;

            // Check security/configuration constraint
            Self::ensure_reply_text_is_valid(&new_text)?;

            //
            // == MUTATION SAFE ==
            //

            // Update reply with new text
            <ReplyById<T>>::mutate((blog_id, post_id), reply_id, |inner_reply| inner_reply.update(new_text));

            // Trigger event
            Self::deposit_event(RawEvent::ReplyEdited(blog_id, post_id, reply_id));
            Ok(())
        }

        /// Submit either post reaction or reply reaction
        /// In case, when you resubmit reaction, it`s status will be changed to an opposite one
        pub fn react(
            origin,
            // reaction index in array
            index: T::ReactionsNumber,
            blog_id: T::BlogId,
            post_id: T::PostId,
            reply_id: Option<T::ReplyId>
        ) {
            let owner = Self::get_participant(origin)?;

            // Ensure index is valid & reaction under given index exists
            Self::ensure_reaction_index_is_valid(index)?;

            // Ensure blog with given id exists
            let blog = Self::ensure_blog_exists(blog_id)?;

            // Ensure blog unlocked, so mutations can be performed
            Self::ensure_blog_unlocked(&blog)?;

            // Ensure post with given id exists
            let post = Self::ensure_post_exists(blog_id, post_id)?;

            // Ensure post unlocked, so mutations can be performed
            Self::ensure_post_unlocked(&post)?;

            // Ensure reply with given id exists
            if let Some(reply_id) = reply_id {
                Self::ensure_reply_exists(blog_id, post_id, reply_id)?;
            }

            //
            // == MUTATION SAFE ==
            //

            if let Some(reply_id) = reply_id {

                // Update reply reactions
                <ReplyById<T>>::mutate((blog_id, post_id), reply_id, |inner_reply| {
                    let reaction_status = inner_reply.update_reactions(&owner, index);

                    // Trigger event
                    Self::deposit_event(RawEvent::ReplyReactionsUpdated(owner, blog_id, post_id, reply_id, index, reaction_status));
                });
            } else {

                // Update post reactions
                <PostById<T>>::mutate(blog_id, post_id, |inner_post| {
                    let reaction_status = inner_post.update_reactions(&owner, index);

                    // Trigger event
                    Self::deposit_event(RawEvent::PostReactionsUpdated(owner, blog_id, post_id, index, reaction_status));
                });
            }
        }

    }
}

impl<T: Trait> Module<T> {
    // Get block owner id from account id
    fn get_blog_owner(origin: T::Origin) -> Result<T::BlogOwnerId, &'static str> {
        let account_id = T::BlogOwnerEnsureOrigin::ensure_origin(origin)?;
        Ok(T::BlogOwnerId::from(account_id))
    }

    // Get block participant id from account id
    fn get_participant(origin: T::Origin) -> Result<T::ParticipantId, &'static str> {
        let account_id = T::ParticipantEnsureOrigin::ensure_origin(origin)?;
        Ok(T::ParticipantId::from(account_id))
    }

    /// Create blog via an extrinsic where access is gated by a dedicated EnsureOrigin runtime trait
    pub fn create_blog(blog_owner_id: T::BlogOwnerId) -> dispatch::Result {
        
        //
        // == MUTATION SAFE ==
        //

        let blogs_count = Self::blogs_count();

        // Create blog
        <BlogById<T>>::insert(blogs_count, Blog::<T>::new(blog_owner_id));

        // Increment overall blogs counter
        <BlogsCount<T>>::mutate(|count| *count += T::BlogId::one());

        // Trigger event
        Self::deposit_event(RawEvent::BlogCreated(blog_owner_id, blogs_count));
        Ok(())
    }

    /// Lock blog to forbid mutations in all posts, related to given blog
    pub fn lock_blog(blog_owner_id: T::BlogOwnerId, blog_id: T::BlogId) -> dispatch::Result {
        // Ensure blog with given id exists
        let blog = Self::ensure_blog_exists(blog_id)?;

        // Ensure blog -> owner relation exists
        Self::ensure_blog_ownership(&blog, &blog_owner_id)?;

        //
        // == MUTATION SAFE ==
        //

        // Update blog lock status, associated with given id
        <BlogById<T>>::mutate(&blog_id, |inner_blog| inner_blog.lock());

        // Trigger event
        Self::deposit_event(RawEvent::BlogLocked(blog_owner_id, blog_id));
        Ok(())
    }

    /// Unlock blog to allow mutations in all posts, related to given blog (If was locked previously)
    pub fn unlock_blog(blog_owner_id: T::BlogOwnerId, blog_id: T::BlogId) -> dispatch::Result {
        // Ensure blog with given id exists
        let blog = Self::ensure_blog_exists(blog_id)?;

        // Ensure blog -> owner relation exists
        Self::ensure_blog_ownership(&blog, &blog_owner_id)?;

        //
        // == MUTATION SAFE ==
        //

        // Update blog lock status, associated with given id
        <BlogById<T>>::mutate(&blog_id, |inner_blog| inner_blog.unlock());
        Self::deposit_event(RawEvent::BlogUnlocked(blog_owner_id, blog_id));
        Ok(())
    }

    /// Flip reaction status under given index and returns the result of that flip.
    /// If there is no reactions under this AccountId entry yet,
    /// initialize a new reactions array and set reaction under given index
    fn mutate_reactions(
        reactions: &mut BTreeMap<T::ParticipantId, Vec<bool>>,
        owner: &T::ParticipantId,
        index: T::ReactionsNumber,
    ) -> bool {
        if let Some(reactions_array) = reactions.get_mut(owner) {
            // Flip reaction value under given index
            reactions_array[index.into() as usize] ^= true;
            reactions_array[index.into() as usize]
        } else {
            // Initialize reactions array with all reactions unset (false)
            let mut reactions_array = vec![false; T::ReactionsMaxNumber::get().into() as usize];
            // Flip reaction value under given index
            reactions_array[index.into() as usize] ^= true;
            reactions.insert(owner.clone(), reactions_array);
            true
        }
    }

    /// Remove all replies block numbers beyond the consecutive replies interval constraint
    fn recalculate_last_replies_count(
        last_replies_block_numbers: &mut Vec<T::BlockNumber>,
        current_block_number: T::BlockNumber,
    ) -> usize {
        // Consider using retain() instead for simplicity
        while matches!(
            last_replies_block_numbers.last(),
            Some(reply_block_number) if T::ConsecutiveRepliesInterval::get() < current_block_number - *reply_block_number
        ) {
            last_replies_block_numbers.pop();
        }
        last_replies_block_numbers.len()
    }

    /// Calculate replies count within consecutive replies interval
    fn calculate_last_replies_count(
        last_replies_block_numbers: &[T::BlockNumber],
        current_block_number: T::BlockNumber,
    ) -> usize {
        last_replies_block_numbers
            .iter()
            .rev()
            .take_while(|reply_block_number| {
                T::ConsecutiveRepliesInterval::get() > current_block_number - **reply_block_number
            })
            .count()
    }

    // Add last reply block number to vector
    fn push_reply_block_number(last_replies_block_numbers: &mut Vec<T::BlockNumber>, block_number: T::BlockNumber) {
        if last_replies_block_numbers.is_empty() {
            last_replies_block_numbers
                .reserve(T::ConsecutiveRepliesMaxNumber::get() as usize);
        }
        last_replies_block_numbers.push(block_number);
    }

    fn ensure_blog_exists(blog_id: T::BlogId) -> Result<Blog<T>, &'static str> {
        ensure!(<BlogById<T>>::exists(blog_id), BLOG_NOT_FOUND);
        Ok(Self::blog_by_id(blog_id))
    }

    fn ensure_post_exists(blog_id: T::BlogId, post_id: T::PostId) -> Result<Post<T>, &'static str> {
        ensure!(<PostById<T>>::exists(blog_id, post_id), POST_NOT_FOUND);
        Ok(Self::post_by_id(blog_id, post_id))
    }

    fn ensure_reply_exists(
        blog_id: T::BlogId,
        post_id: T::PostId,
        reply_id: T::ReplyId,
    ) -> Result<Reply<T>, &'static str> {
        ensure!(
            <ReplyById<T>>::exists((blog_id, post_id), reply_id),
            REPLY_NOT_FOUND
        );
        Ok(Self::reply_by_id((blog_id, post_id), reply_id))
    }

    fn ensure_blog_ownership(
        blog: &Blog<T>,
        blog_owner: &T::BlogOwnerId,
    ) -> Result<(), &'static str> {
        ensure!(blog.is_owner(blog_owner), BLOG_OWNERSHIP_ERROR);
        Ok(())
    }

    fn ensure_reply_ownership(
        reply: &Reply<T>,
        reply_owner: &T::ParticipantId,
    ) -> Result<(), &'static str> {
        ensure!(reply.is_owner(reply_owner), REPLY_OWNERSHIP_ERROR);
        Ok(())
    }

    fn ensure_blog_unlocked(blog: &Blog<T>) -> Result<(), &'static str> {
        ensure!(!blog.is_locked(), BLOG_LOCKED_ERROR);
        Ok(())
    }

    fn ensure_post_unlocked(post: &Post<T>) -> Result<(), &'static str> {
        ensure!(!post.is_locked(), POST_LOCKED_ERROR);
        Ok(())
    }

    fn ensure_post_title_is_valid(title: &[u8]) -> Result<(), &'static str> {
        ensure!(
            title.len() <= T::PostTitleMaxLength::get() as usize,
            POST_TITLE_TOO_LONG
        );
        Ok(())
    }

    fn ensure_post_body_is_valid(body: &[u8]) -> Result<(), &'static str> {
        ensure!(
            body.len() <= T::PostBodyMaxLength::get() as usize,
            POST_BODY_TOO_LONG
        );
        Ok(())
    }

    fn ensure_posts_limit_not_reached(blog: &Blog<T>) -> Result<T::PostId, &'static str> {
        // Get posts count, associated with given blog
        let posts_count = blog.posts_count();

        ensure!(
            posts_count < T::PostsMaxNumber::get().into(),
            POSTS_LIMIT_REACHED
        );

        Ok(posts_count)
    }

    fn ensure_direct_replies_limit_not_reached(reply: &Reply<T>) -> Result<(), &'static str> {
        // Get direct replies count, associated with given reply
        let direct_replies_count = reply.direct_replies_count();

        ensure!(
            direct_replies_count < T::DirectRepliesMaxNumber::get().into(),
            DIRECT_REPLIES_LIMIT_REACHED
        );

        Ok(())
    }

    fn ensure_replies_limit_not_reached(post: &Post<T>) -> Result<(), &'static str> {
        // Get root replies count, associated with given post
        let root_replies_count = post.root_replies_count();

        ensure!(
            root_replies_count < T::RepliesMaxNumber::get().into(),
            REPLIES_LIMIT_REACHED
        );

        Ok(())
    }

    fn ensure_consecutive_replies_limit_not_reached(
        consecutive_replies_count: usize,
    ) -> Result<(), &'static str> {
        ensure!(
            consecutive_replies_count < T::ConsecutiveRepliesMaxNumber::get().into(),
            CONSECUTIVE_REPLIES_LIMIT_REACHED
        );

        Ok(())
    }

    fn ensure_reply_text_is_valid(reply_text: &[u8]) -> Result<(), &'static str> {
        ensure!(
            reply_text.len() <= T::ReplyMaxLength::get() as usize,
            REPLY_TEXT_TOO_LONG
        );
        Ok(())
    }

    fn ensure_reaction_index_is_valid(index: T::ReactionsNumber) -> Result<(), &'static str> {
        ensure!(
            index >= T::ReactionsNumber::zero() && index < T::ReactionsMaxNumber::get(),
            INVALID_REACTION_INDEX
        );
        Ok(())
    }
}

decl_event!(
    pub enum Event<T>
    where
        BlogOwnerId = <T as Trait>::BlogOwnerId,
        ParticipantId = <T as Trait>::ParticipantId,
        BlogId = <T as Trait>::BlogId,
        PostId = <T as Trait>::PostId,
        ReplyId = <T as Trait>::ReplyId,
        ReactionIndex = <T as Trait>::ReactionsNumber,
        Status = bool,
    {
        BlogCreated(BlogOwnerId, BlogId),
        BlogLocked(BlogOwnerId, BlogId),
        BlogUnlocked(BlogOwnerId, BlogId),
        PostCreated(BlogId, PostId),
        PostLocked(BlogId, PostId),
        PostUnlocked(BlogId, PostId),
        PostEdited(BlogId, PostId),
        ReplyCreated(ParticipantId, BlogId, PostId, ReplyId),
        DirectReplyCreated(ParticipantId, BlogId, PostId, ReplyId, ReplyId),
        ReplyEdited(BlogId, PostId, ReplyId),
        PostReactionsUpdated(ParticipantId, BlogId, PostId, ReactionIndex, Status),
        ReplyReactionsUpdated(ParticipantId, BlogId, PostId, ReplyId, ReactionIndex, Status),
    }
);
