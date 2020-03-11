#![cfg_attr(not(feature = "std"), no_std)]

use codec::{Codec, Decode, Encode};
use runtime_primitives::traits::{MaybeSerialize, Member, One, SimpleArithmetic};
use srml_support::{
    decl_event, decl_module, decl_storage, dispatch::Result, Parameter, StorageMap, StorageValue,
};
use system::{self, ensure_signed};
use rstd::collections::btree_set::BTreeSet;
use rstd::prelude::*;

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

// Blog`s pallet storage items.
decl_storage! {
    trait Store for Module<T: Trait> as TemplateModule {

        // Blog Ids set, associated with owner
        BlogIds get(fn blog_ids_by_owner): map T::AccountId => BTreeSet<T::BlogId>;

        BlogPostIds get(fn blog_post_ids_by_blog_id): map T::BlogId => Option<T::PostId>;

        BlogPostReplyIds get (fn blog_post_reply_ids): map (T::BlogId, T::PostId) => Option<BTreeSet<T::ReplyId>>;

        BlogPost get(fn blog_post_by_id): map (T::BlogId, T::PostId) => Post;

        Reply get (fn reply_by_id): map (T::BlogId, T::PostId, T::ReplyId) => String;

        BlogLockedStatus get(fn blog_locked_status): map T::BlogId => bool;

        BlogPostLockedStatus get(fn blog_post_locked_status): map T::PostId => bool;

        //Reply Ids set, associated with owner
        ReplyIds get (fn reply_ids_by_owner): map T::AccountId => BTreeSet<(T::BlogId, T::PostId, T::ReplyId)>;

        //ReplyLockedStatus get(fn reply_locked_status): map T::Hash => bool;

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
                    blog_ids.insert(blogs_count);
                })
            } else {
                let mut new_set = BTreeSet::new();
                new_set.insert(blogs_count);
                <BlogIds<T>>::insert(&blog_owner, new_set);
            }
            Self::deposit_event(RawEvent::BlogCreated(blog_owner, blogs_count));
            <BlogsCount<T>>::mutate(|count| *count += T::BlogId::one());
            Ok(())
        }
    }
}

decl_event!(
    pub enum Event<T>
    where
        AccountId = <T as system::Trait>::AccountId,
        BlogId = <T as Trait>::BlogId,
    {
        // Just a dummy event.
        // Event `Something` is declared with a parameter of the type `u32` and `AccountId`
        // To emit this event, we call the deposit funtion, from our runtime funtions
        BlogCreated(AccountId, BlogId),
    }
);
