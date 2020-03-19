#![cfg_attr(not(feature = "std"), no_std)]

use codec::{Codec, Decode, Encode};
use rstd::prelude::*;
use runtime_primitives::traits::{MaybeSerialize, Member, One, SimpleArithmetic};
use srml_support::{
    decl_event, decl_module, decl_storage, dispatch, ensure, traits::Get, Parameter, StorageLinkedMap, StorageMap, StorageValue,
};
use system::{self, ensure_signed};

mod error_messages;
mod mock;
mod tests;

use error_messages::*;

type MaxLength = u32;

type MaxNumber = u32;

type MaxConsecutiveRepliesNumber = u16;

/// The pallet's configuration trait.
pub trait Trait: system::Trait {

    /// The overarching event type.
    type Event: From<Event<Self>> + Into<<Self as system::Trait>::Event>;

    //Security/configuration constraints
    type PostTitleMaxLength: Get<MaxLength>;

    type PostBodyMaxLength: Get<MaxLength>;

    type ReplyMaxLength: Get<MaxLength>;

    type PostsMaxNumber: Get<MaxNumber>;

    type RepliesMaxNumber: Get<MaxNumber>;

    type DirectRepliesMaxNumber: Get<MaxNumber>;

    type ConsecutiveRepliesMaxNumber: Get<MaxConsecutiveRepliesNumber>;

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

#[derive(Encode, Decode, Clone, PartialEq)]
#[cfg_attr(feature = "std", derive(Debug))]
pub struct Blog <T: Trait> {
    locked: bool,
    // Overall posts counter, associated with blog
    posts_count: T::PostId,
    owner: T::AccountId
}

impl <T: Trait> Blog <T> {

    fn new(owner: T::AccountId) -> Self {
        Self {
            // Blog default locking status
            locked: false,
            posts_count: T::PostId::default(),
            owner
        }
    }

    fn lock(&mut self) {
        self.locked = true;
    }

    fn unlock(&mut self) {
        self.locked = false;
    }

    fn is_locked(&self) -> bool {
        self.locked
    }

    fn is_owner(&self, account_id: &T::AccountId) -> bool {
        self.owner == *account_id
    }

    fn posts_count(&self) ->  T::PostId {
        self.posts_count
    }

    // Increases posts count, associated with given blog by 1
    fn increment_posts_counter(&mut self) {
        self.posts_count += T::PostId::one()
    }
}

#[derive(Encode, Decode, Clone, PartialEq)]
#[cfg_attr(feature = "std", derive(Debug))]
pub struct Post <T: Trait> {
    locked: bool,
    title: Vec<u8>,
    body: Vec<u8>,
    // Overall replies counter, associated with post
    replies_count: T::ReplyId
}

impl <T: Trait> Post <T> {
    fn new(title: Vec<u8>, body: Vec<u8>) -> Self {
        Self { 
            // Post default locking status
            locked: false,
            title, 
            body,
            replies_count: T::ReplyId::default()
        }
    }

    fn lock(&mut self) {
        self.locked = true;
    }

    fn unlock(&mut self) {
        self.locked = false;
    }

    fn is_locked(&self) -> bool {
        self.locked
    }

    fn replies_count(&self) ->  T::ReplyId {
        self.replies_count
    }

    // Increases replies count, associated with given post by 1
    fn increment_replies_counter(&mut self) {
        self.replies_count += T::ReplyId::one()
    }

    fn update(&mut self, new_title: Option<Vec<u8>>, new_body: Option<Vec<u8>>) {
        if let Some(new_title) = new_title {
            self.title = new_title
        }
        if let Some(new_body) = new_body {
            self.body = new_body
        }
    }
}

// Enum variant, representing reply`s parent type
#[derive(Encode, Decode, Clone, PartialEq)]
#[cfg_attr(feature = "std", derive(Debug))]
pub enum Parent <T: Trait> {
    Reply(T::ReplyId),
    Post(T::PostId)
}

#[derive(Encode, Decode, Clone, PartialEq)]
#[cfg_attr(feature = "std", derive(Debug))]
pub struct Reply <T: Trait> {
    text: Vec<u8>,
    owner: T::AccountId,
    // Reply`s parent id
    parent_id: Parent<T>,
}

impl <T: Trait> Reply <T> {
    fn new(text: Vec<u8>, owner: T::AccountId, parent_id: Parent<T>) -> Self {
        Self { 
            text,
            owner,
            parent_id
        }
    }

    fn is_owner(&self, account_id: &T::AccountId) -> bool {
        self.owner == *account_id
    }

    fn is_parent(&self, parent_id: &Parent<T>) -> bool {
        core::mem::discriminant(&self.parent_id) == core::mem::discriminant(parent_id)
    }

    fn update(&mut self, new_text: Vec<u8>) {
        self.text = new_text
    }
}

// Blog`s pallet storage items.
decl_storage! {
    trait Store for Module<T: Trait> as BlogModule {

        // Wrap in option, as default representation can be be qual to newly created one
        
        // Maps, representing id => item relationship for blogs, posts and replies related structures

        BlogById get(fn blog_by_id): map T::BlogId => Option<Blog<T>>;

        PostById get(fn post_by_id): map (T::BlogId, T::PostId) => Option<Post<T>>;

        ReplyById get (fn reply_by_id): linked_map (T::BlogId, T::PostId, T::ReplyId) => Option<Reply<T>>;

        // Overall blogs counter

        BlogsCount get(fn blogs_count): T::BlogId;
    }
}

// Blog`s pallet dispatchable functions.
decl_module! {
    pub struct Module<T: Trait> for enum Call where origin: T::Origin {
        // Initializing events
        fn deposit_event() = default;

        // Security/configuration constraints
        const POST_TITLE_MAX_LENGTH: MaxLength = T::PostTitleMaxLength::get();

        const POST_BODY_MAX_LENGTH: MaxLength = T::PostBodyMaxLength::get();

        const REPLY_MAX_LENGTH: MaxLength = T::ReplyMaxLength::get();


        const POSTS_MAX_NUMBER: MaxNumber = T::PostsMaxNumber::get();

        const REPLIES_MAX_NUMBER: MaxNumber  = T::RepliesMaxNumber::get();

        const DIRECT_REPLIES_MAX_NUMBER: MaxNumber = T::DirectRepliesMaxNumber::get();

        const CONSECUTIVE_REPLIES_MAX_NUMBER: MaxConsecutiveRepliesNumber = T::ConsecutiveRepliesMaxNumber::get();

        pub fn create_blog(origin) -> dispatch::Result {
            let blog_owner = ensure_signed(origin)?;

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

        pub fn lock_blog(origin, blog_id: T::BlogId) -> dispatch::Result {
            let blog_owner = ensure_signed(origin)?;

            // Ensure blog with given id exists
            let mut blog = Self::ensure_blog_exists(blog_id)?;

            // Ensure blog -> owner relation exists
            Self::ensure_blog_ownership(&blog, &blog_owner)?;

            //
            // == MUTATION SAFE ==
            //

            blog.lock();

            // Update blog lock status, associated with given id
            <BlogById<T>>::mutate(&blog_id, |inner_blog| *inner_blog = Some(blog));

            // Trigger event
            Self::deposit_event(RawEvent::BlogLocked(blog_owner, blog_id));
            Ok(())
        }

        pub fn unlock_blog(origin, blog_id: T::BlogId) -> dispatch::Result {
            let blog_owner = ensure_signed(origin)?;

            // Ensure blog with given id exists
            let mut blog = Self::ensure_blog_exists(blog_id)?;

            // Ensure blog -> owner relation exists
            Self::ensure_blog_ownership(&blog, &blog_owner)?;

            //
            // == MUTATION SAFE ==
            //
        
            blog.unlock();

            // Update blog lock status, associated with given id
            <BlogById<T>>::mutate(&blog_id, |inner_blog| *inner_blog = Some(blog));
            Self::deposit_event(RawEvent::BlogUnlocked(blog_owner, blog_id));
            Ok(())
        }

        pub fn create_post(origin, blog_id: T::BlogId, title: Vec<u8>, body: Vec<u8>) -> dispatch::Result  {
            let blog_owner = ensure_signed(origin)?;

            // Ensure blog with given id exists
            let mut blog = Self::ensure_blog_exists(blog_id)?;

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
            <PostById<T>>::insert((blog_id, posts_count), post);

            // Increment blog posts counter, associated with given blog
            blog.increment_posts_counter();
            <BlogById<T>>::mutate(blog_id, |inner_blog| *inner_blog = Some(blog));

            // Trigger event
            Self::deposit_event(RawEvent::PostCreated(blog_id, posts_count));
            Ok(())
        }

        pub fn lock_post(origin, blog_id: T::BlogId, post_id: T::PostId) -> dispatch::Result {
            let blog_owner = ensure_signed(origin)?;

            // Ensure blog with given id exists
            let blog = Self::ensure_blog_exists(blog_id)?;

            // Ensure blog -> owner relation exists
            Self::ensure_blog_ownership(&blog, &blog_owner)?;

            // Ensure post with given id exists
            let mut post = Self::ensure_post_exists(blog_id, post_id)?;

            //
            // == MUTATION SAFE ==
            //

            post.lock();

            // Update post lock status, associated with given id
            <PostById<T>>::mutate((blog_id, post_id), |new_post| *new_post = Some(post));

            // Trigger event
            Self::deposit_event(RawEvent::PostLocked(blog_id, post_id));
            Ok(())
        }

        pub fn unlock_post(origin, blog_id: T::BlogId, post_id: T::PostId) -> dispatch::Result {
            let blog_owner = ensure_signed(origin)?;

            // Ensure blog with given id exists
            let blog = Self::ensure_blog_exists(blog_id)?;

            // Ensure blog -> owner relation exists
            Self::ensure_blog_ownership(&blog, &blog_owner)?;

            // Ensure post with given id exists
            let mut post = Self::ensure_post_exists(blog_id, post_id)?;

            //
            // == MUTATION SAFE ==
            //

            post.unlock();

            // Update post lock status, associated with given id
            <PostById<T>>::mutate((blog_id, post_id), |new_post| *new_post = Some(post));

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
            let blog_owner = ensure_signed(origin)?;

            // Ensure blog with given id exists
            let blog = Self::ensure_blog_exists(blog_id)?;

            // Ensure blog -> owner relation exists
            Self::ensure_blog_ownership(&blog, &blog_owner)?;

            // Ensure blog unlocked, so mutations can be performed
            Self::ensure_blog_unlocked(&blog)?;

            // Ensure post with given id exists
            let mut post = Self::ensure_post_exists(blog_id, post_id)?;

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
            post.update(new_title, new_body);
            <PostById<T>>::mutate((blog_id, post_id), |inner_post|  *inner_post = Some(post));

            // Trigger event
            Self::deposit_event(RawEvent::PostEdited(blog_id, post_id));
            Ok(())
        }

        // Either root post reply or direct reply to reply
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
            let mut post = Self::ensure_post_exists(blog_id, post_id)?;

            // Ensure post unlocked, so mutations can be performed
            Self::ensure_post_unlocked(&post)?;

            // Ensure reply text length is valid
            Self::ensure_reply_text_is_valid(&text)?;

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
            post.increment_replies_counter();

            // Update post related runtime storage 
            <PostById<T>>::mutate((blog_id, post_id), |new_post| *new_post = Some(post));

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
            let mut reply = Self::ensure_reply_exists(blog_id, post_id, reply_id)?;

            // Ensure reply -> owner relation exists
            Self::ensure_reply_ownership(&reply, &reply_owner)?;

            // Check security/configuration constraint
            Self::ensure_reply_text_is_valid(&new_text)?;
            
            //
            // == MUTATION SAFE ==
            //
        
            // Update reply with new text 
            reply.update(new_text);
            // Update reply related runtime storage
            <ReplyById<T>>::mutate((blog_id, post_id, reply_id), |inner_reply| *inner_reply = Some(reply));

            // Trigger event
            Self::deposit_event(RawEvent::ReplyEdited(blog_id, post_id, reply_id));
            Ok(())
        }
    }
}

impl<T: Trait> Module<T> {

    fn ensure_blog_exists(blog_id: T::BlogId) -> Result<Blog<T>, &'static str>  {
        Self::blog_by_id(blog_id).ok_or(BLOG_NOT_FOUND)
    }

    fn ensure_post_exists(blog_id: T::BlogId, post_id: T::PostId) -> Result<Post<T>, &'static str>  {
        Self::post_by_id((blog_id, post_id)).ok_or(POST_NOT_FOUND)
    }

    fn ensure_reply_exists(blog_id: T::BlogId, post_id: T::PostId, reply_id: T::ReplyId) -> Result<Reply<T>, &'static str>  {
        Self::reply_by_id((blog_id, post_id, reply_id)).ok_or(REPLY_NOT_FOUND)
    }

    fn ensure_blog_ownership(blog: &Blog<T>, blog_owner: &T::AccountId) -> Result<(), &'static str>  {
        ensure!(
            blog.is_owner(&blog_owner),
            BLOG_OWNERSHIP_ERROR
        );
        Ok(())
    }

    fn ensure_reply_ownership(reply: &Reply<T>, reply_owner: &T::AccountId) -> Result<(), &'static str>  {
        ensure!(
            reply.is_owner(&reply_owner),
            REPLY_OWNERSHIP_ERROR
        );
        Ok(())
    }

    fn ensure_blog_unlocked(blog: &Blog<T>) -> Result<(), &'static str> {
        ensure!(
            !blog.is_locked(),
            BLOG_LOCKED_ERROR
        );
        Ok(())
    }

    fn ensure_post_unlocked(post: &Post<T>) -> Result<(), &'static str> {
        ensure!(
            !post.is_locked(),
            POST_LOCKED_ERROR
        );
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

    fn ensure_direct_replies_limit_not_reached(blog_id: T::BlogId, post_id: T::PostId, reply_id: T::ReplyId) -> Result<(), &'static str> {
        
        // Calculate direct replies count, iterating through all post
        // related replies and checking if reply parent is given reply
        let direct_replies_count = <ReplyById<T>>::enumerate()
            .filter(|(id, _)| blog_id == id.0 && post_id == id.1)
            .filter(|(_, reply)| reply.is_parent(&Parent::Reply(reply_id)))
            .count() as u32;

        ensure!(
            direct_replies_count < T::DirectRepliesMaxNumber::get().into(),  
            DIRECT_REPLIES_LIMIT_REACHED
        );

        Ok(())
    }

    fn ensure_replies_limit_not_reached(blog_id: T::BlogId, post_id: T::PostId) -> Result<(), &'static str> {
        
        // Calculate replies count, iterating through all post
        // related replies and checking if reply parent is given post
        let replies_count = <ReplyById<T>>::enumerate()
            .filter(|(id, _)| blog_id == id.0 && post_id == id.1)
            .filter(|(_, reply)| reply.is_parent(&Parent::Post(post_id)))
            .count() as u32;
        ensure!(
            replies_count < T::RepliesMaxNumber::get().into(),  
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
}

//TODO: Some additional information
decl_event!(
    pub enum Event<T>
    where
        AccountId = <T as system::Trait>::AccountId,
        BlogId = <T as Trait>::BlogId,
        PostId = <T as Trait>::PostId,
        ReplyId = <T as Trait>::ReplyId,
    {
        BlogCreated(AccountId, BlogId),
        BlogLocked(AccountId, BlogId),
        BlogUnlocked(AccountId, BlogId),
        PostCreated(BlogId, PostId),
        PostLocked(BlogId, PostId),
        PostUnlocked(BlogId, PostId),
        PostEdited(BlogId, PostId),
        ReplyCreated(AccountId, BlogId, PostId, ReplyId),
        DirectReplyCreated(AccountId, BlogId, PostId, ReplyId, ReplyId),
        ReplyEdited(BlogId, PostId, ReplyId),
    }
);
