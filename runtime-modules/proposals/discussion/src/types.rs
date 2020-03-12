use crate::Trait;

use codec::{Decode, Encode};
#[cfg(feature = "std")]
use serde::{Deserialize, Serialize};

use rstd::marker::PhantomData;
use rstd::prelude::*;

use system::ensure_signed;

/// Represents a discussion thread
#[cfg_attr(feature = "std", derive(Serialize, Deserialize, Debug))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq)]
pub struct Thread<ThreadAuthorId, BlockNumber> {
    /// Title
    pub title: Vec<u8>,

    /// When thread was established.
    pub created_at: BlockNumber,

    /// Author of the thread.
    pub author_id: ThreadAuthorId,
}

/// Post for the discussion thread
#[cfg_attr(feature = "std", derive(Serialize, Deserialize, Debug))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq)]
pub struct Post<PostAuthorId, BlockNumber, ThreadId> {
    /// Text
    pub text: Vec<u8>,

    /// When post was added.
    pub created_at: BlockNumber,

    /// When post was updated last time.
    pub updated_at: BlockNumber,

    /// Author of the post.
    pub author_id: PostAuthorId,

    /// Parent thread id for this post
    pub thread_id: ThreadId,

    /// Defines how many times this post was edited. Zero on creation.
    pub edition_number: u32,
}

/// Post for the discussion thread
#[cfg_attr(feature = "std", derive(Serialize, Deserialize, Debug))]
#[derive(Encode, Decode, Default, Clone, Copy, PartialEq, Eq)]
pub struct ThreadCounter<ThreadAuthorId> {
    /// Author of the threads.
    pub author_id: ThreadAuthorId,

    /// ThreadCount
    pub counter: u32,
}

impl<ThreadAuthorId: Clone> ThreadCounter<ThreadAuthorId> {
    /// Increments existing counter
    pub fn increment(&self) -> Self {
        ThreadCounter {
            counter: self.counter + 1,
            author_id: self.author_id.clone(),
        }
    }

    /// Creates new counter by author_id. Counter instantiated with 1.
    pub fn new(author_id: ThreadAuthorId) -> Self {
        ThreadCounter {
            author_id,
            counter: 1,
        }
    }
}

/// Abstract validator for the origin(account_id) and actor_id (eg.: thread author id).
pub trait ActorOriginValidator<Origin, ActorId> {
    /// Check for valid combination of origin and actor_id
    fn validate_actor_origin(origin: Origin, actor_id: ActorId) -> bool;
}

// Member of the Joystream organization
pub(crate) type MemberId<T> = <T as membership::members::Trait>::MemberId;

/// Default discussion system actor origin validator. Valid for both thread and post authors.
pub struct ThreadPostActorOriginValidator<T> {
    marker: PhantomData<T>,
}

impl<T> ThreadPostActorOriginValidator<T> {
    /// Create ThreadPostActorOriginValidator instance
    pub fn new() -> Self {
        ThreadPostActorOriginValidator {
            marker: PhantomData,
        }
    }
}

impl<T: Trait> ActorOriginValidator<<T as system::Trait>::Origin, MemberId<T>>
    for ThreadPostActorOriginValidator<T>
{
    /// Check for valid combination of origin and actor_id. Actor_id should be valid member_id of
    /// the membership module
    fn validate_actor_origin(origin: <T as system::Trait>::Origin, actor_id: MemberId<T>) -> bool {
        let account_id_result = ensure_signed(origin);

        //todo : modify to Result and rename to ensure

        // check valid signed account_id
        if let Ok(account_id) = account_id_result {
            // check whether actor_id belongs to the registered member
            let profile_result = <membership::members::Module<T>>::ensure_profile(actor_id);

            if let Ok(profile) = profile_result {
                // whether the account_id belongs to the actor
                return profile.root_account == account_id
                    || profile.controller_account == account_id;
            }
        }

        false
    }
}
