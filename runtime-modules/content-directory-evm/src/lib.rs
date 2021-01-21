// TODO: module documentation
// TODO: adjust all extrinsic weights

/////////////////// Configuration //////////////////////////////////////////////
#![cfg_attr(not(feature = "std"), no_std)]

// used dependencies
use codec::{Codec, Decode, Encode};
use frame_support::traits::Currency;
use frame_support::{
    decl_error, decl_event, decl_module, decl_storage, error::BadOrigin, Parameter,
};
use frame_system::{ensure_root, ensure_signed};
#[cfg(feature = "std")]
use serde::{Deserialize, Serialize};
use sp_arithmetic::traits::BaseArithmetic;
use sp_core::{H160, H256, U256};
use sp_runtime::traits::{MaybeSerialize, Member};
use sp_runtime::AccountId32;

mod mock;
mod tests;

/////////////////// Data Structures ////////////////////////////////////////////

#[cfg(feature = "std")]
#[derive(Clone, Eq, PartialEq, Encode, Decode, Debug, Serialize, Deserialize)]
/// Account definition used for genesis block construction.
pub struct GenesisAccount {
    /// Account nonce.
    pub nonce: U256,
    /// Account balance.
    pub balance: U256,
    /// Full account storage.
    pub storage: std::collections::BTreeMap<H256, H256>,
    /// Account code.
    pub code: Vec<u8>,
}

/////////////////// Trait, Storage, Errors, and Events /////////////////////////

/// The main content directory evm trait.
pub trait Trait: frame_system::Trait + pallet_evm::Trait {
    /// The overarching event type.
    type Event: From<Event<Self>> + Into<<Self as frame_system::Trait>::Event>;

    /// Representation for content directory evm membership.
    type MembershipId: Parameter
        + Member
        + BaseArithmetic
        + Codec
        + Default
        + Copy
        + MaybeSerialize
        + PartialEq
        + From<u64>
        + Into<u64>;

    type AccountAddressMapping: AccountAddressMapping<Self::AccountId, H160>;

    type Currency: Currency<Self::AccountId>;

    // TODO: try to find a way include evm trait like this
    // (right now usage of this pattern causes error caused by difference Self::AccountId and Self::Evm::Accountid)
    //type Evm: pallet_evm::Trait;
}

/// Trait for mapping Substrate accounts to Eth addresses and vice versa.
pub trait AccountAddressMapping<AccountId, Address> {
    /// Convert Eth address to Substrate account.
    fn into_account_id(address: &Address) -> AccountId;

    /// Convert Substrate account to Eth address.
    fn into_address(account_id: &AccountId) -> Address;

    // Normalize account id for usage with EVM.
    // Use it everytime before `account_id` recieved from within Substrate is used.
    // This is needed for example when multiple T::AccountId (32-bytes) are converted into the same EVM address (20-bytes).
    fn normalize_account_id(account_id: &AccountId) -> AccountId;

    // arbitrary T::AccountId <-> AccountId32 type conversions
    fn account_to_account32(account_id: &AccountId) -> AccountId32;
    fn account32_to_account(account_id: &AccountId32) -> AccountId;
}

decl_storage! {
    trait Store for Module<T: Trait> as ContentDirectoryEvm {
        /// Dummy storage value
        pub MyStorageValue get(fn my_storage_value) config(): T::MembershipId;
    }
}

decl_event! {
    pub enum Event<T> where
        MembershipId = <T as Trait>::MembershipId,
    {
        /// Dummy event
        MyDummyEvent(MembershipId),

        /// Dummy event
        MyDummyEvent2(),
    }
}

decl_error! {
    /// ContentDirectoryEvm errors
    pub enum Error for Module<T: Trait> {
        /// Dummy error
        MyDummyError,

        // error inside of the evm - generic TODO: add specific errors for frequently occuring errors
        EvmError,

        BadOrigin,

        // error while calling EVM contract
        EvmCallFail,
    }
}

/*
impl<T: Trait> From<pallet_evm::Error<<T as Trait>::Evm>> for Error<T> {
    fn from(_error: pallet_evm::Error<<T as Trait>::Evm>) -> Self {
        Error::<T>::EvmError
    }
}
*/
impl<T: Trait> From<pallet_evm::Error<T>> for Error<T> {
    fn from(_error: pallet_evm::Error<T>) -> Self {
        Error::<T>::EvmError
    }
}

impl<T: Trait> From<BadOrigin> for Error<T> {
    fn from(_error: BadOrigin) -> Self {
        Error::<T>::BadOrigin
    }
}

/////////////////// Module definition and implementation ///////////////////////

decl_module! {
    pub struct Module<T: Trait> for enum Call where origin: T::Origin {
        /// Predefined errors
        type Error = Error<T>;

        /// Setup events
        fn deposit_event() = default;

        /// Test transfering value using EVM.
        #[weight = 10_000_000]
        pub fn transfer_value(
            origin,
            second_account_id: T::AccountId,
        ) -> Result<(), Error<T>> {
            let account_id = ensure_signed(origin)?;
            let account_id = T::AccountAddressMapping::normalize_account_id(&account_id);

            let address_from = T::AccountAddressMapping::into_address(&account_id);
            let address_to = T::AccountAddressMapping::into_address(&second_account_id);

            // topup account
            <T as Trait>::Currency::deposit_creating(
                &account_id,
                1000000000.into(),
            );

            // make sure currency was really deposited
            assert_eq!(<T as Trait>::Currency::free_balance(&account_id), 1000000000.into());

            let result = pallet_evm::Module::<T>::execute_call(
                address_from, // from address
                address_to, // to address
                vec![], // data
                10000.into(), // value
                400000, // gas limit
                1.into(), // gas price
                //Some(0.into()), // use custom nonce - nonce can be retrieved via `frame_system::Module::<T>::account_nonce(account_id).into()`
                None, // automaticly calculated nonce
                true, // apply state (difference between transaction and read-only call)
            );
            println!("{:?}", result);
            result?;

            // emit event
            Self::deposit_event(RawEvent::MyDummyEvent2());

            Ok(())
        }

        #[weight = 10_000_000]
        pub fn deploy_smart_contract(
            origin,
            account_from: T::AccountId,
            bytecode: Vec<u8>,
        ) -> Result<(), Error<T>> {
            ensure_root(origin)?;

            let account_from = T::AccountAddressMapping::normalize_account_id(&account_from);

            // topup account
            <T as Trait>::Currency::deposit_creating(
                &account_from,
                1000000000.into(),
            );

            let address_from = T::AccountAddressMapping::into_address(&account_from);

            let tmp33 = pallet_evm::Module::<T>::account_basic(&address_from);
            println!("{:?}", tmp33);

            let result = pallet_evm::Module::<T>::execute_create(
                address_from, // from address
                bytecode, // data
                //10000.into(), // value
                0.into(), // value
                4000000, // gas limit
                1.into(), // gas price
                None, // automaticly calculated nonce
                true, // apply state (difference between transaction and read-only call)
            );
            println!("{:?}", result);
            result?;

            Ok(())
        }

        #[weight = 10_000_000]
        pub fn call_smart_contract(
            origin,
            account_to: T::AccountId,
            bytecode: Vec<u8>,
        // TODO: try to find a way how to return result bytecode via Result<Vec<u8>, ...)
        //) -> Result<Vec<u8>, Error<T>> {
        ) -> Result<(), Error<T>> {
            println!(" -- {:?} {:?}", bytecode, account_to);

            let account_id = ensure_signed(origin)?;
            let account_from = T::AccountAddressMapping::normalize_account_id(&account_id);
            let address_from = T::AccountAddressMapping::into_address(&account_from);

            let account_to = T::AccountAddressMapping::normalize_account_id(&account_to);
            let address_to = T::AccountAddressMapping::into_address(&account_to);

            let result = pallet_evm::Module::<T>::execute_call(
                address_from, // from address
                address_to, // address to
                bytecode, // data
                //10000.into(), // value
                0.into(), // value
                4000000, // gas limit
                1.into(), // gas price
                None, // automaticly calculated nonce
                true, // apply state (difference between transaction and read-only call)
            );

            println!("resuuult {:?}", result);

            match result {
                Ok((pallet_evm::ExitReason::Succeed(_), response, _, _)) => {
                    // TODO: find a way how to return response and move this hardcoded assert into mocks
                    // account 1
                    let tmp = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1];
                    assert_eq!(response, tmp);

                    Ok(())
                },
                Ok((_, _, _, _)) => {
                    // consider returning new error rather than "fail" when transaction is reverted
                    Err(Error::EvmCallFail)
                },
                Err(_) => {
                    Err(Error::EvmCallFail)
                }
            }
        }
    }
}
