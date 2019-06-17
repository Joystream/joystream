#![cfg(test)]

use crate::*;

use primitives::{Blake2Hasher, H256};

use srml_support::{impl_outer_origin}; // assert, assert_eq
use crate::{GenesisConfig, Module, Trait};
use runtime_primitives::{
    testing::{Digest, DigestItem, Header},
    traits::{BlakeTwo256, IdentityLookup}, //OnFinalize, OnInitialize},
    BuildStorage,
};

/// Module which has a full Substrate module for 
/// mocking behaviour of MembershipRegistry
pub mod registry {

    use srml_support::*;
    use super::*;

    #[derive(Encode, Decode, Default, Clone, PartialEq, Eq)]
    pub struct Member<AccountId> {
        pub id: AccountId
    }

    decl_storage! {
        trait Store for Module<T: Trait> as MockForumUserRegistry {

            pub ForumUserById get(forum_user_by_id) config(): map T::AccountId => Member<T::AccountId>;

        }

        // A weird hack required to convince decl_storage that our field above
        // does indeed use the T, otherwise would start complaining about phantom fields.
        // An alternative fix is to add this extra key when initiatilising a gensisconfig for this module
        // _genesis_phantom_data: Default::default() 
        extra_genesis_skip_phantom_data_field;
    }

    decl_module! {
        pub struct Module<T: Trait> for enum Call where origin: T::Origin {}
    }

    impl<T: Trait> Module<T> {

        pub fn get_member(account_id: &T::AccountId) -> Option<Member<T::AccountId>> { 
            
            if <ForumUserById<T>>::exists(account_id) {
                Some(<ForumUserById<T>>::get(account_id))
            } else {
                None
            }

        }

        pub fn add_member(member: & Member<T::AccountId>) {
            <ForumUserById<T>>::insert(member.id.clone(), member.clone());
        }

    }

    impl<T: Trait> ForumUserRegistry<T::AccountId> for Module<T> {

        fn get_forum_user(id: &T::AccountId) -> Option<ForumUser<T::AccountId>> {

            if <ForumUserById<T>>::exists(id) {

                let m = <ForumUserById<T>>::get(id);

                Some(ForumUser{
                    id : m.id 
                })

            } else {
                None
            }

        }
    }

    pub type TestMembershipRegistryModule = Module<Runtime>;

}

impl_outer_origin! {
    pub enum Origin for Runtime {}
}

// Workaround for https://github.com/rust-lang/rust/issues/26925 . Remove when sorted.
#[derive(Clone, PartialEq, Eq, Debug)]
pub struct Runtime;

impl system::Trait for Runtime {
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

impl timestamp::Trait for Runtime {
    type Moment = u64;
    type OnTimestampSet = ();
}

impl Trait for Runtime {
    type Event = ();
    type MembershipRegistry = registry::TestMembershipRegistryModule;
}

pub enum OriginType {
    Signed(<Runtime as system::Trait>::AccountId),
    //Inherent, <== did not find how to make such an origin yet
    Root
}

pub struct CreateCategoryFixture {
    pub origin: OriginType,
    pub parent: Option<CategoryId>,
    pub title: Vec<u8>,
    pub description: Vec<u8>,
    pub result: dispatch::Result
}

impl CreateCategoryFixture {

    pub fn call_and_assert(&self) {

        assert_eq!(
            TestForumModule::create_category(
                match self.origin {
                    OriginType::Signed(account_id) => Origin::signed(account_id),
                    //OriginType::Inherent => Origin::inherent,
                    OriginType::Root => system::RawOrigin::Root.into() //Origin::root
                },
                self.parent,
                self.title.clone(),
                self.description.clone()
            ),
            self.result
        )
    }
}

// This function basically just builds a genesis storage key/value store according to
// our desired mockup.

// refactor
/// - add each config as parameter, then 
/// 

pub fn default_genesis_config() -> GenesisConfig<Runtime> {

    GenesisConfig::<Runtime> {
        category_by_id: vec![], // endowed_accounts.iter().cloned().map(|k|(k, 1 << 60)).collect(),
        next_category_id: 0,
        thread_by_id: vec![],
        next_thread_id: 0,
        post_by_id: vec![],
        next_post_id: 0,

        forum_sudo: 33,

        category_title_constraint: InputValidationLengthConstraint{
            min: 10,
            max_min_diff: 140
        },

        category_description_constraint: InputValidationLengthConstraint{
            min: 10,
            max_min_diff: 140
        },

        thread_title_constraint: InputValidationLengthConstraint{
            min: 3,
            max_min_diff: 43
        },

        post_text_constraint: InputValidationLengthConstraint{
            min: 1,
            max_min_diff: 1001
        },

        thread_moderation_rationale_constraint: InputValidationLengthConstraint{
            min: 100,
            max_min_diff: 2000
        },

        post_moderation_rationale_constraint: InputValidationLengthConstraint{
            min: 100,
            max_min_diff: 2000
        }


        // JUST GIVING UP ON ALL THIS FOR NOW BECAUSE ITS TAKING TOO LONG

        // Extra genesis fields
        //initial_forum_sudo: Some(143)
    }
}

// MockForumUserRegistry
pub fn default_mock_forum_user_registry_genesis_config() -> registry::GenesisConfig<Runtime> {

    registry::GenesisConfig::<Runtime> {
        forum_user_by_id : vec![],
    }
}

// NB!:
// Wanted to have payload: a: &GenesisConfig<Test>
// but borrow checker made my life miserabl, so giving up for now.
pub fn build_test_externalities() -> runtime_io::TestExternalities<Blake2Hasher> {

    let mut t = default_genesis_config()
        .build_storage()
        .unwrap()
        .0;

    // Add mock registry configuration
    t.extend(
        default_mock_forum_user_registry_genesis_config()
        .build_storage()
        .unwrap()
        .0
    );


    t.into()
}

/// Export forum module on a test runtime
pub type TestForumModule = Module<Runtime>;
