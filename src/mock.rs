#![cfg(test)]

use crate::*;

use primitives::{Blake2Hasher, H256};

use crate::{Module, Trait};
use balances;
use minting;
use runtime_primitives::{
    testing::Header,
    traits::{BlakeTwo256, IdentityLookup},
    Perbill,
};
use srml_support::{impl_outer_origin, parameter_types};

use rstd::collections::btree_map::BTreeMap;

impl_outer_origin! {
    pub enum Origin for Test {}
}

use std::sync::atomic::{AtomicUsize, Ordering};

// Simple variables to track number of invokations made to the status handler trait methods
// but this is not thread safe so must run tests with single thread: `cargo test -- --test-threads=1`
static STATUS_HANDLER_SUCCESSES: AtomicUsize = AtomicUsize::new(0);
static STATUS_HANDLER_FAILURES: AtomicUsize = AtomicUsize::new(0);

pub struct MockStatusHandler {}
impl MockStatusHandler {
    pub fn reset() {
        STATUS_HANDLER_SUCCESSES.store(0, Ordering::SeqCst);
        STATUS_HANDLER_FAILURES.store(0, Ordering::SeqCst);
    }
    pub fn successes() -> usize {
        STATUS_HANDLER_SUCCESSES.load(Ordering::SeqCst)
    }
    pub fn failures() -> usize {
        STATUS_HANDLER_FAILURES.load(Ordering::SeqCst)
    }
}
impl PayoutStatusHandler<Test> for MockStatusHandler {
    fn payout_succeeded(
        _id: RewardRelationshipId,
        _destination_account: &<Test as system::Trait>::AccountId,
        _amount: BalanceOf<Test>,
    ) {
        STATUS_HANDLER_SUCCESSES.fetch_add(1, Ordering::SeqCst);
    }

    fn payout_failed(
        _id: RewardRelationshipId,
        _destination_account: &<Test as system::Trait>::AccountId,
        _amount: BalanceOf<Test>,
    ) {
        STATUS_HANDLER_FAILURES.fetch_add(1, Ordering::SeqCst);
    }
}

// Workaround for https://github.com/rust-lang/rust/issues/26925 . Remove when sorted.
#[derive(Clone, PartialEq, Eq, Debug)]
pub struct Test;
parameter_types! {
    pub const BlockHashCount: u64 = 250;
    pub const MaximumBlockWeight: u32 = 1024;
    pub const MaximumBlockLength: u32 = 2 * 1024;
    pub const AvailableBlockRatio: Perbill = Perbill::one();
    pub const MinimumPeriod: u64 = 5;
}

impl system::Trait for Test {
    type Origin = Origin;
    type Index = u64;
    type BlockNumber = u64;
    type Call = ();
    type Hash = H256;
    type Hashing = BlakeTwo256;
    type AccountId = u64;
    type Lookup = IdentityLookup<Self::AccountId>;
    type Header = Header;
    type WeightMultiplierUpdate = ();
    type Event = ();
    type BlockHashCount = BlockHashCount;
    type MaximumBlockWeight = MaximumBlockWeight;
    type MaximumBlockLength = MaximumBlockLength;
    type AvailableBlockRatio = AvailableBlockRatio;
    type Version = ();
}

parameter_types! {
    pub const ExistentialDeposit: u32 = 0;
    pub const TransferFee: u32 = 0;
    pub const CreationFee: u32 = 0;
    pub const TransactionBaseFee: u32 = 1;
    pub const TransactionByteFee: u32 = 0;
    pub const InitialMembersBalance: u64 = 2000;
}

impl balances::Trait for Test {
    /// The type for recording an account's balance.
    type Balance = u64;
    /// What to do if an account's free balance gets zeroed.
    type OnFreeBalanceZero = ();
    /// What to do if a new account is created.
    type OnNewAccount = ();
    /// The ubiquitous event type.
    type Event = ();

    type TransactionPayment = ();
    type DustRemoval = ();
    type TransferPayment = ();
    type ExistentialDeposit = ExistentialDeposit;
    type TransferFee = TransferFee;
    type CreationFee = CreationFee;
    type TransactionBaseFee = TransactionBaseFee;
    type TransactionByteFee = TransactionByteFee;
    type WeightToFee = ();
}

impl Trait for Test {
    type PayoutStatusHandler = MockStatusHandler;
}

impl minting::Trait for Test {
    type Currency = Balances;
}

pub fn build_test_externalities() -> runtime_io::TestExternalities<Blake2Hasher> {
    MockStatusHandler::reset();

    let t = system::GenesisConfig::default()
        .build_storage::<Test>()
        .unwrap();

    t.into()
}

pub type System = system::Module<Test>;
pub type Balances = balances::Module<Test>;
pub type Rewards = Module<Test>;
pub type Minting = minting::Module<Test>;
