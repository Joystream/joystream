use super::*;
use crate::mock::*;

use mockall::predicate::*;
use mocktopus::mocking::*;
use rstd::rc::Rc;

#[test]
fn get_opt_stake_amount_succeeds_with_empty_stake_id() {
    build_test_externalities().execute_with(|| {
        let no_stake = Hiring::get_opt_stake_amount(None);

        assert_eq!(no_stake, 0)
    })
}

#[test]
#[should_panic]
fn get_opt_stake_amount_panics_with_non_existing_stake() {
    build_test_externalities().execute_with(|| {
        Hiring::get_opt_stake_amount(Some(0));
    });
}

//// Prevents panic message in console
//fn panics<F: std::panic::RefUnwindSafe + Fn()>(should_panic_func : F) -> bool {
//	let default_hook = panic::take_hook();
//	panic::set_hook(Box::new(|_info| {}));
//
//	// prevent panic message in console
//	let result = panic::catch_unwind(|| {
//		should_panic_func()
//	});
//
//	//restore default behaviour
//	panic::set_hook(default_hook);
//
//	result.is_err()
//}

#[test]
#[should_panic]
fn get_opt_stake_amount_panics_with_incorrect_stake_status() {
    build_test_externalities().execute_with(|| {
        let mock = {
            let mut mock = crate::MockStakeHandler::<Test>::new();
            mock.expect_stake_exists()
                .with(eq(0))
                .times(1)
                .returning(|_| true);

            mock.expect_get_stake()
                .with(eq(0))
                .times(1)
                .returning(|_| stake::Stake {
                    created: 1,
                    staking_status: stake::StakingStatus::NotStaked,
                });

            Rc::new(mock)
        };
        set_mock(mock);

        Hiring::get_opt_stake_amount(Some(0));
    })
}

fn set_mock(mock: Rc<crate::MockStakeHandler<Test>>) {
    Hiring::staking.mock_safe(move || MockResult::Return(mock.clone()));
}

#[test]
fn get_opt_stake_amount_succeeds() {
    build_test_externalities().execute_with(|| {
        let mock = {
            let mut mock = crate::MockStakeHandler::<Test>::new();
            mock.expect_stake_exists()
                .with(eq(0))
                .times(1)
                .returning(|_| true);

            mock.expect_get_stake()
                .with(eq(0))
                .times(1)
                .returning(|_| stake::Stake {
                    created: 1,
                    staking_status: stake::StakingStatus::Staked(stake::StakedState {
                        staked_amount: 100,
                        staked_status: stake::StakedStatus::Normal,
                        next_slash_id: 0,
                        ongoing_slashes: BTreeMap::new(),
                    }),
                });

            Rc::new(mock)
        };
        set_mock(mock);

        assert_eq!(Hiring::get_opt_stake_amount(Some(0)), 100);
    })
}
