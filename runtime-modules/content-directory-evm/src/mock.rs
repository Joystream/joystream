#![cfg(test)]

use crate::{AccountAddressMapping, GenesisConfig, Module, Trait};
use frame_support::traits::OnFinalize;
use frame_support::{impl_outer_event, impl_outer_origin, parameter_types};
use frame_system::{EnsureOneOf, EnsureRoot, EnsureSigned, RawOrigin};
use hex::FromHex;
use pallet_evm::{
    Account as EVMAccount, AddressMapping, EnsureAddressNever, EnsureAddressRoot,
    EnsureAddressTruncated, FeeCalculator, HashedAddressMapping,
};
use sp_core::{Blake2Hasher, Hasher, H160, H256, U256};
use sp_io;
use sp_runtime::{
    testing::Header,
    traits::{BlakeTwo256, IdentityLookup},
    AccountId32, Perbill,
};
use std::collections::BTreeMap;
use std::marker::PhantomData;

mod event_mod {
    pub use crate::Event;
}

impl_outer_origin! {
    pub enum Origin for Runtime {}
}

impl_outer_event! {
    pub enum TestEvent for Runtime {
        event_mod<T>,
        frame_system<T>,
        pallet_balances<T>,
        pallet_evm<T>,
    }
}

//pub const REGULAR_ACCOUNT_1: u64 = 1;
pub const REGULAR_ACCOUNT_1: [u8; 32] = [1u8; 32];
pub const REGULAR_ACCOUNT_2: [u8; 32] = [2u8; 32];

// Workaround for https://github.com/rust-lang/rust/issues/26925 . Remove when sorted.
#[derive(Clone, PartialEq, Eq, Debug)]
pub struct Runtime;
parameter_types! {
    pub const BlockHashCount: u64 = 250;
    pub const MaximumBlockWeight: u32 = 1024;
    pub const MaximumBlockLength: u32 = 2 * 1024;
    pub const AvailableBlockRatio: Perbill = Perbill::one();
    pub const MinimumPeriod: u64 = 5;

    pub const ExistentialDeposit: u32 = 0;
}

impl frame_system::Trait for Runtime {
    type BaseCallFilter = ();
    type Origin = Origin;
    type Call = ();
    type Index = u64;
    type BlockNumber = u64;
    type Hash = H256;
    type Hashing = BlakeTwo256;
    //type AccountId = u64;
    type AccountId = AccountId32;
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
    type PalletInfo = ();
    //type AccountData = ();
    type AccountData = pallet_balances::AccountData<u64>;
    type OnNewAccount = ();
    type OnKilledAccount = ();
    type SystemWeightInfo = ();
}

impl Trait for Runtime {
    type Event = TestEvent;
    type MembershipId = u64;

    type Currency = pallet_balances::Module<Self>;

    //type AddressMapping = HashedAddressMapping<BlakeTwo256>;
    type AccountAddressMapping = AccountAddressConverter<Self::AccountId, H160, Blake2Hasher>;

    //type Evm = Self;
}

impl pallet_timestamp::Trait for Runtime {
    type Moment = u64;
    type OnTimestampSet = ();
    type MinimumPeriod = MinimumPeriod;
    type WeightInfo = ();
}

impl pallet_balances::Trait for Runtime {
    type Balance = u64;
    type Event = TestEvent;
    type DustRemoval = ();
    type ExistentialDeposit = ExistentialDeposit;
    type AccountStore = frame_system::Module<Self>;
    //type AccountStore = ();
    type WeightInfo = ();
    type MaxLocks = ();
}

pub struct AccountAddressConverter<AccountId, Address, H: Hasher<Out = H256>> {
    _dummy: PhantomData<(AccountId, Address, H)>, // 0-sized data meant only to bound generic parameters
}

impl<
        AccountId: From<AccountId32> + Into<AccountId32> + Clone,
        Address: From<H160> + Into<H160> + Clone,
        H: Hasher<Out = H256>,
    > AccountAddressMapping<AccountId, Address> for AccountAddressConverter<AccountId, Address, H>
{
    fn into_account_id(address: &Address) -> AccountId {
        let address_h160: H160 = address.clone().into();
        let address_bytes: [u8; 20] = address_h160.to_fixed_bytes();

        let mut address_bytes_32: [u8; 32] = [0u8; 32];
        address_bytes_32[0..20].copy_from_slice(&address_bytes[..]);

        let tmp = AccountId32::from(address_bytes_32);

        Self::account32_to_account(&tmp)
    }

    fn into_address(account_id: &AccountId) -> Address {
        let account_id32 = Self::account_to_account32(account_id);

        let account_bytes_32: [u8; 32] = *AsRef::<[u8; 32]>::as_ref(&account_id32);

        let mut address_bytes_20: [u8; 20] = [0u8; 20];
        address_bytes_20[0..20].copy_from_slice(&account_bytes_32[0..20]);

        H160::from(address_bytes_20).into()
    }

    fn normalize_account_id(account_id: &AccountId) -> AccountId {
        let account_id32 = Self::account_to_account32(&account_id);

        let tmp = *AsRef::<[u8; 32]>::as_ref(&account_id32);

        let mut normalize_account_id: [u8; 32] = [0u8; 32];
        normalize_account_id[0..20].copy_from_slice(&tmp[0..20]);

        let account_id32 = AccountId32::from(normalize_account_id);

        Self::account32_to_account(&account_id32)
    }

    fn account_to_account32(account_id: &AccountId) -> AccountId32 {
        account_id.clone().into()
    }

    fn account32_to_account(account_id: &AccountId32) -> AccountId {
        account_id.clone().into()
    }
}

impl<
        AccountId: From<AccountId32> + Into<AccountId32> + Clone,
        Address: From<H160> + Into<H160> + Clone,
        H: Hasher<Out = H256>,
    > AddressMapping<AccountId32> for AccountAddressConverter<AccountId, Address, H>
{
    fn into_account_id(address: H160) -> AccountId32 {
        let account_id =
            <Self as AccountAddressMapping<AccountId, Address>>::into_account_id(&address.into());

        <Self as AccountAddressMapping<AccountId, Address>>::account_to_account32(&account_id)
    }
}

//static ISTANBUL_CONFIG: Config = Config::istanbul();

pub struct FixedGasPrice;
impl FeeCalculator for FixedGasPrice {
    fn min_gas_price() -> U256 {
        // Gas price is always one token per gas.
        1.into()
    }
}

parameter_types! {
    pub const ChainId: u64 = 1;
}

// This trait needs newer version of evm pallet (thus upgrade to whole branch is required)
impl pallet_evm::Trait for Runtime {
    type FeeCalculator = FixedGasPrice;
    type CallOrigin = EnsureAddressRoot<Self::AccountId>;
    type WithdrawOrigin = EnsureAddressNever<Self::AccountId>;
    type AddressMapping = AccountAddressConverter<Self::AccountId, H160, Blake2Hasher>;
    type Currency = pallet_balances::Module<Runtime>;
    type Event = TestEvent;
    type Precompiles = ();
    type ChainId = ChainId;
}

/////////////////// Data structures ////////////////////////////////////////////

#[allow(dead_code)]
#[derive(Clone)]
pub enum OriginType<AccountId> {
    Signed(AccountId),
    //Inherent, <== did not find how to make such an origin yet
    Root,
}

/////////////////// Util macros ////////////////////////////////////////////////

pub fn default_genesis_config() -> GenesisConfig<Runtime> {
    GenesisConfig::<Runtime> {
        my_storage_value: 0,
        //accounts: BTreeMap::new(),
    }
}

pub fn build_test_externalities(config: GenesisConfig<Runtime>) -> sp_io::TestExternalities {
    let mut t = frame_system::GenesisConfig::default()
        .build_storage::<Runtime>()
        .unwrap();

    config.assimilate_storage(&mut t).unwrap();

    let mut result = Into::<sp_io::TestExternalities>::into(t.clone());

    // Make sure we are not in block 1 where no events are emitted
    // see https://substrate.dev/recipes/2-appetizers/4-events.html#emitting-events
    result.execute_with(|| InstanceMockUtils::<Runtime>::increase_block_number(1));

    result
}

pub struct InstanceMockUtils<T: Trait> {
    _dummy: PhantomData<T>, // 0-sized data meant only to bound generic parameters
}

impl<T: Trait> InstanceMockUtils<T>
where
    T::BlockNumber: From<u64> + Into<u64>,
    T::AccountId: From<AccountId32> + Into<AccountId32> + Clone,
{
    pub fn mock_origin(origin: OriginType<T::AccountId>) -> T::Origin {
        match origin {
            OriginType::Signed(account_id) => T::Origin::from(RawOrigin::Signed(account_id)),
            OriginType::Root => RawOrigin::Root.into(),
            //_ => panic!("not implemented"),
        }
    }

    pub fn increase_block_number(increase: u64) -> () {
        let block_number = frame_system::Module::<T>::block_number();

        for i in 0..increase {
            let tmp_index: T::BlockNumber = block_number + i.into();

            <Module<T> as OnFinalize<T::BlockNumber>>::on_finalize(tmp_index);
            frame_system::Module::<T>::set_block_number(tmp_index + 1.into());
        }
    }

    pub fn accounts_compare_20_bytes(
        account_id_a: &T::AccountId,
        account_id_b: &T::AccountId,
    ) -> bool {
        let a: AccountId32 = account_id_a.clone().into();
        let b: AccountId32 = account_id_b.clone().into();

        let account_id_b_ref: [u8; 32] = *AsRef::<[u8; 32]>::as_ref(&a);
        let account_id_a_ref: [u8; 32] = *AsRef::<[u8; 32]>::as_ref(&b);

        account_id_a_ref[0..20] == account_id_b_ref[0..20]
    }

    pub fn get_testing_contract() -> Vec<u8> {
        // TODO: load bytecode from file or compile it from source

        // implementation of OpenZeppelin's `Ownable` contract via simple `contract MyOwnable is Ownable {...}`
        //let abi = [{"inputs":[],"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"previousOwner","type":"address"},{"indexed":true,"internalType":"address","name":"newOwner","type":"address"}],"name":"OwnershipTransferred","type":"event"},{"inputs":[],"name":"owner","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"renounceOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"newOwner","type":"address"}],"name":"transferOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"}];
        let bytecode_string: &str = "608060405234801561001057600080fd5b5060006100216100c460201b60201c565b9050806000806101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff1602179055508073ffffffffffffffffffffffffffffffffffffffff16600073ffffffffffffffffffffffffffffffffffffffff167f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e060405160405180910390a3506100cc565b600033905090565b6104e6806100db6000396000f3fe608060405234801561001057600080fd5b50600436106100415760003560e01c8063715018a6146100465780638da5cb5b14610050578063f2fde38b14610084575b600080fd5b61004e6100c8565b005b61005861024e565b604051808273ffffffffffffffffffffffffffffffffffffffff16815260200191505060405180910390f35b6100c66004803603602081101561009a57600080fd5b81019080803573ffffffffffffffffffffffffffffffffffffffff169060200190929190505050610277565b005b6100d0610482565b73ffffffffffffffffffffffffffffffffffffffff1660008054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1614610190576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004018080602001828103825260208152602001807f4f776e61626c653a2063616c6c6572206973206e6f7420746865206f776e657281525060200191505060405180910390fd5b600073ffffffffffffffffffffffffffffffffffffffff1660008054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff167f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e060405160405180910390a360008060006101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff160217905550565b60008060009054906101000a900473ffffffffffffffffffffffffffffffffffffffff16905090565b61027f610482565b73ffffffffffffffffffffffffffffffffffffffff1660008054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff161461033f576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004018080602001828103825260208152602001807f4f776e61626c653a2063616c6c6572206973206e6f7420746865206f776e657281525060200191505060405180910390fd5b600073ffffffffffffffffffffffffffffffffffffffff168173ffffffffffffffffffffffffffffffffffffffff1614156103c5576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040180806020018281038252602681526020018061048b6026913960400191505060405180910390fd5b8073ffffffffffffffffffffffffffffffffffffffff1660008054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff167f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e060405160405180910390a3806000806101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff16021790555050565b60003390509056fe4f776e61626c653a206e6577206f776e657220697320746865207a65726f2061646472657373a26469706673582212204de67e0cfcac78f7e6543b424bdae8f52d0d6e4351ef2440347d5f16056fae5564736f6c634300060c0033";

        let bytecode: Vec<u8> = Vec::from_hex(bytecode_string).expect("Invalid hex");

        // (bytecode, abi)
        bytecode
    }

    pub fn get_testing_contract_call() -> Vec<u8> {
        // call of OpenZeppelin's `Ownable` contract's function `owner`
        let bytecode_string: &str = "8da5cb5b";

        let bytecode: Vec<u8> = Vec::from_hex(bytecode_string).expect("Invalid hex");
        bytecode
    }
}

/////////////////// Mocks of Module's actions //////////////////////////////////

pub struct InstanceMocks<T: Trait> {
    _dummy: PhantomData<T>, // 0-sized data meant only to bound generic parameters
}

impl<T: Trait> InstanceMocks<T>
where
    T::BlockNumber: From<u64> + Into<u64>,
    T::AccountId: From<AccountId32> + Into<AccountId32>,
{
    pub fn transfer_value(origin: OriginType<T::AccountId>, second_account_id: T::AccountId) {
        assert_eq!(
            Module::<T>::transfer_value(
                InstanceMockUtils::<T>::mock_origin(origin.clone()),
                second_account_id,
            )
            .is_ok(),
            true,
        );
    }

    pub fn deploy_smart_contract(
        origin: OriginType<T::AccountId>,
        account_from: T::AccountId,
        bytecode: Vec<u8>,
    ) {
        assert_eq!(
            Module::<T>::deploy_smart_contract(
                InstanceMockUtils::<T>::mock_origin(origin.clone()),
                account_from,
                bytecode
            )
            .is_ok(),
            true,
        );
    }

    pub fn call_smart_contract(
        origin: OriginType<T::AccountId>,
        account_to: T::AccountId,
        bytecode: Vec<u8>,
    ) {
        assert_eq!(
            Module::<T>::call_smart_contract(
                InstanceMockUtils::<T>::mock_origin(origin.clone()),
                account_to,
                bytecode
            )
            .is_ok(),
            true,
        );
    }
}
