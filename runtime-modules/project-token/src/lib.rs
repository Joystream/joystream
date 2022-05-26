// Compiler demand.
#![recursion_limit = "256"]

use codec::FullCodec;
use common::membership::{MemberId as MemberIdOf, MemberOriginValidator, MembershipInfoProvider};
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
    ModuleId, Permill,
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
pub trait Trait:
    frame_system::Trait + balances::Trait + storage::Trait + membership::Trait
{
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

    /// Member origin validator
    type MemberOriginValidator: MemberOriginValidator<
        Self::Origin,
        MemberIdOf<Self>,
        Self::AccountId,
    >;

    /// Membership info provider
    type MembershipInfoProvider: MembershipInfoProvider<Self>;

    /// Min number of block in a revenue split period
    type MinRevenueSplitDuration: Get<<Self as frame_system::Trait>::BlockNumber>;
}

decl_storage! {
    trait Store for Module<T: Trait> as Token {
        /// Double map TokenId x MemberId => AccountData for managing account data
        pub AccountInfoByTokenAndMember get(fn account_info_by_token_and_member) config():
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
    }

    add_extra_genesis {
        build(|_| {
            // We deposit some initial balance to the pallet's module account
            // on the genesis block to protect the account
            // from being deleted ("dusted") on early stages of pallet's work
            // by the "garbage collector" of the balances pallet.
            // It should be equal to at least `ExistentialDeposit` from the balances pallet
            // setting.
            // Original issues:
            // - https://github.com/Joystream/joystream/issues/3497
            // - https://github.com/Joystream/joystream/issues/3510

            let module_account_id = crate::Module::<T>::module_treasury_account();
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
        #[weight = 10_000_000] // TODO: adjust weight
        pub fn transfer(
            origin,
            src_member_id: T::MemberId,
            token_id: T::TokenId,
            outputs: TransfersOf<T>,
        ) -> DispatchResult {
            let sender = T::MemberOriginValidator::ensure_member_controller_account_origin(
                origin,
                src_member_id
            )?;
            let treasury = Self::module_treasury_account();

            // Currency transfer preconditions
            let validated_transfers = Self::ensure_can_transfer(token_id, &sender, &src_member_id, &treasury, outputs.into(), false)?;

            // == MUTATION SAFE ==

            Self::do_transfer(token_id, &sender, &src_member_id, &treasury, &validated_transfers);

            Self::deposit_event(RawEvent::TokenAmountTransferred(
                token_id,
                src_member_id,
                validated_transfers,
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
        #[weight = 10_000_000] // TODO: adjust weight
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
            AccountInfoByTokenAndMember::<T>::mutate(token_id, member_id, |account| {
                account.burn::<T>(amount, now);
            });

            // Decrease token supply by the burned amount
            TokenInfoById::<T>::mutate(token_id, |token| {
                token.decrease_supply_by(amount);
            });

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
        #[weight = 10_000_000] // TODO: adjust weight
        pub fn dust_account(origin, token_id: T::TokenId, member_id: T::MemberId) -> DispatchResult {
            let sender = ensure_signed(origin)?;
            let token_info = Self::ensure_token_exists(token_id)?;
            let account_to_remove_info = Self::ensure_account_data_exists(token_id, &member_id)?;
            let member_controller = T::MembershipInfoProvider::controller_account_id(member_id)?;
            let treasury = Self::module_treasury_account();
            let bloat_bond = account_to_remove_info.bloat_bond;

            Self::ensure_user_can_dust_account(
                &token_info.transfer_policy,
                &sender,
                &member_controller,
                &account_to_remove_info,
            )?;

            Self::ensure_can_transfer_joy(&treasury, &[(&member_controller, bloat_bond)])?;

            // == MUTATION SAFE ==
            AccountInfoByTokenAndMember::<T>::remove(token_id, &member_id);

            TokenInfoById::<T>::mutate(token_id, |token_info| {
                token_info.decrement_accounts_number();
            });


            Self::transfer_joy(&treasury, &member_controller, bloat_bond);

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
        #[weight = 10_000_000] // TODO: adjust weights
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
            let treasury = Self::module_treasury_account();

            // No project_token or balances state corrupted in case of failure
            Self::ensure_can_transfer_joy(&sender, &[(&treasury, bloat_bond)])?;

            // == MUTATION SAFE ==

            Self::transfer_joy(&sender, &treasury, bloat_bond);

            Self::do_insert_new_account_for_token(
                token_id,
                &member_id,
                AccountDataOf::<T>::new_with_amount_and_bond(
                    <T as Trait>::Balance::zero(),
                    bloat_bond,
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
        /// - total number of tokens already purchased by the member on the current sale
        ///   PLUS `amount` must not exceed sale's purchase cap per member
        /// - if Permissioned token:
        ///   - AccountInfoByTokenAndMember(token_id, &member_id) must exist
        /// - if `sale.vesting_schedule.is_some()`:
        ///   - number of sender account's ongoing vesting schedules
        ///     must be < MaxVestingSchedulesPerAccountPerToken
        ///
        /// Postconditions:
        /// - let `fee_amount` be `sale_platform_fee.mul_floor(amount * sale.unit_price)`
        /// - `amount * sale.unit_price - fee_amount` JOY tokens are transfered from `sender`
        ///   to `sale.tokens_source` member controller account
        /// - `fee_amount` JOY is slashed from `sender` balance
        /// - if new account created: `bloat_bond` transferred from `sender` to treasury
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
        /// - if `token_data.sale.quantity_left - amount > 0`:
        ///   - `token_data.sale.quantity_left` is decreased by `amount`
        /// - if `token_data.sale.quantity_left - amount == 0`:
        ///   - `token_data.sale` is set to None
        #[weight = 10_000_000] // TODO: adjust weight
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
            let sale_id = token_data.next_sale_id - 1;
            let platform_fee = Self::sale_platform_fee();
            let joy_amount = sale.unit_price.saturating_mul(amount.into());
            let fee_amount = platform_fee.mul_floor(joy_amount);
            let transfer_amount = joy_amount.saturating_sub(fee_amount);
            let account_data = Self::ensure_account_data_exists(token_id, &member_id).ok();
            let bloat_bond = Self::bloat_bond();
            let sale_source_controller =
                T::MembershipInfoProvider::controller_account_id(sale.tokens_source)?;
            let vesting_schedule = sale.get_vesting_schedule(amount);
            let treasury = Self::module_treasury_account();

            // Ensure buyer can perform the required JOY transfers
            let destinations = if account_data.is_some() {
                vec![(&sale_source_controller, transfer_amount)]
            } else {
                vec![(&sale_source_controller, transfer_amount), (&treasury, bloat_bond)]
            };
            let remaining_balance = Self::ensure_can_transfer_joy(&sender, &destinations)?;

            // Ensure remaining balance after transfers is >= fee_amount + existential_deposit
            ensure!(
                remaining_balance >= fee_amount.saturating_add(T::JoyExistentialDeposit::get()),
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

            Self::transfer_joy(
                &sender,
                &sale_source_controller,
                transfer_amount
            );

            if !fee_amount.is_zero() {
                let _ = <Joy::<T> as Currency<T::AccountId>>::slash(
                    &sender,
                    fee_amount
                );
            }

            if account_data.is_some() {
                AccountInfoByTokenAndMember::<T>::mutate(token_id, &member_id, |acc_data| {
                    acc_data.process_sale_purchase(
                        sale_id,
                        amount,
                        vesting_schedule,
                        vesting_cleanup_key
                    );
                });
            } else {
                Self::transfer_joy(&sender, &treasury, bloat_bond);
                Self::do_insert_new_account_for_token(
                    token_id,
                    &member_id,
                    AccountDataOf::<T>
                        ::new_with_amount_and_bond(TokenBalanceOf::<T>::zero(), bloat_bond)
                        .process_sale_purchase(
                            sale_id,
                            amount,
                            vesting_schedule,
                            vesting_cleanup_key
                        ).clone()
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

            Self::deposit_event(RawEvent::TokensPurchasedOnSale(token_id, sale_id, amount, member_id));

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
            AccountInfoByTokenAndMember::<T>::mutate(
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
        #[weight = 10_000_000] // TODO: adjust weight
        fn participate_in_split(
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
            Self::ensure_can_transfer_joy(&treasury_account, &[(&sender, dividend_amount)])?;

            // == MUTATION SAFE ==

            Self::transfer_joy(
                &treasury_account,
                &sender,
                dividend_amount
            );

            TokenInfoById::<T>::mutate(token_id, |token_info| {
                token_info.revenue_split.account_for_dividend(dividend_amount);
            });

            AccountInfoByTokenAndMember::<T>::mutate(token_id, &member_id, |account_info| {
                account_info.stake(token_info.next_revenue_split_id - 1, amount);
            });

            Self::deposit_event(RawEvent::UserParticipatedInSplit(
                token_id,
                member_id,
                amount,
                dividend_amount,
                token_info.next_revenue_split_id - 1,
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
        #[weight = 10_000_000] // TODO: adjust weight
        fn exit_revenue_split(origin, token_id: T::TokenId, member_id: T::MemberId) -> DispatchResult {
            T::MemberOriginValidator::ensure_member_controller_account_origin(
                origin,
                member_id
            )?;

            let token_info = Self::ensure_token_exists(token_id)?;

            let account_info = Self::ensure_account_data_exists(token_id, &member_id)?;
            let staking_info = account_info.ensure_account_is_valid_split_participant::<T>()?;

            // staking_info.split_id in [0,token_info.next_revenue_split_id) is a runtime invariant
            if staking_info.split_id == token_info.next_revenue_split_id - 1 {
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
    }
}

impl<T: Trait>
    PalletToken<
        T::MemberId,
        <T as frame_system::Trait>::AccountId,
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

    type ReserveBalance = JoyBalanceOf<T>;

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
        let unclaimed_patronage = token_info.unclaimed_patronage_at_block(now);

        if unclaimed_patronage.is_zero() {
            return Ok(());
        }

        // == MUTATION SAFE ==

        AccountInfoByTokenAndMember::<T>::mutate(token_id, &member_id, |account_info| {
            account_info.increase_amount_by(unclaimed_patronage)
        });

        TokenInfoById::<T>::mutate(token_id, |token_info| {
            token_info.increase_supply_by(unclaimed_patronage);
            token_info.set_unclaimed_tally_patronage_at_block(<T as Trait>::Balance::zero(), now);
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
        let treasury = Self::module_treasury_account();
        Self::ensure_can_transfer_joy(&issuer_account, &[(&treasury, total_bloat_bond)])?;

        // == MUTATION SAFE ==
        SymbolsUsed::<T>::insert(&token_data.symbol, ());
        TokenInfoById::<T>::insert(token_id, token_data);
        NextTokenId::<T>::put(token_id.saturating_add(T::TokenId::one()));

        Self::transfer_joy(&issuer_account, &treasury, total_bloat_bond);

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
    /// - `src_member_id` x `token_id` account must exist
    /// - `src_member_id` member's controller account must have enough JOYs to cover
    ///    the total bloat bond required in case of destination(s) not existing.
    /// - source account must have enough token funds to cover all the transfers
    /// - each account in `outputs` must have the number of ongoing `vesting_schedules` <
    ///   MaxVestingSchedulesPerAccountPerToken in case `vesting_schedule` was provided
    ///   in the output
    //
    /// Postconditions:
    /// - source account tokens amount decreased by `amount`.
    /// - total bloat bond transferred from `src_member_id` member controller account's
    ///   to module treasury account
    /// - `outputs.beneficiary` tokens amount increased by `amount`
    /// - if `vesting_schedule` provided in the output - vesting schedule added to
    ///   `outputs.beneficiary` account data
    /// - if number of `vesting_schedules` in `outputs.beneficiary` account data was equal to
    ///   MaxVestingSchedulesPerAccountPerToken - some finished vesting_schedule is dropped
    ///   from beneficiary'es `account_data`
    fn issuer_transfer(
        src_member_id: T::MemberId,
        token_id: T::TokenId,
        outputs: TransfersWithVestingOf<T>,
    ) -> DispatchResult {
        let src_controller_account =
            T::MembershipInfoProvider::controller_account_id(src_member_id)?;
        let treasury = Self::module_treasury_account();

        // Currency transfer preconditions
        let validated_transfers = Self::ensure_can_transfer(
            token_id,
            &src_controller_account,
            &src_member_id,
            &treasury,
            outputs,
            true,
        )?;

        // == MUTATION SAFE ==

        Self::do_transfer(
            token_id,
            &src_controller_account,
            &src_member_id,
            &treasury,
            &validated_transfers,
        );

        Self::deposit_event(RawEvent::TokenAmountTransferredByIssuer(
            token_id,
            src_member_id,
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
        AccountInfoByTokenAndMember::<T>::mutate(token_id, &sale_params.tokens_source, |ad| {
            ad.decrease_amount_by(sale_params.upper_bound_quantity);
        });

        TokenInfoById::<T>::mutate(token_id, |t| {
            t.sale = Some(sale);
            t.next_sale_id = t.next_sale_id.saturating_add(1);
        });

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
                start_block >= <frame_system::Module<T>>::block_number(),
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
    /// - `allocation_amount > 0`
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
        allocation_source: T::AccountId,
        allocation_amount: JoyBalanceOf<T>,
    ) -> DispatchResult {
        ensure!(
            !allocation_amount.is_zero(),
            Error::<T>::CannotIssueSplitWithZeroAllocationAmount,
        );

        let token_info = Self::ensure_token_exists(token_id)?;

        token_info.revenue_split.ensure_inactive::<T>()?;

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
        Self::ensure_can_transfer_joy(
            &allocation_source,
            &[(&treasury_account, allocation_amount)],
        )?;

        // == MUTATION SAFE ==

        // tranfer allocation keeping the source account alive
        Self::transfer_joy(&allocation_source, &treasury_account, allocation_amount);

        TokenInfoById::<T>::mutate(token_id, |token_info| {
            token_info.activate_new_revenue_split(allocation_amount, timeline);
        });

        Self::deposit_event(RawEvent::RevenueSplitIssued(
            token_id,
            revenue_split_start,
            duration,
            allocation_amount,
        ));

        Ok(())
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

        Self::transfer_joy(&treasury_account, &account_id, amount_to_withdraw);

        TokenInfoById::<T>::mutate(token_id, |token_info| token_info.deactivate_revenue_split());

        Self::deposit_event(RawEvent::RevenueSplitFinalized(
            token_id,
            account_id,
            amount_to_withdraw,
        ));

        Ok(())
    }
}

/// Module implementation
impl<T: Trait> Module<T> {
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
        src_controller_account: &T::AccountId,
        src_member_id: &T::MemberId,
        treasury: &T::AccountId,
        transfers: TransfersWithVestingOf<T>,
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
        Self::ensure_can_transfer_joy(
            src_controller_account,
            &[(&treasury, cumulative_bloat_bond)],
        )?;

        Ok(validated_transfers)
    }

    /// Perform balance accounting for balances
    pub(crate) fn do_transfer(
        token_id: T::TokenId,
        src_controller_account: &T::AccountId,
        src_member_id: &T::MemberId,
        treasury: &T::AccountId,
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
                    Validated::<_>::Existing(dst_member_id) => {
                        AccountInfoByTokenAndMember::<T>::mutate(
                            token_id,
                            &dst_member_id,
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
                    Validated::<_>::NonExisting(dst_member_id) => {
                        Self::do_insert_new_account_for_token(
                            token_id,
                            &dst_member_id,
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
            Self::transfer_joy(src_controller_account, treasury, cumulative_bloat_bond);
        }

        AccountInfoByTokenAndMember::<T>::mutate(token_id, &src_member_id, |account_data| {
            account_data.decrease_amount_by(validated_transfers.total_amount());
        });
    }

    pub(crate) fn current_block() -> T::BlockNumber {
        <frame_system::Module<T>>::block_number()
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
        let perc_of_the_supply = Permill::from_rational_approximation(user_staked_amount, supply);
        perc_of_the_supply.mul_floor(split_allocation)
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
        purchase_amount: <T as Trait>::Balance,
        cap: <T as Trait>::Balance,
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
        <T as Trait>::ModuleId::get().into_sub_account(Vec::<u8>::new())
    }

    pub(crate) fn validate_destination(
        dst: T::MemberId,
        dst_acc_data: &Option<AccountDataOf<T>>,
        transfer_policy: &TransferPolicyOf<T>,
        is_issuer: bool,
    ) -> Result<Validated<T::MemberId>, DispatchError> {
        if let TransferPolicy::Permissioned(_) = transfer_policy {
            ensure!(
                is_issuer || dst_acc_data.is_some(),
                Error::<T>::AccountInformationDoesNotExist
            );
        }
        ensure!(
            T::MembershipInfoProvider::controller_account_id(dst).is_ok(),
            Error::<T>::TransferDestinationMemberDoesNotExist
        );
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
        destinations: &[(&T::AccountId, JoyBalanceOf<T>)],
    ) -> Result<JoyBalanceOf<T>, DispatchError> {
        let total_amount: JoyBalanceOf<T> = destinations
            .iter()
            .map(|(_, amount)| amount)
            .fold(JoyBalanceOf::<T>::zero(), |total, current| {
                total.saturating_add(*current)
            });
        let src_usable_balance = Joy::<T>::usable_balance(src);
        if !total_amount.is_zero() {
            ensure!(
                src_usable_balance >= T::JoyExistentialDeposit::get().saturating_add(total_amount),
                Error::<T>::InsufficientJoyBalance
            );
            for (dst, amount) in destinations {
                ensure!(
                    Joy::<T>::free_balance(*dst).saturating_add(*amount)
                        >= T::JoyExistentialDeposit::get(),
                    Error::<T>::JoyTransferSubjectToDusting
                );
            }
        }
        Ok(src_usable_balance.saturating_sub(total_amount))
    }

    pub(crate) fn transfer_joy(src: &T::AccountId, dst: &T::AccountId, amount: JoyBalanceOf<T>) {
        let _ = <Joy<T> as Currency<T::AccountId>>::transfer(
            src,
            &dst,
            amount,
            ExistenceRequirement::KeepAlive,
        );
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
