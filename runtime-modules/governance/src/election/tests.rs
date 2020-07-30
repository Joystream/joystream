#![cfg(test)]
use super::*;
use crate::mock::*;
use codec::Encode;
use srml_support::*;

#[test]
fn election_starts_when_council_term_ends() {
    initial_test_ext().execute_with(|| {
        System::set_block_number(1);

        assert!(Council::is_term_ended());
        assert!(Election::stage().is_none());

        <Election as council::CouncilTermEnded>::council_term_ended();

        assert!(Election::stage().is_some());
    });
}

#[test]
fn new_stake_reusing_transferable_works() {
    {
        let mut transferable = 0;
        let additional = 100;
        let new_stake = Election::new_stake_reusing_transferable(&mut transferable, additional);
        assert_eq!(new_stake.new, 100);
        assert_eq!(new_stake.transferred, 0);
    }

    {
        let mut transferable = 40;
        let additional = 60;
        let new_stake = Election::new_stake_reusing_transferable(&mut transferable, additional);
        assert_eq!(new_stake.new, 20);
        assert_eq!(new_stake.transferred, 40);
        assert_eq!(transferable, 0);
    }

    {
        let mut transferable = 1000;
        let additional = 100;
        let new_stake = Election::new_stake_reusing_transferable(&mut transferable, additional);
        assert_eq!(new_stake.new, 0);
        assert_eq!(new_stake.transferred, 100);
        assert_eq!(transferable, 900);
    }
}

#[test] #[ignore]
fn check_default_params() {
    // TODO missing test implementation?
}

#[test]
fn should_not_start_new_election_if_already_started() {
    initial_test_ext().execute_with(|| {
        assert_ok!(Election::start_election(vec![]));
        assert_err!(
            Election::start_election(vec![]),
            "election already in progress"
        );
    });
}

fn assert_announcing_period(expected_period: <Test as system::Trait>::BlockNumber) {
    assert!(
        Election::is_election_running(),
        "Election Stage was not set"
    );

    let election_stage = Election::stage().unwrap();

    match election_stage {
        election::ElectionStage::Announcing(period) => {
            assert_eq!(period, expected_period, "Election period not set correctly")
        }
        _ => assert!(false, "Election Stage was not correctly set to Announcing"),
    }
}

#[test]
fn start_election_should_work() {
    initial_test_ext().execute_with(|| {
        System::set_block_number(1);
        <AnnouncingPeriod<Test>>::put(20);
        let prev_round = Election::round();

        assert_ok!(Election::start_election(vec![]));

        // election round is bumped
        assert_eq!(Election::round(), prev_round + 1);

        // we enter the announcing stage for a specified period
        assert_announcing_period(1 + Election::announcing_period());
    });
}

#[test]
fn init_transferable_stake_should_work() {
    initial_test_ext().execute_with(|| {
        let existing_council = vec![
            Seat {
                member: 1,
                stake: 100,
                backers: vec![
                    Backer {
                        member: 2,
                        stake: 50,
                    },
                    Backer {
                        member: 3,
                        stake: 40,
                    },
                    Backer {
                        member: 10,
                        stake: 10,
                    },
                ],
            },
            Seat {
                member: 2,
                stake: 200,
                backers: vec![
                    Backer {
                        member: 1,
                        stake: 10,
                    },
                    Backer {
                        member: 3,
                        stake: 60,
                    },
                    Backer {
                        member: 20,
                        stake: 20,
                    },
                ],
            },
            Seat {
                member: 3,
                stake: 300,
                backers: vec![
                    Backer {
                        member: 1,
                        stake: 20,
                    },
                    Backer {
                        member: 2,
                        stake: 40,
                    },
                ],
            },
        ];

        Election::initialize_transferable_stakes(existing_council);
        let mut existing_stake_holders = Election::existing_stake_holders();
        existing_stake_holders.sort();
        assert_eq!(existing_stake_holders, vec![1, 2, 3, 10, 20]);

        assert_eq!(Election::transferable_stakes(&1).seat, 100);
        assert_eq!(Election::transferable_stakes(&1).backing, 30);

        assert_eq!(Election::transferable_stakes(&2).seat, 200);
        assert_eq!(Election::transferable_stakes(&2).backing, 90);

        assert_eq!(Election::transferable_stakes(&3).seat, 300);
        assert_eq!(Election::transferable_stakes(&3).backing, 100);

        assert_eq!(Election::transferable_stakes(&10).seat, 0);
        assert_eq!(Election::transferable_stakes(&10).backing, 10);

        assert_eq!(Election::transferable_stakes(&20).seat, 0);
        assert_eq!(Election::transferable_stakes(&20).backing, 20);
    });
}

#[test]
fn try_add_applicant_should_work() {
    initial_test_ext().execute_with(|| {
        assert!(Election::applicants().len() == 0);

        let applicant = 20 as u64;

        let starting_balance = 1000 as u64;
        let _ = Balances::deposit_creating(&applicant, starting_balance);

        let stake = 100 as u64;

        assert!(Election::try_add_applicant(applicant, stake).is_ok());
        assert_eq!(Election::applicants(), vec![applicant]);

        assert_eq!(Election::applicant_stakes(applicant).new, stake);
        assert_eq!(Election::applicant_stakes(applicant).transferred, 0);

        assert_eq!(Balances::free_balance(&applicant), starting_balance - stake);
    });
}

#[test]
fn increasing_applicant_stake_should_work() {
    initial_test_ext().execute_with(|| {
        let applicant = 20 as u64;
        let starting_stake = 100 as u64;

        <Applicants<Test>>::put(vec![applicant]);
        <ApplicantStakes<Test>>::insert(
            applicant,
            Stake {
                new: starting_stake,
                transferred: 0,
            },
        );

        let additional_stake = 100 as u64;
        let _ = Balances::deposit_creating(&applicant, additional_stake);
        assert!(Election::try_add_applicant(applicant, additional_stake).is_ok());

        assert_eq!(
            Election::applicant_stakes(applicant).new,
            starting_stake + additional_stake
        );
        assert_eq!(Election::applicant_stakes(applicant).transferred, 0)
    });
}

#[test]
fn using_transferable_seat_stake_should_work() {
    initial_test_ext().execute_with(|| {
        let applicant = 20 as u64;
        let _ = Balances::deposit_creating(&applicant, 5000);

        <ExistingStakeHolders<Test>>::put(vec![applicant]);
        save_transferable_stake(
            applicant,
            TransferableStake {
                seat: 1000,
                backing: 0,
            },
        );

        <Applicants<Test>>::put(vec![applicant]);
        let starting_stake = Stake {
            new: 100,
            transferred: 0,
        };
        <ApplicantStakes<Test>>::insert(applicant, starting_stake);

        // transferable stake covers new stake
        assert!(Election::try_add_applicant(applicant, 600).is_ok());
        assert_eq!(
            Election::applicant_stakes(applicant).new,
            starting_stake.new
        );
        assert_eq!(Election::applicant_stakes(applicant).transferred, 600);
        assert_eq!(Election::transferable_stakes(applicant).seat, 400);
        assert_eq!(Balances::free_balance(applicant), 5000);

        // all remaining transferable stake is consumed and free balance covers remaining stake
        assert!(Election::try_add_applicant(applicant, 1000).is_ok());
        assert_eq!(
            Election::applicant_stakes(applicant).new,
            starting_stake.new + 600
        );
        assert_eq!(Election::applicant_stakes(applicant).transferred, 1000);
        assert_eq!(Election::transferable_stakes(applicant).seat, 0);
        assert_eq!(Balances::free_balance(applicant), 4400);
    });
}

#[test]
fn moving_to_voting_without_enough_applicants_should_not_work() {
    initial_test_ext().execute_with(|| {
        System::set_block_number(1);
        <AnnouncingPeriod<Test>>::put(20);
        CouncilSize::put(10);
        Election::move_to_announcing_stage();
        let round = Election::round();

        // add applicants
        <Applicants<Test>>::put(vec![10, 20, 30]);
        let stake = Stake {
            new: 10,
            transferred: 0,
        };

        let applicants = Election::applicants();

        for applicant in applicants.iter() {
            <ApplicantStakes<Test>>::insert(applicant, stake);
        }

        // make sure we are testing the condition that we don't have enough applicants
        assert!(Election::council_size_usize() > applicants.len());

        // try to move to voting stage
        let ann_ends = Election::stage_ends_at().unwrap();
        System::set_block_number(ann_ends);
        Election::on_announcing_ended();

        // A new round should have been started
        assert_eq!(Election::round(), round + 1);

        // A new announcing period started
        assert_announcing_period(ann_ends + Election::announcing_period());

        // applicants list should be unchanged..
        assert_eq!(Election::applicants(), applicants);
    });
}

#[test]
fn top_applicants_move_to_voting_stage() {
    initial_test_ext().execute_with(|| {
        <Applicants<Test>>::put(vec![10, 20, 30, 40]);
        let mut applicants = Election::applicants();

        for (i, applicant) in applicants.iter().enumerate() {
            <ApplicantStakes<Test>>::insert(
                applicant,
                Stake {
                    new: (i * 10) as u64,
                    transferred: 0,
                },
            );
        }

        let rejected = Election::find_least_staked_applicants(&mut applicants, 3);
        assert_eq!(rejected.to_vec(), vec![10]);

        <Applicants<Test>>::put(vec![40, 30, 20, 10]);
        let mut applicants = Election::applicants();

        for applicant in applicants.iter() {
            <ApplicantStakes<Test>>::insert(
                applicant,
                Stake {
                    new: 20,
                    transferred: 0,
                },
            );
        }

        // stable sort is preserving order when two elements are equivalent
        let rejected = Election::find_least_staked_applicants(&mut applicants, 3);
        assert_eq!(rejected.to_vec(), vec![40]);
    });
}

#[test]
fn refunding_applicant_stakes_should_work() {
    initial_test_ext().execute_with(|| {
        let _ = Balances::deposit_creating(&1, 1000);
        let _ = Balances::deposit_creating(&2, 7000);
        let _ = Balances::reserve(&2, 5000);
        let _ = Balances::deposit_creating(&3, 8000);
        let _ = Balances::reserve(&3, 5000);

        <Applicants<Test>>::put(vec![1, 2, 3]);

        save_transferable_stake(
            1,
            TransferableStake {
                seat: 50,
                backing: 0,
            },
        );
        save_transferable_stake(
            2,
            TransferableStake {
                seat: 0,
                backing: 0,
            },
        );
        save_transferable_stake(
            3,
            TransferableStake {
                seat: 0,
                backing: 0,
            },
        );

        <ApplicantStakes<Test>>::insert(
            1,
            Stake {
                new: 100,
                transferred: 200,
            },
        );

        <ApplicantStakes<Test>>::insert(
            2,
            Stake {
                new: 300,
                transferred: 400,
            },
        );

        <ApplicantStakes<Test>>::insert(
            3,
            Stake {
                new: 500,
                transferred: 600,
            },
        );

        Election::drop_applicants(&vec![2, 3][..]);

        assert_eq!(Election::applicants(), vec![1]);

        assert_eq!(Election::applicant_stakes(1).new, 100);
        assert_eq!(Election::applicant_stakes(1).transferred, 200);
        assert_eq!(Election::transferable_stakes(1).seat, 50);
        assert_eq!(Balances::free_balance(&1), 1000);

        //assert_eq!(Election::applicant_stakes(2), Default::default());
        assert!(!<ApplicantStakes<Test>>::exists(2));
        assert_eq!(Election::transferable_stakes(2).seat, 400);
        assert_eq!(Balances::free_balance(&2), 2300);

        //assert_eq!(Election::applicant_stakes(3), Default::default());
        assert!(!<ApplicantStakes<Test>>::exists(3));
        assert_eq!(Election::transferable_stakes(3).seat, 600);
        assert_eq!(Balances::free_balance(&3), 3500);
    });
}

#[test]
fn voting_should_work() {
    initial_test_ext().execute_with(|| {
        let _ = Balances::deposit_creating(&20, 1000);
        let payload = vec![10u8];
        let commitment = <Test as system::Trait>::Hashing::hash(&payload[..]);

        assert!(Election::try_add_vote(20, 100, commitment).is_ok());

        assert_eq!(Election::commitments(), vec![commitment]);
        assert_eq!(Election::votes(commitment).voter, 20);
        assert_eq!(Election::votes(commitment).commitment, commitment);
        assert_eq!(
            Election::votes(commitment).stake,
            Stake {
                new: 100,
                transferred: 0,
            }
        );
        assert_eq!(Balances::free_balance(&20), 900);
    });
}

fn save_transferable_stake(id: u64, stake: TransferableStake<u64>) {
    <TransferableStakes<Test>>::insert(id, stake);
}

#[test]
fn votes_can_be_covered_by_transferable_stake() {
    initial_test_ext().execute_with(|| {
        let _ = Balances::deposit_creating(&20, 1000);

        save_transferable_stake(
            20,
            TransferableStake {
                seat: 0,
                backing: 500,
            },
        );

        let payload = vec![10u8];
        let commitment = <Test as system::Trait>::Hashing::hash(&payload[..]);

        assert!(Election::try_add_vote(20, 100, commitment).is_ok());

        assert_eq!(Election::commitments(), vec![commitment]);
        assert_eq!(Election::votes(commitment).voter, 20);
        assert_eq!(Election::votes(commitment).commitment, commitment);
        assert_eq!(
            Election::votes(commitment).stake,
            Stake {
                new: 0,
                transferred: 100,
            }
        );
        assert_eq!(Balances::free_balance(&20), 1000);
    });
}

#[test]
fn voting_without_enough_balance_should_not_work() {
    initial_test_ext().execute_with(|| {
        let _ = Balances::deposit_creating(&20, 100);

        save_transferable_stake(
            20,
            TransferableStake {
                seat: 0,
                backing: 500,
            },
        );

        let payload = vec![10u8];
        let commitment = <Test as system::Trait>::Hashing::hash(&payload[..]);

        assert!(Election::try_add_vote(20, 1000, commitment).is_err());
        assert_eq!(Election::commitments(), vec![]);
        assert!(!<Votes<Test>>::exists(commitment));
        assert_eq!(Balances::free_balance(&20), 100);
    });
}

#[test]
fn voting_with_existing_commitment_should_not_work() {
    initial_test_ext().execute_with(|| {
        let _ = Balances::deposit_creating(&20, 1000);

        save_transferable_stake(
            20,
            TransferableStake {
                seat: 0,
                backing: 500,
            },
        );

        let payload = vec![10u8];
        let commitment = <Test as system::Trait>::Hashing::hash(&payload[..]);

        assert!(Election::try_add_vote(20, 100, commitment).is_ok());

        assert_eq!(Election::commitments(), vec![commitment]);
        assert_eq!(Election::votes(commitment).voter, 20);
        assert_eq!(Election::votes(commitment).commitment, commitment);
        assert_eq!(
            Election::votes(commitment).stake,
            Stake {
                new: 0,
                transferred: 100,
            }
        );
        assert_eq!(Balances::free_balance(&20), 1000);

        assert!(Election::try_add_vote(30, 100, commitment).is_err());
    });
}

fn make_commitment_for_applicant(
    applicant: <Test as system::Trait>::AccountId,
    salt: &mut Vec<u8>,
) -> <Test as system::Trait>::Hash {
    let mut payload = applicant.encode();
    payload.append(salt);
    <Test as system::Trait>::Hashing::hash(&payload[..])
}

#[test]
fn revealing_vote_works() {
    initial_test_ext().execute_with(|| {
        let applicant = 20 as u64;
        let salt = vec![128u8];
        let commitment = make_commitment_for_applicant(applicant, &mut salt.clone());
        let voter = 10 as u64;

        <ApplicantStakes<Test>>::insert(
            &applicant,
            Stake {
                new: 0,
                transferred: 0,
            },
        );

        <Votes<Test>>::insert(
            &commitment,
            SealedVote::new(
                voter,
                Stake {
                    new: 100,
                    transferred: 0,
                },
                commitment,
            ),
        );

        assert!(<Votes<Test>>::get(commitment).is_not_revealed());
        assert!(Election::try_reveal_vote(voter, commitment, applicant, salt).is_ok());
        assert_eq!(
            <Votes<Test>>::get(commitment).get_vote().unwrap(),
            applicant
        );
    });
}

#[test]
fn revealing_with_bad_salt_should_not_work() {
    initial_test_ext().execute_with(|| {
        let applicant = 20 as u64;
        let salt = vec![128u8];
        let commitment = make_commitment_for_applicant(applicant, &mut salt.clone());
        let voter = 10 as u64;

        <ApplicantStakes<Test>>::insert(
            &applicant,
            Stake {
                new: 0,
                transferred: 0,
            },
        );

        <Votes<Test>>::insert(
            &commitment,
            SealedVote::new(
                voter,
                Stake {
                    new: 100,
                    transferred: 0,
                },
                commitment,
            ),
        );

        assert!(<Votes<Test>>::get(commitment).is_not_revealed());
        assert!(Election::try_reveal_vote(voter, commitment, applicant, vec![]).is_err());
        assert!(<Votes<Test>>::get(commitment).is_not_revealed());
    });
}

#[test]
fn revealing_non_matching_commitment_should_not_work() {
    initial_test_ext().execute_with(|| {
        let applicant = 20 as u64;
        let salt = vec![128u8];
        let commitment = make_commitment_for_applicant(100, &mut salt.clone());
        let voter = 10 as u64;

        <ApplicantStakes<Test>>::insert(
            &applicant,
            Stake {
                new: 0,
                transferred: 0,
            },
        );

        assert!(Election::try_reveal_vote(voter, commitment, applicant, vec![]).is_err());
    });
}

#[test]
fn revealing_for_non_applicant_should_not_work() {
    initial_test_ext().execute_with(|| {
        let applicant = 20 as u64;
        let salt = vec![128u8];
        let commitment = make_commitment_for_applicant(applicant, &mut salt.clone());
        let voter = 10 as u64;

        <Votes<Test>>::insert(
            &commitment,
            SealedVote::new(
                voter,
                Stake {
                    new: 100,
                    transferred: 0,
                },
                commitment,
            ),
        );

        assert!(<Votes<Test>>::get(commitment).is_not_revealed());
        assert!(Election::try_reveal_vote(voter, commitment, applicant, vec![]).is_err());
        assert!(<Votes<Test>>::get(commitment).is_not_revealed());
    });
}

#[test]
fn revealing_by_non_committer_should_not_work() {
    initial_test_ext().execute_with(|| {
        let applicant = 20 as u64;
        let salt = vec![128u8];
        let commitment = make_commitment_for_applicant(applicant, &mut salt.clone());
        let voter = 10 as u64;
        let not_voter = 100 as u64;

        <ApplicantStakes<Test>>::insert(
            &applicant,
            Stake {
                new: 0,
                transferred: 0,
            },
        );

        <Votes<Test>>::insert(
            &commitment,
            SealedVote::new(
                voter,
                Stake {
                    new: 100,
                    transferred: 0,
                },
                commitment,
            ),
        );

        assert!(<Votes<Test>>::get(commitment).is_not_revealed());
        assert!(Election::try_reveal_vote(not_voter, commitment, applicant, salt).is_err());
        assert!(<Votes<Test>>::get(commitment).is_not_revealed());
    });
}

pub fn mock_votes(
    mock: Vec<(u64, u64, u64, u64)>,
) -> Vec<SealedVote<u64, Stake<u64>, primitives::H256, u64>> {
    let commitment = make_commitment_for_applicant(1, &mut vec![0u8]);

    mock.into_iter()
        .map(|(voter, stake_ref, stake_tran, applicant)| {
            SealedVote::new_unsealed(
                voter as u64,
                Stake {
                    new: stake_ref,
                    transferred: stake_tran,
                },
                commitment,
                applicant as u64,
            )
        })
        .collect()
}

#[test]
fn vote_tallying_should_work() {
    initial_test_ext().execute_with(|| {
        let votes = mock_votes(vec![
            //  (voter, stake[new], stake[transferred], applicant)
            (10, 100, 0, 100),
            (10, 150, 0, 100),
            (10, 500, 0, 200),
            (20, 200, 0, 200),
            (30, 300, 0, 300),
            (30, 400, 0, 300),
        ]);

        let tally = Election::tally_votes(&votes);

        assert_eq!(tally.len(), 3);

        assert_eq!(tally.get(&100).unwrap().member, 100);
        assert_eq!(
            tally.get(&100).unwrap().backers,
            vec![
                Backer {
                    member: 10 as u64,
                    stake: 100 as u64,
                },
                Backer {
                    member: 10 as u64,
                    stake: 150 as u64,
                },
            ]
        );

        assert_eq!(tally.get(&200).unwrap().member, 200);
        assert_eq!(
            tally.get(&200).unwrap().backers,
            vec![
                Backer {
                    member: 10 as u64,
                    stake: 500 as u64,
                },
                Backer {
                    member: 20 as u64,
                    stake: 200 as u64,
                }
            ]
        );

        assert_eq!(tally.get(&300).unwrap().member, 300);
        assert_eq!(
            tally.get(&300).unwrap().backers,
            vec![
                Backer {
                    member: 30 as u64,
                    stake: 300 as u64,
                },
                Backer {
                    member: 30 as u64,
                    stake: 400 as u64,
                }
            ]
        );
    });
}

#[test]
fn filter_top_staked_applicants_should_work() {
    initial_test_ext().execute_with(|| {
        // filter_top_staked depends on order of applicants
        <Applicants<Test>>::put(vec![100, 200, 300]);

        {
            let votes = mock_votes(vec![
                //  (voter, stake[new], stake[transferred], applicant)
                (10, 100, 0, 100),
                (10, 150, 0, 100),
                (10, 500, 0, 200),
                (20, 200, 0, 200),
                (30, 300, 0, 300),
                (30, 400, 0, 300),
            ]);

            let mut tally = Election::tally_votes(&votes);
            assert_eq!(tally.len(), 3);
            Election::filter_top_staked(&mut tally, 3);
            assert_eq!(tally.len(), 3);
        }

        {
            let votes = mock_votes(vec![
                //  (voter, stake[new], stake[transferred], applicant)
                (10, 100, 0, 100),
                (10, 150, 0, 100),
                (10, 500, 0, 200),
                (20, 200, 0, 200),
                (30, 300, 0, 300),
                (30, 400, 0, 300),
            ]);

            let mut tally = Election::tally_votes(&votes);
            assert_eq!(tally.len(), 3);
            Election::filter_top_staked(&mut tally, 2);
            assert_eq!(tally.len(), 2);
            assert!(tally.get(&200).is_some());
            assert!(tally.get(&300).is_some());
        }
    });
}

#[test]
fn drop_unelected_applicants_should_work() {
    initial_test_ext().execute_with(|| {
        <Applicants<Test>>::put(vec![100, 200, 300]);

        let _ = Balances::deposit_creating(&100, 2000);
        let _ = Balances::reserve(&100, 1000);

        <ApplicantStakes<Test>>::insert(
            100,
            Stake {
                new: 20 as u64,
                transferred: 50 as u64,
            },
        );

        save_transferable_stake(
            100,
            TransferableStake {
                seat: 100,
                backing: 0,
            },
        );

        let mut new_council: BTreeMap<u64, Seat<u64, u64>> = BTreeMap::new();
        new_council.insert(
            200 as u64,
            Seat {
                member: 200 as u64,
                stake: 0 as u64,
                backers: vec![],
            },
        );
        new_council.insert(
            300 as u64,
            Seat {
                member: 300 as u64,
                stake: 0 as u64,
                backers: vec![],
            },
        );

        Election::drop_unelected_applicants(&new_council);

        // applicant dropped
        assert_eq!(Election::applicants(), vec![200, 300]);
        assert!(!<ApplicantStakes<Test>>::exists(100));

        // and refunded
        assert_eq!(Election::transferable_stakes(100).seat, 150);
        assert_eq!(Balances::free_balance(&100), 1020);
        assert_eq!(Balances::reserved_balance(&100), 980);
    });
}

#[test]
fn refunding_voting_stakes_should_work() {
    initial_test_ext().execute_with(|| {
        // voters' balances
        let _ = Balances::deposit_creating(&10, 6000);
        let _ = Balances::reserve(&10, 5000);
        let _ = Balances::deposit_creating(&20, 7000);
        let _ = Balances::reserve(&20, 5000);
        let _ = Balances::deposit_creating(&30, 8000);
        let _ = Balances::reserve(&30, 5000);

        save_transferable_stake(
            10,
            TransferableStake {
                seat: 0,
                backing: 100,
            },
        );
        save_transferable_stake(
            20,
            TransferableStake {
                seat: 0,
                backing: 200,
            },
        );
        save_transferable_stake(
            30,
            TransferableStake {
                seat: 0,
                backing: 300,
            },
        );

        let votes = mock_votes(vec![
            //  (voter, stake[new], stake[transferred], applicant)
            (10, 100, 20, 100),
            (20, 200, 40, 100),
            (30, 300, 60, 100),
            (10, 500, 70, 200),
            (20, 600, 80, 200),
            (30, 700, 90, 200),
            (10, 800, 100, 300),
            (20, 900, 120, 300),
            (30, 1000, 140, 300),
        ]);

        let mut new_council: BTreeMap<u64, Seat<u64, u64>> = BTreeMap::new();
        new_council.insert(
            200 as u64,
            Seat {
                member: 200 as u64,
                stake: 0 as u64,
                backers: vec![],
            },
        );
        new_council.insert(
            300 as u64,
            Seat {
                member: 300 as u64,
                stake: 0 as u64,
                backers: vec![],
            },
        );

        Election::refund_voting_stakes(&votes, &new_council);

        assert_eq!(Balances::free_balance(&10), 1100);
        assert_eq!(Balances::reserved_balance(&10), 4900);
        assert_eq!(Balances::free_balance(&20), 2200);
        assert_eq!(Balances::reserved_balance(&20), 4800);
        assert_eq!(Balances::free_balance(&30), 3300);
        assert_eq!(Balances::reserved_balance(&30), 4700);

        assert_eq!(Election::transferable_stakes(10).backing, 120);
        assert_eq!(Election::transferable_stakes(20).backing, 240);
        assert_eq!(Election::transferable_stakes(30).backing, 360);
    });
}

#[test]
fn unlock_transferable_stakes_should_work() {
    initial_test_ext().execute_with(|| {
        <ExistingStakeHolders<Test>>::put(vec![10, 20, 30]);

        let _ = Balances::deposit_creating(&10, 6000);
        let _ = Balances::reserve(&10, 5000);
        save_transferable_stake(
            10,
            TransferableStake {
                seat: 50,
                backing: 100,
            },
        );

        let _ = Balances::deposit_creating(&20, 7000);
        let _ = Balances::reserve(&20, 5000);
        save_transferable_stake(
            20,
            TransferableStake {
                seat: 60,
                backing: 200,
            },
        );

        let _ = Balances::deposit_creating(&30, 8000);
        let _ = Balances::reserve(&30, 5000);
        save_transferable_stake(
            30,
            TransferableStake {
                seat: 70,
                backing: 300,
            },
        );

        Election::unlock_transferable_stakes();

        assert_eq!(Balances::free_balance(&10), 1150);
        assert_eq!(Balances::free_balance(&20), 2260);
        assert_eq!(Balances::free_balance(&30), 3370);
    });
}

#[test]
fn council_elected_hook_should_work() {
    initial_test_ext().execute_with(|| {
        let mut new_council: BTreeMap<u64, Seat<u64, u64>> = BTreeMap::new();
        new_council.insert(
            200 as u64,
            Seat {
                member: 200 as u64,
                stake: 10 as u64,
                backers: vec![],
            },
        );
        new_council.insert(
            300 as u64,
            Seat {
                member: 300 as u64,
                stake: 20 as u64,
                backers: vec![],
            },
        );

        assert_eq!(Council::active_council().len(), 0);

        let new_council = new_council
            .into_iter()
            .map(|(_, seat)| seat.clone())
            .collect();
        <Test as election::Trait>::CouncilElected::council_elected(new_council, 10);

        assert_eq!(Council::active_council().len(), 2);
    });
}

#[test]
fn simulation() {
    initial_test_ext().execute_with(|| {
        assert_eq!(Council::active_council().len(), 0);
        assert!(Election::stage().is_none());

        CouncilSize::put(10);
        <MinCouncilStake<Test>>::put(50);
        <AnnouncingPeriod<Test>>::put(10);
        <VotingPeriod<Test>>::put(10);
        <RevealingPeriod<Test>>::put(10);
        CandidacyLimit::put(20);
        <NewTermDuration<Test>>::put(100);
        <MinVotingStake<Test>>::put(10);

        for i in 1..30 {
            let _ = Balances::deposit_creating(&(i as u64), 50000);
        }

        System::set_block_number(1);
        assert_ok!(Election::start_election(vec![]));

        for i in 1..20 {
            if i < 21 {
                assert!(Election::apply(Origin::signed(i), 150).is_ok());
            } else {
                assert!(Election::apply(Origin::signed(i + 1000), 150).is_err()); // not enough free balance
                assert!(Election::apply(Origin::signed(i), 20).is_err()); // not enough minimum stake
            }
        }

        let n = 1 + Election::announcing_period();
        System::set_block_number(n);
        let _ = Election::on_finalize(n);

        for i in 1..20 {
            assert!(Election::vote(
                Origin::signed(i),
                make_commitment_for_applicant(i, &mut vec![40u8]),
                100
            )
            .is_ok());

            assert!(Election::vote(
                Origin::signed(i),
                make_commitment_for_applicant(i, &mut vec![41u8]),
                100
            )
            .is_ok());

            assert!(Election::vote(
                Origin::signed(i),
                make_commitment_for_applicant(i + 1000, &mut vec![42u8]),
                100
            )
            .is_ok());
        }

        let n = n + Election::voting_period();
        System::set_block_number(n);
        let _ = Election::on_finalize(n);

        for i in 1..20 {
            assert!(Election::reveal(
                Origin::signed(i),
                make_commitment_for_applicant(i, &mut vec![40u8]),
                i,
                vec![40u8]
            )
            .is_ok());
            //wrong salt
            assert!(Election::reveal(
                Origin::signed(i),
                make_commitment_for_applicant(i, &mut vec![41u8]),
                i,
                vec![]
            )
            .is_err());
            //vote not for valid applicant
            assert!(Election::reveal(
                Origin::signed(i),
                make_commitment_for_applicant(i + 1000, &mut vec![42u8]),
                i + 1000,
                vec![42u8]
            )
            .is_err());
        }

        let n = n + Election::revealing_period();
        System::set_block_number(n);
        let _ = Election::on_finalize(n);

        assert_eq!(
            Council::active_council().len(),
            Election::council_size_usize()
        );
        for (i, seat) in Council::active_council().iter().enumerate() {
            assert_eq!(seat.member, (i + 1) as u64);
        }
        assert!(Election::stage().is_none());

        // When council term ends.. start a new election.
        assert_ok!(Election::start_election(vec![]));
    });
}

#[test]
fn setting_election_parameters() {
    initial_test_ext().execute_with(|| {
        let default_parameters: ElectionParameters<u64, u64> = ElectionParameters::default();
        // default all zeros is invalid
        assert!(default_parameters.ensure_valid().is_err());

        let new_parameters = ElectionParameters {
            announcing_period: 1,
            voting_period: 2,
            revealing_period: 3,
            council_size: 4,
            candidacy_limit: 5,
            min_voting_stake: 6,
            min_council_stake: 7,
            new_term_duration: 8,
        };

        assert_ok!(Election::set_election_parameters(
            Origin::ROOT,
            new_parameters
        ));

        assert_eq!(
            <AnnouncingPeriod<Test>>::get(),
            new_parameters.announcing_period
        );
        assert_eq!(<VotingPeriod<Test>>::get(), new_parameters.voting_period);
        assert_eq!(
            <RevealingPeriod<Test>>::get(),
            new_parameters.revealing_period
        );
        assert_eq!(
            <MinCouncilStake<Test>>::get(),
            new_parameters.min_council_stake
        );
        assert_eq!(
            <NewTermDuration<Test>>::get(),
            new_parameters.new_term_duration
        );
        assert_eq!(CouncilSize::get(), new_parameters.council_size);
        assert_eq!(CandidacyLimit::get(), new_parameters.candidacy_limit);
        assert_eq!(
            <MinVotingStake<Test>>::get(),
            new_parameters.min_voting_stake
        );
    });
}

// TODO: check for obsolescence and duplicities with older test (above)
/////////////////// New council - test /////////////////////////////////////////

#[test]
fn locks_is_locking_funds() {
    initial_test_ext().execute_with(|| {
        // check that funds locked by account cannot be accessed until lock expires
    })
}

#[test]
fn locks_funds_can_be_used_to_vote() {
    initial_test_ext().execute_with(|| {
        // check that funds locked by account for some purpose can be also used for voting
    })
}

#[test]
fn locks_expires_on_next_council_election() {
    initial_test_ext().execute_with(|| {
        // check that lock expires when next election starts reveal period and can be withdrawn
    })
}

#[test]
fn locks_expires_on_next_council_election() {
    initial_test_ext().execute_with(|| {
        // check that lock expires when next election starts reveal period
    })
}

#[test]
fn locks_can_be_reused_for_following_election() {
    initial_test_ext().execute_with(|| {
        // check that locked funds can be used for candidacy in following council election
    })
}

// revealing vote
// there are test for that above
