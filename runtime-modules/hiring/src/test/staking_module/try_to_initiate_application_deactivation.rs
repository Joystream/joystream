use super::*;
use crate::mock::*;

struct TryToInitiateApplicationDeactivationFixture<'a> {
    pub application: &'a Application<OpeningId, BlockNumber, StakeId>,
    pub application_id: ApplicationId,
    pub application_stake_unstaking_period: Option<BlockNumber>,
    pub role_stake_unstaking_period: Option<BlockNumber>,
    pub cause: hiring::ApplicationDeactivationCause,
}

impl<'a> TryToInitiateApplicationDeactivationFixture<'a> {
    pub fn default_for_application(
        application_id: ApplicationId,
        application: &'a Application<OpeningId, BlockNumber, StakeId>,
    ) -> TryToInitiateApplicationDeactivationFixture<'a> {
        TryToInitiateApplicationDeactivationFixture {
            application,
            application_id,
            application_stake_unstaking_period: None,
            role_stake_unstaking_period: None,
            cause: ApplicationDeactivationCause::NotHired,
        }
    }

    fn call_and_assert(&self, expected_result: ApplicationDeactivationInitiationResult) {
        let old_application = <ApplicationById<Test>>::get(self.application_id);
        let old_opening_state = <OpeningById<Test>>::get(old_application.opening_id);

        let actual_result = self.try_to_initiate_application_deactivation();

        assert_eq!(expected_result, actual_result);

        self.assert_application_content(old_application.clone(), actual_result.clone());

        self.assert_opening_content(old_application.opening_id, old_opening_state, actual_result);
    }

    fn try_to_initiate_application_deactivation(&self) -> ApplicationDeactivationInitiationResult {
        Hiring::try_to_initiate_application_deactivation(
            self.application,
            self.application_id,
            self.application_stake_unstaking_period,
            self.role_stake_unstaking_period,
            self.cause,
        )
    }

    fn assert_application_content(
        &self,
        old_application_state: Application<OpeningId, BlockNumber, StakeId>,
        result: ApplicationDeactivationInitiationResult,
    ) {
        let actual_application_state = <ApplicationById<Test>>::get(self.application_id);

        let expected_application_state = match result {
            ApplicationDeactivationInitiationResult::Deactivated => Application {
                stage: ApplicationStage::Inactive {
                    deactivation_initiated: FIRST_BLOCK_HEIGHT,
                    deactivated: FIRST_BLOCK_HEIGHT,
                    cause: self.cause,
                },
                ..old_application_state
            },
            ApplicationDeactivationInitiationResult::Unstaking => Application {
                stage: ApplicationStage::Unstaking {
                    deactivation_initiated: FIRST_BLOCK_HEIGHT,
                    cause: self.cause,
                },
                ..old_application_state
            },
            ApplicationDeactivationInitiationResult::Ignored => old_application_state,
        };

        assert_eq!(expected_application_state, actual_application_state);
    }

    fn assert_opening_content(
        &self,
        opening_id: OpeningId,
        old_opening: Opening<Balance, BlockNumber, ApplicationId>,
        result: ApplicationDeactivationInitiationResult,
    ) {
        // invalid opening stages are not supported

        // check for opening existence
        if !<OpeningById<Test>>::contains_key(opening_id) {
            return;
        }

        // check only for active opening
        if let OpeningStage::Active {
            stage,
            applications_added,
            active_application_count,
            unstaking_application_count,
            deactivated_application_count,
        } = old_opening.stage
        {
            // check only for accepting application stage
            if let ActiveOpeningStage::AcceptingApplications { .. } = stage {
                let mut expected_active_application_count = active_application_count;
                let mut expected_deactivated_application_count = deactivated_application_count;
                let mut expected_unstaking_application_count = unstaking_application_count;

                match result {
                    ApplicationDeactivationInitiationResult::Deactivated => {
                        expected_active_application_count -= 1;
                        expected_deactivated_application_count += 1;
                    }
                    ApplicationDeactivationInitiationResult::Unstaking => {
                        expected_active_application_count -= 1;
                        expected_unstaking_application_count += 1;
                    }
                    ApplicationDeactivationInitiationResult::Ignored => {}
                }

                let expected_opening = Opening {
                    stage: OpeningStage::Active {
                        stage: ActiveOpeningStage::AcceptingApplications {
                            started_accepting_applicants_at_block: FIRST_BLOCK_HEIGHT,
                        },
                        applications_added,
                        active_application_count: expected_active_application_count,
                        unstaking_application_count: expected_unstaking_application_count,
                        deactivated_application_count: expected_deactivated_application_count,
                    },
                    ..old_opening
                };

                let new_opening_state = <OpeningById<Test>>::get(opening_id);
                assert_eq!(new_opening_state, expected_opening);
            }
        }
    }
}

#[test]
fn try_to_initiate_application_deactivation_succeeds_with_ignored_result() {
    build_test_externalities().execute_with(|| {
        let opening_fixture = AddOpeningFixture::default();
        let add_opening_result = opening_fixture.add_opening();
        let opening_id = add_opening_result.unwrap();

        let application_fixture = AddApplicationFixture::default_for_opening(opening_id);
        let app_application_result = application_fixture.add_application();
        let application_id = app_application_result.unwrap().application_id_added;

        let deactivate_application_fixture =
            DeactivateApplicationFixture::default_for_application_id(application_id);

        assert!(deactivate_application_fixture
            .deactivate_application()
            .is_ok());

        let application = <ApplicationById<Test>>::get(application_id);
        let ttiad_fixture = TryToInitiateApplicationDeactivationFixture::default_for_application(
            application_id,
            &application,
        );

        ttiad_fixture.call_and_assert(ApplicationDeactivationInitiationResult::Ignored);
    });
}

#[test]
#[should_panic]
fn try_to_initiate_application_deactivation_panics_because_of_not_active_opening() {
    build_test_externalities().execute_with(|| {
        let opening_fixture = AddOpeningFixture::default();
        let add_opening_result = opening_fixture.add_opening();
        let opening_id = add_opening_result.unwrap();

        let application_fixture = AddApplicationFixture::default_for_opening(opening_id);
        let app_application_result = application_fixture.add_application();
        let application_id = app_application_result.unwrap().application_id_added;

        let application = <ApplicationById<Test>>::get(application_id);

        // provide incorrect opening (invalid stage)
        let mut opening = <OpeningById<Test>>::get(opening_id);
        opening.stage = OpeningStage::WaitingToBegin { begins_at_block: 0 };
        <OpeningById<Test>>::insert(opening_id, opening);

        let ttiad_fixture = TryToInitiateApplicationDeactivationFixture::default_for_application(
            application_id,
            &application,
        );

        ttiad_fixture.call_and_assert(ApplicationDeactivationInitiationResult::Ignored);
    });
}

#[test]
#[should_panic]
fn try_to_initiate_application_deactivation_panics_because_of_opening_with_no_applications() {
    build_test_externalities().execute_with(|| {
        let opening_fixture = AddOpeningFixture::default();
        let add_opening_result = opening_fixture.add_opening();
        let opening_id = add_opening_result.unwrap();

        let application_fixture = AddApplicationFixture::default_for_opening(opening_id);
        let app_application_result = application_fixture.add_application();
        let application_id = app_application_result.unwrap().application_id_added;

        let application = <ApplicationById<Test>>::get(application_id);

        // provide incorrect opening (no applications)
        let add_opening_result = opening_fixture.add_opening();
        let new_opening_id = add_opening_result.unwrap();
        let new_opening = <OpeningById<Test>>::get(new_opening_id);
        <OpeningById<Test>>::insert(opening_id, new_opening);

        let ttiad_fixture = TryToInitiateApplicationDeactivationFixture::default_for_application(
            application_id,
            &application,
        );

        ttiad_fixture.call_and_assert(ApplicationDeactivationInitiationResult::Ignored);
    });
}

#[test]
fn try_to_initiate_application_deactivation_succeeds_with_deactivated_result() {
    build_test_externalities().execute_with(|| {
        let opening_fixture = AddOpeningFixture::default();
        let add_opening_result = opening_fixture.add_opening();
        let opening_id = add_opening_result.unwrap();

        let application_fixture = AddApplicationFixture::default_for_opening(opening_id);
        let app_application_result = application_fixture.add_application();
        let application_id = app_application_result.unwrap().application_id_added;

        let application = <ApplicationById<Test>>::get(application_id);

        let ttiad_fixture = TryToInitiateApplicationDeactivationFixture::default_for_application(
            application_id,
            &application,
        );

        ttiad_fixture.call_and_assert(ApplicationDeactivationInitiationResult::Deactivated);
    });
}

#[test]
fn try_to_initiate_application_deactivation_succeeds_with_single_application_unstaking() {
    handle_mock(|| {
        build_test_externalities().execute_with(|| {
            let mut opening_fixture = AddOpeningFixture::default();
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

            let application = <ApplicationById<Test>>::get(application_id);

            let ttiad_fixture =
                TryToInitiateApplicationDeactivationFixture::default_for_application(
                    application_id,
                    &application,
                );

            let mock = {
                let mut mock = crate::MockStakeHandler::<Test>::new();
                mock.expect_initiate_unstaking()
                    .times(1)
                    .returning(|_, _| Ok(()));
                Rc::new(RefCell::new(mock))
            };
            set_stake_handler_impl(mock);

            ttiad_fixture.call_and_assert(ApplicationDeactivationInitiationResult::Unstaking);
        });
    });
}

#[test]
fn try_to_initiate_application_deactivation_succeeds_with_application_and_role_unstaking() {
    handle_mock(|| {
        build_test_externalities().execute_with(|| {
            let mut opening_fixture = AddOpeningFixture::default();
            opening_fixture.application_staking_policy = Some(StakingPolicy {
                amount: 100,
                amount_mode: StakingAmountLimitMode::AtLeast,
                crowded_out_unstaking_period_length: None,
                review_period_expired_unstaking_period_length: None,
            });
            opening_fixture.role_staking_policy = Some(StakingPolicy {
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
            application_fixture.opt_role_stake_imbalance =
                Some(stake::NegativeImbalance::<Test>::new(100));

            let app_application_result = application_fixture.add_application();
            let application_id = app_application_result.unwrap().application_id_added;

            let application = <ApplicationById<Test>>::get(application_id);

            let ttiad_fixture =
                TryToInitiateApplicationDeactivationFixture::default_for_application(
                    application_id,
                    &application,
                );

            let mock = {
                let mut mock = crate::MockStakeHandler::<Test>::new();
                mock.expect_initiate_unstaking()
                    .times(2)
                    .returning(|_, _| Ok(()));
                Rc::new(RefCell::new(mock))
            };
            set_stake_handler_impl(mock);

            ttiad_fixture.call_and_assert(ApplicationDeactivationInitiationResult::Unstaking);
        });
    });
}

#[test]
fn try_to_initiate_application_deactivation_succeeds_hired_cause_and_application_only_unstaking() {
    handle_mock(|| {
        build_test_externalities().execute_with(|| {
            let mut opening_fixture = AddOpeningFixture::default();
            opening_fixture.application_staking_policy = Some(StakingPolicy {
                amount: 100,
                amount_mode: StakingAmountLimitMode::AtLeast,
                crowded_out_unstaking_period_length: None,
                review_period_expired_unstaking_period_length: None,
            });
            opening_fixture.role_staking_policy = Some(StakingPolicy {
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
            application_fixture.opt_role_stake_imbalance =
                Some(stake::NegativeImbalance::<Test>::new(100));

            let app_application_result = application_fixture.add_application();
            let application_id = app_application_result.unwrap().application_id_added;

            let application = <ApplicationById<Test>>::get(application_id);

            let mut ttiad_fixture =
                TryToInitiateApplicationDeactivationFixture::default_for_application(
                    application_id,
                    &application,
                );
            ttiad_fixture.cause = ApplicationDeactivationCause::Hired;

            let mock = {
                let mut mock = crate::MockStakeHandler::<Test>::new();
                mock.expect_initiate_unstaking()
                    .times(1)
                    .returning(|_, _| Ok(()));
                Rc::new(RefCell::new(mock))
            };
            set_stake_handler_impl(mock);

            ttiad_fixture.call_and_assert(ApplicationDeactivationInitiationResult::Unstaking);
        });
    });
}
