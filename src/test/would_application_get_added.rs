use super::*;
use crate::mock::*;


//#[test]
fn add_application_succeeds_with_crowding_out() {
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

        //		Test::initiate_unstaking.mock_safe(|_,_| MockResult::Return(Ok(())));
        //		Test::create_stake.mock_safe(|| MockResult::Return(0));
        //		Test::stake.mock_safe(|_, _| MockResult::Return(Ok(())));
        //		Test::stake_exists.mock_safe(|_| MockResult::Return(true));
        //		Test::get_stake.mock_safe(|_| {
        //			MockResult::Return(stake::Stake {
        //				created: 1,
        //				staking_status: stake::StakingStatus::Staked(stake::StakedState {
        //					staked_amount: 100,
        //					staked_status: stake::StakedStatus::Normal,
        //					next_slash_id: 0,
        //					ongoing_slashes: BTreeMap::new(),
        //				}),
        //			})
        //		});
        assert!(application_fixture.add_application().is_ok());

        application_fixture.opt_application_stake_imbalance =
            Some(stake::NegativeImbalance::<Test>::new(101));

//        Hiring::create_stake.mock_safe(|| MockResult::Return(1));
//        Hiring::stake.mock_safe(|_, _| MockResult::Return(Ok(())));

        assert!(application_fixture.add_application().is_ok());
    });
}
