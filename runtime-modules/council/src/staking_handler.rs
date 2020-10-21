// TODO: content of this file should be replaced by separate crate with StakingHandler
// NOTE: only StakingHandler2 is acually used, StakingHandler is original design copied from other development branch
use frame_support::dispatch::DispatchResult;

/////////////////// Trait definition ///////////////////////////////////////////

/// Member identifier in membership::member module.
#[allow(dead_code)] // following line throws dead code warning even when it is used (and removal causes error)
pub type MemberId<T> = <T as membership::Trait>::MemberId;

/// Balance alias for GovernanceCurrency from `common` module. TODO: replace with BalanceOf
#[allow(dead_code)] // following line throws dead code warning even when it is used (and removal causes error)
pub type BalanceOf<T> = <T as balances::Trait>::Balance;

// NOTE: this is copy of StakingHandler definition from `proposals_update` development branch
/// Defines abstract staking handler to manage user stakes for different activities
/// like adding a proposal. Implementation should use built-in LockableCurrency
/// and LockIdentifier to lock balance consistently with pallet_staking.
pub trait StakingHandler<T: system::Trait + membership::Trait + balances::Trait> {
    /// Locks the specified balance on the account using specific lock identifier.
    fn lock(account_id: &T::AccountId, amount: BalanceOf<T>);

    /// Removes the specified lock on the account.
    fn unlock(account_id: &T::AccountId);

    /// Slash the specified balance on the account using specific lock identifier.
    /// No limits, no actions on zero stake.
    /// If slashing balance greater than the existing stake - stake is slashed to zero.
    /// Returns actually slashed balance.
    fn slash(account_id: &T::AccountId, amount: Option<BalanceOf<T>>) -> BalanceOf<T>;

    /// Sets the new stake to a given amount.
    fn set_stake(account_id: &T::AccountId, new_stake: BalanceOf<T>) -> DispatchResult;

    /// Verifies that staking account bound to the member.
    fn is_member_staking_account(member_id: &MemberId<T>, account_id: &T::AccountId) -> bool;

    /// Verifies that there no conflicting stakes on the staking account.
    fn is_account_free_of_conflicting_stakes(account_id: &T::AccountId) -> bool;

    /// Verifies that staking account balance is sufficient for staking.
    /// During the balance check we should consider already locked stake. Effective balance to check
    /// is 'already locked funds' + 'usable funds'.
    fn is_enough_balance_for_stake(account_id: &T::AccountId, amount: BalanceOf<T>) -> bool;

    /// Returns the current stake on the account.
    fn current_stake(account_id: &T::AccountId) -> BalanceOf<T>;
}

// NOTE: this is
// Defines abstract staking handler to manage user stakes for different activities
/// like adding a proposal. Implementation should use built-in LockableCurrency
/// and LockIdentifier to lock balance consistently with pallet_staking.
pub trait StakingHandler2<AccountId, Balance, MemberId> {
    /// Locks the specified balance on the account using specific lock identifier.
    fn lock(account_id: &AccountId, amount: Balance);

    /// Removes the specified lock on the account.
    fn unlock(account_id: &AccountId);

    /// Slash the specified balance on the account using specific lock identifier.
    /// No limits, no actions on zero stake.
    /// If slashing balance greater than the existing stake - stake is slashed to zero.
    /// Returns actually slashed balance.
    fn slash(account_id: &AccountId, amount: Option<Balance>) -> Balance;

    /// Sets the new stake to a given amount.
    fn set_stake(account_id: &AccountId, new_stake: Balance) -> DispatchResult;

    /// Verifies that staking account bound to the member.
    fn is_member_staking_account(member_id: &MemberId, account_id: &AccountId) -> bool;

    /// Verifies that there no conflicting stakes on the staking account.
    fn is_account_free_of_conflicting_stakes(account_id: &AccountId) -> bool;

    /// Verifies that staking account balance is sufficient for staking.
    /// During the balance check we should consider already locked stake. Effective balance to check
    /// is 'already locked funds' + 'usable funds'.
    fn is_enough_balance_for_stake(account_id: &AccountId, amount: Balance) -> bool;

    /// Returns the current stake on the account.
    fn current_stake(account_id: &AccountId) -> Balance;
}

/////////////////// Mock implementation ////////////////////////////////////////

#[cfg(test)]
pub mod mocks {
    use super::{BalanceOf, StakingHandler, StakingHandler2};
    use common::currency::GovernanceCurrency;
    use frame_support::dispatch::DispatchResult;
    use frame_support::traits::{Currency, LockIdentifier, LockableCurrency, WithdrawReasons};
    use frame_support::{impl_outer_event, impl_outer_origin, parameter_types};
    use sp_core::H256;
    use sp_runtime::{
        testing::Header,
        traits::{BlakeTwo256, IdentityLookup},
        Perbill,
    };
    use std::cell::RefCell;
    use std::collections::HashMap;

    pub type BalanceOfCurrency<T> =
        <<T as common::currency::GovernanceCurrency>::Currency as Currency<
            <T as system::Trait>::AccountId,
        >>::Balance;

    // these lines are originally from mock.rs -> after this file is removed, move it back
    pub const VOTER_BASE_ID: u64 = 4000;
    pub const CANDIDATE_BASE_ID: u64 = VOTER_BASE_ID + VOTER_CANDIDATE_OFFSET;
    pub const VOTER_CANDIDATE_OFFSET: u64 = 1000;

    pub const STAKING_ACCOUNT_ID_FOR_FAILED_VALIDITY_CHECK: u64 = 111;
    pub const STAKING_ACCOUNT_ID_FOR_FAILED_AMOUNT_CHECK: u64 = 222;
    pub const STAKING_ACCOUNT_ID_FOR_CONFLICTING_STAKES: u64 = 333;
    pub const STAKING_ACCOUNT_ID_FOR_ZERO_STAKE: u64 = 444;
    pub const LOCK_ID_1: LockIdentifier = [0; 8];
    pub const LOCK_ID_2: LockIdentifier = [1; 8];

    // Workaround for https://github.com/rust-lang/rust/issues/26925 - remove when sorted.
    //#[derive(Clone, PartialEq, Eq, Debug)]
    //pub struct Lock1;

    #[derive(Clone, PartialEq, Eq, Debug)]
    pub struct Lock1;
    #[derive(Clone, PartialEq, Eq, Debug)]
    pub struct Lock2;

    //pub type Membership = membership::Module<Lock1>;
    pub type Balances = balances::Module<Lock1>;
    pub type System = system::Module<Lock1>;

    /////////////////// Lock1 //////////////////////////////////////////////////

    impl StakingHandler<Lock1> for Lock1 {
        fn lock(
            account_id: &<Lock1 as system::Trait>::AccountId,
            amount: BalanceOfCurrency<Lock1>,
        ) {
            <Lock1 as GovernanceCurrency>::Currency::set_lock(
                LOCK_ID_1,
                &account_id,
                amount,
                WithdrawReasons::all(),
            )
        }

        fn unlock(account_id: &<Lock1 as system::Trait>::AccountId) {
            <Lock1 as GovernanceCurrency>::Currency::remove_lock(LOCK_ID_1, &account_id);
        }

        fn slash(
            account_id: &<Lock1 as system::Trait>::AccountId,
            amount: Option<BalanceOfCurrency<Lock1>>,
        ) -> BalanceOfCurrency<Lock1> {
            let locks = Balances::locks(&account_id);

            let existing_lock = locks.iter().find(|lock| lock.id == LOCK_ID_1);

            let mut actually_slashed_balance = Default::default();
            if let Some(existing_lock) = existing_lock {
                <Self as StakingHandler<Self>>::unlock(&account_id);

                let mut slashable_amount = existing_lock.amount;
                if let Some(amount) = amount {
                    if existing_lock.amount > amount {
                        let new_amount = existing_lock.amount - amount;
                        <Self as StakingHandler<Self>>::lock(&account_id, new_amount);

                        slashable_amount = amount;
                    }
                }

                let _ = Balances::slash(&account_id, slashable_amount);

                actually_slashed_balance = slashable_amount
            }

            actually_slashed_balance
        }

        fn set_stake(
            account_id: &<Lock2 as system::Trait>::AccountId,
            new_stake: BalanceOf<Lock2>,
        ) -> DispatchResult {
            <Self as StakingHandler<Self>>::unlock(account_id);
            <Self as StakingHandler<Self>>::lock(account_id, new_stake);

            Ok(())
        }

        fn is_member_staking_account(_member_id: &u64, account_id: &u64) -> bool {
            if *account_id == STAKING_ACCOUNT_ID_FOR_FAILED_VALIDITY_CHECK {
                return false;
            }

            true
        }

        fn is_account_free_of_conflicting_stakes(account_id: &u64) -> bool {
            if *account_id == STAKING_ACCOUNT_ID_FOR_CONFLICTING_STAKES {
                return false;
            }

            true
        }

        fn is_enough_balance_for_stake(account_id: &u64, amount: u64) -> bool {
            if *account_id == STAKING_ACCOUNT_ID_FOR_FAILED_AMOUNT_CHECK || amount > 1000 {
                return false;
            }

            true
        }

        fn current_stake(account_id: &u64) -> u64 {
            if *account_id == STAKING_ACCOUNT_ID_FOR_ZERO_STAKE {
                return 0;
            }

            100 // random non-zero value
        }
    }

    /////////////////// StakingHandler2 impl ///////////////////////////////////

    thread_local! {
        pub static LOCKED_VALUES_LOCK1: RefCell<HashMap<u64, BalanceOfCurrency<Lock1>>> = RefCell::new(HashMap::new());
        pub static LOCKED_VALUES_LOCK2: RefCell<HashMap<u64, BalanceOfCurrency<Lock2>>> = RefCell::new(HashMap::new());
    }

    impl
        StakingHandler2<
            <Lock1 as system::Trait>::AccountId,
            BalanceOf<Lock1>,
            <Lock1 as membership::Trait>::MemberId,
        > for Lock1
    {
        fn lock(
            account_id: &<Lock1 as system::Trait>::AccountId,
            amount: BalanceOfCurrency<Lock1>,
        ) {
            <Lock1 as GovernanceCurrency>::Currency::set_lock(
                LOCK_ID_1,
                &account_id,
                amount,
                WithdrawReasons::all(),
            );

            LOCKED_VALUES_LOCK1.with(|value| value.borrow_mut().insert(*account_id, amount));
        }

        fn unlock(account_id: &<Lock1 as system::Trait>::AccountId) {
            <Lock1 as GovernanceCurrency>::Currency::remove_lock(LOCK_ID_1, &account_id);

            LOCKED_VALUES_LOCK1.with(|value| value.borrow_mut().insert(*account_id, 0));
        }

        fn slash(
            account_id: &<Lock1 as system::Trait>::AccountId,
            amount: Option<BalanceOfCurrency<Lock1>>,
        ) -> BalanceOfCurrency<Lock1> {
            let locks = Balances::locks(&account_id);

            let existing_lock = locks.iter().find(|lock| lock.id == LOCK_ID_1);

            let mut actually_slashed_balance = Default::default();
            if let Some(existing_lock) = existing_lock {
                <Self as StakingHandler2<
                    <Lock1 as system::Trait>::AccountId,
                    BalanceOf<Lock1>,
                    <Lock1 as membership::Trait>::MemberId,
                >>::unlock(&account_id);

                let mut slashable_amount = existing_lock.amount;
                if let Some(amount) = amount {
                    if existing_lock.amount > amount {
                        let new_amount = existing_lock.amount - amount;
                        <Self as StakingHandler2<
                            <Lock1 as system::Trait>::AccountId,
                            BalanceOf<Lock1>,
                            <Lock1 as membership::Trait>::MemberId,
                        >>::lock(&account_id, new_amount);

                        slashable_amount = amount;
                    }
                }

                let _ = Balances::slash(&account_id, slashable_amount);

                actually_slashed_balance = slashable_amount
            }

            actually_slashed_balance
        }

        fn set_stake(
            account_id: &<Lock1 as system::Trait>::AccountId,
            new_stake: BalanceOf<Lock1>,
        ) -> DispatchResult {
            <Self as StakingHandler2<
                <Lock1 as system::Trait>::AccountId,
                BalanceOf<Lock1>,
                <Lock1 as membership::Trait>::MemberId,
            >>::unlock(account_id);
            <Self as StakingHandler2<
                <Lock1 as system::Trait>::AccountId,
                BalanceOf<Lock1>,
                <Lock1 as membership::Trait>::MemberId,
            >>::lock(account_id, new_stake);

            Ok(())
        }

        fn is_member_staking_account(member_id: &u64, account_id: &u64) -> bool {
            // all possible generated candidates
            account_id == member_id
                && account_id >= &CANDIDATE_BASE_ID
                && account_id < &(CANDIDATE_BASE_ID + VOTER_CANDIDATE_OFFSET)
        }

        fn is_account_free_of_conflicting_stakes(account_id: &u64) -> bool {
            if *account_id == STAKING_ACCOUNT_ID_FOR_CONFLICTING_STAKES {
                return false;
            }

            true
        }

        fn is_enough_balance_for_stake(account_id: &u64, _amount: u64) -> bool {
            if *account_id == STAKING_ACCOUNT_ID_FOR_FAILED_AMOUNT_CHECK {
                return false;
            }

            true
        }

        fn current_stake(account_id: &u64) -> u64 {
            LOCKED_VALUES_LOCK1.with(|value| match value.borrow().get(account_id) {
                Some(current_stake) => *current_stake,
                None => 0,
            })
        }
    }

    impl
        StakingHandler2<
            <Lock2 as system::Trait>::AccountId,
            BalanceOf<Lock2>,
            <Lock2 as membership::Trait>::MemberId,
        > for Lock2
    {
        fn lock(
            account_id: &<Lock2 as system::Trait>::AccountId,
            amount: BalanceOfCurrency<Lock2>,
        ) {
            <Lock2 as GovernanceCurrency>::Currency::set_lock(
                LOCK_ID_2,
                &account_id,
                amount,
                WithdrawReasons::all(),
            );

            LOCKED_VALUES_LOCK2.with(|value| value.borrow_mut().insert(*account_id, amount));
        }

        fn unlock(account_id: &<Lock2 as system::Trait>::AccountId) {
            <Lock2 as GovernanceCurrency>::Currency::remove_lock(LOCK_ID_2, &account_id);

            LOCKED_VALUES_LOCK2.with(|value| value.borrow_mut().insert(*account_id, 0));
        }

        fn slash(
            account_id: &<Lock2 as system::Trait>::AccountId,
            amount: Option<BalanceOfCurrency<Lock2>>,
        ) -> BalanceOfCurrency<Lock2> {
            let locks = Balances::locks(&account_id);

            let existing_lock = locks.iter().find(|lock| lock.id == LOCK_ID_2);

            let mut actually_slashed_balance = Default::default();
            if let Some(existing_lock) = existing_lock {
                <Self as StakingHandler2<
                    <Lock2 as system::Trait>::AccountId,
                    BalanceOf<Lock2>,
                    <Lock2 as membership::Trait>::MemberId,
                >>::unlock(&account_id);

                let mut slashable_amount = existing_lock.amount;
                if let Some(amount) = amount {
                    if existing_lock.amount > amount {
                        let new_amount = existing_lock.amount - amount;
                        <Self as StakingHandler2<
                            <Lock2 as system::Trait>::AccountId,
                            BalanceOf<Lock2>,
                            <Lock2 as membership::Trait>::MemberId,
                        >>::lock(&account_id, new_amount);

                        slashable_amount = amount;
                    }
                }

                let _ = Balances::slash(&account_id, slashable_amount);

                actually_slashed_balance = slashable_amount
            }

            actually_slashed_balance
        }

        fn set_stake(
            account_id: &<Lock2 as system::Trait>::AccountId,
            new_stake: BalanceOf<Lock2>,
        ) -> DispatchResult {
            <Self as StakingHandler2<
                <Lock2 as system::Trait>::AccountId,
                BalanceOf<Lock2>,
                <Lock2 as membership::Trait>::MemberId,
            >>::unlock(account_id);
            <Self as StakingHandler2<
                <Lock2 as system::Trait>::AccountId,
                BalanceOf<Lock2>,
                <Lock2 as membership::Trait>::MemberId,
            >>::lock(account_id, new_stake);

            Ok(())
        }

        fn is_member_staking_account(member_id: &u64, account_id: &u64) -> bool {
            // all possible generated candidates
            account_id == member_id
                && account_id >= &CANDIDATE_BASE_ID
                && account_id < &(CANDIDATE_BASE_ID + VOTER_CANDIDATE_OFFSET)
        }

        fn is_account_free_of_conflicting_stakes(account_id: &u64) -> bool {
            if *account_id == STAKING_ACCOUNT_ID_FOR_CONFLICTING_STAKES {
                return false;
            }

            true
        }

        fn is_enough_balance_for_stake(account_id: &u64, _amount: u64) -> bool {
            if *account_id == STAKING_ACCOUNT_ID_FOR_FAILED_AMOUNT_CHECK {
                return false;
            }

            true
        }

        fn current_stake(account_id: &u64) -> u64 {
            LOCKED_VALUES_LOCK2.with(|value| match value.borrow().get(account_id) {
                Some(current_stake) => *current_stake,
                None => 0,
            })
        }
    }

    parameter_types! {
        pub const BlockHashCount: u64 = 250;
        pub const MaximumBlockWeight: u32 = 1024;
        pub const MaximumBlockLength: u32 = 2 * 1024;
        pub const AvailableBlockRatio: Perbill = Perbill::one();
        pub const MinimumPeriod: u64 = 5;
        pub const ExistentialDeposit: u32 = 0;
    }

    mod membership_mod {
        pub use membership::Event;
    }

    impl_outer_event! {
        pub enum TestEvent for Lock1 {
            balances<T>,
            membership_mod<T>,
            system<T>,
        }
    }

    impl membership::Trait for Lock1 {
        type Event = TestEvent;
        type MemberId = u64;
        type PaidTermId = u64;
        type SubscriptionId = u64;
        type ActorId = u64;
    }

    impl timestamp::Trait for Lock1 {
        type Moment = u64;
        type OnTimestampSet = ();
        type MinimumPeriod = MinimumPeriod;
    }

    impl common::currency::GovernanceCurrency for Lock1 {
        type Currency = Balances;
    }

    impl balances::Trait for Lock1 {
        type Balance = u64;
        type DustRemoval = ();
        type Event = TestEvent;
        type ExistentialDeposit = ExistentialDeposit;
        type AccountStore = System;
    }

    impl_outer_origin! {
        pub enum Origin for Lock1 {}
    }

    impl system::Trait for Lock1 {
        type BaseCallFilter = ();
        type Origin = Origin;
        type Index = u64;
        type BlockNumber = u64;
        type Call = ();
        type Hash = H256;
        type Hashing = BlakeTwo256;
        type AccountId = u64;
        type Lookup = IdentityLookup<Self::AccountId>;
        type Header = Header;
        type Event = TestEvent;
        type BlockHashCount = BlockHashCount;
        type MaximumBlockWeight = MaximumBlockWeight;
        type DbWeight = ();
        type BlockExecutionWeight = ();
        type ExtrinsicBaseWeight = ();
        type MaximumExtrinsicWeight = ();
        type MaximumBlockLength = MaximumBlockLength;
        type AvailableBlockRatio = AvailableBlockRatio;
        type Version = ();
        type ModuleToIndex = ();
        type AccountData = balances::AccountData<u64>;
        type OnNewAccount = ();
        type OnKilledAccount = ();
    }

    /////////////////// Lock2 //////////////////////////////////////////////////

    impl StakingHandler<Lock2> for Lock2 {
        fn lock(
            account_id: &<Lock2 as system::Trait>::AccountId,
            amount: BalanceOfCurrency<Lock2>,
        ) {
            <Lock2 as GovernanceCurrency>::Currency::set_lock(
                LOCK_ID_2,
                &account_id,
                amount,
                WithdrawReasons::all(),
            )
        }

        fn unlock(account_id: &<Lock2 as system::Trait>::AccountId) {
            <Lock2 as GovernanceCurrency>::Currency::remove_lock(LOCK_ID_2, &account_id);
        }

        fn slash(
            account_id: &<Lock2 as system::Trait>::AccountId,
            amount: Option<BalanceOfCurrency<Lock2>>,
        ) -> BalanceOfCurrency<Lock2> {
            let locks = Balances::locks(&account_id);

            let existing_lock = locks.iter().find(|lock| lock.id == LOCK_ID_2);

            let mut actually_slashed_balance = Default::default();
            if let Some(existing_lock) = existing_lock {
                <Self as StakingHandler<Self>>::unlock(&account_id);

                let mut slashable_amount = existing_lock.amount;
                if let Some(amount) = amount {
                    if existing_lock.amount > amount {
                        let new_amount = existing_lock.amount - amount;
                        <Self as StakingHandler<Self>>::lock(&account_id, new_amount);

                        slashable_amount = amount;
                    }
                }

                let _ = Balances::slash(&account_id, slashable_amount);

                actually_slashed_balance = slashable_amount
            }

            actually_slashed_balance
        }

        fn set_stake(
            account_id: &<Lock2 as system::Trait>::AccountId,
            new_stake: BalanceOf<Lock2>,
        ) -> DispatchResult {
            <Self as StakingHandler<Self>>::unlock(account_id);
            <Self as StakingHandler<Self>>::lock(account_id, new_stake);

            Ok(())
        }

        fn is_member_staking_account(_member_id: &u64, account_id: &u64) -> bool {
            if *account_id == STAKING_ACCOUNT_ID_FOR_FAILED_VALIDITY_CHECK {
                return false;
            }

            true
        }

        fn is_account_free_of_conflicting_stakes(account_id: &u64) -> bool {
            if *account_id == STAKING_ACCOUNT_ID_FOR_CONFLICTING_STAKES {
                return false;
            }

            true
        }

        fn is_enough_balance_for_stake(account_id: &u64, amount: u64) -> bool {
            if *account_id == STAKING_ACCOUNT_ID_FOR_FAILED_AMOUNT_CHECK || amount > 1000 {
                return false;
            }

            true
        }

        fn current_stake(account_id: &u64) -> u64 {
            if *account_id == STAKING_ACCOUNT_ID_FOR_ZERO_STAKE {
                return 0;
            }

            100 // random non-zero value
        }
    }

    impl membership::Trait for Lock2 {
        type Event = TestEvent;
        type MemberId = u64;
        type PaidTermId = u64;
        type SubscriptionId = u64;
        type ActorId = u64;
    }

    impl timestamp::Trait for Lock2 {
        type Moment = u64;
        type OnTimestampSet = ();
        type MinimumPeriod = MinimumPeriod;
    }

    impl common::currency::GovernanceCurrency for Lock2 {
        type Currency = Balances;
    }

    impl balances::Trait for Lock2 {
        type Balance = u64;
        type DustRemoval = ();
        type Event = TestEvent;
        type ExistentialDeposit = ExistentialDeposit;
        type AccountStore = System;
    }

    impl system::Trait for Lock2 {
        type BaseCallFilter = ();
        type Origin = Origin;
        type Index = u64;
        type BlockNumber = u64;
        type Call = ();
        type Hash = H256;
        type Hashing = BlakeTwo256;
        type AccountId = u64;
        type Lookup = IdentityLookup<Self::AccountId>;
        type Header = Header;
        type Event = TestEvent;
        type BlockHashCount = BlockHashCount;
        type MaximumBlockWeight = MaximumBlockWeight;
        type DbWeight = ();
        type BlockExecutionWeight = ();
        type ExtrinsicBaseWeight = ();
        type MaximumExtrinsicWeight = ();
        type MaximumBlockLength = MaximumBlockLength;
        type AvailableBlockRatio = AvailableBlockRatio;
        type Version = ();
        type ModuleToIndex = ();
        type AccountData = balances::AccountData<u64>;
        type OnNewAccount = ();
        type OnKilledAccount = ();
    }
}
