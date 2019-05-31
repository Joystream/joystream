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
#[macro_use]
extern crate serde_derive;

use rstd::prelude::*;

use parity_codec_derive::{Decode, Encode};
use srml_support::{ decl_event, decl_module, decl_storage, ensure, dispatch, StorageValue, StorageMap};

/// Length constraint for input validation

enum LengthValidationResult {
    TooShort,
    TooLong,
    Success
}

struct InputValidationLengthConstraint {

    /// Minimum length
    min : usize,

    /// Maximum length
    /// While having max would have been more direct, this
    /// way makes max < min unrepresentable semantically, 
    /// which is safer.
    max_as_min_diff: usize,
}

impl InputValidationLengthConstraint {
    
    /// Helper for computing max
    fn max(&self) -> usize {
        self.min + self.max_as_min_diff
    }

    /// Just to give method interface to read min, like max
    fn min(&self) -> usize {
        self.min
    }

    fn validate(&self, length: usize) -> LengthValidationResult {

        if length < self.min {
            LengthValidationResult::TooShort
        }
        else if length > self.max() {
            LengthValidationResult::TooLong
        }
        else {
            LengthValidationResult::Success
        }
    } 

    // TODO: add more vliadtion stuff here in the future?
}

/// Constants
const CATEGORY_TITLE: InputValidationLengthConstraint = InputValidationLengthConstraint{
    min: 3,
    max_as_min_diff: 30
};

const CATEGORY_DESCRIPTION: InputValidationLengthConstraint = InputValidationLengthConstraint{
    min: 10,
    max_as_min_diff: 140
};

/// The greatest valid depth of a category.
/// The depth of a root category is 0.
const MAX_CATEGORY_DEPTH: u32 = 3;

/// Error messages for dispatchables
/// Later perhaps make error message functions, to add parametization

const ERROR_FORUM_SUDO_NOT_SET: &str = "Forum sudo not set.";
const ERROR_ORIGIN_NOT_FORUM_SUDO: &str = "Origin not forum sudo.";

const ERROR_CATEGORY_TITLE_TOO_SHORT: &str = "Category title too short.";
const ERROR_CATEGORY_TITLE_TOO_LONG: &str = "Category title too long.";

const ERROR_CATEGORY_DESCRIPTION_TOO_SHORT: &str = "Category description too long.";
const ERROR_CATEGORY_DESCRIPTION_TOO_LONG: &str = "Category description too long.";

const ERROR_PARENT_CATEGORY_DOES_NOT_EXIST: &str = "Parent category does not exist.";
const ERROR_ANCESTOR_CATEGORY_IMMUTABLE: &str = "Ancestor category immutable, i.e. deleted or archived";
const ERROR_MAX_VALID_CATEGORY_DEPTH_EXCEEDED: &str = "Maximum valid category depth exceeded.";


//use srml_support::storage::*;

//use sr_io::{StorageOverlay, ChildrenStorageOverlay};

//#[cfg(feature = "std")]
//use runtime_io::{StorageOverlay, ChildrenStorageOverlay};

//#[cfg(any(feature = "std", test))]
//use sr_primitives::{StorageOverlay, ChildrenStorageOverlay};

use system::{ensure_signed};
use system;

use rstd::collections::btree_map::BTreeMap;

/// Constant values
/// Later add to st
///

/// Represents a user in this forum.
pub trait ForumUser<AccountId> {
    
    /// Identifier of user 
    fn id(&self) -> &AccountId;

    // In the future one could add things like 
    // - updating post count of a user
    // - updating status (e.g. hero, new, etc.)
    //

}

/// Represents a regsitry of `ForumUser` instances.
pub trait ForumUserRegistry<AccountId> {

    type ForumUser: ForumUser<AccountId>;
    
    fn get_forum_user(&self, id:AccountId) -> Option<&Self::ForumUser>;

}

/// Convenient composite time stamp 
//#[cfg_attr(feature = "std", derive(Serialize, Deserialize, Debug))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq)]
pub struct BlockchainTimestamp<BlockNumber, Moment> {
    block : BlockNumber,
    time: Moment
}

/// Represents a moderation outcome applied to a post or a thread. 
//#[cfg_attr(feature = "std", derive(Serialize, Deserialize, Debug))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq)]
pub struct ModerationAction<BlockNumber, Moment, AccountId> {

    /// When action occured.
    moderated_at: BlockchainTimestamp<BlockNumber, Moment>,

    /// Account forum sudo which acted.
    moderator_id: AccountId,

    /// Moderation rationale
    rationale: Vec<u8>

}

/// Represents a revision of the text of a Post
//#[cfg_attr(feature = "std", derive(Serialize, Deserialize, Debug))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq)]
pub struct PostTextEdit<BlockNumber, Moment> {

    /// What this edit occured.
    edited_at: BlockchainTimestamp<BlockNumber, Moment>,

    /// New text
    new_text: Vec<u8>
}

/// Represents a post identifier
pub type PostId = u64;

/// Represents a thread post
//#[cfg_attr(feature = "std", derive(Serialize, Deserialize, Debug))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq)]
pub struct Post<BlockNumber, Moment, AccountId> {

    /// Post identifier
    id: PostId,

    /// Id of thread to which this post corresponds.
    thread_id: ThreadId,

    /// The post number of this post in its thread, i.e. total number of posts added (including this)
    /// to a thread when it was added.
    /// Is needed to give light clients assurance about getting all posts in a given range,
    // `created_at` is not sufficient.
    post_nr: u32,

    /// Initial text of post
    initial_text: Vec<u8>,

    /// Possible moderation of this post
    moderation : Option<ModerationAction<BlockNumber, Moment, AccountId>>,
    
    /// Edits of post ordered chronologically by edit time.
    post_text_edits: Vec<PostTextEdit<BlockNumber, Moment>>,

    /// When post was submitted.
    created_at : BlockchainTimestamp<BlockNumber, Moment>,
    
    /// Author of post.
    author_id : AccountId

}

/// Represents a thread identifier
pub type ThreadId = u64;

/// Represents a thread
//#[cfg_attr(feature = "std", derive(Serialize, Deserialize, Debug))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq)]
pub struct Thread<BlockNumber, Moment, AccountId> {

    /// Thread identifier
    id : ThreadId,

    /// Title
    title : Vec<u8>,

    /// Category in which this thread lives
    category_id: CategoryId,

    /// The thread number of this thread in its category, i.e. total number of thread added (including this)
    /// to a category when it was added.
    /// Is needed to give light clients assurance about getting all threads in a given range,
    /// `created_at` is not sufficient.
    thread_nr: u32,

    /// Possible moderation of this thread
    moderation : Option<ModerationAction<BlockNumber, Moment, AccountId>>,

    /// Number of unmoderated posts in this thread
    num_unmoderated_posts: u64,

    /// Number of moderated posts in this thread
    num_moderated_posts: u64,

    /// When thread was established.
    created_at : BlockchainTimestamp<BlockNumber, Moment>,
    
    /// Author of post.
    author_id : AccountId
}

/// Represents a category identifier
pub type CategoryId = u64;

/// Represents a category
//#[cfg_attr(feature = "std", derive(Serialize, Deserialize, Debug))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq)]
pub struct Category<BlockNumber, Moment, AccountId> {

    /// Category identifier
    id : CategoryId,

    /// Title
    title : Vec<u8>,

    /// Description
    description: Vec<u8>,

    /// When category was established.
    created_at : BlockchainTimestamp<BlockNumber, Moment>,

    /// Whether category is deleted.
    deleted: bool,

    /// Whether category is archived.
    archived: bool,

    /*
     * These next three numbers are not maintained currently, 
     * they inadverdently made it into the spec without being
     * part of the user storeis
     
    /// Number direct subcategories.
    num_direct_subcategories: u64,

    /// Number of unmoderated threads directly in this category.
    num_direct_unmoderated_threads: u64,

    /// Number of moderated threads directly in this category.
    num_direct_moderated_threads: u64,
    */

    /// Parent category, if present, otherwise this category is a root categoryl
    parent_id: Option<CategoryId>,

    /// Account of the moderator which created category.
    moderator_id: AccountId
}

/// Represents a sequence of categories which have child-parent relatioonship
/// where last element is final ancestor, or root, in the context of the category tree.
type CategoryTreePath<BlockNumber, Moment, AccountId> = Vec<Category<BlockNumber, Moment, AccountId>>;

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

        /// Account of forum sudo.
        pub ForumSudo get(forum_sudo) config(): Option<T::AccountId>;

        // === Add constraints here ===

        // Will add all the constrainst here later!

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
    }
);

decl_module! {
    pub struct Module<T: Trait> for enum Call where origin: T::Origin {

        fn deposit_event<T>() = default;

        /// Set forum sudo.
        fn set_forum_sudo(newForumSudo: Option<T::AccountId>) -> dispatch::Result {

            /*
             * Question: when this routine is called by non sudo or with bad signature, what error is raised?
             * Update ERror set in spec
             */

            // Hold on to old value
            let oldForumSudo = <ForumSudo<T>>::get().clone();

            // Update forum sudo
            match newForumSudo.clone() {
                Some(accountId) => <ForumSudo<T>>::put(accountId),
                None => <ForumSudo<T>>::kill()
            };

            // Generate event
            Self::deposit_event(RawEvent::ForumSudoSet(oldForumSudo, newForumSudo));

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
            ensure_category_title_is_valid(&title)?;

            // Validate description
            ensure_category_description_is_valid(&description)?;

            // If not root, then check that we can create in parent category
            if let Some(parent_category_id) = parent {

                // Get path from parent to root of category tree.
                let mut category_tree_path = vec![];

                Self::build_category_tree_path(parent_category_id, &mut category_tree_path);

                // Can we mutate in this category?
                Self::ensure_can_add_subcategory_to_parent_at_path_tip(&category_tree_path)?;
            }

            let next_category_id = <NextCategoryId<T>>::get();

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
            <NextCategoryId<T>>::put(next_category_id + 1);

            // Generate event
            Self::deposit_event(RawEvent::CategoryCreated(next_category_id));

            Ok(())
        }
        
        /// Update category
        fn update_category(origin, category_id: CategoryId, archive: bool, deleted: bool) -> dispatch::Result {

            Ok(())
        }
    }
}

fn ensure_category_title_is_valid(title: &Vec<u8>) -> Result<(),&'static str> {

    match CATEGORY_TITLE.validate(title.len()) {
        LengthValidationResult::TooShort => Err(ERROR_CATEGORY_TITLE_TOO_SHORT),
        LengthValidationResult::TooLong => Err(ERROR_CATEGORY_TITLE_TOO_LONG),
        LengthValidationResult::Success => Ok(())
    }
}

fn ensure_category_description_is_valid(description: &Vec<u8>) -> Result<(),&'static str> {

    match CATEGORY_DESCRIPTION.validate(description.len()) {
        LengthValidationResult::TooShort => Err(ERROR_CATEGORY_DESCRIPTION_TOO_SHORT),
        LengthValidationResult::TooLong => Err(ERROR_CATEGORY_DESCRIPTION_TOO_LONG),
        LengthValidationResult::Success => Ok(())
    }

}

impl<T: Trait> Module<T> {

    fn current_block_and_time() -> BlockchainTimestamp<T::BlockNumber, T::Moment> {

        BlockchainTimestamp {
            block: <system::Module<T>>::block_number(),
            time: <timestamp::Module<T>>::now(),
        }
    }

    fn ensure_forum_sudo_set() -> Result<T::AccountId, &'static str> {

        match <ForumSudo<T>>::get() {
            Some(account_id) => Ok(account_id),
            None => Err(ERROR_FORUM_SUDO_NOT_SET)
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

    fn ensure_can_add_subcategory_to_parent_at_path_tip(category_tree_path:&CategoryTreePath<T::BlockNumber, T::Moment, T::AccountId>) -> dispatch::Result {

        // If path is empty, it just means the parent did not exist,
        // which means teh user provided an invalid parent category id.
        ensure!(category_tree_path.len() > 0,
            ERROR_PARENT_CATEGORY_DOES_NOT_EXIST
        );

        Self::ensure_can_mutate_in_category(category_tree_path)?;

        // Does adding a new category exceed maximum depth
        let depth_of_new_category = 1 + 1 + category_tree_path.len();

        ensure!(depth_of_new_category <= MAX_CATEGORY_DEPTH as usize,
            ERROR_MAX_VALID_CATEGORY_DEPTH_EXCEEDED
        );   

        Ok(())

    }

    fn ensure_can_mutate_in_category(category_tree_path:&CategoryTreePath<T::BlockNumber, T::Moment, T::AccountId>) -> dispatch::Result {

        // Is parent category directly or indirectly deleted or archived category
        ensure!(!category_tree_path.iter().any(|c:&Category<T::BlockNumber, T::Moment, T::AccountId>| c.deleted || c.archived ),
            ERROR_ANCESTOR_CATEGORY_IMMUTABLE
        );

    
        Ok(())
    }



/*
    fn ensure_category_exits(category_id:&CategoryId) -> Result<Category<T::BlockNumber, T::Moment, T::AccountId> , &'static str> {

        if <CategoryById<T>>::exists(category_id) {
            <CategoryById<T>>::get(category_id)
        } else {
            Err("Category does not exist.")
        }

        Err("dddd")
    }
*/

    fn build_category_tree_path(category_id:CategoryId, path: &mut CategoryTreePath<T::BlockNumber, T::Moment, T::AccountId>) {

        // <CategoryById<T>>::exists(&category_id)

        if <CategoryById<T>>::exists(&category_id) {

            // Grab category
            let category = <CategoryById<T>>::get(category_id);

            // Copy out parent_id field
            let parent_id_field = category.parent_id.clone();

            // Add category to path container
            path.push(category);

            // Make recursive call on parent if we are not at root
            if let Some(parent_category_id) = parent_id_field {
                Self::build_category_tree_path(parent_category_id, path);
            }
        }

    }

/*
    /// Populate 'ancestors' vector with ancestors of provided category 'category', starting with parents in front of vector.
    fn get_ancestor_categories(
        category: &Category<T::BlockNumber, T::Moment, T::AccountId>, 
        ancestors: &mut Vec<Category<T::BlockNumber, T::Moment, T::AccountId>>
        ) {

        let mut parent_id_field = &category.parent_id;

        while parent_id_field.is_some() {

            // Get parent id
            let parent_id = parent_id_field.unwrap();

            // Grab parent category
            let parent_category = <CategoryById<T>>::get(&parent_id);

            // Add to ancestors
            ancestors.push(parent_category);

            // Move on to (possible) parent of parent
            parent_id_field = &ancestors.last().unwrap().parent_id; //&parent_category.parent_id;
        }

        
    }
    */

    /*
    /// Determines how deep a category is nested, a top level category has depth 0.
    fn get_category_depth<BlockNumber, Moment, AccountId>(category:&Category<BlockNumber, Moment, AccountId>) -> u32 {

        if let Some(parent_id) = category.parent_id {

            // Get parent
            let parent_category = <CategoryById<T>>::get(&parent_id);

            Self::get_category_depth(&parent_category) + 1
        }
        else {
            0
        }
    }
    */

}

#[cfg(test)]
mod tests {
    use super::*;

    use primitives::{Blake2Hasher, H256};
    use runtime_io::with_externalities;
    use srml_support::{impl_outer_origin, assert_ok}; // assert, assert_eq
    // The testing primitives are very useful for avoiding having to work with signatures
    // or public keys. `u64` is used as the `AccountId` and no `Signature`s are requried.
    use runtime_primitives::{
        testing::{Digest, DigestItem, Header},
        traits::{BlakeTwo256, IdentityLookup}, //OnFinalize, OnInitialize},
        BuildStorage,
    };

    impl_outer_origin! {
        pub enum Origin for Test {}
    }

    // For testing the module, we construct most of a mock runtime. This means
    // first constructing a configuration type (`Test`) which `impl`s each of the
    // configuration traits of modules we want to use.
    #[derive(Clone, Eq, PartialEq)]
    pub struct Test;
    impl system::Trait for Test {
        type Origin = Origin;
        type Index = u64;
        type BlockNumber = u64;
        type Hash = H256;
        type Hashing = BlakeTwo256;
        type Digest = Digest;
        type AccountId = u64;
        type Lookup = IdentityLookup<Self::AccountId>;
        type Header = Header;
        type Event = ();
        type Log = DigestItem;
    }
    impl balances::Trait for Test {
        type Balance = u64;
        type OnFreeBalanceZero = ();
        type OnNewAccount = ();
        type Event = ();
        type TransactionPayment = ();
        type TransferPayment = ();
        type DustRemoval = ();
    }
    impl timestamp::Trait for Test {
        type Moment = u64;
        type OnTimestampSet = ();
    }
    impl Trait for Test {
        type Event = ();
        type MembershipRegistry = MockForumUserRegistry<<Test as system::Trait>::AccountId>;
    }

    type TestForumModule = Module<Test>;

    /// FACTOR THESE MOCKS OUT!

    // Mock implementation o
    pub struct MockForumUser<AccountId>  {
        _id: AccountId
    }

    impl<AccountId> ForumUser<AccountId> for MockForumUser<AccountId> {

        fn id(&self) -> &AccountId {
            &self._id
        }
    }

    pub struct MockForumUserRegistry<AccountId: std::cmp::Ord> {

        forum_user_from_id: BTreeMap<AccountId, <Self as ForumUserRegistry<AccountId>>::ForumUser>
    }

    impl<AccountId> ForumUserRegistry<AccountId> for MockForumUserRegistry<AccountId> where AccountId: std::cmp::Ord{

        type ForumUser = MockForumUser<AccountId>;

        fn get_forum_user(&self, id:AccountId) -> Option<&Self::ForumUser> {
            self.forum_user_from_id.get(&id)
        }
        
    }

    fn initialize_membership_registry() {

    }
    
    // This function basically just builds a genesis storage key/value store according to
    // our desired mockup.

    // refactor
    /// - add each config as parameter, then 
    /// 
    
    fn default_genesis_config() -> GenesisConfig<Test> {

        GenesisConfig::<Test> {
            category_by_id: vec![], // endowed_accounts.iter().cloned().map(|k|(k, 1 << 60)).collect(),
            next_category_id: 0,
            thread_by_id: vec![],
            next_thread_id: 0,
            post_by_id: vec![],
            next_post_id: 0,

            forum_sudo: 33


            // JUST GIVING UP ON ALL THIS FOR NOW BECAUSE ITS TAKING TOO LONG

            // Extra genesis fields
            //initial_forum_sudo: Some(143)
        }
    }

    // Wanted to have payload: a: &GenesisConfig<Test>
    // but borrow checker made my life miserabl, so giving up for now.
    fn build_test_externalities() -> runtime_io::TestExternalities<Blake2Hasher> {

        let t = default_genesis_config()
            .build_storage()
            .unwrap()
            .0;

        t.into()
    }

    /*
     * NB!: No test checks for even emission!!!!
     */

    /*
     * set_forum_sudo 
     * ==============================================================================
     * 
     * Missing cases
     * 
     * set_forum_bad_origin
     * 
     */

    #[test]
    fn set_forum_sudo_unset() {
        with_externalities(&mut build_test_externalities(), || {

            // Ensure that forum sudo is default
            assert_eq!(TestForumModule::forum_sudo(), Some(33));

            // Unset forum sudo
            assert_ok!(TestForumModule::set_forum_sudo(None));

            // Sudo no longer set
            assert!(!<ForumSudo<Test>>::exists());

            // event emitted?!

        });
    }

    #[test]
    fn set_forum_sudo_update() {
        with_externalities(&mut build_test_externalities(), || {

            // Ensure that forum sudo is default
            assert_eq!(TestForumModule::forum_sudo(), Some(default_genesis_config().forum_sudo));

            let new_forum_sudo_account_id = 780;

            // Unset forum sudo
            assert_ok!(TestForumModule::set_forum_sudo(Some(new_forum_sudo_account_id)));

            // Sudo no longer set
            //assert!(!<ForumSudo<Test>>::exists());
            assert_eq!(<ForumSudo<Test>>::get(), Some(new_forum_sudo_account_id));

        });
    }

    /*
     * create_category 
     * ==============================================================================
     * 
     * Missing cases
     * 
     * create_category_bad_origin
     * create_category_forum_sudo_not_set
     * create_category_forum_origin_not_forum_sudo
     * create_category_title_too_short
     * create_category_title_too_long
     * create_category_description_too_short
     * create_category_description_too_long
     */

    // Here are a few testing utilities and fixtures, will reorganize
    // later with more tests.

    enum OriginType {
        Signed(<Test as system::Trait>::AccountId),
        //Inherent, <== did not find how to make such an origin yet
        Root
    }

    struct CreateCategoryFixture {
        origin: OriginType,
        parent: Option<CategoryId>,
        title: Vec<u8>,
        description: Vec<u8>
    }

    impl CreateCategoryFixture {

        fn call_module(&self) -> dispatch::Result {

            TestForumModule::create_category(
                match self.origin {
                    OriginType::Signed(account_id) => Origin::signed(account_id),
                    //OriginType::Inherent => Origin::inherent,
                    OriginType::Root => system::RawOrigin::Root.into() //Origin::root
                },
                self.parent,
                self.title.clone(),
                self.description.clone()
            )
        }
    }

    #[test]
    fn create_category_successfully() {
        with_externalities(&mut build_test_externalities(), || {

            // Make some new catg
            let f1 = CreateCategoryFixture {
                origin: OriginType::Signed(default_genesis_config().forum_sudo),
                parent: None,
                title: "My new category".as_bytes().to_vec(),
                description: "This is a great new category for the forum".as_bytes().to_vec()
            };

            // let f2 = ...
            // let f3 = ...
            // let f4 = ...

            // Make module call
            f1.call_module().is_ok();

            // f2.call_module();
            // f3.call_module();
            // f4.call_module();

            // assert state!

        });
    }



}
