#![cfg(test)]
use super::*;
use primitives::H256;

use crate::{Module, Trait};

use runtime_primitives::{
    testing::Header,
    traits::{BlakeTwo256, IdentityLookup, OnInitialize},
    Perbill,
};
use srml_support::{impl_outer_event, impl_outer_origin, parameter_types};

impl_outer_origin! {
    pub enum Origin for Runtime {}
}

mod old_forum_mod {
    pub use old_forum::Event;
}

mod new_forum_mod {
    pub use new_forum::Event;
}

mod migration_mod {
    pub use crate::Event;
}

pub const FORUM_LEAD: <Runtime as system::Trait>::AccountId = 33;

impl_outer_event! {
    pub enum TestEvent for Runtime {
        migration_mod<T>,
        old_forum_mod<T>,
        new_forum_mod<T>,
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
    pub const DefaultMigrationConfig: MigrationConfig = Default::default();
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

pub struct ShimMembershipRegistry {}

impl old_forum::ForumUserRegistry<<Runtime as system::Trait>::AccountId>
    for ShimMembershipRegistry
{
    fn get_forum_user(
        _id: &<Runtime as system::Trait>::AccountId,
    ) -> Option<old_forum::ForumUser<<Runtime as system::Trait>::AccountId>> {
        None
    }
}

impl old_forum::Trait for Runtime {
    type Event = TestEvent;
    type MembershipRegistry = ShimMembershipRegistry;
}

impl new_forum::Trait for Runtime {
    type Event = TestEvent;
    type ForumUserId = u64;
    type ModeratorId = u64;
    type CategoryId = u64;
    type ThreadId = u64;
    type LabelId = u64;
    type PostId = u64;
}

impl Trait for Runtime {
    type Event = TestEvent;
    type MigrationConfig = DefaultMigrationConfig;
}

pub fn set_migration_config_mock(
    migrate_on_block_number: u32,
    max_categories_imported_per_block: u64,
    max_threads_imported_per_block: u64,
    max_posts_imported_per_block: u64,
) {
    TestModule::set_migration_config(MigrationConfig {
        migrate_on_block_number: migrate_on_block_number,
        max_categories_imported_per_block: max_categories_imported_per_block,
        max_threads_imported_per_block: max_threads_imported_per_block,
        max_posts_imported_per_block: max_posts_imported_per_block,
    })
}

pub fn create_migration_data_mock(
    account_id: <Runtime as system::Trait>::AccountId,
    thread_number: u32,
    post_number: u32,
    text: Vec<u8>,
) {
    TestModule::create_migration_data(account_id, thread_number, post_number, text);
}

pub fn on_initialize_mock(n: <Runtime as system::Trait>::BlockNumber, data_migration_done: bool) {
    TestModule::on_initialize(n);
    if data_migration_done {
        // TODO can't pass compilation
        // assert_eq!(
        //     System::events().last().unwrap().event,
        //     TestEvent::migration_mod(RawEvent::DataMigrationDone(n)),
        // );
    };
}

// NB!:
// Wanted to have payload: a: &GenesisConfig<Test>
// but borrow checker made my life miserabl, so giving up for now.
pub fn build_test_externalities() -> runtime_io::TestExternalities {
    let t = system::GenesisConfig::default()
        .build_storage::<Runtime>()
        .unwrap();
    t.into()
}

// pub type System = system::Module<Runtime>;

/// Export forum module on a test runtime
pub type TestModule = Module<Runtime>;
