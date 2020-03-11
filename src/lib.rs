#![cfg_attr(not(feature = "std"), no_std)]

use codec::{Codec, Decode, Encode};
use rstd::collections::btree_set::BTreeSet;
use rstd::prelude::*;
use runtime_primitives::traits::{MaybeSerialize, Member, One, SimpleArithmetic};
use srml_support::{
    decl_event, decl_module, decl_storage, dispatch::Result, ensure, Parameter, StorageMap,
    StorageValue,
};
use system::{self, ensure_signed};

/// The pallet's configuration trait.
pub trait Trait: system::Trait {
    // TODO: Add other types and constants required configure this pallet.

    /// The overarching event type.
    type Event: From<Event<Self>> + Into<<Self as system::Trait>::Event>;

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
    title: String,
    body: String,
}

type MaxLengthConstraint = u32;

type MaxNumberConstraint = u32;

type MaxConsecutiveRepliesConstraint = u32;

impl Post {
    fn new(title: String, body: String) -> Self {
        Self { title, body }
    }
}

// Blog`s pallet storage items.
decl_storage! {
    trait Store for Module<T: Trait> as TemplateModule {
        // Security/configuration constraints
        PostHeaderMaxLength get(fn post_header_max_length) config(): MaxLengthConstraint;
        PostBodyMaxLength get(fn post_body_max_length) config(): MaxLengthConstraint;
        ReplyMaxLength get(fn reply_max_length) config(): MaxLengthConstraint;

        PostsMaxNumber get(fn posts_max_number) config(): MaxNumberConstraint;
        RepliesMaxNumber get(fn replies_max_number) config(): MaxNumberConstraint;
        DirectRepliesMaxNumber get(fn direct_replies_max_number) config(): MaxNumberConstraint;

        ConsecutiveRepliesMaxNumber get(fn consecutive_replies_max_number) config(): MaxConsecutiveRepliesConstraint;
        
        // Blog Ids set, associated with owner
        BlogIds get(fn blog_ids_by_owner): map T::AccountId => Option<BTreeSet<T::BlogId>>;

        BlogPostIds get(fn post_ids_by_blog_id): map T::BlogId => Option<BTreeSet<T::PostId>>;

        BlogPostReplyIds get (fn post_reply_ids): map (T::BlogId, T::PostId) => Option<BTreeSet<T::ReplyId>>;

        BlogPost get(fn post_by_id): map (T::BlogId, T::PostId) => Option<Post>;

        Reply get (fn reply_by_id): map (T::BlogId, T::PostId, T::ReplyId) => Option<String>;

        BlogLockedStatus get(fn blog_locked): map T::BlogId => bool;

        PostLockedStatus get(fn blog_post_locked): map (T::BlogId, T::PostId) => bool;

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

        pub fn create_blog(origin) -> Result {
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
            // Blog default locking status
            <BlogLockedStatus<T>>::insert(blogs_count, false);
            <BlogsCount<T>>::mutate(|count| *count += T::BlogId::one());
            Self::deposit_event(RawEvent::BlogCreated(blog_owner, blogs_count));
            Ok(())
        }

        pub fn lock_blog(origin, blog_id: T::BlogId) -> Result {
            let blog_owner = ensure_signed(origin)?;
            ensure!(<BlogIds<T>>::exists(&blog_owner), "AccountId, associated with given blog owner does not found");
            match Self::blog_ids_by_owner(&blog_owner) {
                Some(blog_ids_set) if blog_ids_set.contains(&blog_id) => {
                    <BlogLockedStatus<T>>::mutate(&blog_id, |locked_status| *locked_status = true)
                }
                _ => return Err("You doesn`t own blog, associated with this identifier")
            }
            Self::deposit_event(RawEvent::BlogLocked(blog_owner, blog_id));
            Ok(())
        }

        pub fn unlock_blog(origin, blog_id: T::BlogId) -> Result {
            let blog_owner = ensure_signed(origin)?;
            ensure!(<BlogIds<T>>::exists(&blog_owner), "AccountId, associated with given blog owner does not found");
            match Self::blog_ids_by_owner(&blog_owner) {
                Some(blog_ids_set) if blog_ids_set.contains(&blog_id) => {
                    <BlogLockedStatus<T>>::mutate(&blog_id, |locked_status| *locked_status = false)
                }
                _ => return Err("You doesn`t own blog, associated with this identifier")
            }
            Self::deposit_event(RawEvent::BlogUnlocked(blog_owner, blog_id));
            Ok(())
        }

        pub fn create_post(origin, blog_id: T::BlogId, title: String, body: String) -> Result {
            let blog_owner = ensure_signed(origin)?;
            ensure!(<BlogIds<T>>::exists(&blog_owner), "AccountId, associated with given blog owner does not found");
            ensure!(!Self::blog_locked(blog_id), "Please, unlock your blog before new posts creation");
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
                _ => return Err("You doesn`t own blog, associated with this identifier")
            }
            // Blog default locking status
            <PostLockedStatus<T>>::insert((blog_id, posts_count), false);
            <PostsCount<T>>::mutate(blog_id, |count| *count += T::PostId::one());
            Self::deposit_event(RawEvent::PostCreated(blog_id, posts_count));
            Ok(())
        }

        pub fn lock_post(origin, blog_id: T::BlogId, post_id: T::PostId) -> Result {
            let blog_owner = ensure_signed(origin)?;
            ensure!(<BlogIds<T>>::exists(&blog_owner), "AccountId, associated with given blog owner does not found");
            ensure!(<BlogPost<T>>::exists((blog_id, post_id)), "Post, associated with given blog and post ids does not found");
            match Self::blog_ids_by_owner(&blog_owner) {
                Some(blog_ids_set) if blog_ids_set.contains(&blog_id) => {
                    match Self::post_ids_by_blog_id(&blog_id) {
                        Some(post_ids_set) if post_ids_set.contains(&post_id) => {
                            <PostLockedStatus<T>>::mutate((blog_id, post_id), |locked_status| *locked_status = true)
                        }
                        _ => return Err("You doesn`t own post, associated with this identifier")
                    }
                }
                _ => return Err("You doesn`t own blog, associated with this identifier")
            }
            Self::deposit_event(RawEvent::PostLocked(blog_id, post_id));
            Ok(())
        }

        pub fn unlock_post(origin, blog_id: T::BlogId, post_id: T::PostId) -> Result {
            let blog_owner = ensure_signed(origin)?;
            ensure!(<BlogIds<T>>::exists(&blog_owner), "AccountId, associated with given blog owner does not found");
            ensure!(<BlogPost<T>>::exists((blog_id, post_id)), "Post, associated with given blog and post ids does not found");
            match Self::blog_ids_by_owner(&blog_owner) {
                Some(blog_ids_set) if blog_ids_set.contains(&blog_id) => {
                    match Self::post_ids_by_blog_id(&blog_id) {
                        Some(post_ids_set) if post_ids_set.contains(&post_id) => {
                            <PostLockedStatus<T>>::mutate((blog_id, post_id), |locked_status| *locked_status = false)
                        }
                        _ => return Err("You doesn`t own post, associated with this identifier")
                    }
                }
                _ => return Err("You doesn`t own blog, associated with this identifier")
            }
            Self::deposit_event(RawEvent::PostUnlocked(blog_id, post_id));
            Ok(())
        }

        pub fn edit_post(origin, blog_id: T::BlogId, post_id: T::PostId, new_title: Option<String>, new_body: Option<String>) -> Result {
            let blog_owner = ensure_signed(origin)?;
            ensure!(<BlogIds<T>>::exists(&blog_owner), "AccountId, associated with given blog owner does not found");
            ensure!(!Self::blog_locked(blog_id), "Please, unlock blog before this action!");
            ensure!(!Self::blog_post_locked((blog_id, post_id)), "Please, unlock post before this action!");
            match Self::blog_ids_by_owner(&blog_owner) {
                Some(blog_ids_set) if blog_ids_set.contains(&blog_id) => {
                    match Self::post_ids_by_blog_id(&blog_id) {
                        Some(post_ids_set) if post_ids_set.contains(&post_id) => {
                            <BlogPost<T>>::mutate((blog_id, post_id), |post| {
                                if let Some(post) = post {
                                    Self::update_post(post, new_title, new_body)
                                }
                            });
                        }
                        _ => return Err("You doesn`t own post, associated with this identifier")
                    }
                }
                _ => return Err("You doesn`t own blog, associated with this identifier")
            }
            Self::deposit_event(RawEvent::PostEdited(blog_id, post_id));
            Ok(())
        }

        pub fn create_reply(origin, blog_id: T::BlogId, post_id: T::PostId, reply_text: String) -> Result {
            let replier = ensure_signed(origin)?;
            ensure!(<BlogPostReplyIds<T>>::exists((blog_id, post_id)), "Post, associated with given identificator not found");
            ensure!(!Self::blog_locked(blog_id), "Please, unlock blog before this action!");
            ensure!(!Self::blog_post_locked((blog_id, post_id)), "Please, unlock post before this action!");
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
                _ => return Err("You doesn`t own post, associated with this identifier")
            }
            <RepliesCount<T>>::mutate((blog_id, post_id), |count| *count += T::ReplyId::one());
            Self::deposit_event(RawEvent::ReplyCreated(replier, blog_id, post_id, replies_count));
            Ok(())
        }

        pub fn edit_reply(origin, blog_id: T::BlogId, post_id: T::PostId, reply_id: T::ReplyId, reply_text: String) -> Result {
            let replier = ensure_signed(origin)?;
            ensure!(!Self::blog_locked(blog_id), "Please, unlock blog before this action!");
            ensure!(!Self::blog_post_locked((blog_id, post_id)), "Please, unlock post before this action!");
            match Self::reply_ids_by_owner(&replier) {
                Some(reply_ids_set) if reply_ids_set.contains(&(blog_id, post_id, reply_id)) => {
                    <Reply<T>>::insert((blog_id, post_id, reply_id), reply_text)
                }
                _ => return Err("You doesn`t own reply, associated with this identifier")
            }
            Self::deposit_event(RawEvent::ReplyEdited(blog_id, post_id, reply_id));
            Ok(())
        }
    }
}

impl<T: Trait> Module<T> {
    fn update_post(post: &mut Post, new_title: Option<String>, new_body: Option<String>) {
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
