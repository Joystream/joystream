use super::*;
use crate::mock::*;

#[test]
fn add_application_succeeds_with_crowding_out() {
    handle_mock(true, || {
        build_test_externalities().execute_with(|| {
            let mock = {
                let mut mock = crate::MockStakeHandler::<Test>::new();

                mock.expect_stake().times(1).returning(|_, _| Ok(()));
                mock.expect_create_stake().times(1).returning(|| 0);

                Rc::new(rstd::cell::RefCell::new(mock))
            };

            set_stake_handler_impl(mock.clone());
            let mut opening_fixture = AddOpeningFixture::default();
            opening_fixture.application_rationing_policy =
                Some(hiring::ApplicationRationingPolicy {
                    max_active_applicants: 1,
                });
            opening_fixture.application_staking_policy = Some(StakingPolicy {
                amount: 100,
                amount_mode: StakingAmountLimitMode::AtLeast,
                crowded_out_unstaking_period_length: None,
                review_period_expired_unstaking_period_length: None,
            });

            let add_opening_result = opening_fixture.add_opening();
            let opening_id = add_opening_result.unwrap();

            let mut application_fixture = AddApplicationFixture::default_for_opening(opening_id);
            application_fixture.opt_application_stake_imbalance =
                Some(stake::NegativeImbalance::<Test>::new(100));

            assert!(application_fixture.add_application().is_ok());
            mock.borrow_mut().checkpoint();

            application_fixture.opt_application_stake_imbalance =
                Some(stake::NegativeImbalance::<Test>::new(101));

            let mock2 = {
                let mut mock = crate::MockStakeHandler::<Test>::new();
                mock.expect_stake_exists().returning(|_| true);

                mock.expect_stake().times(1).returning(|_, _| Ok(()));

                mock.expect_initiate_unstaking()
                    .times(3)
                    .returning(|_, _| Ok(()));

                mock.expect_create_stake().times(1).returning(|| 1);

                mock.expect_get_stake().returning(|_| stake::Stake {
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

            set_stake_handler_impl(mock2.clone());

            assert!(application_fixture.add_application().is_ok());
        });
    });
}
