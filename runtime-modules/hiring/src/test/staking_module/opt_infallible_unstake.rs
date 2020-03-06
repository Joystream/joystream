use super::*;
use crate::mock::*;

#[test]
fn opt_infallible_unstake_succeeds_with_empty_stake() {
    build_test_externalities().execute_with(|| {
        let unstake_result = Hiring::opt_infallible_unstake(None, None);

        assert_eq!(unstake_result, false);
    });
}

#[test]
#[should_panic]
fn opt_infallible_unstake_panics_with_invalid_stake() {
    build_test_externalities().execute_with(|| {
        Hiring::opt_infallible_unstake(Some(10), None);
    });
}

#[test]
fn opt_infallible_unstake_succeeds() {
    handle_mock(|| {
        build_test_externalities().execute_with(|| {
            let mock = {
                let mut mock = crate::MockStakeHandler::<Test>::new();
                mock.expect_initiate_unstaking()
                    .times(1)
                    .returning(|_, _| Ok(()));
                Rc::new(RefCell::new(mock))
            };
            set_stake_handler_impl(mock);

            let unstake_result = Hiring::opt_infallible_unstake(Some(10), Some(10));

            assert_eq!(unstake_result, true);
        });
    });
}
