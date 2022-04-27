// Compiler demand.
#![recursion_limit = "256"]

use codec::FullCodec;
use core::default::Default;
use frame_support::{
    decl_module, decl_storage,
    dispatch::{fmt::Debug, marker::Copy, DispatchError, DispatchResult},
    ensure,
    traits::{Currency, ExistenceRequirement, Get, WithdrawReason},
};
use frame_system::ensure_signed;
use sp_arithmetic::traits::{AtLeast32BitUnsigned, One, Saturating, Zero};
use sp_runtime::{
    traits::{AccountIdConversion, Convert},
    ModuleId,
};
use sp_std::collections::btree_map::BTreeMap;
use sp_std::iter::Sum;

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

// aliases
pub type ReserveBalanceOf<T> =
    <<T as Trait>::ReserveCurrency as Currency<<T as frame_system::Trait>::AccountId>>::Balance;

type ValidatedTransfers<T> =
    Transfers<Validated<<T as frame_system::Trait>::AccountId>, <T as Trait>::Balance>;

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

    /// Existential Deposit for the JOY pallet
    type ReserveExistentialDeposit: Get<
        <Self::ReserveCurrency as Currency<Self::AccountId>>::Balance,
    >;

    /// Maximum number of vesting balances per account per token
    type MaxVestingBalancesPerAccountPerToken: Get<u8>;

    /// the Currency interface used as a reserve (i.e. JOY)
    type ReserveCurrency: Currency<Self::AccountId>;

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
        pub BloatBond get(fn bloat_bond) config(): ReserveBalanceOf<T>;
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
            let deposit = T::ReserveExistentialDeposit::get();

            let _ = T::ReserveCurrency::deposit_creating(&module_account_id, deposit);
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
        /// - `token_id` must exists
        /// - `src` must be valid for `token_id`, and must have enough JOYs to cover
        ///    the total bloat bond required in case of destinations not existing.
        ///    Also `src` must have enough token funds to cover all the transfer
        /// - `outputs` must designated  existing destination for "Permissioned" transfers.
        //
        /// Postconditions:
        /// - `src` free balance decreased by `amount`.
        ///    Also `src` JOY balance is decreased by the
        ///    total bloat bond deposited in case destination have been added to storage
        /// - `outputs.beneficiary` "free balance"" increased by `amount`
        #[weight = 10_000_000] // TODO: adjust weight
        pub fn transfer(
            origin,
            token_id: T::TokenId,
            outputs: TransfersOf<T>,
        ) -> DispatchResult {
            let src = ensure_signed(origin)?;

            // Currency transfer preconditions
            let validated_transfers = Self::ensure_can_transfer(token_id, &src, outputs)?;

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
        /// - `token_id` must be valid
        /// - `account_id` must be valid for `token_id`
        /// - `origin` signer must be either:
        ///    - `account_id` in that case the deletion succeedes even with non empty account
        ///    - different from `account_id` in that case deletion succeedes only
        ///      for `Permissionless` mode and empty account
        /// Postconditions:
        /// - Account information for `account_id` removed from storage
        /// - `token_id` supply decreased if necessary
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

            let now = Self::current_block();
            let unclaimed_patronage = token_info.unclaimed_patronage_at_block::<T::BlockNumberToBalance>(now);

            AccountInfoByTokenAndAccount::<T>::remove(token_id, &account_id);
            TokenInfoById::<T>::mutate(token_id, |token_info| {
                token_info.decrement_accounts_number();
                token_info.decrease_supply_by(account_to_remove_info.amount);

                if !unclaimed_patronage.is_zero() {
                    token_info.set_unclaimed_tally_patronage_at_block(unclaimed_patronage, now);
                }
            });

            let bloat_bond = account_to_remove_info.bloat_bond;
            let treasury = Self::bloat_bond_treasury_account_id();
            let _ = T::ReserveCurrency::transfer(&treasury, &account_id, bloat_bond, ExistenceRequirement::KeepAlive);

            Self::deposit_event(RawEvent::AccountDustedBy(token_id, account_id, sender, token_info.transfer_policy));

            Ok(())
        }

        /// Join whitelist for permissioned case: used to add accounts for token
        /// Preconditions:
        /// - 'token_id' must be valid
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
            let treasury = Self::bloat_bond_treasury_account_id();
            Self::ensure_can_transfer_reserve(&account_id, &treasury, bloat_bond)?;

            // == MUTATION SAFE ==

            let _ = T::ReserveCurrency::transfer(&account_id, &treasury, bloat_bond, ExistenceRequirement::KeepAlive);

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
        /// - `token_id` must be existing token's id
        /// - token identified by `token_id` must have OfferingState::Sale
        /// - `amount` cannot exceed number of tokens remaining on sale
        /// - sender's JOY balance must be >= `amount * sale.unit_price`
        /// - there are no tokens still reserved from the previous sale
        /// - `(total number of tokens already purchased by the member + `amount`) must not exceed
        ///   sale's purchase cap per member
        /// - if Permissioned token:
        ///   - AccountInfoByTokenAndAccount(token_id, &sender) must exist
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
            amount: <T as Trait>::Balance
        ) -> DispatchResult {
            let current_block = Self::current_block();
            let sender = ensure_signed(origin)?;
            let token_data = Self::ensure_token_exists(token_id)?;
            let sale = OfferingStateOf::<T>::ensure_sale_of::<T>(&token_data)?;
            let sale_id = token_data.sales_initialized;
            let buyer_joy_balance = balances::Module::<T>::usable_balance(&sender);
            let joy_amount = sale.unit_price.saturating_mul(amount.into());

            // Ensure buyer's JOY balance is sufficient for the purchase
            ensure!(
                buyer_joy_balance >= joy_amount,
                Error::<T>::InsufficientBalanceForTokenPurchase
            );

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
                Self::ensure_account_data_exists(token_id, &sender)?;
            }

            // Ensure vesting schedule can added if doesn't already exist
            // (MaxVestingSchedulesPerAccountPerToken not exceeded)
            let acc_data = AccountInfoByTokenAndAccount::<T>::get(token_id, &sender);
            let vesting_cleanup_key = acc_data.ensure_can_add_or_update_vesting_schedule::<T>(
                current_block,
                VestingSource::Sale(sale_id)
            )?;

            // == MUTATION SAFE ==

            <balances::Module::<T> as Currency<T::AccountId>>::transfer(
                &sender,
                &sale.tokens_source,
                joy_amount,
                ExistenceRequirement::AllowDeath
            )?;

            AccountInfoByTokenAndAccount::<T>::mutate(token_id, &sender, |acc_data| {
                acc_data.add_or_update_vesting_schedule(
                    VestingSource::Sale(sale_id),
                    sale.get_vesting_schedule(amount),
                    vesting_cleanup_key
                );
            });

            TokenInfoById::<T>::mutate(token_id, |t| {
                t.last_sale.as_mut().unwrap().quantity_left = sale.quantity_left.saturating_sub(amount);
            });

            Self::deposit_event(RawEvent::TokensPurchasedOnSale(token_id, sale_id, amount, sender));

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
        fn recover_unsold_tokens(origin, token_id: T::TokenId) -> DispatchResult {
            ensure_signed(origin)?;
            let token_info = Self::ensure_token_exists(token_id)?;
            OfferingStateOf::<T>::ensure_idle_of::<T>(&token_info)?;
            let amount_to_recover = token_info.last_sale_remaining_tokens();
            ensure!(
                !amount_to_recover.is_zero(),
                Error::<T>::NoTokensToRecover
            );

            // == MUTATION SAFE ==
            AccountInfoByTokenAndAccount::<T>::mutate(
                token_id,
                &token_info.last_sale.unwrap().tokens_source,
                |ad| {
                    ad.increase_amount_by(amount_to_recover);
                },
            );
            TokenInfoById::<T>::mutate(token_id, |token_info| {
                token_info.last_sale.as_mut().unwrap().quantity_left = <T as Trait>::Balance::zero();
            });

            Self::deposit_event(RawEvent::UnsoldTokensRecovered(token_id, token_info.sales_initialized, amount_to_recover));

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
    > for Module<T>
{
    type Balance = <T as Trait>::Balance;

    type TokenId = T::TokenId;

    type MerkleProof = MerkleProofOf<T>;

    type YearlyRate = YearlyRate;

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
    fn reduce_patronage_rate_by(token_id: T::TokenId, decrement: YearlyRate) -> DispatchResult {
        let token_info = Self::ensure_token_exists(token_id)?;
        let block_rate_decrement = BlockRate::from_yearly_rate(decrement, T::BlocksPerYear::get());

        // ensure new rate is >= 0
        ensure!(
            token_info.patronage_info.rate >= block_rate_decrement,
            Error::<T>::ReductionExceedingPatronageRate,
        );

        // == MUTATION SAFE ==

        let now = Self::current_block();
        let new_rate = token_info
            .patronage_info
            .rate
            .saturating_sub(block_rate_decrement);
        TokenInfoById::<T>::mutate(token_id, |token_info| {
            token_info.set_new_patronage_rate_at_block::<T::BlockNumberToBalance>(new_rate, now);
        });

        let new_yearly_rate = new_rate.to_yearly_rate(T::BlocksPerYear::get());
        Self::deposit_event(RawEvent::PatronageRateDecreasedTo(
            token_id,
            new_yearly_rate,
        ));

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
        let unclaimed_patronage =
            token_info.unclaimed_patronage_at_block::<T::BlockNumberToBalance>(now);

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
    /// - `token_id` must NOT exists
    /// - `symbol` specified in the parameters must NOT exists
    ///
    /// Postconditions:
    /// - token with specified characteristics is added to storage state
    /// - `NextTokenId` increased by 1
    /// - symbol is added to `Symbols`
    fn issue_token(issuance_parameters: TokenIssuanceParametersOf<T>) -> DispatchResult {
        let token_id = Self::next_token_id();
        Self::validate_issuance_parameters(&issuance_parameters)?;

        let token_data = TokenDataOf::<T>::from_params::<T>(issuance_parameters.clone());

        // == MUTATION SAFE ==
        SymbolsUsed::<T>::insert(&token_data.symbol, ());
        TokenInfoById::<T>::insert(token_id, token_data);
        NextTokenId::<T>::put(token_id.saturating_add(T::TokenId::one()));

        let account_data = AccountData {
            bloat_bond: BloatBond::<T>::get(),
            amount: issuance_parameters.initial_allocation.amount,
            vesting_schedules: if let Some(vsp) = issuance_parameters
                .initial_allocation
                .vesting_schedule
                .as_ref()
            {
                [(
                    VestingSource::InitialIssuance,
                    VestingScheduleOf::<T>::from_params(
                        Self::current_block(),
                        issuance_parameters.initial_allocation.amount,
                        vsp.clone(),
                    ),
                )]
                .iter()
                .cloned()
                .collect()
            } else {
                BTreeMap::new()
            },
            split_staking_status: None,
        };

        Self::do_insert_new_account_for_token(
            token_id,
            &issuance_parameters.initial_allocation.address,
            account_data,
        );

        Self::deposit_event(RawEvent::TokenIssued(token_id, issuance_parameters));

        Ok(())
    }

    fn init_token_sale(token_id: T::TokenId, sale_params: TokenSaleParamsOf<T>) -> DispatchResult {
        let token_data = Self::ensure_token_exists(token_id)?;
        let sale = TokenSaleOf::<T>::try_from_params::<T>(sale_params.clone())?;
        // Validation + first mutation(!)
        Self::try_init_sale(token_id, &token_data, &sale_params)?;
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
        transfers: TransfersOf<T>,
    ) -> Result<ValidatedTransfers<T>, DispatchError> {
        // ensure token validity
        let token_info = Self::ensure_token_exists(token_id)?;

        // ensure src account id validity
        let src_account_info = Self::ensure_account_data_exists(token_id, src)?;

        // validate destinations
        let validated_transfers =
            Self::validate_transfers(token_id, transfers, &token_info.transfer_policy)?;

        // compute bloat bond
        let cumulative_bloat_bond = Self::compute_bloat_bond(&validated_transfers);
        let treasury = Self::bloat_bond_treasury_account_id();
        Self::ensure_can_transfer_reserve(src, &treasury, cumulative_bloat_bond)?;

        src_account_info
            .ensure_can_transfer::<T>(Self::current_block(), validated_transfers.total_amount())?;

        Ok(validated_transfers)
    }

    /// Perform balance accounting for balances
    pub(crate) fn do_transfer(
        token_id: T::TokenId,
        src: &T::AccountId,
        validated_transfers: &ValidatedTransfers<T>,
    ) {
        validated_transfers.iter().for_each(
            |(validated_account, payment)| match validated_account {
                Validated::<_>::Existing(account_id) => AccountInfoByTokenAndAccount::<T>::mutate(
                    token_id,
                    &account_id,
                    |account_data| {
                        account_data.increase_amount_by(payment.amount);
                    },
                ),
                Validated::<_>::NonExisting(account_id) => {
                    Self::do_insert_new_account_for_token(
                        token_id,
                        &account_id,
                        AccountDataOf::<T>::new_with_amount_and_bond(
                            payment.amount,
                            Self::bloat_bond(),
                        ),
                    );
                }
            },
        );

        let cumulative_bloat_bond = Self::compute_bloat_bond(validated_transfers);
        if !cumulative_bloat_bond.is_zero() {
            let treasury_account_id = Self::bloat_bond_treasury_account_id();
            let _ = T::ReserveCurrency::transfer(
                src,
                &treasury_account_id,
                cumulative_bloat_bond,
                ExistenceRequirement::KeepAlive,
            );
        }

        AccountInfoByTokenAndAccount::<T>::mutate(token_id, &src, |account_data| {
            account_data.decrease_amount_by(validated_transfers.total_amount());
        });
    }

    pub(crate) fn current_block() -> T::BlockNumber {
        <frame_system::Module<T>>::block_number()
    }

    pub(crate) fn try_init_sale(
        token_id: T::TokenId,
        token_data: &TokenDataOf<T>,
        sale_params: &TokenSaleParamsOf<T>,
    ) -> DispatchResult {
        let current_block = Self::current_block();

        // Ensure token offering state is Idle
        OfferingStateOf::<T>::ensure_idle_of::<T>(token_data)?;

        // Ensure no unrecovered tokens remaining from the previous sale
        ensure!(
            token_data.last_sale_remaining_tokens().is_zero(),
            Error::<T>::RemainingUnrecoveredTokensFromPreviousSale
        );

        // Ensure sale upper_bound_quantity can be reserved from `source`
        let account_data = Self::ensure_account_data_exists(token_id, &sale_params.tokens_source)?;

        // Ensure source account has enough transferrable tokens
        account_data.ensure_can_transfer::<T>(current_block, sale_params.upper_bound_quantity)?;

        // == MUTATION SAFE ==

        // Decrease source account's tokens number by sale_params.upper_bound_quantity
        // (unsold tokens can be later recovered with `recover_unsold_tokens`)
        AccountInfoByTokenAndAccount::<T>::mutate(token_id, &sale_params.tokens_source, |ad| {
            ad.decrease_amount_by(sale_params.upper_bound_quantity);
        });

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
        token_id: T::TokenId,
        dst: T::AccountId,
        transfer_policy: &TransferPolicyOf<T>,
    ) -> Result<Validated<T::AccountId>, DispatchError> {
        match (
            transfer_policy,
            Self::ensure_account_data_exists(token_id, &dst),
        ) {
            (&TransferPolicyOf::<T>::Permissionless, Err(_)) => {
                Ok(Validated::<_>::NonExisting(dst))
            }
            (&TransferPolicyOf::<T>::Permissionless, Ok(_)) => Ok(Validated::<_>::Existing(dst)),
            (&TransferPolicyOf::<T>::Permissioned(_), Ok(_)) => Ok(Validated::<_>::Existing(dst)),
            (&TransferPolicyOf::<T>::Permissioned(_), Err(e)) => Err(e),
        }
    }

    pub(crate) fn compute_bloat_bond(
        validated_transfers: &ValidatedTransfers<T>,
    ) -> ReserveBalanceOf<T> {
        let bloat_bond = Self::bloat_bond();
        validated_transfers
            .iter()
            .fold(ReserveBalanceOf::<T>::zero(), |acc, (account, _)| {
                if matches!(account, Validated::<_>::NonExisting(_)) {
                    acc.saturating_add(bloat_bond)
                } else {
                    ReserveBalanceOf::<T>::zero()
                }
            })
    }

    pub(crate) fn validate_transfers(
        token_id: T::TokenId,
        transfers: TransfersOf<T>,
        transfer_policy: &TransferPolicyOf<T>,
    ) -> Result<ValidatedTransfers<T>, DispatchError> {
        let result = transfers
            .into_iter()
            .map(|(dst, payment)| {
                Self::validate_destination(token_id, dst, transfer_policy).map(|res| (res, payment))
            })
            .collect::<Result<BTreeMap<_, _>, _>>()?;

        Ok(Transfers::<_, _>(result))
    }

    pub(crate) fn ensure_can_transfer_reserve(
        src: &T::AccountId,
        dst: &T::AccountId,
        amount: ReserveBalanceOf<T>,
    ) -> DispatchResult {
        if !amount.is_zero() {
            let src_free = T::ReserveCurrency::free_balance(src);
            let dst_free = T::ReserveCurrency::free_balance(dst);

            ensure!(
                src_free >= amount.saturating_add(T::ReserveExistentialDeposit::get()),
                Error::<T>::InsufficientBalanceForBloatBond,
            );

            ensure!(
                dst_free.saturating_add(amount) >= T::ReserveExistentialDeposit::get(),
                Error::<T>::InsufficientBalanceForBloatBond,
            );

            T::ReserveCurrency::ensure_can_withdraw(
                src,
                amount,
                WithdrawReason::Transfer.into(),
                src_free.saturating_sub(amount),
            )?;
        }
        Ok(())
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
}
