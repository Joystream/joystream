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

use srml_support::traits::Currency;
use srml_support::{decl_event, decl_module, decl_storage, dispatch, StorageValue};
use system::ensure_signed;

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
struct BlockchainTimestamp<BlockNumber, Moment> {
    block : BlockNumber,
    time: Moment
}

//#[cfg_attr(feature = "std", derive(Serialize, Deserialize, Debug))]
/// Represents a moderation outcome applied to a post or a thread. 
struct ModerationAction<BlockNumber, Moment, AccountId> {

    /// When action occured.
    occured_at: BlockchainTimestamp<BlockNumber, Moment>,

    /// Account forum sudo which acted.
    moderator_id: AccountId,

    /// Moderation rationale
    rationale: Vec<u8>

}

/// Represents a revision of the text of a Post
struct PostTextEdit<BlockNumber, Moment> {

    /// What this edit occured.
    edited_at: BlockchainTimestamp<BlockNumber, Moment>,

    /// New text
    new_text: Vec<u8>
}

/// Represents a thread post
type PostId = u64;
struct Post<BlockNumber, Moment, AccountId> {

    /// Post identifier
    id: PostId,

    /// Id of thread to which this post corresponds.
    thread_id: ThreadId,

    // Position of post in thread.
    position: u64,

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

/// Represents a thread
type ThreadId = u64;
struct Thread<BlockNumber, Moment, AccountId> {

    /// Thread identifier
    id : ThreadId,

    /// Title
    title : Vec<u8>,

    /// Category in which this thread lives
    category_id: CategoryId,

    /// Position of thread in category.
    position: u64,

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

/// Represents a category
type CategoryId = u64;
struct Category<BlockNumber, Moment, AccountId> {

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


pub type BalanceOf<T> =
    <<T as Trait>::Currency as Currency<<T as system::Trait>::AccountId>>::Balance;

/// Our module's configuration trait. All our types and consts go in here. If the
/// module is dependent on specific other modules, then their configuration traits
/// should be added to our implied traits list.
///
/// `system::Trait` should always be included in our implied traits.
pub trait Trait: system::Trait + Sized {
    /// The overarching event type.
    type Event: From<Event<Self>> + Into<<Self as system::Trait>::Event>;

    type Currency: Currency<Self::AccountId>;

    type MembershipRegistry: ForumUserRegistry<Self::AccountId>;
}

decl_storage! {
    // A macro for the Storage trait, and its implementation, for this module.
    // This allows for type-safe usage of the Substrate storage database, so you can
    // keep things around between blocks.
    trait Store for Module<T: Trait> as Example {
        // Any storage declarations of the form:
        //   `pub? Name get(getter_name)? [config()|config(myname)] [build(|_| {...})] : <type> (= <new_default_value>)?;`
        // where `<type>` is either:
        //   - `Type` (a basic value item); or
        //   - `map KeyType => ValueType` (a map item).
        //
        // Note that there are two optional modifiers for the storage type declaration.
        // - `Foo: Option<u32>`:
        //   - `Foo::put(1); Foo::get()` returns `Some(1)`;
        //   - `Foo::kill(); Foo::get()` returns `None`.
        // - `Foo: u32`:
        //   - `Foo::put(1); Foo::get()` returns `1`;
        //   - `Foo::kill(); Foo::get()` returns `0` (u32::default()).
        // e.g. Foo: u32;
        // e.g. pub Bar get(bar): map T::AccountId => Vec<(BalanceOf<T>, u64)>;
        //
        // For basic value items, you'll get a type which implements
        // `support::StorageValue`. For map items, you'll get a type which
        // implements `support::StorageMap`.
        //
        // If they have a getter (`get(getter_name)`), then your module will come
        // equipped with `fn getter_name() -> Type` for basic value items or
        // `fn getter_name(key: KeyType) -> ValueType` for map items.
        Dummy get(dummy) config(): Option<BalanceOf<T>>;

        // A map that has enumerable entries.
        Bar get(bar) config(): linked_map T::AccountId => BalanceOf<T>;

        // this one uses the default, we'll demonstrate the usage of 'mutate' API.
        Foo get(foo) config(): BalanceOf<T>;


        // ==== Constraints ====

    }
}

decl_event!(
    /// Events are a simple means of reporting specific conditions and
    /// circumstances that have happened that users, Dapps and/or chain explorers would find
    /// interesting and otherwise difficult to detect.
    pub enum Event<T>
    where
        B = BalanceOf<T>,
    {
        // Just a normal `enum`, here's a dummy event to ensure it compiles.
        /// Dummy event, just here so there's a generic type that's used.
        Dummy(B),
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
    // Simple declaration of the `Module` type. Lets the macro know what its working on.
    pub struct Module<T: Trait> for enum Call where origin: T::Origin {
        /// Deposit one of this module's events by using the default implementation.
        /// It is also possible to provide a custom implementation.
        /// For non-generic events, the generic parameter just needs to be dropped, so that it
        /// looks like: `fn deposit_event() = default;`.
        fn deposit_event<T>() = default;
        /// This is your public interface. Be extremely careful.
        /// This is just a simple example of how to interact with the module from the external
        /// world.
        // This just increases the value of `Dummy` by `increase_by`.
        //
        // Since this is a dispatched function there are two extremely important things to
        // remember:
        //
        // - MUST NOT PANIC: Under no circumstances (save, perhaps, storage getting into an
        // irreparably damaged state) must this function panic.
        // - NO SIDE-EFFECTS ON ERROR: This function must either complete totally (and return
        // `Ok(())` or it must have no side-effects on storage and return `Err('Some reason')`.
        //
        // The first is relatively easy to audit for - just ensure all panickers are removed from
        // logic that executes in production (which you do anyway, right?!). To ensure the second
        // is followed, you should do all tests for validity at the top of your function. This
        // is stuff like checking the sender (`origin`) or that state is such that the operation
        // makes sense.
        //
        // Once you've determined that it's all good, then enact the operation and change storage.
        // If you can't be certain that the operation will succeed without substantial computation
        // then you have a classic blockchain attack scenario. The normal way of managing this is
        // to attach a bond to the operation. As the first major alteration of storage, reserve
        // some value from the sender's account (`Balances` module has a `reserve` function for
        // exactly this scenario). This amount should be enough to cover any costs of the
        // substantial execution in case it turns out that you can't proceed with the operation.
        //
        // If it eventually transpires that the operation is fine and, therefore, that the
        // expense of the checks should be borne by the network, then you can refund the reserved
        // deposit. If, however, the operation turns out to be invalid and the computation is
        // wasted, then you can burn it or repatriate elsewhere.
        //
        // Security bonds ensure that attackers can't game it by ensuring that anyone interacting
        // with the system either progresses it or pays for the trouble of faffing around with
        // no progress.
        //
        // If you don't respect these rules, it is likely that your chain will be attackable.
        fn accumulate_dummy(origin, increase_by: BalanceOf<T>) -> dispatch::Result {
            // This is a public call, so we ensure that the origin is some signed account.
            let sender = ensure_signed(origin)?;

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
            <Dummy<T>>::mutate(|dummy| {
                let new_dummy = dummy.map_or(increase_by, |dummy| dummy + increase_by);
                *dummy = Some(new_dummy);
            });

            // Let's deposit an event to let the outside world know this happened.
            Self::deposit_event(RawEvent::Dummy(increase_by));

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
        fn set_dummy(#[compact] new_value: BalanceOf<T>) {
            // Put the new value into storage.
            <Dummy<T>>::put(new_value);
        }

        // The signature could also look like: `fn on_initialize()`
        fn on_initialize(_n: T::BlockNumber) {
            // Anything that needs to be done at the start of the block.
            // We don't do anything here.
        }

        // The signature could also look like: `fn on_finalize()`
        fn on_finalize(_n: T::BlockNumber) {
            // Anything that needs to be done at the end of the block.
            // We just kill our dummy storage item.
            <Dummy<T>>::kill();
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
}
