use rstd::marker::PhantomData;

use crate::VotersParameters;
use common::origin_validator::ActorOriginValidator;
use membership::origin_validator::{MemberId, MembershipOriginValidator};

/// Handles work with the council.
/// Provides implementations for ActorOriginValidator and VotersParameters.
pub struct CouncilManager<T> {
    marker: PhantomData<T>,
}

impl<T: crate::Trait>
    ActorOriginValidator<<T as system::Trait>::Origin, MemberId<T>, <T as system::Trait>::AccountId>
    for CouncilManager<T>
{
    /// Check for valid combination of origin and actor_id. Actor_id should be valid member_id of
    /// the membership module
    fn ensure_actor_origin(
        origin: <T as system::Trait>::Origin,
        actor_id: MemberId<T>,
    ) -> Result<<T as system::Trait>::AccountId, &'static str> {
        let account_id = <MembershipOriginValidator<T>>::ensure_actor_origin(origin, actor_id)?;

        if <governance::council::Module<T>>::is_councilor(&account_id) {
            return Ok(account_id);
        }

        Err("Council validation failed: account id doesn't belong to a council member")
    }
}

impl<T: crate::Trait> VotersParameters for CouncilManager<T> {
    /// Implement total_voters_count() as council size
    fn total_voters_count() -> u32 {
        <governance::council::Module<T>>::active_council().len() as u32
    }
}

#[cfg(test)]
mod tests {
    use crate::tests::mock::{initial_test_ext, Test};
    use crate::CouncilManager;
    use crate::VotersParameters;
    use common::origin_validator::ActorOriginValidator;
    use membership::members::UserInfo;
    use system::RawOrigin;

    type Membership = membership::members::Module<Test>;
    type Council = governance::council::Module<Test>;

    #[test]
    fn council_origin_validator_fails_with_unregistered_member() {
        initial_test_ext().execute_with(|| {
            let origin = RawOrigin::Signed(1);
            let member_id = 1;
            let error = "Membership validation failed: cannot find a profile for a member";

            let validation_result =
                CouncilManager::<Test>::ensure_actor_origin(origin.into(), member_id);

            assert_eq!(validation_result, Err(error));
        });
    }

    #[test]
    fn council_origin_validator_succeeds() {
        initial_test_ext().execute_with(|| {
            assert!(Council::set_council(system::RawOrigin::Root.into(), vec![1, 2, 3]).is_ok());

            let account_id = 1;
            let origin = RawOrigin::Signed(account_id);
            let authority_account_id = 10;
            Membership::set_screening_authority(RawOrigin::Root.into(), authority_account_id)
                .unwrap();

            Membership::add_screened_member(
                RawOrigin::Signed(authority_account_id).into(),
                account_id,
                UserInfo {
                    handle: Some(b"handle".to_vec()),
                    avatar_uri: None,
                    about: None,
                },
            )
            .unwrap();
            let member_id = 0; // newly created member_id

            let validation_result =
                CouncilManager::<Test>::ensure_actor_origin(origin.into(), member_id);

            assert_eq!(validation_result, Ok(account_id));
        });
    }

    #[test]
    fn council_origin_validator_fails_with_incompatible_account_id_and_member_id() {
        initial_test_ext().execute_with(|| {
            let account_id = 1;
            let error =
                "Membership validation failed: given account doesn't match with profile accounts";
            let authority_account_id = 10;
            Membership::set_screening_authority(RawOrigin::Root.into(), authority_account_id)
                .unwrap();

            Membership::add_screened_member(
                RawOrigin::Signed(authority_account_id).into(),
                account_id,
                UserInfo {
                    handle: Some(b"handle".to_vec()),
                    avatar_uri: None,
                    about: None,
                },
            )
            .unwrap();
            let member_id = 0; // newly created member_id

            let invalid_account_id = 2;
            let validation_result = CouncilManager::<Test>::ensure_actor_origin(
                RawOrigin::Signed(invalid_account_id).into(),
                member_id,
            );

            assert_eq!(validation_result, Err(error));
        });
    }

    #[test]
    fn council_origin_validator_fails_with_not_council_account_id() {
        initial_test_ext().execute_with(|| {
            let account_id = 1;
            let origin = RawOrigin::Signed(account_id);
            let error = "Council validation failed: account id doesn't belong to a council member";
            let authority_account_id = 10;
            Membership::set_screening_authority(RawOrigin::Root.into(), authority_account_id)
                .unwrap();

            Membership::add_screened_member(
                RawOrigin::Signed(authority_account_id).into(),
                account_id,
                UserInfo {
                    handle: Some(b"handle".to_vec()),
                    avatar_uri: None,
                    about: None,
                },
            )
            .unwrap();
            let member_id = 0; // newly created member_id

            let validation_result =
                CouncilManager::<Test>::ensure_actor_origin(origin.into(), member_id);

            assert_eq!(validation_result, Err(error));
        });
    }

    #[test]
    fn council_size_calculation_aka_total_voters_count_succeeds() {
        initial_test_ext().execute_with(|| {
            assert!(Council::set_council(system::RawOrigin::Root.into(), vec![1, 2, 3, 7]).is_ok());

            assert_eq!(CouncilManager::<Test>::total_voters_count(), 4)
        });
    }
}
