#![cfg(feature = "runtime-benchmarks")]

use frame_benchmarking::{account, benchmarks};
use frame_support::sp_runtime::traits::Bounded;
use frame_support::storage::StorageMap;
use frame_support::traits::Currency;
use frame_system::Module as System;
use frame_system::{EventRecord, RawOrigin};
use sp_arithmetic::traits::One;
use sp_runtime::traits::SaturatedConversion;
use sp_std::boxed::Box;
use sp_std::vec;
use sp_std::vec::Vec;

use balances::Module as Balances;
use common::council::CouncilBudgetManager;
use membership::Module as Membership;

use crate::{
    BalanceOf, Bounties, BountyCreationParameters, BountyCreator, BountyMilestone, Call, Event,
    Module, Trait,
};

fn assert_last_event<T: Trait>(generic_event: <T as Trait>::Event) {
    let events = System::<T>::events();
    let system_event: <T as frame_system::Trait>::Event = generic_event.into();
    // compare to the last event record
    let EventRecord { event, .. } = &events[events.len() - 1];
    assert_eq!(event, &system_event);
}

fn get_byte(num: u32, byte_number: u8) -> u8 {
    ((num & (0xff << (8 * byte_number))) >> 8 * byte_number) as u8
}

// Method to generate a distintic valid handle
// for a membership. For each index.
fn handle_from_id<T: Trait + membership::Trait>(id: u32) -> Vec<u8> {
    let mut handle = vec![];

    for i in 0..4 {
        handle.push(get_byte(id, i));
    }

    handle
}

fn member_funded_account<T: Trait + membership::Trait>(
    name: &'static str,
    id: u32,
) -> (T::AccountId, T::MemberId) {
    let account_id = account::<T::AccountId>(name, id, SEED);
    let handle = handle_from_id::<T>(id);

    // Give balance for buying membership
    let _ = Balances::<T>::make_free_balance_be(&account_id, T::Balance::max_value());

    let params = membership::BuyMembershipParameters {
        root_account: account_id.clone(),
        controller_account: account_id.clone(),
        name: None,
        handle: Some(handle),
        avatar_uri: None,
        about: None,
        referrer_id: None,
    };

    Membership::<T>::buy_membership(RawOrigin::Signed(account_id.clone()).into(), params).unwrap();

    let _ = Balances::<T>::make_free_balance_be(&account_id, T::Balance::max_value());

    (account_id, T::MemberId::from(id.saturated_into()))
}

const MAX_BYTES: u32 = 50000;
const SEED: u32 = 0;

benchmarks! {
    where_clause {
        where T: council::Trait,
              T: balances::Trait,
              T: membership::Trait,
    }
    _{ }

    create_bounty_by_council {
        let i in 1 .. MAX_BYTES;
        let metadata = vec![0u8].repeat(i as usize);
        let cherry: BalanceOf<T> = 100.into();

        T::CouncilBudgetManager::set_budget(cherry);

        let params = BountyCreationParameters::<T>{
            work_period: One::one(),
            judging_period: One::one(),
            cherry,
            ..Default::default()
        };

    }: create_bounty (RawOrigin::Root, params.clone(), metadata)
    verify {
        let bounty_id: T::BountyId = 1u32.into();

        assert!(Bounties::<T>::contains_key(bounty_id));
        assert_eq!(Module::<T>::bounty_count(), 1); // Bounty counter was updated.
        assert_last_event::<T>(Event::<T>::BountyCreated(bounty_id, params).into());
    }

    create_bounty_by_member {
        let i in 1 .. MAX_BYTES;
        let metadata = vec![0u8].repeat(i as usize);
        let cherry: BalanceOf<T> = 100.into();

        let (account_id, member_id) = member_funded_account::<T>("member1", 0);

        T::CouncilBudgetManager::set_budget(cherry);

        let params = BountyCreationParameters::<T>{
            work_period: One::one(),
            judging_period: One::one(),
            cherry,
            creator: BountyCreator::Member(member_id),
            ..Default::default()
        };

    }: create_bounty (RawOrigin::Signed(account_id), params.clone(), metadata)
    verify {
        let bounty_id: T::BountyId = 1u32.into();

        assert!(Bounties::<T>::contains_key(bounty_id));
        assert_eq!(Module::<T>::bounty_count(), 1); // Bounty counter was updated.
        assert_last_event::<T>(Event::<T>::BountyCreated(bounty_id, params).into());
    }

    cancel_bounty_by_council {
        let cherry: BalanceOf<T> = 100.into();

        T::CouncilBudgetManager::set_budget(cherry);

        let creator = BountyCreator::Council;
        let params = BountyCreationParameters::<T>{
            work_period: One::one(),
            judging_period: One::one(),
            cherry,
            creator: creator.clone(),
            ..Default::default()
        };

        Module::<T>::create_bounty(RawOrigin::Root.into(), params, Vec::new()).unwrap();

        let bounty_id: T::BountyId = Module::<T>::bounty_count().into();

        assert!(Bounties::<T>::contains_key(bounty_id));
    }: cancel_bounty(RawOrigin::Root, creator.clone(), bounty_id)
    verify {
        let bounty = <crate::Bounties<T>>::get(bounty_id);

        assert!(matches!(bounty.milestone, BountyMilestone::Canceled));
        assert_last_event::<T>(Event::<T>::BountyCanceled(bounty_id, creator).into());
    }

    cancel_bounty_by_member {
        let cherry: BalanceOf<T> = 100.into();
        let (account_id, member_id) = member_funded_account::<T>("member1", 0);

        T::CouncilBudgetManager::set_budget(cherry);

        let creator = BountyCreator::Member(member_id);

        let params = BountyCreationParameters::<T>{
            work_period: One::one(),
            judging_period: One::one(),
            cherry,
            creator: creator.clone(),
            ..Default::default()
        };

        Module::<T>::create_bounty(
            RawOrigin::Signed(account_id.clone()).into(),
            params,
            Vec::new()
        ).unwrap();

        let bounty_id: T::BountyId = Module::<T>::bounty_count().into();

        assert!(Bounties::<T>::contains_key(bounty_id));
    }: cancel_bounty(RawOrigin::Signed(account_id), creator.clone(), bounty_id)
    verify {
        let bounty = <crate::Bounties<T>>::get(bounty_id);

        assert!(matches!(bounty.milestone, BountyMilestone::Canceled));
        assert_last_event::<T>(Event::<T>::BountyCanceled(bounty_id, creator).into());
    }

    veto_bounty {
        let params = BountyCreationParameters::<T>{
            work_period: One::one(),
            judging_period: One::one(),
            ..Default::default()
        };

        Module::<T>::create_bounty(RawOrigin::Root.into(), params, Vec::new()).unwrap();

        let bounty_id: T::BountyId = Module::<T>::bounty_count().into();

        assert!(Bounties::<T>::contains_key(bounty_id));
    }: _ (RawOrigin::Root, bounty_id)
    verify {
        let bounty = <crate::Bounties<T>>::get(bounty_id);

        assert!(matches!(bounty.milestone, BountyMilestone::Canceled));
        assert_last_event::<T>(Event::<T>::BountyVetoed(bounty_id).into());
    }

    fund_bounty {
        let params = BountyCreationParameters::<T>{
            work_period: One::one(),
            judging_period: One::one(),
            ..Default::default()
        };
        // should reach default max bounty funding amount
        let amount: BalanceOf<T> = 100.into();

        let (account_id, member_id) = member_funded_account::<T>("member1", 0);

        Module::<T>::create_bounty(RawOrigin::Root.into(), params, Vec::new()).unwrap();

        let bounty_id: T::BountyId = Module::<T>::bounty_count().into();

        assert!(Bounties::<T>::contains_key(bounty_id));
    }: _ (RawOrigin::Signed(account_id.clone()), member_id, bounty_id, amount)
    verify {
        assert_eq!(Balances::<T>::usable_balance(&account_id), T::Balance::max_value() - amount);
        assert_last_event::<T>(Event::<T>::MaxFundingReached(bounty_id).into());
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::tests::mocks::{build_test_externalities, Test};
    use frame_support::assert_ok;

    #[test]
    fn create_bounty_by_council() {
        build_test_externalities().execute_with(|| {
            assert_ok!(test_benchmark_create_bounty_by_council::<Test>());
        });
    }

    #[test]
    fn create_bounty_by_member() {
        build_test_externalities().execute_with(|| {
            assert_ok!(test_benchmark_create_bounty_by_member::<Test>());
        });
    }

    #[test]
    fn cancel_bounty_by_council() {
        build_test_externalities().execute_with(|| {
            assert_ok!(test_benchmark_cancel_bounty_by_council::<Test>());
        });
    }

    #[test]
    fn cancel_bounty_by_member() {
        build_test_externalities().execute_with(|| {
            assert_ok!(test_benchmark_cancel_bounty_by_member::<Test>());
        });
    }

    #[test]
    fn veto_bounty() {
        build_test_externalities().execute_with(|| {
            assert_ok!(test_benchmark_veto_bounty::<Test>());
        });
    }

    #[test]
    fn fund_bounty() {
        build_test_externalities().execute_with(|| {
            assert_ok!(test_benchmark_fund_bounty::<Test>());
        });
    }
}
