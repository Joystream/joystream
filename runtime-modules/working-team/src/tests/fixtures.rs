use frame_support::dispatch::{DispatchError, DispatchResult};
use frame_support::StorageMap;
use sp_runtime::traits::Hash;
use sp_std::collections::{btree_map::BTreeMap, btree_set::BTreeSet};
use system::{EventRecord, Phase, RawOrigin};

use super::hiring_workflow::HiringWorkflow;
use super::mock::{
    Balances, LockId, Membership, System, Test, TestEvent, TestWorkingTeam, TestWorkingTeamInstance,
};
use crate::{
    JobApplication, JobOpening, JobOpeningType, RawEvent, RewardPolicy, StakePolicy, TeamWorker,
};

pub struct EventFixture;
impl EventFixture {
    pub fn assert_last_crate_event(
        expected_raw_event: RawEvent<
            u64,
            u64,
            BTreeMap<u64, u64>,
            u64,
            u64,
            u64,
            TestWorkingTeamInstance,
        >,
    ) {
        let converted_event = TestEvent::working_team_TestWorkingTeamInstance(expected_raw_event);

        Self::assert_last_global_event(converted_event)
    }

    pub fn assert_last_global_event(expected_event: TestEvent) {
        let expected_event = EventRecord {
            phase: Phase::Initialization,
            event: expected_event,
            topics: vec![],
        };

        assert_eq!(System::events().pop().unwrap(), expected_event);
    }
}

pub struct AddOpeningFixture {
    origin: RawOrigin<u64>,
    description: Vec<u8>,
    opening_type: JobOpeningType,
    starting_block: u64,
    stake_policy: Option<StakePolicy<u64, u64>>,
    reward_policy: Option<RewardPolicy<u64>>,
}

impl Default for AddOpeningFixture {
    fn default() -> Self {
        Self {
            origin: RawOrigin::Signed(1),
            description: b"human_text".to_vec(),
            opening_type: JobOpeningType::Regular,
            starting_block: 0,
            stake_policy: None,
            reward_policy: None,
        }
    }
}

impl AddOpeningFixture {
    pub fn call_and_assert(&self, expected_result: DispatchResult) -> u64 {
        let saved_opening_next_id = TestWorkingTeam::next_opening_id();
        let actual_result = self.call().map(|_| ());

        assert_eq!(actual_result.clone(), expected_result);

        if actual_result.is_ok() {
            assert_eq!(
                TestWorkingTeam::next_opening_id(),
                saved_opening_next_id + 1
            );
            let opening_id = saved_opening_next_id;

            let actual_opening = TestWorkingTeam::opening_by_id(opening_id);

            let expected_hash = <Test as system::Trait>::Hashing::hash(&self.description);
            let expected_opening = JobOpening {
                created: self.starting_block,
                description_hash: expected_hash.as_ref().to_vec(),
                opening_type: self.opening_type,
                stake_policy: self.stake_policy.clone(),
                reward_policy: self.reward_policy.clone(),
            };

            assert_eq!(actual_opening, expected_opening);
        }

        saved_opening_next_id
    }

    pub fn call(&self) -> Result<u64, DispatchError> {
        let saved_opening_next_id = TestWorkingTeam::next_opening_id();
        TestWorkingTeam::add_opening(
            self.origin.clone().into(),
            self.description.clone(),
            self.opening_type,
            self.stake_policy.clone(),
            self.reward_policy.clone(),
        )?;

        Ok(saved_opening_next_id)
    }

    pub fn with_opening_type(self, opening_type: JobOpeningType) -> Self {
        Self {
            opening_type,
            ..self
        }
    }

    pub fn with_origin(self, origin: RawOrigin<u64>) -> Self {
        Self { origin, ..self }
    }

    pub fn with_starting_block(self, starting_block: u64) -> Self {
        Self {
            starting_block,
            ..self
        }
    }

    pub fn with_stake_policy(self, stake_policy: Option<StakePolicy<u64, u64>>) -> Self {
        Self {
            stake_policy,
            ..self
        }
    }

    pub fn with_reward_policy(self, reward_policy: Option<RewardPolicy<u64>>) -> Self {
        Self {
            reward_policy,
            ..self
        }
    }
}

pub struct ApplyOnOpeningFixture {
    origin: RawOrigin<u64>,
    member_id: u64,
    opening_id: u64,
    role_account_id: u64,
    staking_account_id: u64,
    description: Vec<u8>,
    stake: Option<u64>,
}

impl ApplyOnOpeningFixture {
    pub fn with_text(self, text: Vec<u8>) -> Self {
        Self {
            description: text,
            ..self
        }
    }

    pub fn with_origin(self, origin: RawOrigin<u64>, member_id: u64) -> Self {
        Self {
            origin,
            member_id,
            ..self
        }
    }

    pub fn with_stake(self, stake: Option<u64>) -> Self {
        Self { stake, ..self }
    }

    pub fn with_stake_account_id(self, staking_account_id: u64) -> Self {
        Self {
            staking_account_id,
            ..self
        }
    }

    pub fn default_for_opening_id(opening_id: u64) -> Self {
        Self {
            origin: RawOrigin::Signed(1),
            member_id: 1,
            opening_id,
            role_account_id: 1,
            staking_account_id: 1,
            description: b"human_text".to_vec(),
            stake: None,
        }
    }

    pub fn call(&self) -> Result<u64, DispatchError> {
        let saved_application_next_id = TestWorkingTeam::next_application_id();
        TestWorkingTeam::apply_on_opening(
            self.origin.clone().into(),
            self.member_id,
            self.opening_id,
            self.role_account_id,
            self.staking_account_id,
            self.description.clone(),
            self.stake,
        )?;

        Ok(saved_application_next_id)
    }
    pub fn call_and_assert(&self, expected_result: DispatchResult) -> u64 {
        let saved_application_next_id = TestWorkingTeam::next_application_id();

        let actual_result = self.call().map(|_| ());
        assert_eq!(actual_result.clone(), expected_result);

        if actual_result.is_ok() {
            assert_eq!(
                TestWorkingTeam::next_application_id(),
                saved_application_next_id + 1
            );
            let application_id = saved_application_next_id;

            let actual_application = TestWorkingTeam::application_by_id(application_id);

            let expected_hash = <Test as system::Trait>::Hashing::hash(&self.description);
            let expected_application = JobApplication::<Test> {
                role_account_id: self.role_account_id,
                staking_account_id: self.staking_account_id,
                member_id: self.member_id,
                description_hash: expected_hash.as_ref().to_vec(),
            };

            assert_eq!(actual_application, expected_application);
        }

        saved_application_next_id
    }
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
            Some(handle.to_vec()),
            None,
            None,
        )
        .unwrap();
    }
}

pub struct FillOpeningFixture {
    origin: RawOrigin<u64>,
    opening_id: u64,
    successful_application_ids: BTreeSet<u64>,
    role_account_id: u64,
    staking_account_id: u64,
    stake_policy: Option<StakePolicy<u64, u64>>,
    reward_policy: Option<RewardPolicy<u64>>,
}

impl FillOpeningFixture {
    pub fn default_for_ids(opening_id: u64, application_ids: Vec<u64>) -> Self {
        let application_ids: BTreeSet<u64> = application_ids.iter().map(|x| *x).collect();

        Self {
            origin: RawOrigin::Signed(1),
            opening_id,
            successful_application_ids: application_ids,
            role_account_id: 1,
            staking_account_id: 1,
            stake_policy: None,
            reward_policy: None,
        }
    }

    pub fn with_origin(self, origin: RawOrigin<u64>) -> Self {
        Self { origin, ..self }
    }

    pub fn with_stake_policy(self, stake_policy: Option<StakePolicy<u64, u64>>) -> Self {
        Self {
            stake_policy,
            ..self
        }
    }

    pub fn with_reward_policy(self, reward_policy: Option<RewardPolicy<u64>>) -> Self {
        Self {
            reward_policy,
            ..self
        }
    }

    pub fn call(&self) -> Result<u64, DispatchError> {
        let saved_worker_next_id = TestWorkingTeam::next_worker_id();
        TestWorkingTeam::fill_opening(
            self.origin.clone().into(),
            self.opening_id,
            self.successful_application_ids.clone(),
        )?;

        Ok(saved_worker_next_id)
    }

    pub fn call_and_assert(&self, expected_result: DispatchResult) -> u64 {
        let saved_worker_count = TestWorkingTeam::active_worker_count();
        let saved_worker_next_id = TestWorkingTeam::next_worker_id();
        let actual_result = self.call().map(|_| ());
        assert_eq!(actual_result.clone(), expected_result);

        if actual_result.is_ok() {
            assert_eq!(TestWorkingTeam::next_worker_id(), saved_worker_next_id + 1);
            let worker_id = saved_worker_next_id;

            assert!(
                !<crate::OpeningById<Test, TestWorkingTeamInstance>>::contains_key(self.opening_id)
            );

            for application_id in self.successful_application_ids.iter() {
                assert!(
                    !<crate::ApplicationById<Test, TestWorkingTeamInstance>>::contains_key(
                        application_id
                    )
                );
            }

            let expected_worker = TeamWorker::<Test> {
                member_id: 1,
                role_account_id: self.role_account_id,
                staking_account_id: self.staking_account_id,
                started_leaving_at: None,
                job_unstaking_period: self
                    .stake_policy
                    .as_ref()
                    .map_or(0, |sp| sp.unstaking_period),
                reward_per_block: self.reward_policy.as_ref().map(|rp| rp.reward_per_block),
                missed_reward: None,
            };

            let actual_worker = TestWorkingTeam::worker_by_id(worker_id);

            assert_eq!(actual_worker, expected_worker);

            let expected_worker_count =
                saved_worker_count + (self.successful_application_ids.len() as u32);

            assert_eq!(
                TestWorkingTeam::active_worker_count(),
                expected_worker_count
            );
        }

        saved_worker_next_id
    }
}

pub struct HireLeadFixture {
    setup_environment: bool,
    stake_policy: Option<StakePolicy<u64, u64>>,
}

impl Default for HireLeadFixture {
    fn default() -> Self {
        Self {
            setup_environment: true,
            stake_policy: None,
        }
    }
}
impl HireLeadFixture {
    pub fn with_setup_environment(self, setup_environment: bool) -> Self {
        Self {
            setup_environment,
            ..self
        }
    }

    pub fn with_stake_policy(self, stake_policy: Option<StakePolicy<u64, u64>>) -> Self {
        Self {
            stake_policy,
            ..self
        }
    }

    pub fn hire_lead(self) -> u64 {
        HiringWorkflow::default()
            .with_setup_environment(self.setup_environment)
            .with_opening_type(JobOpeningType::Leader)
            .with_stake_policy(self.stake_policy)
            .add_application(b"leader".to_vec())
            .execute()
            .unwrap()
    }

    pub fn expect(self, error: DispatchError) {
        HiringWorkflow::default()
            .with_setup_environment(self.setup_environment)
            .with_opening_type(JobOpeningType::Leader)
            .with_stake_policy(self.stake_policy)
            .add_application(b"leader".to_vec())
            .expect(Err(error))
            .execute();
    }
}

pub struct HireRegularWorkerFixture {
    setup_environment: bool,
    stake_policy: Option<StakePolicy<u64, u64>>,
    reward_policy: Option<RewardPolicy<u64>>,
}

impl Default for HireRegularWorkerFixture {
    fn default() -> Self {
        Self {
            setup_environment: true,
            stake_policy: None,
            reward_policy: None,
        }
    }
}
impl HireRegularWorkerFixture {
    pub fn with_stake_policy(self, stake_policy: Option<StakePolicy<u64, u64>>) -> Self {
        Self {
            stake_policy,
            ..self
        }
    }

    pub fn with_reward_policy(self, reward_policy: Option<RewardPolicy<u64>>) -> Self {
        Self {
            reward_policy,
            ..self
        }
    }

    pub fn hire(self) -> u64 {
        HiringWorkflow::default()
            .with_setup_environment(self.setup_environment)
            .with_opening_type(JobOpeningType::Regular)
            .with_stake_policy(self.stake_policy)
            .with_reward_policy(self.reward_policy)
            .add_application(b"worker".to_vec())
            .execute()
            .unwrap()
    }
}

pub struct UpdateWorkerRoleAccountFixture {
    worker_id: u64,
    new_role_account_id: u64,
    origin: RawOrigin<u64>,
}

impl UpdateWorkerRoleAccountFixture {
    pub fn default_with_ids(worker_id: u64, new_role_account_id: u64) -> Self {
        Self {
            worker_id,
            new_role_account_id,
            origin: RawOrigin::Signed(1),
        }
    }
    pub fn with_origin(self, origin: RawOrigin<u64>) -> Self {
        Self { origin, ..self }
    }

    pub fn call_and_assert(&self, expected_result: DispatchResult) {
        let actual_result = TestWorkingTeam::update_role_account(
            self.origin.clone().into(),
            self.worker_id,
            self.new_role_account_id,
        );
        assert_eq!(actual_result, expected_result);

        if actual_result.is_ok() {
            let worker = TestWorkingTeam::worker_by_id(self.worker_id);

            assert_eq!(worker.role_account_id, self.new_role_account_id);
        }
    }
}

pub(crate) struct LeaveWorkerRoleFixture {
    worker_id: u64,
    origin: RawOrigin<u64>,
    stake_policy: Option<StakePolicy<u64, u64>>,
}

impl LeaveWorkerRoleFixture {
    pub fn default_for_worker_id(worker_id: u64) -> Self {
        Self {
            worker_id,
            origin: RawOrigin::Signed(1),
            stake_policy: None,
        }
    }
    pub fn with_origin(self, origin: RawOrigin<u64>) -> Self {
        Self { origin, ..self }
    }

    pub fn with_stake_policy(self, stake_policy: Option<StakePolicy<u64, u64>>) -> Self {
        Self {
            stake_policy,
            ..self
        }
    }

    pub fn call_and_assert(&self, expected_result: DispatchResult) {
        let actual_result = TestWorkingTeam::leave_role(self.origin.clone().into(), self.worker_id);
        assert_eq!(actual_result, expected_result);

        if actual_result.is_ok() {
            if self.stake_policy.is_some() {
                let worker = TestWorkingTeam::worker_by_id(self.worker_id);

                if worker.job_unstaking_period > 0 {
                    assert_eq!(
                        worker.started_leaving_at,
                        Some(<system::Module<Test>>::block_number())
                    );
                    return;
                }
            }

            assert!(
                !<crate::WorkerById<Test, TestWorkingTeamInstance>>::contains_key(self.worker_id)
            );
        }
    }
}

pub struct TerminateWorkerRoleFixture {
    worker_id: u64,
    origin: RawOrigin<u64>,
    slash: bool,
}

impl TerminateWorkerRoleFixture {
    pub fn default_for_worker_id(worker_id: u64) -> Self {
        Self {
            worker_id,
            origin: RawOrigin::Signed(1),
            slash: false,
        }
    }
    pub fn with_origin(self, origin: RawOrigin<u64>) -> Self {
        Self { origin, ..self }
    }

    pub fn with_slash(self) -> Self {
        Self {
            slash: true,
            ..self
        }
    }

    pub fn call_and_assert(&self, expected_result: DispatchResult) {
        let actual_result =
            TestWorkingTeam::terminate_role(self.origin.clone().into(), self.worker_id, self.slash);
        assert_eq!(actual_result, expected_result);

        if actual_result.is_ok() {
            if actual_result.is_ok() {
                assert!(
                    !<crate::WorkerById<Test, TestWorkingTeamInstance>>::contains_key(
                        self.worker_id
                    )
                );
            }
        }
    }
}

pub fn increase_total_balance_issuance_using_account_id(account_id: u64, balance: u64) {
    let _ =
        <Balances as frame_support::traits::Currency<u64>>::deposit_creating(&account_id, balance);
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

        let lead_account_id = get_current_lead_account_id();

        Self {
            origin: RawOrigin::Signed(lead_account_id),
            worker_id,
            balance: 10,
            account_id,
        }
    }
    pub fn with_origin(self, origin: RawOrigin<u64>) -> Self {
        Self { origin, ..self }
    }

    pub fn with_balance(self, balance: u64) -> Self {
        Self { balance, ..self }
    }

    pub fn call_and_assert(&self, expected_result: DispatchResult) {
        let old_balance = Balances::usable_balance(&self.account_id);
        let old_stake = get_stake_balance(&self.account_id);
        let actual_result =
            TestWorkingTeam::slash_stake(self.origin.clone().into(), self.worker_id, self.balance);

        assert_eq!(actual_result, expected_result);

        if actual_result.is_ok() {
            // stake decreased
            assert_eq!(
                old_stake,
                get_stake_balance(&self.account_id) + self.balance
            );

            let new_balance = Balances::usable_balance(&self.account_id);

            // worker balance unchanged
            assert_eq!(new_balance, old_balance,);
        }
    }
}

pub(crate) fn get_stake_balance(account_id: &u64) -> u64 {
    let locks = Balances::locks(account_id);

    let existing_lock = locks.iter().find(|lock| lock.id == LockId::get());

    existing_lock.map_or(0, |lock| lock.amount)
}

fn get_current_lead_account_id() -> u64 {
    let leader_worker_id = TestWorkingTeam::current_lead();

    if let Some(leader_worker_id) = leader_worker_id {
        let leader = TestWorkingTeam::worker_by_id(leader_worker_id);
        leader.role_account_id
    } else {
        0 // return invalid lead_account_id for testing
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

        let lead_account_id = get_current_lead_account_id();

        Self {
            origin: RawOrigin::Signed(lead_account_id),
            worker_id,
            balance: 10,
            account_id,
        }
    }
    pub fn with_origin(self, origin: RawOrigin<u64>) -> Self {
        Self { origin, ..self }
    }

    pub fn with_balance(self, balance: u64) -> Self {
        Self { balance, ..self }
    }

    pub fn call_and_assert(&self, expected_result: DispatchResult) {
        let old_balance = Balances::usable_balance(&self.account_id);
        let old_stake = get_stake_balance(&self.account_id);
        let actual_result = TestWorkingTeam::decrease_stake(
            self.origin.clone().into(),
            self.worker_id,
            self.balance,
        );

        assert_eq!(actual_result, expected_result);

        if actual_result.is_ok() {
            // new stake was set
            assert_eq!(self.balance, get_stake_balance(&self.account_id));

            let new_balance = Balances::usable_balance(&self.account_id);

            // worker balance equilibrium
            assert_eq!(old_balance + old_stake, new_balance + self.balance);
        }
    }
}

pub struct IncreaseWorkerStakeFixture {
    origin: RawOrigin<u64>,
    worker_id: u64,
    balance: u64,
    account_id: u64,
}

impl IncreaseWorkerStakeFixture {
    pub fn default_for_worker_id(worker_id: u64) -> Self {
        let account_id = 1;
        Self {
            origin: RawOrigin::Signed(1),
            worker_id,
            balance: 10,
            account_id,
        }
    }
    pub fn with_origin(self, origin: RawOrigin<u64>) -> Self {
        Self { origin, ..self }
    }

    pub fn with_balance(self, balance: u64) -> Self {
        Self { balance, ..self }
    }

    pub fn call_and_assert(&self, expected_result: DispatchResult) {
        let old_balance = Balances::usable_balance(&self.account_id);
        let old_stake = get_stake_balance(&self.account_id);
        let actual_result = TestWorkingTeam::increase_stake(
            self.origin.clone().into(),
            self.worker_id,
            self.balance,
        );

        assert_eq!(actual_result, expected_result);

        if actual_result.is_ok() {
            // new stake was set
            assert_eq!(self.balance, get_stake_balance(&self.account_id));

            let new_balance = Balances::usable_balance(&self.account_id);

            // worker balance equilibrium
            assert_eq!(old_balance + old_stake, new_balance + self.balance);
        }
    }
}

pub struct WithdrawApplicationFixture {
    origin: RawOrigin<u64>,
    application_id: u64,
    stake: bool,
    account_id: u64,
}

impl WithdrawApplicationFixture {
    pub fn with_signer(self, account_id: u64) -> Self {
        Self {
            origin: RawOrigin::Signed(account_id),
            ..self
        }
    }
    pub fn with_origin(self, origin: RawOrigin<u64>) -> Self {
        Self { origin, ..self }
    }

    pub fn with_stake(self) -> Self {
        Self {
            stake: true,
            ..self
        }
    }

    pub fn default_for_application_id(application_id: u64) -> Self {
        Self {
            origin: RawOrigin::Signed(1),
            application_id,
            stake: false,
            account_id: 1,
        }
    }
    pub fn call_and_assert(&self, expected_result: DispatchResult) {
        let old_balance = Balances::usable_balance(&self.account_id);
        let old_stake = get_stake_balance(&self.account_id);

        let actual_result =
            TestWorkingTeam::withdraw_application(self.origin.clone().into(), self.application_id);
        assert_eq!(actual_result.clone(), expected_result);

        if actual_result.is_ok() {
            if self.stake {
                // the stake was removed
                assert_eq!(0, get_stake_balance(&self.account_id));

                let new_balance = Balances::usable_balance(&self.account_id);

                // worker balance equilibrium
                assert_eq!(old_balance + old_stake, new_balance);
            }
        }
    }
}

pub struct CancelOpeningFixture {
    origin: RawOrigin<u64>,
    opening_id: u64,
}

impl CancelOpeningFixture {
    pub fn default_for_opening_id(opening_id: u64) -> Self {
        Self {
            origin: RawOrigin::Signed(1),
            opening_id,
        }
    }

    pub fn with_origin(self, origin: RawOrigin<u64>) -> Self {
        Self { origin, ..self }
    }

    pub fn call(&self) -> DispatchResult {
        TestWorkingTeam::cancel_opening(self.origin.clone().into(), self.opening_id)
    }

    pub fn call_and_assert(&self, expected_result: DispatchResult) {
        if expected_result.is_ok() {
            assert!(
                <crate::OpeningById<Test, TestWorkingTeamInstance>>::contains_key(self.opening_id)
            );
        }

        let actual_result = self.call().map(|_| ());

        assert_eq!(actual_result.clone(), expected_result);

        if actual_result.is_ok() {
            assert!(
                !<crate::OpeningById<Test, TestWorkingTeamInstance>>::contains_key(self.opening_id)
            );
        }
    }
}
