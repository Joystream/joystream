use super::*;
use crate::mock::*;
use rstd::collections::btree_set::BTreeSet;
use stake::NegativeImbalance;

use add_opening::AddOpeningFixture;

/*
Not covered:
- stake module calls:
i.infallible_opt_stake_initiation -> infallible_stake_initiation_on_application -> stake::create_stake()
- staking state checks

- add application content checks into the call_and_assert
- application state and ids check after add_opening() call
- opening state check after add_opening() call
- application deactivation on crowding out
- crowding out another application
*/

pub struct AddApplicationFixture {
    pub opening_id: u64,
    pub opt_role_stake_imbalance: Option<NegativeImbalance<Test>>,
    pub opt_application_stake_imbalance: Option<NegativeImbalance<Test>>,
    pub human_readable_text: Vec<u8>,
}

impl AddApplicationFixture {
    pub fn default_for_opening(opening_id: u64) -> Self {
        AddApplicationFixture {
            opening_id,
            opt_role_stake_imbalance: None,
            opt_application_stake_imbalance: None,
            human_readable_text: add_opening::OPENING_HUMAN_READABLE_TEXT.to_vec(),
        }
    }

    pub fn add_application(&self) -> Result<ApplicationAdded<u64>, AddApplicationError> {
        let mut opt_role_stake_imbalance = None;
        if let Some(ref imbalance) = self.opt_role_stake_imbalance {
            opt_role_stake_imbalance =
                Some(stake::NegativeImbalance::<Test>::new(imbalance.peek()));
        }

        let mut opt_application_stake_imbalance = None;
        if let Some(ref imbalance) = self.opt_application_stake_imbalance {
            opt_application_stake_imbalance =
                Some(stake::NegativeImbalance::<Test>::new(imbalance.peek()));
        }

        Hiring::add_application(
            self.opening_id,
            opt_role_stake_imbalance,
            opt_application_stake_imbalance,
            self.human_readable_text.clone(),
        )
    }

    fn call_and_assert(&self, expected_result: Result<ApplicationAdded<u64>, AddApplicationError>) {
        let add_application_result = self.add_application();

        let expected_application_id = 0;
        if add_application_result.is_ok() {
            // Check next application id has been updated
            assert_eq!(Hiring::next_application_id(), expected_application_id + 1);
            // Check application exists
            assert!(<ApplicationById<Test>>::exists(expected_application_id));
        } else {
            // Check next application id has not been updated
            assert_eq!(Hiring::next_application_id(), expected_application_id);
            // Check application does not exist
            assert!(!<ApplicationById<Test>>::exists(expected_application_id));
        };
    }
}

#[test]
fn add_application_success() {
    build_test_externalities().execute_with(|| {
        let opening_fixture = AddOpeningFixture::default();
        let add_opening_result = opening_fixture.add_opening();
        let opening_id = add_opening_result.unwrap();

        let application_fixture = AddApplicationFixture::default_for_opening(opening_id);
        application_fixture.call_and_assert(Ok(ApplicationAdded {
            application_id_added: 0,
            application_id_crowded_out: None,
        }));

        //		let add_application_result = application_fixture.add_application();
        //
        //		assert!(add_application_result.is_ok());
        //		let application_added_obj = add_application_result.unwrap();

        //   debug_print(application_added_obj);
        //		assert_eq!(
        //			Hiring::begin_review(2),
        //			Err(BeginReviewError::OpeningDoesNotExist)
        //		);
    });
}
