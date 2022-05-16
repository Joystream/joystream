// Compiler demand.
#![recursion_limit = "256"]

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
    traits::{AccountIdConversion, Convert, UniqueSaturatedInto},
    ModuleId,
};
use sp_std::collections::btree_map::BTreeMap;
use sp_std::iter::Sum;
use storage::UploadParameters;

// crate modules
mod errors;
mod events;
mod traits;
mod types;

// #[cfg(test)]
mod tests;

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
        + From<u64>
        + UniqueSaturatedInto<u64>
        + Into<JoyBalanceOf<Self>>;

    /// The token identifier used
    type TokenId: AtLeast32BitUnsigned + FullCodec + Copy + Default + Debug;

    /// Block number to balance converter used for interest calculation
    type BlockNumberToBalance: Convert<Self::BlockNumber, <Self as Trait>::Balance>;

    /// The storage type used
    type DataObjectStorage: storage::DataObjectStorage<Self>;

    /// Tresury account for the various tokens
    type ModuleId: Get<ModuleId>;

    /// Existential Deposit for the JOY pallet
    type JoyExistentialDeposit: Get<JoyBalanceOf<Self>>;

    /// Maximum number of vesting balances per account per token
    type MaxVestingBalancesPerAccountPerToken: Get<u8>;

    /// Number of blocks produced in a year
    type BlocksPerYear: Get<u32>;
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
        pub SymbolsUsed get(fn symbol_used) config():
        map
            hasher(blake2_128_concat) T::Hash => ();

        /// Bloat Bond value used during account creation
        pub BloatBond get(fn bloat_bond) config(): JoyBalanceOf<T>;

        /// Minimum duration of a token sale
        pub MinSaleDuration get(fn min_sale_duration) config(): T::BlockNumber;
    }

    add_extra_genesis {
        build(|_| {
            // We deposit some initial balance to the pallet's module account on the genesis block
            // to protect the account from being deleted ("dusted") on early stages of pallet's work
            // by the "garbage collector" of the balances pallet.
            // It should be equal to at least `ExistentialDeposit` from the balances pallet setting.
            // Original issues:
            // - https://github.com/Joystream/joystream/issues/3497
            // - https://github.com/Joystream/joystream/issues/3510

            let module_account_id = crate::Module::<T>::bloat_bond_treasury_account_id();
            let deposit = T::JoyExistentialDeposit::get();

            let _ = Joy::<T>::deposit_creating(&module_account_id, deposit);
        });
    }
}

decl_module! {
    pub struct Module<T: Trait> for enum Call
    where
        origin: T::Origin
    {

        /// Default deposit_event() handler
        fn deposit_event() = default;

        /// Predefined errors.
        type Error = Error<T>;

        /// Allow to transfer from `src` to the various `outputs` beneficiaries in the
        /// specified amounts.
        /// Preconditions:
        /// - token by `token_id` must exists
        /// - `src` must be valid for `token_id`, and must have enough JOYs to cover
        ///    the total bloat bond required in case of destination(s) not existing.
        /// - `src` must have enough token funds to cover all the transfers
        /// - `outputs` must designate existing destination(s) for "Permissioned" transfers.
        //
        /// Postconditions:
        /// - `src` tokens amount decreased by `amount`.
        /// - `src` JOY balance is decreased by the
        ///    total bloat bond deposited in case destination have been added to storage
        /// - `outputs.beneficiary` tokens amount increased by `amount`
        #[weight = 10_000_000] // TODO: adjust weight
        pub fn transfer(
            origin,
            token_id: T::TokenId,
            outputs: TransfersOf<T>,
        ) -> DispatchResult {
            let src = ensure_signed(origin)?;

            // Currency transfer preconditions
            let validated_transfers = Self::ensure_can_transfer(token_id, &src, outputs.into(), false)?;

            // == MUTATION SAFE ==

            Self::do_transfer(token_id, &src, &validated_transfers);

            Self::deposit_event(RawEvent::TokenAmountTransferred(
                token_id,
                src,
                validated_transfers,
            ));
            Ok(())
        }

        /// Allow any user to remove an account
        /// Preconditions:
        /// - token by `token_id` must exist
        /// - `account_id` must be valid for `token_id`
        /// - if Permissioned token: `origin` signer must be `account_id`
        /// - `account_id` must be an empty account (`account_data.amount` == 0)
        /// Postconditions:
        /// - Account information for `account_id` removed from storage
        /// - bloat bond refunded
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
            TokenInfoById::<T>::mutate(token_id, |token_info| {
                token_info.decrement_accounts_number();
            });

            let bloat_bond = account_to_remove_info.bloat_bond;
            Self::withdraw_from_treasury(&account_id, bloat_bond);

            Self::deposit_event(RawEvent::AccountDustedBy(token_id, account_id, sender, token_info.transfer_policy));

            Ok(())
        }

        /// Join whitelist for permissioned case: used to add accounts for token
        /// Preconditions:
        /// - token by 'token_id' must exist
        /// - `origin` signer must not already exists
        /// - transfer policy is `Permissioned` and merkle proof must be valid
        ///
        /// Postconditions:
        /// - `origin` signer account created and added to pallet storage
        /// - `bloat_bond` subtracted from caller JOY usable balance
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

            let bloat_bond = Self::bloat_bond();

            // No project_token or balances state corrupted in case of failure
            Self::ensure_can_transfer_joy(&account_id, bloat_bond)?;

            // == MUTATION SAFE ==

            Self::deposit_to_treasury(&account_id, bloat_bond);

            Self::do_insert_new_account_for_token(
                token_id,
                &account_id,
                AccountDataOf::<T>::new_with_amount_and_bond(
                    <T as Trait>::Balance::zero(),
                    bloat_bond,
                ));

            Self::deposit_event(RawEvent::MemberJoinedWhitelist(token_id, account_id, token_info.transfer_policy));

            Ok(())
        }

        /// Purchase tokens on active token sale.
        ///
        /// Preconditions:
        /// - token by `token_id` must exist
        /// - token by `token_id` must be in OfferingState::Sale
        /// - `amount` cannot exceed number of tokens remaining on sale
        /// - sender's available JOY balance must be:
        ///   - >= `joy_existential_deposit + amount * sale.unit_price`
        ///     if AccountData already exist
        ///   - >= `joy_existential_deposit + amount * sale.unit_price + bloat_bond`
        ///     if AccountData does not exist
        /// - `(total number of tokens already purchased by the member + `amount`) must not exceed
        ///   sale's purchase cap per member
        /// - if Permissioned token:
        ///   - AccountInfoByTokenAndAccount(token_id, &sender) must exist
        /// - number of sender's ongoing vesting schedules
        ///   must be < MaxVestingSchedulesPerAccountPerToken
        ///
        /// Postconditions:
        /// - `amount * sale.unit_price` JOY tokens are transfered from `sender`
        ///   to `sale.tokens_source` account
        /// - if new account created: `bloat_bond` transferred from `sender` to treasury
        /// - if buyer has no `vesting_schedule` related to the current sale:
        ///   - a new vesting schedule (`sale.get_vesting_schedule(purchase_amount)`) is added to
        ///     buyer's `vesing_schedules`
        ///   - some finished vesting schedule is removed from buyer's account_data in case the
        ///   number of buyer's vesting_schedules was == MaxVestingSchedulesPerAccountPerToken
        /// - if buyer already has a `vesting_schedule` related to the current sale:
        ///   - current vesting schedule's `cliff_amount` is increased by
        ///     `sale.get_vesting_schedule(purchase_amount).cliff_amount`
        ///   - current vesting schedule's `post_cliff_total_amount` is increased by
        ///     `sale.get_vesting_schedule(purchase_amount).post_cliff_total_amount`
        /// - if `token_data.sale.quantity_left - amount > 0`:
        ///   - `token_data.sale.quantity_left` is decreased by `amount`
        /// - if `token_data.sale.quantity_left - amount == 0`:
        ///   - `token_data.sale` is set to None
        #[weight = 10_000_000] // TODO: adjust weight
        pub fn purchase_tokens_on_sale(
            origin,
            token_id: T::TokenId,
            amount: <T as Trait>::Balance
        ) -> DispatchResult {
            // Ensure non-zero amount
            ensure!(!amount.is_zero(), Error::<T>::SalePurchaseAmountIsZero);

            let current_block = Self::current_block();
            let sender = ensure_signed(origin)?;
            let token_data = Self::ensure_token_exists(token_id)?;
            let sale = OfferingStateOf::<T>::ensure_sale_of::<T>(&token_data)?;
            let sale_id = token_data.next_sale_id - 1;
            let joy_amount = sale.unit_price.saturating_mul(amount.into());
            let account_exists = AccountInfoByTokenAndAccount::<T>::contains_key(token_id, &sender);
            let bloat_bond = Self::bloat_bond();

            let required_joy_balance = if account_exists {
                joy_amount
            } else {
                joy_amount.saturating_add(bloat_bond)
            };

            // Ensure buyer's JOY balance is sufficient for the purchase
            // and bloat bond (if required)
            Self::ensure_can_transfer_joy(&sender, required_joy_balance)?;

            // Ensure enough tokens are available on sale
            ensure!(
                sale.quantity_left >= amount,
                Error::<T>::NotEnoughTokensOnSale
            );

            // Ensure participant's cap is not exceeded
            if let Some(cap) = sale.cap_per_member {
                Self::ensure_purchase_cap_not_exceeded(
                    token_id,
                    sale_id,
                    &sender,
                    amount,
                    cap
                )?;
            }

            // Ensure account exists if Permissioned token
            if let TransferPolicy::Permissioned(_) = token_data.transfer_policy {
                ensure!(account_exists, Error::<T>::AccountInformationDoesNotExist);
            }

            // Ensure vesting schedule can added if doesn't already exist
            // (MaxVestingSchedulesPerAccountPerToken not exceeded)
            let acc_data = AccountInfoByTokenAndAccount::<T>::get(token_id, &sender);
            let vesting_cleanup_key = acc_data.ensure_can_add_or_update_vesting_schedule::<T>(
                current_block,
                VestingSource::Sale(sale_id)
            )?;

            // == MUTATION SAFE ==

            <Joy::<T> as Currency<T::AccountId>>::transfer(
                &sender,
                &sale.tokens_source,
                joy_amount,
                ExistenceRequirement::KeepAlive
            )?;

            if account_exists {
                AccountInfoByTokenAndAccount::<T>::mutate(token_id, &sender, |acc_data| {
                    acc_data.add_or_update_vesting_schedule(
                        VestingSource::Sale(sale_id),
                        sale.get_vesting_schedule(amount),
                        vesting_cleanup_key
                    );
                });
            } else {
                Self::deposit_to_treasury(&sender, bloat_bond);
                Self::do_insert_new_account_for_token(
                    token_id,
                    &sender,
                    AccountData::new_with_vesting_and_bond(
                        VestingSource::Sale(sale_id),
                        sale.get_vesting_schedule(amount),
                        bloat_bond,
                    )
                );
            }

            let updated_sale_quantity = sale.quantity_left.saturating_sub(amount);
            TokenInfoById::<T>::mutate(token_id, |t| {
                if updated_sale_quantity.is_zero() {
                    t.sale = None;
                } else if let Some(s) = t.sale.as_mut() {
                    s.quantity_left = updated_sale_quantity;
                }
            });

            Self::deposit_event(RawEvent::TokensPurchasedOnSale(token_id, sale_id, amount, sender));

            Ok(())
        }

        /// Allows anyone to recover tokens that were not sold during a token sale
        /// that has already finished (they will always be sent back to
        /// `token_data.sale.tokens_source` account)
        ///
        /// Preconditions:
        /// - token by `token_id` must exists
        /// - token must be in Idle offering state
        /// - token must have `sale` set
        ///
        /// Postconditions:
        /// - `token_data.sale.tokens_source` account balance is increased by
        ///   `token_data.last_sale.quantity_left`
        /// - `token_data.sale` is set to None
        #[weight = 10_000_000] // TODO: adjust weight
        fn recover_unsold_tokens(origin, token_id: T::TokenId) -> DispatchResult {
            ensure_signed(origin)?;
            let token_info = Self::ensure_token_exists(token_id)?;
            OfferingStateOf::<T>::ensure_idle_of::<T>(&token_info)?;
            let sale = token_info.sale.ok_or(Error::<T>::NoTokensToRecover)?;
            let sale_id = token_info.next_sale_id - 1;

            // == MUTATION SAFE ==
            AccountInfoByTokenAndAccount::<T>::mutate(
                token_id,
                &sale.tokens_source,
                |ad| {
                    ad.increase_amount_by(sale.quantity_left);
                },
            );
            TokenInfoById::<T>::mutate(token_id, |token_info| {
                token_info.sale = None;
            });

            Self::deposit_event(RawEvent::UnsoldTokensRecovered(token_id, sale_id, sale.quantity_left));

            Ok(())
        }
    }
}

impl<T: Trait>
    PalletToken<
        T::AccountId,
        TransferPolicyOf<T>,
        TokenIssuanceParametersOf<T>,
        T::BlockNumber,
        TokenSaleParamsOf<T>,
        UploadContextOf<T>,
        TransfersWithVestingOf<T>,
    > for Module<T>
{
    type Balance = <T as Trait>::Balance;

    type TokenId = T::TokenId;

    type MerkleProof = MerkleProofOf<T>;

    type YearlyRate = YearlyRate;

    /// Change to permissionless
    /// Preconditions:
    /// - token by `token_id` must exist
    /// Postconditions
    /// - transfer policy of `token_id` changed to permissionless
    fn change_to_permissionless(token_id: T::TokenId) -> DispatchResult {
        Self::ensure_token_exists(token_id).map(|_| ())?;

        // == MUTATION SAFE ==

        TokenInfoById::<T>::mutate(token_id, |token_info| {
            token_info.transfer_policy = TransferPolicyOf::<T>::Permissionless;
            Ok(())
        })
    }

    /// Reduce patronage rate by amount
    /// Preconditions:
    /// - token by `token_id` must exists
    /// - `decrement` must be less or equal than current patronage rate for `token_id`
    ///
    /// Postconditions:
    /// - patronage rate for `token_id` reduced by `decrement`
    /// - no-op if `target_rate` is equal to the current patronage rate
    fn reduce_patronage_rate_to(token_id: T::TokenId, target_rate: YearlyRate) -> DispatchResult {
        let token_info = Self::ensure_token_exists(token_id)?;
        let target_rate_per_block =
            BlockRate::from_yearly_rate(target_rate, T::BlocksPerYear::get());

        if token_info.patronage_info.rate == target_rate_per_block {
            return Ok(());
        }

        ensure!(
            token_info.patronage_info.rate > target_rate_per_block,
            Error::<T>::TargetPatronageRateIsHigherThanCurrentRate,
        );

        // == MUTATION SAFE ==

        let now = Self::current_block();
        TokenInfoById::<T>::mutate(token_id, |token_info| {
            token_info.set_new_patronage_rate_at_block(target_rate_per_block, now);
        });

        let new_yearly_rate =
            target_rate_per_block.to_yearly_rate_representation(T::BlocksPerYear::get());
        Self::deposit_event(RawEvent::PatronageRateDecreasedTo(
            token_id,
            new_yearly_rate,
        ));

        Ok(())
    }

    /// Allow creator to receive credit into his accounts
    /// Preconditions:
    /// - token by `token_id` must exists
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
        let unclaimed_patronage = token_info.unclaimed_patronage_at_block(now);

        if unclaimed_patronage.is_zero() {
            return Ok(());
        }

        // == MUTATION SAFE ==

        AccountInfoByTokenAndAccount::<T>::mutate(token_id, &to_account, |account_info| {
            account_info.increase_amount_by(unclaimed_patronage)
        });

        TokenInfoById::<T>::mutate(token_id, |token_info| {
            token_info.increase_supply_by(unclaimed_patronage);
            token_info.set_unclaimed_tally_patronage_at_block(<T as Trait>::Balance::zero(), now);
        });

        Self::deposit_event(RawEvent::PatronageCreditClaimed(
            token_id,
            unclaimed_patronage,
            to_account,
        ));

        Ok(())
    }

    /// Issue token with specified characteristics
    /// Preconditions:
    /// - `symbol` specified in the parameters must NOT exists in `SymbolsUsed`
    /// - `issuer` usable balance in JOYs >= `initial_allocation.len() * bloat_bond + JoyExistentialDeposit`
    ///
    /// Postconditions:
    /// - token with specified characteristics is added to storage state
    /// - `NextTokenId` increased by 1
    /// - symbol is added to `SymbolsUsed`
    /// - total bloat bond in JOY is transferred from `issuer` to treasury account
    /// - new token accounts are initialized based on `initial_allocation`
    fn issue_token(
        issuer: T::AccountId,
        issuance_parameters: TokenIssuanceParametersOf<T>,
        upload_context: UploadContextOf<T>,
    ) -> DispatchResult {
        let token_id = Self::next_token_id();
        let bloat_bond = Self::bloat_bond();
        Self::validate_issuance_parameters(&issuance_parameters)?;
        let token_data = TokenDataOf::<T>::from_params::<T>(issuance_parameters.clone());
        let whitelist_payload = issuance_parameters.get_whitelist_payload();

        // TODO: Not clear what the storage interface will be yet, so this is just a mock code now
        let upload_params = whitelist_payload.as_ref().map_or::<Result<
            Option<UploadParameters<T>>,
            DispatchError,
        >, _>(Ok(None), |payload| {
            let params = Self::ensure_can_upload_data_object(payload, &upload_context)?;
            Ok(Some(params))
        })?;

        let total_bloat_bond = issuance_parameters.get_initial_allocation_bloat_bond(bloat_bond);
        Self::ensure_can_transfer_joy(&issuer, total_bloat_bond)?;

        // == MUTATION SAFE ==
        SymbolsUsed::<T>::insert(&token_data.symbol, ());
        TokenInfoById::<T>::insert(token_id, token_data);
        NextTokenId::<T>::put(token_id.saturating_add(T::TokenId::one()));

        Self::deposit_to_treasury(&issuer, total_bloat_bond);

        Self::perform_initial_allocation(
            token_id,
            &issuance_parameters.initial_allocation,
            bloat_bond,
        );

        // TODO: Not clear what the storage interface will be yet, so this is just a mock code now
        if let Some(params) = upload_params.as_ref() {
            Self::upload_data_object(params);
        }

        Self::deposit_event(RawEvent::TokenIssued(token_id, issuance_parameters));

        Ok(())
    }

    /// Allow to transfer from `src` (issuer) to the various `outputs` beneficiaries in the
    /// specified amounts, with optional vesting schemes attached.
    ///
    /// Preconditions:
    /// - token by `token_id` must exists
    /// - `src` must be valid for `token_id`, and must have enough JOYs to cover
    ///    the total bloat bond required in case of destination(s) not existing.
    /// - `src` must have enough token funds to cover all the transfers
    /// - each account in `outputs` must have the number of ongoing `vesting_schedules` <
    ///   MaxVestingSchedulesPerAccountPerToken in case `vesting_schedule` was provided
    ///   in the output
    //
    /// Postconditions:
    /// - `src` tokens amount decreased by `amount`.
    /// - `src` JOY balance is decreased by the
    ///    total bloat bond deposited in case destination(s) have been added to storage
    /// - `outputs.beneficiary` tokens amount increased by `amount`
    /// - if `vesting_schedule` provided in the output - vesting schedule added to
    ///   `outputs.beneficiary` account data
    /// - if number of `vesting_schedules` in `outputs.beneficiary` account data was equal to
    ///   MaxVestingSchedulesPerAccountPerToken - some finished vesting_schedule is dropped
    ///   from beneficiary'es `account_data`
    fn issuer_transfer(
        src: T::AccountId,
        token_id: T::TokenId,
        outputs: TransfersWithVestingOf<T>,
    ) -> DispatchResult {
        // Currency transfer preconditions
        let validated_transfers = Self::ensure_can_transfer(token_id, &src, outputs, true)?;

        // == MUTATION SAFE ==

        Self::do_transfer(token_id, &src, &validated_transfers);

        Self::deposit_event(RawEvent::TokenAmountTransferredByIssuer(
            token_id,
            src,
            validated_transfers,
        ));
        Ok(())
    }

    /// Initialize token sale
    ///
    /// Preconditions:
    /// - token by `token_id` exists
    /// - provided sale start block is >= current_block
    /// - token offering is in Idle state
    /// - previous sale has been finalized (token_data.sale.is_none())
    /// - `sale_params.tokens_source` account exists
    /// - `sale_params.tokens_source` has transferrable CRT balance
    ///   >= `sale_params.upper_bound_quantity`
    ///
    /// Postconditions:
    /// - `sale_params.tokens_source` account balance is decreased by
    ///   `sale_params.upper_bound_quantity`
    /// - token's `sale` is set
    /// - token's `next_sale_id` is incremented
    fn init_token_sale(token_id: T::TokenId, sale_params: TokenSaleParamsOf<T>) -> DispatchResult {
        let current_block = Self::current_block();
        let token_data = Self::ensure_token_exists(token_id)?;
        let sale = TokenSaleOf::<T>::try_from_params::<T>(sale_params.clone(), current_block)?;
        Self::ensure_can_init_sale(token_id, &token_data, &sale_params, current_block)?;

        // == MUTATION SAFE ==

        // Decrease source account's tokens number by sale_params.upper_bound_quantity
        // (unsold tokens can be later recovered with `recover_unsold_tokens`)
        AccountInfoByTokenAndAccount::<T>::mutate(token_id, &sale_params.tokens_source, |ad| {
            ad.decrease_amount_by(sale_params.upper_bound_quantity);
        });

        TokenInfoById::<T>::mutate(token_id, |t| {
            t.sale = Some(sale);
            t.next_sale_id = t.next_sale_id.saturating_add(1);
        });

        Ok(())
    }

    /// Update upcoming token sale
    /// Preconditions:
    /// - token by `token_id` exists
    /// - token offering is in UpcomingSale state
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
        TokenInfoById::<T>::mutate(token_id, |t| t.sale = Some(updated_sale));

        Ok(())
    }

    /// Remove token data from storage
    /// Preconditions:
    /// - token by `token_id` must exists
    /// - no account for `token_id` exists
    ///
    /// Postconditions:
    /// - token data @ `token_Id` removed from storage
    /// - `symbol` for `token_id` removed
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
        transfers: TransfersWithVestingOf<T>,
        is_issuer: bool,
    ) -> Result<ValidatedTransfersOf<T>, DispatchError> {
        // ensure token validity
        let token_info = Self::ensure_token_exists(token_id)?;

        // ensure src account id validity
        let src_account_info = Self::ensure_account_data_exists(token_id, src)?;

        // ensure src account can cover total transfers amount
        src_account_info
            .ensure_can_transfer::<T>(Self::current_block(), transfers.total_amount())?;

        // validate destinations
        let validated_transfers =
            Self::validate_transfers(token_id, transfers, &token_info.transfer_policy, is_issuer)?;

        // compute bloat bond
        let cumulative_bloat_bond = Self::compute_bloat_bond(&validated_transfers);
        Self::ensure_can_transfer_joy(src, cumulative_bloat_bond)?;

        Ok(validated_transfers)
    }

    /// Perform balance accounting for balances
    pub(crate) fn do_transfer(
        token_id: T::TokenId,
        src: &T::AccountId,
        validated_transfers: &ValidatedTransfersOf<T>,
    ) {
        let current_block = Self::current_block();
        validated_transfers
            .0
            .iter()
            .for_each(|(validated_account, validated_payment)| {
                let vesting_schedule =
                    validated_payment
                        .payment
                        .vesting_schedule
                        .clone()
                        .map(|vsp| {
                            VestingSchedule::from_params(
                                current_block,
                                validated_payment.payment.amount,
                                vsp,
                            )
                        });
                match validated_account {
                    Validated::<_>::Existing(account_id) => {
                        AccountInfoByTokenAndAccount::<T>::mutate(
                            token_id,
                            &account_id,
                            |account_data| {
                                if let Some(vs) = vesting_schedule {
                                    account_data.add_or_update_vesting_schedule(
                                        VestingSource::IssuerTransfer(
                                            account_data.next_vesting_transfer_id,
                                        ),
                                        vs,
                                        validated_payment.vesting_cleanup_candidate.clone(),
                                    )
                                } else {
                                    account_data
                                        .increase_amount_by(validated_payment.payment.amount);
                                }
                            },
                        )
                    }
                    Validated::<_>::NonExisting(account_id) => {
                        Self::do_insert_new_account_for_token(
                            token_id,
                            &account_id,
                            if let Some(vs) = vesting_schedule {
                                AccountDataOf::<T>::new_with_vesting_and_bond(
                                    VestingSource::IssuerTransfer(0),
                                    vs,
                                    Self::bloat_bond(),
                                )
                            } else {
                                AccountDataOf::<T>::new_with_amount_and_bond(
                                    validated_payment.payment.amount,
                                    Self::bloat_bond(),
                                )
                            },
                        );
                    }
                }
            });

        let cumulative_bloat_bond = Self::compute_bloat_bond(validated_transfers);
        if !cumulative_bloat_bond.is_zero() {
            Self::deposit_to_treasury(src, cumulative_bloat_bond);
        }

        AccountInfoByTokenAndAccount::<T>::mutate(token_id, &src, |account_data| {
            account_data.decrease_amount_by(validated_transfers.total_amount());
        });
    }

    pub(crate) fn current_block() -> T::BlockNumber {
        <frame_system::Module<T>>::block_number()
    }

    pub(crate) fn ensure_can_init_sale(
        token_id: T::TokenId,
        token_data: &TokenDataOf<T>,
        sale_params: &TokenSaleParamsOf<T>,
        current_block: T::BlockNumber,
    ) -> DispatchResult {
        // Ensure sale duration is >= MinSaleDuration
        ensure!(
            sale_params.duration >= MinSaleDuration::<T>::get(),
            Error::<T>::SaleDurationTooShort
        );

        // Ensure token offering state is Idle
        OfferingStateOf::<T>::ensure_idle_of::<T>(token_data)?;

        // Ensure previous sale was finalized
        ensure!(
            token_data.sale.is_none(),
            Error::<T>::RemainingUnrecoveredTokensFromPreviousSale
        );

        // Ensure source account exists
        let account_data = Self::ensure_account_data_exists(token_id, &sale_params.tokens_source)?;

        // Ensure source account has enough transferrable tokens
        account_data.ensure_can_transfer::<T>(current_block, sale_params.upper_bound_quantity)?;

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
        ensure!(
            account_to_remove_info.is_empty(),
            Error::<T>::AttemptToRemoveNonEmptyAccount
        );
        if let TransferPolicyOf::<T>::Permissioned(_) = transfer_policy {
            ensure!(
                sender == account_to_remove,
                Error::<T>::AttemptToRemoveNonOwnedAccountUnderPermissionedMode
            );
        }
        Ok(())
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
            token_info.accounts_number.is_zero(),
            Error::<T>::CannotDeissueTokenWithOutstandingAccounts,
        );

        // This is a extra, since when no account exists -> total_supply == 0
        debug_assert!(token_info.total_supply.is_zero());

        Ok(())
    }

    pub(crate) fn ensure_purchase_cap_not_exceeded(
        token_id: T::TokenId,
        sale_id: TokenSaleId,
        buyer: &T::AccountId,
        purchase_amount: <T as Trait>::Balance,
        cap: <T as Trait>::Balance,
    ) -> DispatchResult {
        let opt_acc_data = Self::ensure_account_data_exists(token_id, &buyer).ok();
        let tokens_purchased = opt_acc_data.map_or(<T as Trait>::Balance::zero(), |ad| {
            ad.vesting_schedules
                .get(&VestingSource::Sale(sale_id))
                .map_or(<T as Trait>::Balance::zero(), |vs| vs.total_amount())
        });
        ensure!(
            tokens_purchased.saturating_add(purchase_amount) <= cap,
            Error::<T>::SalePurchaseCapExceeded
        );
        Ok(())
    }

    /// Returns the module account for the bloat bond treasury
    pub fn bloat_bond_treasury_account_id() -> T::AccountId {
        <T as Trait>::ModuleId::get().into_sub_account(Vec::<u8>::new())
    }

    pub(crate) fn validate_destination(
        dst: T::AccountId,
        dst_acc_data: &Option<AccountDataOf<T>>,
        transfer_policy: &TransferPolicyOf<T>,
        is_issuer: bool,
    ) -> Result<Validated<T::AccountId>, DispatchError> {
        if let TransferPolicy::Permissioned(_) = transfer_policy {
            ensure!(
                is_issuer || dst_acc_data.is_some(),
                Error::<T>::AccountInformationDoesNotExist
            );
        }
        if dst_acc_data.is_some() {
            Ok(Validated::Existing(dst))
        } else {
            Ok(Validated::NonExisting(dst))
        }
    }

    pub(crate) fn validate_payment(
        payment: PaymentWithVestingOf<T>,
        dst_acc_data: Option<AccountDataOf<T>>,
    ) -> Result<ValidatedPaymentOf<T>, DispatchError> {
        if let (Some(_), Some(acc_data)) =
            (payment.vesting_schedule.as_ref(), dst_acc_data.as_ref())
        {
            let cleanup_candidate = acc_data.ensure_can_add_or_update_vesting_schedule::<T>(
                Self::current_block(),
                VestingSource::IssuerTransfer(acc_data.next_vesting_transfer_id),
            )?;

            Ok(ValidatedPaymentOf::<T>::new(payment, cleanup_candidate))
        } else {
            Ok(payment.into())
        }
    }

    pub(crate) fn compute_bloat_bond(
        validated_transfers: &ValidatedTransfersOf<T>,
    ) -> JoyBalanceOf<T> {
        let bloat_bond = Self::bloat_bond();
        validated_transfers
            .0
            .iter()
            .fold(JoyBalanceOf::<T>::zero(), |acc, (account, _)| {
                if matches!(account, Validated::<_>::NonExisting(_)) {
                    acc.saturating_add(bloat_bond)
                } else {
                    JoyBalanceOf::<T>::zero()
                }
            })
    }

    pub(crate) fn validate_transfers(
        token_id: T::TokenId,
        transfers: TransfersWithVestingOf<T>,
        transfer_policy: &TransferPolicyOf<T>,
        is_issuer: bool,
    ) -> Result<ValidatedTransfersOf<T>, DispatchError> {
        let result = transfers
            .0
            .into_iter()
            .map(|(dst, payment)| {
                let dst_acc_data = Self::ensure_account_data_exists(token_id, &dst).ok();
                let validated_dst =
                    Self::validate_destination(dst, &dst_acc_data, transfer_policy, is_issuer)?;
                let validated_payment = Self::validate_payment(payment, dst_acc_data)?;
                Ok((validated_dst, validated_payment))
            })
            .collect::<Result<BTreeMap<_, _>, DispatchError>>()?;

        Ok(Transfers::<_, _>(result))
    }

    pub(crate) fn ensure_can_transfer_joy(
        src: &T::AccountId,
        amount: JoyBalanceOf<T>,
    ) -> DispatchResult {
        if !amount.is_zero() {
            ensure!(
                Joy::<T>::usable_balance(src)
                    >= T::JoyExistentialDeposit::get().saturating_add(amount),
                Error::<T>::InsufficientJoyBalance
            );
        }
        Ok(())
    }

    pub(crate) fn deposit_to_treasury(src: &T::AccountId, amount: JoyBalanceOf<T>) {
        let treasury_account_id = Self::bloat_bond_treasury_account_id();
        let _ = <Joy<T> as Currency<T::AccountId>>::transfer(
            src,
            &treasury_account_id,
            amount,
            ExistenceRequirement::KeepAlive,
        );
    }

    pub(crate) fn withdraw_from_treasury(dst: &T::AccountId, amount: JoyBalanceOf<T>) {
        let treasury_account_id = Self::bloat_bond_treasury_account_id();
        let _ = <Joy<T> as Currency<T::AccountId>>::transfer(
            &treasury_account_id,
            dst,
            amount,
            ExistenceRequirement::KeepAlive,
        );
    }

    pub(crate) fn do_insert_new_account_for_token(
        token_id: T::TokenId,
        account_id: &T::AccountId,
        info: AccountDataOf<T>,
    ) {
        AccountInfoByTokenAndAccount::<T>::insert(token_id, account_id, info);

        TokenInfoById::<T>::mutate(token_id, |token_info| {
            token_info.increment_accounts_number();
        });
    }

    pub(crate) fn perform_initial_allocation(
        token_id: T::TokenId,
        targets: &BTreeMap<T::AccountId, TokenAllocationOf<T>>,
        bloat_bond: JoyBalanceOf<T>,
    ) {
        let current_block = Self::current_block();

        for (destination, allocation) in targets {
            let account_data = if let Some(vsp) = allocation.vesting_schedule_params.as_ref() {
                AccountDataOf::<T>::new_with_vesting_and_bond(
                    VestingSource::InitialIssuance,
                    VestingSchedule::from_params(current_block, allocation.amount, vsp.clone()),
                    bloat_bond,
                )
            } else {
                AccountDataOf::<T>::new_with_amount_and_bond(allocation.amount, bloat_bond)
            };

            Self::do_insert_new_account_for_token(token_id, &destination, account_data);
        }
    }

    #[allow(clippy::unnecessary_wraps)]
    pub(crate) fn ensure_can_upload_data_object(
        payload: &SingleDataObjectUploadParamsOf<T>,
        upload_context: &UploadContextOf<T>,
    ) -> Result<UploadParameters<T>, DispatchError> {
        // TODO: TBD
        Ok(UploadParameters::<T> {
            bag_id: upload_context.bag_id.clone(),
            deletion_prize_source_account_id: upload_context.uploader_account.clone(),
            expected_data_size_fee: payload.expected_data_size_fee,
            object_creation_list: vec![payload.object_creation_params.clone()],
        })
    }

    pub(crate) fn upload_data_object(_params: &UploadParameters<T>) {
        // TODO: TBD
    }
}
