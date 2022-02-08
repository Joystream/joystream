use frame_support::dispatch::DispatchResult;
use frame_support::storage::{StorageDoubleMap, StorageMap};
use frame_support::traits::{Currency, OnFinalize, OnInitialize};
use frame_system::{EventRecord, Phase, RawOrigin};
use sp_runtime::offchain::storage_lock::BlockNumberProvider;
use sp_std::collections::btree_set::BTreeSet;
use sp_std::iter::FromIterator;

use super::mocks::{Balances, Bounty, System, Test, TestEvent};
use crate::{
    AssuranceContractType, BountyActor, BountyCreationParameters, BountyMilestone, BountyRecord,
    Entry, FundingType, OracleJudgmentOf, RawEvent,
};
use common::council::CouncilBudgetManager;

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
    <super::mocks::CouncilBudgetManager as CouncilBudgetManager<u64>>::set_budget(new_budget);
}

pub fn get_council_budget() -> u64 {
    <super::mocks::CouncilBudgetManager as CouncilBudgetManager<u64>>::get_budget()
}

pub fn increase_total_balance_issuance_using_account_id(account_id: u128, balance: u64) {
    let initial_balance = Balances::total_issuance();
    {
        let _ = Balances::deposit_creating(&account_id, balance);
    }
    assert_eq!(Balances::total_issuance(), initial_balance + balance);
}

pub fn increase_account_balance(account_id: &u128, balance: u64) {
    let _ = Balances::deposit_creating(&account_id, balance);
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
        let converted_event = TestEvent::bounty(expected_raw_event);

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
        let converted_event = TestEvent::bounty(expected_raw_event);

        Self::contains_global_event(converted_event)
    }

    pub fn assert_last_global_event(expected_event: TestEvent) {
        let expected_event = EventRecord {
            phase: Phase::Initialization,
            event: expected_event,
            topics: vec![],
        };

        assert_eq!(System::events().pop().unwrap(), expected_event);
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

pub const DEFAULT_BOUNTY_CHERRY: u64 = 10;
pub const DEFAULT_BOUNTY_ENTRANT_STAKE: u64 = 10;
pub const DEFAULT_BOUNTY_MAX_AMOUNT: u64 = 1000;
pub const DEFAULT_BOUNTY_MIN_AMOUNT: u64 = 1;
pub const DEFAULT_BOUNTY_FUNDING_PERIOD: u64 = 1;

pub struct CreateBountyFixture {
    origin: RawOrigin<u128>,
    metadata: Vec<u8>,
    creator: BountyActor<u64>,
    funding_type: FundingType<u64, u64>,
    work_period: u64,
    judging_period: u64,
    cherry: u64,
    expected_milestone: Option<BountyMilestone<u64>>,
    entrant_stake: u64,
    contract_type: AssuranceContractType<u64>,
    oracle: BountyActor<u64>,
}

impl CreateBountyFixture {
    pub fn default() -> Self {
        Self {
            origin: RawOrigin::Root,
            metadata: Vec::new(),
            creator: BountyActor::Council,
            funding_type: FundingType::Perpetual {
                target: DEFAULT_BOUNTY_MAX_AMOUNT,
            },
            work_period: 1,
            judging_period: 1,
            cherry: DEFAULT_BOUNTY_CHERRY,
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

    pub fn with_work_period(self, work_period: u64) -> Self {
        Self {
            work_period,
            ..self
        }
    }

    pub fn with_limited_funding(
        self,
        min_funding_amount: u64,
        max_funding_amount: u64,
        funding_period: u64,
    ) -> Self {
        Self {
            funding_type: FundingType::Limited {
                funding_period,
                min_funding_amount,
                max_funding_amount,
            },
            ..self
        }
    }

    pub fn with_perpetual_funding(self, target: u64) -> Self {
        Self {
            funding_type: FundingType::Perpetual { target },
            ..self
        }
    }

    pub fn with_funding_period(self, funding_period: u64) -> Self {
        Self {
            funding_type: FundingType::Limited {
                funding_period,
                min_funding_amount: DEFAULT_BOUNTY_MIN_AMOUNT,
                max_funding_amount: DEFAULT_BOUNTY_MAX_AMOUNT,
            },
            ..self
        }
    }

    pub fn with_max_funding_amount(self, max_funding_amount: u64) -> Self {
        Self {
            funding_type: FundingType::Limited {
                funding_period: DEFAULT_BOUNTY_FUNDING_PERIOD,
                min_funding_amount: DEFAULT_BOUNTY_MIN_AMOUNT,
                max_funding_amount,
            },
            ..self
        }
    }

    pub fn with_judging_period(self, judging_period: u64) -> Self {
        Self {
            judging_period,
            ..self
        }
    }

    pub fn with_cherry(self, cherry: u64) -> Self {
        Self { cherry, ..self }
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
            work_period: self.work_period.clone(),
            judging_period: self.judging_period.clone(),
            cherry: self.cherry,
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
            assert!(<crate::Bounties<Test>>::contains_key(&bounty_id));

            let expected_milestone = if let Some(milestone) = self.expected_milestone.clone() {
                milestone
            } else {
                BountyMilestone::Created {
                    created_at: System::block_number(),
                    has_contributions: false,
                }
            };

            let expected_bounty = BountyRecord::<u64, u64, u64> {
                creation_params: params.clone(),
                total_funding: 0,
                milestone: expected_milestone,
                active_work_entry_count: 0,
            };

            assert_eq!(expected_bounty, Bounty::bounties(bounty_id));
        } else {
            assert_eq!(next_bounty_count_value - 1, Bounty::bounty_count());
            assert!(!<crate::Bounties<Test>>::contains_key(&bounty_id));
        }
    }
}

pub struct CancelBountyFixture {
    origin: RawOrigin<u128>,
    creator: BountyActor<u64>,
    bounty_id: u64,
}

impl CancelBountyFixture {
    pub fn default() -> Self {
        Self {
            origin: RawOrigin::Root,
            creator: BountyActor::Council,
            bounty_id: 1,
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

    pub fn with_bounty_id(self, bounty_id: u64) -> Self {
        Self { bounty_id, ..self }
    }

    pub fn call_and_assert(&self, expected_result: DispatchResult) {
        let actual_result = Bounty::cancel_bounty(
            self.origin.clone().into(),
            self.creator.clone(),
            self.bounty_id.clone(),
        );

        assert_eq!(actual_result, expected_result);

        if actual_result.is_ok() {
            assert!(!<crate::Bounties<Test>>::contains_key(&self.bounty_id));
        }
    }
}

pub struct VetoBountyFixture {
    origin: RawOrigin<u128>,
    bounty_id: u64,
}

impl VetoBountyFixture {
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
        let actual_result = Bounty::veto_bounty(self.origin.clone().into(), self.bounty_id.clone());

        assert_eq!(actual_result, expected_result);

        if actual_result.is_ok() {
            assert!(!<crate::Bounties<Test>>::contains_key(&self.bounty_id));
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
            self.bounty_id.clone(),
            self.amount.clone(),
        );

        assert_eq!(actual_result, expected_result);

        let new_bounty_funding =
            Bounty::contribution_by_bounty_by_actor(self.bounty_id, &self.funder);
        if actual_result.is_ok() {
            let new_bounty = Bounty::bounties(self.bounty_id);
            if new_bounty.total_funding == new_bounty.maximum_funding() {
                assert_eq!(
                    new_bounty_funding,
                    old_bounty_funding + old_bounty.maximum_funding() - old_bounty.total_funding
                );
            } else {
                assert_eq!(new_bounty_funding, old_bounty_funding + self.amount);
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
            self.bounty_id.clone(),
        );

        assert_eq!(actual_result, expected_result);
    }
}

pub struct AnnounceWorkEntryFixture {
    origin: RawOrigin<u128>,
    bounty_id: u64,
    member_id: u64,
    staking_account_id: u128,
}

impl AnnounceWorkEntryFixture {
    pub fn default() -> Self {
        Self {
            origin: RawOrigin::Signed(1),
            bounty_id: 1,
            member_id: 1,
            staking_account_id: 1,
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

    pub fn call_and_assert(&self, expected_result: DispatchResult) {
        let old_bounty = Bounty::bounties(self.bounty_id);
        let next_entry_count_value = Bounty::entry_count() + 1;
        let entry_id: u64 = next_entry_count_value.into();

        let actual_result = Bounty::announce_work_entry(
            self.origin.clone().into(),
            self.member_id,
            self.bounty_id,
            self.staking_account_id,
        );

        assert_eq!(actual_result, expected_result);

        let new_bounty = Bounty::bounties(self.bounty_id);
        if actual_result.is_ok() {
            assert_eq!(next_entry_count_value, Bounty::entry_count());
            assert!(<crate::Entries<Test>>::contains_key(
                self.bounty_id,
                &entry_id
            ));

            let expected_entry = Entry::<Test> {
                member_id: self.member_id,
                staking_account_id: self.staking_account_id,
                submitted_at: System::current_block_number(),
                work_submitted: false,
                oracle_judgment_result: None,
            };

            assert_eq!(expected_entry, Bounty::entries(self.bounty_id, entry_id));

            assert_eq!(
                new_bounty.active_work_entry_count,
                old_bounty.active_work_entry_count + 1
            );
        } else {
            assert_eq!(next_entry_count_value - 1, Bounty::entry_count());
            assert!(!<crate::Entries<Test>>::contains_key(
                self.bounty_id,
                &entry_id
            ));

            assert_eq!(
                new_bounty.active_work_entry_count,
                old_bounty.active_work_entry_count
            );
        }
    }
}

pub struct WithdrawWorkEntryFixture {
    origin: RawOrigin<u128>,
    entry_id: u64,
    bounty_id: u64,
    member_id: u64,
}

impl WithdrawWorkEntryFixture {
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
        let actual_result = Bounty::withdraw_work_entry(
            self.origin.clone().into(),
            self.member_id,
            self.bounty_id,
            self.entry_id,
        );

        assert_eq!(actual_result, expected_result);

        if actual_result.is_ok() {
            assert!(!<crate::Entries<Test>>::contains_key(
                self.bounty_id,
                &self.entry_id
            ));

            let new_bounty = Bounty::bounties(self.bounty_id);
            assert_eq!(
                new_bounty.active_work_entry_count,
                old_bounty.active_work_entry_count - 1
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
            assert!(new_entry.work_submitted);
        } else {
            assert_eq!(new_entry, old_entry);
        }
    }
}

pub struct SubmitJudgmentFixture {
    origin: RawOrigin<u128>,
    bounty_id: u64,
    oracle: BountyActor<u64>,
    judgment: OracleJudgmentOf<Test>,
    rationale: Vec<u8>,
}

impl SubmitJudgmentFixture {
    pub fn default() -> Self {
        Self {
            origin: RawOrigin::Root,
            bounty_id: 1,
            oracle: BountyActor::Council,
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

    pub fn with_oracle_member_id(self, member_id: u64) -> Self {
        Self {
            oracle: BountyActor::Member(member_id),
            ..self
        }
    }

    pub fn with_judgment(self, judgment: OracleJudgmentOf<Test>) -> Self {
        Self { judgment, ..self }
    }

    pub fn with_rationale(self, rationale: Vec<u8>) -> Self {
        Self { rationale, ..self }
    }

    pub fn call_and_assert(&self, expected_result: DispatchResult) {
        let old_bounty = Bounty::bounties(self.bounty_id);
        let actual_result = Bounty::submit_oracle_judgment(
            self.origin.clone().into(),
            self.oracle.clone(),
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

pub struct WithdrawWorkEntrantFundsFixture {
    origin: RawOrigin<u128>,
    entry_id: u64,
    bounty_id: u64,
    member_id: u64,
}

impl WithdrawWorkEntrantFundsFixture {
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
        let actual_result = Bounty::withdraw_work_entrant_funds(
            self.origin.clone().into(),
            self.member_id,
            self.bounty_id,
            self.entry_id,
        );

        assert_eq!(actual_result, expected_result);

        if actual_result.is_ok() {
            assert!(!<crate::Entries<Test>>::contains_key(
                self.bounty_id,
                &self.entry_id
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
