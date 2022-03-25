use codec::FullCodec;
use core::default::Default;
use frame_support::{
    decl_module, decl_storage,
    dispatch::{fmt::Debug, marker::Copy, DispatchError, DispatchResult},
    ensure,
};
use sp_arithmetic::traits::{AtLeast32BitUnsigned, One, Saturating, Zero};

// crate modules
mod errors;
mod events;
mod tests;
mod traits;
mod types;

// crate imports
use errors::Error;
pub use events::{Event, RawEvent};
use traits::{MultiCurrencyBase, ReservableMultiCurrency};
use types::{AccountDataOf, TokenDataOf, TokenIssuanceParametersOf};

/// Pallet Configuration Trait
pub trait Trait: frame_system::Trait {
    /// Events
    type Event: From<Event<Self>> + Into<<Self as frame_system::Trait>::Event>;

    // TODO: Add frame_support::pallet_prelude::TypeInfo trait
    /// the Balance type used
    type Balance: AtLeast32BitUnsigned + FullCodec + Copy + Default + Debug + Saturating;

    /// The token identifier used
    type TokenId: AtLeast32BitUnsigned + FullCodec + Copy + Default + Debug;
}

decl_storage! {
    trait Store for Module<T: Trait> as Token {
        /// Double map TokenId x AccountId => AccountData for managing account data
        pub AccountInfoByTokenAndAccount get(fn account_info_by_token_and_account) config():
        double_map
            hasher(blake2_128_concat) T::TokenId,
        hasher(blake2_128_concat) T::AccountId => AccountDataOf<T>;

        /// map TokenId => TokenData to retrieve token information
        pub TokenInfoById get(fn token_info_by_id) config():
        map
            hasher(blake2_128_concat) T::TokenId => TokenDataOf<T>;

        /// Token Id nonce
        pub NextTokenId get(fn next_token_id) config(): T::TokenId;
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

/// MultiCurrencyBase Trait Implementation for Module
impl<T: Trait> MultiCurrencyBase<T::AccountId> for Module<T> {
    type Balance = T::Balance;
    type TokenId = T::TokenId;

    /// Mint `amount` into account `who` (possibly creating it)
    /// for specified token `token_id`
    ///
    /// Preconditions:
    /// - `token_id` must exists
    ///
    /// Postconditions:
    /// - free balance of `who` is increased by `amount`
    /// if `amount` is zero it is equivalent to a no-op
    fn deposit_creating(
        token_id: T::TokenId,
        who: T::AccountId,
        amount: T::Balance,
    ) -> DispatchResult {
        if amount.is_zero() {
            return Ok(());
        }

        Self::ensure_token_exists(token_id).map(|_| ())?;

        // == MUTATION SAFE ==

        Self::do_deposit(token_id, &who, amount);

        Self::deposit_event(RawEvent::TokenAmountDepositedInto(token_id, who, amount));

        Ok(())
    }

    /// Mint `amount` into valid account `who`
    /// for specified token `token_id`
    ///
    /// Preconditions:
    /// - `token_id` must exists
    /// - `who` must exists
    ///
    /// Postconditions:
    /// - free balance of `who` is increased by `amount`
    /// if `amount` is zero it is equivalent to a no-op
    fn deposit_into_existing(
        token_id: T::TokenId,
        who: T::AccountId,
        amount: T::Balance,
    ) -> DispatchResult {
        if amount.is_zero() {
            return Ok(());
        }

        Self::ensure_can_deposit_into_existing(token_id, &who)?;

        // == MUTATION SAFE ==

        Self::do_deposit(token_id, &who, amount);

        Self::deposit_event(RawEvent::TokenAmountDepositedInto(token_id, who, amount));
        Ok(())
    }

    /// Burn `amount` of token `token_id` by slashing it from `who`
    ///
    /// Preconditions:
    /// - `token_id` must exists
    /// - `who` must exists
    ///
    /// Postconditions:
    /// - free balance of `who` is decreased by `amount` or set to zero if below existential
    ///   deposit
    /// if `amount` is zero it is equivalent to a no-op
    fn slash(token_id: T::TokenId, who: T::AccountId, amount: T::Balance) -> DispatchResult {
        if amount.is_zero() {
            return Ok(());
        }

        let amount_to_slash = Self::ensure_can_slash(token_id, &who, amount)?;

        // == MUTATION SAFE ==

        if amount_to_slash == amount {
            Self::do_slash(token_id, &who, amount_to_slash);
        } else {
            Self::do_remove_account(token_id, &who);
        }

        Self::deposit_event(RawEvent::TokenAmountSlashedFrom(token_id, who, amount));
        Ok(())
    }

    /// Mint `amount` for token `token_id`
    /// Preconditions:
    /// - `token_id` must id
    /// -  it is possible to increase `token_id` issuance
    ///
    /// Postconditions:
    /// - `token_id` issuance increased by amount
    /// if `amount` is zero it is equivalent to a no-op
    fn mint(token_id: T::TokenId, amount: T::Balance) -> DispatchResult {
        if amount.is_zero() {
            return Ok(());
        }

        Self::ensure_token_exists(token_id).map(|_| ())?;

        // == MUTATION SAFE ==

        Self::do_mint(token_id, amount);

        Self::deposit_event(RawEvent::TokenAmountMinted(token_id, amount));
        Ok(())
    }

    /// Burn `amount` for token `token_id`
    /// Preconditions:
    /// - `token_id` must id
    /// -  it is possible to decrease `token_id` issuance
    ///
    /// Postconditions:
    /// - `token_id` issuance decreased by amount
    /// if `amount` is zero it is equivalent to a no-op
    fn burn(token_id: T::TokenId, amount: T::Balance) -> DispatchResult {
        if amount.is_zero() {
            return Ok(());
        }

        let remaining_issuance = Self::ensure_can_burn(token_id, amount)?;

        // == MUTATION SAFE ==

        if remaining_issuance.is_zero() {
            Self::do_deissue_token(token_id);
        } else {
            Self::do_burn(token_id, amount);
        }

        Self::deposit_event(RawEvent::TokenAmountBurned(token_id, amount));
        Ok(())
    }

    /// Transfer `amount` from `src` account to `dst`
    /// Preconditions:
    /// - `token_id` must exists
    /// - `src` must exists
    /// - `src` free balance must be greater than or equal to `amount`
    /// - `dst` must exists
    ///
    /// Postconditions:
    /// - free balance of `src` is decreased by `amount or set to zero if below existential
    ///   deposit`
    /// - free balance of `dst` is increased by `amount`
    /// if `amount` is zero it is equivalent to a no-op
    fn transfer<DestinationLocation: Into<T::AccountId> + Clone>(
        token_id: T::TokenId,
        src: T::AccountId,
        dst: DestinationLocation,
        amount: T::Balance,
    ) -> DispatchResult {
        if amount.is_zero() {
            return Ok(());
        }

        let amount_to_slash =
            Self::ensure_can_transfer(token_id, &src, &dst.to_owned().into(), amount)?;

        // == MUTATION SAFE ==

        if amount_to_slash == amount {
            Self::do_slash(token_id, &src, amount_to_slash);
        } else {
            Self::do_remove_account(token_id, &src);
        }

        Self::do_deposit(token_id, &dst.to_owned().into(), amount);

        Self::deposit_event(RawEvent::TokenAmountTransferred(
            token_id,
            src,
            dst.into(),
            amount,
        ));
        Ok(())
    }
    /// Issue token with specified characteristics
    /// Preconditions:
    /// Postconditions:
    /// - token with specified characteristics is added to storage state
    /// - `NextTokenId` increased by 1
    fn issue_token(issuance_parameters: TokenIssuanceParametersOf<T>) -> DispatchResult {
        let token_data = issuance_parameters.try_build::<T>()?;

        // == MUTATION SAFE ==

        let token_id = Self::next_token_id();

        Self::do_issue_token(token_id, token_data);

        Ok(())
    }

    /// Remove token data from storage
    /// Preconditions:
    /// - `token_id` must exists
    ///
    /// Postconditions:
    /// - token data @ `token_Id` removed from storage
    /// - all account data for `token_Id` removed
    fn deissue_token(token_id: T::TokenId) -> DispatchResult {
        Self::ensure_token_exists(token_id).map(|_| ())?;

        // == MUTATION SAFE ==

        Self::do_deissue_token(token_id);
        Ok(())
    }

    /// Retrieve usable (free) balance for token and account
    /// Preconditions:
    /// - `token_id` must be a valid token identifier
    /// - `who` account id must exist for token
    fn balance(token_id: T::TokenId, who: T::AccountId) -> Result<T::Balance, DispatchError> {
        let account_info = Self::ensure_account_data_exists(token_id, &who)?;

        Ok(account_info.free_balance)
    }

    /// Retrieve total current issuance for token
    /// Preconditions
    /// - `token_id` must be valid
    fn current_issuance(token_id: Self::TokenId) -> Result<Self::Balance, DispatchError> {
        Self::ensure_token_exists(token_id).map(|token_data| token_data.current_total_issuance)
    }
}

/// ReservableMultiCurrency trait implementation for Module
impl<T: Trait> ReservableMultiCurrency<T::AccountId> for Module<T> {
    type TokenId = T::TokenId;
    type Balance = T::Balance;

    /// Reserve `amount` of token for `who`
    /// Preconditions:
    /// - `token_id` must id
    /// - `who` must identify valid account for `token_id`
    /// - `who` free balance must be greater than `amount`
    ///
    /// Postconditions:
    /// - `who` free balance decreased by `amount`
    /// - `who` reserved balance increased by `amount`
    /// if `amount` is zero it is equivalent to a no-op
    fn reserve(token_id: T::TokenId, who: T::AccountId, amount: T::Balance) -> DispatchResult {
        if amount.is_zero() {
            return Ok(());
        }

        // Verify preconditions
        Self::ensure_can_freeze(token_id, &who, amount)?;

        // == MUTATION SAFE ==

        Self::do_freeze(token_id, &who, amount);

        Self::deposit_event(RawEvent::TokenAmountReservedFrom(token_id, who, amount));
        Ok(())
    }

    /// Unreserve `amount` of token for `who`
    /// Preconditions:
    /// - `token_id` must id
    /// - `who` must identify valid account for `token_id`
    /// - `who` reserved balance must be greater than `amount`
    ///
    /// Postconditions:
    /// - `who` free balance increased by `amount`
    /// - `who` reserved balance decreased by `amount`
    /// if `amount` is zero it is equivalent to a no-op
    fn unreserve(token_id: T::TokenId, who: T::AccountId, amount: T::Balance) -> DispatchResult {
        if amount.is_zero() {
            return Ok(());
        }

        // Verify preconditions
        Self::ensure_can_unfreeze(token_id, &who, amount)?;

        // == MUTATION SAFE ==

        Self::do_unfreeze(token_id, &who, amount);

        Self::deposit_event(RawEvent::TokenAmountUnreservedFrom(token_id, who, amount));
        Ok(())
    }

    /// Retrieve reserved balance for token and account
    /// Preconditions:
    /// - `token_id` must be a valid token identifier
    /// - `who` account id must exist for token
    fn reserved_balance(
        token_id: T::TokenId,
        who: T::AccountId,
    ) -> Result<T::Balance, DispatchError> {
        let account_info = Self::ensure_account_data_exists(token_id, &who)?;

        Ok(account_info.reserved_balance)
    }

    /// Retrieve total balance for token and account
    /// Preconditions:
    /// - `token_id` must be a valid token identifier
    /// - `who` account id must exist for token
    fn total_balance(token_id: T::TokenId, who: T::AccountId) -> Result<T::Balance, DispatchError> {
        let account_info = Self::ensure_account_data_exists(token_id, &who)?;

        Ok(account_info
            .reserved_balance
            .saturating_add(account_info.free_balance))
    }
}

/// Module implementation
impl<T: Trait> Module<T> {
    // Utility ensure checks

    pub(crate) fn ensure_account_data_exists(
        token_id: T::TokenId,
        account_id: &T::AccountId,
    ) -> Result<AccountDataOf<T>, DispatchError> {
        ensure!(
            AccountInfoByTokenAndAccount::<T>::contains_key(token_id, account_id),
            Error::<T>::AccountInformationDoesNotExist,
        );
        Ok(Self::account_info_by_token_and_account(
            token_id, account_id,
        ))
    }

    pub(crate) fn ensure_token_exists(
        token_id: T::TokenId,
    ) -> Result<TokenDataOf<T>, DispatchError> {
        ensure!(
            TokenInfoById::<T>::contains_key(token_id),
            Error::<T>::TokenDoesNotExist,
        );
        Ok(Self::token_info_by_id(token_id))
    }

    // Extrinsics ensure checks

    #[inline]
    pub(crate) fn ensure_can_burn(
        token_id: T::TokenId,
        amount: T::Balance,
    ) -> Result<T::Balance, DispatchError> {
        // ensure token validity
        let token_info = Self::ensure_token_exists(token_id)?;

        // ensure issuance can be decreased
        ensure!(
            token_info.current_total_issuance >= amount,
            Error::<T>::InsufficientIssuanceToDecreaseByAmount,
        );
        Ok(token_info.current_total_issuance.saturating_sub(amount))
    }

    #[inline]
    pub(crate) fn ensure_can_deposit_into_existing(
        token_id: T::TokenId,
        who: &T::AccountId,
    ) -> DispatchResult {
        // ensure token validity
        Self::ensure_token_exists(token_id).map(|_| ())?;

        // ensure account id validity
        Self::ensure_account_data_exists(token_id, who).map(|_| ())?;

        Ok(())
    }

    #[inline]
    pub(crate) fn ensure_can_slash(
        token_id: T::TokenId,
        who: &T::AccountId,
        amount: T::Balance,
    ) -> Result<T::Balance, DispatchError> {
        // ensure token validity
        let token_info = Self::ensure_token_exists(token_id)?;

        // ensure account id validity
        let account_info = Self::ensure_account_data_exists(token_id, who)?;

        // Amount to decrease by accounting for existential deposit
        let amount_to_slash =
            account_info.decrease_with_ex_deposit::<T>(amount, token_info.existential_deposit)?;

        Ok(amount_to_slash)
    }

    #[inline]
    pub(crate) fn ensure_can_transfer(
        token_id: T::TokenId,
        src: &T::AccountId,
        dst: &T::AccountId,
        amount: T::Balance,
    ) -> Result<T::Balance, DispatchError> {
        // ensure token validity
        let token_info = Self::ensure_token_exists(token_id)?;

        // ensure src account id validity
        let src_account_info = Self::ensure_account_data_exists(token_id, src)?;

        // ensure dst account id validity
        Self::ensure_account_data_exists(token_id, &dst).map(|_| ())?;

        // ensure can slash amount from who
        ensure!(
            src_account_info.free_balance >= amount,
            Error::<T>::InsufficientFreeBalanceForTransfer,
        );

        // Amount to decrease by accounting for existential deposit
        let amount_to_slash = src_account_info
            .decrease_with_ex_deposit::<T>(amount, token_info.existential_deposit)?;

        Ok(amount_to_slash)
    }

    #[inline]
    pub(crate) fn ensure_can_freeze(
        token_id: T::TokenId,
        who: &T::AccountId,
        amount: T::Balance,
    ) -> DispatchResult {
        // ensure token validity
        let _ = Self::ensure_token_exists(token_id)?;

        // ensure src account id validity
        let account_info = Self::ensure_account_data_exists(token_id, who)?;

        // ensure can freeze amount
        ensure!(
            account_info.free_balance >= amount,
            Error::<T>::InsufficientFreeBalanceForReserving,
        );

        Ok(())
    }

    #[inline]
    pub(crate) fn ensure_can_unfreeze(
        token_id: T::TokenId,
        who: &T::AccountId,
        amount: T::Balance,
    ) -> DispatchResult {
        // ensure token validity
        Self::ensure_token_exists(token_id).map(|_| ())?;

        // ensure src account id validity
        let account_info = Self::ensure_account_data_exists(token_id, who)?;

        // ensure can freeze amount
        ensure!(
            account_info.reserved_balance >= amount,
            Error::<T>::InsufficientReservedBalance
        );

        Ok(())
    }

    // Infallible operations

    #[inline]
    pub(crate) fn do_deposit(token_id: T::TokenId, account_id: &T::AccountId, amount: T::Balance) {
        AccountInfoByTokenAndAccount::<T>::mutate(token_id, account_id, |account_data| {
            account_data.free_balance = account_data.free_balance.saturating_sub(amount)
        });
    }

    #[inline]
    pub(crate) fn do_mint(token_id: T::TokenId, amount: T::Balance) {
        TokenInfoById::<T>::mutate(token_id, |token_data| {
            token_data.current_total_issuance =
                token_data.current_total_issuance.saturating_add(amount)
        });
    }

    #[inline]
    pub(crate) fn do_slash(token_id: T::TokenId, account_id: &T::AccountId, amount: T::Balance) {
        AccountInfoByTokenAndAccount::<T>::mutate(token_id, account_id, |account_data| {
            account_data.free_balance = account_data.free_balance.saturating_sub(amount)
        });
    }

    #[inline]
    pub(crate) fn do_remove_account(token_id: T::TokenId, account_id: &T::AccountId) {
        AccountInfoByTokenAndAccount::<T>::remove(token_id, account_id);
    }

    #[inline]
    pub(crate) fn do_burn(token_id: T::TokenId, amount: T::Balance) {
        TokenInfoById::<T>::mutate(token_id, |token_data| {
            token_data.current_total_issuance =
                token_data.current_total_issuance.saturating_sub(amount)
        });
    }

    #[inline]
    pub(crate) fn do_freeze(token_id: T::TokenId, account_id: &T::AccountId, amount: T::Balance) {
        AccountInfoByTokenAndAccount::<T>::mutate(token_id, account_id, |account_data| {
            account_data.free_balance = account_data.free_balance.saturating_add(amount);
            account_data.reserved_balance = account_data.reserved_balance.saturating_sub(amount);
        });
    }

    #[inline]
    pub(crate) fn do_unfreeze(token_id: T::TokenId, account_id: &T::AccountId, amount: T::Balance) {
        AccountInfoByTokenAndAccount::<T>::mutate(token_id, account_id, |account_data| {
            account_data.free_balance = account_data.free_balance.saturating_add(amount);
            account_data.reserved_balance = account_data.reserved_balance.saturating_sub(amount);
        });
    }

    #[inline]
    pub(crate) fn do_issue_token(token_id: T::TokenId, token_data: TokenDataOf<T>) {
        TokenInfoById::<T>::insert(token_id, token_data);
        NextTokenId::<T>::put(token_id.saturating_add(T::TokenId::one()));
    }

    #[inline]
    pub(crate) fn do_deissue_token(token_id: T::TokenId) {
        TokenInfoById::<T>::remove(token_id);
        AccountInfoByTokenAndAccount::<T>::remove_prefix(token_id);
        // TODO: add extra state removal as implementation progresses
    }
}
