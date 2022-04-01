use codec::FullCodec;
use core::default::Default;
use frame_support::{
    decl_module, decl_storage,
    dispatch::{fmt::Debug, marker::Copy, DispatchError, DispatchResult},
    ensure,
};
use sp_arithmetic::traits::{AtLeast32BitUnsigned, One, Saturating, Zero};
use sp_runtime::{traits::Hash, Percent};

// crate modules
mod errors;
mod events;
mod tests;
mod traits;
mod types;

// crate imports
use errors::Error;
pub use events::{Event, RawEvent};
use traits::{PalletToken, TransferLocationTrait};
use types::{AccountDataOf, DecOp, TokenDataOf, TokenIssuanceParametersOf, TransferPolicyOf};

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

        /// Set for the tokens symbols
        pub SymbolsUsed get (fn symbol_used) config():
        map
            hasher(blake2_128_concat) T::Hash => ();
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

impl<T: Trait> PalletToken<T::AccountId, TransferPolicyOf<T>, TokenIssuanceParametersOf<T>>
    for Module<T>
{
    type Balance = T::Balance;

    type TokenId = T::TokenId;

    /// Transfer `amount` from `src` account to `dst` according to provided policy
    /// Preconditions:
    /// - `token_id` must exists
    /// - `dst` underlying account must be valid for `token_id`
    /// - `src` must be valid for `token_id`
    /// - `dst` is compatible con `token_id` transfer policy
    ///
    /// Postconditions:
    /// - `src` free balance decreased by `amount` or removed if final balance < existential deposit
    /// - `dst` free balance increased by `amount`
    /// - `token_id` issuance eventually decreased by dust amount in case of src removalp
    /// if `amount` is zero it is equivalent to a no-op
    fn transfer<Destination>(
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
        let (decrease_operation, token_info) = Self::ensure_can_transfer(token_id, &src, &outputs)?;

        // validate according to policy
        token_info.ensure_valid_location_for_policy::<T, T::AccountId, _>(&dst)?;

        // == MUTATION SAFE ==

        Self::do_transfer(token_id, &src, &outputs, decrease_operation);

        Self::deposit_event(RawEvent::TokenAmountTransferred(
            token_id,
            src,
            dst.location_account(),
            amount,
        ));
        Ok(())
    }

    fn multi_output_transfer<Destination>(
        token_id: T::TokenId,
        src: T::AccountId,
        outputs: &[(Destination, T::Balance)],
    ) -> DispatchResult
    where
        Destination: TransferLocationTrait<T::AccountId, TransferPolicyOf<T>>,
    {
        let (decrease_operation, token_info) = Self::ensure_can_transfer(token_id, &src, outputs)?;
        // validate according to policy
        outputs.iter().try_for_each(|(dst, _)| {
            token_info.ensure_valid_location_for_policy::<T, T::AccountId, _>(dst)
        })?;

        // == MUTATION SAFE ==

        Self::do_transfer(token_id, &src, outputs, decrease_operation);

        let outputs_for_event = outputs
            .iter()
            .map(|(dst, amount)| (dst.location_account(), *amount));

        Self::deposit_event(RawEvent::TokenAmountMultiTransferred(
            token_id,
            src,
            outputs_for_event.collect(),
        ));

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

    /// Reduce patronage rate by amount
    /// Preconditions:
    /// - `token_id` must exists
    /// - `decrement` must be less or equal than current patronage rate for `token_id`
    ///
    /// Postconditions:
    /// - patronage rate for `token_id` reduced by `decrement`
    fn reduce_patronage_rate_by(token_id: T::TokenId, decrement: Percent) -> DispatchResult {
        let token_info = Self::ensure_token_exists(token_id)?;

        // ensure new rate is >= 0
        ensure!(
            token_info.patronage_info.rate >= decrement,
            Error::<T>::ReductionExceedingPatronageRate,
        );

        // == MUTATION SAFE ==

        let new_rate = TokenInfoById::<T>::mutate(token_id, |token_info| {
            let new_rate = token_info.patronage_info.rate.saturating_sub(decrement);
            token_info.patronage_info.rate = new_rate;
            new_rate
        });

        Self::deposit_event(RawEvent::PatronageRateDecreasedTo(token_id, new_rate));

        Ok(())
    }

    /// Query for patronage credit for token
    /// Preconditions
    /// - `token_id` must exists
    fn get_patronage_credit(token_id: T::TokenId) -> Result<T::Balance, DispatchError> {
        Self::ensure_token_exists(token_id)
            .map(|token_info| token_info.patronage_info.outstanding_credit)
    }

    /// Allow creator to receive credit into his accounts
    /// Preconditions:
    /// - `token_id` must exists
    /// - `to_account` must be valid for `token_id`
    ///
    /// Postconditions:
    /// - outstanding patronage credit for `token_id` transferred to `to_account`
    /// - outstanding patronage credit subsequently set to 0
    /// no-op if outstanding credit is zero
    fn claim_patronage_credit(token_id: T::TokenId, to_account: T::AccountId) -> DispatchResult {
        let token_info = Self::ensure_token_exists(token_id)?;
        Self::ensure_account_data_exists(token_id, &to_account).map(|_| ())?;

        if token_info.patronage_info.outstanding_credit.is_zero() {
            return Ok(());
        }

        // == MUTATION SAFE ==

        let credit = token_info.patronage_info.outstanding_credit;

        TokenInfoById::<T>::mutate(token_id, |token_info| {
            token_info.patronage_info.outstanding_credit = T::Balance::zero();
        });

        AccountInfoByTokenAndAccount::<T>::mutate(token_id, &to_account, |account_info| {
            account_info.free_balance = account_info.free_balance.saturating_add(credit)
        });

        Self::deposit_event(RawEvent::PatronageCreditClaimed(
            token_id, credit, to_account,
        ));

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
        let sym_hash = <T as frame_system::Trait>::Hashing::hash_of(&issuance_parameters.symbol);
        let token_data = issuance_parameters.try_build::<T>()?;
        ensure!(
            !crate::SymbolsUsed::<T>::contains_key(sym_hash),
            crate::Error::<T>::TokenSymbolAlreadyInUse,
        );

        // == MUTATION SAFE ==

        let token_id = Self::next_token_id();
        TokenInfoById::<T>::insert(token_id, token_data);
        SymbolsUsed::<T>::insert(sym_hash, ());
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

    /// Mint `amount` into account `who` (possibly creating it)
    /// for specified token `token_id`
    ///
    /// Preconditions:
    /// - `token_id` must exists
    ///
    /// Postconditions:
    /// - free balance of `who` is increased by `amount
    /// - patronage credit accounted for `token_id`
    /// - `token_id` issuance increased by amount + credit
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
        Self::do_mint(token_id, amount);

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

        Self::deposit_event(RawEvent::TokenAmountDepositedInto(token_id, who, amount));
        Ok(())
    }
}

/// Module implementation
impl<T: Trait> Module<T> {
    /// Mint `amount` into valid account `who`
    /// for specified token `token_id`
    ///
    /// Preconditions:
    /// - `token_id` must exists
    /// - `who` must exists
    ///
    /// Postconditions:
    /// - free balance of `who` is increased by `amount`
    /// - patronage credit accounted for `token_id`
    /// - `token_id` issuance increased by amount + credit
    /// if `amount` is zero it is equivalent to a no-op
    fn _deposit_into_existing(
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
        Self::do_mint(token_id, amount);

        AccountInfoByTokenAndAccount::<T>::mutate(token_id, &who, |account_data| {
            account_data.free_balance = account_data.free_balance.saturating_add(amount)
        });

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
    fn _slash(token_id: T::TokenId, who: T::AccountId, amount: T::Balance) -> DispatchResult {
        if amount.is_zero() {
            return Ok(());
        }

        // ensure token validity
        let token_info = Self::ensure_token_exists(token_id)?;

        // ensure account id validity
        let account_info = Self::ensure_account_data_exists(token_id, &who)?;

        // Amount to decrease by accounting for existential deposit
        let decrease_operation =
            account_info.decrease_with_ex_deposit::<T>(amount, token_info.existential_deposit)?;
        // ensure issuance can be decreased by amount
        ensure!(
            token_info.current_total_issuance >= decrease_operation.amount(),
            Error::<T>::InsufficientIssuanceToDecreaseByAmount,
        );

        // == MUTATION SAFE ==

        // decrease token issuance
        TokenInfoById::<T>::mutate(token_id, |token_data| {
            token_data.current_total_issuance = token_data
                .current_total_issuance
                .saturating_sub(decrease_operation.total_amount())
        });

        // then perform proper operation for the slash
        match decrease_operation {
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

        Self::deposit_event(RawEvent::TokenAmountSlashedFrom(token_id, who, amount));

        Ok(())
    }

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
    fn _reserve(token_id: T::TokenId, who: T::AccountId, amount: T::Balance) -> DispatchResult {
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
    fn _unreserve(token_id: T::TokenId, who: T::AccountId, amount: T::Balance) -> DispatchResult {
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

        Self::deposit_event(RawEvent::TokenAmountUnreservedFrom(token_id, who, amount));

        Ok(())
    }

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
        let src_account_info = Self::ensure_account_data_exists(token_id, src)?;

        // ensure dst account id validity
        outputs.iter().try_for_each(|(dst, _)| {
            let dst_account = dst.location_account();

            // enusure destination exists and that it differs from source
            Self::ensure_account_data_exists(token_id, &dst_account).and_then(|_| {
                ensure!(
                    dst_account != *src,
                    Error::<T>::SameSourceAndDestinationLocations,
                );
                Ok(())
            })
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
        src: &T::AccountId,
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

    #[inline]
    pub(crate) fn do_mint(token_id: T::TokenId, amount: T::Balance) {
        TokenInfoById::<T>::mutate(token_id, |token_data| {
            // increase patronage credit due to increase in amount
            let credit_increase = token_data.patronage_info.rate.mul_floor(amount);

            // reflect the credit in the issuance
            let issuance_increase = amount.saturating_add(credit_increase);

            token_data.current_total_issuance = token_data
                .current_total_issuance
                .saturating_add(issuance_increase);

            token_data.patronage_info.outstanding_credit = token_data
                .patronage_info
                .outstanding_credit
                .saturating_add(credit_increase);
        });
    }
}
