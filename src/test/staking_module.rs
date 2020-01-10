use super::*;
use crate::mock::*;

use mockall::predicate::*;

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

#[test]
#[should_panic]
fn get_opt_stake_amount_panics_with_incorrect_stake_status() {
    handle_mock(false, || {
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

                Rc::new(RefCell::new(mock))
            };
            set_stake_handler_impl(mock);

            Hiring::get_opt_stake_amount(Some(0));
        })
    })
}

#[test]
fn get_opt_stake_amount_succeeds_with_existing_stake() {
    handle_mock(true, || {
        build_test_externalities().execute_with(|| {
            let mock = {
                let mut mock = crate::MockStakeHandler::<Test>::new();
                mock.expect_stake_exists()
                    .with(eq(0))
                    .times(1)
                    .returning(|_| true);

                mock.expect_get_stake()
                    .with(eq(1))
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

                Rc::new(RefCell::new(mock))
            };
            set_stake_handler_impl(mock.clone());

            assert_eq!(Hiring::get_opt_stake_amount(Some(0)), 100);
        })
    });
}
