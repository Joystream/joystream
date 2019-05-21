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
//use parity_codec::Codec;

use parity_codec_derive::{Decode, Encode};
use srml_support::traits::Currency;
use srml_support::{decl_event, decl_module, decl_storage, dispatch, StorageValue};
use system::ensure_signed;
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
    occured_at: BlockchainTimestamp<BlockNumber, Moment>,

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

    // Position of post in thread.
    position: u32,

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

    /// Position of thread in category.
    position: u32,

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

    /// Number direct subcategories.
    num_direct_subcategories: u64,

    /// Number of unmoderated threads directly in this category.
    num_direct_unmoderated_threads: u64,

    /// Number of moderated threads directly in this category.
    num_direct_moderated_threads: u64,

    /// Parent category, if present, otherwise this category is a root categoryl
    parent_id: Option<CategoryId>,

    /// Account of the forum sudo which created category.
    forum_sudo_creator: AccountId
}

pub trait Trait: system::Trait + timestamp::Trait + Sized {

    /// The overarching event type.
    type Event: From<Event<Self>> + Into<<Self as system::Trait>::Event>;

    type Currency: Currency<Self::AccountId>;

    type MembershipRegistry: ForumUserRegistry<Self::AccountId>;
}

decl_storage! {
    trait Store for Module<T: Trait> as Forum {

        /// Map category identifier to corresponding category.
        pub CategoryById get(category_by_id) config(): map CategoryId => Category<T::BlockNumber, T::Moment, T::AccountId>;

        /// Category identifier value to be used for the next Category created.
        pub NextCategoryId get(next_category_id) config(): CategoryId;

        /// Map thread identifier to corresponding thread.
        pub ThreadById get(thread_by_id): map ThreadId => Thread<T::BlockNumber, T::Moment, T::AccountId>;

        /// Thread identifier value to be used for next Thread in threadById.
        pub NextThreadId get(next_thread_id) config(): ThreadId;

        /// Map post identifier to corresponding post.
        pub PostById get(post_by_id): map PostId => Post<T::BlockNumber, T::Moment, T::AccountId>;

        /// Post identifier value to be used for for next post created.
        pub NextPostId get(next_post_id) config(): PostId;

        /// Account of forum sudo.
        pub ForumSudo get(forum_sudo) config(): T::AccountId;

        // === Add constraints here ===

    }
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
        ForumSudoSet(AccountId),
    }
);

// The module declaration. This states the entry points that we handle. The
// macro takes care of the marshalling of arguments and dispatch.
//
// Anyone can have these functions execute by signing and submitting
// an extrinsic. Ensure that calls into each of these execute in a time, memory and
// using storage space proportional to any costs paid for by the caller or otherwise the
// difficulty of forcing the call to happen.
//
// Generally you'll want to split these into three groups:
// - Public calls that are signed by an external account.
// - Root calls that are allowed to be made only by the governance system.
// - Inherent calls that are allowed to be made only by the block authors and validators.
//
// Information about where this dispatch initiated from is provided as the first argument
// "origin". As such functions must always look like:
//
// `fn foo(origin, bar: Bar, baz: Baz) -> Result;`
//
// The `Result` is required as part of the syntax (and expands to the conventional dispatch
// result of `Result<(), &'static str>`).
//
// When you come to `impl` them later in the module, you must specify the full type for `origin`:
//
// `fn foo(origin: T::Origin, bar: Bar, baz: Baz) { ... }`
//
// There are three entries in the `system::Origin` enum that correspond
// to the above bullets: `::Signed(AccountId)`, `::Root` and `::Inherent`. You should always match
// against them as the first thing you do in your function. There are three convenience calls
// in system that do the matching for you and return a convenient result: `ensure_signed`,
// `ensure_root` and `ensure_inherent`.
decl_module! {
    pub struct Module<T: Trait> for enum Call where origin: T::Origin {
        /// Deposit one of this module's events by using the default implementation.
        /// It is also possible to provide a custom implementation.
        /// For non-generic events, the generic parameter just needs to be dropped, so that it
        /// looks like: `fn deposit_event() = default;`.
        fn deposit_event<T>() = default;


        fn accumulate_dummy(origin) -> dispatch::Result {
            // This is a public call, so we ensure that the origin is some signed account.
            //let sender = ensure_signed(origin)?;

            //// let _ = T::MembershipRegistry::ensure_member(sender)?;

            // Read the value of dummy from storage.
            // let dummy = Self::dummy();
            // Will also work using the `::get` on the storage item type itself:
            // let dummy = <Dummy<T>>::get();

            // Calculate the new value.
            // let new_dummy = dummy.map_or(increase_by, |dummy| dummy + increase_by);

            // Put the new value into storage.
            // <Dummy<T>>::put(new_dummy);
            // Will also work with a reference:
            // <Dummy<T>>::put(&new_dummy);

            // Here's the new one of read and then modify the value.
            //<Dummy<T>>::mutate(|dummy| {
            //    let new_dummy = dummy.map_or(increase_by, |dummy| dummy + increase_by);
            //    *dummy = Some(new_dummy);
            //});

            // Let's deposit an event to let the outside world know this happened.
            //Self::deposit_event(RawEvent::Dummy(increase_by));

            // All good.
            Ok(())
        }

        /// A privileged call; in this case it resets our dummy value to something new.
        // Implementation of a privileged call. This doesn't have an `origin` parameter because
        // it's not (directly) from an extrinsic, but rather the system as a whole has decided
        // to execute it. Different runtimes have different reasons for allow privileged
        // calls to be executed - we don't need to care why. Because it's privileged, we can
        // assume it's a one-off operation and substantial processing/storage/memory can be used
        // without worrying about gameability or attack scenarios.
        // If you not specify `Result` explicitly as return value, it will be added automatically
        // for you and `Ok(())` will be returned.
        /*
        fn set_dummy(#[compact] new_value: BalanceOf<T>) {
            // Put the new value into storage.
            //<Dummy<T>>::put(new_value);
        }
        */

        // The signature could also look like: `fn on_initialize()`
        fn on_initialize(_n: T::BlockNumber) {
            // Anything that needs to be done at the start of the block.
            // We don't do anything here.
        }

        // The signature could also look like: `fn on_finalize()`
        fn on_finalize(_n: T::BlockNumber) {
            // Anything that needs to be done at the end of the block.
            // We just kill our dummy storage item.
            //<Dummy<T>>::kill();
        }

        // A runtime code run after every block and have access to extended set of APIs.
        //
        // For instance you can generate extrinsics for the upcoming produced block.
        fn offchain_worker(_n: T::BlockNumber) {
            // We don't do anything here.
            // but we could dispatch extrinsic (transaction/inherent) using
            // runtime_io::submit_extrinsic
        }
    }
}

// The main implementation block for the module. Functions here fall into three broad
// categories:
// - Public interface. These are functions that are `pub` and generally fall into inspector
// functions that do not write to storage and operation functions that do.
// - Private functions. These are your usual private utilities unavailable to other modules.
impl<T: Trait> Module<T> {
    // Add public immutables and private mutables.

    /*
    #[allow(dead_code)]
    fn accumulate_foo(origin: T::Origin, increase_by: BalanceOf<T>) -> dispatch::Result {
        
        let _sender = ensure_signed(origin)?;

        let prev = <Foo<T>>::get();
        // Because Foo has 'default', the type of 'foo' in closure is the raw type instead of an Option<> type.
        let result = <Foo<T>>::mutate(|foo| {
            *foo = *foo + increase_by;
            *foo
        });
        assert!(prev + increase_by == result);

        Ok(())
    }
    */
}

#[cfg(test)]
mod tests {
    use super::*;

    use primitives::{Blake2Hasher, H256};
    use runtime_io::with_externalities;
    use srml_support::{assert_ok, impl_outer_origin};
    // The testing primitives are very useful for avoiding having to work with signatures
    // or public keys. `u64` is used as the `AccountId` and no `Signature`s are requried.
    use runtime_primitives::{
        testing::{Digest, DigestItem, Header},
        traits::{BlakeTwo256, IdentityLookup, OnFinalize, OnInitialize},
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
        type Currency = Balances;
        type MembershipRegistry = MockForumUserRegistry<<Test as system::Trait>::AccountId>;
    }


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
        
        // HashMap<AccountId, <Self as ForumUserRegistry<AccountId>>::ForumUser>
    }

    impl<AccountId> ForumUserRegistry<AccountId> for MockForumUserRegistry<AccountId> where AccountId: std::cmp::Ord{

        type ForumUser = MockForumUser<AccountId>;

        fn get_forum_user(&self, id:AccountId) -> Option<&Self::ForumUser> {
            self.forum_user_from_id.get(&id)
        }
        
    }
    
    type Example = Module<Test>;
    type Balances = balances::Module<Test>;
/*
    // This function basically just builds a genesis storage key/value store according to
    // our desired mockup.
    fn new_test_ext() -> runtime_io::TestExternalities<Blake2Hasher> {
        let mut t = system::GenesisConfig::<Test>::default()
            .build_storage()
            .unwrap()
            .0;
        // We use default for brevity, but you can configure as desired if needed.
        t.extend(
            balances::GenesisConfig::<Test>::default()
                .build_storage()
                .unwrap()
                .0,
        );
        t.extend(
            GenesisConfig::<Test> {
                dummy: 42,
                // we configure the map with (key, value) pairs.
                bar: vec![(1, 2), (2, 3)],
                foo: 24,
            }
            .build_storage()
            .unwrap()
            .0,
        );
        t.into()
    }

    #[test]
    fn it_works_for_optional_value() {
        with_externalities(&mut new_test_ext(), || {
            // Check that GenesisBuilder works properly.
            assert_eq!(Example::dummy(), Some(42));

            // Check that accumulate works when we have Some value in Dummy already.
            assert_ok!(Example::accumulate_dummy(Origin::signed(1), 27));
            assert_eq!(Example::dummy(), Some(69));

            // Check that finalizing the block removes Dummy from storage.
            <Example as OnFinalize<u64>>::on_finalize(1);
            assert_eq!(Example::dummy(), None);

            // Check that accumulate works when we Dummy has None in it.
            <Example as OnInitialize<u64>>::on_initialize(2);
            assert_ok!(Example::accumulate_dummy(Origin::signed(1), 42));
            assert_eq!(Example::dummy(), Some(42));
        });
    }

    
    #[test]
    fn it_works_for_default_value() {
        with_externalities(&mut new_test_ext(), || {
            assert_eq!(Example::foo(), 24);
            assert_ok!(Example::accumulate_foo(Origin::signed(1), 1));
            assert_eq!(Example::foo(), 25);
        });
    }
    */
}
