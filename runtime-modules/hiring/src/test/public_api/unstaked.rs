use crate::mock::*;
use crate::test::public_api::*;
use crate::test::*;

pub struct UnstakedFixture {
    pub opening_id: OpeningId,
    pub application_id: ApplicationId,
    pub stake_id: StakeId,
}

impl UnstakedFixture {
    fn call_and_assert(&self, expected_result: UnstakedResult) {
        let old_opening = <OpeningById<Test>>::get(self.opening_id);
        let old_application = <ApplicationById<Test>>::get(self.application_id);

        let unstaked_result = self.unstaked();

        assert_eq!(unstaked_result, expected_result);

        self.assert_application_content(old_application.clone(), unstaked_result);

        self.assert_opening_content(old_opening, unstaked_result);
    }

    pub(crate) fn unstaked(&self) -> UnstakedResult {
        Hiring::unstaked(self.stake_id)
    }

    fn assert_application_content(
        &self,
        old_application: Application<OpeningId, BlockNumber, StakeId>,
        unstaked_result: UnstakedResult,
    ) {
        let new_application = <ApplicationById<Test>>::get(self.application_id);

        match unstaked_result {
            UnstakedResult::StakeIdNonExistent | UnstakedResult::ApplicationIsNotUnstaking => {
                assert_eq!(old_application, new_application);
            }
            UnstakedResult::UnstakingInProgress => {
                let expected_active_role_staking_id =
                    old_application.toggle_stake_id(self.stake_id, StakePurpose::Role);
                let expected_active_application_staking_id =
                    old_application.toggle_stake_id(self.stake_id, StakePurpose::Application);
                let expected_application = hiring::Application {
                    active_role_staking_id: expected_active_role_staking_id,
                    active_application_staking_id: expected_active_application_staking_id,
                    ..old_application
                };
                assert_eq!(expected_application, new_application);
            }
            UnstakedResult::Unstaked => {
                let expected_active_role_staking_id =
                    old_application.toggle_stake_id(self.stake_id, StakePurpose::Role);
                let expected_active_application_staking_id =
                    old_application.toggle_stake_id(self.stake_id, StakePurpose::Application);

                if let ApplicationStage::Unstaking {
                    deactivation_initiated,
                    cause,
                } = old_application.stage
                {
                    let expected_application_stage = ApplicationStage::Inactive {
                        deactivation_initiated,
                        deactivated: FIRST_BLOCK_HEIGHT,
                        cause,
                    };

                    let expected_application = hiring::Application {
                        active_role_staking_id: expected_active_role_staking_id,
                        active_application_staking_id: expected_active_application_staking_id,
                        stage: expected_application_stage,
                        ..old_application
                    };
                    assert_eq!(expected_application, new_application);
                } else {
                    panic!("old application should be in Unstaking stage")
                }
            }
        };
    }

    fn assert_opening_content(
        &self,
        old_opening: Opening<Balance, BlockNumber, ApplicationId>,
        unstaked_result: UnstakedResult,
    ) {
        let new_opening = <OpeningById<Test>>::get(self.opening_id);
        let mut expected_opening = old_opening.clone();

        if let UnstakedResult::Unstaked = unstaked_result {
            if let hiring::OpeningStage::Active {
                stage,
                applications_added,
                active_application_count,
                unstaking_application_count,
                deactivated_application_count,
            } = old_opening.stage
            {
                expected_opening.stage = hiring::OpeningStage::Active {
                    stage,
                    applications_added,
                    active_application_count,
                    unstaking_application_count: unstaking_application_count - 1,
                    deactivated_application_count: deactivated_application_count + 1,
                };
            } else {
                panic!("old opening stage MUST be active")
            }
        };

        assert_eq!(expected_opening, new_opening);
    }
}

#[test]
fn unstaked_returns_non_existent_stake_id() {
    build_test_externalities().execute_with(|| {
        let unstaked_fixture = UnstakedFixture {
            opening_id: 0,
            application_id: 0,
            stake_id: 0,
        };

        unstaked_fixture.call_and_assert(UnstakedResult::StakeIdNonExistent);
    });
}

#[test]
fn unstaked_returns_application_is_not_unstaking() {
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
        let stake_id = application.active_application_staking_id.unwrap();

        let unstaked_fixture = UnstakedFixture {
            opening_id,
            application_id,
            stake_id,
        };

        unstaked_fixture.call_and_assert(UnstakedResult::ApplicationIsNotUnstaking);
    });
}

#[test]
fn unstaked_returns_unstaking_in_progress() {
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
        assert!(app_application_result.is_ok());
        let first_application_id = app_application_result.unwrap().application_id_added;

        application_fixture.opt_application_stake_imbalance =
            Some(stake::NegativeImbalance::<Test>::new(101));
        application_fixture.opt_role_stake_imbalance =
            Some(stake::NegativeImbalance::<Test>::new(101));

        assert!(application_fixture.add_application().is_ok());

        let application = <ApplicationById<Test>>::get(first_application_id);
        let stake_id = application.active_application_staking_id.unwrap();

        let unstaked_fixture = UnstakedFixture {
            opening_id,
            application_id: first_application_id,
            stake_id,
        };

        unstaked_fixture.call_and_assert(UnstakedResult::UnstakingInProgress);
    });
}

#[test]
fn unstaked_returns_unstaked() {
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
        assert!(app_application_result.is_ok());
        let first_application_id = app_application_result.unwrap().application_id_added;

        application_fixture.opt_application_stake_imbalance =
            Some(stake::NegativeImbalance::<Test>::new(101));

        assert!(application_fixture.add_application().is_ok());

        let application = <ApplicationById<Test>>::get(first_application_id);
        let stake_id = application.active_application_staking_id.unwrap();

        let unstaked_fixture = UnstakedFixture {
            opening_id,
            application_id: first_application_id,
            stake_id,
        };

        unstaked_fixture.call_and_assert(UnstakedResult::Unstaked);

        TestApplicationDeactivatedHandler::assert_deactivated_application(
            first_application_id,
            ApplicationDeactivationCause::CrowdedOut,
        );
    });
}

#[test]
fn unstaked_returns_unstaked_with_stake_checks() {
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
        assert!(app_application_result.is_ok());
        let first_application_id = app_application_result.unwrap().application_id_added;

        application_fixture.opt_application_stake_imbalance =
            Some(stake::NegativeImbalance::<Test>::new(101));

        assert!(application_fixture.add_application().is_ok());

        let application = <ApplicationById<Test>>::get(first_application_id);
        let stake_id = application.active_application_staking_id.unwrap();

        let unstaked_fixture = UnstakedFixture {
            opening_id,
            application_id: first_application_id,
            stake_id,
        };

        unstaked_fixture.call_and_assert(UnstakedResult::Unstaked);
    });
}
