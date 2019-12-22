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

#[cfg(feature = "std")]
use serde_derive::{Deserialize, Serialize};

use rstd::prelude::*;

use codec::{Decode, Encode};
use srml_support::{
    decl_event, decl_module, decl_storage, dispatch, ensure,
};

#[macro_use]
extern crate bitflags;

mod mock;
mod tests;

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

    pub fn ensure_valid(
        &self,
        len: usize,
        too_short_msg: &'static str,
        too_long_msg: &'static str,
    ) -> Result<(), &'static str> {
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

/// Constants
/////////////////////////////////////////////////////////////////

/// The greatest valid depth of a category.
/// The depth of a root category is 0.
const MAX_CATEGORY_DEPTH: u16 = 3;

/// Error messages for dispatchables
const ERROR_FORUM_SUDO_NOT_SET: &str = "Forum sudo not set.";
const ERROR_ORIGIN_NOT_FORUM_SUDO: &str = "Origin not forum sudo.";
const ERROR_CATEGORY_TITLE_TOO_SHORT: &str = "Category title too short.";
const ERROR_CATEGORY_TITLE_TOO_LONG: &str = "Category title too long.";
const ERROR_CATEGORY_DESCRIPTION_TOO_SHORT: &str = "Category description too long.";
const ERROR_CATEGORY_DESCRIPTION_TOO_LONG: &str = "Category description too long.";
const ERROR_ANCESTOR_CATEGORY_IMMUTABLE: &str =
    "Ancestor category immutable, i.e. deleted or archived";
const ERROR_MAX_VALID_CATEGORY_DEPTH_EXCEEDED: &str = "Maximum valid category depth exceeded.";
const ERROR_CATEGORY_DOES_NOT_EXIST: &str = "Category does not exist.";
const ERROR_NOT_FORUM_USER: &str = "Not forum user.";
const ERROR_THREAD_TITLE_TOO_SHORT: &str = "Thread title too short.";
const ERROR_THREAD_TITLE_TOO_LONG: &str = "Thread title too long.";
const ERROR_POST_TEXT_TOO_SHORT: &str = "Post text too short.";
const ERROR_POST_TEXT_TOO_LONG: &str = "Post too long.";
const ERROR_THREAD_DOES_NOT_EXIST: &str = "Thread does not exist";
const ERROR_THREAD_MODERATION_RATIONALE_TOO_SHORT: &str = "Thread moderation rationale too short.";
const ERROR_THREAD_MODERATION_RATIONALE_TOO_LONG: &str = "Thread moderation rationale too long.";
const ERROR_THREAD_ALREADY_MODERATED: &str = "Thread already moderated.";
const ERROR_THREAD_MODERATED: &str = "Thread is moderated.";
const ERROR_POST_DOES_NOT_EXIST: &str = "Post does not exist.";
const ERROR_ACCOUNT_DOES_NOT_MATCH_POST_AUTHOR: &str = "Account does not match post author.";
const ERROR_POST_MODERATED: &str = "Post is moderated.";
const ERROR_POST_MODERATION_RATIONALE_TOO_SHORT: &str = "Post moderation rationale too short.";
const ERROR_POST_MODERATION_RATIONALE_TOO_LONG: &str = "Post moderation rationale too long.";
const ERROR_CATEGORY_NOT_BEING_UPDATED: &str = "Category not being updated.";
const ERROR_CATEGORY_CANNOT_BE_UNARCHIVED_WHEN_DELETED: &str =
    "Category cannot be unarchived when deleted.";
const ERROR_MODERATOR_MODERATE_CATEGORY: &str = "Moderator can not moderate category.";
const ERROR_EXCEED_MAX_CATEGORY_DEPTH: &str = "Category exceed max depth.";
const ERROR_POLL_DESC_TOO_SHORT: &str = "Poll description too short.";
const ERROR_POLL_DESC_TOO_LONG: &str = "Poll description too long.";
const ERROR_POLL_ITEMS_TOO_SHORT: &str = "Poll items number too short.";
const ERROR_POLL_ITEMS_TOO_LONG: &str = "Poll items number too long.";
const ERROR_POLL_NOT_EXIST: &str = "Poll not exist.";
//use srml_support::storage::*;

//use sr_io::{StorageOverlay, ChildrenStorageOverlay};

//#[cfg(feature = "std")]
//use runtime_io::{StorageOverlay, ChildrenStorageOverlay};

//#[cfg(any(feature = "std", test))]
//use sr_primitives::{StorageOverlay, ChildrenStorageOverlay};

use system;
use system::{ensure_root, ensure_signed};

/// Represents a user in this forum.
#[derive(Debug, Copy, Clone)]
pub struct ForumUser<AccountId> {
    /// Identifier of user
    pub id: AccountId, // In the future one could add things like
                       // - updating post count of a user
                       // - updating status (e.g. hero, new, etc.)
                       //
}

/// Represents a regsitry of `ForumUser` instances.
pub trait ForumUserRegistry<AccountId> {
    fn get_forum_user(id: &AccountId) -> Option<ForumUser<AccountId>>;
}

/// Convenient composite time stamp
#[cfg_attr(feature = "std", derive(Serialize, Deserialize, Debug))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq)]
pub struct BlockchainTimestamp<BlockNumber, Moment> {
    block: BlockNumber,
    time: Moment,
}

/// Represents a moderation outcome applied to a post or a thread.
#[cfg_attr(feature = "std", derive(Serialize, Deserialize, Debug))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq)]
pub struct ModerationAction<BlockNumber, Moment, AccountId> {
    /// When action occured.
    moderated_at: BlockchainTimestamp<BlockNumber, Moment>,

    /// Account forum sudo which acted.
    moderator_id: AccountId,

    /// Moderation rationale
    rationale: Vec<u8>,
}

/// Represents a revision of the text of a Post
#[cfg_attr(feature = "std", derive(Serialize, Deserialize, Debug))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq)]
pub struct PostTextChange<BlockNumber, Moment> {
    /// When this expiration occured
    expired_at: BlockchainTimestamp<BlockNumber, Moment>,

    /// Text that expired
    text: Vec<u8>,
}

bitflags! {
    /// Represents a post reaction
    #[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
    #[derive(Encode, Decode, Default)]
    pub struct PostReaction: u32 {
        /// Represent nothing set
        const NONE = 0b00000000;

        /// Represent thumb up set
        const UP = 0b00000001;

        /// Represent thumb down set
        const DOWN = 0b00000010;

        /// Represent like set
        const LIKE = 0b00000100;
    }
}

/// Represents a poll identifier, each bit represent an item. multiple items select possible.
pub type PollData = u64;

/// Represents a post identifier
pub type PostId = u64;

/// Represents a thread post
#[cfg_attr(feature = "std", derive(Serialize, Deserialize, Debug))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq)]
pub struct Post<BlockNumber, Moment, AccountId> {
    /// Post identifier
    id: PostId,

    /// Id of thread to which this post corresponds.
    thread_id: ThreadId,

    /// Current text of post
    current_text: Vec<u8>,

    /// Possible moderation of this post
    moderation: Option<ModerationAction<BlockNumber, Moment, AccountId>>,

    /// Edits of post ordered chronologically by edit time.
    text_change_history: Vec<PostTextChange<BlockNumber, Moment>>,

    /// When post was submitted.
    created_at: BlockchainTimestamp<BlockNumber, Moment>,

    /// Author of post.
    author_id: AccountId,
}

/// Represents a thread identifier
pub type ThreadId = u64;

/// Represents a thread
#[cfg_attr(feature = "std", derive(Serialize, Deserialize, Debug))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq)]
pub struct Thread<BlockNumber, Moment, AccountId> {
    /// Thread identifier
    id: ThreadId,

    /// Title
    title: Vec<u8>,

    /// Category in which this thread lives
    category_id: CategoryId,

    /// Possible moderation of this thread
    moderation: Option<ModerationAction<BlockNumber, Moment, AccountId>>,

    /// When thread was established.
    created_at: BlockchainTimestamp<BlockNumber, Moment>,

    /// Author of post.
    author_id: AccountId,

    /// poll
    include_poll: bool,
}

/// Represents a category identifier
pub type CategoryId = u64;

/// Represents a category
#[cfg_attr(feature = "std", derive(Serialize, Deserialize, Debug))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq)]
pub struct Category<BlockNumber, Moment, AccountId> {
    /// Category identifier
    id: CategoryId,

    /// Title
    title: Vec<u8>,

    /// Description
    description: Vec<u8>,

    /// When category was established.
    created_at: BlockchainTimestamp<BlockNumber, Moment>,

    /// Whether category is deleted.
    deleted: bool,

    /// Whether category is archived.
    archived: bool,

    /// Parent category id.
    parent_id: Option<CategoryId>,

    /// Account of the moderator which created category.
    moderator_id: AccountId,
}

/// Represents a sequence of categories which have child-parent relatioonship
/// where last element is final ancestor, or root, in the context of the category tree.
type CategoryTreePath<BlockNumber, Moment, AccountId> =
    Vec<Category<BlockNumber, Moment, AccountId>>;

pub trait Trait: system::Trait + timestamp::Trait + Sized {
    type Event: From<Event<Self>> + Into<<Self as system::Trait>::Event>;

    type MembershipRegistry: ForumUserRegistry<Self::AccountId>;
}

decl_storage! {
    trait Store for Module<T: Trait> as Forum {

        /// Map category identifier to corresponding category.
        pub CategoryById get(category_by_id) config(): map CategoryId => Category<T::BlockNumber, T::Moment, T::AccountId>;

        /// Category identifier value to be used for the next Category created.
        pub NextCategoryId get(next_category_id) config(): CategoryId;

        /// Map thread identifier to corresponding thread.
        pub ThreadById get(thread_by_id) config(): map ThreadId => Thread<T::BlockNumber, T::Moment, T::AccountId>;

        /// Thread identifier value to be used for next Thread in threadById.
        pub NextThreadId get(next_thread_id) config(): ThreadId;

        /// Map post identifier to corresponding post.
        pub PostById get(post_by_id) config(): map PostId => Post<T::BlockNumber, T::Moment, T::AccountId>;

        /// Post identifier value to be used for for next post created.
        pub NextPostId get(next_post_id) config(): PostId;

        /// Max depth of category.
        pub MaxCategoryDepth get(max_category_depth) config(): u8;

        /// Account of forum sudo.
        pub ForumSudo get(forum_sudo) config(): Option<T::AccountId>;

        /// Moderator set for each Category
        pub CategoryByModerator get(category_by_moderator) config(): double_map CategoryId, blake2_256(T::AccountId) => bool;

        pub ReactionByPost get(reaction_by_post) config(): double_map PostId, blake2_256(T::AccountId) => PostReaction;

        pub PollDesc get(poll_desc) config(): double_map ThreadId, blake2_256(u8) => Vec<u8>;
        pub PollDataByAccount get(poll_by_account) config(): double_map ThreadId, blake2_256(T::AccountId) => PollData;

        /// Input constraints
        /// These are all forward looking, that is they are enforced on all
        /// future calls.
        pub CategoryTitleConstraint get(category_title_constraint) config(): InputValidationLengthConstraint;
        pub CategoryDescriptionConstraint get(category_description_constraint) config(): InputValidationLengthConstraint;
        pub ThreadTitleConstraint get(thread_title_constraint) config(): InputValidationLengthConstraint;
        pub PostTextConstraint get(post_text_constraint) config(): InputValidationLengthConstraint;
        pub ThreadModerationRationaleConstraint get(thread_moderation_rationale_constraint) config(): InputValidationLengthConstraint;
        pub PostModerationRationaleConstraint get(post_moderation_rationale_constraint) config(): InputValidationLengthConstraint;

        pub PollDescConstraint get(poll_desc_constraint) config(): InputValidationLengthConstraint;
        pub PollItemsConstraint get(poll_items_constraint) config(): InputValidationLengthConstraint;
    }
    /*
    JUST GIVING UP ON ALL THIS FOR NOW BECAUSE ITS TAKING TOO LONG
    Review : https://github.com/paritytech/polkadot/blob/620b8610431e7b5fdd71ce3e94c3ee0177406dcc/runtime/src/parachains.rs#L123-L141

    add_extra_genesis {

        // Explain why we need to put this here.
        config(initial_forum_sudo) : Option<T::AccountId>;

        build(|
            storage: &mut generator::StorageOverlay,
            _: &mut generator::ChildrenStorageOverlay,
            config: &GenesisConfig<T>
            | {


            if let Some(account_id) = &config.initial_forum_sudo {
                println!("{}: <ForumSudo<T>>::put(account_id)", account_id);
                <ForumSudo<T> as generator::StorageValue<_>>::put(&account_id, storage);
            }
        })
    }
    */
}

decl_event!(
    pub enum Event<T>
    where
        <T as system::Trait>::AccountId,
    {
        /// A category was introduced
        CategoryCreated(CategoryId),

        /// A category with given id was updated.
        /// The second argument reflects the new archival status of the category, if changed.
        /// The third argument reflects the new deletion status of the category, if changed.
        CategoryUpdated(CategoryId, Option<bool>, Option<bool>),

        /// A thread with given id was created.
        ThreadCreated(ThreadId),

        /// A thread with given id was moderated.
        ThreadModerated(ThreadId),

        /// Post with given id was created.
        PostAdded(PostId),

        /// Post with givne id was moderated.
        PostModerated(PostId),

        /// Post with given id had its text updated.
        /// The second argument reflects the number of total edits when the text update occurs.
        PostTextUpdated(PostId, u64),

        /// Given account was set as forum sudo.
        ForumSudoSet(Option<AccountId>, Option<AccountId>),

        /// Thumb up post
        ThumbUpPost(AccountId, PostId),
        /// Thumb down post
        ThumbDownPost(AccountId, PostId),
        /// Like post
        LikePost(AccountId, PostId),
        /// Unthumb up post
        UnthumbUpPost(AccountId, PostId),
        /// Thumb down post
        UnthumbDownPost(AccountId, PostId),
        /// Unlike post
        UnlikePost(AccountId, PostId),
    }
);

decl_module! {
    pub struct Module<T: Trait> for enum Call where origin: T::Origin {

        fn deposit_event() = default;

        /// enable a moderator can moderate a category and its sub categories.
        fn set_moderator_category(origin, category_id: CategoryId, account_id: T::AccountId) -> dispatch::Result {
            let who = ensure_signed(origin)?;

            // Not signed by forum SUDO
            Self::ensure_is_forum_sudo(&who)?;

            // ensure category exists.
            ensure!(
            <CategoryById<T>>::exists(&category_id),
            ERROR_CATEGORY_DOES_NOT_EXIST
            );

            // ensure account id exist.
            Self::ensure_is_forum_member(&account_id)?;

            <CategoryByModerator<T>>::insert(category_id, account_id, true);
            Ok(())

        }

        /// set max category depth.
        fn set_max_category_depth(origin, max_category_depth: u8) -> dispatch::Result {
            let who = ensure_signed(origin)?;

            // Not signed by forum SUDO
            Self::ensure_is_forum_sudo(&who)?;

            <MaxCategoryDepth>::put(max_category_depth);
            Ok(())
        }


        /// Set forum sudo.
        fn set_forum_sudo(origin, new_forum_sudo: Option<T::AccountId>) -> dispatch::Result {
            ensure_root(origin)?;

            /*
             * Question: when this routine is called by non sudo or with bad signature, what error is raised?
             * Update ERror set in spec
             */

            // Hold on to old value
            let old_forum_sudo = <ForumSudo<T>>::get().clone();

            // Update forum sudo
            match new_forum_sudo.clone() {
                Some(account_id) => <ForumSudo<T>>::put(account_id),
                None => <ForumSudo<T>>::kill()
            };

            // Generate event
            Self::deposit_event(RawEvent::ForumSudoSet(old_forum_sudo, new_forum_sudo));

            // All good.
            Ok(())
        }

        /// Add a new category.
        fn create_category(origin, parent: Option<CategoryId>, title: Vec<u8>, description: Vec<u8>) -> dispatch::Result {

            // Check that its a valid signature
            let who = ensure_signed(origin)?;

            // Not signed by forum SUDO
            Self::ensure_is_forum_sudo(&who)?;

            // Validate title
            Self::ensure_category_title_is_valid(&title)?;

            // Validate description
            Self::ensure_category_description_is_valid(&description)?;

            // If not root, then check that we can create in parent category
            if let Some(parent_category_id) = parent {

                let category_tree_path = Self::ensure_valid_category_and_build_category_tree_path(parent_category_id)?;
                if category_tree_path.len() >= <MaxCategoryDepth>::get() as usize {
                    return Err(ERROR_EXCEED_MAX_CATEGORY_DEPTH);
                }

                // Can we mutate in this category?
                Self::ensure_can_add_subcategory_path_leaf(&category_tree_path)?;
            }

            /*
             * Here we are safe to mutate
             */

            let next_category_id = NextCategoryId::get();

            // Create new category
            let new_category = Category {
                id : next_category_id,
                title : title.clone(),
                description: description.clone(),
                created_at : Self::current_block_and_time(),
                deleted: false,
                archived: false,
                parent_id: parent,
                moderator_id: who
            };

            // Insert category in map
            <CategoryById<T>>::insert(new_category.id, new_category);

            // Update other things
            NextCategoryId::put(next_category_id + 1);

            // Generate event
            Self::deposit_event(RawEvent::CategoryCreated(next_category_id));

            Ok(())
        }

        /// Update category
        fn update_category(origin, category_id: CategoryId, new_archival_status: Option<bool>, new_deletion_status: Option<bool>) -> dispatch::Result {

            // Check that its a valid signature
            let who = ensure_signed(origin)?;

            // Not signed by forum SUDO
            Self::ensure_is_forum_sudo(&who)?;

            // Make sure something is actually being changed
            ensure!(
                new_archival_status.is_some() || new_deletion_status.is_some(),
                ERROR_CATEGORY_NOT_BEING_UPDATED
            );

            // Get path from parent to root of category tree.
            let category_tree_path = Self::ensure_valid_category_and_build_category_tree_path(category_id)?;

            // When we are dealing with a non-root category, we
            // must ensure mutability of our category by traversing to
            // root.
            if category_tree_path.len() > 1  {

                // We must skip checking category itself.
                // NB: This is kind of hacky way to avoid last element,
                // something clearn can be done later.
                let mut path_to_check = category_tree_path.clone();
                path_to_check.remove(0);

                Self::ensure_can_mutate_in_path_leaf(&path_to_check)?;
            }

            // If the category itself is already deleted, then this
            // update *must* simultaneously do an undelete, otherwise it is blocked,
            // as we do not permit unarchiving a deleted category. Doing
            // a simultanous undelete and unarchive is accepted.

            let category = <CategoryById<T>>::get(category_id);

            ensure!(
                !category.deleted || (new_deletion_status == Some(false)),
                ERROR_CATEGORY_CANNOT_BE_UNARCHIVED_WHEN_DELETED
            );

            // no any change then return Ok, no update and no event.
            let deletion_unchanged = new_deletion_status == None || new_deletion_status == Some(category.deleted);
            let archive_unchanged = new_archival_status == None || new_archival_status == Some(category.archived);

            if deletion_unchanged && archive_unchanged {
                return Ok(())
            }

            // Mutate category, and set possible new change parameters

            <CategoryById<T>>::mutate(category_id, |c| {

                if let Some(archived) = new_archival_status {
                    c.archived = archived;
                }

                if let Some(deleted) = new_deletion_status {
                    c.deleted = deleted;
                }
            });

            // Generate event
            Self::deposit_event(RawEvent::CategoryUpdated(category_id, new_archival_status, new_deletion_status));

            Ok(())
        }



        /// Create new thread in category
        fn create_thread(origin, category_id: CategoryId, title: Vec<u8>, text: Vec<u8>) -> dispatch::Result {

            /*
             * Update SPEC with new errors,
             * and mutation of Category class,
             * as well as side effect to update Category::num_threads_created.
             */

            // Check that its a valid signature
            let who = ensure_signed(origin)?;

            // Check that account is forum member
            Self::ensure_is_forum_member(&who)?;

            // Get path from parent to root of category tree.
            let category_tree_path = Self::ensure_valid_category_and_build_category_tree_path(category_id)?;

            // No ancestor is blocking us doing mutation in this category
            Self::ensure_can_mutate_in_path_leaf(&category_tree_path)?;

            // Validate title
            Self::ensure_thread_title_is_valid(&title)?;

            // Validate post text
            Self::ensure_post_text_is_valid(&text)?;

            /*
             * Here it is safe to mutate state.
             */

            // Add thread
            let thread = Self::add_new_thread(category_id, &title, &who, false);

            // Add inital post to thread
            Self::add_new_post(thread.id, &text, &who);

            // Generate event
            Self::deposit_event(RawEvent::ThreadCreated(thread.id));

            Ok(())
        }

        /// Create new thread in category with poll
        fn create_thread_with_poll(origin, category_id: CategoryId, title: Vec<u8>, text: Vec<u8>, poll_desc: Vec<Vec<u8>>) -> dispatch::Result {

            /*
             * Update SPEC with new errors,
             * and mutation of Category class,
             * as well as side effect to update Category::num_threads_created.
             */

            // Check that its a valid signature
            let who = ensure_signed(origin)?;

            // Check that account is forum member
            Self::ensure_is_forum_member(&who)?;

            // Get path from parent to root of category tree.
            let category_tree_path = Self::ensure_valid_category_and_build_category_tree_path(category_id)?;

            // No ancestor is blocking us doing mutation in this category
            Self::ensure_can_mutate_in_path_leaf(&category_tree_path)?;

            // Validate title
            Self::ensure_thread_title_is_valid(&title)?;

            // Validate post text
            Self::ensure_post_text_is_valid(&text)?;

            /*
             * Here it is safe to mutate state.
             */

            // Add thread
            let thread = Self::add_new_thread(category_id, &title, &who, true);

            // Add inital post to thread
            Self::add_new_post(thread.id, &text, &who);

            // Add a poll 
            let _ = Self::create_poll(thread.id, poll_desc)?;

            // Generate event
            Self::deposit_event(RawEvent::ThreadCreated(thread.id));

            Ok(())
        }

        /// submit a poll
        fn submit_poll(origin, thread_id: ThreadId, poll_value: PollData) -> dispatch::Result {
            // Check that its a valid signature
            let who = ensure_signed(origin)?;

            // Check that account is forum member
            Self::ensure_is_forum_member(&who)?;

            // Get thread
            let thread = Self::ensure_thread_exists(&thread_id)?;

            if thread.include_poll == false {
                Err(ERROR_POLL_NOT_EXIST)
            } else {
                // if re submit is allowed. PollDataByAccount(thread_id, &who).exist()
                <PollDataByAccount<T>>::insert(thread_id, &who, poll_value);
                Ok(())
            }  
        }

        /// Moderate thread
        fn moderate_thread(origin, thread_id: ThreadId, rationale: Vec<u8>) -> dispatch::Result {

            // Check that its a valid signature
            let who = ensure_signed(origin)?;

            // Signed by forum SUDO
            // Self::ensure_is_forum_sudo(&who)?;

            // Get thread
            let mut thread = Self::ensure_thread_exists(&thread_id)?;

            // Thread is not already moderated
            ensure!(thread.moderation.is_none(), ERROR_THREAD_ALREADY_MODERATED);

            // Rationale valid
            Self::ensure_thread_moderation_rationale_is_valid(&rationale)?;

            // ensure origin can moderate category
            Self::ensure_moderate_category(who.clone(), thread.category_id)?;

            // Can mutate in corresponding category
            let path = Self::build_category_tree_path(thread.category_id);

            // Path must be non-empty, as category id is from thread in state
            assert!(!path.is_empty());

            Self::ensure_can_mutate_in_path_leaf(&path)?;

            /*
             * Here we are safe to mutate
             */

            // Add moderation to thread
            thread.moderation = Some(ModerationAction {
                moderated_at: Self::current_block_and_time(),
                moderator_id: who,
                rationale: rationale.clone()
            });

            <ThreadById<T>>::insert(thread_id, thread.clone());

            // Update moderation/umoderation count of corresponding category
            // <CategoryById<T>>::mutate(thread.category_id, |category| {
            //     category.num_direct_unmoderated_threads -= 1;
            //     category.num_direct_moderated_threads += 1;
            // });

            // Generate event
            Self::deposit_event(RawEvent::ThreadModerated(thread_id));

            Ok(())
        }

        /// Edit post text
        fn add_post(origin, thread_id: ThreadId, text: Vec<u8>) -> dispatch::Result {

            /*
             * Update SPEC with new errors,
             */

            // Check that its a valid signature
            let who = ensure_signed(origin)?;

            // Check that account is forum member
            Self::ensure_is_forum_member(&who)?;

            // Validate post text
            Self::ensure_post_text_is_valid(&text)?;

            // Make sure thread exists and is mutable
            let thread = Self::ensure_thread_is_mutable(&thread_id)?;

            // Get path from parent to root of category tree.
            let category_tree_path = Self::ensure_valid_category_and_build_category_tree_path(thread.category_id)?;

            // No ancestor is blocking us doing mutation in this category
            Self::ensure_can_mutate_in_path_leaf(&category_tree_path)?;

            /*
             * Here we are safe to mutate
             */

            let post = Self::add_new_post(thread_id, &text, &who);

            // Generate event
            Self::deposit_event(RawEvent::PostAdded(post.id));

            Ok(())
        }

        /// like a post.
        fn like_post(origin, post_id: PostId, like: bool) -> dispatch::Result {
                        // Check that its a valid signature
            let who = ensure_signed(origin)?;

            // Check that account is forum member
            Self::ensure_is_forum_member(&who)?;

            // Make sure there exists a mutable post with post id `post_id`
            let _ = Self::ensure_post_is_mutable(&post_id)?;

            // set like
            let old_value = <ReactionByPost<T>>::get(post_id, who.clone());
            if like == true && old_value.contains(PostReaction::LIKE) == false {
                <ReactionByPost<T>>::insert(post_id, who.clone(), old_value | PostReaction::LIKE);
                Self::deposit_event(RawEvent::LikePost(who, post_id));
            }
            else if like == false && old_value.contains(PostReaction::LIKE) == true {
                <ReactionByPost<T>>::insert(post_id, who.clone(), old_value - PostReaction::LIKE);
                Self::deposit_event(RawEvent::UnlikePost(who, post_id));
            }
   
            Ok(())
        }

        /// up a post.
        fn up_post(origin, post_id: PostId, up: bool) -> dispatch::Result {
            // Check that its a valid signature
            let who = ensure_signed(origin)?;

            // Check that account is forum member
            Self::ensure_is_forum_member(&who)?;

            // Make sure there exists a mutable post with post id `post_id`
            let _ = Self::ensure_post_is_mutable(&post_id)?;

            // set up
            let old_value = <ReactionByPost<T>>::get(post_id, who.clone());
            if up == true && old_value.contains(PostReaction::UP) == false {
                <ReactionByPost<T>>::insert(post_id, who.clone(), old_value | PostReaction::UP);
                Self::deposit_event(RawEvent::ThumbUpPost(who, post_id));
            }
            else if up == false && old_value.contains(PostReaction::UP) == true {
                <ReactionByPost<T>>::insert(post_id, who.clone(), old_value - PostReaction::UP);
                Self::deposit_event(RawEvent::UnthumbUpPost(who, post_id));
            }
   
            Ok(())
        }

        /// down a post.
        fn down_post(origin, post_id: PostId, down: bool) -> dispatch::Result {
            // Check that its a valid signature
            let who = ensure_signed(origin)?;

            // Check that account is forum member
            Self::ensure_is_forum_member(&who)?;

            // Make sure there exists a mutable post with post id `post_id`
            let _ = Self::ensure_post_is_mutable(&post_id)?;

            // set down
            let old_value = <ReactionByPost<T>>::get(post_id, who.clone());
            if down == true && old_value.contains(PostReaction::DOWN) == false {
                <ReactionByPost<T>>::insert(post_id, who.clone(), old_value | PostReaction::DOWN);
                Self::deposit_event(RawEvent::ThumbDownPost(who, post_id));
            }
            else if down == false && old_value.contains(PostReaction::DOWN) == true {
                <ReactionByPost<T>>::insert(post_id, who.clone(), old_value - PostReaction::DOWN);
                Self::deposit_event(RawEvent::UnthumbDownPost(who, post_id));
            }
   
            Ok(())
        }

        /// Edit post text
        fn edit_post_text(origin, post_id: PostId, new_text: Vec<u8>) -> dispatch::Result {

            /* Edit spec.
              - forum member guard missing
              - check that both post and thread and category are mutable
            */

            // Check that its a valid signature
            let who = ensure_signed(origin)?;

            // Check that account is forum member
            Self::ensure_is_forum_member(&who)?;

            // Validate post text
            Self::ensure_post_text_is_valid(&new_text)?;

            // Make sure there exists a mutable post with post id `post_id`
            let post = Self::ensure_post_is_mutable(&post_id)?;

            // Signer does not match creator of post with identifier postId
            ensure!(post.author_id == who, ERROR_ACCOUNT_DOES_NOT_MATCH_POST_AUTHOR);

            /*
             * Here we are safe to mutate
             */

            <PostById<T>>::mutate(post_id, |p| {

                let expired_post_text = PostTextChange {
                    expired_at: Self::current_block_and_time(),
                    text: post.current_text.clone()
                };

                // Set current text to new text
                p.current_text = new_text;

                // Copy current text to history of expired texts
                p.text_change_history.push(expired_post_text);
            });

            // Generate event
            Self::deposit_event(RawEvent::PostTextUpdated(post.id, post.text_change_history.len() as u64));

            Ok(())
        }

        /// Moderate post
        fn moderate_post(origin, post_id: PostId, rationale: Vec<u8>) -> dispatch::Result {

            // Check that its a valid signature
            let who = ensure_signed(origin)?;

            // Signed by forum SUDO
            Self::ensure_is_forum_sudo(&who)?;

            // Make sure post exists and is mutable
            let post = Self::ensure_post_is_mutable(&post_id)?;

            Self::ensure_post_moderation_rationale_is_valid(&rationale)?;

            // make sure origin can moderate the category
            let thread = Self::ensure_thread_exists(&post.thread_id)?;
            Self::ensure_moderate_category(who.clone(), thread.category_id)?;

            /*
             * Here we are safe to mutate
             */

            // Update moderation action on post
            let moderation_action = ModerationAction{
                moderated_at: Self::current_block_and_time(),
                moderator_id: who,
                rationale: rationale.clone()
            };

            <PostById<T>>::mutate(post_id, |p| {
                p.moderation = Some(moderation_action);
            });

            // Generate event
            Self::deposit_event(RawEvent::PostModerated(post.id));

            Ok(())
        }
    }
}

impl<T: Trait> Module<T> {

    fn create_poll(thread_id: ThreadId, text: Vec<Vec<u8>>) -> dispatch::Result {
        let len = text.len();
        Self::ensure_poll_items_is_valid(len)?;
        for index in 0..len {
            let desc_len = text[index].len();
            Self::ensure_poll_desc_is_valid(desc_len)?;
        }
        for index in 0..len {
            // <CategoryByModerator<T>>::insert(category_id, account_id, true);
            PollDesc::insert(thread_id, index as u8, &text[index]);
        }
        Ok(())
    }

    fn ensure_category_title_is_valid(title: &Vec<u8>) -> dispatch::Result {
        CategoryTitleConstraint::get().ensure_valid(
            title.len(),
            ERROR_CATEGORY_TITLE_TOO_SHORT,
            ERROR_CATEGORY_TITLE_TOO_LONG,
        )
    }

    fn ensure_category_description_is_valid(description: &Vec<u8>) -> dispatch::Result {
        CategoryDescriptionConstraint::get().ensure_valid(
            description.len(),
            ERROR_CATEGORY_DESCRIPTION_TOO_SHORT,
            ERROR_CATEGORY_DESCRIPTION_TOO_LONG,
        )
    }

    fn ensure_thread_moderation_rationale_is_valid(rationale: &Vec<u8>) -> dispatch::Result {
        ThreadModerationRationaleConstraint::get().ensure_valid(
            rationale.len(),
            ERROR_THREAD_MODERATION_RATIONALE_TOO_SHORT,
            ERROR_THREAD_MODERATION_RATIONALE_TOO_LONG,
        )
    }

    fn ensure_thread_title_is_valid(title: &Vec<u8>) -> dispatch::Result {
        ThreadTitleConstraint::get().ensure_valid(
            title.len(),
            ERROR_THREAD_TITLE_TOO_SHORT,
            ERROR_THREAD_TITLE_TOO_LONG,
        )
    }

    fn ensure_post_text_is_valid(text: &Vec<u8>) -> dispatch::Result {
        PostTextConstraint::get().ensure_valid(
            text.len(),
            ERROR_POST_TEXT_TOO_SHORT,
            ERROR_POST_TEXT_TOO_LONG,
        )
    }

    fn ensure_post_moderation_rationale_is_valid(rationale: &Vec<u8>) -> dispatch::Result {
        PostModerationRationaleConstraint::get().ensure_valid(
            rationale.len(),
            ERROR_POST_MODERATION_RATIONALE_TOO_SHORT,
            ERROR_POST_MODERATION_RATIONALE_TOO_LONG,
        )
    }

    fn ensure_poll_desc_is_valid(len: usize) -> dispatch::Result {
        PollDescConstraint::get().ensure_valid(
            len,
            ERROR_POLL_DESC_TOO_SHORT,
            ERROR_POLL_DESC_TOO_LONG,
        )
    }

    fn ensure_poll_items_is_valid(len: usize) -> dispatch::Result {
        PollItemsConstraint::get().ensure_valid(
            len,
            ERROR_POLL_ITEMS_TOO_SHORT,
            ERROR_POLL_ITEMS_TOO_LONG,
        )
    }

    fn current_block_and_time() -> BlockchainTimestamp<T::BlockNumber, T::Moment> {
        BlockchainTimestamp {
            block: <system::Module<T>>::block_number(),
            time: <timestamp::Module<T>>::now(),
        }
    }

    fn ensure_post_is_mutable(
        post_id: &PostId,
    ) -> Result<Post<T::BlockNumber, T::Moment, T::AccountId>, &'static str> {
        // Make sure post exists
        let post = Self::ensure_post_exists(post_id)?;

        // and is unmoderated
        ensure!(post.moderation.is_none(), ERROR_POST_MODERATED);

        // and make sure thread is mutable
        Self::ensure_thread_is_mutable(&post.thread_id)?;

        Ok(post)
    }

    fn ensure_post_exists(
        post_id: &PostId,
    ) -> Result<Post<T::BlockNumber, T::Moment, T::AccountId>, &'static str> {
        if <PostById<T>>::exists(post_id) {
            Ok(<PostById<T>>::get(post_id))
        } else {
            Err(ERROR_POST_DOES_NOT_EXIST)
        }
    }

    fn ensure_thread_is_mutable(
        thread_id: &ThreadId,
    ) -> Result<Thread<T::BlockNumber, T::Moment, T::AccountId>, &'static str> {
        // Make sure thread exists
        let thread = Self::ensure_thread_exists(&thread_id)?;

        // and is unmoderated
        ensure!(thread.moderation.is_none(), ERROR_THREAD_MODERATED);

        // and corresponding category is mutable
        Self::ensure_catgory_is_mutable(thread.category_id)?;

        Ok(thread)
    }

    fn ensure_thread_exists(
        thread_id: &ThreadId,
    ) -> Result<Thread<T::BlockNumber, T::Moment, T::AccountId>, &'static str> {
        if <ThreadById<T>>::exists(thread_id) {
            Ok(<ThreadById<T>>::get(thread_id))
        } else {
            Err(ERROR_THREAD_DOES_NOT_EXIST)
        }
    }

    fn ensure_forum_sudo_set() -> Result<T::AccountId, &'static str> {
        match <ForumSudo<T>>::get() {
            Some(account_id) => Ok(account_id),
            None => Err(ERROR_FORUM_SUDO_NOT_SET),
        }
    }

    fn ensure_is_forum_sudo(account_id: &T::AccountId) -> dispatch::Result {
        let forum_sudo_account = Self::ensure_forum_sudo_set()?;

        ensure!(
            *account_id == forum_sudo_account,
            ERROR_ORIGIN_NOT_FORUM_SUDO
        );
        Ok(())
    }

    fn ensure_is_forum_member(
        account_id: &T::AccountId,
    ) -> Result<ForumUser<T::AccountId>, &'static str> {
        let forum_user_query = T::MembershipRegistry::get_forum_user(account_id);

        if let Some(forum_user) = forum_user_query {
            Ok(forum_user)
        } else {
            Err(ERROR_NOT_FORUM_USER)
        }
    }

    fn ensure_catgory_is_mutable(category_id: CategoryId) -> dispatch::Result {
        let category_tree_path = Self::build_category_tree_path(category_id);

        Self::ensure_can_mutate_in_path_leaf(&category_tree_path)
    }

    fn ensure_can_mutate_in_path_leaf(
        category_tree_path: &CategoryTreePath<T::BlockNumber, T::Moment, T::AccountId>,
    ) -> dispatch::Result {
        // Is parent category directly or indirectly deleted or archived category
        ensure!(
            !category_tree_path.iter().any(
                |c: &Category<T::BlockNumber, T::Moment, T::AccountId>| c.deleted || c.archived
            ),
            ERROR_ANCESTOR_CATEGORY_IMMUTABLE
        );

        Ok(())
    }

    fn ensure_can_add_subcategory_path_leaf(
        category_tree_path: &CategoryTreePath<T::BlockNumber, T::Moment, T::AccountId>,
    ) -> dispatch::Result {
        Self::ensure_can_mutate_in_path_leaf(category_tree_path)?;

        // Does adding a new category exceed maximum depth
        let depth_of_new_category = 1 + 1 + category_tree_path.len();

        ensure!(
            depth_of_new_category <= MAX_CATEGORY_DEPTH as usize,
            ERROR_MAX_VALID_CATEGORY_DEPTH_EXCEEDED
        );

        Ok(())
    }

    fn ensure_valid_category_and_build_category_tree_path(
        category_id: CategoryId,
    ) -> Result<CategoryTreePath<T::BlockNumber, T::Moment, T::AccountId>, &'static str> {
        ensure!(
            <CategoryById<T>>::exists(&category_id),
            ERROR_CATEGORY_DOES_NOT_EXIST
        );

        // Get path from parent to root of category tree.
        let category_tree_path = Self::build_category_tree_path(category_id);

        assert!(category_tree_path.len() > 0);

        Ok(category_tree_path)
    }

    /// Builds path and populates in `path`.
    /// Requires that `category_id` is valid
    fn build_category_tree_path(
        category_id: CategoryId,
    ) -> CategoryTreePath<T::BlockNumber, T::Moment, T::AccountId> {
        // Get path from parent to root of category tree.
        let mut category_tree_path = vec![];

        Self::_build_category_tree_path(category_id, &mut category_tree_path);

        category_tree_path
    }

    /// Builds path and populates in `path`.
    /// Requires that `category_id` is valid
    fn _build_category_tree_path(
        category_id: CategoryId,
        path: &mut CategoryTreePath<T::BlockNumber, T::Moment, T::AccountId>,
    ) {
        // Grab category
        let category = <CategoryById<T>>::get(category_id);

        // Add category to path container
        path.push(category.clone());

        // Make recursive call on parent if we are not at root
        if let Some(parent) = category.parent_id {
            assert!(<CategoryById<T>>::exists(parent));

            Self::_build_category_tree_path(parent, path);
        }
    }

    fn add_new_thread(
        category_id: CategoryId,
        title: &Vec<u8>,
        author_id: &T::AccountId,
        include_poll: bool,
    ) -> Thread<T::BlockNumber, T::Moment, T::AccountId> {
        // Create and add new thread
        let new_thread_id = NextThreadId::get();

        let new_thread = Thread {
            id: new_thread_id,
            title: title.clone(),
            category_id: category_id,
            moderation: None,
            created_at: Self::current_block_and_time(),
            author_id: author_id.clone(),
            include_poll: include_poll,
        };

        // Store thread
        <ThreadById<T>>::insert(new_thread_id, new_thread.clone());

        // Update next thread id
        NextThreadId::mutate(|n| {
            *n += 1;
        });

        // Update unmoderated thread count in corresponding category
        // <CategoryById<T>>::mutate(category_id, |c| {
        //     c.num_direct_unmoderated_threads += 1;
        // });

        new_thread
    }

    /// Creates and ads a new post ot the given thread, and makes all required state updates
    /// `thread_id` must be valid
    fn add_new_post(
        thread_id: ThreadId,
        text: &Vec<u8>,
        author_id: &T::AccountId,
    ) -> Post<T::BlockNumber, T::Moment, T::AccountId> {
        // Make and add initial post
        let new_post_id = NextPostId::get();

        let new_post = Post {
            id: new_post_id,
            thread_id: thread_id,
            current_text: text.clone(),
            moderation: None,
            text_change_history: vec![],
            created_at: Self::current_block_and_time(),
            author_id: author_id.clone(),
        };

        // Store post
        <PostById<T>>::insert(new_post_id, new_post.clone());

        // Update next post id
        NextPostId::mutate(|n| {
            *n += 1;
        });

        new_post
    }

    /// check if an account can moderate a category.
    fn ensure_moderate_category(
        account_id: T::AccountId,
        category_id: CategoryId,
    ) -> Result<(), &'static str> {
        let category_tree_path = Self::build_category_tree_path(category_id.clone());
        for i in 0..category_tree_path.len() {
            if <CategoryByModerator<T>>::get(category_tree_path[i].id, &account_id) == true {
                return Ok(());
            }
        }
        return Err(ERROR_MODERATOR_MODERATE_CATEGORY);
    }
}
