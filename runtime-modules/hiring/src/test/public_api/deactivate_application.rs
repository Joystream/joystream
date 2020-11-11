use crate::mock::*;
use crate::test::public_api::*;
use crate::test::*;
use crate::ApplicationDeactivationCause;

/*
Not covered:
- application content checks: deactivation in future blocks
*/

pub struct DeactivateApplicationFixture {
    pub application_id: ApplicationId,
    pub application_stake_unstaking_period: Option<BlockNumber>,
    pub role_stake_unstaking_period: Option<BlockNumber>,
}

impl DeactivateApplicationFixture {
    pub(crate) fn default_for_application_id(application_id: ApplicationId) -> Self {
        DeactivateApplicationFixture {
            application_id,
            application_stake_unstaking_period: None,
            role_stake_unstaking_period: None,
        }
    }

    pub(crate) fn deactivate_application(&self) -> Result<(), DeactivateApplicationError> {
        Hiring::deactive_application(
            self.application_id,
            self.application_stake_unstaking_period,
            self.role_stake_unstaking_period,
        )
    }

    fn call_and_assert(&self, expected_result: Result<(), DeactivateApplicationError>) {
        // save opening state (can be invalid if invalid opening_id provided)
        let old_application = <ApplicationById<Test>>::get(self.application_id);
        let old_opening_state = <OpeningById<Test>>::get(old_application.opening_id);

        let deactivate_application_result = self.deactivate_application();

        assert_eq!(deactivate_application_result, expected_result);

        self.assert_application_content(
            old_application.clone(),
            deactivate_application_result.clone(),
        );

        self.assert_opening_content(
            old_application.opening_id,
            old_opening_state,
            deactivate_application_result,
        );
    }

    fn assert_application_content(
        &self,
        old_application_state: Application<OpeningId, BlockNumber, StakeId>,
        deactivate_application_result: Result<(), DeactivateApplicationError>,
    ) {
        let actual_application_state = <ApplicationById<Test>>::get(self.application_id);

        let expected_application_state = if deactivate_application_result.is_ok() {
            if old_application_state
                .active_application_staking_id
                .is_some()
                || old_application_state.active_role_staking_id.is_some()
            {
                Application {
                    stage: ApplicationStage::Unstaking {
                        deactivation_initiated: FIRST_BLOCK_HEIGHT,
                        cause: ApplicationDeactivationCause::External,
                    },
                    ..old_application_state
                }
            } else {
                Application {
                    stage: ApplicationStage::Inactive {
                        deactivation_initiated: FIRST_BLOCK_HEIGHT,
                        deactivated: FIRST_BLOCK_HEIGHT,
                        cause: ApplicationDeactivationCause::External,
                    },
                    ..old_application_state
                }
            }
        } else {
            old_application_state
        };

        assert_eq!(expected_application_state, actual_application_state);
    }

    fn assert_opening_content(
        &self,
        opening_id: OpeningId,
        old_opening: Opening<Balance, BlockNumber, ApplicationId>,
        actual_result: Result<(), DeactivateApplicationError>,
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

                if actual_result.is_ok() {
                    expected_active_application_count -= 1;

                    if old_opening.application_staking_policy.is_some()
                        || old_opening.role_staking_policy.is_some()
                    {
                        expected_unstaking_application_count += 1;
                    } else {
                        expected_deactivated_application_count += 1;
                    }
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
fn deactivate_application_succeeds() {
    build_test_externalities().execute_with(|| {
        let opening_fixture = AddOpeningFixture::default();
        let add_opening_result = opening_fixture.add_opening();
        let opening_id = add_opening_result.unwrap();

        let application_fixture = AddApplicationFixture::default_for_opening(opening_id);
        let app_application_result = application_fixture.add_application();
        let application_id = app_application_result.unwrap().application_id_added;

        let deactivate_application_fixture =
            DeactivateApplicationFixture::default_for_application_id(application_id);

        deactivate_application_fixture.call_and_assert(Ok(()));
    });
}

#[test]
fn deactivate_application_fails_with_no_application() {
    build_test_externalities().execute_with(|| {
        let deactivate_application_fixture =
            DeactivateApplicationFixture::default_for_application_id(0);

        deactivate_application_fixture
            .call_and_assert(Err(DeactivateApplicationError::ApplicationDoesNotExist));
    });
}

#[test]
fn deactivate_application_fails_with_redundant_application_staking_period_provided() {
    build_test_externalities().execute_with(|| {
        let opening_fixture = AddOpeningFixture::default();
        let add_opening_result = opening_fixture.add_opening();
        let opening_id = add_opening_result.unwrap();

        let application_fixture = AddApplicationFixture::default_for_opening(opening_id);
        let app_application_result = application_fixture.add_application();
        let application_id = app_application_result.unwrap().application_id_added;

        let mut deactivate_application_fixture =
            DeactivateApplicationFixture::default_for_application_id(application_id);
        deactivate_application_fixture.application_stake_unstaking_period = Some(3);

        deactivate_application_fixture.call_and_assert(Err(
            DeactivateApplicationError::RedundantUnstakingPeriodProvided(StakePurpose::Application),
        ))
    });
}

#[test]
fn deactivate_application_fails_with_redundant_role_staking_period_provided() {
    build_test_externalities().execute_with(|| {
        let opening_fixture = AddOpeningFixture::default();
        let add_opening_result = opening_fixture.add_opening();
        let opening_id = add_opening_result.unwrap();

        let application_fixture = AddApplicationFixture::default_for_opening(opening_id);
        let app_application_result = application_fixture.add_application();
        let application_id = app_application_result.unwrap().application_id_added;

        let mut deactivate_application_fixture =
            DeactivateApplicationFixture::default_for_application_id(application_id);
        deactivate_application_fixture.role_stake_unstaking_period = Some(3);

        deactivate_application_fixture.call_and_assert(Err(
            DeactivateApplicationError::RedundantUnstakingPeriodProvided(StakePurpose::Role),
        ))
    });
}

#[test]
fn deactivate_application_fails_for_already_deactivated_application() {
    build_test_externalities().execute_with(|| {
        let opening_fixture = AddOpeningFixture::default();
        let add_opening_result = opening_fixture.add_opening();
        let opening_id = add_opening_result.unwrap();

        let application_fixture = AddApplicationFixture::default_for_opening(opening_id);
        let app_application_result = application_fixture.add_application();
        let application_id = app_application_result.unwrap().application_id_added;

        let deactivate_application_fixture =
            DeactivateApplicationFixture::default_for_application_id(application_id);

        // deactivate first
        assert!(deactivate_application_fixture
            .deactivate_application()
            .is_ok());

        // try again to deactivate
        deactivate_application_fixture
            .call_and_assert(Err(DeactivateApplicationError::ApplicationNotActive))
    });
}

#[test]
fn deactivate_application_for_opening_not_accepting_applications() {
    build_test_externalities().execute_with(|| {
        let opening_fixture = AddOpeningFixture::default();
        let add_opening_result = opening_fixture.add_opening();
        let opening_id = add_opening_result.unwrap();

        let application_fixture = AddApplicationFixture::default_for_opening(opening_id);
        let app_application_result = application_fixture.add_application();
        let application_id = app_application_result.unwrap().application_id_added;

        assert!(Hiring::begin_review(opening_id).is_ok());

        let deactivate_application_fixture =
            DeactivateApplicationFixture::default_for_application_id(application_id);

        deactivate_application_fixture.call_and_assert(Err(
            DeactivateApplicationError::OpeningNotAcceptingApplications,
        ))
    });
}

#[test]
fn deactivate_application_fails_with_too_short_application_unstaking_period_provided() {
    build_test_externalities().execute_with(|| {
        let opening_fixture = AddOpeningFixture::default();
        let add_opening_result = opening_fixture.add_opening();
        let opening_id = add_opening_result.unwrap();

        let application_fixture = AddApplicationFixture::default_for_opening(opening_id);
        let app_application_result = application_fixture.add_application();
        let application_id = app_application_result.unwrap().application_id_added;

        let mut deactivate_application_fixture =
            DeactivateApplicationFixture::default_for_application_id(application_id);
        deactivate_application_fixture.application_stake_unstaking_period = Some(0);

        deactivate_application_fixture.call_and_assert(Err(
            DeactivateApplicationError::UnstakingPeriodTooShort(StakePurpose::Application),
        ))
    });
}

#[test]
fn deactivate_application_fails_with_too_short_role_unstaking_period_provided() {
    build_test_externalities().execute_with(|| {
        let opening_fixture = AddOpeningFixture::default();
        let add_opening_result = opening_fixture.add_opening();
        let opening_id = add_opening_result.unwrap();

        let application_fixture = AddApplicationFixture::default_for_opening(opening_id);
        let app_application_result = application_fixture.add_application();
        let application_id = app_application_result.unwrap().application_id_added;

        let mut deactivate_application_fixture =
            DeactivateApplicationFixture::default_for_application_id(application_id);
        deactivate_application_fixture.role_stake_unstaking_period = Some(0);

        deactivate_application_fixture.call_and_assert(Err(
            DeactivateApplicationError::UnstakingPeriodTooShort(StakePurpose::Role),
        ))
    });
}

#[test]
fn deactivate_application_succeeds_with_application_stake_checks() {
    handle_mock(|| {
        build_test_externalities().execute_with(|| {
            let mock = default_mock_for_creating_stake();
            set_stake_handler_impl(mock.clone());

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

            let deactivate_application_fixture =
                DeactivateApplicationFixture::default_for_application_id(application_id);

            let mock2 = default_mock_for_unstaking();
            set_stake_handler_impl(mock2.clone());

            deactivate_application_fixture.call_and_assert(Ok(()));

            TestApplicationDeactivatedHandler::assert_deactivated_application(
                application_id,
                ApplicationDeactivationCause::External,
            );
        });
    });
}

#[test]
fn deactivate_application_succeeds_with_role_stake_checks() {
    handle_mock(|| {
        build_test_externalities().execute_with(|| {
            let mock = default_mock_for_creating_stake();
            set_stake_handler_impl(mock.clone());

            let mut opening_fixture = AddOpeningFixture::default();
            opening_fixture.role_staking_policy = Some(StakingPolicy {
                amount: 100,
                amount_mode: StakingAmountLimitMode::AtLeast,
                crowded_out_unstaking_period_length: None,
                review_period_expired_unstaking_period_length: None,
            });
            let add_opening_result = opening_fixture.add_opening();
            let opening_id = add_opening_result.unwrap();

            let mut application_fixture = AddApplicationFixture::default_for_opening(opening_id);
            application_fixture.opt_role_stake_imbalance =
                Some(stake::NegativeImbalance::<Test>::new(100));
            let app_application_result = application_fixture.add_application();
            let application_id = app_application_result.unwrap().application_id_added;

            let deactivate_application_fixture =
                DeactivateApplicationFixture::default_for_application_id(application_id);

            let mock2 = default_mock_for_unstaking();
            set_stake_handler_impl(mock2.clone());

            deactivate_application_fixture.call_and_assert(Ok(()))
        });
    });
}
