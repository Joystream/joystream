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

impl Post {
    fn new(title: String, body: String) -> Self {
        Self { title, body }
    }
}

// Blog`s pallet storage items.
decl_storage! {
    trait Store for Module<T: Trait> as TemplateModule {

        // Blog Ids set, associated with owner
        BlogIds get(fn blog_ids_by_owner): map T::AccountId => Option<BTreeSet<T::BlogId>>;

        BlogPostIds get(fn blog_post_ids_by_blog_id): map T::BlogId => Option<BTreeSet<T::PostId>>;

        BlogPostReplyIds get (fn blog_post_reply_ids): map (T::BlogId, T::PostId) => Option<BTreeSet<T::ReplyId>>;

        BlogPost get(fn blog_post_by_id): map (T::BlogId, T::PostId) => Option<Post>;

        Reply get (fn reply_by_id): map (T::BlogId, T::PostId, T::ReplyId) => Option<String>;

        BlogLockedStatus get(fn blog_locked): map T::BlogId => bool;

        BlogPostLockedStatus get(fn blog_post_locked): map T::PostId => bool;

        //Reply Ids set, associated with owner
        ReplyIds get (fn reply_ids_by_owner): map T::AccountId => BTreeSet<(T::BlogId, T::PostId, T::ReplyId)>;

        //ReplyLockedStatus get(fn reply_locked): map T::Hash => bool;

        BlogsCount get(fn blogs_count): T::BlogId;

        PostsCount get(fn posts_count_by_blog): map T::BlogId => T::PostId;

        PostRepliesCount get(fn post_replies_count): map (T::BlogId, T::PostId) => T::ReplyId;
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
            let blog_ids_set = Self::blog_ids_by_owner(&blog_owner);
            match blog_ids_set {
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
            let blog_ids_set = Self::blog_ids_by_owner(&blog_owner);
            match blog_ids_set {
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
            let posts_count = Self::posts_count_by_blog(blog_id);
            let blog_ids_set = Self::blog_ids_by_owner(&blog_owner);
            match blog_ids_set {
                Some(blog_ids_set) if blog_ids_set.contains(&blog_id) => {
                    let post = Post::new(title, body);
                    <BlogPostIds<T>>::mutate(blog_id, |post_ids| {
                        if let Some(post_ids) = post_ids {
                            post_ids.insert(posts_count);
                        } else {
                            let mut new_set = BTreeSet::new();
                            new_set.insert(posts_count);
                            *post_ids = Some(new_set);
                        }
                    });
                    <BlogPost<T>>::insert((blog_id, posts_count), post);
                }
                _ => return Err("You doesn`t own blog, associated with this identifier")
            }
            // Blog default locking status
            <BlogPostLockedStatus<T>>::insert(posts_count, false);
            <PostsCount<T>>::mutate(blog_id, |count| *count += T::PostId::one());
            Self::deposit_event(RawEvent::PostCreated(blog_id, posts_count));
            Ok(())
        }
    }
}

decl_event!(
    pub enum Event<T>
    where
        AccountId = <T as system::Trait>::AccountId,
        BlogId = <T as Trait>::BlogId,
        PostId = <T as Trait>::PostId,
    {
        BlogCreated(AccountId, BlogId),
        BlogLocked(AccountId, BlogId),
        BlogUnlocked(AccountId, BlogId),
        PostCreated(BlogId, PostId),
    }
);
