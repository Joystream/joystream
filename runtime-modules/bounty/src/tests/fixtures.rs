use frame_support::dispatch::DispatchResult;
use frame_support::storage::StorageMap;
use frame_support::traits::{Currency, OnFinalize, OnInitialize};
use frame_system::{EventRecord, Phase, RawOrigin};

use super::mocks::{Balances, Bounty, System, Test, TestEvent};
use crate::{BountyCreationParameters, BountyCreator, BountyMilestone, BountyRecord, RawEvent};

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

pub fn increase_total_balance_issuance_using_account_id(account_id: u64, balance: u64) {
    let initial_balance = Balances::total_issuance();
    {
        let _ = Balances::deposit_creating(&account_id, balance);
    }
    assert_eq!(Balances::total_issuance(), initial_balance + balance);
}

pub fn increase_account_balance(account_id: &u64, balance: u64) {
    let _ = Balances::deposit_creating(&account_id, balance);
}

pub struct EventFixture;
impl EventFixture {
    pub fn assert_last_crate_event(expected_raw_event: RawEvent<u64, u64, u64, u64>) {
        let converted_event = TestEvent::bounty(expected_raw_event);

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

pub const DEFAULT_BOUNTY_MAX_AMOUNT: u64 = 1000;
pub struct CreateBountyFixture {
    origin: RawOrigin<u64>,
    metadata: Vec<u8>,
    creator: BountyCreator<u64>,
    funding_period: Option<u64>,
    min_amount: u64,
    max_amount: u64,
    work_period: u64,
    judging_period: u64,
    cherry: u64,
    creator_funding: u64,
    expected_milestone: Option<BountyMilestone<u64>>,
}

impl CreateBountyFixture {
    pub fn default() -> Self {
        Self {
            origin: RawOrigin::Root,
            metadata: Vec::new(),
            creator: BountyCreator::Council,
            funding_period: None,
            min_amount: 0,
            max_amount: DEFAULT_BOUNTY_MAX_AMOUNT,
            work_period: 1,
            judging_period: 1,
            cherry: 0,
            creator_funding: 0,
            expected_milestone: None,
        }
    }

    pub fn with_origin(self, origin: RawOrigin<u64>) -> Self {
        Self { origin, ..self }
    }

    pub fn with_creator_member_id(self, member_id: u64) -> Self {
        Self {
            creator: BountyCreator::Member(member_id),
            ..self
        }
    }

    pub fn with_metadata(self, metadata: Vec<u8>) -> Self {
        Self { metadata, ..self }
    }

    pub fn with_min_amount(self, min_amount: u64) -> Self {
        Self { min_amount, ..self }
    }
    pub fn with_max_amount(self, max_amount: u64) -> Self {
        Self { max_amount, ..self }
    }

    pub fn with_work_period(self, work_period: u64) -> Self {
        Self {
            work_period,
            ..self
        }
    }

    pub fn with_funding_period(self, funding_period: u64) -> Self {
        Self {
            funding_period: Some(funding_period),
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

    pub fn with_creator_funding(self, creator_funding: u64) -> Self {
        Self {
            creator_funding,
            ..self
        }
    }

    pub fn with_expected_milestone(self, milestone: BountyMilestone<u64>) -> Self {
        Self {
            expected_milestone: Some(milestone),
            ..self
        }
    }

    pub fn get_bounty_creation_parameters(&self) -> BountyCreationParameters<Test> {
        BountyCreationParameters::<Test> {
            creator: self.creator.clone(),
            min_amount: self.min_amount.clone(),
            max_amount: self.max_amount.clone(),
            work_period: self.work_period.clone(),
            judging_period: self.judging_period.clone(),
            funding_period: self.funding_period.clone(),
            cherry: self.cherry,
            creator_funding: self.creator_funding,
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
                total_funding: params.creator_funding,
                milestone: expected_milestone,
            };

            assert_eq!(expected_bounty, Bounty::bounties(bounty_id));
        } else {
            assert_eq!(next_bounty_count_value - 1, Bounty::bounty_count());
            assert!(!<crate::Bounties<Test>>::contains_key(&bounty_id));
        }
    }
}

pub struct CancelBountyFixture {
    origin: RawOrigin<u64>,
    creator: BountyCreator<u64>,
    bounty_id: u64,
}

impl CancelBountyFixture {
    pub fn default() -> Self {
        Self {
            origin: RawOrigin::Root,
            creator: BountyCreator::Council,
            bounty_id: 1,
        }
    }

    pub fn with_origin(self, origin: RawOrigin<u64>) -> Self {
        Self { origin, ..self }
    }

    pub fn with_creator_member_id(self, member_id: u64) -> Self {
        Self {
            creator: BountyCreator::Member(member_id),
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
            let bounty = Bounty::bounties(&self.bounty_id);

            assert!(matches!(bounty.milestone, BountyMilestone::Canceled))
        }
    }
}

pub struct VetoBountyFixture {
    origin: RawOrigin<u64>,
    bounty_id: u64,
}

impl VetoBountyFixture {
    pub fn default() -> Self {
        Self {
            origin: RawOrigin::Root,
            bounty_id: 1,
        }
    }

    pub fn with_origin(self, origin: RawOrigin<u64>) -> Self {
        Self { origin, ..self }
    }

    pub fn with_bounty_id(self, bounty_id: u64) -> Self {
        Self { bounty_id, ..self }
    }

    pub fn call_and_assert(&self, expected_result: DispatchResult) {
        let actual_result = Bounty::veto_bounty(self.origin.clone().into(), self.bounty_id.clone());

        assert_eq!(actual_result, expected_result);

        if actual_result.is_ok() {
            let bounty = Bounty::bounties(&self.bounty_id);

            assert!(matches!(bounty.milestone, BountyMilestone::Canceled))
        }
    }
}

pub struct FundBountyFixture {
    origin: RawOrigin<u64>,
    member_id: u64,
    bounty_id: u64,
    amount: u64,
}

impl FundBountyFixture {
    pub fn default() -> Self {
        Self {
            origin: RawOrigin::Signed(1),
            member_id: 1,
            bounty_id: 1,
            amount: 100,
        }
    }

    pub fn with_origin(self, origin: RawOrigin<u64>) -> Self {
        Self { origin, ..self }
    }

    pub fn with_member_id(self, member_id: u64) -> Self {
        Self { member_id, ..self }
    }

    pub fn with_bounty_id(self, bounty_id: u64) -> Self {
        Self { bounty_id, ..self }
    }

    pub fn with_amount(self, amount: u64) -> Self {
        Self { amount, ..self }
    }

    pub fn call_and_assert(&self, expected_result: DispatchResult) {
        let old_bounty_funding =
            Bounty::contribution_by_bounty_by_member(self.bounty_id, self.member_id);

        let actual_result = Bounty::fund_bounty(
            self.origin.clone().into(),
            self.member_id.clone(),
            self.bounty_id.clone(),
            self.amount.clone(),
        );

        assert_eq!(actual_result, expected_result);

        let new_bounty_funding =
            Bounty::contribution_by_bounty_by_member(self.bounty_id, self.member_id);
        if actual_result.is_ok() {
            assert_eq!(new_bounty_funding, old_bounty_funding + self.amount);
        } else {
            assert_eq!(new_bounty_funding, old_bounty_funding);
        }
    }
}

pub struct WithdrawMemberFundingFixture {
    origin: RawOrigin<u64>,
    member_id: u64,
    bounty_id: u64,
}

impl WithdrawMemberFundingFixture {
    pub fn default() -> Self {
        Self {
            origin: RawOrigin::Signed(1),
            member_id: 1,
            bounty_id: 1,
        }
    }

    pub fn with_origin(self, origin: RawOrigin<u64>) -> Self {
        Self { origin, ..self }
    }

    pub fn with_member_id(self, member_id: u64) -> Self {
        Self { member_id, ..self }
    }

    pub fn with_bounty_id(self, bounty_id: u64) -> Self {
        Self { bounty_id, ..self }
    }

    pub fn call_and_assert(&self, expected_result: DispatchResult) {
        let actual_result = Bounty::withdraw_member_funding(
            self.origin.clone().into(),
            self.member_id.clone(),
            self.bounty_id.clone(),
        );

        assert_eq!(actual_result, expected_result);
    }
}

pub struct WithdrawCreatorFundingFixture {
    origin: RawOrigin<u64>,
    creator: BountyCreator<u64>,
    bounty_id: u64,
}

impl WithdrawCreatorFundingFixture {
    pub fn default() -> Self {
        Self {
            origin: RawOrigin::Root,
            creator: BountyCreator::Council,
            bounty_id: 1,
        }
    }

    pub fn with_origin(self, origin: RawOrigin<u64>) -> Self {
        Self { origin, ..self }
    }

    pub fn with_creator_member_id(self, member_id: u64) -> Self {
        Self {
            creator: BountyCreator::Member(member_id),
            ..self
        }
    }

    pub fn with_bounty_id(self, bounty_id: u64) -> Self {
        Self { bounty_id, ..self }
    }

    pub fn call_and_assert(&self, expected_result: DispatchResult) {
        let actual_result = Bounty::withdraw_creator_funding(
            self.origin.clone().into(),
            self.creator.clone(),
            self.bounty_id.clone(),
        );

        assert_eq!(actual_result, expected_result);
    }
}
