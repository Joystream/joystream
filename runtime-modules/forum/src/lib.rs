// Copyright 2017-2019 Parity Technologies (UK) Ltd.

// This is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.

// You should have received a copy of the GNU General Public License
// along with Substrate.  If not, see <http://www.gnu.org/licenses/>.

// Copyright 2019 Joystream Contributors

//! # Runtime Example Module
//!
//! <!-- Original author of paragraph: @gavofyork -->
//! The Example: A simple example of a runtime module demonstrating
//! concepts, APIs and structures common to most runtime modules.
//!
//! Run `cargo doc --package runtime-example-module --open` to view this module's documentation.
//!
//! ### Documentation Template:<br>
//! Add heading with custom module name
//!
//! # <INSERT_CUSTOM_MODULE_NAME> Module
//!
//! Add simple description
//!
//! Include the following links that shows what trait needs to be implemented to use the module
//! and the supported dispatchables that are documented in the Call enum.
//!
//! - [`<INSERT_CUSTOM_MODULE_NAME>::Trait`](./trait.Trait.html)
//! - [`Call`](./enum.Call.html)
//! - [`Module`](./struct.Module.html)
//!
//! ## Overview
//!
//! <!-- Original author of paragraph: Various. See https://github.com/paritytech/substrate-developer-hub/issues/44 -->
//! Short description of module purpose.
//! Links to Traits that should be implemented.
//! What this module is for.
//! What functionality the module provides.
//! When to use the module (use case examples).
//! How it is used.
//! Inputs it uses and the source of each input.
//! Outputs it produces.
//!
//! <!-- Original author of paragraph: @Kianenigma in PR https://github.com/paritytech/substrate/pull/1951 -->
//! <!-- and comment https://github.com/paritytech/substrate-developer-hub/issues/44#issuecomment-471982710 -->
//!
//! ## Terminology
//!
//! Add terminology used in the custom module. Include concepts, storage items, or actions that you think
//! deserve to be noted to give context to the rest of the documentation or module usage. The author needs to
//! use some judgment about what is included. We don't want a list of every storage item nor types - the user
//! can go to the code for that. For example, "transfer fee" is obvious and should not be included, but
//! "free balance" and "reserved balance" should be noted to give context to the module.
//! Please do not link to outside resources. The reference docs should be the ultimate source of truth.
//!
//! <!-- Original author of heading: @Kianenigma in PR https://github.com/paritytech/substrate/pull/1951 -->
//!
//! ## Goals
//!
//! Add goals that the custom module is designed to achieve.
//!
//! <!-- Original author of heading: @Kianenigma in PR https://github.com/paritytech/substrate/pull/1951 -->
//!
//! ### Scenarios
//!
//! <!-- Original author of paragraph: @Kianenigma. Based on PR https://github.com/paritytech/substrate/pull/1951 -->
//!
//! #### <INSERT_SCENARIO_NAME>
//!
//! Describe requirements prior to interacting with the custom module.
//! Describe the process of interacting with the custom module for this scenario and public API functions used.
//!
//! ## Interface
//!
//! ### Supported Origins
//!
//! What origins are used and supported in this module (root, signed, inherent)
//! i.e. root when `ensure_root` used
//! i.e. inherent when `ensure_inherent` used
//! i.e. signed when `ensure_signed` used
//!
//! `inherent` <INSERT_DESCRIPTION>
//!
//! <!-- Original author of paragraph: @Kianenigma in comment -->
//! <!-- https://github.com/paritytech/substrate-developer-hub/issues/44#issuecomment-471982710 -->
//!
//! ### Types
//!
//! Type aliases. Include any associated types and where the user would typically define them.
//!
//! `ExampleType` <INSERT_DESCRIPTION>
//!
//! <!-- Original author of paragraph: ??? -->
//!
//!
//! ### Dispatchable Functions
//!
//! <!-- Original author of paragraph: @AmarRSingh & @joepetrowski -->
//!
//! // A brief description of dispatchable functions and a link to the rustdoc with their actual documentation.
//!
//! <b>MUST</b> have link to Call enum
//! <b>MUST</b> have origin information included in function doc
//! <b>CAN</b> have more info up to the user
//!
//! ### Public Functions
//!
//! <!-- Original author of paragraph: @joepetrowski -->
//!
//! A link to the rustdoc and any notes about usage in the module, not for specific functions.
//! For example, in the balances module: "Note that when using the publicly exposed functions,
//! you (the runtime developer) are responsible for implementing any necessary checks
//! (e.g. that the sender is the signer) before calling a function that will affect storage."
//!
//! <!-- Original author of paragraph: @AmarRSingh -->
//!
//! It is up to the writer of the respective module (with respect to how much information to provide).
//!
//! #### Public Inspection functions - Immutable (getters)
//!
//! Insert a subheading for each getter function signature
//!
//! ##### `example_getter_name()`
//!
//! What it returns
//! Why, when, and how often to call it
//! When it could panic or error
//! When safety issues to consider
//!
//! #### Public Mutable functions (changing state)
//!
//! Insert a subheading for each setter function signature
//!
//! ##### `example_setter_name(origin, parameter_name: T::ExampleType)`
//!
//! What state it changes
//! Why, when, and how often to call it
//! When it could panic or error
//! When safety issues to consider
//! What parameter values are valid and why
//!
//! ### Storage Items
//!
//! Explain any storage items included in this module
//!
//! ### Digest Items
//!
//! Explain any digest items included in this module
//!
//! ### Inherent Data
//!
//! Explain what inherent data (if any) is defined in the module and any other related types
//!
//! ### Events:
//!
//! Insert events for this module if any
//!
//! ### Errors:
//!
//! Explain what generates errors
//!
//! ## Usage
//!
//! Insert 2-3 examples of usage and code snippets that show how to use <INSERT_CUSTOM_MODULE_NAME> module in a custom module.
//!
//! ### Prerequisites
//!
//! Show how to include necessary imports for <INSERT_CUSTOM_MODULE_NAME> and derive
//! your module configuration trait with the `INSERT_CUSTOM_MODULE_NAME` trait.
//!
//! ```rust
//! // use <INSERT_CUSTOM_MODULE_NAME>;
//!
//! // pub trait Trait: <INSERT_CUSTOM_MODULE_NAME>::Trait { }
//! ```
//!
//! ### Simple Code Snippet
//!
//! Show a simple example (e.g. how to query a public getter function of <INSERT_CUSTOM_MODULE_NAME>)
//!
//! ## Genesis Config
//!
//! <!-- Original author of paragraph: @joepetrowski -->
//!
//! ## Dependencies
//!
//! Dependencies on other SRML modules and the genesis config should be mentioned,
//! but not the Rust Standard Library.
//! Genesis configuration modifications that may be made to incorporate this module
//! Interaction with other modules
//!
//! <!-- Original author of heading: @AmarRSingh -->
//!
//! ## Related Modules
//!
//! Interaction with other modules in the form of a bullet point list
//!
//! ## References
//!
//! <!-- Original author of paragraph: @joepetrowski -->
//!
//! Links to reference material, if applicable. For example, Phragmen, W3F research, etc.
//! that the implementation is based on.

// Ensure we're `no_std` when compiling for Wasm.
#![cfg_attr(not(feature = "std"), no_std)]
#![allow(clippy::type_complexity)]

#[cfg(feature = "std")]
use serde_derive::{Deserialize, Serialize};

use codec::{Codec, Decode, Encode};
use rstd::prelude::*;
pub use runtime_io::clear_prefix;
use runtime_primitives::traits::{MaybeSerialize, Member, One, SimpleArithmetic};
use srml_support::{
    decl_error, decl_event, decl_module, decl_storage, ensure, traits::Get, Parameter,
};

mod mock;
mod tests;

pub trait Trait: system::Trait + timestamp::Trait + Sized {
    type Event: From<Event<Self>> + Into<<Self as system::Trait>::Event>;
    type ForumUserId: Parameter
        + Member
        + SimpleArithmetic
        + Codec
        + Default
        + Copy
        + MaybeSerialize
        + PartialEq;

    type ModeratorId: Parameter
        + Member
        + SimpleArithmetic
        + Codec
        + Default
        + Copy
        + MaybeSerialize
        + PartialEq;

    type CategoryId: Parameter
        + Member
        + SimpleArithmetic
        + Codec
        + Default
        + Copy
        + MaybeSerialize
        + PartialEq
        + From<u64>
        + Into<u64>;

    type ThreadId: Parameter
        + Member
        + SimpleArithmetic
        + Codec
        + Default
        + Copy
        + MaybeSerialize
        + PartialEq
        + From<u64>
        + Into<u64>;

    type PostId: Parameter
        + Member
        + SimpleArithmetic
        + Codec
        + Default
        + Copy
        + MaybeSerialize
        + PartialEq
        + From<u64>
        + Into<u64>;

    type PostReactionId: Parameter
        + Member
        + SimpleArithmetic
        + Codec
        + Default
        + Copy
        + MaybeSerialize
        + PartialEq
        + From<u64>
        + Into<u64>;

    type MaxCategoryDepth: Get<u64>;

    fn is_lead(account_id: &<Self as system::Trait>::AccountId) -> bool;
    fn is_forum_member(
        account_id: &<Self as system::Trait>::AccountId,
        forum_user_id: &Self::ForumUserId,
    ) -> bool;
    fn is_moderator(account_id: &Self::AccountId, moderator_id: &Self::ModeratorId) -> bool;

    fn calculate_hash(text: &[u8]) -> Self::Hash;
}

/*
 * MOVE ALL OF THESE OUT TO COMMON LATER
 */

/// Length constraint for input validation
#[cfg_attr(feature = "std", derive(Serialize, Deserialize, Debug))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq)]
pub struct InputValidationLengthConstraint {
    /// Minimum length
    pub min: u16,

    /// Difference between minimum length and max length.
    /// While having max would have been more direct, this
    /// way makes max < min unrepresentable semantically,
    /// which is safer.
    pub max_min_diff: u16,
}

impl InputValidationLengthConstraint {
    /// Helper for computing max
    pub fn max(&self) -> u16 {
        self.min + self.max_min_diff
    }

    pub fn ensure_valid<ErrorType>(
        &self,
        len: usize,
        too_short_msg: ErrorType,
        too_long_msg: ErrorType,
    ) -> Result<(), ErrorType> {
        let length = len as u16;
        if length < self.min {
            Err(too_short_msg)
        } else if length > self.max() {
            Err(too_long_msg)
        } else {
            Ok(())
        }
    }
}

//use srml_support::storage::*;
//use sr_io::{StorageOverlay, ChildrenStorageOverlay};
//#[cfg(feature = "std")]
//use runtime_io::{StorageOverlay, ChildrenStorageOverlay};
//#[cfg(any(feature = "std", test))]
//use sr_primitives::{StorageOverlay, ChildrenStorageOverlay};

use system::ensure_signed;

/// Represents all poll alternatives and vote count for each one
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Clone, PartialEq, Eq, Debug)]
pub struct PollAlternative<Hash> {
    /// hash of alternative description
    pub alternative_text_hash: Hash,

    /// Vote count for the alternative
    pub vote_count: u32,
}

/// Represents a poll
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Clone, PartialEq, Eq, Debug)]
pub struct Poll<Timestamp, Hash> {
    /// hash of description
    pub description_hash: Hash,

    /// timestamp of poll end
    pub end_time: Timestamp,

    /// Alternative description and count
    pub poll_alternatives: Vec<PollAlternative<Hash>>,
}

/// Represents a thread post
#[cfg_attr(feature = "std", derive(Serialize, Deserialize, Debug))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq)]
pub struct Post<ForumUserId, ThreadId, Hash> {
    /// Id of thread to which this post corresponds.
    pub thread_id: ThreadId,

    /// Hash of current text
    pub text_hash: Hash,

    /// Author of post.
    pub author_id: ForumUserId,
}

/// Represents a thread
#[cfg_attr(feature = "std", derive(Serialize, Deserialize, Debug))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq)]
pub struct Thread<ForumUserId, CategoryId, Moment, Hash> {
    /// Title hash
    pub title_hash: Hash,

    /// Category in which this thread lives
    pub category_id: CategoryId,

    /// Author of post.
    pub author_id: ForumUserId,

    /// Whether thread is archived.
    pub archived: bool,

    /// poll description.
    pub poll: Option<Poll<Moment, Hash>>,
}

/// Represents a category
#[cfg_attr(feature = "std", derive(Serialize, Deserialize, Debug))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq)]
pub struct Category<CategoryId, ThreadId, Hash> {
    /// Category identifier
    pub id: CategoryId,

    /// Title
    pub title_hash: Hash,

    /// Description
    pub description_hash: Hash,

    /// Whether category is archived.
    pub archived: bool,

    /// Number of subcategories, needed for emptiness checks when trying to delete category
    pub num_direct_subcategories: u32,

    // Number of threads in category, needed for emptiness checks when trying to delete category
    pub num_direct_threads: u32,

    /// Parent category, if child of another category, otherwise this category is a root category
    pub parent_category_id: Option<CategoryId>,

    /// Sticky threads list
    pub sticky_thread_ids: Vec<ThreadId>,
}

#[derive(Encode, Decode, Clone, PartialEq, Eq)]
pub enum PrivilegedActor<T: Trait> {
    Lead,
    Moderator(T::ModeratorId),
}

impl<T: Trait> core::fmt::Debug for PrivilegedActor<T> {
    fn fmt(&self, formatter: &mut core::fmt::Formatter<'_>) -> core::fmt::Result {
        match self {
            PrivilegedActor::Lead => write!(formatter, "PrivilegedActor {{ Lead }}"),
            PrivilegedActor::Moderator(moderator_id) => {
                write!(formatter, "PrivilegedActor {{ {:?} }}", moderator_id)
            }
        }
    }
}

/// Represents a sequence of categories which have child-parent relatioonship
/// where last element is final ancestor, or root, in the context of the category tree.
type CategoryTreePath<CategoryId, ThreadId, Hash> = Vec<Category<CategoryId, ThreadId, Hash>>;

// TODO: remove when this issue is solved https://github.com/rust-lang/rust-clippy/issues/3381
// temporary type for functions argument
type CategoryTreePathArg<CategoryId, ThreadId, Hash> = [Category<CategoryId, ThreadId, Hash>];

decl_error! {
    /// Forum predefined errors
    #[derive(Copy)]
    pub enum Error {
        /// Origin doesn't correspond to any lead account
        OriginNotForumLead,

        /// Forum user id not match its account.
        ForumUserIdNotMatchAccount,

        /// Moderator id not match its account.
        ModeratorIdNotMatchAccount,

        // Errors about thread.

        /// Thread not authored by the given user.
        AccountDoesNotMatchThreadAuthor,

        /// Thread does not exist
        ThreadDoesNotExist,

        /// Moderator can't moderate category containing thread.
        ModeratorModerateOriginCategory,

        /// Moderator can't moderate destination category.
        ModeratorModerateDestinationCategory,

        /// Origin is the same as the destination.
        ThreadMoveInvalid,

        /// Thread not being updated.
        ThreadNotBeingUpdated,

        /// Thread is immutable, i.e. archived.
        ThreadImmutable,

        // Errors about post.

        /// Post does not exist.
        PostDoesNotExist,

        /// Account does not match post author.
        AccountDoesNotMatchPostAuthor,

        // Errors about category.

        /// Category not being updated.
        CategoryNotBeingUpdated,

        /// Moderator can not moderate category.
        ModeratorModerateCategory,

        /// Ancestor category immutable, i.e. deleted or archived
        AncestorCategoryImmutable,

        /// Maximum valid category depth exceeded.
        MaxValidCategoryDepthExceeded,

        /// Category does not exist.
        CategoryDoesNotExist,

        /// Category still contains some threads.
        CategoryNotEmptyThreads,

        /// Category still contains some subcategories.
        CategoryNotEmptyCategories,

        /// No permissions to delete category.
        ModeratorCantDeleteCategory,

        /// No permissions to update category.
        ModeratorCantUpdateCategory,

        // Errors about poll.

        /// Poll items number too short.
        PollAlternativesTooShort,

        /// Poll items number too long.
        PollAlternativesTooLong,

        /// Poll not exist.
        PollNotExist,

        /// Poll date setting is wrong.
        PollTimeSetting,

        /// Poll data committed is wrong.
        PollData,

        /// Poll data committed after poll expired.
        PollCommitExpired,

        // Error data migration

        /// data migration not done yet.
        DataMigrationNotDone,
    }
}

impl From<system::Error> for Error {
    fn from(error: system::Error) -> Self {
        match error {
            system::Error::Other(msg) => Error::Other(msg),
            system::Error::RequireRootOrigin => Error::OriginNotForumLead,
            _ => Error::Other(error.into()),
        }
    }
}

decl_storage! {
    trait Store for Module<T: Trait> as Forum_1_1 {
        /// Map category identifier to corresponding category.
        pub CategoryById get(category_by_id) config(): map T::CategoryId => Category<T::CategoryId, T::ThreadId, T::Hash>;

        /// Category identifier value to be used for the next Category created.
        pub NextCategoryId get(next_category_id) config(): T::CategoryId;

        /// Map thread identifier to corresponding thread.
        pub ThreadById get(thread_by_id) config(): double_map T::CategoryId, blake2_256(T::ThreadId) => Thread<T::ForumUserId, T::CategoryId, T::Moment, T::Hash>;

        /// Thread identifier value to be used for next Thread in threadById.
        pub NextThreadId get(next_thread_id) config(): T::ThreadId;

        /// Map post identifier to corresponding post.
        pub PostById get(post_by_id) config(): double_map T::ThreadId, blake2_256(T::PostId) => Post<T::ForumUserId, T::ThreadId, T::Hash>;

        /// Post identifier value to be used for for next post created.
        pub NextPostId get(next_post_id) config(): T::PostId;

        /// Moderator set for each Category
        pub CategoryByModerator get(category_by_moderator) config(): double_map T::CategoryId, blake2_256(T::ModeratorId) => ();

        /// Each account 's reaction to a post.
        pub ReactionByPost get(reaction_by_post) config(): double_map T::PostId, blake2_256(T::ForumUserId) => T::PostReactionId;

        /// Input constraints for number of items in poll.
        pub PollItemsConstraint get(poll_items_constraint) config(): InputValidationLengthConstraint;

        /// If data migration is done, set as configible for unit test purpose
        pub DataMigrationDone get(data_migration_done) config(): bool;
    }
}

decl_event!(
    pub enum Event<T>
    where
        <T as Trait>::CategoryId,
        <T as Trait>::ThreadId,
        <T as Trait>::PostId,
        <T as Trait>::ForumUserId,
        <T as Trait>::PostReactionId,
        <T as system::Trait>::Hash,
    {
        /// A category was introduced
        CategoryCreated(CategoryId),

        /// A category with given id was updated.
        /// The second argument reflects the new archival status of the category.
        CategoryUpdated(CategoryId, bool),

        // A category was deleted
        CategoryDeleted(CategoryId),

        /// A thread with given id was created.
        ThreadCreated(ThreadId),

        /// A thread with given id was moderated.
        ThreadModerated(ThreadId, Hash),

        /// A thread with given id was updated.
        /// The second argument reflects the new archival status of the thread.
        ThreadUpdated(ThreadId, bool),

        /// A thread with given id was moderated.
        ThreadTitleUpdated(ThreadId),

        // A thread was deleted.
        ThreadDeleted(ThreadId),

        // A thread was moved to new category
        ThreadMoved(ThreadId, CategoryId),

        /// Post with given id was created.
        PostAdded(PostId),

        /// Post with givne id was moderated.
        PostModerated(PostId, Hash),

        /// Post with given id had its text updated.
        /// The second argument reflects the number of total edits when the text update occurs.
        PostTextUpdated(PostId),

        /// Thumb up post
        PostReacted(ForumUserId, PostId, PostReactionId),

        /// Vote on poll
        VoteOnPoll(ThreadId, u32),

        /// Sticky thread updated for category
        CategoryStickyThreadUpdate(CategoryId, Vec<ThreadId>),
    }
);

decl_module! {
    pub struct Module<T: Trait> for enum Call where origin: T::Origin {
        /// Predefined errors
        type Error = Error;

        fn deposit_event() = default;

        /// Enable a moderator can moderate a category and its sub categories.
        fn update_category_membership_of_moderator(origin, moderator_id: T::ModeratorId, category_id: T::CategoryId, new_value: bool) -> Result<(), Error> {
            // Ensure data migration is done
            Self::ensure_data_migration_done()?;
            clear_prefix(b"Forum ForumUserById");

            // Not signed by forum LEAD
            Self::ensure_is_forum_lead(origin)?;

            // ensure category exists.
            ensure!(
                <CategoryById<T>>::exists(&category_id),
                Error::CategoryDoesNotExist
            );

            if new_value {
                <CategoryByModerator<T>>::insert(category_id, moderator_id, ());
                return Ok(());
            }

            <CategoryByModerator<T>>::remove(category_id, moderator_id);

            Ok(())
        }

        /// Add a new category.
        fn create_category(origin, parent: Option<T::CategoryId>, title: Vec<u8>, description: Vec<u8>) -> Result<(), Error> {
            // Ensure data migration is done
            Self::ensure_data_migration_done()?;

            // Not signed by forum LEAD
            Self::ensure_is_forum_lead(origin)?;

            // Set a temporal mutable variable
            let parent_category_id = parent;

            // If not root, then check that we can create in parent category
            if let Some(tmp_parent_category_id) = parent {
                // Can we mutate in this category?
                Self::ensure_can_add_subcategory_path_leaf(&tmp_parent_category_id)?;

                // Increment number of subcategories to reflect this new category being
                // added as a child
                <CategoryById<T>>::mutate(tmp_parent_category_id, |c| {
                    c.num_direct_subcategories += 1;
                });
            }

            // Get next category id
            let next_category_id = <NextCategoryId<T>>::get();

            // Create new category
            let new_category = Category {
                id : next_category_id,
                title_hash: T::calculate_hash(title.as_slice()),
                description_hash: T::calculate_hash(description.as_slice()),
                archived: false,
                num_direct_subcategories: 0,
                num_direct_threads: 0,
                parent_category_id,
                sticky_thread_ids: vec![],
            };

            // Insert category in map
            <CategoryById<T>>::mutate(next_category_id, |value| *value = new_category);

            // Update other next category id
            <NextCategoryId<T>>::mutate(|value| *value += One::one());

            // Generate event
            Self::deposit_event(RawEvent::CategoryCreated(next_category_id));

            Ok(())
        }

        /// Update category
        fn update_category_archival_status(origin, actor: PrivilegedActor<T>, category_id: T::CategoryId, new_archival_status: bool) -> Result<(), Error> {
            // Ensure data migration is done
            Self::ensure_data_migration_done()?;

            // Ensure actor can update category
            let category = Self::ensure_can_update_category_archival_status(origin, &actor, &category_id)?;

            if let Some(tmp_parent_category_id) = category.parent_category_id {
                // Get path from parent to root of category tree.
                let category_tree_path = Self::ensure_valid_category_and_build_category_tree_path(&tmp_parent_category_id)?;

                if new_archival_status && Self::ensure_can_mutate_in_path_leaf(&category_tree_path).is_err() {
                    return Ok(())
                }
            }

            // Get the category
            let category = <CategoryById<T>>::get(category_id);

            // No change, invalid transaction
            if new_archival_status == category.archived {
                return Err(Error::CategoryNotBeingUpdated)
            }

            // Mutate category, and set possible new change parameters
            <CategoryById<T>>::mutate(category_id, |c| c.archived = new_archival_status);

            // Generate event
            Self::deposit_event(RawEvent::CategoryUpdated(category_id, new_archival_status));

            Ok(())
        }

        fn delete_category(origin, actor: PrivilegedActor<T>, category_id: T::CategoryId) -> Result<(), Error> {
            // Ensure data migration is done
            Self::ensure_data_migration_done()?;

            let category = Self::ensure_can_delete_category(origin, &actor, &category_id)?;

            // Delete thread
            <CategoryById<T>>::remove(category_id);
            if let Some(parent_category_id) = category.parent_category_id {
                <CategoryById<T>>::mutate(parent_category_id, |tmp_category| tmp_category.num_direct_subcategories -= 1);
            }

            // Store the event
            Self::deposit_event(RawEvent::CategoryDeleted(category_id));

            Ok(())
        }

        /// Create new thread in category with poll
        fn create_thread(origin, forum_user_id: T::ForumUserId, category_id: T::CategoryId, title: Vec<u8>, text: Vec<u8>,
            poll: Option<Poll<T::Moment, T::Hash>>,
        ) -> Result<(), Error> {
            // Ensure data migration is done
            Self::ensure_data_migration_done()?;

            // Check that account is forum member
            Self::ensure_is_forum_user(origin, &forum_user_id)?;

            // Keep next thread id
            let next_thread_id = <NextThreadId<T>>::get();

            // Create a new thread
            Self::add_new_thread(category_id, forum_user_id, title.as_slice(), text.as_slice(), &poll)?;

            // Generate event
            Self::deposit_event(RawEvent::ThreadCreated(next_thread_id));

            Ok(())
        }

        fn edit_thread_title(origin, forum_user_id: T::ForumUserId, category_id: T::CategoryId, thread_id: T::ThreadId, new_title: Vec<u8>) -> Result<(), Error> {
            // Ensure data migration is done
            Self::ensure_data_migration_done()?;

            let thread = Self::ensure_can_edit_thread_title(origin, &category_id, &thread_id, &forum_user_id)?;

            // Store the event
            Self::deposit_event(RawEvent::ThreadTitleUpdated(thread_id));

            // Update thread title
            let title_hash = T::calculate_hash(&new_title);
            <ThreadById<T>>::mutate(thread.category_id, thread_id, |thread| thread.title_hash = title_hash);

            Ok(())
        }

        /// Update category
        fn update_thread_archival_status(origin, actor: PrivilegedActor<T>, category_id: T::CategoryId, thread_id: T::ThreadId, new_archival_status: bool) -> Result<(), Error> {
            // Ensure data migration is done
            Self::ensure_data_migration_done()?;

            // Ensure actor can update category
            let (category, thread) = Self::ensure_can_update_thread_archival_status(origin, &actor, &category_id, &thread_id)?;

            if let Some(tmp_parent_category_id) = category.parent_category_id {
                // Get path from parent to root of category tree.
                let category_tree_path = Self::ensure_valid_category_and_build_category_tree_path(&tmp_parent_category_id)?;

                if new_archival_status && Self::ensure_can_mutate_in_path_leaf(&category_tree_path).is_err() {
                    return Ok(());
                }
            }

            // No change, invalid transaction
            if new_archival_status == thread.archived {
                return Err(Error::ThreadNotBeingUpdated);
            }

            // Mutate thread, and set possible new change parameters
            <ThreadById<T>>::mutate(category_id, thread_id, |c| c.archived = new_archival_status);

            // Generate event
            Self::deposit_event(RawEvent::ThreadUpdated(thread_id, new_archival_status));

            Ok(())
        }


        fn delete_thread(origin, moderator_id: T::ModeratorId, category_id: T::CategoryId, thread_id: T::ThreadId) -> Result<(), Error> {
            // Ensure data migration is done
            Self::ensure_data_migration_done()?;

            let (_, thread) = Self::ensure_can_moderate_thread(origin, &moderator_id, &category_id, &thread_id)?;

            // Delete thread
            <ThreadById<T>>::remove(thread.category_id, thread_id);
            <PostById<T>>::remove_prefix(thread_id);

            // decrease category's thread counter
            <CategoryById<T>>::mutate(category_id, |category| category.num_direct_threads -= 1);

            // Store the event
            Self::deposit_event(RawEvent::ThreadDeleted(thread_id));

            Ok(())
        }

        fn move_thread_to_category(origin, moderator_id: T::ModeratorId, category_id: T::CategoryId, thread_id: T::ThreadId, new_category_id: T::CategoryId) -> Result<(), Error> {
            // Ensure data migration is done
            Self::ensure_data_migration_done()?;

            // Make sure moderator move between selected categories
            let (_, thread) = Self::ensure_can_move_thread(origin, &moderator_id, &category_id, &thread_id, &new_category_id)?;

            <ThreadById<T>>::remove(category_id, thread_id);
            <ThreadById<T>>::insert(new_category_id, thread_id, thread);
            <CategoryById<T>>::mutate(category_id, |category| category.num_direct_threads -= 1);
            <CategoryById<T>>::mutate(new_category_id, |category| category.num_direct_threads += 1);

            // Store the event
            Self::deposit_event(RawEvent::ThreadMoved(thread_id, new_category_id));

            Ok(())
        }

        /// submit a poll
        fn vote_on_poll(origin, forum_user_id: T::ForumUserId, category_id: T::CategoryId, thread_id: T::ThreadId, index: u32) -> Result<(), Error> {
            // Ensure data migration is done
            Self::ensure_data_migration_done()?;

            // get forum user id.
            Self::ensure_is_forum_user(origin, &forum_user_id)?;

            // Get thread
            let thread = Self::ensure_thread_exists(&category_id, &thread_id)?;

            // Make sure poll exist
            Self::ensure_vote_is_valid(&thread, index)?;

            // Store new poll alternative statistics
            let poll = thread.poll.unwrap();
            let new_poll_alternatives: Vec<PollAlternative<T::Hash>> = poll.poll_alternatives
                .iter()
                .enumerate()
                .map(|(old_index, old_value)| if index as usize == old_index
                    { PollAlternative {
                        alternative_text_hash: old_value.alternative_text_hash,
                        vote_count: old_value.vote_count + 1,
                    }
                    } else {
                        old_value.clone()
                    })
                .collect();

            // Update thread with one object
            <ThreadById<T>>::mutate(thread.category_id, thread_id, |value| {
                *value = Thread {
                    poll: Some( Poll {
                        poll_alternatives: new_poll_alternatives,
                        ..poll
                    }),
                    ..(value.clone())
                }
            });

            // Store the event
            Self::deposit_event(RawEvent::VoteOnPoll(thread_id, index));

            Ok(())
        }

        /// Moderate thread
        fn moderate_thread(origin, moderator_id: T::ModeratorId, category_id: T::CategoryId, thread_id: T::ThreadId, rationale: Vec<u8>) -> Result<(), Error> {
            // Ensure data migration is done
            Self::ensure_data_migration_done()?;

            // Ensure moderator is allowed to moderate post
            Self::ensure_can_moderate_thread(origin, &moderator_id, &category_id, &thread_id)?;

            // Calculate rationale's hash
            let rationale_hash = T::calculate_hash(rationale.as_slice());

            // Delete thread
            <ThreadById<T>>::remove(category_id, thread_id);

            // Generate event
            Self::deposit_event(RawEvent::ThreadModerated(thread_id, rationale_hash));

            Ok(())
        }

        /// Edit post text
        fn add_post(origin, forum_user_id: T::ForumUserId, category_id: T::CategoryId, thread_id: T::ThreadId, text: Vec<u8>) -> Result<(), Error> {
            // Ensure data migration is done
            Self::ensure_data_migration_done()?;

            /*
             * Update SPEC with new errors,
             */

            // Check that account is forum member
            Self::ensure_is_forum_user(origin, &forum_user_id)?;

            // Keep next post id
            let next_post_id = <NextPostId<T>>::get();

            // Add new post
            Self::add_new_post(category_id, thread_id, text.as_slice(), forum_user_id)?;

            // Generate event
            Self::deposit_event(RawEvent::PostAdded(next_post_id));

            Ok(())
        }

        /// like or unlike a post.
        fn react_post(origin, forum_user_id: T::ForumUserId, category_id: T::CategoryId, thread_id: T::ThreadId, post_id: T::PostId, react: T::PostReactionId) -> Result<(), Error> {
            // Ensure data migration is done
            Self::ensure_data_migration_done()?;

            // Check that account is forum member
            Self::ensure_is_forum_user(origin, &forum_user_id)?;

            // Make sure there exists a mutable post with post id `post_id`
            let _ = Self::ensure_post_is_mutable(&category_id, &thread_id, &post_id)?;

            // Get old value in map
            let old_value = <ReactionByPost::<T>>::get(post_id, forum_user_id);

            // Update and save event.
            if old_value != react {
                <ReactionByPost::<T>>::mutate(post_id, forum_user_id, |value| *value = react);
                Self::deposit_event(RawEvent::PostReacted(forum_user_id, post_id, react));
            }

            Ok(())
        }

        /// Edit post text
        fn edit_post_text(origin, forum_user_id: T::ForumUserId, category_id: T::CategoryId, thread_id: T::ThreadId, post_id: T::PostId, new_text: Vec<u8>) -> Result<(), Error> {
            // Ensure data migration is done
            Self::ensure_data_migration_done()?;

            // Check that account is forum member
            Self::ensure_is_forum_user(origin, &forum_user_id)?;

            // Make sure there exists a mutable post with post id `post_id`
            let post = Self::ensure_post_is_mutable(&category_id, &thread_id, &post_id)?;

            // Signer does not match creator of post with identifier postId
            ensure!(post.author_id == forum_user_id, Error::AccountDoesNotMatchPostAuthor);

            // Update post text
            let text_hash = T::calculate_hash(&new_text);
            <PostById<T>>::mutate(post.thread_id, post_id, |p| p.text_hash = text_hash);

            // Generate event
            Self::deposit_event(RawEvent::PostTextUpdated(post_id));

            Ok(())
        }

        /// Moderate post
        fn moderate_post(origin, moderator_id: T::ModeratorId, category_id: T::CategoryId, thread_id: T::ThreadId, post_id: T::PostId, rationale: Vec<u8>) -> Result<(), Error> {
            // Ensure data migration is done
            Self::ensure_data_migration_done()?;

            // Ensure moderator is allowed to moderate post
            Self::ensure_can_moderate_post(origin, &moderator_id, &category_id, &thread_id, &post_id)?;

            // Calculate rationale's hash
            let rationale_hash = T::calculate_hash(rationale.as_slice());

            // Delete post
            <PostById<T>>::remove(thread_id, post_id);

            // Generate event
            Self::deposit_event(RawEvent::PostModerated(post_id, rationale_hash));

            Ok(())
        }

        /// Set stickied threads for category
        fn  set_stickied_threads(origin, moderator_id: T::ModeratorId, category_id: T::CategoryId, stickied_ids: Vec<T::ThreadId>) -> Result<(), Error> {
            // Ensure data migration is done
            Self::ensure_data_migration_done()?;

            // Get moderator id.
            let who = Self::ensure_is_moderator(origin, &moderator_id)?;

            // ensure the moderator can moderate the category
            Self::ensure_can_moderate_category(&who, &moderator_id, &category_id)?;

            // Ensure all thread id valid and is under the category
            for item in &stickied_ids {
                Self::ensure_thread_exists(&category_id, item)?;
            }

            // Update category
            <CategoryById<T>>::mutate(category_id, |category| category.sticky_thread_ids = stickied_ids.clone());

            // Generate event
            Self::deposit_event(RawEvent::CategoryStickyThreadUpdate(category_id, stickied_ids));

            Ok(())
        }
    }
}

impl<T: Trait> Module<T> {
    // TODO need a safer approach for system call
    // Interface to add a new thread.
    // It can be call from other module and this module.
    // Method not check the forum user. The extrinsic call it should check if forum id is valid.
    // If other module call it, could set the forum user id as zero, which not used by forum module.
    // Data structure of poll data: item description vector, poll description, start time, end time,
    // minimum selected items, maximum selected items
    pub fn add_new_thread(
        category_id: T::CategoryId,
        author_id: T::ForumUserId,
        title: &[u8],
        text: &[u8],
        poll: &Option<Poll<T::Moment, T::Hash>>,
    ) -> Result<Thread<T::ForumUserId, T::CategoryId, T::Moment, T::Hash>, Error> {
        // Ensure data migration is done
        Self::ensure_data_migration_done()?;

        // Get path from parent to root of category tree.
        let category_tree_path =
            Self::ensure_valid_category_and_build_category_tree_path(&category_id)?;

        // No ancestor is blocking us doing mutation in this category
        Self::ensure_can_mutate_in_path_leaf(&category_tree_path)?;

        // Unwrap poll
        if let Some(data) = poll {
            // Check all poll alternatives
            Self::ensure_poll_alternatives_valid(&data.poll_alternatives)?;

            // Check poll self information
            Self::ensure_poll_is_valid(&data)?;
        }

        // Create and add new thread
        let new_thread_id = <NextThreadId<T>>::get();

        // Add inital post to thread
        let _ = Self::add_new_post(category_id, new_thread_id, text, author_id);

        // Build a new thread
        let new_thread = Thread {
            category_id,
            title_hash: T::calculate_hash(title),
            author_id,
            archived: false,
            poll: poll.clone(),
        };

        // Store thread
        <ThreadById<T>>::mutate(category_id, new_thread_id, |value| {
            *value = new_thread.clone()
        });

        // Update next thread id
        <NextThreadId<T>>::mutate(|n| *n += One::one());

        // Update category's thread counter
        <CategoryById<T>>::mutate(category_id, |c| c.num_direct_threads += 1);

        Ok(new_thread)
    }

    // TODO need a safer approach for system call
    // Interface to add a new post.
    // It can be call from other module and this module.
    // Method not check the forum user. The extrinsic call it should check if forum id is valid.
    // If other module call it, could set the forum user id as zero, which not used by forum module.
    pub fn add_new_post(
        category_id: T::CategoryId,
        thread_id: T::ThreadId,
        text: &[u8],
        author_id: T::ForumUserId,
    ) -> Result<Post<T::ForumUserId, T::ThreadId, T::Hash>, Error> {
        // Ensure data migration is done
        Self::ensure_data_migration_done()?;

        // Make sure thread exists and is mutable
        let thread = Self::ensure_thread_is_mutable(&category_id, &thread_id)?;

        // Get path from parent to root of category tree.
        let category_tree_path =
            Self::ensure_valid_category_and_build_category_tree_path(&thread.category_id)?;

        // No ancestor is blocking us doing mutation in this category
        Self::ensure_can_mutate_in_path_leaf(&category_tree_path)?;

        // Make and add initial post
        let new_post_id = <NextPostId<T>>::get();

        // Build a post
        let new_post = Post {
            thread_id,
            text_hash: T::calculate_hash(text),
            author_id,
        };

        // Store post
        <PostById<T>>::mutate(thread_id, new_post_id, |value| *value = new_post.clone());

        // Update next post id
        <NextPostId<T>>::mutate(|n| *n += One::one());

        Ok(new_post)
    }

    // Ensure poll is valid
    fn ensure_poll_is_valid(poll: &Poll<T::Moment, T::Hash>) -> Result<(), Error> {
        // Poll end time must larger than now
        if poll.end_time < <timestamp::Module<T>>::now() {
            return Err(Error::PollTimeSetting);
        }

        Ok(())
    }

    // Ensure all poll alternative valid
    fn ensure_poll_alternatives_valid(
        alternatives: &[PollAlternative<T::Hash>],
    ) -> Result<(), Error> {
        let len = alternatives.len();
        // Check alternative amount
        Self::ensure_poll_alternatives_length_is_valid(len)?;

        Ok(())
    }

    // Ensure poll alternative size is valid
    fn ensure_poll_alternatives_length_is_valid(len: usize) -> Result<(), Error> {
        PollItemsConstraint::get().ensure_valid(
            len,
            Error::PollAlternativesTooShort,
            Error::PollAlternativesTooLong,
        )
    }

    fn ensure_post_is_mutable(
        category_id: &T::CategoryId,
        thread_id: &T::ThreadId,
        post_id: &T::PostId,
    ) -> Result<Post<T::ForumUserId, T::ThreadId, T::Hash>, Error> {
        // Make sure post exists
        let post = Self::ensure_post_exists(thread_id, post_id)?;

        // and make sure thread is mutable
        Self::ensure_thread_is_mutable(category_id, thread_id)?;

        Ok(post)
    }

    fn ensure_post_exists(
        thread_id: &T::ThreadId,
        post_id: &T::PostId,
    ) -> Result<Post<T::ForumUserId, T::ThreadId, T::Hash>, Error> {
        if !<PostById<T>>::exists(thread_id, post_id) {
            return Err(Error::PostDoesNotExist);
        }

        Ok(<PostById<T>>::get(thread_id, post_id))
    }

    fn ensure_can_moderate_post(
        origin: T::Origin,
        moderator_id: &T::ModeratorId,
        category_id: &T::CategoryId,
        thread_id: &T::ThreadId,
        post_id: &T::PostId,
    ) -> Result<(), Error> {
        // Get moderator id.
        let who = ensure_signed(origin)?;

        // Make sure post exists and is mutable
        Self::ensure_post_is_mutable(&category_id, &thread_id, &post_id)?;

        // ensure the moderator can moderate the category
        Self::ensure_can_moderate_category(&who, &moderator_id, &category_id)?;

        Ok(())
    }

    fn ensure_thread_is_mutable(
        category_id: &T::CategoryId,
        thread_id: &T::ThreadId,
    ) -> Result<Thread<T::ForumUserId, T::CategoryId, T::Moment, T::Hash>, Error> {
        // Make sure thread exists
        let thread = Self::ensure_thread_exists(category_id, thread_id)?;

        if thread.archived {
            return Err(Error::ThreadImmutable);
        }

        // and corresponding category is mutable
        Self::ensure_category_is_mutable(thread.category_id)?;

        Ok(thread)
    }

    fn ensure_can_update_thread_archival_status(
        origin: T::Origin,
        actor: &PrivilegedActor<T>,
        category_id: &T::CategoryId,
        thread_id: &T::ThreadId,
    ) -> Result<
        (
            Category<T::CategoryId, T::ThreadId, T::Hash>,
            Thread<T::ForumUserId, T::CategoryId, T::Moment, T::Hash>,
        ),
        Error,
    > {
        // Check actor's role
        match actor {
            PrivilegedActor::Lead => Self::ensure_is_forum_lead(origin)?,
            PrivilegedActor::Moderator(moderator_id) => {
                Self::ensure_is_moderator(origin, &moderator_id)?
            }
        };

        let thread = Self::ensure_thread_is_mutable(category_id, thread_id)?;
        let category = <CategoryById<T>>::get(category_id);

        // Closure ensuring moderator can delete category
        let ensure_moderator_can_update = |moderator_id: &T::ModeratorId| -> Result<(), Error> {
            Self::ensure_can_moderate_category_path(moderator_id, &category_id)
                .map_err(|_| Error::ModeratorCantUpdateCategory)?;

            Ok(())
        };

        // Decide if actor can delete category
        match actor {
            PrivilegedActor::Lead => (),
            PrivilegedActor::Moderator(moderator_id) => ensure_moderator_can_update(moderator_id)?,
        };

        Ok((category, thread))
    }

    fn ensure_thread_exists(
        category_id: &T::CategoryId,
        thread_id: &T::ThreadId,
    ) -> Result<Thread<T::ForumUserId, T::CategoryId, T::Moment, T::Hash>, Error> {
        if !<ThreadById<T>>::exists(category_id, thread_id) {
            return Err(Error::ThreadDoesNotExist);
        }

        Ok(<ThreadById<T>>::get(category_id, thread_id))
    }

    fn ensure_can_edit_thread_title(
        origin: T::Origin,
        category_id: &T::CategoryId,
        thread_id: &T::ThreadId,
        forum_user_id: &T::ForumUserId,
    ) -> Result<Thread<T::ForumUserId, T::CategoryId, T::Moment, T::Hash>, Error> {
        // Check that account is forum member
        Self::ensure_is_forum_user(origin, &forum_user_id)?;

        // Ensure forum user is author of the thread
        let thread = Self::ensure_is_thread_author(&category_id, &thread_id, &forum_user_id)?;

        Ok(thread)
    }

    fn ensure_is_thread_author(
        category_id: &T::CategoryId,
        thread_id: &T::ThreadId,
        forum_user_id: &T::ForumUserId,
    ) -> Result<Thread<T::ForumUserId, T::CategoryId, T::Moment, T::Hash>, Error> {
        let thread = Self::ensure_thread_is_mutable(category_id, thread_id)?;

        if thread.author_id != *forum_user_id {
            return Err(Error::AccountDoesNotMatchThreadAuthor);
        }

        Ok(thread)
    }

    /// Ensure forum user is lead
    fn ensure_is_forum_lead(origin: T::Origin) -> Result<T::AccountId, Error> {
        let who = ensure_signed(origin)?;

        Self::ensure_is_forum_lead_account(&who)?;

        Ok(who)
    }

    // Ensure forum user is lead - check via account
    fn ensure_is_forum_lead_account(account_id: &T::AccountId) -> Result<(), Error> {
        let is_lead = T::is_lead(account_id);

        ensure!(is_lead, Error::OriginNotForumLead);
        Ok(())
    }

    /// Ensure forum user id registered and its account id matched
    fn ensure_is_forum_user(
        origin: T::Origin,
        forum_user_id: &T::ForumUserId,
    ) -> Result<T::AccountId, Error> {
        let who = ensure_signed(origin)?;

        let is_member = T::is_forum_member(&who, forum_user_id);

        ensure!(is_member, Error::ForumUserIdNotMatchAccount);
        Ok(who)
    }

    /// Ensure moderator id registered and its accound id matched
    fn ensure_is_moderator(
        origin: T::Origin,
        moderator_id: &T::ModeratorId,
    ) -> Result<T::AccountId, Error> {
        let who = ensure_signed(origin)?;

        Self::ensure_is_moderator_account(&who, &moderator_id)?;

        Ok(who)
    }

    /// Ensure moderator id registered and its accound id matched - check via account
    fn ensure_is_moderator_account(
        account_id: &T::AccountId,
        moderator_id: &T::ModeratorId,
    ) -> Result<(), Error> {
        let is_moderator = T::is_moderator(&account_id, moderator_id);

        ensure!(is_moderator, Error::ModeratorIdNotMatchAccount);
        Ok(())
    }

    // Ensure moderator can manipulate thread.
    fn ensure_can_moderate_thread(
        origin: T::Origin,
        moderator_id: &T::ModeratorId,
        category_id: &T::CategoryId,
        thread_id: &T::ThreadId,
    ) -> Result<
        (
            T::AccountId,
            Thread<T::ForumUserId, T::CategoryId, T::Moment, T::Hash>,
        ),
        Error,
    > {
        // Check that account is forum member
        let who = Self::ensure_is_moderator(origin, &moderator_id)?;

        let thread = Self::ensure_thread_exists(category_id, thread_id)?;

        Self::ensure_can_moderate_category(&who, moderator_id, category_id)?;

        Ok((who, thread))
    }

    fn ensure_can_move_thread(
        origin: T::Origin,
        moderator_id: &T::ModeratorId,
        category_id: &T::CategoryId,
        thread_id: &T::ThreadId,
        new_category_id: &T::CategoryId,
    ) -> Result<
        (
            T::AccountId,
            Thread<T::ForumUserId, T::CategoryId, T::Moment, T::Hash>,
        ),
        Error,
    > {
        ensure!(category_id != new_category_id, Error::ThreadMoveInvalid,);

        let (account_id, thread) =
            Self::ensure_can_moderate_thread(origin, moderator_id, category_id, thread_id)
                .map_err(|_| Error::ModeratorModerateOriginCategory)?;

        Self::ensure_can_moderate_category(&account_id, moderator_id, new_category_id)
            .map_err(|_| Error::ModeratorModerateDestinationCategory)?;

        Ok((account_id, thread))
    }

    fn ensure_category_is_mutable(category_id: T::CategoryId) -> Result<(), Error> {
        let category_tree_path = Self::build_category_tree_path(&category_id);

        Self::ensure_can_mutate_in_path_leaf(&category_tree_path)
    }

    fn ensure_can_mutate_in_path_leaf(
        category_tree_path: &CategoryTreePathArg<T::CategoryId, T::ThreadId, T::Hash>,
    ) -> Result<(), Error> {
        // Is parent category directly or indirectly deleted or archived category
        ensure!(
            !category_tree_path
                .iter()
                .any(|c: &Category<T::CategoryId, T::ThreadId, T::Hash>| c.archived),
            Error::AncestorCategoryImmutable
        );

        Ok(())
    }

    fn ensure_can_add_subcategory_path_leaf(
        parent_category_id: &T::CategoryId,
    ) -> Result<(), Error> {
        // Get the path from parent category to root
        let category_tree_path =
            Self::ensure_valid_category_and_build_category_tree_path(parent_category_id)?;

        let max_category_depth: u64 = T::MaxCategoryDepth::get();

        // Check if max depth reached
        if category_tree_path.len() as u64 >= max_category_depth {
            return Err(Error::MaxValidCategoryDepthExceeded);
        }

        Self::ensure_can_mutate_in_path_leaf(&category_tree_path)?;

        Ok(())
    }

    /// Build category tree path and validate them
    fn ensure_valid_category_and_build_category_tree_path(
        category_id: &T::CategoryId,
    ) -> Result<CategoryTreePath<T::CategoryId, T::ThreadId, T::Hash>, Error> {
        ensure!(
            <CategoryById<T>>::exists(category_id),
            Error::CategoryDoesNotExist
        );

        // Get path from parent to root of category tree.
        let category_tree_path = Self::build_category_tree_path(&category_id);

        assert!(!category_tree_path.len() > 0);

        Ok(category_tree_path)
    }

    /// Builds path and populates in `path`.
    /// Requires that `category_id` is valid
    fn build_category_tree_path(
        category_id: &T::CategoryId,
    ) -> CategoryTreePath<T::CategoryId, T::ThreadId, T::Hash> {
        // Get path from parent to root of category tree.
        let mut category_tree_path = vec![];

        Self::_build_category_tree_path(category_id, &mut category_tree_path);

        category_tree_path
    }

    /// Builds path and populates in `path`.
    /// Requires that `category_id` is valid
    fn _build_category_tree_path(
        category_id: &T::CategoryId,
        path: &mut CategoryTreePath<T::CategoryId, T::ThreadId, T::Hash>,
    ) {
        // Grab category
        let category = <CategoryById<T>>::get(*category_id);

        // Add category to path container
        path.push(category.clone());

        // Make recursive call on parent if we are not at root
        if let Some(parent_category_id) = category.parent_category_id {
            assert!(<CategoryById<T>>::exists(parent_category_id));

            Self::_build_category_tree_path(&parent_category_id, path);
        }
    }

    fn ensure_can_delete_category(
        origin: T::Origin,
        actor: &PrivilegedActor<T>,
        category_id: &T::CategoryId,
    ) -> Result<Category<T::CategoryId, T::ThreadId, T::Hash>, Error> {
        // Check actor's role
        match actor {
            PrivilegedActor::Lead => Self::ensure_is_forum_lead(origin)?,
            PrivilegedActor::Moderator(moderator_id) => {
                Self::ensure_is_moderator(origin, &moderator_id)?
            }
        };

        // Ensure category exists
        if !<CategoryById<T>>::exists(category_id) {
            return Err(Error::CategoryDoesNotExist);
        }

        let category = <CategoryById<T>>::get(category_id);

        // Ensure category is empty
        ensure!(
            category.num_direct_threads == 0,
            Error::CategoryNotEmptyThreads,
        );
        ensure!(
            category.num_direct_subcategories == 0,
            Error::CategoryNotEmptyCategories,
        );

        // Closure ensuring moderator can delete category
        let can_moderator_delete =
            |moderator_id: &T::ModeratorId,
             category: Category<T::CategoryId, T::ThreadId, T::Hash>| {
                if let Some(parent_category_id) = category.parent_category_id {
                    Self::ensure_can_moderate_category_path(moderator_id, &parent_category_id)
                        .map_err(|_| Error::ModeratorCantDeleteCategory)?;

                    return Ok(category);
                }

                Err(Error::ModeratorCantDeleteCategory)
            };

        // Decide if actor can delete category
        match actor {
            PrivilegedActor::Lead => Ok(category),
            PrivilegedActor::Moderator(moderator_id) => {
                can_moderator_delete(moderator_id, category)
            }
        }
    }

    fn ensure_can_update_category_archival_status(
        origin: T::Origin,
        actor: &PrivilegedActor<T>,
        category_id: &T::CategoryId,
    ) -> Result<Category<T::CategoryId, T::ThreadId, T::Hash>, Error> {
        // Check actor's role
        match actor {
            PrivilegedActor::Lead => Self::ensure_is_forum_lead(origin)?,
            PrivilegedActor::Moderator(moderator_id) => {
                Self::ensure_is_moderator(origin, &moderator_id)?
            }
        };

        // Ensure category exists
        if !<CategoryById<T>>::exists(category_id) {
            return Err(Error::CategoryDoesNotExist);
        }

        let category = <CategoryById<T>>::get(category_id);

        // Closure ensuring moderator can delete category
        let can_moderator_update =
            |moderator_id: &T::ModeratorId,
             category: Category<T::CategoryId, T::ThreadId, T::Hash>| {
                Self::ensure_can_moderate_category_path(moderator_id, &category_id)
                    .map_err(|_| Error::ModeratorCantUpdateCategory)?;

                Ok(category)
            };

        // Decide if actor can delete category
        match actor {
            PrivilegedActor::Lead => Ok(category),
            PrivilegedActor::Moderator(moderator_id) => {
                can_moderator_update(moderator_id, category)
            }
        }
    }

    /// check if an account can moderate a category.
    fn ensure_can_moderate_category(
        account_id: &T::AccountId,
        moderator_id: &T::ModeratorId,
        category_id: &T::CategoryId,
    ) -> Result<(), Error> {
        // Ensure moderator account registered before
        Self::ensure_is_moderator_account(account_id, moderator_id)?;

        Self::ensure_can_moderate_category_path(moderator_id, category_id)?;

        Ok(())
    }

    // check that moderator is allowed to manipulate category in hierarchy
    fn ensure_can_moderate_category_path(
        moderator_id: &T::ModeratorId,
        category_id: &T::CategoryId,
    ) -> Result<(), Error> {
        // Get path from category to root
        let category_tree_path = Self::build_category_tree_path(category_id);

        for item in category_tree_path {
            if <CategoryByModerator<T>>::exists(item.id, moderator_id) {
                return Ok(());
            }
        }

        Err(Error::ModeratorModerateCategory)
    }

    /// Check the vote is valid
    fn ensure_vote_is_valid(
        thread: &Thread<T::ForumUserId, T::CategoryId, T::Moment, T::Hash>,
        index: u32,
    ) -> Result<(), Error> {
        // Poll not existed
        if thread.poll.is_none() {
            return Err(Error::PollNotExist);
        }

        let poll = thread.poll.as_ref().unwrap();
        // Poll not expired
        if poll.end_time < <timestamp::Module<T>>::now() {
            Err(Error::PollCommitExpired)
        } else {
            let alternative_length = poll.poll_alternatives.len();
            // The selected alternative index is valid
            if index as usize >= alternative_length {
                Err(Error::PollData)
            } else {
                Ok(())
            }
        }
    }

    /// Ensure data migration is done
    fn ensure_data_migration_done() -> Result<(), Error> {
        if DataMigrationDone::get() {
            Ok(())
        } else {
            Err(Error::DataMigrationNotDone)
        }
    }
}
