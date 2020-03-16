#![cfg_attr(not(feature = "std"), no_std)]

use codec::{Codec, Decode, Encode};
use rstd::collections::btree_set::BTreeSet;
use rstd::prelude::*;
use runtime_primitives::traits::{MaybeSerialize, Member, One, SimpleArithmetic};
use srml_support::{
    decl_event, decl_module, decl_storage, dispatch, ensure, traits::Get, Parameter, StorageMap,
    StorageValue,
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
    // TODO: Add other types and constants required configure this pallet.

    /// The overarching event type.
    type Event: From<Event<Self>> + Into<<Self as system::Trait>::Event>;

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

#[derive(Encode, Decode, Default, Clone, PartialEq)]
#[cfg_attr(feature = "std", derive(Debug))]
pub struct Post {
    title: Vec<u8>,
    body: Vec<u8>,
}

impl Post {
    fn new(title: Vec<u8>, body: Vec<u8>) -> Self {
        Self { title, body }
    }
}

// Blog`s pallet storage items.
decl_storage! {
    trait Store for Module<T: Trait> as BlogModule {

        // Blog Ids set, associated with owner
        BlogIds get(fn blog_ids_by_owner): map T::AccountId => Option<BTreeSet<T::BlogId>>;

        BlogPostIds get(fn post_ids_by_blog_id): map T::BlogId => Option<BTreeSet<T::PostId>>;

        BlogPostReplyIds get (fn post_reply_ids): map (T::BlogId, T::PostId) => Option<BTreeSet<T::ReplyId>>;

        BlogPost get(fn post_by_id): map (T::BlogId, T::PostId) => Option<Post>;

        Reply get (fn reply_by_id): map (T::BlogId, T::PostId, T::ReplyId) => Option<Vec<u8>>;

        BlogLockedStatus get(fn blog_locked): map T::BlogId => bool;

        PostLockedStatus get(fn post_locked): map (T::BlogId, T::PostId) => bool;

        //Reply Ids set, associated with owner
        ReplyIds get (fn reply_ids_by_owner): map T::AccountId => Option<BTreeSet<(T::BlogId, T::PostId, T::ReplyId)>>;

        //ReplyLockedStatus get(fn reply_locked): map (T::BlogId, T::PostId, T::ReplyId) => bool;

        BlogsCount get(fn blogs_count): T::BlogId;

        PostsCount get(fn posts_count): map T::BlogId => T::PostId;

        RepliesCount get(fn replies_count): map (T::BlogId, T::PostId) => T::ReplyId;
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
            let blogs_count = Self::blogs_count();
            if <BlogIds<T>>::exists(&blog_owner) {
                <BlogIds<T>>::mutate(&blog_owner, |blog_ids| {
                    if let Some(blog_ids) = blog_ids {
                        blog_ids.insert(blogs_count);
                    }
                })
            } else {
                let mut new_set = BTreeSet::new();
                new_set.insert(blogs_count);
                <BlogIds<T>>::insert(&blog_owner, new_set);
            }
            // Blog locking default status
            <BlogLockedStatus<T>>::insert(blogs_count, false);
            <BlogsCount<T>>::mutate(|count| *count += T::BlogId::one());
            Self::deposit_event(RawEvent::BlogCreated(blog_owner, blogs_count));
            Ok(())
        }

        pub fn lock_blog(origin, blog_id: T::BlogId) -> dispatch::Result {
            let blog_owner = ensure_signed(origin)?;
            ensure!(<BlogIds<T>>::exists(&blog_owner), BLOG_OWNER_NOT_FOUND);
            match Self::blog_ids_by_owner(&blog_owner) {
                Some(blog_ids_set) if blog_ids_set.contains(&blog_id) => {
                    <BlogLockedStatus<T>>::mutate(&blog_id, |locked_status| *locked_status = true)
                }
                _ => return Err(BLOG_OWNERSHIP_ERROR)
            }
            Self::deposit_event(RawEvent::BlogLocked(blog_owner, blog_id));
            Ok(())
        }

        pub fn unlock_blog(origin, blog_id: T::BlogId) -> dispatch::Result {
            let blog_owner = ensure_signed(origin)?;
            ensure!(<BlogIds<T>>::exists(&blog_owner), BLOG_OWNER_NOT_FOUND);
            match Self::blog_ids_by_owner(&blog_owner) {
                Some(blog_ids_set) if blog_ids_set.contains(&blog_id) => {
                    <BlogLockedStatus<T>>::mutate(&blog_id, |locked_status| *locked_status = false)
                }
                _ => return Err(BLOG_OWNERSHIP_ERROR)
            }
            Self::deposit_event(RawEvent::BlogUnlocked(blog_owner, blog_id));
            Ok(())
        }

        pub fn create_post(origin, blog_id: T::BlogId, title: Vec<u8>, body: Vec<u8>) -> dispatch::Result  {
            let blog_owner = ensure_signed(origin)?;
            ensure!(<BlogIds<T>>::exists(&blog_owner), BLOG_OWNER_NOT_FOUND);
            ensure!(!Self::blog_locked(blog_id), BLOG_LOCKED_ERROR);
            // Check security/configuration constraints
            ensure!(title.len() <= T::PostTitleMaxLength::get() as usize, POST_TITLE_TOO_LONG);
            ensure!(body.len() <= T::PostBodyMaxLength::get() as usize, POST_BODY_TOO_LONG);
            if let Some(post_ids) = Self::post_ids_by_blog_id(blog_id) {
                ensure!(post_ids.len() <= T::PostsMaxNumber::get() as usize, POSTS_LIMIT_REACHED)
            }
            let posts_count = Self::posts_count(blog_id);
            match Self::blog_ids_by_owner(&blog_owner) {
                Some(blog_ids_set) if blog_ids_set.contains(&blog_id) => {
                    let post = Post::new(title, body);
                    if <BlogPostIds<T>>::exists(blog_id) {
                        <BlogPostIds<T>>::mutate(blog_id, |post_ids| {
                            if let Some(post_ids) = post_ids {
                                post_ids.insert(posts_count);
                            }
                        });
                    } else {
                        let mut new_set = BTreeSet::new();
                        new_set.insert(posts_count);
                        <BlogPostIds<T>>::insert(blog_id, new_set);
                    }
                    <BlogPost<T>>::insert((blog_id, posts_count), post);
                }
                _ => return Err(BLOG_OWNERSHIP_ERROR)
            }
            // Blog locking default status
            <PostLockedStatus<T>>::insert((blog_id, posts_count), false);
            <PostsCount<T>>::mutate(blog_id, |count| *count += T::PostId::one());
            Self::deposit_event(RawEvent::PostCreated(blog_id, posts_count));
            Ok(())
        }

        pub fn lock_post(origin, blog_id: T::BlogId, post_id: T::PostId) -> dispatch::Result {
            let blog_owner = ensure_signed(origin)?;
            ensure!(<BlogIds<T>>::exists(&blog_owner), BLOG_OWNER_NOT_FOUND);
            ensure!(<BlogPost<T>>::exists((blog_id, post_id)), POST_NOT_FOUND);
            match Self::blog_ids_by_owner(&blog_owner) {
                Some(blog_ids_set) if blog_ids_set.contains(&blog_id) => {
                    // Should always be valid, as given blog -> post relation exists
                    if matches!(Self::post_ids_by_blog_id(&blog_id), Some(post_ids_set) if post_ids_set.contains(&post_id)) {
                        <PostLockedStatus<T>>::mutate((blog_id, post_id), |locked_status| *locked_status = true)
                    }
                }
                _ => return Err(BLOG_OWNERSHIP_ERROR)
            }
            Self::deposit_event(RawEvent::PostLocked(blog_id, post_id));
            Ok(())
        }

        pub fn unlock_post(origin, blog_id: T::BlogId, post_id: T::PostId) -> dispatch::Result {
            let blog_owner = ensure_signed(origin)?;
            ensure!(<BlogIds<T>>::exists(&blog_owner), BLOG_OWNER_NOT_FOUND);
            ensure!(<BlogPost<T>>::exists((blog_id, post_id)), POST_NOT_FOUND);
            match Self::blog_ids_by_owner(&blog_owner) {
                Some(blog_ids_set) if blog_ids_set.contains(&blog_id) => {
                    // Should always be valid, as given blog -> post relation exists
                    if matches!(Self::post_ids_by_blog_id(&blog_id), Some(post_ids_set) if post_ids_set.contains(&post_id)) {
                        <PostLockedStatus<T>>::mutate((blog_id, post_id), |locked_status| *locked_status = false)
                    }
                }
                _ => return Err(BLOG_OWNERSHIP_ERROR)
            }
            Self::deposit_event(RawEvent::PostUnlocked(blog_id, post_id));
            Ok(())
        }

        pub fn edit_post(origin, blog_id: T::BlogId, post_id: T::PostId, new_title: Option<Vec<u8>>, new_body: Option<Vec<u8>>) -> dispatch::Result {
            // Nothing to edit
            if matches!((&new_title, &new_body), (None, None)) {
                return Ok(())
            }
            let blog_owner = ensure_signed(origin)?;
            ensure!(<BlogIds<T>>::exists(&blog_owner), BLOG_OWNER_NOT_FOUND);
            ensure!(<BlogPost<T>>::exists((blog_id, post_id)), POST_NOT_FOUND);
            ensure!(!Self::blog_locked(blog_id), BLOG_LOCKED_ERROR);
            ensure!(!Self::post_locked((blog_id, post_id)), POST_LOCKED_ERROR);
            // Check security/configuration constraints
            if let Some(ref new_title) = new_title {
                ensure!(new_title.len() <= T::PostTitleMaxLength::get() as usize, POST_TITLE_TOO_LONG);
            }
            if let Some(ref new_body) = new_body {
                ensure!(new_body.len() <= T::PostBodyMaxLength::get() as usize, POST_BODY_TOO_LONG);
            }
            match Self::blog_ids_by_owner(&blog_owner) {
                Some(blog_ids_set) if blog_ids_set.contains(&blog_id) => {
                    // Should always be valid, as given blog -> post relation exists
                    if matches!(Self::post_ids_by_blog_id(&blog_id), Some(post_ids_set) if post_ids_set.contains(&post_id)) {
                        <BlogPost<T>>::mutate((blog_id, post_id), |post| {
                            if let Some(post) = post {
                                Self::update_post(post, new_title, new_body)
                            }
                        });
                    }
                }
                _ => return Err(BLOG_OWNERSHIP_ERROR)
            }
            Self::deposit_event(RawEvent::PostEdited(blog_id, post_id));
            Ok(())
        }

        pub fn create_reply(origin, blog_id: T::BlogId, post_id: T::PostId, reply_text: Vec<u8>) -> dispatch::Result {
            let replier = ensure_signed(origin)?;
            ensure!(<BlogPostReplyIds<T>>::exists((blog_id, post_id)), POST_NOT_FOUND);
            ensure!(!Self::blog_locked(blog_id), BLOG_LOCKED_ERROR);
            ensure!(!Self::post_locked((blog_id, post_id)), POST_LOCKED_ERROR);
            // Check security/configuration constraint
            ensure!(reply_text.len() <= T::ReplyMaxLength::get() as usize, REPLY_TEXT_TOO_LONG);
            let replies_count = Self::replies_count((blog_id, post_id));
            match Self::post_ids_by_blog_id(&blog_id) {
                Some(post_ids_set) if post_ids_set.contains(&post_id) => {
                    <BlogPostReplyIds<T>>::mutate((blog_id, post_id), |reply_ids| {
                        if let Some(reply_ids) = reply_ids {
                            reply_ids.insert(replies_count);
                        } else {
                            let mut new_set = BTreeSet::new();
                            new_set.insert(replies_count);
                            *reply_ids = Some(new_set);
                        }
                    });
                    <Reply<T>>::insert((blog_id, post_id, replies_count), reply_text);
                    if <ReplyIds<T>>::exists(&replier) {
                        <ReplyIds<T>>::mutate(&replier, |reply_ids| {
                            if let Some(reply_ids) = reply_ids {
                                reply_ids.insert((blog_id, post_id, replies_count));
                            }
                        })
                    } else {
                        let mut new_set = BTreeSet::new();
                        new_set.insert((blog_id, post_id, replies_count));
                        <ReplyIds<T>>::insert(&replier, new_set);
                    }
                }
                _ => return Err(POST_OWNERSHIP_ERROR)
            }
            <RepliesCount<T>>::mutate((blog_id, post_id), |count| *count += T::ReplyId::one());
            Self::deposit_event(RawEvent::ReplyCreated(replier, blog_id, post_id, replies_count));
            Ok(())
        }

        pub fn edit_reply(origin, blog_id: T::BlogId, post_id: T::PostId, reply_id: T::ReplyId, reply_text: Vec<u8>) -> dispatch::Result {
            let replier = ensure_signed(origin)?;
            ensure!(!Self::blog_locked(blog_id), BLOG_LOCKED_ERROR);
            ensure!(!Self::post_locked((blog_id, post_id)), POST_LOCKED_ERROR);
            ensure!(<Reply<T>>::exists((blog_id, post_id, reply_id)), REPLY_NOT_FOUND);
            // Check security/configuration constraint
            ensure!(reply_text.len() <= T::ReplyMaxLength::get() as usize, REPLY_TEXT_TOO_LONG);
            match Self::reply_ids_by_owner(&replier) {
                Some(reply_ids_set) if reply_ids_set.contains(&(blog_id, post_id, reply_id)) => {
                    <Reply<T>>::insert((blog_id, post_id, reply_id), reply_text)
                }
                _ => return Err(REPLY_OWNERSHIP_ERROR)
            }
            Self::deposit_event(RawEvent::ReplyEdited(blog_id, post_id, reply_id));
            Ok(())
        }
    }
}

impl<T: Trait> Module<T> {
    fn update_post(post: &mut Post, new_title: Option<Vec<u8>>, new_body: Option<Vec<u8>>) {
        if let Some(new_title) = new_title {
            post.title = new_title
        }
        if let Some(new_body) = new_body {
            post.body = new_body
        }
    }
}

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
        ReplyEdited(BlogId, PostId, ReplyId),
    }
);
