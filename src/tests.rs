#![cfg(test)]

use super::*;
use crate::mock::*;

use runtime_io::with_externalities;

#[test]
fn create_stake() {
    with_externalities(&mut build_test_externalities(), || {
        let stake_id = StakePool::create_stake();
        assert_eq!(stake_id, FIRST_STAKE_ID);
        assert!(<Stakes<Test>>::exists(&stake_id));

        // Should be NotStaked
        let stake = StakePool::stakes(&stake_id);
        assert_eq!(stake.staking_status, StakingStatus::NotStaked);
    });
}

#[test]
fn remove_stake_in_not_staked_state() {
    with_externalities(&mut build_test_externalities(), || {
        <Stakes<Test>>::insert(
            &100,
            Stake {
                created: 0,
                staking_status: StakingStatus::NotStaked,
            },
        );
        StakePool::remove_stake(&100);
        assert!(!<Stakes<Test>>::exists(&100));

        // when status is Staked, removing should fail
        <Stakes<Test>>::insert(
            &200,
            Stake {
                created: 0,
                staking_status: StakingStatus::Staked(Default::default()),
            },
        );
        StakePool::remove_stake(&200);
        assert!(<Stakes<Test>>::exists(&200));
    });
}
