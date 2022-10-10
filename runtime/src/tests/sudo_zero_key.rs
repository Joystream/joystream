use super::Runtime;
use crate::tests::initial_test_ext;
use frame_support::assert_ok;
use frame_system::RawOrigin;
use sp_runtime::AccountId32;

#[test]
fn setting_sudo_key_to_zero_disable_sudo_pallet() {
    initial_test_ext().execute_with(|| {
        let root = pallet_sudo::Pallet::<Runtime>::key().unwrap();
        let new_key = AccountId32::new([0; 32]);

        assert_ok!(pallet_sudo::Pallet::<Runtime>::set_key(
            RawOrigin::Signed(root).into(),
            new_key
        ));

        // try to set back root key to the old value should give error
        assert!(
            pallet_staking::Pallet::<Runtime>::force_new_era(RawOrigin::Root.into()).is_err(),
            "Call succeeds",
        )
    })
}
