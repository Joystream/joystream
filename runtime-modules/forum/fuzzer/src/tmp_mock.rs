
use crate::*;

use primitives::H256;

use substrate_forum_module::{GenesisConfig, Module, Trait, InputValidationLengthConstraint};

use runtime_primitives::{
    testing::Header,
    traits::{BlakeTwo256, Hash, IdentityLookup},
    Perbill,
};
use srml_support::{impl_outer_event, impl_outer_origin, parameter_types};

impl_outer_origin! {
    pub enum Origin for Runtime {}
}

mod forum_mod {
    pub use substrate_forum_module::Event;
}

impl_outer_event! {
    pub enum TestEvent for Runtime {
        forum_mod<T>,
    }
}

// Workaround for https://github.com/rust-lang/rust/issues/26925 . Remove when sorted.
#[derive(Clone, PartialEq, Eq, Debug)]
pub struct Runtime;
parameter_types! {
    pub const BlockHashCount: u64 = 250;
    pub const MaximumBlockWeight: u32 = 1024;
    pub const MaximumBlockLength: u32 = 2 * 1024;
    pub const AvailableBlockRatio: Perbill = Perbill::one();
    pub const MinimumPeriod: u64 = 5;
}

impl system::Trait for Runtime {
    type Origin = Origin;
    type Index = u64;
    type BlockNumber = u64;
    type Call = ();
    type Hash = H256;
    type Hashing = BlakeTwo256;
    type AccountId = u64;
    type Lookup = IdentityLookup<Self::AccountId>;
    type Header = Header;
    // type WeightMultiplierUpdate = ();
    type Event = TestEvent;
    type BlockHashCount = BlockHashCount;
    type MaximumBlockWeight = MaximumBlockWeight;
    type MaximumBlockLength = MaximumBlockLength;
    type AvailableBlockRatio = AvailableBlockRatio;
    type Version = ();
}

impl timestamp::Trait for Runtime {
    type Moment = u64;
    type OnTimestampSet = ();
    type MinimumPeriod = MinimumPeriod;
}

parameter_types! {
    pub const MaxCategoryDepth: u64 = 20;
}

impl Trait for Runtime {
    type Event = TestEvent;
    type ForumUserId = u64;
    type ModeratorId = u64;
    type CategoryId = u64;
    type ThreadId = u64;
    type PostId = u64;
    type PostReactionId = u64;
    type MaxCategoryDepth = MaxCategoryDepth;

    fn is_lead(account_id: &<Self as system::Trait>::AccountId) -> bool {
        *account_id == FORUM_LEAD_ORIGIN_ID
    }

    fn is_forum_member(
        account_id: &<Self as system::Trait>::AccountId,
        forum_user_id: &Self::ForumUserId,
    ) -> bool {
        let allowed_accounts = [
            FORUM_LEAD_ORIGIN_ID,
            NOT_FORUM_LEAD_ORIGIN_ID,
            NOT_FORUM_LEAD_2_ORIGIN_ID,
        ];

        allowed_accounts.contains(account_id) && account_id == forum_user_id
    }

    fn is_moderator(account_id: &Self::AccountId, moderator_id: &Self::ModeratorId) -> bool {
        let allowed_accounts = [
            FORUM_LEAD_ORIGIN_ID,
            FORUM_MODERATOR_ORIGIN_ID,
            FORUM_MODERATOR_2_ORIGIN_ID,
        ];

        allowed_accounts.contains(account_id) && account_id == moderator_id
    }

    fn calculate_hash(text: &[u8]) -> Self::Hash {
        Self::Hashing::hash(text)
    }
}

#[derive(Clone)]
pub enum OriginType {
    Signed(<Runtime as system::Trait>::AccountId),
    //Inherent, <== did not find how to make such an origin yet
}

pub fn mock_origin(origin: OriginType) -> mock::Origin {
    match origin {
        OriginType::Signed(account_id) => Origin::signed(account_id),
        //OriginType::Inherent => Origin::inherent,
    }
}

pub const FORUM_LEAD_ORIGIN_ID: <Runtime as system::Trait>::AccountId = 110;

pub const FORUM_LEAD_ORIGIN: OriginType = OriginType::Signed(FORUM_LEAD_ORIGIN_ID);

pub const NOT_FORUM_LEAD_ORIGIN_ID: <Runtime as system::Trait>::AccountId = 111;

pub const NOT_FORUM_LEAD_ORIGIN: OriginType = OriginType::Signed(NOT_FORUM_LEAD_ORIGIN_ID);

pub const NOT_FORUM_LEAD_2_ORIGIN_ID: <Runtime as system::Trait>::AccountId = 112;

pub const NOT_FORUM_LEAD_2_ORIGIN: OriginType = OriginType::Signed(NOT_FORUM_LEAD_2_ORIGIN_ID);

pub const INVLAID_CATEGORY_ID: <Runtime as Trait>::CategoryId = 333;

pub const FORUM_MODERATOR_ORIGIN_ID: <Runtime as system::Trait>::AccountId = 123;

pub const FORUM_MODERATOR_ORIGIN: OriginType = OriginType::Signed(FORUM_MODERATOR_ORIGIN_ID);

pub const FORUM_MODERATOR_2_ORIGIN_ID: <Runtime as system::Trait>::AccountId = 124;

pub const FORUM_MODERATOR_2_ORIGIN: OriginType = OriginType::Signed(FORUM_MODERATOR_2_ORIGIN_ID);


pub fn default_genesis_config() -> GenesisConfig<Runtime> {
    create_genesis_config(true)
}

pub fn migration_not_done_config() -> GenesisConfig<Runtime> {
    create_genesis_config(false)
}

pub fn create_genesis_config(data_migration_done: bool) -> GenesisConfig<Runtime> {
    GenesisConfig::<Runtime> {
        category_by_id: vec![], // endowed_accounts.iter().cloned().map(|k|(k, 1 << 60)).collect(),
        next_category_id: 1,
        thread_by_id: vec![],
        next_thread_id: 1,
        post_by_id: vec![],
        next_post_id: 1,

        category_by_moderator: vec![],
        reaction_by_post: vec![],

        poll_items_constraint: InputValidationLengthConstraint {
            min: 4,
            max_min_diff: 20,
        },

        // data migration part
        data_migration_done: data_migration_done,
    }
}

// NB!:
// Wanted to have payload: a: &GenesisConfig<Test>
// but borrow checker made my life miserabl, so giving up for now.
pub fn build_test_externalities(config: GenesisConfig<Runtime>) -> runtime_io::TestExternalities {
    let mut t = system::GenesisConfig::default()
        .build_storage::<Runtime>()
        .unwrap();

    config.assimilate_storage(&mut t).unwrap();

    t.into()
}

pub type System = system::Module<Runtime>;

pub type Timestamp = timestamp::Module<Runtime>;

/// Export forum module on a test runtime
pub type TestForumModule = Module<Runtime>;
