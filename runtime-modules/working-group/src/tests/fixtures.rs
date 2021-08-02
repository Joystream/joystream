#![cfg(test)]
use frame_support::dispatch::{DispatchError, DispatchResult};
use frame_support::traits::Currency;
use frame_support::StorageMap;
use frame_system::{EventRecord, Phase, RawOrigin};
use sp_runtime::traits::Hash;
use sp_std::collections::{btree_map::BTreeMap, btree_set::BTreeSet};

use super::hiring_workflow::HiringWorkflow;
use super::mock::{Balances, LockId, System, Test, TestEvent, TestWorkingGroup};
use crate::types::StakeParameters;
use crate::{
    Application, ApplyOnOpeningParameters, DefaultInstance, Opening, OpeningType, RawEvent,
    StakePolicy, Config, Worker,
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
            OpeningType,
            StakePolicy<u64, u64>,
            ApplyOnOpeningParameters<Test>,
            DefaultInstance,
        >,
    ) {
        let converted_event = TestEvent::crate_DefaultInstance(expected_raw_event);

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

    pub fn contains_crate_event(
        expected_raw_event: RawEvent<
            u64,
            u64,
            BTreeMap<u64, u64>,
            u64,
            u64,
            u64,
            OpeningType,
            StakePolicy<u64, u64>,
            ApplyOnOpeningParameters<Test>,
            DefaultInstance,
        >,
    ) {
        let converted_event = TestEvent::crate_DefaultInstance(expected_raw_event);

        Self::contains_global_event(converted_event)
    }

    fn contains_global_event(expected_event: TestEvent) {
        let expected_event = EventRecord {
            phase: Phase::Initialization,
            event: expected_event,
            topics: vec![],
        };

        assert!(System::events().iter().any(|ev| *ev == expected_event));
    }
}

pub struct AddOpeningFixture {
    pub origin: RawOrigin<u64>,
    pub description: Vec<u8>,
    pub opening_type: OpeningType,
    pub starting_block: u64,
    pub stake_policy: StakePolicy<u64, u64>,
    pub reward_per_block: Option<u64>,
}

impl Default for AddOpeningFixture {
    fn default() -> Self {
        Self {
            origin: RawOrigin::Signed(1),
            description: b"human_text".to_vec(),
            opening_type: OpeningType::Regular,
            starting_block: 0,
            stake_policy: StakePolicy {
                stake_amount: <Test as Config>::MinimumApplicationStake::get(),
                leaving_unstaking_period: <Test as Config>::MinUnstakingPeriodLimit::get() + 1,
            },
            reward_per_block: None,
        }
    }
}

impl AddOpeningFixture {
    pub fn call_and_assert(&self, expected_result: DispatchResult) -> u64 {
        let saved_opening_next_id = TestWorkingGroup::next_opening_id();
        let actual_result = self.call().map(|_| ());

        assert_eq!(actual_result.clone(), expected_result);

        if actual_result.is_ok() {
            assert_eq!(
                TestWorkingGroup::next_opening_id(),
                saved_opening_next_id + 1
            );
            let opening_id = saved_opening_next_id;

            let actual_opening = TestWorkingGroup::opening_by_id(opening_id);

            let expected_hash = <Test as frame_system::Config>::Hashing::hash(&self.description);
            let expected_opening = Opening {
                created: self.starting_block,
                description_hash: expected_hash.as_ref().to_vec(),
                opening_type: self.opening_type,
                stake_policy: self.stake_policy.clone(),
                reward_per_block: self.reward_per_block.clone(),
                creation_stake: if self.opening_type == OpeningType::Regular {
                    <Test as Config>::LeaderOpeningStake::get()
                } else {
                    0
                },
            };

            assert_eq!(actual_opening, expected_opening);
        }

        saved_opening_next_id
    }

    pub fn call(&self) -> Result<u64, DispatchError> {
        let saved_opening_next_id = TestWorkingGroup::next_opening_id();
        TestWorkingGroup::add_opening(
            self.origin.clone().into(),
            self.description.clone(),
            self.opening_type,
            self.stake_policy.clone(),
            self.reward_per_block.clone(),
        )?;

        Ok(saved_opening_next_id)
    }

    pub fn with_opening_type(self, opening_type: OpeningType) -> Self {
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

    pub fn with_stake_policy(self, stake_policy: StakePolicy<u64, u64>) -> Self {
        Self {
            stake_policy,
            ..self
        }
    }

    pub fn with_reward_per_block(self, reward_per_block: Option<u64>) -> Self {
        Self {
            reward_per_block,
            ..self
        }
    }
}

pub struct ApplyOnOpeningFixture {
    origin: RawOrigin<u64>,
    member_id: u64,
    opening_id: u64,
    role_account_id: u64,
    reward_account_id: u64,
    description: Vec<u8>,
    stake_parameters: StakeParameters<u64, u64>,
    initial_balance: u64,
}

impl ApplyOnOpeningFixture {
    pub fn with_text(self, text: Vec<u8>) -> Self {
        Self {
            description: text,
            ..self
        }
    }

    pub fn with_origin(self, origin: RawOrigin<u64>, id: u64) -> Self {
        Self {
            origin,
            stake_parameters: StakeParameters {
                staking_account_id: id,
                ..self.stake_parameters
            },
            member_id: id,
            role_account_id: id,
            reward_account_id: id,
            ..self
        }
    }

    pub fn with_stake_parameters(self, stake_parameters: StakeParameters<u64, u64>) -> Self {
        Self {
            stake_parameters,
            ..self
        }
    }

    pub fn with_initial_balance(self, initial_balance: u64) -> Self {
        Self {
            initial_balance,
            ..self
        }
    }

    pub fn default_for_opening_id(opening_id: u64) -> Self {
        Self {
            origin: RawOrigin::Signed(2),
            member_id: 2,
            opening_id,
            role_account_id: 2,
            reward_account_id: 2,
            description: b"human_text".to_vec(),
            stake_parameters: StakeParameters {
                stake: <Test as Config>::MinimumApplicationStake::get(),
                staking_account_id: 2,
            },
            initial_balance: <Test as Config>::MinimumApplicationStake::get(),
        }
    }

    pub fn get_apply_on_opening_parameters(&self) -> ApplyOnOpeningParameters<Test> {
        ApplyOnOpeningParameters::<Test> {
            member_id: self.member_id,
            opening_id: self.opening_id,
            role_account_id: self.role_account_id,
            reward_account_id: self.reward_account_id,
            description: self.description.clone(),
            stake_parameters: self.stake_parameters.clone(),
        }
    }

    pub fn call(&self) -> Result<u64, DispatchError> {
        balances::Module::<Test>::make_free_balance_be(
            &self.stake_parameters.staking_account_id,
            self.initial_balance,
        );

        let saved_application_next_id = TestWorkingGroup::next_application_id();
        TestWorkingGroup::apply_on_opening(
            self.origin.clone().into(),
            self.get_apply_on_opening_parameters(),
        )?;

        Ok(saved_application_next_id)
    }

    pub fn call_and_assert(&self, expected_result: DispatchResult) -> u64 {
        let saved_application_next_id = TestWorkingGroup::next_application_id();

        let actual_result = self.call().map(|_| ());
        assert_eq!(actual_result.clone(), expected_result);

        if actual_result.is_ok() {
            assert_eq!(
                TestWorkingGroup::next_application_id(),
                saved_application_next_id + 1
            );
            let application_id = saved_application_next_id;

            let actual_application = TestWorkingGroup::application_by_id(application_id);

            let expected_hash = <Test as frame_system::Config>::Hashing::hash(&self.description);
            let expected_application = Application::<Test> {
                role_account_id: self.role_account_id,
                reward_account_id: self.reward_account_id,
                staking_account_id: self.stake_parameters.staking_account_id,
                member_id: self.member_id,
                description_hash: expected_hash.as_ref().to_vec(),
                opening_id: self.opening_id,
            };

            assert_eq!(actual_application, expected_application);
        }

        saved_application_next_id
    }
}

pub struct FillOpeningFixture {
    origin: RawOrigin<u64>,
    opening_id: u64,
    pub successful_application_ids: BTreeSet<u64>,
    role_account_id: u64,
    reward_account_id: u64,
    staking_account_id: u64,
    stake_policy: StakePolicy<u64, u64>,
    reward_per_block: Option<u64>,
    created_at: u64,
}

impl FillOpeningFixture {
    pub fn default_for_ids(opening_id: u64, application_ids: Vec<u64>) -> Self {
        let application_ids: BTreeSet<u64> = application_ids.iter().map(|x| *x).collect();

        Self {
            origin: RawOrigin::Signed(1),
            opening_id,
            successful_application_ids: application_ids,
            role_account_id: 2,
            reward_account_id: 2,
            staking_account_id: 2,
            stake_policy: StakePolicy {
                stake_amount: <Test as Config>::MinimumApplicationStake::get(),
                leaving_unstaking_period: <Test as Config>::MinUnstakingPeriodLimit::get() + 1,
            },
            reward_per_block: None,
            created_at: 0,
        }
    }

    pub fn with_origin(self, origin: RawOrigin<u64>) -> Self {
        Self { origin, ..self }
    }

    pub fn with_created_at(self, created_at: u64) -> Self {
        Self { created_at, ..self }
    }

    pub fn with_stake_policy(self, stake_policy: StakePolicy<u64, u64>) -> Self {
        Self {
            stake_policy,
            ..self
        }
    }

    pub fn with_staking_account_id(self, staking_account_id: u64) -> Self {
        Self {
            staking_account_id,
            ..self
        }
    }

    pub fn with_reward_per_block(self, reward_per_block: Option<u64>) -> Self {
        Self {
            reward_per_block,
            ..self
        }
    }

    pub fn call(&self) -> Result<u64, DispatchError> {
        let saved_worker_next_id = TestWorkingGroup::next_worker_id();
        TestWorkingGroup::fill_opening(
            self.origin.clone().into(),
            self.opening_id,
            self.successful_application_ids.clone(),
        )?;

        Ok(saved_worker_next_id)
    }

    pub fn call_and_assert(&self, expected_result: DispatchResult) -> u64 {
        let saved_worker_count = TestWorkingGroup::active_worker_count();
        let saved_worker_next_id = TestWorkingGroup::next_worker_id();
        let actual_result = self.call().map(|_| ());
        assert_eq!(actual_result.clone(), expected_result);

        if actual_result.is_ok() {
            assert_eq!(TestWorkingGroup::next_worker_id(), saved_worker_next_id + 1);
            let worker_id = saved_worker_next_id;

            assert!(!<crate::OpeningById<Test, DefaultInstance>>::contains_key(
                self.opening_id
            ));

            for application_id in self.successful_application_ids.iter() {
                assert!(
                    !<crate::ApplicationById<Test, DefaultInstance>>::contains_key(application_id)
                );
            }

            let expected_worker = Worker::<Test> {
                member_id: 2,
                role_account_id: self.role_account_id,
                reward_account_id: self.reward_account_id,
                staking_account_id: self.staking_account_id,
                started_leaving_at: None,
                job_unstaking_period: self.stake_policy.leaving_unstaking_period,
                reward_per_block: self.reward_per_block,
                missed_reward: None,
                created_at: self.created_at,
            };

            let actual_worker = TestWorkingGroup::worker_by_id(worker_id);

            assert_eq!(actual_worker, expected_worker);

            let expected_worker_count =
                saved_worker_count + (self.successful_application_ids.len() as u32);

            assert_eq!(
                TestWorkingGroup::active_worker_count(),
                expected_worker_count
            );
        }

        saved_worker_next_id
    }
}

pub struct HireLeadFixture {
    setup_environment: bool,
    stake_policy: StakePolicy<u64, u64>,
    reward_per_block: Option<u64>,
    lead_id: u64,
    initial_balance: u64,
}

impl Default for HireLeadFixture {
    fn default() -> Self {
        Self {
            setup_environment: true,
            stake_policy: StakePolicy {
                stake_amount: <Test as Config>::MinimumApplicationStake::get(),
                leaving_unstaking_period: <Test as Config>::MinUnstakingPeriodLimit::get() + 1,
            },
            reward_per_block: None,
            lead_id: 1,
            initial_balance: <Test as Config>::MinimumApplicationStake::get()
                + <Test as Config>::LeaderOpeningStake::get()
                + 1,
        }
    }
}
impl HireLeadFixture {
    pub fn with_initial_balance(self, initial_balance: u64) -> Self {
        Self {
            initial_balance,
            ..self
        }
    }

    pub fn with_setup_environment(self, setup_environment: bool) -> Self {
        Self {
            setup_environment,
            ..self
        }
    }

    pub fn with_stake_policy(self, stake_policy: StakePolicy<u64, u64>) -> Self {
        Self {
            stake_policy,
            ..self
        }
    }

    pub fn with_reward_per_block(self, reward_per_block: Option<u64>) -> Self {
        Self {
            reward_per_block,
            ..self
        }
    }

    fn get_hiring_workflow(self) -> HiringWorkflow {
        HiringWorkflow::default()
            .with_setup_environment(self.setup_environment)
            .with_opening_type(OpeningType::Leader)
            .with_stake_policy(self.stake_policy)
            .with_reward_per_block(self.reward_per_block)
            .with_initial_balance(self.initial_balance)
            .add_application_full(
                b"leader".to_vec(),
                RawOrigin::Signed(self.lead_id),
                self.lead_id,
                self.lead_id,
            )
    }

    pub fn hire_lead(self) -> u64 {
        self.get_hiring_workflow().execute().unwrap()
    }

    pub fn expect(self, error: DispatchError) {
        self.get_hiring_workflow().expect(Err(error)).execute();
    }
}

pub struct HireRegularWorkerFixture {
    setup_environment: bool,
    stake_policy: StakePolicy<u64, u64>,
    reward_per_block: Option<u64>,
    initial_balance: u64,
}

impl Default for HireRegularWorkerFixture {
    fn default() -> Self {
        Self {
            setup_environment: true,
            stake_policy: StakePolicy {
                stake_amount: <Test as Config>::MinimumApplicationStake::get(),
                leaving_unstaking_period: <Test as Config>::MinUnstakingPeriodLimit::get() + 1,
            },
            reward_per_block: None,
            initial_balance: <Test as Config>::MinimumApplicationStake::get(),
        }
    }
}
impl HireRegularWorkerFixture {
    pub fn with_initial_balance(self, initial_balance: u64) -> Self {
        Self {
            initial_balance,
            ..self
        }
    }

    pub fn with_stake_policy(self, stake_policy: StakePolicy<u64, u64>) -> Self {
        Self {
            stake_policy,
            ..self
        }
    }

    pub fn with_reward_per_block(self, reward_per_block: Option<u64>) -> Self {
        Self {
            reward_per_block,
            ..self
        }
    }

    pub fn hire(self) -> u64 {
        HiringWorkflow::default()
            .with_setup_environment(self.setup_environment)
            .with_opening_type(OpeningType::Regular)
            .with_stake_policy(self.stake_policy)
            .with_reward_per_block(self.reward_per_block)
            .with_initial_balance(self.initial_balance)
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
        let actual_result = TestWorkingGroup::update_role_account(
            self.origin.clone().into(),
            self.worker_id,
            self.new_role_account_id,
        );
        assert_eq!(actual_result, expected_result);

        if actual_result.is_ok() {
            let worker = TestWorkingGroup::worker_by_id(self.worker_id);

            assert_eq!(worker.role_account_id, self.new_role_account_id);
        }
    }
}

pub(crate) struct LeaveWorkerRoleFixture {
    worker_id: u64,
    origin: RawOrigin<u64>,
}

impl LeaveWorkerRoleFixture {
    pub fn default_for_worker_id(worker_id: u64) -> Self {
        Self {
            worker_id,
            origin: RawOrigin::Signed(2),
        }
    }
    pub fn with_origin(self, origin: RawOrigin<u64>) -> Self {
        Self { origin, ..self }
    }

    pub fn call_and_assert(&self, expected_result: DispatchResult) {
        let actual_result =
            TestWorkingGroup::leave_role(self.origin.clone().into(), self.worker_id, None);
        assert_eq!(actual_result, expected_result);

        if actual_result.is_ok() {
            let worker = TestWorkingGroup::worker_by_id(self.worker_id);

            if worker.job_unstaking_period > 0 {
                assert_eq!(
                    worker.started_leaving_at,
                    Some(<frame_system::Module<Test>>::block_number())
                );
                return;
            }

            assert!(!<crate::WorkerById<Test, DefaultInstance>>::contains_key(
                self.worker_id
            ));
        }
    }
}

pub struct TerminateWorkerRoleFixture {
    worker_id: u64,
    origin: RawOrigin<u64>,
    pub penalty: Option<u64>,
    pub rationale: Option<Vec<u8>>,
}

impl TerminateWorkerRoleFixture {
    pub fn default_for_worker_id(worker_id: u64) -> Self {
        Self {
            worker_id,
            origin: RawOrigin::Signed(1),
            penalty: None,
            rationale: None,
        }
    }
    pub fn with_origin(self, origin: RawOrigin<u64>) -> Self {
        Self { origin, ..self }
    }

    pub fn with_penalty(self, penalty: Option<u64>) -> Self {
        Self { penalty, ..self }
    }

    pub fn call_and_assert(&self, expected_result: DispatchResult) {
        let actual_result = TestWorkingGroup::terminate_role(
            self.origin.clone().into(),
            self.worker_id,
            self.penalty.clone(),
            self.rationale.clone(),
        );
        assert_eq!(actual_result, expected_result);

        if actual_result.is_ok() {
            if actual_result.is_ok() {
                assert!(!<crate::WorkerById<Test, DefaultInstance>>::contains_key(
                    self.worker_id
                ));
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
    account_id: u64,
    penalty: u64,
    rationale: Option<Vec<u8>>,
}

impl SlashWorkerStakeFixture {
    pub fn default_for_worker_id(worker_id: u64) -> Self {
        let account_id = 2;

        let lead_account_id = get_current_lead_account_id();

        Self {
            origin: RawOrigin::Signed(lead_account_id),
            worker_id,
            rationale: None,
            penalty: 10,
            account_id,
        }
    }
    pub fn with_origin(self, origin: RawOrigin<u64>) -> Self {
        Self { origin, ..self }
    }

    pub fn with_penalty(self, penalty: u64) -> Self {
        Self { penalty, ..self }
    }

    pub fn with_account_id(self, account_id: u64) -> Self {
        Self { account_id, ..self }
    }

    pub fn call_and_assert(&self, expected_result: DispatchResult) {
        let old_balance = Balances::usable_balance(&self.account_id);
        let old_stake = get_stake_balance(&self.account_id);
        let actual_result = TestWorkingGroup::slash_stake(
            self.origin.clone().into(),
            self.worker_id,
            self.penalty,
            self.rationale.clone(),
        );

        assert_eq!(actual_result, expected_result);

        if actual_result.is_ok() {
            // stake decreased
            assert_eq!(
                old_stake,
                get_stake_balance(&self.account_id) + self.penalty
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
    let leader_worker_id = TestWorkingGroup::current_lead();

    if let Some(leader_worker_id) = leader_worker_id {
        let leader = TestWorkingGroup::worker_by_id(leader_worker_id);
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
        let account_id = 2;

        let lead_account_id = get_current_lead_account_id();

        Self {
            origin: RawOrigin::Signed(lead_account_id),
            worker_id,
            balance: 10,
            account_id,
        }
    }

    pub fn with_account_id(self, account_id: u64) -> Self {
        Self { account_id, ..self }
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
        let actual_result = TestWorkingGroup::decrease_stake(
            self.origin.clone().into(),
            self.worker_id,
            self.balance,
        );

        assert_eq!(actual_result, expected_result);

        if actual_result.is_ok() {
            // new stake was set
            assert_eq!(
                old_stake - self.balance,
                get_stake_balance(&self.account_id)
            );

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
        let account_id = 2;
        Self {
            origin: RawOrigin::Signed(account_id),
            worker_id,
            balance: 10,
            account_id,
        }
    }
    pub fn with_origin(self, origin: RawOrigin<u64>) -> Self {
        Self { origin, ..self }
    }

    pub fn with_account_id(self, account_id: u64) -> Self {
        Self { account_id, ..self }
    }

    pub fn with_balance(self, balance: u64) -> Self {
        Self { balance, ..self }
    }

    pub fn call_and_assert(&self, expected_result: DispatchResult) {
        let old_balance = Balances::usable_balance(&self.account_id);
        let old_stake = get_stake_balance(&self.account_id);
        let actual_result = TestWorkingGroup::increase_stake(
            self.origin.clone().into(),
            self.worker_id,
            self.balance,
        );

        assert_eq!(actual_result, expected_result);

        if actual_result.is_ok() {
            // new stake was set
            assert_eq!(
                self.balance + old_stake,
                get_stake_balance(&self.account_id)
            );

            let new_balance = Balances::usable_balance(&self.account_id);

            // worker balance equilibrium
            assert_eq!(
                old_balance + old_stake,
                new_balance + self.balance + old_stake
            );
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
            origin: RawOrigin::Signed(2),
            application_id,
            stake: false,
            account_id: 2,
        }
    }
    pub fn call_and_assert(&self, expected_result: DispatchResult) {
        let old_balance = Balances::usable_balance(&self.account_id);
        let old_stake = get_stake_balance(&self.account_id);

        let actual_result =
            TestWorkingGroup::withdraw_application(self.origin.clone().into(), self.application_id);
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
        TestWorkingGroup::cancel_opening(self.origin.clone().into(), self.opening_id)
    }

    pub fn call_and_assert(&self, expected_result: DispatchResult) {
        if expected_result.is_ok() {
            assert!(<crate::OpeningById<Test, DefaultInstance>>::contains_key(
                self.opening_id
            ));
        }

        let actual_result = self.call().map(|_| ());

        assert_eq!(actual_result.clone(), expected_result);

        if actual_result.is_ok() {
            assert!(!<crate::OpeningById<Test, DefaultInstance>>::contains_key(
                self.opening_id
            ));
        }
    }
}

pub struct SetBudgetFixture {
    origin: RawOrigin<u64>,
    new_budget: u64,
}

impl Default for SetBudgetFixture {
    fn default() -> Self {
        Self {
            origin: RawOrigin::Root,
            new_budget: 1000000,
        }
    }
}

impl SetBudgetFixture {
    pub fn with_origin(self, origin: RawOrigin<u64>) -> Self {
        Self { origin, ..self }
    }

    pub fn with_budget(self, new_budget: u64) -> Self {
        Self { new_budget, ..self }
    }

    pub fn execute(self) {
        self.call().unwrap();
    }

    pub fn call(&self) -> DispatchResult {
        TestWorkingGroup::set_budget(self.origin.clone().into(), self.new_budget)
    }

    pub fn call_and_assert(&self, expected_result: DispatchResult) {
        let old_budget = TestWorkingGroup::budget();

        let actual_result = self.call().map(|_| ());

        assert_eq!(actual_result.clone(), expected_result);

        let new_budget = TestWorkingGroup::budget();

        if actual_result.is_ok() {
            assert_eq!(new_budget, self.new_budget);
        } else {
            assert_eq!(new_budget, old_budget);
        }
    }
}

pub struct UpdateRewardAccountFixture {
    worker_id: u64,
    new_reward_account_id: u64,
    origin: RawOrigin<u64>,
}

impl UpdateRewardAccountFixture {
    pub fn default_with_ids(worker_id: u64, new_reward_account_id: u64) -> Self {
        Self {
            worker_id,
            new_reward_account_id,
            origin: RawOrigin::Signed(2),
        }
    }
    pub fn with_origin(self, origin: RawOrigin<u64>) -> Self {
        Self { origin, ..self }
    }

    pub fn call_and_assert(&self, expected_result: DispatchResult) {
        let actual_result = TestWorkingGroup::update_reward_account(
            self.origin.clone().into(),
            self.worker_id,
            self.new_reward_account_id,
        );

        assert_eq!(actual_result.clone(), expected_result);

        if actual_result.is_ok() {
            let worker = TestWorkingGroup::worker_by_id(self.worker_id);

            assert_eq!(worker.reward_account_id, self.new_reward_account_id);
        }
    }
}

pub struct UpdateRewardAmountFixture {
    worker_id: u64,
    reward_per_block: Option<u64>,
    origin: RawOrigin<u64>,
}

impl UpdateRewardAmountFixture {
    pub fn default_for_worker_id(worker_id: u64) -> Self {
        let lead_account_id = get_current_lead_account_id();

        Self {
            worker_id,
            reward_per_block: None,
            origin: RawOrigin::Signed(lead_account_id),
        }
    }
    pub fn with_origin(self, origin: RawOrigin<u64>) -> Self {
        Self { origin, ..self }
    }

    pub fn with_reward_per_block(self, reward_per_block: Option<u64>) -> Self {
        Self {
            reward_per_block,
            ..self
        }
    }

    pub fn call_and_assert(&self, expected_result: DispatchResult) {
        let actual_result = TestWorkingGroup::update_reward_amount(
            self.origin.clone().into(),
            self.worker_id,
            self.reward_per_block,
        );

        assert_eq!(actual_result.clone(), expected_result);

        if actual_result.is_ok() {
            let worker = TestWorkingGroup::worker_by_id(self.worker_id);

            assert_eq!(worker.reward_per_block, self.reward_per_block);
        }
    }
}

pub struct SetStatusTextFixture {
    origin: RawOrigin<u64>,
    new_status_text: Option<Vec<u8>>,
}

impl Default for SetStatusTextFixture {
    fn default() -> Self {
        Self {
            origin: RawOrigin::Signed(1),
            new_status_text: None,
        }
    }
}

impl SetStatusTextFixture {
    pub fn with_origin(self, origin: RawOrigin<u64>) -> Self {
        Self { origin, ..self }
    }

    pub fn with_status_text(self, new_status_text: Option<Vec<u8>>) -> Self {
        Self {
            new_status_text,
            ..self
        }
    }

    pub fn call(&self) -> DispatchResult {
        TestWorkingGroup::set_status_text(self.origin.clone().into(), self.new_status_text.clone())
    }

    pub fn call_and_assert(&self, expected_result: DispatchResult) {
        let old_text_hash = TestWorkingGroup::status_text_hash();

        let actual_result = self.call().map(|_| ());

        assert_eq!(actual_result.clone(), expected_result);

        let new_text_hash = TestWorkingGroup::status_text_hash();

        if actual_result.is_ok() {
            let expected_hash = <Test as frame_system::Config>::Hashing::hash(
                &self.new_status_text.clone().unwrap(),
            );

            assert_eq!(new_text_hash, expected_hash.as_ref().to_vec());
        } else {
            assert_eq!(new_text_hash, old_text_hash);
        }
    }
}

pub struct SpendFromBudgetFixture {
    origin: RawOrigin<u64>,
    account_id: u64,
    amount: u64,
    rationale: Option<Vec<u8>>,
}

impl Default for SpendFromBudgetFixture {
    fn default() -> Self {
        Self {
            origin: RawOrigin::Signed(1),
            account_id: 1,
            amount: 100,
            rationale: None,
        }
    }
}

impl SpendFromBudgetFixture {
    pub fn with_origin(self, origin: RawOrigin<u64>) -> Self {
        Self { origin, ..self }
    }

    pub fn with_account_id(self, account_id: u64) -> Self {
        Self { account_id, ..self }
    }

    pub fn with_amount(self, amount: u64) -> Self {
        Self { amount, ..self }
    }

    pub fn call(&self) -> DispatchResult {
        TestWorkingGroup::spend_from_budget(
            self.origin.clone().into(),
            self.account_id,
            self.amount,
            self.rationale.clone(),
        )
    }

    pub fn call_and_assert(&self, expected_result: DispatchResult) {
        let old_budget = TestWorkingGroup::budget();
        let old_balance = Balances::usable_balance(&self.account_id);

        let actual_result = self.call().map(|_| ());

        assert_eq!(actual_result.clone(), expected_result);

        let new_budget = TestWorkingGroup::budget();
        let new_balance = Balances::usable_balance(&self.account_id);

        if actual_result.is_ok() {
            assert_eq!(new_budget, old_budget - self.amount);
            assert_eq!(new_balance, old_balance + self.amount);
        } else {
            assert_eq!(old_budget, new_budget);
            assert_eq!(old_balance, new_balance);
        }
    }
}
