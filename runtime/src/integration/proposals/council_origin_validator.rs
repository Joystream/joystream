#![warn(missing_docs)]

use sp_runtime::SaturatedConversion;
use sp_std::marker::PhantomData;

use common::origin::ActorOriginValidator;
use common::MemberId;
use proposals_engine::VotersParameters;

use super::MembershipOriginValidator;

/// Handles work with the council.
/// Provides implementations for ActorOriginValidator and VotersParameters.
pub struct CouncilManager<T> {
    marker: PhantomData<T>,
}

impl<T: pallet_council::Trait + membership::Trait>
    ActorOriginValidator<
        <T as frame_system::Trait>::Origin,
        MemberId<T>,
        <T as frame_system::Trait>::AccountId,
    > for CouncilManager<T>
{
    /// Check for valid combination of origin and actor_id. Actor_id should be valid member_id of
    /// the membership module
    fn ensure_actor_origin(
        origin: <T as frame_system::Trait>::Origin,
        actor_id: MemberId<T>,
    ) -> Result<<T as frame_system::Trait>::AccountId, &'static str> {
        let account_id = <MembershipOriginValidator<T>>::ensure_actor_origin(origin, actor_id)?;

        if pallet_council::Module::<T>::council_members()
            .iter()
            .any(|council_member| council_member.member_id() == &actor_id)
        {
            Ok(account_id)
        } else {
            Err("Council validation failed: account id doesn't belong to a council member")
        }
    }
}

impl<T: pallet_council::Trait> VotersParameters for CouncilManager<T> {
    /// Implement total_voters_count() as council size
    fn total_voters_count() -> u32 {
        pallet_council::Module::<T>::council_members()
            .len()
            .saturated_into()
    }
}

#[cfg(test)]
mod tests {
    use super::CouncilManager;
    use crate::Runtime;
    use common::origin::ActorOriginValidator;
    use frame_system::RawOrigin;
    use proposals_engine::VotersParameters;
    use sp_runtime::AccountId32;

    use crate::tests::elect_council;
    use crate::tests::{initial_test_ext, insert_member};

    #[test]
    fn council_origin_validator_fails_with_unregistered_member() {
        initial_test_ext().execute_with(|| {
            let origin = RawOrigin::Signed(AccountId32::default());
            let member_id = 1;
            let error = "Membership validation failed: cannot find a profile for a member";

            let validation_result =
                CouncilManager::<Runtime>::ensure_actor_origin(origin.into(), member_id);

            assert_eq!(validation_result, Err(error));
        });
    }

    #[test]
    fn council_origin_validator_succeeds() {
        initial_test_ext().execute_with(|| {
            let councilor1 = AccountId32::default();
            let councilor2: [u8; 32] = [1; 32];
            let councilor3: [u8; 32] = [2; 32];

            elect_council(vec![councilor1, councilor2.into(), councilor3.into()], 0);

            let account_id = AccountId32::default();
            let origin = RawOrigin::Signed(account_id.clone());
            insert_member(account_id.clone());
            let member_id = 0; // newly created member_id

            let validation_result =
                CouncilManager::<Runtime>::ensure_actor_origin(origin.into(), member_id);

            assert_eq!(validation_result, Ok(account_id));
        });
    }

    #[test]
    fn council_origin_validator_fails_with_incompatible_account_id_and_member_id() {
        initial_test_ext().execute_with(|| {
            let account_id = AccountId32::default();
            let error =
                "Membership validation failed: given account doesn't match with profile accounts";
            insert_member(account_id);
            let member_id = 0; // newly created member_id

            let invalid_account_id: [u8; 32] = [2; 32];
            let validation_result = CouncilManager::<Runtime>::ensure_actor_origin(
                RawOrigin::Signed(invalid_account_id.into()).into(),
                member_id,
            );

            assert_eq!(validation_result, Err(error));
        });
    }

    #[test]
    fn council_origin_validator_fails_with_not_council_account_id() {
        initial_test_ext().execute_with(|| {
            let account_id = AccountId32::default();
            let origin = RawOrigin::Signed(account_id.clone());
            let error = "Council validation failed: account id doesn't belong to a council member";
            insert_member(account_id);
            let member_id = 0; // newly created member_id

            let validation_result =
                CouncilManager::<Runtime>::ensure_actor_origin(origin.into(), member_id);

            assert_eq!(validation_result, Err(error));
        });
    }

    #[test]
    fn council_size_calculation_aka_total_voters_count_succeeds() {
        initial_test_ext().execute_with(|| {
            // Max council size is 3
            let councilor1 = AccountId32::default();
            let councilor2: [u8; 32] = [1; 32];
            let councilor3: [u8; 32] = [2; 32];
            elect_council(vec![councilor1, councilor2.into(), councilor3.into()], 0);

            assert_eq!(CouncilManager::<Runtime>::total_voters_count(), 3)
        });
    }
}
