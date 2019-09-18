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

impl_outer_origin! {
    pub enum Origin for Test {}
}
use std::cell::RefCell;

struct StatusHandlerState {
    successes: Vec<RewardRelationshipId>,
    failures: Vec<RewardRelationshipId>,
}
impl StatusHandlerState {
    pub fn reset(&mut self) {
        self.successes = vec![];
        self.failures = vec![];
    }
}
impl Default for StatusHandlerState {
    fn default() -> Self {
        Self {
            successes: vec![],
            failures: vec![],
        }
    }
}

thread_local!(static STATUS_HANDLER_STATE: RefCell<StatusHandlerState> = RefCell::new(Default::default()));

pub struct MockStatusHandler {}
impl MockStatusHandler {
    pub fn reset() {
        STATUS_HANDLER_STATE.with(|cell| {
            cell.borrow_mut().reset();
        });
    }
    pub fn successes() -> usize {
        let mut value = 0;
        STATUS_HANDLER_STATE.with(|cell| {
            value = cell.borrow_mut().successes.len();
        });
        value
    }
    pub fn failures() -> usize {
        let mut value = 0;
        STATUS_HANDLER_STATE.with(|cell| {
            value = cell.borrow_mut().failures.len();
        });
        value
    }
}
impl<T: Trait> PayoutStatusHandler<T> for MockStatusHandler {
    fn payout_succeeded(
        id: RewardRelationshipId,
        _destination_account: &T::AccountId,
        _amount: BalanceOf<T>,
    ) {
        STATUS_HANDLER_STATE.with(|cell| {
            cell.borrow_mut().successes.push(id);
        });
    }

    fn payout_failed(
        id: RewardRelationshipId,
        _destination_account: &T::AccountId,
        _amount: BalanceOf<T>,
    ) {
        STATUS_HANDLER_STATE.with(|cell| {
            cell.borrow_mut().failures.push(id);
        });
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
