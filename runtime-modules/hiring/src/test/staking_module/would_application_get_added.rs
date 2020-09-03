use super::*;
use crate::mock::*;

#[derive(Default)]
struct WouldApplicationGetAddedFixture {
    possible_opening_application_rationing_policy: Option<ApplicationRationingPolicy>,
    opening_applicants: BTreeSet<ApplicationId>,
    opt_role_stake_balance: Option<Balance>,
    opt_application_stake_balance: Option<Balance>,
}

impl WouldApplicationGetAddedFixture {
    fn call_and_assert(&self, expected_result: ApplicationWouldGetAddedEvaluation<Test>) {
        let wagaf_result = self.would_application_get_added();

        assert_eq!(wagaf_result, expected_result);
    }

    fn would_application_get_added(&self) -> ApplicationWouldGetAddedEvaluation<Test> {
        Hiring::would_application_get_added(
            &self.possible_opening_application_rationing_policy,
            &self.opening_applicants,
            &self.opt_role_stake_balance,
            &self.opt_application_stake_balance,
        )
    }
}

#[test]
fn would_application_get_added_with_no_rationing_policy() {
    build_test_externalities().execute_with(|| {
        let wagaf = WouldApplicationGetAddedFixture::default();

        wagaf.call_and_assert(ApplicationWouldGetAddedEvaluation::Yes(
            ApplicationAddedSuccess::Unconditionally,
        ));
    });
}

#[test]
fn would_application_get_added_with_zero_opening_applicants() {
    build_test_externalities().execute_with(|| {
        let mut wagaf = WouldApplicationGetAddedFixture::default();
        wagaf.possible_opening_application_rationing_policy =
            Some(hiring::ApplicationRationingPolicy {
                max_active_applicants: 1,
            });

        wagaf.call_and_assert(ApplicationWouldGetAddedEvaluation::Yes(
            ApplicationAddedSuccess::Unconditionally,
        ));
    });
}

#[test]
fn would_application_get_added_with_too_low_stake() {
    build_test_externalities().execute_with(|| {
        let mut opening_fixture = AddOpeningFixture::default();
        opening_fixture.application_rationing_policy = Some(hiring::ApplicationRationingPolicy {
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

        let app_application_result = application_fixture.add_application();
        let application_id = app_application_result.unwrap().application_id_added;

        let mut wagaf = WouldApplicationGetAddedFixture::default();
        wagaf.possible_opening_application_rationing_policy =
            Some(hiring::ApplicationRationingPolicy {
                max_active_applicants: 1,
            });
        wagaf.opening_applicants.insert(application_id);
        wagaf.opt_application_stake_balance = Some(99);

        wagaf.call_and_assert(ApplicationWouldGetAddedEvaluation::No);
    });
}

#[test]
fn would_application_get_added_with_too_low_stake_with_mocks() {
    handle_mock(|| {
        build_test_externalities().execute_with(|| {
            let mock = {
                let mut mock = crate::MockStakeHandler::<Test>::new();

                mock.expect_stake().times(1).returning(|_, _| Ok(()));
                mock.expect_stake_exists().times(2).returning(|_| true);
                mock.expect_create_stake().times(1).returning(|| 0);
                mock.expect_get_stake().returning(|_| stake::Stake {
                    created: 1,
                    staking_status: stake::StakingStatus::Staked(stake::StakedState {
                        staked_amount: 101,
                        staked_status: stake::StakedStatus::Normal,
                        next_slash_id: 0,
                        ongoing_slashes: BTreeMap::new(),
                    }),
                });

                Rc::new(sp_std::cell::RefCell::new(mock))
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

            let app_application_result = application_fixture.add_application();
            let application_id = app_application_result.unwrap().application_id_added;

            let mut wagaf = WouldApplicationGetAddedFixture::default();
            wagaf.possible_opening_application_rationing_policy =
                Some(hiring::ApplicationRationingPolicy {
                    max_active_applicants: 1,
                });
            wagaf.opening_applicants.insert(application_id);
            wagaf.opt_application_stake_balance = Some(99);

            wagaf.call_and_assert(ApplicationWouldGetAddedEvaluation::No);
        });
    });
}

#[test]
fn would_application_get_added_with_crowding_out() {
    build_test_externalities().execute_with(|| {
        let mut opening_fixture = AddOpeningFixture::default();
        opening_fixture.application_rationing_policy = Some(hiring::ApplicationRationingPolicy {
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

        let app_application_result = application_fixture.add_application();
        let application_id = app_application_result.unwrap().application_id_added;

        let mut wagaf = WouldApplicationGetAddedFixture::default();
        wagaf.possible_opening_application_rationing_policy =
            Some(hiring::ApplicationRationingPolicy {
                max_active_applicants: 1,
            });
        wagaf.opening_applicants.insert(application_id);
        wagaf.opt_application_stake_balance = Some(101);

        wagaf.call_and_assert(ApplicationWouldGetAddedEvaluation::Yes(
            ApplicationAddedSuccess::CrowdsOutExistingApplication(application_id),
        ));
    });
}
#[test]
#[should_panic]
fn would_application_get_added_panics_with_bad_params() {
    build_test_externalities().execute_with(|| {
        let mut opening_fixture = AddOpeningFixture::default();
        opening_fixture.application_rationing_policy = Some(hiring::ApplicationRationingPolicy {
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

        let mut wagaf = WouldApplicationGetAddedFixture::default();
        wagaf.possible_opening_application_rationing_policy =
            Some(hiring::ApplicationRationingPolicy {
                max_active_applicants: 0,
            });
        wagaf.opt_application_stake_balance = Some(100);

        wagaf.would_application_get_added();
    });
}
