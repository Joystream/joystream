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
use sp_runtime::{traits::Convert, ModuleId};
use sp_std::iter::Sum;
use storage::{DataObjectStorage, UploadParameters};

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
use types::*;

/// Pallet Configuration Trait
pub trait Trait: frame_system::Trait + balances::Trait + storage::Trait {
    /// Events
    type Event: From<Event<Self>> + Into<<Self as frame_system::Trait>::Event>;

    // TODO: Add frame_support::pallet_prelude::TypeInfo trait
    /// the Balance type used
    type Balance: AtLeast32BitUnsigned
        + FullCodec
        + Copy
        + Default
        + Debug
        + Saturating
        + Sum
        + Into<<Self as balances::Trait>::Balance>;

    /// The token identifier used
    type TokenId: AtLeast32BitUnsigned + FullCodec + Copy + Default + Debug;

    /// Block number to balance converter used for interest calculation
    type BlockNumberToBalance: Convert<Self::BlockNumber, <Self as Trait>::Balance>;

    /// The storage type used
    type DataObjectStorage: storage::DataObjectStorage<Self>;

    /// Tresury account for the various tokens
    type ModuleId: Get<ModuleId>;

    // TODO(after PR round is completed): use Self::ReserveBalance
    /// Bloat bond value: in JOY
    type BloatBond: Get<<Self::ReserveCurrency as Currency<Self::AccountId>>::Balance>;

    /// Maximum number of vesting balances per account per token
    type MaxVestingBalancesPerAccountPerToken: Get<u8>;

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
            outputs: TransfersOf<T>,
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

        #[weight = 10_000_000] // TODO: adjust weight
        pub fn dust_account(origin, token_id: T::TokenId, account_id: T::AccountId) -> DispatchResult {
            let sender = ensure_signed(origin)?;
            let token_info = Self::ensure_token_exists(token_id)?;
            let account_to_remove_info = Self::ensure_account_data_exists(token_id, &account_id)?;

            Self::ensure_user_can_dust_account(
                &token_info.transfer_policy,
                &sender,
                &account_id,
                &account_to_remove_info,
            )?;

            // == MUTATION SAFE ==

            AccountInfoByTokenAndAccount::<T>::remove(token_id, &account_id);

            let bloat_bond = T::BloatBond::get();
            let _ = T::ReserveCurrency::deposit_creating(&account_id, bloat_bond);

            Self::deposit_event(RawEvent::AccountDustedBy(token_id, account_id, sender, token_info.transfer_policy));

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
                proof.verify::<T,_>(&account_id, commit)
            } else {
                Err(Error::<T>::CannotJoinWhitelistInPermissionlessMode.into())
            }?;

            let bloat_bond = T::BloatBond::get();

            // No project_token or balances state corrupted in case of failure
            ensure!(
                T::ReserveCurrency::free_balance(&account_id) >= bloat_bond,
                Error::<T>::InsufficientBalanceForBloatBond,
            );

            // == MUTATION SAFE ==

            let _ = T::ReserveCurrency::slash(&account_id, bloat_bond);

            AccountInfoByTokenAndAccount::<T>::insert(token_id, &account_id, AccountDataOf::<T>::default());

            Self::deposit_event(RawEvent::MemberJoinedWhitelist(token_id, account_id, token_info.transfer_policy));

            Ok(())
        }

        /// Purchase tokens on active token sale.
        ///
        /// Preconditions:
        /// - `token_id` must be existing token's id
        /// - token identified by `token_id` must have OfferingState::Sale
        /// - `amount` cannot exceed number of tokens remaining on sale
        /// - sender's JOY balance must be >= `amount * sale.unit_price`
        /// - there are no tokens still reserved from the previous sale
        /// - if sale has a whitelist:
        ///   - `access_proof` must be a valid merkle proof for sender's whitelist inclusion
        ///   - (total number of tokens already purchased by the account + `amount`) must not exceed
        ///     `access_proof.participant.cap`
        ///
        /// Postconditions:
        /// - `amount * sale.unit_price` JOY tokens are transfered to `sale.tokens_source` account
        /// - `amount` CRT tokens are unreserved from `sale.tokens_source` account and its
        ///    liquidity is decreased by `amount` (`amount` tokens are burned from the account)
        /// - buyer's `vesting_balance` related to the current sale is increased by `amount`
        ///   (or created with `amount` as `vesting_balance.total_amount`)
        /// - `token_data.last_sale.quantity_left` is decreased by `amount`
        #[weight = 10_000_000] // TODO: adjust weight
        pub fn purchase_tokens_on_sale(
            origin,
            token_id: T::TokenId,
            amount: <T as Trait>::Balance,
            access_proof: Option<SaleAccessProofOf<T>>
        ) -> DispatchResult {
            let sender = ensure_signed(origin)?;
            let token_data = Self::ensure_token_exists(token_id)?;
            let sale = OfferingStateOf::<T>::ensure_sale_of::<T>(&token_data)?;
            let sale_id = token_data.sales_initialized;
            let buyer_joy_balance = balances::Module::<T>::usable_balance(&sender);
            let joy_amount = sale.unit_price.saturating_mul(amount.into());

            ensure!(
                buyer_joy_balance >= joy_amount,
                Error::<T>::InsufficientBalanceForTokenPurchase
            );

            ensure!(
                sale.quantity_left >= amount,
                Error::<T>::NotEnoughTokensOnSale
            );

            if let Some(whitelist_commitment) = sale.whitelist_commitment.as_ref() {
                ensure!(access_proof.is_some(), Error::<T>::SaleAccessProofRequired);
                let proof = access_proof.unwrap();
                proof.verify::<T>(&sender, *whitelist_commitment)?;
                Self::ensure_sale_participant_cap_not_exceeded(
                    token_id,
                    sale_id,
                    &proof.participant,
                    amount
                )?;
            }

            // Ensure vesting balance can be increased
            // (MaxVestingBalancesPerAccountPerToken not exceeded)
            let acc_data = AccountInfoByTokenAndAccount::<T>::get(token_id, &sender);
            acc_data.ensure_vesting_balance_can_be_increased::<T>(VestingSource::Sale(sale_id))?;

            // == MUTATION SAFE ==

            <balances::Module::<T> as Currency<T::AccountId>>::transfer(
                &sender,
                &sale.tokens_source,
                joy_amount,
                ExistenceRequirement::AllowDeath
            )?;

            AccountInfoByTokenAndAccount::<T>::mutate(token_id, &sale.tokens_source, |acc_data| {
                // Unreserve + burn
                acc_data.reserved_balance = acc_data.reserved_balance.saturating_sub(amount);
                acc_data.decrease_liquidity_by::<T>(amount);
            });

            AccountInfoByTokenAndAccount::<T>::mutate(token_id, &sender, |acc_data| {
                acc_data.increase_vesting_balance(
                    VestingSource::Sale(sale_id),
                    amount,
                    sale.get_vesting_schedule()
                );
            });

            TokenInfoById::<T>::mutate(token_id, |t| {
                t.last_sale.as_mut().unwrap().quantity_left = sale.quantity_left.saturating_sub(amount);
            });

            Ok(())
        }

        /// Allows anyone to unreserve tokens that were not sold during a token sale
        /// that has already finished
        ///
        /// Preconditions:
        /// - `token_id` must exists
        /// - `token_id` must identify a token with a finished sale (Idle offering state, last_sale.is_some)
        /// - `token_data.last_sale.quantity_left` must be > 0
        ///
        /// Postconditions:
        /// - `token_data.last_sale.quantity_left` is unreserved from
        ///   `token_data.last_sale.tokens_source` account
        /// - `token_data.last_sale.quantity_left` is set to 0
        #[weight = 10_000_000] // TODO: adjust weight
        fn unreserve_unsold_tokens(origin, token_id: T::TokenId) -> DispatchResult {
            ensure_signed(origin)?;
            let token_info = Self::ensure_token_exists(token_id)?;
            OfferingStateOf::<T>::ensure_idle_of::<T>(&token_info)?;
            let amount_to_unreserve = token_info.last_sale_remaining_tokens();
            ensure!(
                !amount_to_unreserve.is_zero(),
                Error::<T>::NoTokensToUnreserve
            );

            // == MUTATION SAFE ==
            AccountInfoByTokenAndAccount::<T>::mutate(
                token_id,
                &token_info.last_sale.unwrap().tokens_source,
                |ad| {
                    ad.reserved_balance = ad.reserved_balance.saturating_sub(amount_to_unreserve);
                    ad.base_balance = ad.base_balance.saturating_add(amount_to_unreserve);
                },
            );
            TokenInfoById::<T>::mutate(token_id, |token_info| {
                token_info.last_sale.as_mut().unwrap().quantity_left = <T as Trait>::Balance::zero();
            });

            Ok(())
        }
    }
}

impl<T: Trait>
    PalletToken<
        T::AccountId,
        TransferPolicyOf<T>,
        TokenIssuanceParametersOf<T>,
        UploadContextOf<T>,
        T::BlockNumber,
        TokenSaleParamsOf<T>,
    > for Module<T>
{
    type Balance = <T as Trait>::Balance;

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
    fn reduce_patronage_rate_by(token_id: T::TokenId, decrement: Self::Balance) -> DispatchResult {
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
            token_info.set_new_patronage_rate_at_block::<T::BlockNumberToBalance>(new_rate, now);
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
        let unclaimed_patronage = token_info.unclaimed_patronage::<T::BlockNumberToBalance>(now);

        if unclaimed_patronage.is_zero() {
            return Ok(());
        }

        // == MUTATION SAFE ==

        AccountInfoByTokenAndAccount::<T>::mutate(token_id, &to_account, |account_info| {
            account_info.increase_liquidity_by(unclaimed_patronage)
        });

        TokenInfoById::<T>::mutate(token_id, |token_info| {
            token_info.increase_issuance_by(unclaimed_patronage);
            token_info.set_unclaimed_tally_patronage_at_block(<T as Trait>::Balance::zero(), now);
        });

        Self::deposit_event(RawEvent::PatronageCreditClaimedAtBlock(
            token_id,
            unclaimed_patronage,
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
        let token_id = Self::next_token_id();
        Self::validate_issuance_parameters(&issuance_parameters)?;

        let token_data = TokenDataOf::<T>::from_params::<T>(issuance_parameters.clone());

        // == MUTATION SAFE ==
        SymbolsUsed::<T>::insert(&token_data.symbol, ());
        TokenInfoById::<T>::insert(token_id, token_data);
        NextTokenId::<T>::put(token_id.saturating_add(T::TokenId::one()));
        AccountInfoByTokenAndAccount::<T>::mutate(
            token_id,
            &issuance_parameters.initial_allocation.address,
            |ad| {
                if let Some(vs) = issuance_parameters
                    .initial_allocation
                    .vesting_schedule
                    .as_ref()
                {
                    ad.increase_vesting_balance(
                        VestingSource::InitialIssuance,
                        issuance_parameters.initial_allocation.amount,
                        VestingScheduleOf::<T>::from_params(Self::current_block(), vs.clone()),
                    )
                } else {
                    ad.base_balance = issuance_parameters.initial_allocation.amount;
                }
            },
        );

        Self::deposit_event(RawEvent::TokenIssued(token_id, issuance_parameters));

        Ok(())
    }

    fn init_token_sale(
        token_id: T::TokenId,
        sale_params: TokenSaleParamsOf<T>,
        payload_upload_context: UploadContextOf<T>,
    ) -> DispatchResult {
        let token_data = Self::ensure_token_exists(token_id)?;
        let sale = TokenSaleOf::<T>::try_from_params::<T>(sale_params.clone())?;
        // Validation + first mutation(!)
        Self::try_init_sale(token_id, &token_data, &sale_params, payload_upload_context)?;
        // == MUTATION SAFE ==
        TokenInfoById::<T>::mutate(token_id, |t| {
            t.last_sale = Some(sale);
            t.sales_initialized = t.sales_initialized.saturating_add(1);
        });

        Ok(())
    }

    /// Update upcoming token sale
    /// Preconditions:
    /// - token is in UpcomingSale state
    ///
    /// Postconditions:
    /// - token's sale `duration` and `start_block` is updated according to provided parameters
    fn update_upcoming_sale(
        token_id: T::TokenId,
        new_start_block: Option<T::BlockNumber>,
        new_duration: Option<T::BlockNumber>,
    ) -> DispatchResult {
        let token_data = Self::ensure_token_exists(token_id)?;
        let sale = OfferingStateOf::<T>::ensure_upcoming_sale_of::<T>(&token_data)?;
        let updated_sale = TokenSaleOf::<T> {
            start_block: new_start_block.unwrap_or(sale.start_block),
            duration: new_duration.unwrap_or(sale.duration),
            ..sale
        };
        ensure!(
            updated_sale.start_block >= <frame_system::Module<T>>::block_number(),
            Error::<T>::SaleStartingBlockInThePast
        );
        // == MUTATION SAFE ==
        TokenInfoById::<T>::mutate(token_id, |t| t.last_sale = Some(updated_sale));

        Ok(())
    }

    /// Remove token data from storage
    /// Preconditions:
    /// - `token_id` must exists
    /// - no account for `token_id` exists
    ///
    /// Postconditions:
    /// - token data @ `token_Id` removed from storage
    /// - all account data for `token_Id` removed
    fn deissue_token(token_id: T::TokenId) -> DispatchResult {
        let token_info = Self::ensure_token_exists(token_id)?;
        Self::ensure_can_deissue_token(token_id)?;

        // == MUTATION SAFE ==

        Self::do_deissue_token(token_info.symbol, token_id);

        Self::deposit_event(RawEvent::TokenDeissued(token_id));

        Ok(())
    }
}

/// Module implementation
impl<T: Trait> Module<T> {
    /// Ensure given account can reserve the specified amount of tokens.
    /// (free_balance >= amount)
    fn ensure_can_reserve(
        account_data: &AccountDataOf<T>,
        amount: <T as Trait>::Balance,
    ) -> DispatchResult {
        if amount.is_zero() {
            return Ok(());
        }

        // ensure can freeze amount
        ensure!(
            account_data.usable_balance::<T>() >= amount,
            Error::<T>::InsufficientFreeBalanceForReserving,
        );

        Ok(())
    }

    /// Reserve specified amount of tokens from the account.
    /// Infallible!
    ///
    /// Postconditions:
    /// - `who` free balance decreased by `amount`
    /// - `who` reserved balance increased by `amount`
    fn do_reserve(token_id: T::TokenId, who: &T::AccountId, amount: <T as Trait>::Balance) {
        AccountInfoByTokenAndAccount::<T>::mutate(token_id, &who, |account_data| {
            account_data.reserved_balance = account_data.reserved_balance.saturating_add(amount);
        });

        Self::deposit_event(RawEvent::TokenAmountReservedFrom(
            token_id,
            who.clone(),
            amount,
        ));
    }

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
    pub(crate) fn do_deissue_token(symbol: T::Hash, token_id: T::TokenId) {
        SymbolsUsed::<T>::remove(symbol);
        TokenInfoById::<T>::remove(token_id);
        // TODO: add extra state removal as implementation progresses
    }

    /// Transfer preconditions
    pub(crate) fn ensure_can_transfer(
        token_id: T::TokenId,
        src: &T::AccountId,
        outputs: &TransfersOf<T>,
    ) -> DispatchResult {
        // ensure token validity
        let token_info = Self::ensure_token_exists(token_id)?;

        // ensure src account id validity
        let src_account_info = Self::ensure_account_data_exists(token_id, src)?;

        // ensure dst account id validity
        outputs.iter().try_for_each(|(dst, _)| {
            match (*dst == *src, &token_info.transfer_policy) {
                (true, _) => Err(Error::<T>::SameSourceAndDestinationLocations.into()),
                (_, TransferPolicyOf::<T>::Permissioned(_)) => {
                    // if permissioned mode account must exist
                    Self::ensure_account_data_exists(token_id, dst).map(|_| ())
                }
                _ => Ok(()),
            }
        })?;

        src_account_info.ensure_can_decrease_liquidity_by::<T>(outputs.total_amount())
    }

    /// Perform balance accounting for balances
    pub(crate) fn do_transfer(token_id: T::TokenId, src: &T::AccountId, outputs: &TransfersOf<T>) {
        outputs.iter().for_each(|(account_id, payment)| {
            AccountInfoByTokenAndAccount::<T>::mutate(token_id, &account_id, |account_data| {
                account_data.increase_liquidity_by(payment.amount);
            });
        });

        AccountInfoByTokenAndAccount::<T>::mutate(token_id, &src, |account_data| {
            account_data.decrease_liquidity_by::<T>(outputs.total_amount());
        })
    }

    pub(crate) fn current_block() -> T::BlockNumber {
        <frame_system::Module<T>>::block_number()
    }

    #[inline]
    pub(crate) fn try_init_sale(
        token_id: T::TokenId,
        token_data: &TokenDataOf<T>,
        sale_params: &TokenSaleParamsOf<T>,
        payload_upload_context: UploadContextOf<T>,
    ) -> DispatchResult {
        // Ensure token offering state is Idle
        OfferingStateOf::<T>::ensure_idle_of::<T>(token_data)?;

        // Ensure no reserved tokens remaining from the previous sale
        ensure!(
            token_data.last_sale_remaining_tokens().is_zero(),
            Error::<T>::RemainingReservedTokensFromPreviousSale
        );

        // Ensure sale upper_bound_quantity can be reserved from `source`
        let account_data = Self::ensure_account_data_exists(token_id, &sale_params.tokens_source)?;
        Self::ensure_can_reserve(&account_data, sale_params.upper_bound_quantity)?;

        // Optionally: Upload whitelist payload
        if let Some(Some(payload)) = sale_params.whitelist.as_ref().map(|p| p.payload.clone()) {
            let upload_params = UploadParameters::<T> {
                bag_id: payload_upload_context.bag_id,
                deletion_prize_source_account_id: payload_upload_context.uploader_account,
                expected_data_size_fee: payload.expected_data_size_fee,
                object_creation_list: vec![payload.object_creation_params],
            };
            // Validation + first mutation (!)
            storage::Module::<T>::upload_data_objects(upload_params)?;
        }

        // == MUTATION SAFE ==
        Self::do_reserve(
            token_id,
            &sale_params.tokens_source,
            sale_params.upper_bound_quantity,
        );

        Ok(())
    }

    /// Ensure sender can remove account
    /// Params:
    /// - transfer_policy for the token
    /// - sender dust_account extrinsic signer
    /// - account_to_remove account id to be removed
    /// - account to remove Data
    pub(crate) fn ensure_user_can_dust_account(
        transfer_policy: &TransferPolicyOf<T>,
        sender: &T::AccountId,
        account_to_remove: &T::AccountId,
        account_to_remove_info: &AccountDataOf<T>,
    ) -> DispatchResult {
        match (
            transfer_policy,
            account_to_remove_info.is_empty(),
            sender == account_to_remove,
        ) {
            (_, _, true) => Ok(()),
            (TransferPolicyOf::<T>::Permissionless, true, _) => Ok(()),
            (TransferPolicyOf::<T>::Permissioned(_), _, _) => {
                Err(Error::<T>::AttemptToRemoveNonOwnedAccountUnderPermissionedMode.into())
            }
            _ => Err(Error::<T>::AttemptToRemoveNonOwnedAndNonEmptyAccount.into()),
        }
    }

    /// Validate token issuance parameters
    pub(crate) fn validate_issuance_parameters(
        params: &TokenIssuanceParametersOf<T>,
    ) -> DispatchResult {
        ensure!(
            !SymbolsUsed::<T>::contains_key(&params.symbol),
            Error::<T>::TokenSymbolAlreadyInUse,
        );

        Ok(())
    }

    pub(crate) fn ensure_can_deissue_token(token_id: T::TokenId) -> DispatchResult {
        let token_info = Self::ensure_token_exists(token_id)?;
        ensure!(
            AccountInfoByTokenAndAccount::<T>::iter_prefix(token_id)
                .next()
                .is_none(),
            Error::<T>::CannotDeissueTokenWithOutstandingAccounts,
        );

        // This is a extra, since when no account exists -> total_supply == 0
        debug_assert!(token_info.total_supply.is_zero());

        Ok(())
    }

    pub(crate) fn ensure_sale_participant_cap_not_exceeded(
        token_id: T::TokenId,
        sale_id: TokenSaleId,
        participant: &WhitelistedSaleParticipantOf<T>,
        purchase_amount: <T as Trait>::Balance,
    ) -> DispatchResult {
        if participant.cap.is_none() {
            return Ok(());
        }
        let opt_acc_data = Self::ensure_account_data_exists(token_id, &participant.address).ok();
        let tokens_purchased = opt_acc_data.map_or(<T as Trait>::Balance::zero(), |ad| {
            ad.vesting_balances
                .get(&VestingSource::Sale(sale_id))
                .map_or(<T as Trait>::Balance::zero(), |vb| vb.total_amount)
        });
        ensure!(
            tokens_purchased.saturating_add(purchase_amount) <= participant.cap.unwrap(),
            Error::<T>::SaleParticipantCapExceeded
        );
        Ok(())
    }
}
