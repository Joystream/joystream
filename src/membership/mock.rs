#![cfg(test)]

pub use super::members;
pub use crate::currency::GovernanceCurrency;
pub use srml_support::traits::Currency;
pub use system;

pub use primitives::{Blake2Hasher, H256};
pub use runtime_primitives::{
    testing::{Digest, DigestItem, Header, UintAuthorityId},
    traits::{BlakeTwo256, Convert, IdentityLookup, OnFinalize},
    weights::Weight,
    BuildStorage, Perbill,
};

use srml_support::{impl_outer_origin, parameter_types};

impl_outer_origin! {
    pub enum Origin for Test {}
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

impl timestamp::Trait for Test {
    type Moment = u64;
    type OnTimestampSet = ();
    type MinimumPeriod = MinimumPeriod;
}

parameter_types! {
    pub const ExistentialDeposit: u32 = 0;
    pub const TransferFee: u32 = 0;
    pub const CreationFee: u32 = 0;
    pub const TransactionBaseFee: u32 = 1;
    pub const TransactionByteFee: u32 = 0;
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

impl GovernanceCurrency for Test {
    type Currency = balances::Module<Self>;
}

impl members::Trait for Test {
    type Event = ();
    type MemberId = u32;
    type PaidTermId = u32;
    type SubscriptionId = u32;
    type RoleId = u32;
    type ActorId = u32;
}

pub struct ExtBuilder {
    first_member_id: u32,
    default_paid_membership_fee: u64,
}
impl Default for ExtBuilder {
    fn default() -> Self {
        Self {
            first_member_id: 1,
            default_paid_membership_fee: 100,
        }
    }
}

impl ExtBuilder {
    pub fn first_member_id(mut self, first_member_id: u32) -> Self {
        self.first_member_id = first_member_id;
        self
    }
    pub fn default_paid_membership_fee(mut self, default_paid_membership_fee: u64) -> Self {
        self.default_paid_membership_fee = default_paid_membership_fee;
        self
    }
    pub fn build(self) -> runtime_io::TestExternalities<Blake2Hasher> {
        let mut t = system::GenesisConfig::default()
            .build_storage::<Test>()
            .unwrap();

        members::GenesisConfig::<Test> {
            first_member_id: self.first_member_id,
            default_paid_membership_fee: self.default_paid_membership_fee,
            members: vec![],
        }
        .assimilate_storage(&mut t)
        .unwrap();

        t.into()
    }
}

pub type Balances = balances::Module<Test>;
pub type Members = members::Module<Test>;
