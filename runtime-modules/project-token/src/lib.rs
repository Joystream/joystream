// Compiler demand.
#![recursion_limit = "256"]
// Ensure we're `no_std` when compiling for Wasm.
#![cfg_attr(not(feature = "std"), no_std)]
#![cfg_attr(
    not(any(test, feature = "runtime-benchmarks")),
    deny(clippy::panic),
    deny(clippy::panic_in_result_fn),
    deny(clippy::unwrap_used),
    deny(clippy::expect_used),
    deny(clippy::indexing_slicing),
    deny(clippy::integer_arithmetic),
    deny(clippy::match_on_vec_items),
    deny(clippy::unreachable)
)]

#[cfg(not(any(test, feature = "runtime-benchmarks")))]
#[allow(unused_imports)]
#[macro_use]
extern crate common;

use codec::{FullCodec, MaxEncodedLen};
use common::{
    membership::{MemberId as MemberIdOf, MemberOriginValidator, MembershipInfoProvider},
    to_kb,
};
use core::default::Default;
use frame_support::{
    decl_module, decl_storage,
    dispatch::{fmt::Debug, marker::Copy, DispatchError, DispatchResult},
    ensure,
    traits::{Currency, ExistenceRequirement, Get},
    PalletId,
};
use frame_system::{ensure_root, ensure_signed};
use pallet_timestamp::{self as timestamp};
use scale_info::TypeInfo;
use sp_arithmetic::traits::{AtLeast32BitUnsigned, One, Saturating, Zero};
use sp_runtime::{
    traits::{AccountIdConversion, CheckedAdd, CheckedMul, CheckedSub, UniqueSaturatedInto},
    FixedPointOperand, PerThing, Permill,
};
use sp_std::collections::btree_map::BTreeMap;
use sp_std::convert::TryInto;
use sp_std::iter::Sum;
use sp_std::ops::Div;
use sp_std::vec;
use sp_std::vec::Vec;
use storage::UploadParameters;

// crate modules
mod benchmarking;
mod errors;
mod events;
mod tests;
pub mod traits;
pub mod types;
mod utils;

// crate imports
use common::bloat_bond::{RepayableBloatBond, RepayableBloatBondOf};
use common::costs::{
    burn_from_usable, has_sufficient_balance_for_fees, has_sufficient_balance_for_payment, pay_fee,
};
pub use errors::Error;
pub use events::{Event, RawEvent};
use traits::PalletToken;
use types::*;

pub mod weights;
pub use weights::WeightInfo;

type WeightInfoToken<T> = <T as Config>::WeightInfo;

/// Pallet Configuration
pub trait Config:
    frame_system::Config + balances::Config + storage::Config + membership::Config + timestamp::Config
{
    /// Events
    type Event: From<Event<Self>> + Into<<Self as frame_system::Config>::Event>;

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
        + Into<JoyBalanceOf<Self>>
        + TypeInfo
        + FixedPointOperand
        + MaxEncodedLen;

    /// The token identifier used
    type TokenId: AtLeast32BitUnsigned
        + FullCodec
        + Copy
        + Default
        + Debug
        + TypeInfo
        + MaxEncodedLen;

    /// The storage type used
    type DataObjectStorage: storage::DataObjectStorage<Self>;

    /// Tresury account for the various tokens
    type ModuleId: Get<PalletId>;

    /// Existential Deposit for the JOY pallet
    type JoyExistentialDeposit: Get<JoyBalanceOf<Self>>;

    /// Maximum number of vesting balances per account per token
    type MaxVestingSchedulesPerAccountPerToken: Get<u32>;

    /// Weight information for extrinsics in this pallet.
    type WeightInfo: WeightInfo;

    /// Number of blocks produced in a year
    type BlocksPerYear: Get<u32>;

    /// Member origin validator
    type MemberOriginValidator: MemberOriginValidator<
        Self::Origin,
        MemberIdOf<Self>,
        Self::AccountId,
    >;

    /// Membership info provider
    type MembershipInfoProvider: MembershipInfoProvider<Self>;

    /// Max outputs number for a transfer
    type MaxOutputs: Get<u32>;
}

decl_storage! { generate_storage_info
    trait Store for Module<T: Config> as Token {
        /// Double map TokenId x MemberId => AccountData for managing account data
        pub AccountInfoByTokenAndMember get(fn account_info_by_token_and_member):
        double_map
            hasher(blake2_128_concat) T::TokenId,
            hasher(blake2_128_concat) T::MemberId => AccountDataOf<T>;

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

        /// Minimum revenue split duration constraint
        pub MinRevenueSplitDuration get(fn min_revenue_split_duration) config(): T::BlockNumber;

        /// Minimum revenue split time to start constraint
        pub MinRevenueSplitTimeToStart get(fn min_revenue_split_time_to_start) config(): T::BlockNumber;

        /// Platform fee (percentage) charged on top of each sale purchase (in JOY) and burned
        pub SalePlatformFee get(fn sale_platform_fee) config(): Permill;

        /// Percentage threshold for deactivating the amm functionality
        pub AmmDeactivationThreshold get(fn amm_deactivation_threshold) config(): Permill;

        /// AMM buy transaction fee percentage
        pub AmmBuyTxFees get(fn amm_buy_tx_fees) config(): Permill;

        /// AMM sell transaction fee percentage
        pub AmmSellTxFees get(fn amm_sell_tx_fees) config(): Permill;

        /// Max patronage rate allowed
        pub MaxYearlyPatronageRate get(fn max_yearly_patronage_rate) config(): YearlyRate = YearlyRate(Permill::from_percent(15));

        /// Minimum slope parameters allowed for AMM curve
        pub MinAmmSlopeParameter get(fn min_amm_slope_parameter) config(): TokenBalanceOf<T>;
    }

    add_extra_genesis {
        config(account_info_by_token_and_member): Vec<(T::TokenId, T::MemberId, ConfigAccountDataOf<T>)>;

        build(|s| {
            // Initialize accounts
            for (token_id, member_id, config_account_data) in s.account_info_by_token_and_member.iter() {
                let opt_acc_data: Option<AccountDataOf<T>> = config_account_data.clone().try_into().ok();
                if let Some(account_data) = opt_acc_data {
                    AccountInfoByTokenAndMember::<T>::insert(token_id, member_id, account_data);
                }
            }

            // We deposit some initial balance to the pallet's module account
            // on the genesis block to protect the account
            // from being deleted ("dusted") on early stages of pallet's work
            // by the "garbage collector" of the balances pallet.
            // It should be equal to at least `ExistentialDeposit` from the balances pallet
            // setting.
            // Original issues:
            // - https://github.com/Joystream/joystream/issues/3497
            // - https://github.com/Joystream/joystream/issues/3510

            let module_account_id = Module::<T>::module_treasury_account();
            let deposit = T::JoyExistentialDeposit::get();

            let _ = Joy::<T>::deposit_creating(&module_account_id, deposit);
        });
    }
}

decl_module! {
    pub struct Module<T: Config> for enum Call
    where
        origin: T::Origin
    {

        /// Default deposit_event() handler
        fn deposit_event() = default;

        /// Predefined errors.
        type Error = Error<T>;

        /// Allow to transfer from `src_member_id` account to the various `outputs` beneficiaries
        /// in the specified amounts.
        ///
        /// Preconditions:
        /// - origin signer must be `src_member_id` controller account
        /// - token by `token_id` must exists
        /// - account of `src_member_id` must exist for `token_id`
        /// - sender must have enough JOYs to cover the total bloat bond required in case of
        ///   destination(s) not existing.
        /// - source account must have enough token funds to cover all the transfer(s)
        /// - `outputs` must designate existing destination(s) for "Permissioned" transfers.
        //
        /// Postconditions:
        /// - source account's tokens amount is decreased by `amount`.
        /// - total bloat bond transferred from sender's JOY balance into the treasury account
        ///   in case destination(s) have been added to storage
        /// - `outputs.beneficiary` tokens amount increased by `amount`
        ///
        /// <weight>
        ///
        /// ## Weight
        /// `O (T + M)` where:
        /// - `T` is the length of `outputs`
        /// - `M` is the size of `metadata` in kilobytes
        /// - DB:
        ///   - `O(T)` - from the the generated weights
        /// # </weight>
        #[weight = WeightInfoToken::<T>::transfer(outputs.len() as u32, to_kb(metadata.len() as u32))]
        pub fn transfer(
            origin,
            src_member_id: T::MemberId,
            token_id: T::TokenId,
            outputs: TransferOutputsOf<T>,
            metadata: Vec<u8>
        ) -> DispatchResult {

            // // security check
            // ensure!(
            //     outputs.len() <= T::MaxOutputs::get() as usize,
            //     Error::<T>::TooManyTransferOutputs,
            // );

            let sender = T::MemberOriginValidator::ensure_member_controller_account_origin(
                origin,
                src_member_id
            )?;

            // Currency transfer preconditions
            // let btree_outputs = Transfers(outputs.into_iter().map(|(member_id, amount)| (member_id, PaymentWithVesting::from(amount))).collect::<BTreeMap<_,_>>());
            let validated_transfers = Self::ensure_can_transfer(token_id, &sender, &src_member_id, outputs.into(), false)?;

            // == MUTATION SAFE ==

            Self::do_transfer(token_id, &sender, &src_member_id, &validated_transfers)?;

            Self::deposit_event(RawEvent::TokenAmountTransferred(
                token_id,
                src_member_id,
                validated_transfers,
                metadata
            ));
            Ok(())
        }

        /// Burn tokens from specified account
        ///
        /// Preconditions:
        /// - `amount` is > 0
        /// - origin signer is a controller account of `member_id` member
        /// - token by `token_id` exists
        /// - an account exists for `token_id` x `member_id`
        /// - account's tokens amount is >= `amount`
        /// - token supply can be modified (there is no active revenue split)
        ///
        /// Postconditions:
        /// - starting with `unprocessed` beeing equal to `amount`, account's vesting schedules
        ///   are iterated over and:
        ///   - updated with `burned_amount += uprocessed` if vesting schedule's unvested amount is
        ///     greater than `uprocessed`
        ///   - removed otherwise
        ///   (after each iteration `unprocessed` is reduced by the amount of unvested tokens
        ///   burned during that iteration)
        /// - if the account has any `split_staking_status`, the `split_staking_status.amount`
        ///   is reduced by `min(amount, split_staking_status.amount)`
        /// - `account.amount` is reduced by `amount`
        /// - token supply is reduced by `amount`
        ///
        /// <weight>
        ///
        /// ## Weight
        /// `O (1)`
        /// - DB:
        ///   - `O(1)` - doesn't depend on the state or parameters
        /// # </weight>
        #[weight = WeightInfoToken::<T>::burn()]
        pub fn burn(origin, token_id: T::TokenId, member_id: T::MemberId, amount: TokenBalanceOf<T>) -> DispatchResult {
            // Ensure burn amount is non-zero
            ensure!(
                !amount.is_zero(),
                Error::<T>::BurnAmountIsZero
            );

            // Ensure sender is member's controller account
            T::MemberOriginValidator::ensure_member_controller_account_origin(
                origin,
                member_id
            )?;

            // Ensure token exists
            let token_info = Self::ensure_token_exists(token_id)?;

            // Ensure token account data exists by `token_id` x `member_id`
            let account_info = Self::ensure_account_data_exists(token_id, &member_id)?;

            // Ensure burn amount doesn't exceed account's tokens amount
            ensure!(
                account_info.amount >= amount,
                Error::<T>::BurnAmountGreaterThanAccountTokensAmount
            );

            // Ensure token supply can be modified
            token_info.ensure_can_modify_supply::<T>()?;

            // == MUTATION SAFE ==
            let now = Self::current_block();

            // Burn tokens from the account
            AccountInfoByTokenAndMember::<T>::try_mutate(token_id, member_id, |account| {
                account.burn::<T>(amount, now)?;
                DispatchResult::Ok(())
            })?;

            // Decrease token supply by the burned amount
            TokenInfoById::<T>::mutate(token_id, |token| {
                token.decrease_supply_by(amount);
            });

            Self::deposit_event(RawEvent::TokensBurned(token_id, member_id, amount));

            Ok(())
        }

        /// Allow any user to remove an account
        ///
        /// Preconditions:
        /// - token by `token_id` must exist
        /// - an account must exist for `token_id` x `member_id`
        /// - if Permissioned token: `origin` signer must be `member_id` member's
        ///   controller account
        /// - `token_id` x `member_id` account must be an empty account
        ///   (`account_data.amount` == 0)
        /// Postconditions:
        /// - Account information for `token_id` x `member_id` removed from storage
        /// - bloat bond refunded to `member_id` controller account
        ///   (or `bloat_bond.repayment_restricted_to` account)
        ///
        /// <weight>
        ///
        /// `O (1)`
        /// - DB:
        ///   - `O(1)` - doesn't depend on the state or parameters
        /// # </weight>
        #[weight = WeightInfoToken::<T>::dust_account()]
        pub fn dust_account(origin, token_id: T::TokenId, member_id: T::MemberId) -> DispatchResult {
            let sender = ensure_signed(origin)?;
            let token_info = Self::ensure_token_exists(token_id)?;
            let account_to_remove_info = Self::ensure_account_data_exists(token_id, &member_id)?;
            let member_controller = T::MembershipInfoProvider::controller_account_id(member_id)?;
            let treasury = Self::module_treasury_account();

            Self::ensure_user_can_dust_account(
                &token_info.transfer_policy,
                &sender,
                &member_controller,
                &account_to_remove_info,
            )?;

            // == MUTATION SAFE ==
            AccountInfoByTokenAndMember::<T>::remove(token_id, &member_id);

            TokenInfoById::<T>::mutate(token_id, |token_info| {
                token_info.decrement_accounts_number();
            });


            account_to_remove_info.bloat_bond.repay::<T>(&treasury, &member_controller, false)?;

            Self::deposit_event(RawEvent::AccountDustedBy(token_id, member_id, sender, token_info.transfer_policy));

            Ok(())
        }

        /// Join whitelist for permissioned case: used to add accounts for token
        /// Preconditions:
        /// - 'token_id' must be valid
        /// - `origin` signer must be a controller account of `member_id`
        /// - account for `member_id` must not already exist
        /// - transfer policy is `Permissioned` and merkle proof must be valid
        ///
        /// Postconditions:
        /// - account for `member_id` created and added to pallet storage
        /// - `bloat_bond` transferred from sender to treasury account
        ///
        /// <weight>
        ///
        /// ## Weight
        /// `O (H)` where:
        /// - `H` is the length of `proof.0`
        /// - DB:
        ///   - `O(1)` - doesn't depend on the state or parameters
        /// # </weight>
        #[weight = WeightInfoToken::<T>::join_whitelist(
            proof.0.len() as u32
        )]
        pub fn join_whitelist(origin, member_id: T::MemberId, token_id: T::TokenId, proof: MerkleProofOf<T>) -> DispatchResult {
            let sender = T::MemberOriginValidator::ensure_member_controller_account_origin(
                origin,
                member_id
            )?;
            let token_info = Self::ensure_token_exists(token_id)?;

            ensure!(
                !AccountInfoByTokenAndMember::<T>::contains_key(token_id, &member_id),
                Error::<T>::AccountAlreadyExists,
            );

            if let TransferPolicyOf::<T>::Permissioned(commit) = token_info.transfer_policy {
                proof.verify::<T,_>(&member_id, commit)
            } else {
                Err(Error::<T>::CannotJoinWhitelistInPermissionlessMode.into())
            }?;

            let bloat_bond = Self::bloat_bond();

            // Ensure sender can cover the bloat bond
            ensure!(
                has_sufficient_balance_for_fees::<T>(&sender, bloat_bond),
                Error::<T>::InsufficientJoyBalance
            );

            // == MUTATION SAFE ==

            let repayable_bloat_bond = Self::pay_bloat_bond(&sender)?;

            Self::do_insert_new_account_for_token(
                token_id,
                &member_id,
                AccountDataOf::<T>::new_with_amount_and_bond(
                    <T as Config>::Balance::zero(),
                    repayable_bloat_bond,
                ));

            Self::deposit_event(RawEvent::MemberJoinedWhitelist(token_id, member_id, token_info.transfer_policy));

            Ok(())
        }

        /// Purchase tokens on active token sale.
        ///
        /// Preconditions:
        /// - token by `token_id` must exist
        /// - token by `token_id` must be in OfferingState::Sale
        /// - `amount` cannot exceed number of tokens remaining on sale
        /// - `origin` signer must be controller account of `member_id` member
        /// - sender's available JOY balance must be:
        ///   - >= `joy_existential_deposit + amount * sale.unit_price`
        ///     if AccountData already exist
        ///   - >= `joy_existential_deposit + amount * sale.unit_price + bloat_bond`
        ///     if AccountData does not exist
        /// - let `fee_amount` be `sale_platform_fee.mul_floor(amount * sale.unit_price)`
        /// - if `sale.earnings_destination.is_some()` and `sale.earnings_destination` account has
        ///   zero balance:
        ///   - the amount to be transferred from `sender` to `sale.earnings_destination`,
        ///     which is equal to `amount * sale.unit_price - fee_amount`, must be greater than
        ///     `joy_existential_deposit`
        /// - total number of tokens already purchased by the member on the current sale
        ///   PLUS `amount` must not exceed sale's purchase cap per member
        /// - if Permissioned token:
        ///   - AccountInfoByTokenAndMember(token_id, &member_id) must exist
        /// - if `sale.vesting_schedule.is_some()`:
        ///   - number of sender account's ongoing vesting schedules
        ///     must be < MaxVestingSchedulesPerAccountPerToken
        ///
        /// Postconditions:
        /// - if `sale.earnings_destination.is_some()`:
        ///   - `amount * sale.unit_price - fee_amount` JOY tokens are transfered from `sender`
        ///     to `sale.earnings_destination`
        ///   - `fee_amount` JOY is slashed from `sender` balance
        /// - if `sale.earnings_destination.is_none()`:
        ///   - `amount * sale.unit_price` JOY is slashed from `sender` balance
        /// - if new token account created: `bloat_bond` transferred from `sender` to treasury
        /// - if `sale.vesting_schedule.is_some()`:
        ///   - if buyer has no `vesting_schedule` related to the current sale:
        ///     - a new vesting schedule (`sale.get_vesting_schedule(purchase_amount)`) is added to
        ///       buyer's `vesing_schedules`
        ///     - some finished vesting schedule is removed from buyer's account_data in case the
        ///       number of buyer's vesting_schedules was == MaxVestingSchedulesPerAccountPerToken
        ///   - if buyer already has a `vesting_schedule` related to the current sale:
        ///     - current vesting schedule's `cliff_amount` is increased by
        ///       `sale.get_vesting_schedule(purchase_amount).cliff_amount`
        ///     - current vesting schedule's `post_cliff_total_amount` is increased by
        ///       `sale.get_vesting_schedule(purchase_amount).post_cliff_total_amount`
        /// - if `sale.vesting_schedule.is_none()`:
        ///   - buyer's account token amount increased by `amount`
        /// - if `token_data.sale.quantity_left - amount == 0` and `sale.auto_finalize` is `true`
        ///   `token_data.sale` is set to None, otherwise `token_data.sale.quantity_left` is
        ///   decreased by `amount` and `token_data.sale.funds_collected` in increased by
        ///   `amount * sale.unit_price`
        ///
        /// <weight>
        ///
        /// ## Weight
        /// `O (1)`
        /// - DB:
        ///   - `O(1)` - doesn't depend on the state or parameters
        /// # </weight>
        #[weight = WeightInfoToken::<T>::purchase_tokens_on_sale()]
        pub fn purchase_tokens_on_sale(
            origin,
            token_id: T::TokenId,
            member_id: T::MemberId,
            amount: TokenBalanceOf<T>,
        ) -> DispatchResult {
            // Ensure non-zero amount
            ensure!(!amount.is_zero(), Error::<T>::SalePurchaseAmountIsZero);

            let sender = T::MemberOriginValidator::ensure_member_controller_account_origin(
                origin,
                member_id
            )?;
            let current_block = Self::current_block();
            let token_data = Self::ensure_token_exists(token_id)?;
            let sale = OfferingStateOf::<T>::ensure_sale_of::<T>(&token_data)?;
            let sale_id = token_data.next_sale_id
                .checked_sub(1)
                .ok_or(Error::<T>::ArithmeticError)?;
            let platform_fee = Self::sale_platform_fee();
            let joy_amount = sale.unit_price.saturating_mul(amount.into());
            let burn_amount = if sale.earnings_destination.is_some() {
                platform_fee.mul_floor(joy_amount)
            } else {
                joy_amount
            };
            let transfer_amount = joy_amount.saturating_sub(burn_amount);
            let account_data = Self::ensure_account_data_exists(token_id, &member_id).ok();
            let bloat_bond = Self::bloat_bond();
            let vesting_schedule = sale.get_vesting_schedule(amount);
            let treasury = Self::module_treasury_account();

            // Ensure buyer can cover the total cost of the transaction
            let total_cost = match account_data.as_ref() {
                Some(_) => joy_amount,
                None => joy_amount.saturating_add(bloat_bond)
            };

            ensure!(
                has_sufficient_balance_for_payment::<T>(&sender, total_cost),
                Error::<T>::InsufficientJoyBalance
            );

            // Ensure enough tokens are available on sale
            ensure!(
                sale.quantity_left >= amount,
                Error::<T>::NotEnoughTokensOnSale
            );

            // Ensure participant's cap is not exceeded
            if let Some(cap) = sale.cap_per_member {
                Self::ensure_purchase_cap_not_exceeded(
                    sale_id,
                    &account_data,
                    amount,
                    cap
                )?;
            }

            // Ensure account exists if Permissioned token
            if let TransferPolicy::Permissioned(_) = token_data.transfer_policy {
                ensure!(account_data.is_some(), Error::<T>::AccountInformationDoesNotExist);
            }

            let vesting_cleanup_key = if vesting_schedule.is_some() {
                    // Ensure vesting schedule can added if doesn't already exist
                    // (MaxVestingSchedulesPerAccountPerToken not exceeded)
                    let acc_data = AccountInfoByTokenAndMember::<T>::get(token_id, &member_id);
                    acc_data.ensure_can_add_or_update_vesting_schedule::<T>(
                        current_block,
                        VestingSource::Sale(sale_id)
                    )
                } else {
                    Ok(None)
                }?;

            // == MUTATION SAFE ==

            if let Some(dst) = sale.earnings_destination.as_ref() {
                Self::transfer_joy(&sender, dst, transfer_amount)?;
            }

            if !burn_amount.is_zero() {
                burn_from_usable::<T>(&sender, burn_amount)?;
            }

            if account_data.is_some() {
                AccountInfoByTokenAndMember::<T>::try_mutate(token_id, &member_id, |acc_data| {
                    acc_data.process_sale_purchase::<T>(
                        sale_id,
                        amount,
                        vesting_schedule,
                        vesting_cleanup_key
                    )?;
                    DispatchResult::Ok(())
                })?;
            } else {
                Self::transfer_joy(&sender, &treasury, bloat_bond)?;
                let mut account = AccountDataOf::<T>::new_with_amount_and_bond(
                        TokenBalanceOf::<T>::zero(),
                        // No restrictions on repayable bloat bond,
                        // since only usable balance is allowed
                        RepayableBloatBond::new(bloat_bond, None)
                    );
                account.process_sale_purchase::<T>(
                        sale_id,
                        amount,
                        vesting_schedule,
                        vesting_cleanup_key
                    )?;
                Self::do_insert_new_account_for_token(
                    token_id,
                    &member_id,
                    account
                );
            }

            let updated_sale_quantity = sale.quantity_left.saturating_sub(amount);
            TokenInfoById::<T>::mutate(token_id, |t| {
                if updated_sale_quantity.is_zero() && sale.auto_finalize {
                    t.sale = None;
                } else if let Some(s) = t.sale.as_mut() {
                    s.quantity_left = updated_sale_quantity;
                    s.funds_collected = s.funds_collected.saturating_add(joy_amount);
                }
            });

            Self::deposit_event(RawEvent::TokensPurchasedOnSale(token_id, sale_id, amount, member_id));

            Ok(())
        }

        /// Participate in the *latest* token revenue split (if ongoing)
        /// Preconditions:
        /// - `token` must exist for `token_id`
        /// - `origin` signer must be `member_id` member controller account
        /// - `amount` must be > 0
        /// - `account` must exist  for `(token_id, member_id)`
        /// - `token.split_status` must be active AND THEN current_block in
        ///    [split.start, split.start + split_duration)
        /// - `account.staking_status.is_none()` OR `account.staking_status.split_id` refers to a past split
        /// - `account.amount` >= `amount`
        /// - let `dividend = split_allocation * account.staked_amount / token.supply``
        ///    then `treasury` must be able to transfer `dividend` amount of JOY.
        ///    (This condition technically, should always be satisfied)
        ///
        /// Postconditions
        /// - `dividend` amount of JOYs transferred from `treasury_account` to `sender`
        /// - `token` revenue split dividends payed tracking variable increased by `dividend`
        /// - `account.staking_status` set to Some(..) with `amount` and `token.latest_split`
        ///
        /// <weight>
        ///
        /// ## Weight
        /// `O (1)`
        /// - DB:
        ///   - `O(1)` - doesn't depend on the state or parameters
        /// # </weight>
        #[weight = WeightInfoToken::<T>::participate_in_split()]
        pub fn participate_in_split(
            origin,
            token_id: T::TokenId,
            member_id: T::MemberId,
            amount: TokenBalanceOf<T>,
        ) -> DispatchResult {
            let sender = T::MemberOriginValidator::ensure_member_controller_account_origin(
                origin,
                member_id
            )?;

            ensure!(
                !amount.is_zero(),
                Error::<T>::CannotParticipateInSplitWithZeroAmount,
            );

            let token_info = Self::ensure_token_exists(token_id)?;
            let split_info = token_info.revenue_split.ensure_active::<T>()?;
            let split_id = token_info.next_revenue_split_id
                .checked_sub(1)
                .ok_or(Error::<T>::ArithmeticError)?;

            let current_block = Self::current_block();
            ensure!(
                split_info.timeline.is_ongoing(current_block),
                Error::<T>::RevenueSplitNotOngoing
            );

            let account_info = Self::ensure_account_data_exists(token_id, &member_id)?;

            account_info.ensure_can_stake::<T>(amount, token_info.next_revenue_split_id)?;

            // it should not really be possible to have supply == 0 with staked amount > 0
            debug_assert!(!token_info.total_supply.is_zero());
            let dividend_amount = Self::compute_revenue_split_dividend(
                amount,
                token_info.total_supply,
                split_info.allocation,
            );

            // ensure JOY can be transferred from `treasury_account` and it doesn't cause
            // KeepAlive error
            let treasury_account: T::AccountId = Self::module_treasury_account();
            Self::ensure_can_transfer_joy(&treasury_account, dividend_amount)?;

            // == MUTATION SAFE ==

            Self::transfer_joy(
                &treasury_account,
                &sender,
                dividend_amount
            )?;

            TokenInfoById::<T>::mutate(token_id, |token_info| {
                token_info.revenue_split.account_for_dividend(dividend_amount);
            });

            AccountInfoByTokenAndMember::<T>::mutate(token_id, &member_id, |account_info| {
                account_info.stake(split_id, amount);
            });

            Self::deposit_event(RawEvent::UserParticipatedInSplit(
                token_id,
                member_id,
                amount,
                dividend_amount,
                split_id,
            ));

            Ok(())
        }

        /// Split-participating user leaves revenue split
        /// Preconditions
        /// - `token` must exist for `token_id`
        /// - `origin` signer must be `member_id` member controller account
        /// - `account` must exist for `(token_id, member_id)`
        /// - `account.staking status.is_some()'
        /// - if `(account.staking_status.split_id == token.next_revenue_split_id - 1`
        ///    AND `token.revenue_split` is active) THEN split staking period  must be ended
        ///
        /// Postconditions
        /// - `account.staking_status` set to None
        ///
        /// <weight>
        ///
        /// ## Weight
        /// `O (1)`
        /// - DB:
        ///   - `O(1)` - doesn't depend on the state or parameters
        /// # </weight>
        #[weight = WeightInfoToken::<T>::exit_revenue_split()]
        pub fn exit_revenue_split(origin, token_id: T::TokenId, member_id: T::MemberId) -> DispatchResult {
            T::MemberOriginValidator::ensure_member_controller_account_origin(
                origin,
                member_id
            )?;

            let token_info = Self::ensure_token_exists(token_id)?;

            let account_info = Self::ensure_account_data_exists(token_id, &member_id)?;
            let staking_info = account_info.ensure_account_is_valid_split_participant::<T>()?;
            let current_split_id = token_info.next_revenue_split_id
                .checked_sub(1)
                .ok_or(Error::<T>::ArithmeticError)?;

            // staking_info.split_id in [0,token_info.next_revenue_split_id) is a runtime invariant
            if staking_info.split_id == current_split_id {
                if let Ok(split_info) = token_info.revenue_split.ensure_active::<T>() {
                    ensure!(
                        split_info.timeline.is_ended(Self::current_block()),
                        Error::<T>::RevenueSplitDidNotEnd,
                    );
                }
            }

            // == MUTATION SAFE ==

            AccountInfoByTokenAndMember::<T>::mutate(token_id, &member_id, |account_info| {
                account_info.unstake();
            });

            Self::deposit_event(RawEvent::RevenueSplitLeft(token_id, member_id, staking_info.amount));
            Ok(())
        }

        /// Mint desired `token_id` amount into user account via JOY exchnage
        /// Preconditions
        /// - origin, member_id pair must be a valid authentication pair
        /// - token_id must exist
        /// - user usable JOY balance must be enough for buying (+ existential deposit)
        /// - slippage tolerance constraints respected if provided
        /// - token total supply and amount value must be s.t. `eval` function doesn't overflow
        ///
        /// Postconditions
        /// - `amount` CRT minted into account (which is created if necessary with existential deposit transferred to it)
        /// - respective JOY amount transferred from user balance to amm treasury account
        /// - event deposited
        #[weight = WeightInfoToken::<T>::buy_on_amm_with_existing_account()]
        fn buy_on_amm(origin, token_id: T::TokenId, member_id: T::MemberId, amount: <T as Config>::Balance, slippage_tolerance: Option<(Permill, JoyBalanceOf<T>)>) -> DispatchResult {
            if amount.is_zero() {
                return Ok(()); // noop
            }

            let sender = ensure_signed(origin.clone())?;

            T::MemberOriginValidator::ensure_member_controller_account_origin(
                origin,
                member_id
            )?;

            let token_data = Self::ensure_token_exists(token_id)?;
            let curve = token_data.amm_curve.ok_or(Error::<T>::NotInAmmState)?;

            let user_account_data_exists = AccountInfoByTokenAndMember::<T>::contains_key(token_id, &member_id);
            let amm_treasury_account = Self::amm_treasury_account(token_id);
            let price = Self::eval(&curve, amount, curve.provided_supply, AmmOperation::Buy)?;
            let bloat_bond = Self::bloat_bond();
            let buy_price = Self::amm_buy_tx_fees().mul_floor(price).checked_add(&price).ok_or(Error::<T>::ArithmeticError)?;

            let joys_required = if !user_account_data_exists {
                buy_price.saturating_add(bloat_bond)
            } else {
                buy_price
            };

            Self::ensure_can_transfer_joy(&sender, joys_required)?;

            // slippage tolerance check
            if let Some((slippage_tolerance, desired_price)) = slippage_tolerance {
                ensure!(price.saturating_sub(desired_price) <= slippage_tolerance.mul_floor(desired_price), Error::<T>::SlippageToleranceExceeded);
            }

            // == MUTATION SAFE ==

            if !user_account_data_exists {
               let new_account_info = AccountDataOf::<T>::new_with_amount_and_bond(
                            amount,
                            // No restrictions on repayable bloat bond,
                            // since only usable balance is allowed
                            RepayableBloatBond::new(bloat_bond, None)
                    );
                Self::do_insert_new_account_for_token(token_id, &member_id, new_account_info);
                Self::transfer_joy(&sender, &amm_treasury_account, bloat_bond)?;
            } else {
                AccountInfoByTokenAndMember::<T>::mutate(token_id, member_id, |account_data| {
                    account_data.increase_amount_by(amount);
                });
            }

            TokenInfoById::<T>::mutate(token_id, |token_data| {
                token_data.increase_supply_by(amount);
                token_data.increase_amm_bought_amount_by(amount);
            });

            // TODO: redirect tx fees revenue to council
            Self::transfer_joy(&sender, &amm_treasury_account, buy_price)?;

            Self::deposit_event(RawEvent::TokensBoughtOnAmm(token_id, member_id, amount, buy_price));

            Ok(())
        }

        /// Burn desired `token_id` amount from user account and get JOY from treasury account
        /// Preconditions
        /// - origin, member_id pair must be a valid authentication pair
        /// - token_id must exist
        /// - token_id, member_id must be valid account coordinates
        /// - user usable CRT balance must be at least `amount`
        /// - slippage tolerance constraints respected if provided
        /// - token total supply and amount value must be s.t. `eval` function doesn't overflow
        /// - amm treasury account must have sufficient JOYs for the operation
        ///
        /// Postconditions
        /// - `amount` burned from user account
        /// - total supply decreased by amount
        /// - respective JOY amount transferred from amm treasury account to user account
        /// - event deposited
       #[weight = WeightInfoToken::<T>::sell_on_amm()]
       fn sell_on_amm(origin, token_id: T::TokenId, member_id: T::MemberId, amount: <T as Config>::Balance, slippage_tolerance: Option<(Permill, JoyBalanceOf<T>)>) -> DispatchResult {
            if amount.is_zero() {
               return Ok(()); // noop
            }

            let sender = ensure_signed(origin.clone())?;

            T::MemberOriginValidator::ensure_member_controller_account_origin(
                origin,
                member_id
            )?;

            let token_data = Self::ensure_token_exists(token_id)?;
            let curve = token_data.amm_curve.ok_or(Error::<T>::NotInAmmState)?;
            let user_acc_data = Self::ensure_account_data_exists(token_id, &member_id)?;

            ensure!(
                user_acc_data.transferrable::<T>(Self::current_block()) >= amount,
                Error::<T>::InsufficientTokenBalance,
            );

            let amm_treasury_account = Self::amm_treasury_account(token_id);

            let price = Self::eval(&curve, amount, curve.provided_supply, AmmOperation::Sell)?;

            // slippage tolerance ccurve.eval::<T>heck
            if let Some((slippage_tolerance, desired_price)) = slippage_tolerance {
                ensure!(desired_price.saturating_sub(price) <= slippage_tolerance.mul_floor(desired_price), Error::<T>::SlippageToleranceExceeded);
            }

            let sell_price = Self::amm_sell_tx_fees().left_from_one().mul_floor(price);

            // TODO: redirect tx fees revenue to council
            Self::ensure_can_transfer_joy(&amm_treasury_account, sell_price)?;

            // == MUTATION SAFE ==

            AccountInfoByTokenAndMember::<T>::mutate(token_id, member_id, |account_data| {
                account_data.decrease_amount_by(amount);
            });

            TokenInfoById::<T>::mutate(token_id, |token_data| {
                token_data.decrease_supply_by(amount);
                token_data.decrease_amm_bought_amount_by(amount);
            });

            Self::transfer_joy(&amm_treasury_account, &sender, sell_price)?;

            Self::deposit_event(RawEvent::TokensSoldOnAmm(token_id, member_id, amount, sell_price));

            Ok(())
        }

        #[weight = 100_000_000] // TODO: adjust weight
        fn update_max_yearly_patronage_rate(origin, rate: YearlyRate) -> DispatchResult {
            ensure_root(origin)?;

            // == MUTATION SAFE ==

            MaxYearlyPatronageRate::mutate(|v| *v = rate);

            Self::deposit_event(RawEvent::MaxYearlyPatronageRateUpdated(rate));

            Ok(())
        }

    }
}

impl<T: Config>
    PalletToken<
        T::TokenId,
        T::MemberId,
        <T as frame_system::Config>::AccountId,
        JoyBalanceOf<T>,
        TokenIssuanceParametersOf<T>,
        T::BlockNumber,
        TokenSaleParamsOf<T>,
        UploadContextOf<T>,
        TransferWithVestingOutputsOf<T>,
        AmmParamsOf<T>,
    > for Module<T>
{
    /// Establish whether there's an unfinalized revenue split
    /// Postconditions: true if token @ token_id has an unfinalized revenue split, false otherwise
    fn is_revenue_split_inactive(token_id: T::TokenId) -> bool {
        if let Ok(token_info) = Self::ensure_token_exists(token_id) {
            return token_info.revenue_split.ensure_inactive::<T>().is_ok();
        }
        true
    }

    /// Establish whether there is an unfinalized token sale
    /// Postconditions: true if token @ token_id has an unfinalized sale, false otherwise
    fn is_sale_unscheduled(token_id: T::TokenId) -> bool {
        if let Ok(token_info) = Self::ensure_token_exists(token_id) {
            return token_info.sale.is_none();
        }
        true
    }

    /// Establish whether AMM is active
    /// Postconditions: true if token @ token_id exists && has active AMM, false otherwise
    fn is_amm_active(token_id: T::TokenId) -> bool {
        if let Ok(token_info) = Self::ensure_token_exists(token_id) {
            return OfferingStateOf::<T>::ensure_amm_of::<T>(&token_info).is_ok();
        }
        false
    }

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
        });

        Self::deposit_event(RawEvent::TransferPolicyChangedToPermissionless(token_id));
        Ok(())
    }

    /// Reduce patronage rate by amount
    /// Preconditions:
    /// - token by `token_id` must exists
    /// - `target_rate` must be less or equal than current patronage rate for `token_id`
    ///
    /// Postconditions:
    /// - patronage rate for `token_id` reduced to `target_rate`
    /// - no-op if `target_rate` is equal to the current patronage rate
    fn reduce_patronage_rate_to(token_id: T::TokenId, target_rate: YearlyRate) -> DispatchResult {
        let token_info = Self::ensure_token_exists(token_id)?;

        if token_info.patronage_info.rate == target_rate {
            return Ok(());
        }

        ensure!(
            token_info.patronage_info.rate > target_rate,
            Error::<T>::TargetPatronageRateIsHigherThanCurrentRate,
        );

        // == MUTATION SAFE ==

        let now = Self::current_block();
        TokenInfoById::<T>::mutate(token_id, |token_info| {
            token_info.set_new_patronage_rate_at_block::<T::BlocksPerYear>(target_rate, now);
        });

        Self::deposit_event(RawEvent::PatronageRateDecreasedTo(token_id, target_rate));

        Ok(())
    }

    /// Allow creator to receive credit into his account
    ///
    /// Preconditions:
    /// - token by `token_id` must exists
    /// - `member_id` x `token_id` account must exist
    /// - `token.revenue_split` has Inactive status
    ///
    /// Postconditions:
    /// - outstanding patronage credit for `token_id` transferred to `member_id` account
    /// - outstanding patronage credit subsequently set to 0
    /// no-op if outstanding credit is zero
    fn claim_patronage_credit(token_id: T::TokenId, member_id: T::MemberId) -> DispatchResult {
        let token_info = Self::ensure_token_exists(token_id)?;
        token_info.ensure_can_modify_supply::<T>()?;

        Self::ensure_account_data_exists(token_id, &member_id).map(|_| ())?;

        let now = Self::current_block();
        let unclaimed_patronage = token_info.unclaimed_patronage_at_block::<T::BlocksPerYear>(now);

        if unclaimed_patronage.is_zero() {
            return Ok(());
        }

        // == MUTATION SAFE ==

        AccountInfoByTokenAndMember::<T>::mutate(token_id, &member_id, |account_info| {
            account_info.increase_amount_by(unclaimed_patronage)
        });

        TokenInfoById::<T>::mutate(token_id, |token_info| {
            token_info.increase_supply_by(unclaimed_patronage);
            token_info.set_unclaimed_tally_patronage_at_block(<T as Config>::Balance::zero(), now);
        });

        Self::deposit_event(RawEvent::PatronageCreditClaimed(
            token_id,
            unclaimed_patronage,
            member_id,
        ));

        Ok(())
    }

    /// Issue token with specified characteristics
    ///
    /// Preconditions:
    /// - `symbol` specified in the parameters must NOT exists in `SymbolsUsed`
    /// - `issuer_account` usable balance in JOYs >=
    ///   `initial_allocation.len() * bloat_bond + JoyExistentialDeposit`
    ///
    /// Postconditions:
    /// - token with specified characteristics is added to storage state
    /// - `NextTokenId` increased by 1
    /// - symbol is added to `SymbolsUsed`
    /// - total bloat bond in JOY is transferred from `issuer_account` to treasury account
    /// - new token accounts are initialized based on `initial_allocation`
    fn issue_token(
        issuer_account: T::AccountId,
        issuance_parameters: TokenIssuanceParametersOf<T>,
        upload_context: UploadContextOf<T>,
    ) -> Result<T::TokenId, DispatchError> {
        let token_id = Self::next_token_id();
        let bloat_bond = Self::bloat_bond();
        Self::validate_issuance_parameters(&issuance_parameters)?;
        let token_data = TokenDataOf::<T>::from_params::<T>(issuance_parameters.clone())?;
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
        ensure!(
            has_sufficient_balance_for_fees::<T>(&issuer_account, total_bloat_bond),
            Error::<T>::InsufficientJoyBalance
        );

        // == MUTATION SAFE ==

        SymbolsUsed::<T>::insert(&token_data.symbol, ());
        TokenInfoById::<T>::insert(token_id, token_data);
        NextTokenId::<T>::put(token_id.saturating_add(T::TokenId::one()));

        Self::perform_initial_allocation(
            token_id,
            &issuance_parameters.initial_allocation,
            &issuer_account,
        )?;

        // TODO: Not clear what the storage interface will be yet, so this is just a mock code now
        if let Some(params) = upload_params.as_ref() {
            Self::upload_data_object(params);
        }

        Self::deposit_event(RawEvent::TokenIssued(token_id, issuance_parameters));

        Ok(token_id)
    }

    /// Allow to transfer from `src` (issuer) to the various `outputs` beneficiaries in the
    /// specified amounts, with optional vesting schemes attached.
    ///
    /// Preconditions:
    /// - token by `token_id` must exists
    /// - `src_member_id` x `token_id` account must exist
    /// - `bloat_bond_payer` account must have enough JOYs to cover
    ///    the total bloat bond required in case of destination(s) not existing.
    /// - source account must have enough token funds to cover all the transfers
    /// - each account in `outputs` must have the number of ongoing `vesting_schedules` <
    ///   MaxVestingSchedulesPerAccountPerToken in case `vesting_schedule` was provided
    ///   in the output
    //
    /// Postconditions:
    /// - source account tokens amount decreased by `amount`.
    /// - total bloat bond transferred from `bloat_bond_payer`
    ///   to module treasury account
    /// - `outputs.beneficiary` tokens amount increased by `amount`
    /// - if `vesting_schedule` provided in the output - vesting schedule added to
    ///   `outputs.beneficiary` account data
    /// - if number of `vesting_schedules` in `outputs.beneficiary` account data was equal to
    ///   MaxVestingSchedulesPerAccountPerToken - some finished vesting_schedule is dropped
    ///   from beneficiary'es `account_data`
    fn issuer_transfer(
        token_id: T::TokenId,
        src_member_id: T::MemberId,
        bloat_bond_payer: T::AccountId,
        outputs: TransferWithVestingOutputsOf<T>,
        metadata: Vec<u8>,
    ) -> DispatchResult {
        // Currency transfer preconditions
        let validated_transfers = Self::ensure_can_transfer(
            token_id,
            &bloat_bond_payer,
            &src_member_id,
            outputs.into(),
            true,
        )?;

        // == MUTATION SAFE ==

        Self::do_transfer(
            token_id,
            &bloat_bond_payer,
            &src_member_id,
            &validated_transfers,
        )?;

        Self::deposit_event(RawEvent::TokenAmountTransferredByIssuer(
            token_id,
            src_member_id,
            validated_transfers,
            metadata,
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
    /// - `token_id` x `member_id` account exists
    /// - `token_id` x `member_id` account has transferrable CRT balance
    ///   >= `sale_params.upper_bound_quantity`
    ///
    /// Postconditions:
    /// - `token_id` x `member_id` account balance is decreased by
    ///   `sale_params.upper_bound_quantity`
    /// - token's `sale` is set
    /// - token's `next_sale_id` is incremented
    fn init_token_sale(
        token_id: T::TokenId,
        member_id: T::MemberId,
        earnings_destination: Option<T::AccountId>,
        auto_finalize: bool,
        sale_params: TokenSaleParamsOf<T>,
    ) -> DispatchResult {
        let current_block = Self::current_block();
        let token_data = Self::ensure_token_exists(token_id)?;
        let sale_id = token_data.next_sale_id;
        let sale = TokenSaleOf::<T>::try_from_params::<T>(
            sale_params.clone(),
            member_id,
            earnings_destination,
            auto_finalize,
            current_block,
        )?;
        Self::ensure_can_init_sale(
            token_id,
            member_id,
            &token_data,
            &sale_params,
            current_block,
        )?;

        // == MUTATION SAFE ==

        // Decrease source account's tokens number by sale_params.upper_bound_quantity
        // (unsold tokens can be later recovered with `finalize_token_sale`)
        AccountInfoByTokenAndMember::<T>::mutate(token_id, &member_id, |ad| {
            ad.decrease_amount_by(sale_params.upper_bound_quantity);
        });

        TokenInfoById::<T>::mutate(token_id, |t| {
            t.sale = Some(sale.clone());
            t.next_sale_id = t.next_sale_id.saturating_add(1);
        });

        Self::deposit_event(RawEvent::TokenSaleInitialized(
            token_id,
            sale_id,
            sale,
            sale_params.metadata,
        ));
        Ok(())
    }

    /// Update upcoming token sale
    ///
    /// Preconditions:
    /// - token by `token_id` exists
    /// - token offering is in UpcomingSale state
    /// - If `new_duration.is_some()`:
    ///   - `new_duration` >= `min_sale_duration` && `new_duration` > 0
    /// - If `new_start_block.is_some()`:
    ///   - `new_start_block` >= `current_block`
    ///
    /// Postconditions:
    /// - token's sale `duration` and `start_block` updated according to provided parameters
    fn update_upcoming_sale(
        token_id: T::TokenId,
        new_start_block: Option<T::BlockNumber>,
        new_duration: Option<T::BlockNumber>,
    ) -> DispatchResult {
        let token_data = Self::ensure_token_exists(token_id)?;
        let sale = OfferingStateOf::<T>::ensure_upcoming_sale_of::<T>(&token_data)?;
        let sale_id = token_data
            .next_sale_id
            .checked_sub(1)
            .ok_or(Error::<T>::ArithmeticError)?;

        // Validate sale duration
        if let Some(duration) = new_duration {
            ensure!(!duration.is_zero(), Error::<T>::SaleDurationIsZero);
            ensure!(
                duration >= Self::min_sale_duration(),
                Error::<T>::SaleDurationTooShort
            );
        }

        // Validate start_block
        if let Some(start_block) = new_start_block {
            ensure!(
                start_block >= <frame_system::Pallet<T>>::block_number(),
                Error::<T>::SaleStartingBlockInThePast
            );
        }

        let updated_sale = TokenSaleOf::<T> {
            start_block: new_start_block.unwrap_or(sale.start_block),
            duration: new_duration.unwrap_or(sale.duration),
            ..sale
        };

        // == MUTATION SAFE ==
        TokenInfoById::<T>::mutate(token_id, |t| t.sale = Some(updated_sale));

        Self::deposit_event(RawEvent::UpcomingTokenSaleUpdated(
            token_id,
            sale_id,
            new_start_block,
            new_duration,
        ));
        Ok(())
    }

    /// Remove token data from storage
    ///
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
    /// Issue a revenue split for the token
    /// Preconditions:
    /// - `token` must exist for `token_id`
    /// - `floor(revenue_split_rate * nominal_allocation_amount) > 0`
    /// - `token` revenue split status must be inactive
    /// - if Some(start) specified: `start - System::block_number() >= MinRevenueSplitTimeToStart`
    /// - `duration` must be >= `MinRevenueSplitDuration`
    /// - specified `reserve_source` must be able to *transfer* `allocation` amount of JOY
    ///
    /// PostConditions
    /// - `allocation` transferred from `reserve_source` to `treasury_account`
    /// - `token.revenue_split` set to `Active(..)`
    /// -  `token.revenue_split.timeline` is [start, start + duration), with `start` one of:
    ///    - `current_block + MinRevenuSplitTimeToStart`
    ///    - specfied `Some(start)``
    /// - `token.revenue_split.allocation = allocation`
    /// - `token.latest_split` incremented by 1
    fn issue_revenue_split(
        token_id: T::TokenId,
        start: Option<T::BlockNumber>,
        duration: T::BlockNumber,
        revenue_source_account: T::AccountId,
        revenue_amount: JoyBalanceOf<T>,
    ) -> Result<JoyBalanceOf<T>, DispatchError> {
        let token_info = Self::ensure_token_exists(token_id)?;
        token_info.revenue_split.ensure_inactive::<T>()?;

        let allocation_amount = token_info.revenue_split_rate.mul_floor(revenue_amount);

        ensure!(
            !allocation_amount.is_zero(),
            Error::<T>::CannotIssueSplitWithZeroAllocationAmount,
        );

        ensure!(
            duration >= Self::min_revenue_split_duration(),
            Error::<T>::RevenueSplitDurationTooShort
        );

        let current_block = Self::current_block();
        if let Some(starting_block) = start {
            ensure!(
                starting_block.saturating_sub(current_block)
                    >= Self::min_revenue_split_time_to_start(),
                Error::<T>::RevenueSplitTimeToStartTooShort,
            );
        }

        let revenue_split_start = start.unwrap_or_else(|| {
            current_block.saturating_add(Self::min_revenue_split_time_to_start())
        });
        let timeline = TimelineOf::<T>::from_params(revenue_split_start, duration);

        let treasury_account = Self::module_treasury_account();

        Self::ensure_can_transfer_joy(&revenue_source_account, allocation_amount)?;

        // == MUTATION SAFE ==

        // tranfer allocation keeping the source account alive
        Self::transfer_joy(
            &revenue_source_account,
            &treasury_account,
            allocation_amount,
        )?;

        TokenInfoById::<T>::mutate(token_id, |token_info| {
            token_info.activate_new_revenue_split(allocation_amount, timeline);
        });

        Self::deposit_event(RawEvent::RevenueSplitIssued(
            token_id,
            revenue_split_start,
            duration,
            allocation_amount,
        ));

        Ok(revenue_amount.saturating_sub(allocation_amount))
    }

    /// Finalize revenue split once it is ended
    /// Preconditions
    /// - `token` at `token_id`
    /// - `token.revenue_split` is active
    /// - `token.revenue_split` has ended
    ///
    /// Postconditions
    /// - `token.revenue_split.leftovers()` of JOYs transferred to `account_id`
    /// - `token.revenue_split` status set to Inactive
    fn finalize_revenue_split(token_id: T::TokenId, account_id: T::AccountId) -> DispatchResult {
        let token_info = Self::ensure_token_exists(token_id)?;

        let split_info = token_info.revenue_split.ensure_active::<T>()?;

        let current_block = Self::current_block();
        ensure!(
            split_info.timeline.is_ended(current_block),
            Error::<T>::RevenueSplitDidNotEnd
        );

        // = MUTATION SAFE =

        let treasury_account = Self::module_treasury_account();
        let amount_to_withdraw = split_info.leftovers();

        Self::transfer_joy(&treasury_account, &account_id, amount_to_withdraw)?;

        TokenInfoById::<T>::mutate(token_id, |token_info| token_info.deactivate_revenue_split());

        Self::deposit_event(RawEvent::RevenueSplitFinalized(
            token_id,
            account_id,
            amount_to_withdraw,
        ));

        Ok(())
    }

    /// Allows the issuer to finalize an ended creator token sale and recover any leftover
    /// tokens that were not sold.
    ///
    /// Returns total amount of JOY collected during the sale.
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
    fn finalize_token_sale(token_id: T::TokenId) -> Result<JoyBalanceOf<T>, DispatchError> {
        let token_info = Self::ensure_token_exists(token_id)?;
        OfferingStateOf::<T>::ensure_idle_of::<T>(&token_info)?;
        let sale = token_info.sale.ok_or(Error::<T>::NoTokensToRecover)?;
        let sale_id = token_info
            .next_sale_id
            .checked_sub(1)
            .ok_or(Error::<T>::ArithmeticError)?;

        // == MUTATION SAFE ==
        AccountInfoByTokenAndMember::<T>::mutate(token_id, &sale.tokens_source, |ad| {
            ad.increase_amount_by(sale.quantity_left);
        });
        TokenInfoById::<T>::mutate(token_id, |token_info| {
            token_info.sale = None;
        });

        Self::deposit_event(RawEvent::TokenSaleFinalized(
            token_id,
            sale_id,
            sale.quantity_left,
            sale.funds_collected,
        ));

        Ok(sale.funds_collected)
    }

    /// Activate Amm functionality for the token
    /// Preconditions
    /// - token_id must exist
    /// - offering state for `token_id` must be `Idle`
    ///
    /// Postconditions
    /// - token `amm_curve` activated with specified parameters
    /// - amm treasuryaccount created with existential deposit (if necessary)
    /// - event deposited
    fn activate_amm(
        token_id: T::TokenId,
        member_id: T::MemberId,
        params: AmmParamsOf<T>,
    ) -> DispatchResult {
        let token_data = Self::ensure_token_exists(token_id)?;

        ensure!(
            OfferingStateOf::<T>::ensure_idle_of::<T>(&token_data).is_ok(),
            Error::<T>::TokenIssuanceNotInIdleState
        );

        ensure!(
            params.slope >= Self::min_amm_slope_parameter(),
            Error::<T>::CurveSlopeParametersTooLow
        );
        let curve = AmmCurveOf::<T>::from_params::<T>(params);

        // == MUTATION SAFE ==

        TokenInfoById::<T>::mutate(token_id, |token_data| {
            token_data.amm_curve = Some(curve.clone())
        });

        // deposit existential deposit if the account is newly created
        let amm_treasury_account = Self::amm_treasury_account(token_id);
        if Joy::<T>::usable_balance(&amm_treasury_account).is_zero() {
            let _ =
                Joy::<T>::deposit_creating(&amm_treasury_account, T::JoyExistentialDeposit::get());
        }

        Self::deposit_event(RawEvent::AmmActivated(token_id, member_id, curve));

        Ok(())
    }

    /// Deactivate the amm functionality
    /// Preconditions
    /// - (origin, member_id) must be a valid authentication pair
    /// - token_id must be a valid
    /// - token must be in `Amm` state
    ///
    /// Postconditions
    /// - Amm Curve set to None
    /// - state set to idle
    /// - event deposited
    fn deactivate_amm(token_id: T::TokenId, member_id: T::MemberId) -> DispatchResult {
        let token_data = Self::ensure_token_exists(token_id)?;
        Self::ensure_amm_can_be_deactivated(&token_data)?;

        // == MUTATION SAFE ==

        TokenInfoById::<T>::mutate(token_id, |token_data| {
            token_data.amm_curve = None;
        });

        // burn amount exceeding existential deposit
        let amm_treasury_account = Self::amm_treasury_account(token_id);
        let amount_to_burn = Joy::<T>::usable_balance(&amm_treasury_account)
            .saturating_sub(T::JoyExistentialDeposit::get());
        let _ = burn_from_usable::<T>(&amm_treasury_account, amount_to_burn);

        Self::deposit_event(RawEvent::AmmDeactivated(
            token_id,
            member_id,
            amount_to_burn,
        ));

        Ok(())
    }
}

/// Module implementation
impl<T: Config> Module<T> {
    pub(crate) fn ensure_account_data_exists(
        token_id: T::TokenId,
        member_id: &T::MemberId,
    ) -> Result<AccountDataOf<T>, DispatchError> {
        ensure!(
            AccountInfoByTokenAndMember::<T>::contains_key(token_id, member_id),
            Error::<T>::AccountInformationDoesNotExist,
        );
        Ok(Self::account_info_by_token_and_member(token_id, member_id))
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
        bloat_bond_payer: &T::AccountId,
        src_member_id: &T::MemberId,
        transfers: TransfersOf<T>,
        is_issuer: bool,
    ) -> Result<ValidatedTransfersOf<T>, DispatchError> {
        // ensure token validity
        let token_info = Self::ensure_token_exists(token_id)?;

        // ensure src account id validity
        let src_account_info = Self::ensure_account_data_exists(token_id, src_member_id)?;

        // ensure src account can cover total transfers amount
        src_account_info
            .ensure_can_transfer::<T>(Self::current_block(), transfers.total_amount())?;

        // validate destinations
        let validated_transfers =
            Self::validate_transfers(token_id, transfers, &token_info.transfer_policy, is_issuer)?;

        // compute bloat bond
        let cumulative_bloat_bond = Self::compute_bloat_bond(&validated_transfers);
        ensure!(
            has_sufficient_balance_for_fees::<T>(bloat_bond_payer, cumulative_bloat_bond),
            Error::<T>::InsufficientJoyBalance
        );

        Ok(validated_transfers)
    }

    /// Perform balance accounting for balances
    pub(crate) fn do_transfer(
        token_id: T::TokenId,
        bloat_bond_payer: &T::AccountId,
        src_member_id: &T::MemberId,
        validated_transfers: &ValidatedTransfersOf<T>,
    ) -> DispatchResult {
        let current_block = Self::current_block();

        let validated_transfers_with_bloat_bonds =
            Self::pay_transfer_bloat_bonds(bloat_bond_payer, validated_transfers)?;

        for (validated_account, validated_payment) in validated_transfers_with_bloat_bonds.0.iter()
        {
            let vesting_schedule = validated_payment
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
                ValidatedWithBloatBond::Existing(dst_member_id) => {
                    AccountInfoByTokenAndMember::<T>::try_mutate(
                        token_id,
                        &dst_member_id,
                        |account_data| {
                            if let Some(vs) = vesting_schedule {
                                account_data.add_or_update_vesting_schedule::<T>(
                                    VestingSource::IssuerTransfer(
                                        account_data.next_vesting_transfer_id,
                                    ),
                                    vs,
                                    validated_payment.vesting_cleanup_candidate.clone(),
                                )?;
                            } else {
                                account_data.increase_amount_by(validated_payment.payment.amount);
                            }
                            DispatchResult::Ok(())
                        },
                    )?;
                }
                ValidatedWithBloatBond::NonExisting(dst_member_id, repayable_bloat_bond) => {
                    Self::do_insert_new_account_for_token(
                        token_id,
                        dst_member_id,
                        if let Some(vs) = vesting_schedule {
                            AccountDataOf::<T>::new_with_vesting_and_bond::<T>(
                                VestingSource::IssuerTransfer(0),
                                vs,
                                repayable_bloat_bond.clone(),
                            )?
                        } else {
                            AccountDataOf::<T>::new_with_amount_and_bond(
                                validated_payment.payment.amount,
                                repayable_bloat_bond.clone(),
                            )
                        },
                    );
                }
            }
        }

        AccountInfoByTokenAndMember::<T>::mutate(token_id, &src_member_id, |account_data| {
            account_data.decrease_amount_by(validated_transfers.total_amount());
        });

        Ok(())
    }

    pub(crate) fn current_block() -> T::BlockNumber {
        <frame_system::Pallet<T>>::block_number()
    }

    /// Computes (staked_amount / supply) * allocation
    /// Preconditions:
    /// - supply >= user_staked_amount > 0
    /// - allocation > 0
    pub(crate) fn compute_revenue_split_dividend(
        user_staked_amount: TokenBalanceOf<T>,
        supply: TokenBalanceOf<T>,
        split_allocation: JoyBalanceOf<T>,
    ) -> JoyBalanceOf<T> {
        let perc_of_the_supply = Permill::from_rational(user_staked_amount, supply);
        perc_of_the_supply.mul_floor(split_allocation)
    }

    pub(crate) fn ensure_can_init_sale(
        token_id: T::TokenId,
        member_id: T::MemberId,
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
            Error::<T>::PreviousSaleNotFinalized
        );

        // Ensure source account exists
        let account_data = Self::ensure_account_data_exists(token_id, &member_id)?;

        // Ensure source account has enough transferrable tokens
        account_data.ensure_can_transfer::<T>(current_block, sale_params.upper_bound_quantity)?;

        Ok(())
    }

    /// Ensure sender can remove account
    /// Params:
    /// - transfer_policy for the token
    /// - sender (dust_account extrinsic signer)
    /// - member_controller account of the `account_to_remove` owner
    /// - account to remove data
    pub(crate) fn ensure_user_can_dust_account(
        transfer_policy: &TransferPolicyOf<T>,
        sender: &T::AccountId,
        member_controller: &T::AccountId,
        account_to_remove_info: &AccountDataOf<T>,
    ) -> DispatchResult {
        ensure!(
            account_to_remove_info.is_empty(),
            Error::<T>::AttemptToRemoveNonEmptyAccount
        );
        if let TransferPolicyOf::<T>::Permissioned(_) = transfer_policy {
            ensure!(
                sender == member_controller,
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

        for (member_id, _) in params.initial_allocation.iter() {
            ensure!(
                T::MembershipInfoProvider::controller_account_id(*member_id).is_ok(),
                Error::<T>::InitialAllocationToNonExistingMember
            )
        }

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
        sale_id: TokenSaleId,
        account_data: &Option<AccountDataOf<T>>,
        purchase_amount: <T as Config>::Balance,
        cap: <T as Config>::Balance,
    ) -> DispatchResult {
        let tokens_purchased = account_data
            .as_ref()
            .map_or(TokenBalanceOf::<T>::zero(), |ad| {
                match ad.last_sale_total_purchased_amount {
                    Some((last_sale_id, tokens_purchased)) if last_sale_id == sale_id => {
                        tokens_purchased
                    }
                    _ => TokenBalanceOf::<T>::zero(),
                }
            });
        ensure!(
            tokens_purchased.saturating_add(purchase_amount) <= cap,
            Error::<T>::SalePurchaseCapExceeded
        );
        Ok(())
    }

    /// Returns the account for the current module used for both bloat bond & revenue split
    pub fn module_treasury_account() -> T::AccountId {
        <T as Config>::ModuleId::get().into_sub_account_truncating(Vec::<u8>::new())
    }

    /// Returns the account for the AMM treasury
    pub fn amm_treasury_account(token_id: T::TokenId) -> T::AccountId {
        <T as Config>::ModuleId::get().into_sub_account_truncating(&("AMM", token_id))
    }

    pub(crate) fn validate_destination(
        dst: T::MemberId,
        dst_acc_data: &Option<AccountDataOf<T>>,
        transfer_policy: &TransferPolicyOf<T>,
        is_issuer: bool,
    ) -> Result<Validated<T::MemberId>, DispatchError> {
        ensure!(
            T::MembershipInfoProvider::controller_account_id(dst).is_ok(),
            Error::<T>::TransferDestinationMemberDoesNotExist
        );
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
            .fold(JoyBalanceOf::<T>::zero(), |total, (dst, _)| {
                if matches!(dst, Validated::<_>::NonExisting(_)) {
                    total.saturating_add(bloat_bond)
                } else {
                    JoyBalanceOf::<T>::zero()
                }
            })
    }

    pub(crate) fn validate_transfers(
        token_id: T::TokenId,
        transfers: TransfersOf<T>,
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
        ensure!(
            has_sufficient_balance_for_payment::<T>(src, amount),
            Error::<T>::InsufficientJoyBalance
        );

        Ok(())
    }

    pub(crate) fn transfer_joy(
        src: &T::AccountId,
        dst: &T::AccountId,
        amount: JoyBalanceOf<T>,
    ) -> DispatchResult {
        <Joy<T> as Currency<T::AccountId>>::transfer(
            src,
            dst,
            amount,
            ExistenceRequirement::KeepAlive,
        )
    }

    pub(crate) fn do_insert_new_account_for_token(
        token_id: T::TokenId,
        member_id: &T::MemberId,
        info: AccountDataOf<T>,
    ) {
        AccountInfoByTokenAndMember::<T>::insert(token_id, member_id, info);

        TokenInfoById::<T>::mutate(token_id, |token_info| {
            token_info.increment_accounts_number();
        });
    }

    pub(crate) fn perform_initial_allocation(
        token_id: T::TokenId,
        targets: &BTreeMap<T::MemberId, TokenAllocationOf<T>>,
        bloat_bond_payer: &T::AccountId,
    ) -> DispatchResult {
        let current_block = Self::current_block();
        let targets_with_bloat_bonds =
            Self::pay_initial_allocation_bloat_bonds(bloat_bond_payer, targets)?;

        for (destination, (allocation, repayable_bloat_bond)) in targets_with_bloat_bonds.iter() {
            let account_data = if let Some(vsp) = allocation.vesting_schedule_params.as_ref() {
                AccountDataOf::<T>::new_with_vesting_and_bond::<T>(
                    VestingSource::InitialIssuance,
                    VestingSchedule::from_params(current_block, allocation.amount, vsp.clone()),
                    repayable_bloat_bond.clone(),
                )?
            } else {
                AccountDataOf::<T>::new_with_amount_and_bond(
                    allocation.amount,
                    repayable_bloat_bond.clone(),
                )
            };

            Self::do_insert_new_account_for_token(token_id, destination, account_data);
        }
        Ok(())
    }

    #[allow(clippy::unnecessary_wraps)]
    pub(crate) fn ensure_can_upload_data_object(
        payload: &SingleDataObjectUploadParamsOf<T>,
        upload_context: &UploadContextOf<T>,
    ) -> Result<UploadParameters<T>, DispatchError> {
        // TODO: TBD
        Ok(UploadParameters::<T> {
            bag_id: upload_context.bag_id.clone(),
            state_bloat_bond_source_account_id: upload_context.uploader_account.clone(),
            expected_data_size_fee: payload.expected_data_size_fee,
            object_creation_list: vec![payload.object_creation_params.clone()],
            expected_data_object_state_bloat_bond: payload.expected_data_object_state_bloat_bond,
        })
    }

    pub(crate) fn upload_data_object(_params: &UploadParameters<T>) {
        // TODO: TBD
    }

    fn pay_bloat_bond(from: &T::AccountId) -> Result<RepayableBloatBondOf<T>, DispatchError> {
        let bloat_bond = Self::bloat_bond();
        let treasury = Self::module_treasury_account();
        let locked_balance_used = pay_fee::<T>(from, Some(&treasury), bloat_bond)?;

        Ok(match locked_balance_used.is_zero() {
            true => RepayableBloatBond::new(bloat_bond, None),
            false => RepayableBloatBond::new(bloat_bond, Some(from.clone())),
        })
    }

    fn pay_initial_allocation_bloat_bonds(
        from: &T::AccountId,
        initial_allocation: &BTreeMap<T::MemberId, TokenAllocationOf<T>>,
    ) -> Result<AllocationWithBloatBondsOf<T>, DispatchError> {
        let bloat_bond = Self::bloat_bond();
        let treasury = Self::module_treasury_account();
        let number_of_new_accounts = initial_allocation.len() as u32;
        let locked_balance_used = pay_fee::<T>(
            from,
            Some(&treasury),
            bloat_bond.saturating_mul(number_of_new_accounts.into()),
        )?;

        Ok(initial_allocation
            .iter()
            .enumerate()
            .map(|(i, (member_id, allocation))| {
                let repayable_bloat_bond =
                    match locked_balance_used <= bloat_bond.saturating_mul((i as u32).into()) {
                        true => RepayableBloatBond::new(bloat_bond, None),
                        false => RepayableBloatBond::new(bloat_bond, Some(from.clone())),
                    };
                (*member_id, (allocation.clone(), repayable_bloat_bond))
            })
            .collect())
    }

    fn pay_transfer_bloat_bonds(
        from: &T::AccountId,
        validated_transfers: &ValidatedTransfersOf<T>,
    ) -> Result<Transfers<ValidatedWithBloatBondOf<T>, ValidatedPaymentOf<T>>, DispatchError> {
        let bloat_bond = Self::bloat_bond();
        let treasury = Self::module_treasury_account();
        let number_of_new_accounts = validated_transfers
            .0
            .iter()
            .filter(|(a, _)| matches!(a, Validated::<_>::NonExisting(_)))
            .count() as u32;
        let locked_balance_used = pay_fee::<T>(
            from,
            Some(&treasury),
            bloat_bond.saturating_mul(number_of_new_accounts.into()),
        )?;

        let mut bloat_bond_index: u32 = 0;
        let transfers_set = validated_transfers
            .0
            .iter()
            .map(
                |(validated_member_id, validated_payment)| match validated_member_id {
                    Validated::Existing(member_id) => Ok((
                        ValidatedWithBloatBond::Existing(*member_id),
                        validated_payment.clone(),
                    )),
                    Validated::NonExisting(member_id) => {
                        let repayable_bloat_bond = match locked_balance_used
                            <= bloat_bond.saturating_mul((bloat_bond_index as u32).into())
                        {
                            true => RepayableBloatBond::new(bloat_bond, None),
                            false => RepayableBloatBond::new(bloat_bond, Some(from.clone())),
                        };
                        bloat_bond_index = bloat_bond_index
                            .checked_add(1)
                            .ok_or(Error::<T>::ArithmeticError)?;

                        Ok((
                            ValidatedWithBloatBond::NonExisting(*member_id, repayable_bloat_bond),
                            validated_payment.clone(),
                        ))
                    }
                },
            )
            .collect::<Result<BTreeMap<_, _>, DispatchError>>()?;
        Ok(Transfers(transfers_set))
    }

    pub(crate) fn eval(
        curve: &AmmCurveOf<T>,
        amount: TokenBalanceOf<T>,
        supply_pre: TokenBalanceOf<T>,
        bond_operation: AmmOperation,
    ) -> Result<JoyBalanceOf<T>, DispatchError> {
        let amount_sq = amount
            .checked_mul(&amount)
            .ok_or(Error::<T>::ArithmeticError)?;
        let first_term = curve.slope.saturating_mul(amount_sq).div(2u32.into());
        let second_term = curve.intercept.saturating_mul(amount);
        let mixed = amount
            .checked_mul(&supply_pre)
            .ok_or(Error::<T>::ArithmeticError)?;
        let third_term = curve.slope.saturating_mul(mixed);
        let res = match bond_operation {
            AmmOperation::Buy => first_term
                .checked_add(&second_term)
                .ok_or(Error::<T>::ArithmeticError)?
                .checked_add(&third_term)
                .ok_or(Error::<T>::ArithmeticError)?,
            AmmOperation::Sell => second_term
                .checked_add(&third_term)
                .ok_or(Error::<T>::ArithmeticError)?
                .checked_sub(&first_term)
                .ok_or(Error::<T>::ArithmeticError)?,
        };
        Ok(res.into())
    }

    pub(crate) fn ensure_amm_can_be_deactivated(token: &TokenDataOf<T>) -> DispatchResult {
        let AmmCurve {
            provided_supply, ..
        } = OfferingStateOf::<T>::ensure_amm_of::<T>(token)?;
        let threshold = Self::amm_deactivation_threshold();
        let pct_of_issuance_minted = Permill::from_rational(provided_supply, token.total_supply);
        ensure!(
            pct_of_issuance_minted <= threshold,
            Error::<T>::OutstandingAmmProvidedSupplyTooLarge,
        );
        Ok(())
    }
}
