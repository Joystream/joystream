use codec::FullCodec;
use core::default::Default;
use frame_support::{
    decl_error, decl_event, decl_module, decl_storage,
    dispatch::{fmt::Debug, marker::Copy, DispatchError, DispatchResult},
    ensure,
};
use sp_arithmetic::traits::AtLeast32BitUnsigned;

mod types;
use types::{AccountDataOf, TokenDataOf};

/// Pallet Configuration Trait
pub trait Trait: frame_system::Trait {
    /// Events
    type Event: From<Event<Self>> + Into<<Self as frame_system::Trait>::Event>;

    // TODO: Add frame_support::pallet_prelude::TypeInfo trait
    /// the Balance type used
    type Balance: AtLeast32BitUnsigned + FullCodec + Copy + Default + Debug;

    /// The token identifier used
    type TokenId: AtLeast32BitUnsigned + FullCodec + Copy + Default + Debug;
}

/// The Base Token Trait
pub trait MultiCurrency<T: Trait> {
    /// Mint `amount` into account `who` (possibly creating it)
    /// for specified token `token_id`
    ///
    /// PRECONDITIONS:
    /// - `token_id` must exists
    /// - it is possible to increase `token_id` issuance by `amount`
    ///
    /// POSTCONDITIONS:
    /// - free balance of `who` is increased by `amount`
    /// - issuance of `token_id` is increased by `amount`
    fn deposit_creating(
        token_id: T::TokenId,
        who: T::AccountId,
        amount: T::Balance,
    ) -> DispatchResult;

    /// Mint `amount` into valid account `who`
    /// for specified token `token_id`
    ///
    /// PRECONDITIONS:
    /// - `token_id` must exists
    /// - `who` must exists
    /// - it is possible to increase `token_id` issuance by `amount`
    ///
    /// POSTCONDITIONS:
    /// - free balance of `who` is increased by `amount`
    /// - issuance of `token_id` is increased by `amount`
    fn deposit_into_existing(
        token_id: T::TokenId,
        who: T::AccountId,
        amount: T::Balance,
    ) -> DispatchResult;

    /// Burn `amount` of token `token_id` by slashing it from `who`
    ///
    /// PRECONDITIONS:
    /// - `token_id` must exists
    /// - `who` must exists
    /// - it is possible to decrease `token_id` issuance by `amount`
    ///
    /// POSTCONDITIONS:
    /// - free balance of `who` is decreased by `amount`
    /// - issuance of `token_id` is decreased by `amount`
    fn slash(token_id: T::TokenId, who: T::AccountId, amount: T::Balance) -> DispatchResult;
}

decl_storage! {
    trait Store for Module<T: Trait> as MultiCurrency {
        /// Double map TokenId x AccountId => AccountData for managing account data
        pub AccountInfoByTokenAndAccount get(fn account_info_by_account_and_token): double_map
            hasher(blake2_128_concat) T::TokenId,
            hasher(blake2_128_concat) T::AccountId => AccountDataOf<T>;

        /// map TokenId => TokenData to retrieve token information
        pub TokenInfoById get(fn token_info_by_id): map
            hasher(blake2_128_concat) T::TokenId => TokenDataOf<T>;

        /// The existential deposit amount for each token
        pub ExistentialDepositForToken get(fn existential_deposit_for_token): map
            hasher(blake2_128_concat) T::TokenId => T::Balance;

    }
}

decl_error! {
    pub enum Error for Module<T: Trait> {
        /// Free balance is insufficient for freezing specified amount
        InsufficientFreeBalanceForFreezing,

        /// Frozen balance is insufficient for unfreezing specified amount
        InsufficientFrozenBalance,

        /// Free balance is insufficient for slashing specified amount
        InsufficientFreeBalanceForSlashing,

        /// Attempt to exceed maximum issuance value
        CannotExceedMaxIssuanceValue,

        /// Current total issuance cannot be decrease by specified amount
        InsufficientIssuanceToDecreaseByAmount,

        /// Requested token does not exist
        TokenDoesNotExist,

        /// Requested account data does not exist
        AccountInformationDoesNotExist,

    }
}

decl_module! {
    /// _MultiCurrency_ substrate module.
    pub struct Module<T: Trait> for enum Call where origin: T::Origin {
        /// Default deposit_event() handler
        fn deposit_event() = default;

        /// Predefined errors.
        type Error = Error<T>;
    }
}
decl_event! {
    pub enum Event<T>
    where
        Balance = <T as Trait>::Balance,
        TokenId = <T as Trait>::TokenId,
    {
        /// Amount is minted
        /// Params:
        /// - token identifier
        /// - amount of tokens minted
        TokenMinted(TokenId, Balance),

        /// Amount is burned
        /// Params:
        /// - token identifier
        /// - amount of tokens burned
        TokenBurned(TokenId, Balance),

    }
}

/// Multi Currency Trait Implementation for Module
impl<T: Trait> MultiCurrency<T> for Module<T> {
    fn deposit_creating(
        token_id: T::TokenId,
        who: T::AccountId,
        amount: T::Balance,
    ) -> DispatchResult {
        // ensure token validity
        let token_info = Self::ensure_token_exists(token_id)?;

        // can increase issuance
        token_info.can_increase_issuance::<T>(amount)?;

        // == MUTATION SAFE ==

        // perform deposit
        Self::do_deposit(token_id, who, amount);

        Ok(())
    }

    fn deposit_into_existing(
        token_id: T::TokenId,
        who: T::AccountId,
        amount: T::Balance,
    ) -> DispatchResult {
        // ensure token validity
        let token_info = Self::ensure_token_exists(token_id)?;

        // can increase issuance
        token_info.can_increase_issuance::<T>(amount)?;

        // ensure account id validity
        Self::ensure_account_data_exists(token_id, &who).map(|_| ())?;

        // == MUTATION SAFE ==

        // perform deposit
        Self::do_deposit(token_id, who.clone(), amount);

        Ok(())
    }

    /// Burn amount of token token_id by slashing it from who
    fn slash(token_id: T::TokenId, who: T::AccountId, amount: T::Balance) -> DispatchResult {
        // ensure token validity
        let token_info = Self::ensure_token_exists(token_id)?;

        // can increase issuance
        token_info.can_decrease_issuance::<T>(amount)?;

        // ensure account id validity
        let account_info = Self::ensure_account_data_exists(token_id, &who)?;

        // ensure can slash amount from who
        account_info.can_slash::<T>(amount)?;

        // == MUTATION SAFE ==

        // perform deposit
        Self::do_slash(token_id, who, amount);

        Ok(())
    }
}

/// Module implementation
impl<T: Trait> Module<T> {
    fn ensure_account_data_exists(
        token_id: T::TokenId,
        account_id: &T::AccountId,
    ) -> Result<AccountDataOf<T>, DispatchError> {
        ensure!(
            AccountInfoByTokenAndAccount::<T>::contains_key(token_id, account_id),
            Error::<T>::AccountInformationDoesNotExist,
        );
        Ok(Self::account_info_by_account_and_token(
            token_id, account_id,
        ))
    }

    fn ensure_token_exists(token_id: T::TokenId) -> Result<TokenDataOf<T>, DispatchError> {
        ensure!(
            TokenInfoById::<T>::contains_key(token_id),
            Error::<T>::TokenDoesNotExist,
        );
        Ok(Self::token_info_by_id(token_id))
    }

    fn do_deposit(token_id: T::TokenId, account_id: T::AccountId, amount: T::Balance) {
        // mint amount
        TokenInfoById::<T>::mutate(token_id, |token_data| token_data.increase_issuance(amount));
        // deposit into account data
        AccountInfoByTokenAndAccount::<T>::mutate(token_id, account_id, |account_data| {
            account_data.deposit(amount)
        });
    }

    fn do_slash(token_id: T::TokenId, account_id: T::AccountId, amount: T::Balance) {
        // mint amount
        TokenInfoById::<T>::mutate(token_id, |token_data| token_data.decrease_issuance(amount));
        // deposit into account data
        AccountInfoByTokenAndAccount::<T>::mutate(token_id, account_id, |account_data| {
            account_data.slash(amount)
        });
    }
}
