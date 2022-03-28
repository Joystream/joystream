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
use traits::{
    ControlledTransfer, MultiCurrencyBase, ReservableMultiCurrency, TransferLocationTrait,
};
use types::{
    AccountDataOf, DecOp, SimpleLocation, TokenDataOf, TokenIssuanceParametersOf, TransferPolicyOf,
};

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
impl<T: Trait> MultiCurrencyBase<T::AccountId, TokenIssuanceParametersOf<T>> for Module<T> {
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

        // increase token issuance
        TokenInfoById::<T>::mutate(token_id, |token_data| {
            token_data.current_total_issuance =
                token_data.current_total_issuance.saturating_add(amount)
        });

        if AccountInfoByTokenAndAccount::<T>::contains_key(token_id, &who) {
            AccountInfoByTokenAndAccount::<T>::mutate(token_id, &who, |account_data| {
                account_data.free_balance = account_data.free_balance.saturating_add(amount)
            });
        } else {
            AccountInfoByTokenAndAccount::<T>::insert(
                token_id,
                &who,
                AccountDataOf::<T> {
                    free_balance: amount,
                    reserved_balance: T::Balance::zero(),
                },
            );
        }
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

        // ensure token validity
        Self::ensure_token_exists(token_id).map(|_| ())?;

        // ensure account id validity
        Self::ensure_account_data_exists(token_id, &who).map(|_| ())?;

        // == MUTATION SAFE ==

        // increase token issuance
        TokenInfoById::<T>::mutate(token_id, |token_data| {
            token_data.current_total_issuance =
                token_data.current_total_issuance.saturating_add(amount)
        });

        AccountInfoByTokenAndAccount::<T>::mutate(token_id, &who, |account_data| {
            account_data.free_balance = account_data.free_balance.saturating_add(amount)
        });

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

        // ensure token validity
        let token_info = Self::ensure_token_exists(token_id)?;

        // ensure account id validity
        let account_info = Self::ensure_account_data_exists(token_id, &who)?;

        // Amount to decrease by accounting for existential deposit
        let slash_operation =
            account_info.decrease_with_ex_deposit::<T>(amount, token_info.existential_deposit)?;
        // ensure issuance can be decreased by amount
        ensure!(
            token_info.current_total_issuance >= slash_operation.amount(),
            Error::<T>::InsufficientIssuanceToDecreaseByAmount,
        );

        // == MUTATION SAFE ==

        // decrease token issuance
        TokenInfoById::<T>::mutate(token_id, |token_data| {
            token_data.current_total_issuance = token_data
                .current_total_issuance
                .saturating_sub(slash_operation.total_amount())
        });

        // then perform proper operation for the slash
        match slash_operation {
            DecOp::<T>::Reduce(amount) => {
                AccountInfoByTokenAndAccount::<T>::mutate(token_id, &who, |account_data| {
                    account_data.free_balance = account_data.free_balance.saturating_sub(amount);
                });
            }
            DecOp::<T>::Remove(..) => {
                AccountInfoByTokenAndAccount::<T>::remove(token_id, &who);
                // if no more account for token -> deissue
                if AccountInfoByTokenAndAccount::<T>::iter_prefix(token_id)
                    .next()
                    .is_none()
                {
                    Self::do_deissue_token(token_id)
                }
            }
        }

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
    fn transfer(
        token_id: T::TokenId,
        src: T::AccountId,
        dst: T::AccountId,
        amount: T::Balance,
    ) -> DispatchResult {
        if amount.is_zero() {
            return Ok(());
        }

        // tranfer preconditions
        let outputs = [(SimpleLocation::<T::AccountId>::new(dst), amount)];
        let (slash_operation, _) = Self::ensure_can_transfer(token_id, &src, &outputs)?;

        // == MUTATION SAFE ==

        Self::do_transfer(token_id, src, &outputs, slash_operation);
        Ok(())
    }

    /// Issue token with specified characteristics
    /// Preconditions:
    /// -
    ///
    /// Postconditions:
    /// - token with specified characteristics is added to storage state
    /// - `NextTokenId` increased by 1
    fn issue_token(issuance_parameters: TokenIssuanceParametersOf<T>) -> DispatchResult {
        let token_data = issuance_parameters.try_build::<T>()?;

        // == MUTATION SAFE ==

        let token_id = Self::next_token_id();
        TokenInfoById::<T>::insert(token_id, token_data);
        NextTokenId::<T>::put(token_id.saturating_add(T::TokenId::one()));

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

        // ensure token validity
        let _ = Self::ensure_token_exists(token_id)?;

        // ensure src account id validity
        let account_info = Self::ensure_account_data_exists(token_id, &who)?;

        // ensure can freeze amount
        ensure!(
            account_info.free_balance >= amount,
            Error::<T>::InsufficientFreeBalanceForReserving,
        );

        // == MUTATION SAFE ==

        AccountInfoByTokenAndAccount::<T>::mutate(token_id, &who, |account_data| {
            account_data.free_balance = account_data.free_balance.saturating_sub(amount);
            account_data.reserved_balance = account_data.reserved_balance.saturating_add(amount);
        });

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

        // ensure token validity
        Self::ensure_token_exists(token_id).map(|_| ())?;

        // ensure src account id validity
        let account_info = Self::ensure_account_data_exists(token_id, &who)?;

        // ensure can freeze amount
        ensure!(
            account_info.reserved_balance >= amount,
            Error::<T>::InsufficientReservedBalance
        );

        // == MUTATION SAFE ==

        AccountInfoByTokenAndAccount::<T>::mutate(token_id, &who, |account_data| {
            account_data.free_balance = account_data.free_balance.saturating_add(amount);
            account_data.reserved_balance = account_data.reserved_balance.saturating_sub(amount);
        });

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

impl<T: Trait> ControlledTransfer<T::AccountId, TransferPolicyOf<T>, TokenIssuanceParametersOf<T>>
    for Module<T>
{
    type MultiCurrency = Self;

    /// Transfer `amount` from `src` account to `dst` according to provided policy
    /// Preconditions:
    /// - `PRECONDITIONS[MultiCurrency::transfer(token_id, src, dst.into(), amount)]`
    /// - `dst` is compatible con `token_id` transfer policy
    ///
    /// Postconditions:
    /// - `POSTCONDITIONS[MultiCurrency::transfer(token_id, src, dst.into(), amount)]`
    /// if `amount` is zero it is equivalent to a no-op
    fn controlled_transfer<Destination>(
        token_id: T::TokenId,
        src: T::AccountId,
        dst: Destination,
        amount: T::Balance,
    ) -> DispatchResult
    where
        Destination: TransferLocationTrait<T::AccountId, TransferPolicyOf<T>> + Clone,
    {
        if amount.is_zero() {
            return Ok(());
        }

        // Currency transfer preconditions
        let outputs = [(dst.clone(), amount)];
        let (slash_operation, token_info) = Self::ensure_can_transfer(token_id, &src, &outputs)?;

        // validate according to policy
        token_info.ensure_valid_location_for_policy::<T, T::AccountId, _>(&dst)?;

        // == MUTATION SAFE ==

        Self::do_transfer(token_id, src, &outputs, slash_operation);

        Ok(())
    }

    fn controlled_multi_output_transfer<Destination>(
        token_id: T::TokenId,
        src: T::AccountId,
        outputs: &[(Destination, T::Balance)],
    ) -> DispatchResult
    where
        Destination: TransferLocationTrait<T::AccountId, TransferPolicyOf<T>>,
    {
        let (slash_operation, token_info) = Self::ensure_can_transfer(token_id, &src, outputs)?;
        // validate according to policy
        outputs.iter().try_for_each(|(dst, _)| {
            token_info.ensure_valid_location_for_policy::<T, T::AccountId, _>(dst)
        })?;

        // == MUTATION SAFE ==

        Self::do_transfer(token_id, src, outputs, slash_operation);

        Ok(())
    }

    /// Change to permissionless
    /// Preconditions:
    /// - Token `token_id` must exist
    /// Postconditions
    /// - transfer policy of `token_id` changed to permissionless
    fn change_to_permissionless(token_id: T::TokenId) -> DispatchResult {
        TokenInfoById::<T>::try_mutate(token_id, |token_info| {
            token_info.transfer_policy = TransferPolicyOf::<T>::Permissionless;
            Ok(())
        })
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

    /// Perform token de-issuing: unfallible
    #[inline]
    pub(crate) fn do_deissue_token(token_id: T::TokenId) {
        TokenInfoById::<T>::remove(token_id);
        AccountInfoByTokenAndAccount::<T>::remove_prefix(token_id);
        // TODO: add extra state removal as implementation progresses
    }

    /// Transfer preconditions
    pub(crate) fn ensure_can_transfer<Destination>(
        token_id: T::TokenId,
        src: &T::AccountId,
        outputs: &[(Destination, T::Balance)],
    ) -> Result<(DecOp<T>, TokenDataOf<T>), DispatchError>
    where
        Destination: TransferLocationTrait<T::AccountId, TransferPolicyOf<T>>,
    {
        // ensure token validity
        let token_info = Self::ensure_token_exists(token_id)?;

        // ensure src account id validity
        let src_account_info = Self::ensure_account_data_exists(token_id, &src)?;

        // ensure dst account id validity
        outputs.iter().try_for_each(|(dst, _)| {
            let dst_account = dst.location_account();
            Self::ensure_account_data_exists(token_id, &dst_account).map(|_| ())
        })?;

        let total_amount = outputs.iter().fold(T::Balance::zero(), |acc, (_, amount)| {
            acc.saturating_add(*amount)
        });

        // Amount to decrease by accounting for existential deposit
        let decrease_op = src_account_info
            .decrease_with_ex_deposit::<T>(total_amount, token_info.existential_deposit)
            .map_err(|_| Error::<T>::InsufficientFreeBalanceForTransfer)?;
        Ok((decrease_op, token_info))
    }

    /// Perform balance accounting for balances
    #[inline]
    pub(crate) fn do_transfer<Destination>(
        token_id: T::TokenId,
        src: T::AccountId,
        outputs: &[(Destination, T::Balance)],
        decrease_op: DecOp<T>,
    ) where
        Destination: TransferLocationTrait<T::AccountId, TransferPolicyOf<T>>,
    {
        outputs.iter().for_each(|(dst, amount)| {
            AccountInfoByTokenAndAccount::<T>::mutate(
                token_id,
                dst.location_account(),
                |account_data| {
                    account_data.free_balance = account_data.free_balance.saturating_add(*amount)
                },
            );
        });
        match decrease_op {
            DecOp::<T>::Reduce(amount) => {
                AccountInfoByTokenAndAccount::<T>::mutate(token_id, &src, |account_data| {
                    account_data.free_balance = account_data.free_balance.saturating_sub(amount)
                })
            }
            DecOp::<T>::Remove(_, dust) => {
                AccountInfoByTokenAndAccount::<T>::remove(token_id, &src);
                TokenInfoById::<T>::mutate(token_id, |token_data| {
                    token_data.current_total_issuance =
                        token_data.current_total_issuance.saturating_sub(dust)
                });
            }
        };
    }
}
