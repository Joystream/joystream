use super::*;
use crate::mock::*;

type ApplicationMap = BTreeMap<ApplicationId, hiring::Application<OpeningId, BlockNumber, StakeId>>;

struct InitiateApplicationDeactivationsFixture {
    pub applications: ApplicationMap,
    pub application_stake_unstaking_period: Option<BlockNumber>,
    pub role_stake_unstaking_period: Option<BlockNumber>,
    pub cause: ApplicationDeactivationCause,
}

impl InitiateApplicationDeactivationsFixture {
    fn default_for_applications(
        applications: ApplicationMap,
    ) -> InitiateApplicationDeactivationsFixture {
        InitiateApplicationDeactivationsFixture {
            applications,
            application_stake_unstaking_period: None,
            role_stake_unstaking_period: None,
            cause: ApplicationDeactivationCause::External,
        }
    }

    fn initiate_application_deactivations(&self) -> ApplicationsDeactivationsInitiationResult {
        Hiring::initiate_application_deactivations(
            &self.applications,
            self.application_stake_unstaking_period,
            self.role_stake_unstaking_period,
            self.cause,
        )
    }

    fn call_and_assert(&self, expected_result: ApplicationsDeactivationsInitiationResult) {
        let actual_result = self.initiate_application_deactivations();

        assert_eq!(expected_result, actual_result);
    }
}

#[test]
fn initiate_application_deactivations_succeeds_with_deactivated_result() {
    build_test_externalities().execute_with(|| {
        let opening_fixture = AddOpeningFixture::default();
        let add_opening_result = opening_fixture.add_opening();
        let opening_id = add_opening_result.unwrap();

        let application_fixture = AddApplicationFixture::default_for_opening(opening_id);
        let app_application_result = application_fixture.add_application();
        let application_id = app_application_result.unwrap().application_id_added;

        let application = <ApplicationById<Test>>::get(application_id);

        let mut applications = ApplicationMap::new();
        applications.insert(application_id, application);

        let iad_fixture =
            InitiateApplicationDeactivationsFixture::default_for_applications(applications);

        iad_fixture.call_and_assert(ApplicationsDeactivationsInitiationResult {
            number_of_deactivated_applications: 1,
            number_of_unstaking_applications: 0,
        });
    });
}

#[test]
fn initiate_application_deactivations_succeeds_with_unstaking_result() {
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

            let mut applications = ApplicationMap::new();
            applications.insert(application_id, application);

            let iad_fixture =
                InitiateApplicationDeactivationsFixture::default_for_applications(applications);

            let mock = {
                let mut mock = crate::MockStakeHandler::<Test>::new();
                mock.expect_initiate_unstaking()
                    .times(1)
                    .returning(|_, _| Ok(()));
                Rc::new(RefCell::new(mock))
            };
            set_stake_handler_impl(mock);

            iad_fixture.call_and_assert(ApplicationsDeactivationsInitiationResult {
                number_of_deactivated_applications: 0,
                number_of_unstaking_applications: 1,
            });
        });
    });
}
