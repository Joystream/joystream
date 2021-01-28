use frame_support::dispatch::DispatchResult;
use frame_support::storage::StorageMap;
use frame_support::traits::{Currency, OnFinalize, OnInitialize};
use frame_system::{EventRecord, Phase, RawOrigin};

use super::mocks::{Balances, Bounty, System, Test, TestEvent};
use crate::{BountyCreationParameters, RawEvent};

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

pub struct EventFixture;
impl EventFixture {
    pub fn assert_last_crate_event(expected_raw_event: RawEvent<u64>) {
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

pub struct CreateBountyFixture {
    origin: RawOrigin<u64>,
    metadata: Vec<u8>,
    creator_member_id: Option<u64>,
    min_amount: u64,
    work_period: u64,
    judging_period: u64,
    cherry: u64,
}

impl CreateBountyFixture {
    pub fn default() -> Self {
        Self {
            origin: RawOrigin::Root,
            metadata: Vec::new(),
            creator_member_id: None,
            min_amount: 0,
            work_period: 1,
            judging_period: 1,
            cherry: 0,
        }
    }

    pub fn with_origin(self, origin: RawOrigin<u64>) -> Self {
        Self { origin, ..self }
    }

    pub fn with_creator_member_id(self, member_id: u64) -> Self {
        Self {
            creator_member_id: Some(member_id),
            ..self
        }
    }

    pub fn with_metadata(self, metadata: Vec<u8>) -> Self {
        Self { metadata, ..self }
    }

    pub fn with_min_amount(self, min_amount: u64) -> Self {
        Self { min_amount, ..self }
    }

    pub fn with_work_period(self, work_period: u64) -> Self {
        Self {
            work_period,
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

    pub fn call_and_assert(&self, expected_result: DispatchResult) {
        let params = BountyCreationParameters::<Test> {
            creator_member_id: self.creator_member_id.clone(),
            min_amount: self.min_amount.clone(),
            work_period: self.work_period.clone(),
            judging_period: self.judging_period.clone(),
            cherry: self.cherry,
            ..Default::default()
        };

        let next_bounty_count_value = Bounty::bounty_count() + 1;
        let bounty_id: u64 = next_bounty_count_value.into();

        let actual_result =
            Bounty::create_bounty(self.origin.clone().into(), params, self.metadata.clone());

        assert_eq!(actual_result, expected_result);

        if actual_result.is_ok() {
            assert_eq!(next_bounty_count_value, Bounty::bounty_count());
            assert!(<crate::Bounties<Test>>::contains_key(&bounty_id));
        } else {
            assert_eq!(next_bounty_count_value - 1, Bounty::bounty_count());
            assert!(!<crate::Bounties<Test>>::contains_key(&bounty_id));
        }
    }
}

pub struct CancelBountyFixture {
    origin: RawOrigin<u64>,
    creator_member_id: Option<u64>,
    bounty_id: u64,
}

impl CancelBountyFixture {
    pub fn default() -> Self {
        Self {
            origin: RawOrigin::Root,
            creator_member_id: None,
            bounty_id: 1,
        }
    }

    pub fn with_origin(self, origin: RawOrigin<u64>) -> Self {
        Self { origin, ..self }
    }

    pub fn with_creator_member_id(self, member_id: u64) -> Self {
        Self {
            creator_member_id: Some(member_id),
            ..self
        }
    }

    pub fn with_bounty_id(self, bounty_id: u64) -> Self {
        Self { bounty_id, ..self }
    }

    pub fn call_and_assert(&self, expected_result: DispatchResult) {
        let actual_result = Bounty::cancel_bounty(
            self.origin.clone().into(),
            self.creator_member_id.clone(),
            self.bounty_id.clone(),
        );

        assert_eq!(actual_result, expected_result);

        if actual_result.is_ok() {
            assert!(!<crate::Bounties<Test>>::contains_key(&self.bounty_id));
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
            assert!(!<crate::Bounties<Test>>::contains_key(&self.bounty_id));
        }
    }
}
