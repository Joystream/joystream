use super::mock::{Balances, Bureaucracy1, Membership, System, Test, TestEvent};
use crate::types::{
    OpeningPolicyCommitment, RewardPolicy, Worker, WorkerApplication, WorkerOpening,
    WorkerRoleStakeProfile,
};
use crate::Error;
use crate::{Instance1, RawEvent};
use common::constraints::InputValidationLengthConstraint;
use srml_support::{StorageLinkedMap, StorageValue};
use std::collections::BTreeSet;
use system::{EventRecord, Phase, RawOrigin};

pub struct IncreaseWorkerStakeFixture {
    origin: RawOrigin<u64>,
    worker_id: u64,
    balance: u64,
    account_id: u64,
}

impl IncreaseWorkerStakeFixture {
    pub fn default_for_worker_id(worker_id: u64) -> Self {
        let account_id = 1;
        IncreaseWorkerStakeFixture {
            origin: RawOrigin::Signed(1),
            worker_id,
            balance: 10,
            account_id,
        }
    }
    pub fn with_origin(self, origin: RawOrigin<u64>) -> Self {
        IncreaseWorkerStakeFixture { origin, ..self }
    }

    pub fn with_balance(self, balance: u64) -> Self {
        IncreaseWorkerStakeFixture { balance, ..self }
    }

    pub fn call_and_assert(&self, expected_result: Result<(), Error>) {
        let stake_id = 0;
        let old_stake = <stake::Module<Test>>::stakes(stake_id);
        let old_balance = Balances::free_balance(&self.account_id);
        let actual_result = Bureaucracy1::increase_worker_stake(
            self.origin.clone().into(),
            self.worker_id,
            self.balance,
        );

        assert_eq!(actual_result, expected_result);

        if actual_result.is_ok() {
            let new_stake = <stake::Module<Test>>::stakes(stake_id);

            // stake increased
            assert_eq!(
                get_stake_balance(new_stake),
                get_stake_balance(old_stake) + self.balance
            );

            let new_balance = Balances::free_balance(&self.account_id);

            // worker balance decreased
            assert_eq!(new_balance, old_balance - self.balance,);
        }
    }
}

pub struct TerminateWorkerRoleFixture {
    worker_id: u64,
    origin: RawOrigin<u64>,
    text: Vec<u8>,
    constraint: InputValidationLengthConstraint,
}

impl TerminateWorkerRoleFixture {
    pub fn default_for_worker_id(worker_id: u64) -> Self {
        TerminateWorkerRoleFixture {
            worker_id,
            origin: RawOrigin::Signed(1),
            text: b"rationale_text".to_vec(),
            constraint: InputValidationLengthConstraint {
                min: 1,
                max_min_diff: 20,
            },
        }
    }
    pub fn with_origin(self, origin: RawOrigin<u64>) -> Self {
        TerminateWorkerRoleFixture { origin, ..self }
    }

    pub fn with_text(self, text: Vec<u8>) -> Self {
        TerminateWorkerRoleFixture { text, ..self }
    }

    pub fn call_and_assert(&self, expected_result: Result<(), Error>) {
        <crate::WorkerExitRationaleText<Instance1>>::put(self.constraint.clone());

        let actual_result = Bureaucracy1::terminate_worker_role(
            self.origin.clone().into(),
            self.worker_id,
            self.text.clone(),
        );
        assert_eq!(actual_result, expected_result);

        if actual_result.is_ok() {
            if actual_result.is_ok() {
                assert!(!<crate::WorkerById<Test, crate::Instance1>>::exists(
                    self.worker_id
                ));
            }
        }
    }
}

pub(crate) struct LeaveWorkerRoleFixture {
    worker_id: u64,
    origin: RawOrigin<u64>,
}

impl LeaveWorkerRoleFixture {
    pub fn default_for_worker_id(worker_id: u64) -> Self {
        LeaveWorkerRoleFixture {
            worker_id,
            origin: RawOrigin::Signed(1),
        }
    }
    pub fn with_origin(self, origin: RawOrigin<u64>) -> Self {
        LeaveWorkerRoleFixture { origin, ..self }
    }

    pub fn call_and_assert(&self, expected_result: Result<(), Error>) {
        let rationale_text = b"rationale_text".to_vec();
        let actual_result = Bureaucracy1::leave_worker_role(
            self.origin.clone().into(),
            self.worker_id,
            rationale_text.clone(),
        );
        assert_eq!(actual_result, expected_result);

        if actual_result.is_ok() {
            assert!(!<crate::WorkerById<Test, crate::Instance1>>::exists(
                self.worker_id
            ));
        }
    }
}

pub struct UpdateWorkerRewardAccountFixture {
    worker_id: u64,
    new_role_account_id: u64,
    origin: RawOrigin<u64>,
}

impl UpdateWorkerRewardAccountFixture {
    pub fn default_with_ids(worker_id: u64, new_role_account_id: u64) -> Self {
        UpdateWorkerRewardAccountFixture {
            worker_id,
            new_role_account_id,
            origin: RawOrigin::Signed(1),
        }
    }
    pub fn with_origin(self, origin: RawOrigin<u64>) -> Self {
        UpdateWorkerRewardAccountFixture { origin, ..self }
    }

    pub fn call_and_assert(&self, expected_result: Result<(), Error>) {
        assert_eq!(
            Bureaucracy1::update_worker_reward_account(
                self.origin.clone().into(),
                self.worker_id,
                self.new_role_account_id
            ),
            expected_result
        );
    }
}

pub struct UpdateWorkerRoleAccountFixture {
    worker_id: u64,
    new_role_account_id: u64,
    origin: RawOrigin<u64>,
}

impl UpdateWorkerRoleAccountFixture {
    pub fn default_with_ids(worker_id: u64, new_role_account_id: u64) -> Self {
        UpdateWorkerRoleAccountFixture {
            worker_id,
            new_role_account_id,
            origin: RawOrigin::Signed(1),
        }
    }
    pub fn with_origin(self, origin: RawOrigin<u64>) -> Self {
        UpdateWorkerRoleAccountFixture { origin, ..self }
    }

    pub fn call_and_assert(&self, expected_result: Result<(), Error>) {
        let actual_result = Bureaucracy1::update_worker_role_account(
            self.origin.clone().into(),
            self.worker_id,
            self.new_role_account_id,
        );
        assert_eq!(actual_result, expected_result);

        if actual_result.is_ok() {
            let worker = Bureaucracy1::worker_by_id(self.worker_id);

            assert_eq!(worker.role_account, self.new_role_account_id);
        }
    }
}

pub struct UnsetLeadFixture;
impl UnsetLeadFixture {
    pub fn unset_lead() {
        assert_eq!(Bureaucracy1::unset_lead(RawOrigin::Root.into()), Ok(()));
    }

    pub fn call_and_assert(origin: RawOrigin<u64>, expected_result: Result<(), Error>) {
        assert_eq!(Bureaucracy1::unset_lead(origin.into()), expected_result);
    }
}

pub fn set_mint_id(mint_id: u64) {
    <crate::Mint<Test, crate::Instance1>>::put(mint_id);
}

pub fn create_mint() -> u64 {
    <minting::Module<Test>>::add_mint(100, None).unwrap()
}

pub struct FillWorkerOpeningFixture {
    origin: RawOrigin<u64>,
    opening_id: u64,
    successful_worker_application_ids: BTreeSet<u64>,
    role_account: u64,
    reward_policy: Option<RewardPolicy<u64, u64>>,
}

impl FillWorkerOpeningFixture {
    pub fn default_for_ids(opening_id: u64, application_ids: Vec<u64>) -> Self {
        let application_ids: BTreeSet<u64> = application_ids.iter().map(|x| *x).collect();

        FillWorkerOpeningFixture {
            origin: RawOrigin::Signed(1),
            opening_id,
            successful_worker_application_ids: application_ids,
            role_account: 1,
            reward_policy: None,
        }
    }

    pub fn with_origin(self, origin: RawOrigin<u64>) -> Self {
        FillWorkerOpeningFixture { origin, ..self }
    }

    pub fn with_reward_policy(self, reward_policy: RewardPolicy<u64, u64>) -> Self {
        FillWorkerOpeningFixture {
            reward_policy: Some(reward_policy),
            ..self
        }
    }

    pub fn call_and_assert(&self, expected_result: Result<(), Error>) -> u64 {
        let saved_worker_next_id = Bureaucracy1::next_worker_id();
        let actual_result = Bureaucracy1::fill_worker_opening(
            self.origin.clone().into(),
            self.opening_id,
            self.successful_worker_application_ids.clone(),
            self.reward_policy.clone(),
        );
        assert_eq!(actual_result.clone(), expected_result);

        if actual_result.is_ok() {
            assert_eq!(Bureaucracy1::next_worker_id(), saved_worker_next_id + 1);
            let worker_id = saved_worker_next_id;

            let opening = Bureaucracy1::worker_opening_by_id(self.opening_id);

            let role_stake_profile = if opening
                .policy_commitment
                .application_staking_policy
                .is_some()
                || opening.policy_commitment.role_staking_policy.is_some()
            {
                let stake_id = 0;
                Some(WorkerRoleStakeProfile::new(
                    &stake_id,
                    &opening
                        .policy_commitment
                        .terminate_worker_role_stake_unstaking_period,
                    &opening
                        .policy_commitment
                        .exit_worker_role_stake_unstaking_period,
                ))
            } else {
                None
            };
            let reward_relationship = self.reward_policy.clone().map(|_| 0);

            let expected_worker = Worker {
                member_id: 1,
                role_account: self.role_account,
                reward_relationship,
                role_stake_profile,
            };

            let actual_worker = Bureaucracy1::worker_by_id(worker_id);

            assert_eq!(actual_worker, expected_worker);
        }

        saved_worker_next_id
    }
}

pub struct BeginReviewWorkerApplicationsFixture {
    origin: RawOrigin<u64>,
    opening_id: u64,
}

impl BeginReviewWorkerApplicationsFixture {
    pub fn default_for_opening_id(opening_id: u64) -> Self {
        BeginReviewWorkerApplicationsFixture {
            origin: RawOrigin::Signed(1),
            opening_id,
        }
    }
    pub fn with_origin(self, origin: RawOrigin<u64>) -> Self {
        BeginReviewWorkerApplicationsFixture { origin, ..self }
    }
    pub fn call_and_assert(&self, expected_result: Result<(), Error>) {
        let actual_result = Bureaucracy1::begin_worker_applicant_review(
            self.origin.clone().into(),
            self.opening_id,
        );
        assert_eq!(actual_result, expected_result);
    }
}

pub struct TerminateApplicationFixture {
    origin: RawOrigin<u64>,
    worker_application_id: u64,
}

impl TerminateApplicationFixture {
    pub fn with_signer(self, account_id: u64) -> Self {
        TerminateApplicationFixture {
            origin: RawOrigin::Signed(account_id),
            ..self
        }
    }
    pub fn with_origin(self, origin: RawOrigin<u64>) -> Self {
        TerminateApplicationFixture { origin, ..self }
    }
    pub fn default_for_application_id(application_id: u64) -> Self {
        TerminateApplicationFixture {
            origin: RawOrigin::Signed(1),
            worker_application_id: application_id,
        }
    }
    pub fn call_and_assert(&self, expected_result: Result<(), Error>) {
        let actual_result = Bureaucracy1::terminate_worker_application(
            self.origin.clone().into(),
            self.worker_application_id,
        );
        assert_eq!(actual_result.clone(), expected_result);
    }
}
pub struct WithdrawApplicationFixture {
    origin: RawOrigin<u64>,
    worker_application_id: u64,
}

impl WithdrawApplicationFixture {
    pub fn with_signer(self, account_id: u64) -> Self {
        WithdrawApplicationFixture {
            origin: RawOrigin::Signed(account_id),
            ..self
        }
    }
    pub fn with_origin(self, origin: RawOrigin<u64>) -> Self {
        WithdrawApplicationFixture { origin, ..self }
    }
    pub fn default_for_application_id(application_id: u64) -> Self {
        WithdrawApplicationFixture {
            origin: RawOrigin::Signed(1),
            worker_application_id: application_id,
        }
    }
    pub fn call_and_assert(&self, expected_result: Result<(), Error>) {
        let actual_result = Bureaucracy1::withdraw_worker_application(
            self.origin.clone().into(),
            self.worker_application_id,
        );
        assert_eq!(actual_result.clone(), expected_result);
    }
}

pub fn increase_total_balance_issuance_using_account_id(account_id: u64, balance: u64) {
    let _ =
        <Balances as srml_support::traits::Currency<u64>>::deposit_creating(&account_id, balance);
}

pub fn setup_members(count: u8) {
    let authority_account_id = 1;
    Membership::set_screening_authority(RawOrigin::Root.into(), authority_account_id).unwrap();

    for i in 0..count {
        let account_id: u64 = i as u64;
        let handle: [u8; 20] = [i; 20];
        Membership::add_screened_member(
            RawOrigin::Signed(authority_account_id).into(),
            account_id,
            membership::members::UserInfo {
                handle: Some(handle.to_vec()),
                avatar_uri: None,
                about: None,
            },
        )
        .unwrap();
    }
}

pub struct ApplyOnWorkerOpeningFixture {
    origin: RawOrigin<u64>,
    member_id: u64,
    worker_opening_id: u64,
    role_account: u64,
    opt_role_stake_balance: Option<u64>,
    opt_application_stake_balance: Option<u64>,
    human_readable_text: Vec<u8>,
}

impl ApplyOnWorkerOpeningFixture {
    pub fn with_text(self, text: Vec<u8>) -> Self {
        ApplyOnWorkerOpeningFixture {
            human_readable_text: text,
            ..self
        }
    }

    pub fn with_role_stake(self, stake: u64) -> Self {
        ApplyOnWorkerOpeningFixture {
            opt_role_stake_balance: Some(stake),
            ..self
        }
    }

    pub fn with_application_stake(self, stake: u64) -> Self {
        ApplyOnWorkerOpeningFixture {
            opt_application_stake_balance: Some(stake),
            ..self
        }
    }

    pub fn default_for_opening_id(opening_id: u64) -> Self {
        ApplyOnWorkerOpeningFixture {
            origin: RawOrigin::Signed(1),
            member_id: 1,
            worker_opening_id: opening_id,
            role_account: 1,
            opt_role_stake_balance: None,
            opt_application_stake_balance: None,
            human_readable_text: Vec::new(),
        }
    }

    pub fn call_and_assert(&self, expected_result: Result<(), Error>) -> u64 {
        let saved_application_next_id = Bureaucracy1::next_worker_application_id();
        let actual_result = Bureaucracy1::apply_on_worker_opening(
            self.origin.clone().into(),
            self.member_id,
            self.worker_opening_id,
            self.role_account,
            self.opt_role_stake_balance,
            self.opt_application_stake_balance,
            self.human_readable_text.clone(),
        );
        assert_eq!(actual_result.clone(), expected_result);

        if actual_result.is_ok() {
            assert_eq!(
                Bureaucracy1::next_worker_application_id(),
                saved_application_next_id + 1
            );
            let application_id = saved_application_next_id;

            let actual_application = Bureaucracy1::worker_application_by_id(application_id);

            let expected_application = WorkerApplication {
                role_account: self.role_account,
                worker_opening_id: self.worker_opening_id,
                member_id: self.member_id,
                application_id,
            };

            assert_eq!(actual_application, expected_application);

            let current_opening = Bureaucracy1::worker_opening_by_id(self.worker_opening_id);
            assert!(current_opening
                .worker_applications
                .contains(&application_id));
        }

        saved_application_next_id
    }
}

pub struct AcceptWorkerApplicationsFixture {
    origin: RawOrigin<u64>,
    opening_id: u64,
}

impl AcceptWorkerApplicationsFixture {
    pub fn default_for_opening_id(opening_id: u64) -> Self {
        AcceptWorkerApplicationsFixture {
            origin: RawOrigin::Signed(1),
            opening_id,
        }
    }

    pub fn call_and_assert(&self, expected_result: Result<(), Error>) {
        let actual_result =
            Bureaucracy1::accept_worker_applications(self.origin.clone().into(), self.opening_id);
        assert_eq!(actual_result, expected_result);
    }
}

pub struct SetLeadFixture;
impl SetLeadFixture {
    pub fn set_lead(lead_account_id: u64) {
        assert_eq!(
            Bureaucracy1::set_lead(RawOrigin::Root.into(), 1, lead_account_id),
            Ok(())
        );
    }

    pub fn call_and_assert(
        origin: RawOrigin<u64>,
        member_id: u64,
        account_id: u64,
        expected_result: Result<(), Error>,
    ) {
        assert_eq!(
            Bureaucracy1::set_lead(origin.into(), member_id, account_id),
            expected_result
        );
    }
}

pub struct AddWorkerOpeningFixture {
    origin: RawOrigin<u64>,
    activate_at: hiring::ActivateOpeningAt<u64>,
    commitment: OpeningPolicyCommitment<u64, u64>,
    human_readable_text: Vec<u8>,
}

impl Default for AddWorkerOpeningFixture {
    fn default() -> Self {
        AddWorkerOpeningFixture {
            origin: RawOrigin::Signed(1),
            activate_at: hiring::ActivateOpeningAt::CurrentBlock,
            commitment: <OpeningPolicyCommitment<u64, u64>>::default(),
            human_readable_text: Vec::new(),
        }
    }
}

impl AddWorkerOpeningFixture {
    pub fn with_policy_commitment(
        self,
        policy_commitment: OpeningPolicyCommitment<u64, u64>,
    ) -> Self {
        AddWorkerOpeningFixture {
            commitment: policy_commitment,
            ..self
        }
    }

    pub fn call_and_assert(&self, expected_result: Result<(), Error>) -> u64 {
        let saved_opening_next_id = Bureaucracy1::next_worker_opening_id();
        let actual_result = Bureaucracy1::add_worker_opening(
            self.origin.clone().into(),
            self.activate_at.clone(),
            self.commitment.clone(),
            self.human_readable_text.clone(),
        );
        assert_eq!(actual_result.clone(), expected_result);

        if actual_result.is_ok() {
            assert_eq!(
                Bureaucracy1::next_worker_opening_id(),
                saved_opening_next_id + 1
            );
            let opening_id = saved_opening_next_id;

            let actual_opening = Bureaucracy1::worker_opening_by_id(opening_id);

            let expected_opening = WorkerOpening::<u64, u64, u64, u64> {
                opening_id,
                worker_applications: BTreeSet::new(),
                policy_commitment: self.commitment.clone(),
            };

            assert_eq!(actual_opening, expected_opening);
        }

        saved_opening_next_id
    }

    pub fn with_text(self, text: Vec<u8>) -> Self {
        AddWorkerOpeningFixture {
            human_readable_text: text,
            ..self
        }
    }

    pub fn with_activate_at(self, activate_at: hiring::ActivateOpeningAt<u64>) -> Self {
        AddWorkerOpeningFixture {
            activate_at,
            ..self
        }
    }
}

pub struct EventFixture;
impl EventFixture {
    pub fn assert_crate_events(
        expected_raw_events: Vec<
            RawEvent<
                u64,
                u64,
                u64,
                u64,
                u64,
                u64,
                std::collections::BTreeMap<u64, u64>,
                Vec<u8>,
                crate::Instance1,
            >,
        >,
    ) {
        let converted_events = expected_raw_events
            .iter()
            .map(|ev| TestEvent::bureaucracy_Instance1(ev.clone()))
            .collect::<Vec<TestEvent>>();

        Self::assert_global_events(converted_events)
    }
    pub fn assert_global_events(expected_raw_events: Vec<TestEvent>) {
        let expected_events = expected_raw_events
            .iter()
            .map(|ev| EventRecord {
                phase: Phase::ApplyExtrinsic(0),
                event: ev.clone(),
                topics: vec![],
            })
            .collect::<Vec<EventRecord<_, _>>>();

        assert_eq!(System::events(), expected_events);
    }

    pub fn assert_last_crate_event(
        expected_raw_event: RawEvent<
            u64,
            u64,
            u64,
            u64,
            u64,
            u64,
            std::collections::BTreeMap<u64, u64>,
            Vec<u8>,
            crate::Instance1,
        >,
    ) {
        let converted_event = TestEvent::bureaucracy_Instance1(expected_raw_event);

        Self::assert_last_global_event(converted_event)
    }

    pub fn assert_last_global_event(expected_event: TestEvent) {
        let expected_event = EventRecord {
            phase: Phase::ApplyExtrinsic(0),
            event: expected_event,
            topics: vec![],
        };

        assert_eq!(System::events().pop().unwrap(), expected_event);
    }
}

pub struct DecreaseWorkerStakeFixture {
    origin: RawOrigin<u64>,
    worker_id: u64,
    balance: u64,
    account_id: u64,
}

impl DecreaseWorkerStakeFixture {
    pub fn default_for_worker_id(worker_id: u64) -> Self {
        let account_id = 1;
        DecreaseWorkerStakeFixture {
            origin: RawOrigin::Signed(account_id),
            worker_id,
            balance: 10,
            account_id,
        }
    }
    pub fn with_origin(self, origin: RawOrigin<u64>) -> Self {
        DecreaseWorkerStakeFixture { origin, ..self }
    }

    pub fn with_balance(self, balance: u64) -> Self {
        DecreaseWorkerStakeFixture { balance, ..self }
    }

    pub fn call_and_assert(&self, expected_result: Result<(), Error>) {
        let stake_id = 0;
        let old_balance = Balances::free_balance(&self.account_id);
        let old_stake = <stake::Module<Test>>::stakes(stake_id);
        let actual_result = Bureaucracy1::decrease_worker_stake(
            self.origin.clone().into(),
            self.worker_id,
            self.balance,
        );

        assert_eq!(actual_result, expected_result);

        if actual_result.is_ok() {
            let new_stake = <stake::Module<Test>>::stakes(stake_id);

            // stake decreased
            assert_eq!(
                get_stake_balance(new_stake),
                get_stake_balance(old_stake) - self.balance
            );

            let new_balance = Balances::free_balance(&self.account_id);

            // worker balance increased
            assert_eq!(new_balance, old_balance + self.balance,);
        }
    }
}

fn get_stake_balance(stake: stake::Stake<u64, u64, u64>) -> u64 {
    if let stake::StakingStatus::Staked(stake) = stake.staking_status {
        return stake.staked_amount;
    }

    panic!("Not staked.");
}

pub struct SlashWorkerStakeFixture {
    origin: RawOrigin<u64>,
    worker_id: u64,
    balance: u64,
    account_id: u64,
}

impl SlashWorkerStakeFixture {
    pub fn default_for_worker_id(worker_id: u64) -> Self {
        let account_id = 1;
        SlashWorkerStakeFixture {
            origin: RawOrigin::Signed(account_id),
            worker_id,
            balance: 10,
            account_id,
        }
    }
    pub fn with_origin(self, origin: RawOrigin<u64>) -> Self {
        SlashWorkerStakeFixture { origin, ..self }
    }

    pub fn with_balance(self, balance: u64) -> Self {
        SlashWorkerStakeFixture { balance, ..self }
    }

    pub fn call_and_assert(&self, expected_result: Result<(), Error>) {
        let stake_id = 0;
        let old_balance = Balances::free_balance(&self.account_id);
        let old_stake = <stake::Module<Test>>::stakes(stake_id);
        let actual_result = Bureaucracy1::slash_worker_stake(
            self.origin.clone().into(),
            self.worker_id,
            self.balance,
        );

        assert_eq!(actual_result, expected_result);

        if actual_result.is_ok() {
            let new_stake = <stake::Module<Test>>::stakes(stake_id);

            // stake decreased
            assert_eq!(
                get_stake_balance(new_stake),
                get_stake_balance(old_stake) - self.balance
            );

            let new_balance = Balances::free_balance(&self.account_id);

            // worker balance unchanged
            assert_eq!(new_balance, old_balance,);
        }
    }
}
