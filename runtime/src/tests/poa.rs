use super::initial_test_ext;
use frame_support::traits::{OnFinalize, OnInitialize};
use pallet_staking::Forcing;
use crate::{BlockNumber, Runtime};

type Session = pallet_session::Pallet<Runtime>;
type Staking = pallet_staking::Pallet<Runtime>;
type System = frame_system::Pallet<Runtime>;
type Babe = pallet_babe::Pallet<Runtime>;

pub(crate) fn run_to_block(n: BlockNumber) {
    while System::block_number() < n {
        <System as OnFinalize<BlockNumber>>::on_finalize(System::block_number());
        <Session as OnFinalize<BlockNumber>>::on_finalize(System::block_number());
        <Staking as OnFinalize<BlockNumber>>::on_finalize(System::block_number());
        <Babe as OnFinalize<BlockNumber>>::on_finalize(System::block_number());
        System::set_block_number(System::block_number() + 1);
        <System as OnInitialize<BlockNumber>>::on_initialize(System::block_number());
        <Session as OnInitialize<BlockNumber>>::on_initialize(System::block_number());
        <Staking as OnInitialize<BlockNumber>>::on_initialize(System::block_number());
        <Babe as OnInitialize<BlockNumber>>::on_initialize(System::block_number());
    }
}

#[test]
fn force_none_era_should_keep_the_active_era_index_to_none() {
    initial_test_ext().execute_with(|| {
        assert_eq!(Staking::force_era(), Forcing::ForceNone);
        assert!(Staking::current_era().is_none());

        let current_block = System::block_number();
        run_to_block(current_block + 10);

        assert_eq!(Staking::force_era(), Forcing::ForceNone);
        assert!(Staking::current_era().is_none());
    })
}

#[test]
fn force_none_era_should_keep_the_validator_set_unchanged() {
    initial_test_ext().execute_with(|| {
        assert_eq!(Staking::force_era(), Forcing::ForceNone);
        let past_validators = Session::validators();

        let current_block = System::block_number();
        run_to_block(current_block + 10);
        let current_validators = Session::validators();
        assert_eq!(past_validators, current_validators);
    })
}
