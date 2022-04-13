#![cfg(test)]

use frame_support::{
    impl_outer_event, impl_outer_origin, parameter_types,
    traits::{Currency, OnFinalize, OnInitialize},
};

use codec::Encode;
use sp_arithmetic::Perbill;
use sp_io::TestExternalities;
use sp_runtime::testing::{Header, H256};
use sp_runtime::traits::{BlakeTwo256, Convert, Hash, IdentityLookup};
use sp_runtime::ModuleId;

// crate import
use crate::{
    types::{MerkleSide},
    AccountDataOf, GenesisConfig, TokenDataOf, TokenIssuanceParametersOf, Trait, TransferPolicyOf,
};

// Crate aliases
pub type TokenId = <Test as Trait>::TokenId;
pub type TokenData = TokenDataOf<Test>;
pub type IssuanceParams = TokenIssuanceParametersOf<Test>;
pub type AccountData = AccountDataOf<Test>;
pub type AccountId = <Test as frame_system::Trait>::AccountId;
pub type BlockNumber = <Test as frame_system::Trait>::BlockNumber;
pub type Balance = <Test as Trait>::Balance;
pub type Policy = TransferPolicyOf<Test>;
pub type Hashing = <Test as frame_system::Trait>::Hashing;
pub type HashOut = <Test as frame_system::Trait>::Hash;

#[derive(Clone, PartialEq, Eq, Debug)]
pub struct Test;

impl_outer_origin! {
    pub enum Origin for Test {}
}

mod token {
    pub use crate::Event;
}

#[macro_export]
macro_rules! last_event_eq {
    ($e:expr) => {
        assert_eq!(System::events().last().unwrap().event, TestEvent::token($e));
    };
}

#[macro_export]
macro_rules! origin {
    ($a: expr) => {
        Origin::signed($a)
    };
}

impl_outer_event! {
    pub enum TestEvent for Test {
        token<T>,
        frame_system<T>,
        balances<T>,
    }
}

// Trait constants
pub const BLOAT_BOND: u64 = 100;

parameter_types! {
    // constants for frame_system::Trait
    pub const BlockHashCount: u64 = 250;
    pub const MaximumBlockWeight: u32 = 1024;
    pub const MaximumBlockLength: u32 = 2 * 1024;
    pub const AvailableBlockRatio: Perbill = Perbill::one();
    pub const MinimumPeriod: u64 = 5;
    // constants for crate::Trait
    pub const TokenModuleId: ModuleId = ModuleId(*b"m__Token"); // module storage
    pub const BloatBond: u64 = BLOAT_BOND;
    // constants for balances::Trait
    pub const ExistentialDeposit: u64 = 0;
}

impl frame_system::Trait for Test {
    type BaseCallFilter = ();
    type Origin = Origin;
    type Call = ();
    type Index = u64;
    type BlockNumber = u64;
    type Hash = H256;
    type Hashing = BlakeTwo256;
    type AccountId = u64;
    type Lookup = IdentityLookup<Self::AccountId>;
    type Header = Header;
    type Event = TestEvent;
    type BlockHashCount = BlockHashCount;
    type MaximumBlockWeight = MaximumBlockWeight;
    type DbWeight = ();
    type BlockExecutionWeight = ();
    type ExtrinsicBaseWeight = ();
    type MaximumExtrinsicWeight = ();
    type MaximumBlockLength = MaximumBlockLength;
    type AvailableBlockRatio = AvailableBlockRatio;
    type Version = ();
    type AccountData = balances::AccountData<u64>;
    type OnNewAccount = ();
    type OnKilledAccount = ();
    type PalletInfo = ();
    type SystemWeightInfo = ();
}

impl Trait for Test {
    type Event = TestEvent;
    type Balance = u64;
    type TokenId = u64;
    type BlockNumberToBalance = Block2Balance;
    type ModuleId = TokenModuleId;
    type BloatBond = BloatBond;
    type ReserveCurrency = Balances;
}

/// Implement pallet balances trait for Test
impl balances::Trait for Test {
    type Balance = u64;
    type DustRemoval = ();
    type Event = TestEvent;
    type ExistentialDeposit = ExistentialDeposit;
    type AccountStore = System;
    type WeightInfo = ();
    type MaxLocks = ();
}

/// Genesis config builder
pub struct GenesisConfigBuilder {
    pub(crate) account_info_by_token_and_account: Vec<(TokenId, AccountId, AccountData)>,
    pub(crate) token_info_by_id: Vec<(TokenId, TokenData)>,
    pub(crate) next_token_id: TokenId,
    pub(crate) symbol_used: Vec<(HashOut, ())>,
}

/// test externalities
pub fn build_test_externalities(config: GenesisConfig<Test>) -> TestExternalities {
    let mut t = frame_system::GenesisConfig::default()
        .build_storage::<Test>()
        .unwrap();

    config.assimilate_storage(&mut t).unwrap();

    let mut test_scenario = Into::<sp_io::TestExternalities>::into(t.clone());

    // Make sure we are not in block 1 where no events are emitted
    test_scenario.execute_with(|| increase_block_number_by(1));

    test_scenario
}

/// Moving past n blocks
pub fn increase_block_number_by(n: u64) {
    let init_block = System::block_number();
    (0..=n).for_each(|offset| {
        <Token as OnFinalize<u64>>::on_finalize(System::block_number());
        System::set_block_number(init_block.saturating_add(offset));
        <Token as OnInitialize<u64>>::on_initialize(System::block_number());
        <System as OnInitialize<u64>>::on_initialize(System::block_number());
    })
}

// helper macros
#[macro_export]
macro_rules! account {
    ($acc:expr) => {
        AccountId::from($acc as u32)
    };
}

#[macro_export]
macro_rules! token {
    ($id:expr) => {
        TokenId::from($id as u32)
    };
}

#[macro_export]
macro_rules! balance {
    ($bal:expr) => {
        Balance::from($bal as u32)
    };
}

#[macro_export]
macro_rules! block {
    ($b:expr) => {
        BlockNumber::from($b as u32)
    };
}

// Modules aliases
pub type Token = crate::Module<Test>;
pub type System = frame_system::Module<Test>;
pub type Balances = balances::Module<Test>;

// Merkle tree Helpers
#[derive(Debug)]
pub(crate) struct IndexItem {
    index: usize,
    side: MerkleSide,
}

pub(crate) fn index_path_helper(len: usize, index: usize) -> Vec<IndexItem> {
    // used as a helper function to generate the correct sequence of indexes used to
    // construct the merkle path necessary for membership proof
    let mut idx = index;
    assert!(idx > 0); // index starting at 1
    let floor_2 = |x: usize| (x >> 1) + (x % 2);
    let mut path = Vec::new();
    let mut prev_len: usize = 0;
    let mut el = len;
    while el != 1 {
        if idx % 2 == 1 && idx == el {
            path.push(IndexItem {
                index: prev_len + idx,
                side: MerkleSide::Left,
            });
        } else {
            match idx % 2 {
                1 => path.push(IndexItem {
                    index: prev_len + idx + 1,
                    side: MerkleSide::Right,
                }),
                _ => path.push(IndexItem {
                    index: prev_len + idx - 1,
                    side: MerkleSide::Left,
                }),
            };
        }
        prev_len += el;
        idx = floor_2(idx);
        el = floor_2(el);
    }
    return path;
}

pub(crate) fn generate_merkle_root_helper<E: Encode>(
    collection: &[E],
) -> Vec<<Test as frame_system::Trait>::Hash> {
    // generates merkle root from the ordered sequence collection.
    // The resulting vector is structured as follows: elements in range
    // [0..collection.len()) will be the tree leaves (layer 0), elements in range
    // [collection.len()..collection.len()/2) will be the nodes in the next to last layer (layer 1)
    // [layer_n_length..layer_n_length/2) will be the number of nodes in layer(n+1)
    assert!(!collection.is_empty());
    let mut out = Vec::new();
    for e in collection.iter() {
        out.push(Hashing::hash(&e.encode()));
    }

    let mut start: usize = 0;
    let mut last_len = out.len();
    //let mut new_len = out.len();
    let mut max_len = last_len >> 1;
    let mut rem = last_len % 2;

    // range [last..(maxlen >> 1) + (maxlen % 2)]
    while max_len != 0 {
        last_len = out.len();
        for i in 0..max_len {
            out.push(Hashing::hash(
                &[out[start + 2 * i], out[start + 2 * i + 1]].encode(),
            ));
        }
        if rem == 1 {
            out.push(Hashing::hash(
                &[out[last_len - 1], out[last_len - 1]].encode(),
            ));
        }
        let new_len: usize = out.len() - last_len;
        rem = new_len % 2;
        max_len = new_len >> 1;
        start = last_len;
    }
    out
}

/// Generates merkle proof (Hash, Side) for element collection[index_for_proof]
pub(crate) fn build_merkle_path_helper<E: Encode + Clone>(
    collection: &[E],
    index_for_proof: usize,
) -> Vec<(<Test as frame_system::Trait>::Hash, MerkleSide)> {
    let merkle_tree = generate_merkle_root_helper(collection);
    // builds the actual merkle path with the hashes needed for the proof
    let index_path = index_path_helper(collection.len(), index_for_proof + 1);
    index_path
        .iter()
        .map(|idx_item| (merkle_tree[idx_item.index - 1], idx_item.side))
        .collect()
}

#[macro_export]
macro_rules! merkle_root {
    [$($vals:expr),*] => {
        generate_merkle_root_helper(&vec![$($vals,)*]).pop().unwrap()
    };
}

#[macro_export]
macro_rules! merkle_proof {
    ($idx:expr,[$($vals:expr),*]) => {
        MerkleProofOf::<Test>::new(Some(build_merkle_path_helper(&vec![$($vals,)*], $idx as usize)))
    };
}

// utility types
pub struct Block2Balance {}

impl Convert<BlockNumber, Balance> for Block2Balance {
    fn convert(block: BlockNumber) -> Balance {
        block as u64
    }
}

pub fn increase_account_balance(account_id: &AccountId, balance: Balance) {
    let _ = Balances::deposit_creating(account_id, balance);
}
