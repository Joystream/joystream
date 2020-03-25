#![cfg_attr(not(feature = "std"), no_std)]

use codec::{Codec, Decode, Encode};
use rstd::collections::btree_map::BTreeMap;
use rstd::prelude::*;
use runtime_primitives::traits::{
    EnsureOrigin, MaybeSerialize, Member, One, SimpleArithmetic, Zero,
};
use srml_support::{
    decl_event, decl_module, decl_storage, dispatch, ensure, traits::Get, Parameter,
    StorageDoubleMap, StorageLinkedMap, StorageMap, StorageValue,
};
use system::{self, ensure_signed};

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

    /// The overarching event type.
    type Event: From<Event<Self>> + Into<<Self as system::Trait>::Event>;

    // Security/configuration constraints

    type PostTitleMaxLength: Get<MaxLength>;

    type PostBodyMaxLength: Get<MaxLength>;

    type ReplyMaxLength: Get<MaxLength>;

    type PostsMaxNumber: Get<MaxNumber>;

    type RepliesMaxNumber: Get<MaxNumber>;

    type DirectRepliesMaxNumber: Get<MaxNumber>;

    /// Max number of consecutive (in time) replies to the same post/reply by the same actor
    type ConsecutiveRepliesMaxNumber: Get<MaxConsecutiveRepliesNumber>;

    /// Max cosecutive replies interval in blocks passed
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
    type BlogOwnerId: From<Self::AccountId> + Parameter + Default;

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

#[cfg_attr(feature = "std", derive(Debug))]
#[derive(Encode, Decode, Default, Clone, PartialEq)]
pub struct Blog<T: Trait> {
    // Locking status
    locked: bool,
    // Overall posts counter, associated with blog
    posts_count: T::PostId,
    // Blog owner id, associated with blog owner
    owner: T::BlogOwnerId,
}

impl<T: Trait> Blog<T> {
    fn new(owner: T::BlogOwnerId) -> Self {
        Self {
            // Blog default locking status
            locked: false,
            posts_count: T::PostId::default(),
            owner,
        }
    }

    /// Make all data, associated with this blog immutable
    fn lock(&mut self) {
        self.locked = true;
    }

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

#[derive(Encode, Default, Decode, Clone, PartialEq)]
#[cfg_attr(feature = "std", derive(Debug))]
pub struct Post<T: Trait> {
    // Locking status
    locked: bool,
    title: Vec<u8>,
    body: Vec<u8>,
    // Overall replies counter, associated with post
    replies_count: T::ReplyId,
    // AccountId -> All presented reactions state mapping
    reactions: BTreeMap<T::AccountId, Vec<bool>>,
}

impl<T: Trait> Post<T> {
    fn new(title: Vec<u8>, body: Vec<u8>) -> Self {
        Self {
            // Post default locking status
            locked: false,
            title,
            body,
            replies_count: T::ReplyId::default(),
            reactions: BTreeMap::new(),
        }
    }

    /// Make all data, associated with this post immutable
    fn lock(&mut self) {
        self.locked = true;
    }

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

    /// Increase replies count, associated with given post by 1
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

    /// Update reactions state
    fn update_reactions(&mut self, owner: &T::AccountId, index: T::ReactionsNumber) -> bool {
        mutate_reactions::<T>(&mut self.reactions, owner, index)
    }

    /// Get reactions state, associated with reaction owner
    pub fn get_reactions(&self, owner: &T::AccountId) -> Option<&Vec<bool>> {
        self.reactions.get(owner)
    }

    pub fn get_reactions_map(&self) -> &BTreeMap<T::AccountId, Vec<bool>> {
        &self.reactions
    }
}

/// Enum variant, representing reply`s parent type
#[derive(Encode, Decode, Clone, PartialEq)]
#[cfg_attr(feature = "std", derive(Debug))]
pub enum Parent<T: Trait> {
    Reply(T::ReplyId),
    Post(T::PostId),
}

/// Default parent representation
impl<T: Trait> Default for Parent<T> {
    fn default() -> Self {
        Parent::Post(T::PostId::default())
    }
}

#[derive(Encode, Decode, Clone, Default, PartialEq)]
#[cfg_attr(feature = "std", derive(Debug))]
pub struct Reply<T: Trait> {
    // Reply text content
    text: Vec<u8>,
    // Account id, associated with reply owner
    owner: T::AccountId,
    // Reply`s parent id
    parent_id: Parent<T>,
    // Reply creation block number
    block_number: T::BlockNumber,
    // AccountId -> All presented reactions state mapping
    reactions: BTreeMap<T::AccountId, Vec<bool>>,
}

impl<T: Trait> Reply<T> {
    fn new(text: Vec<u8>, owner: T::AccountId, parent_id: Parent<T>) -> Self {
        Self {
            text,
            owner,
            parent_id,
            block_number: <system::Module<T>>::block_number(),
            reactions: BTreeMap::new(),
        }
    }

    /// Check if account_id is reply owner
    fn is_owner(&self, account_id: &T::AccountId) -> bool {
        self.owner == *account_id
    }

    /// Check if account_id is parent
    fn is_parent(&self, account_id: &Parent<T>) -> bool {
        core::mem::discriminant(&self.parent_id) == core::mem::discriminant(account_id)
    }

    /// Update reply text
    fn update(&mut self, new_text: Vec<u8>) {
        self.text = new_text
    }

    /// Update reactions state
    fn update_reactions(&mut self, owner: &T::AccountId, index: T::ReactionsNumber) -> bool {
        mutate_reactions::<T>(&mut self.reactions, owner, index)
    }

    /// Get reactions state, associated with reaction owner
    pub fn get_reactions(&self, owner: &T::AccountId) -> Option<&Vec<bool>> {
        self.reactions.get(owner)
    }

    pub fn get_reactions_map(&self) -> &BTreeMap<T::AccountId, Vec<bool>> {
        &self.reactions
    }

    /// Return reply creation timestamp
    fn block_number(&self) -> T::BlockNumber {
        self.block_number
    }
}

/// Flips reaction status under given index and returns the result of this flip.
/// If there is no reactions for this AccountId entry yet,
/// initialize a new reactions array and set reaction under given index
fn mutate_reactions<T: Trait>(
    reactions: &mut BTreeMap<T::AccountId, Vec<bool>>,
    owner: &T::AccountId,
    index: T::ReactionsNumber,
) -> bool {
    if let Some(reactions_array) = reactions.get_mut(owner) {
        // Flip reaction value under given index
        reactions_array[index.into() as usize] ^= true;
        reactions_array[index.into() as usize]
    } else {
        let mut reactions_array = vec![false; T::ReactionsMaxNumber::get().into() as usize];
        // Flip reaction value under given index
        reactions_array[index.into() as usize] ^= true;
        reactions.insert(owner.clone(), reactions_array);
        true
    }
}

// Blog`s pallet storage items.
decl_storage! {
    trait Store for Module<T: Trait> as BlogModule {

        // Wrap in option, as default representation can be be qual to newly created one

        /// Maps, representing id => item relationship for blogs, posts and replies related structures

        BlogById get(fn blog_by_id): map T::BlogId => Blog<T>;

        PostById get(fn post_by_id): double_map hasher(blake2_256) T::BlogId, blake2_256(T::PostId) => Post<T>;

        ReplyById get (fn reply_by_id): linked_map (T::BlogId, T::PostId, T::ReplyId) => Reply<T>;

        /// Overall blogs counter

        BlogsCount get(fn blogs_count): T::BlogId;
    }
}

// Blog`s pallet dispatchable functions.
decl_module! {
    pub struct Module<T: Trait> for enum Call where origin: T::Origin {

        // Initializing events
        fn deposit_event() = default;

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

        pub fn edit_post(
            origin,
            blog_id: T::BlogId,
            post_id: T::PostId,
            new_title: Option<Vec<u8>>,
            new_body: Option<Vec<u8>>
        ) -> dispatch::Result {

            // Nothing to edit
            if matches!((&new_title, &new_body), (None, None)) {
                return Ok(())
            }
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

        /// Either root post reply or direct reply to reply
        pub fn create_reply(
            origin,
            blog_id: T::BlogId,
            post_id: T::PostId,
            reply_id: Option<T::ReplyId>,
            text: Vec<u8>
        ) -> dispatch::Result {
            let replier = ensure_signed(origin)?;

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

            // Ensure, that maximum number of consecutive replies in time limit not reached
            Self::ensure_consecutive_replies_limit_not_reached(blog_id, post_id, reply_id)?;

            // New reply creation
            let reply = if let Some(reply_id) = reply_id {

                // Check reply existance in case of direct reply
                Self::ensure_reply_exists(blog_id, post_id, reply_id)?;
                Self::ensure_direct_replies_limit_not_reached(blog_id, post_id, reply_id)?;
                Reply::<T>::new(text, replier.clone(), Parent::Reply(reply_id))
            } else {
                Self::ensure_replies_limit_not_reached(blog_id, post_id)?;
                Reply::<T>::new(text, replier.clone(), Parent::Post(post_id))
            };

            //
            // == MUTATION SAFE ==
            //

            // Update runtime storage with new reply
            let post_replies_count = post.replies_count();
            <ReplyById<T>>::insert((blog_id, post_id, post_replies_count), reply);

            // Increment replies counter, associated with given post
            <PostById<T>>::mutate(blog_id, post_id, |inner_post| inner_post.increment_replies_counter());

            // Trigger event
            if let Some(reply_id) = reply_id {
                Self::deposit_event(RawEvent::DirectReplyCreated(replier, blog_id, post_id, reply_id, post_replies_count));
            } else {
                Self::deposit_event(RawEvent::ReplyCreated(replier, blog_id, post_id, post_replies_count));
            }
            Ok(())
        }

        pub fn edit_reply(
            origin,
            blog_id: T::BlogId,
            post_id: T::PostId,
            reply_id: T::ReplyId,
            new_text: Vec<u8>
        ) -> dispatch::Result {
            let reply_owner = ensure_signed(origin)?;

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
            <ReplyById<T>>::mutate((blog_id, post_id, reply_id), |inner_reply| inner_reply.update(new_text));

            // Trigger event
            Self::deposit_event(RawEvent::ReplyEdited(blog_id, post_id, reply_id));
            Ok(())
        }

        /// Either post reaction or reply reaction
        pub fn react(
            origin,
            // reaction index in array
            index: T::ReactionsNumber,
            blog_id: T::BlogId,
            post_id: T::PostId,
            reply_id: Option<T::ReplyId>
        ) {
            let owner = ensure_signed(origin)?;

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
                <ReplyById<T>>::mutate((blog_id, post_id, reply_id), |inner_reply| {
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
    fn get_blog_owner(origin: T::Origin) -> Result<T::BlogOwnerId, &'static str> {
        let account_id = T::BlogOwnerEnsureOrigin::ensure_origin(origin)?;
        Ok(T::BlogOwnerId::from(account_id))
    }

    pub fn create_blog(origin: T::Origin) -> dispatch::Result {
        let blog_owner = Self::get_blog_owner(origin)?;

        //
        // == MUTATION SAFE ==
        //

        let blogs_count = Self::blogs_count();

        // Create blog
        <BlogById<T>>::insert(blogs_count, Blog::<T>::new(blog_owner.clone()));

        // Increment overall blogs counter
        <BlogsCount<T>>::mutate(|count| *count += T::BlogId::one());

        // Trigger event
        Self::deposit_event(RawEvent::BlogCreated(blog_owner, blogs_count));
        Ok(())
    }

    pub fn lock_blog(origin: T::Origin, blog_id: T::BlogId) -> dispatch::Result {
        let blog_owner = Self::get_blog_owner(origin)?;

        // Ensure blog with given id exists
        let blog = Self::ensure_blog_exists(blog_id)?;

        // Ensure blog -> owner relation exists
        Self::ensure_blog_ownership(&blog, &blog_owner)?;

        //
        // == MUTATION SAFE ==
        //

        // Update blog lock status, associated with given id
        <BlogById<T>>::mutate(&blog_id, |inner_blog| inner_blog.lock());

        // Trigger event
        Self::deposit_event(RawEvent::BlogLocked(blog_owner, blog_id));
        Ok(())
    }

    pub fn unlock_blog(origin: T::Origin, blog_id: T::BlogId) -> dispatch::Result {
        let blog_owner = Self::get_blog_owner(origin)?;

        // Ensure blog with given id exists
        let blog = Self::ensure_blog_exists(blog_id)?;

        // Ensure blog -> owner relation exists
        Self::ensure_blog_ownership(&blog, &blog_owner)?;

        //
        // == MUTATION SAFE ==
        //

        // Update blog lock status, associated with given id
        <BlogById<T>>::mutate(&blog_id, |inner_blog| inner_blog.unlock());
        Self::deposit_event(RawEvent::BlogUnlocked(blog_owner, blog_id));
        Ok(())
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
            <ReplyById<T>>::exists((blog_id, post_id, reply_id)),
            REPLY_NOT_FOUND
        );
        Ok(Self::reply_by_id((blog_id, post_id, reply_id)))
    }

    fn ensure_blog_ownership(
        blog: &Blog<T>,
        blog_owner: &T::BlogOwnerId,
    ) -> Result<(), &'static str> {
        ensure!(blog.is_owner(&blog_owner), BLOG_OWNERSHIP_ERROR);
        Ok(())
    }

    fn ensure_reply_ownership(
        reply: &Reply<T>,
        reply_owner: &T::AccountId,
    ) -> Result<(), &'static str> {
        ensure!(reply.is_owner(&reply_owner), REPLY_OWNERSHIP_ERROR);
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

    /// Get either replies count or direct replies count by given parent post/blog.
    fn get_replies_count(
        blog_id: T::BlogId,
        post_id: T::PostId,
        reply_id: Option<T::ReplyId>,
    ) -> usize {
        // Calculate replies count, iterating through all post
        // related replies and checking if reply parent is given parent post/reply
        <ReplyById<T>>::enumerate()
            // Get replies, related to given post
            .filter(|(id, _)| blog_id == id.0 && post_id == id.1)
            // Get replies, related to given parent
            .filter(|(_, reply)| {
                if let Some(reply_id) = reply_id {
                    reply.is_parent(&Parent::Reply(reply_id))
                } else {
                    reply.is_parent(&Parent::Post(post_id))
                }
            })
            .count()
    }

    fn ensure_direct_replies_limit_not_reached(
        blog_id: T::BlogId,
        post_id: T::PostId,
        reply_id: T::ReplyId,
    ) -> Result<(), &'static str> {
        let direct_replies_count = Self::get_replies_count(blog_id, post_id, Some(reply_id)) as u32;

        ensure!(
            direct_replies_count < T::DirectRepliesMaxNumber::get(),
            DIRECT_REPLIES_LIMIT_REACHED
        );

        Ok(())
    }

    fn ensure_replies_limit_not_reached(
        blog_id: T::BlogId,
        post_id: T::PostId,
    ) -> Result<(), &'static str> {
        let replies_count = Self::get_replies_count(blog_id, post_id, None) as u32;

        ensure!(
            replies_count < T::RepliesMaxNumber::get(),
            REPLIES_LIMIT_REACHED
        );

        Ok(())
    }

    fn get_consecutive_replies_count(
        blog_id: T::BlogId,
        post_id: T::PostId,
        reply_id: Option<T::ReplyId>,
    ) -> usize {
        <ReplyById<T>>::enumerate()
            // Get replies, related to given post
            .filter(|(id, _)| blog_id == id.0 && post_id == id.1)
            // Get replies, related to given parent
            .filter(|(_, reply)| {
                if let Some(reply_id) = reply_id {
                    reply.is_parent(&Parent::Reply(reply_id))
                } else {
                    reply.is_parent(&Parent::Post(post_id))
                }
            })
            // Get all replies, created in given interval
            .filter(|(_, reply)| {
                // Overflow protection
                if <system::Module<T>>::block_number() < T::ConsecutiveRepliesInterval::get()
                {
                    true
                } else { reply.block_number()
                     > <system::Module<T>>::block_number() - T::ConsecutiveRepliesInterval::get()
                }
            })
            .count()
    }

    fn ensure_consecutive_replies_limit_not_reached(
        blog_id: T::BlogId,
        post_id: T::PostId,
        reply_id: Option<T::ReplyId>,
    ) -> Result<(), &'static str> {
        let consecutive_replies_count =
            Self::get_consecutive_replies_count(blog_id, post_id, reply_id);

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
        AccountId = <T as system::Trait>::AccountId,
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
        ReplyCreated(AccountId, BlogId, PostId, ReplyId),
        DirectReplyCreated(AccountId, BlogId, PostId, ReplyId, ReplyId),
        ReplyEdited(BlogId, PostId, ReplyId),
        PostReactionsUpdated(AccountId, BlogId, PostId, ReactionIndex, Status),
        ReplyReactionsUpdated(AccountId, BlogId, PostId, ReplyId, ReactionIndex, Status),
    }
);
