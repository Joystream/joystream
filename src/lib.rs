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
//! use srml_support::{decl_module, dispatch, assert_ok};
//! use system::{self as system, ensure_signed};
//!
//! pub trait Trait: blog_module::Trait {}
//!
//! decl_module! {
//! 	pub struct Module<T: Trait> for enum Call where origin: T::Origin {
//! 		pub fn create_blog(origin) -> dispatch::Result {
//! 			let _sender = ensure_signed(origin)?;
//! 			<blog_module::Module<T>>::create_blog(_sender.into())?;
//! 			Ok(())
//! 		}
//! 	}
//! }
//! # fn main() {}
//! ```

#![cfg_attr(not(feature = "std"), no_std)]

use codec::{Codec, Decode, Encode};
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

// The pallet's configuration trait.
pub trait Trait: system::Trait + Default {
    /// Origin from which blog owner must come.
    type BlogOwnerEnsureOrigin: EnsureOrigin<Self::Origin, Success = Self::BlogOwnerId>;

    /// Origin from which participant must come.
    type ParticipantEnsureOrigin: EnsureOrigin<Self::Origin, Success = Self::ParticipantId>;

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

    /// Type for the blog owner id. 
    type BlogOwnerId: Parameter + Default + Clone + Copy;

    /// Type for the participant id. 
    type ParticipantId: Parameter
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
    
    fn ensure_blog_ownership(origin: Self::Origin, blog_id: Self::BlogId) -> dispatch::Result; 
}

/// Type, representing blog structure
#[cfg_attr(feature = "std", derive(Debug))]
#[derive(Encode, Decode, Default, Clone, PartialEq)]
pub struct Blog<T: Trait> {
    /// Locking status
    locked: bool,
    /// Overall posts counter, associated with blog
    posts_count: T::PostId,
}

impl<T: Trait> Blog<T> {
    /// Create a new blog
    fn new() -> Self {
        Self {
            // Blog default locking status
            locked: false,
            // Set posts count of newly created blog to zero
            posts_count: T::PostId::default(),
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
pub enum ParentId<T: Trait> {	
    Reply(T::ReplyId),	
    Post(T::PostId),	
}	

/// Default parent representation	
impl<T: Trait> Default for ParentId<T> {	
    fn default() -> Self {	
        ParentId::Post(T::PostId::default())	
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
    /// Reply`s parent id	
    parent_id: ParentId<T>,
}

impl<T: Trait> Reply<T> {
    /// Create new reply with given text and owner id
    fn new(text: Vec<u8>, owner: T::ParticipantId, parent_id: ParentId<T>) -> Self {
        Self {
            text,
            owner,
            parent_id,
        }
    }

    /// Check if account_id is parent	
    fn is_parent(&self, account_id: &ParentId<T>) -> bool {	
        core::mem::discriminant(&self.parent_id) == core::mem::discriminant(account_id)	
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
    trait Store for Module<T: Trait> as BlogModule {

        /// Maps, representing id => item relationship for blogs, posts and replies related structures

        /// Blog by unique blog identificator
       
        BlogById get(fn blog_by_id): map T::BlogId => Blog<T>;

        /// Post by unique blog and post identificators
        
        PostById get(fn post_by_id): double_map hasher(blake2_128) T::BlogId, blake2_128(T::PostId) => Post<T>;

        /// Reply by unique blog, post and reply identificators

        ReplyById get (fn reply_by_id): double_map hasher(blake2_128) (T::BlogId, T::PostId), blake2_128(T::ReplyId) => Reply<T>;

        /// Mapping, representing AccountId -> All presented reactions state mapping by unique post or reply identificators.
        
        Reactions get(reactions): double_map hasher(blake2_128) (T::BlogId, T::PostId, Option<T::ReplyId>), blake2_128(T::ParticipantId) => Vec<bool>;

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

            // Ensure blog with given id exists
            let blog = Self::ensure_blog_exists(blog_id)?;

            // Ensure blog -> owner relation exists
            T::ensure_blog_ownership(origin, blog_id)?;

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

            // Ensure blog with given id exists
            Self::ensure_blog_exists(blog_id)?;

            // Ensure blog -> owner relation exists
            T::ensure_blog_ownership(origin, blog_id)?;

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

            // Ensure blog with given id exists
            let blog = Self::ensure_blog_exists(blog_id)?;

            // Ensure blog -> owner relation exists
            T::ensure_blog_ownership(origin, blog_id)?;

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
            
            // Ensure blog with given id exists
            let blog = Self::ensure_blog_exists(blog_id)?;

            // Ensure blog -> owner relation exists
            T::ensure_blog_ownership(origin, blog_id)?;

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

            // Ensure root replies limit not reached
            Self::ensure_replies_limit_not_reached(&post)?;

            // New reply creation
            let reply = if let Some(reply_id) = reply_id {
                // Check parent reply existance in case of direct reply
                Self::ensure_reply_exists(blog_id, post_id, reply_id)?;
                Reply::<T>::new(text, reply_owner, ParentId::Reply(reply_id))	
            } else {
                Reply::<T>::new(text, reply_owner, ParentId::Post(post_id))	
            };
            
            //
            // == MUTATION SAFE ==
            //

            // Update runtime storage with new reply
            let post_replies_count = post.replies_count();
            <ReplyById<T>>::insert((blog_id, post_id), post_replies_count, reply);

            // Increment replies counter, associated with given post
            <PostById<T>>::mutate(blog_id, post_id, |inner_post| inner_post.increment_replies_counter());

            if let Some(reply_id) = reply_id {
                // Trigger event
                Self::deposit_event(RawEvent::DirectReplyCreated(reply_owner, blog_id, post_id, reply_id, post_replies_count));
            } else {
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

            // Update reply`s reactions
            <Reactions<T>>::mutate((blog_id, post_id, reply_id), owner, |inner_reactions| {
                let reaction_status = Self::mutate_reactions(inner_reactions, index);
                // Trigger event
                if let Some(reply_id) = reply_id {
                    Self::deposit_event(RawEvent::ReplyReactionsUpdated(owner, blog_id, post_id, reply_id, index, reaction_status));
                } else {
                    Self::deposit_event(RawEvent::PostReactionsUpdated(owner, blog_id, post_id, index, reaction_status));
                }
            });
        }

    }
}

impl<T: Trait> Module<T> {

    // Get participant id from origin
    fn get_participant(origin: T::Origin) -> Result<T::ParticipantId, &'static str> {
        Ok(T::ParticipantEnsureOrigin::ensure_origin(origin)?)
    }

    /// Create blog, access is gated by a dedicated EnsureOrigin runtime trait
    pub fn create_blog(blog_owner_id: T::BlogOwnerId) -> dispatch::Result {
        
        //
        // == MUTATION SAFE ==
        //

        let blogs_count = Self::blogs_count();

        // Create blog
        <BlogById<T>>::insert(blogs_count, Blog::<T>::new());

        // Increment overall blogs counter
        <BlogsCount<T>>::mutate(|count| *count += T::BlogId::one());

        // Trigger event
        Self::deposit_event(RawEvent::BlogCreated(blog_owner_id, blogs_count));
        Ok(())
    }

    /// Lock blog to forbid mutations in all posts, related to given blog
    pub fn lock_blog(blog_owner_id: T::BlogOwnerId, blog_id: T::BlogId) -> dispatch::Result {

        // Ensure blog with given id exists
        Self::ensure_blog_exists(blog_id)?;

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
        Self::ensure_blog_exists(blog_id)?;

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
        reactions: &mut Vec<bool>,
        index: T::ReactionsNumber,
    ) -> bool {
        if !reactions.is_empty() {
            // Flip reaction value under given index
            reactions[index.into() as usize] ^= true;
            reactions[index.into() as usize]
        } else {
            // Initialize reactions array with all reactions unset (false)
            *reactions = vec![false; T::ReactionsMaxNumber::get().into() as usize];
            // Flip reaction value under given index
            reactions[index.into() as usize] ^= true;
            true
        }
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

    // fn ensure_blog_ownership(
    //     blog: &Blog<T>,
    //     blog_owner: &T::BlogOwnerId,
    // ) -> Result<(), &'static str> {
    //     ensure!(blog.is_owner(blog_owner), BLOG_OWNERSHIP_ERROR);
    //     Ok(())
    // }

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

    fn ensure_replies_limit_not_reached(post: &Post<T>) -> Result<(), &'static str> {
        // Get replies count, associated with given post
        let root_replies_count = post.replies_count();

        ensure!(
            root_replies_count < T::RepliesMaxNumber::get().into(),
            REPLIES_LIMIT_REACHED
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
