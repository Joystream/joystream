use super::mocks::{Balances, Bounty, RuntimeEvent, System, Test};
use crate::{
    AssuranceContractType, BountyActor, BountyCreationParameters, BountyMilestone, BountyRecord,
    ClosedContractWhitelist, Config, Entry, FundingType, OracleJudgmentOf, RawEvent,
};
use common::council::CouncilBudgetManager;
use frame_support::dispatch::DispatchResult;
use frame_support::storage::{StorageDoubleMap, StorageMap};
use frame_support::traits::{Currency, OnFinalize, OnInitialize};
use frame_system::{EventRecord, Phase, RawOrigin};
use sp_std::collections::btree_set::BTreeSet;
use sp_std::convert::TryInto;
use sp_std::iter::FromIterator;

// Recommendation from Parity on testing on_finalize
// https://substrate.dev/docs/en/next/development/module/tests
pub fn run_to_block(n: u64) {
    while System::block_number() < n {
        <System as OnFinalize<u64>>::on_finalize(System::block_number());
        <Bounty as OnFinalize<u64>>::on_finalize(System::block_number());
        System::set_block_number(System::block_number() + 1);
        <System as OnInitialize<u64>>::on_initialize(System::block_number());
        <Bounty as OnInitialize<u64>>::on_initialize(System::block_number());
    }
}

pub fn set_council_budget(new_budget: u64) {
    <super::mocks::CouncilBudgetManager as CouncilBudgetManager<u128, u64>>::set_budget(new_budget);
}

pub fn get_council_budget() -> u64 {
    <super::mocks::CouncilBudgetManager as CouncilBudgetManager<u128, u64>>::get_budget()
}

pub fn increase_total_balance_issuance_using_account_id(account_id: u128, balance: u64) {
    let initial_balance = Balances::total_issuance();
    {
        let _ = Balances::deposit_creating(&account_id, balance);
    }
    assert_eq!(Balances::total_issuance(), initial_balance + balance);
}

pub fn increase_account_balance(account_id: &u128, balance: u64) {
    let _ = Balances::deposit_creating(account_id, balance);
}

pub fn get_funder_state_bloat_bond_amount() -> u64 {
    <Test as Config>::FunderStateBloatBondAmount::get()
}

pub fn get_creator_state_bloat_bond_amount() -> u64 {
    <Test as Config>::CreatorStateBloatBondAmount::get()
}

pub struct EventFixture;
impl EventFixture {
    pub fn assert_last_crate_event(
        expected_raw_event: RawEvent<
            u64,
            u64,
            u64,
            u64,
            u128,
            BountyCreationParameters<Test>,
            OracleJudgmentOf<Test>,
        >,
    ) {
        let converted_event = RuntimeEvent::Bounty(expected_raw_event);

        Self::assert_last_global_event(converted_event)
    }

    pub fn contains_crate_event(
        expected_raw_event: RawEvent<
            u64,
            u64,
            u64,
            u64,
            u128,
            BountyCreationParameters<Test>,
            OracleJudgmentOf<Test>,
        >,
    ) {
        let converted_event = RuntimeEvent::Bounty(expected_raw_event);

        Self::contains_global_event(converted_event)
    }

    pub fn assert_last_global_event(expected_event: RuntimeEvent) {
        let expected_event = EventRecord {
            phase: Phase::Initialization,
            event: expected_event,
            topics: vec![],
        };

        assert_eq!(System::events().pop().unwrap(), expected_event);
    }

    fn contains_global_event(expected_event: RuntimeEvent) {
        let expected_event = EventRecord {
            phase: Phase::Initialization,
            event: expected_event,
            topics: vec![],
        };

        assert!(
            System::events().iter().any(|ev| *ev == expected_event),
            "Event not found: {:?}",
            expected_event.event
        );
    }
}

pub const DEFAULT_BOUNTY_CHERRY: u64 = 10;
pub const DEFAULT_BOUNTY_ORACLE_REWARD: u64 = 10;
pub const DEFAULT_BOUNTY_ENTRANT_STAKE: u64 = 10;
pub const DEFAULT_BOUNTY_TARGET_AMOUNT: u64 = 1000;
pub const DEFAULT_BOUNTY_FUNDING_PERIOD: u64 = 1;

pub struct CreateBountyFixture {
    origin: RawOrigin<u128>,
    metadata: Vec<u8>,
    creator: BountyActor<u64>,
    funding_type: FundingType<u64, u64>,
    cherry: u64,
    oracle_reward: u64,
    expected_milestone: Option<BountyMilestone<u64>>,
    entrant_stake: u64,
    contract_type: AssuranceContractType<BTreeSet<u64>>,
    oracle: BountyActor<u64>,
}

impl CreateBountyFixture {
    pub fn default() -> Self {
        Self {
            origin: RawOrigin::Root,
            metadata: Vec::new(),
            creator: BountyActor::Council,
            funding_type: FundingType::Perpetual {
                target: DEFAULT_BOUNTY_TARGET_AMOUNT,
            },
            cherry: DEFAULT_BOUNTY_CHERRY,
            oracle_reward: DEFAULT_BOUNTY_ORACLE_REWARD,
            expected_milestone: None,
            entrant_stake: DEFAULT_BOUNTY_ENTRANT_STAKE,
            contract_type: AssuranceContractType::Open,
            oracle: BountyActor::Council,
        }
    }

    pub fn with_origin(self, origin: RawOrigin<u128>) -> Self {
        Self { origin, ..self }
    }

    pub fn with_creator_member_id(self, member_id: u64) -> Self {
        Self {
            creator: BountyActor::Member(member_id),
            ..self
        }
    }

    pub fn with_oracle_member_id(self, member_id: u64) -> Self {
        Self {
            oracle: BountyActor::Member(member_id),
            ..self
        }
    }

    pub fn with_metadata(self, metadata: Vec<u8>) -> Self {
        Self { metadata, ..self }
    }

    pub fn with_limited_funding(self, target: u64, funding_period: u64) -> Self {
        Self {
            funding_type: FundingType::Limited {
                funding_period,
                target,
            },
            ..self
        }
    }

    pub fn with_perpetual_period_target_amount(self, target: u64) -> Self {
        Self {
            funding_type: FundingType::Perpetual { target },
            ..self
        }
    }

    pub fn with_funding_period(self, funding_period: u64) -> Self {
        Self {
            funding_type: FundingType::Limited {
                funding_period,
                target: DEFAULT_BOUNTY_TARGET_AMOUNT,
            },
            ..self
        }
    }

    pub fn with_limit_period_target_amount(self, target: u64) -> Self {
        Self {
            funding_type: FundingType::Limited {
                funding_period: DEFAULT_BOUNTY_FUNDING_PERIOD,
                target,
            },
            ..self
        }
    }

    pub fn with_cherry(self, cherry: u64) -> Self {
        Self { cherry, ..self }
    }

    pub fn with_oracle_reward(self, oracle_reward: u64) -> Self {
        Self {
            oracle_reward,
            ..self
        }
    }

    pub fn with_entrant_stake(self, entrant_stake: u64) -> Self {
        Self {
            entrant_stake,
            ..self
        }
    }

    pub fn with_closed_contract(self, member_ids: Vec<u64>) -> Self {
        let member_id_set = BTreeSet::from_iter(member_ids.into_iter());

        Self {
            contract_type: AssuranceContractType::Closed(member_id_set),
            ..self
        }
    }

    pub fn get_bounty_creation_parameters(&self) -> BountyCreationParameters<Test> {
        BountyCreationParameters::<Test> {
            creator: self.creator.clone(),
            funding_type: self.funding_type.clone(),
            cherry: self.cherry,
            oracle_reward: self.oracle_reward,
            entrant_stake: self.entrant_stake,
            contract_type: self.contract_type.clone(),
            oracle: self.oracle.clone(),
            ..Default::default()
        }
    }

    pub fn call_and_assert(&self, expected_result: DispatchResult) {
        let params = self.get_bounty_creation_parameters();

        let next_bounty_count_value = Bounty::bounty_count() + 1;
        let bounty_id: u64 = next_bounty_count_value.into();

        let actual_result = Bounty::create_bounty(
            self.origin.clone().into(),
            params.clone(),
            self.metadata.clone(),
        );

        assert_eq!(actual_result, expected_result);

        if actual_result.is_ok() {
            assert_eq!(next_bounty_count_value, Bounty::bounty_count());
            assert!(<crate::Bounties<Test>>::contains_key(bounty_id));

            let expected_milestone = match self.expected_milestone.clone() {
                Some(milestone) => milestone,
                None => BountyMilestone::Created {
                    created_at: System::block_number(),
                    has_contributions: false,
                },
            };

            let expected_bounty = BountyRecord::<u64, u64, u64, ClosedContractWhitelist<Test>> {
                creation_params: params.clone().try_into().unwrap(),
                total_funding: 0,
                milestone: expected_milestone,
                active_work_entry_count: 0,
                has_unpaid_oracle_reward: params.oracle_reward > 0,
            };

            assert_eq!(expected_bounty, Bounty::bounties(bounty_id));
        } else {
            assert_eq!(next_bounty_count_value - 1, Bounty::bounty_count());
            assert!(!<crate::Bounties<Test>>::contains_key(bounty_id));
        }
    }
}

pub struct FundBountyFixture {
    origin: RawOrigin<u128>,
    funder: BountyActor<u64>,
    bounty_id: u64,
    amount: u64,
}

impl FundBountyFixture {
    pub fn default() -> Self {
        Self {
            origin: RawOrigin::Signed(1),
            funder: BountyActor::Member(1),
            bounty_id: 1,
            amount: 100,
        }
    }

    pub fn with_origin(self, origin: RawOrigin<u128>) -> Self {
        Self { origin, ..self }
    }

    pub fn with_member_id(self, member_id: u64) -> Self {
        Self {
            funder: BountyActor::Member(member_id),
            ..self
        }
    }

    pub fn with_council(self) -> Self {
        Self {
            funder: BountyActor::Council,
            ..self
        }
    }

    pub fn with_bounty_id(self, bounty_id: u64) -> Self {
        Self { bounty_id, ..self }
    }

    pub fn with_amount(self, amount: u64) -> Self {
        Self { amount, ..self }
    }

    pub fn call_and_assert(&self, expected_result: DispatchResult) {
        let old_bounty_funding =
            Bounty::contribution_by_bounty_by_actor(self.bounty_id, &self.funder);

        let old_bounty = Bounty::bounties(self.bounty_id);

        let actual_result = Bounty::fund_bounty(
            self.origin.clone().into(),
            self.funder.clone(),
            self.bounty_id,
            self.amount,
        );

        assert_eq!(actual_result, expected_result);

        let new_bounty_funding =
            Bounty::contribution_by_bounty_by_actor(self.bounty_id, &self.funder);
        if actual_result.is_ok() {
            let new_bounty = Bounty::bounties(self.bounty_id);
            if new_bounty.total_funding == new_bounty.target_funding() {
                assert_eq!(
                    new_bounty_funding.amount,
                    old_bounty_funding.amount + old_bounty.target_funding()
                        - old_bounty.total_funding
                );
            } else {
                assert_eq!(
                    new_bounty_funding.amount,
                    old_bounty_funding.amount + self.amount
                );
            }
        } else {
            assert_eq!(new_bounty_funding, old_bounty_funding);
        }
    }
}

pub struct WithdrawFundingFixture {
    origin: RawOrigin<u128>,
    funder: BountyActor<u64>,
    bounty_id: u64,
}

impl WithdrawFundingFixture {
    pub fn default() -> Self {
        Self {
            origin: RawOrigin::Signed(1),
            funder: BountyActor::Member(1),
            bounty_id: 1,
        }
    }

    pub fn with_origin(self, origin: RawOrigin<u128>) -> Self {
        Self { origin, ..self }
    }

    pub fn with_member_id(self, member_id: u64) -> Self {
        Self {
            funder: BountyActor::Member(member_id),
            ..self
        }
    }

    pub fn with_council(self) -> Self {
        Self {
            funder: BountyActor::Council,
            ..self
        }
    }

    pub fn with_bounty_id(self, bounty_id: u64) -> Self {
        Self { bounty_id, ..self }
    }

    pub fn call_and_assert(&self, expected_result: DispatchResult) {
        let actual_result = Bounty::withdraw_funding(
            self.origin.clone().into(),
            self.funder.clone(),
            self.bounty_id,
        );

        assert_eq!(actual_result, expected_result);
    }
}

pub struct AnnounceWorkEntryFixture {
    origin: RawOrigin<u128>,
    bounty_id: u64,
    member_id: u64,
    staking_account_id: u128,
    work_description: Vec<u8>,
}

impl AnnounceWorkEntryFixture {
    pub fn default() -> Self {
        Self {
            origin: RawOrigin::Signed(1),
            bounty_id: 1,
            member_id: 1,
            staking_account_id: 1,
            work_description: Vec::new(),
        }
    }

    pub fn with_origin(self, origin: RawOrigin<u128>) -> Self {
        Self { origin, ..self }
    }

    pub fn with_member_id(self, member_id: u64) -> Self {
        Self { member_id, ..self }
    }

    pub fn with_bounty_id(self, bounty_id: u64) -> Self {
        Self { bounty_id, ..self }
    }

    pub fn with_staking_account_id(self, staking_account_id: u128) -> Self {
        Self {
            staking_account_id,
            ..self
        }
    }

    pub fn with_work_description(self, work_description: Vec<u8>) -> Self {
        Self {
            work_description,
            ..self
        }
    }

    pub fn call_and_assert(&self, expected_result: DispatchResult) {
        let old_bounty = Bounty::bounties(self.bounty_id);
        let next_entry_count_value = Bounty::entry_count() + 1;
        let entry_id: u64 = next_entry_count_value.into();

        let actual_result = Bounty::announce_work_entry(
            self.origin.clone().into(),
            self.member_id,
            self.bounty_id,
            self.staking_account_id,
            self.work_description.clone(),
        );

        assert_eq!(actual_result, expected_result);

        let new_bounty = Bounty::bounties(self.bounty_id);
        if actual_result.is_ok() {
            assert_eq!(next_entry_count_value, Bounty::entry_count());
            assert!(<crate::Entries<Test>>::contains_key(
                self.bounty_id,
                entry_id
            ));

            let expected_entry = Entry::<Test> {
                member_id: self.member_id,
                staking_account_id: self.staking_account_id,
                submitted_at: System::block_number(),
                work_submitted: false,
            };
            assert_eq!(
                expected_entry,
                Bounty::entries(self.bounty_id, entry_id).unwrap()
            );

            assert_eq!(
                new_bounty.active_work_entry_count,
                old_bounty.active_work_entry_count + 1
            );
        } else {
            assert_eq!(next_entry_count_value - 1, Bounty::entry_count());
            assert!(!<crate::Entries<Test>>::contains_key(
                self.bounty_id,
                entry_id
            ));

            assert_eq!(
                new_bounty.active_work_entry_count,
                old_bounty.active_work_entry_count
            );
        }
    }
}

pub struct SubmitWorkFixture {
    origin: RawOrigin<u128>,
    entry_id: u64,
    bounty_id: u64,
    member_id: u64,
    work_data: Vec<u8>,
}

impl SubmitWorkFixture {
    pub fn default() -> Self {
        Self {
            origin: RawOrigin::Signed(1),
            entry_id: 1,
            bounty_id: 1,
            member_id: 1,
            work_data: Vec::new(),
        }
    }

    pub fn with_origin(self, origin: RawOrigin<u128>) -> Self {
        Self { origin, ..self }
    }

    pub fn with_member_id(self, member_id: u64) -> Self {
        Self { member_id, ..self }
    }

    pub fn with_bounty_id(self, bounty_id: u64) -> Self {
        Self { bounty_id, ..self }
    }

    pub fn with_entry_id(self, entry_id: u64) -> Self {
        Self { entry_id, ..self }
    }

    pub fn with_work_data(self, work_data: Vec<u8>) -> Self {
        Self { work_data, ..self }
    }

    pub fn call_and_assert(&self, expected_result: DispatchResult) {
        let old_entry = Bounty::entries(self.bounty_id, self.entry_id);

        let actual_result = Bounty::submit_work(
            self.origin.clone().into(),
            self.member_id,
            self.bounty_id,
            self.entry_id,
            self.work_data.clone(),
        );

        assert_eq!(actual_result, expected_result);

        let new_entry = Bounty::entries(self.bounty_id, self.entry_id);

        if actual_result.is_ok() {
            assert!(new_entry.unwrap().work_submitted);
        } else {
            assert_eq!(new_entry, old_entry);
        }
    }
}

pub struct SubmitJudgmentFixture {
    origin: RawOrigin<u128>,
    bounty_id: u64,
    judgment: OracleJudgmentOf<Test>,
    rationale: Vec<u8>,
}

impl SubmitJudgmentFixture {
    pub fn default() -> Self {
        Self {
            origin: RawOrigin::Root,
            bounty_id: 1,
            judgment: Default::default(),
            rationale: Default::default(),
        }
    }

    pub fn with_origin(self, origin: RawOrigin<u128>) -> Self {
        Self { origin, ..self }
    }

    pub fn with_bounty_id(self, bounty_id: u64) -> Self {
        Self { bounty_id, ..self }
    }

    pub fn with_judgment(self, judgment: OracleJudgmentOf<Test>) -> Self {
        Self { judgment, ..self }
    }

    pub fn call_and_assert(&self, expected_result: DispatchResult) {
        let old_bounty = Bounty::bounties(self.bounty_id);
        let actual_result = Bounty::submit_oracle_judgment(
            self.origin.clone().into(),
            self.bounty_id,
            self.judgment.clone(),
            self.rationale.clone(),
        );

        assert_eq!(actual_result, expected_result);

        let new_bounty = Bounty::bounties(self.bounty_id);

        if actual_result.is_ok() {
            assert_eq!(
                new_bounty.milestone,
                BountyMilestone::JudgmentSubmitted {
                    successful_bounty: Bounty::judgment_has_winners(&self.judgment)
                }
            );
        } else {
            assert_eq!(new_bounty, old_bounty);
        }
    }
}

pub struct SwitchOracleFixture {
    origin: RawOrigin<u128>,
    new_oracle: BountyActor<u64>,
    bounty_id: u64,
}

impl SwitchOracleFixture {
    pub fn default() -> Self {
        Self {
            origin: RawOrigin::Root,
            new_oracle: BountyActor::Member(2),
            bounty_id: 1,
        }
    }
    pub fn with_origin(self, origin: RawOrigin<u128>) -> Self {
        Self { origin, ..self }
    }
    pub fn with_bounty_id(self, bounty_id: u64) -> Self {
        Self { bounty_id, ..self }
    }
    pub fn with_new_oracle_member_id(self, bounty_actor: BountyActor<u64>) -> Self {
        Self {
            new_oracle: bounty_actor,
            ..self
        }
    }

    pub fn call_and_assert(&self, expected_result: DispatchResult) {
        let actual_result = Bounty::switch_oracle(
            self.origin.clone().into(),
            self.new_oracle.clone(),
            self.bounty_id,
        );

        assert_eq!(actual_result, expected_result);
    }
}

pub struct TerminateBountyFixture {
    origin: RawOrigin<u128>,
    bounty_id: u64,
}

impl TerminateBountyFixture {
    pub fn default() -> Self {
        Self {
            origin: RawOrigin::Root,
            bounty_id: 1,
        }
    }

    pub fn with_bounty_id(self, bounty_id: u64) -> Self {
        Self { bounty_id, ..self }
    }

    pub fn with_origin(self, origin: RawOrigin<u128>) -> Self {
        Self { origin, ..self }
    }

    pub fn call_and_assert(&self, expected_result: DispatchResult) {
        let actual_result = Bounty::terminate_bounty(self.origin.clone().into(), self.bounty_id);

        assert_eq!(actual_result, expected_result);
    }
}

pub struct EndWorkPeriodFixture {
    origin: RawOrigin<u128>,
    bounty_id: u64,
}

impl EndWorkPeriodFixture {
    pub fn default() -> Self {
        Self {
            origin: RawOrigin::Root,
            bounty_id: 1,
        }
    }

    pub fn with_origin(self, origin: RawOrigin<u128>) -> Self {
        Self { origin, ..self }
    }

    pub fn with_bounty_id(self, bounty_id: u64) -> Self {
        Self { bounty_id, ..self }
    }

    pub fn call_and_assert(&self, expected_result: DispatchResult) {
        let actual_result = Bounty::end_working_period(self.origin.clone().into(), self.bounty_id);

        assert_eq!(actual_result, expected_result);
    }
}

pub struct WithdrawEntrantStakeFixture {
    origin: RawOrigin<u128>,
    entry_id: u64,
    bounty_id: u64,
    member_id: u64,
}

impl WithdrawEntrantStakeFixture {
    pub fn default() -> Self {
        Self {
            origin: RawOrigin::Signed(1),
            entry_id: 1,
            bounty_id: 1,
            member_id: 1,
        }
    }

    pub fn with_origin(self, origin: RawOrigin<u128>) -> Self {
        Self { origin, ..self }
    }

    pub fn with_member_id(self, member_id: u64) -> Self {
        Self { member_id, ..self }
    }

    pub fn with_bounty_id(self, bounty_id: u64) -> Self {
        Self { bounty_id, ..self }
    }

    pub fn with_entry_id(self, entry_id: u64) -> Self {
        Self { entry_id, ..self }
    }

    pub fn call_and_assert(&self, expected_result: DispatchResult) {
        let old_bounty = Bounty::bounties(self.bounty_id);
        let actual_result = Bounty::withdraw_entrant_stake(
            self.origin.clone().into(),
            self.member_id,
            self.bounty_id,
            self.entry_id,
        );

        assert_eq!(actual_result, expected_result);

        if actual_result.is_ok() {
            assert!(!<crate::Entries<Test>>::contains_key(
                self.bounty_id,
                self.entry_id
            ));

            if <crate::Bounties<Test>>::contains_key(self.bounty_id) {
                let new_bounty = Bounty::bounties(self.bounty_id);
                assert_eq!(
                    new_bounty.active_work_entry_count,
                    old_bounty.active_work_entry_count - 1
                );
            }
        }
    }
}

pub struct WithdrawOracleRewardFixture {
    origin: RawOrigin<u128>,
    bounty_id: u64,
}

impl WithdrawOracleRewardFixture {
    pub fn default() -> Self {
        Self {
            origin: RawOrigin::Root,
            bounty_id: 1,
        }
    }

    pub fn with_origin(self, origin: RawOrigin<u128>) -> Self {
        Self { origin, ..self }
    }

    pub fn call_and_assert(&self, expected_result: DispatchResult) {
        let actual_result =
            Bounty::withdraw_oracle_reward(self.origin.clone().into(), self.bounty_id);

        assert_eq!(actual_result, expected_result);
    }
}
