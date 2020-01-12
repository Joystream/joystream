use super::*;
use crate::mock::*;

#[test]
#[should_panic]
fn infallible_stake_initiation_on_application_panics_on_existed_stake() {
	handle_mock(|| {
		build_test_externalities().execute_with(|| {
			let mock = {
				let mut mock = crate::MockStakeHandler::<Test>::new();
				mock.expect_create_stake().times(1).returning(|| 10);
				Rc::new(RefCell::new(mock))
			};
			set_stake_handler_impl(mock);

			let application_id = 10;
			<ApplicationIdByStakingId<Test>>::insert(10, application_id);

			Hiring::infallible_stake_initiation_on_application(
				stake::NegativeImbalance::<Test>::new(100),
				&application_id,
			);
		});
	});
}


#[test]
#[should_panic]
fn infallible_stake_initiation_on_application_panics_on_unsuccessful_staking() {
	handle_mock(|| {
		build_test_externalities().execute_with(|| {
			let mock = {
				let mut mock = crate::MockStakeHandler::<Test>::new();
				mock.expect_create_stake().times(1).returning(|| 10);
				mock.expect_stake().times(1).returning(|_, _| Err(StakeActionError::StakeNotFound));
				Rc::new(RefCell::new(mock))
			};
			set_stake_handler_impl(mock);

			let application_id = 10;
			Hiring::infallible_stake_initiation_on_application(
				stake::NegativeImbalance::<Test>::new(100),
				&application_id,
			);
		});
	});
}

#[test]
fn infallible_stake_initiation_on_application_succeeds() {
	handle_mock(|| {
		build_test_externalities().execute_with(|| {
			let mock = {
				let mut mock = crate::MockStakeHandler::<Test>::new();
				mock.expect_create_stake().times(1).returning(|| 10);
				mock.expect_stake().times(1).returning(|_, _| Ok(()));
				Rc::new(RefCell::new(mock))
			};
			set_stake_handler_impl(mock);

			let application_id = 10;
			let staking_result = Hiring::infallible_stake_initiation_on_application(
				stake::NegativeImbalance::<Test>::new(100),
				&application_id,
			);

			assert_eq!(staking_result, 10);
		});
	});
}
