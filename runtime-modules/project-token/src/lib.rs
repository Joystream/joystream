use codec::FullCodec;
use core::default::Default;
use frame_support::{
    decl_module, decl_storage,
    dispatch::{fmt::Debug, marker::Copy, DispatchError, DispatchResult},
    ensure,
    traits::{Currency, ExistenceRequirement, Get},
};
use frame_system::ensure_signed;
use sp_arithmetic::traits::{AtLeast32BitUnsigned, One, Saturating, Zero};
use sp_runtime::{
    traits::{AccountIdConversion, Convert},
    ModuleId,
};
use sp_std::iter::Sum;

// crate modules
mod errors;
mod events;
mod tests;
mod traits;
mod types;

// crate imports
use errors::Error;
pub use events::{Event, RawEvent};
use traits::PalletToken;
use types::{
    AccountDataOf, MerkleProofOf, OutputsOf, TokenDataOf, TokenIssuanceParametersOf,
    TransferPolicyOf,
};

/// Pallet Configuration Trait
pub trait Trait: frame_system::Trait {
    /// Events
    type Event: From<Event<Self>> + Into<<Self as frame_system::Trait>::Event>;

    // TODO: Add frame_support::pallet_prelude::TypeInfo trait
    /// the Balance type used
    type Balance: AtLeast32BitUnsigned + FullCodec + Copy + Default + Debug + Saturating + Sum;

    /// The token identifier used
    type TokenId: AtLeast32BitUnsigned + FullCodec + Copy + Default + Debug;

    /// Block number to balance converter used for interest calculation
    type BlockNumberToBalance: Convert<Self::BlockNumber, Self::Balance>;

    /// Tresury account for the various tokens
    type ModuleId: Get<ModuleId>;

    // TODO(after PR round is completed): use Self::ReserveBalance
    /// Bloat bond value: in JOY
    type BloatBond: Get<<Self::ReserveCurrency as Currency<Self::AccountId>>::Balance>;

    /// the Currency interface used as a reserve (i.e. JOY)
    type ReserveCurrency: Currency<Self::AccountId>;
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
    pub struct Module<T: Trait> for enum Call
    where
        origin: T::Origin
    {

        /// Default deposit_event() handler
        fn deposit_event() = default;

        /// Predefined errors.
        type Error = Error<T>;

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
        #[weight = 10_000_000] // TODO: adjust weight
        pub fn transfer(
            origin,
            token_id: T::TokenId,
            outputs: OutputsOf<T>,
        ) -> DispatchResult {
            let src = ensure_signed(origin)?;

            // Currency transfer preconditions
            Self::ensure_can_transfer(token_id, &src, &outputs)?;

            // == MUTATION SAFE ==

            Self::do_transfer(token_id, &src, &outputs);

            Self::deposit_event(RawEvent::TokenAmountTransferred(
                token_id,
                src,
                outputs.into(),
            ));
            Ok(())
        }

        /// Join whitelist for permissioned case: used to add accounts for token
        /// Preconditions:
        /// - 'token_id' must be valid
        /// - transfer policy is permissionless or transfer policy is permissioned and merkle proof is valid
        ///
        /// Postconditions:
        /// - account added to the list
        #[weight = 10_000_000] // TODO: adjust weights
        pub fn join_whitelist(origin, token_id: T::TokenId, proof: MerkleProofOf<T>) -> DispatchResult {
            let account_id = ensure_signed(origin)?;
            let token_info = Self::ensure_token_exists(token_id)?;

            ensure!(
                !AccountInfoByTokenAndAccount::<T>::contains_key(token_id, &account_id),
                Error::<T>::AccountAlreadyExists,
            );

            if let TransferPolicyOf::<T>::Permissioned(commit) = token_info.transfer_policy {
                proof.verify_for_commit::<T,_>(&account_id, commit)?
            }

            let treasury: T::AccountId = T::ModuleId::get().into_sub_account(token_id);
            let bloat_bond = T::BloatBond::get();

            // No project_token or balances state corrupted in case of failure
            let _ = T::ReserveCurrency::transfer(&account_id, &treasury, bloat_bond, ExistenceRequirement::KeepAlive)
                .map_err(|_| Error::<T>::InsufficientBalanceForBloatBond)?;

            // == MUTATION SAFE ==

            AccountInfoByTokenAndAccount::<T>::insert(token_id, &account_id, AccountDataOf::<T>::default());

            Self::deposit_event(RawEvent::MemberJoinedWhitelist(token_id, account_id, token_info.transfer_policy));

            Ok(())
        }
    }
}

impl<T: Trait> PalletToken<T::AccountId, TransferPolicyOf<T>, TokenIssuanceParametersOf<T>>
    for Module<T>
{
    type Balance = T::Balance;

    type TokenId = T::TokenId;

    type MerkleProof = MerkleProofOf<T>;

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
    fn reduce_patronage_rate_by(token_id: T::TokenId, decrement: T::Balance) -> DispatchResult {
        let token_info = Self::ensure_token_exists(token_id)?;

        // ensure new rate is >= 0
        ensure!(
            token_info.patronage_info.rate >= decrement,
            Error::<T>::ReductionExceedingPatronageRate,
        );

        // == MUTATION SAFE ==

        let now = Self::current_block();
        let new_rate = token_info.patronage_info.rate.saturating_sub(decrement);
        TokenInfoById::<T>::mutate(token_id, |token_info| {
            token_info
                .patronage_info
                .set_new_rate_at_block::<T::BlockNumberToBalance>(new_rate, now);
        });

        Self::deposit_event(RawEvent::PatronageRateDecreasedTo(token_id, new_rate));

        Ok(())
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

        let now = Self::current_block();
        let outstanding_credit = token_info
            .patronage_info
            .outstanding_credit::<T::BlockNumberToBalance>(now);

        if outstanding_credit.is_zero() {
            return Ok(());
        }

        // == MUTATION SAFE ==

        AccountInfoByTokenAndAccount::<T>::mutate(token_id, &to_account, |account_info| {
            account_info.increase_liquidity_by(outstanding_credit)
        });

        TokenInfoById::<T>::mutate(token_id, |token_info| {
            token_info
                .patronage_info
                .reset_tally_at_block::<T::BlockNumberToBalance>(now);
            token_info.increase_issuance_by(outstanding_credit);
        });

        Self::deposit_event(RawEvent::PatronageCreditClaimedAtBlock(
            token_id,
            outstanding_credit,
            to_account,
            now,
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
        // TODO: consider adding symbol as separate parameter
        let sym = issuance_parameters.symbol;
        ensure!(
            !SymbolsUsed::<T>::contains_key(&sym),
            Error::<T>::TokenSymbolAlreadyInUse,
        );

        let now = Self::current_block();
        let token_data = issuance_parameters.try_build::<T, _>(now)?;

        // == MUTATION SAFE ==

        let token_id = Self::next_token_id();
        TokenInfoById::<T>::insert(token_id, token_data);
        SymbolsUsed::<T>::insert(sym, ());
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
    pub(crate) fn do_deissue_token(token_id: T::TokenId) {
        TokenInfoById::<T>::remove(token_id);
        AccountInfoByTokenAndAccount::<T>::remove_prefix(token_id);
        // TODO: add extra state removal as implementation progresses
    }

    /// Transfer preconditions
    pub(crate) fn ensure_can_transfer(
        token_id: T::TokenId,
        src: &T::AccountId,
        outputs: &OutputsOf<T>,
    ) -> DispatchResult {
        // ensure token validity
        let _ = Self::ensure_token_exists(token_id)?;

        // ensure src account id validity
        let src_account_info = Self::ensure_account_data_exists(token_id, src)?;

        // ensure dst account id validity
        outputs.iter().try_for_each(|out| {
            // enusure destination exists and that it differs from source
            Self::ensure_account_data_exists(token_id, &out.beneficiary).and_then(|_| {
                ensure!(
                    out.beneficiary != *src,
                    Error::<T>::SameSourceAndDestinationLocations,
                );
                Ok(())
            })
        })?;

        src_account_info.ensure_can_decrease_liquidity_by::<T>(outputs.total_amount())
    }

    /// Perform balance accounting for balances
    pub(crate) fn do_transfer(token_id: T::TokenId, src: &T::AccountId, outputs: &OutputsOf<T>) {
        outputs.iter().for_each(|out| {
            AccountInfoByTokenAndAccount::<T>::mutate(token_id, &out.beneficiary, |account_data| {
                account_data.increase_liquidity_by(out.amount);
            });
        });

        AccountInfoByTokenAndAccount::<T>::mutate(token_id, &src, |account_data| {
            account_data.decrease_liquidity_by(outputs.total_amount());
        })
    }

    pub(crate) fn current_block() -> T::BlockNumber {
        <frame_system::Module<T>>::block_number()
    }
}
