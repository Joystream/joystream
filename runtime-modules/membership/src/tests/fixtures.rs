use super::mock::*;
use frame_support::dispatch::DispatchResult;
use frame_support::traits::{OnFinalize, OnInitialize};
use frame_support::StorageMap;
use frame_system::{EventRecord, Phase, RawOrigin};

// Recommendation from Parity on testing on_finalize
// https://substrate.dev/docs/en/next/development/module/tests
pub fn run_to_block(n: u64) {
    while System::block_number() < n {
        <System as OnFinalize<u64>>::on_finalize(System::block_number());
        <Membership as OnFinalize<u64>>::on_finalize(System::block_number());
        System::set_block_number(System::block_number() + 1);
        <System as OnInitialize<u64>>::on_initialize(System::block_number());
        <Membership as OnInitialize<u64>>::on_initialize(System::block_number());
    }
}

pub struct EventFixture;
impl EventFixture {
    pub fn assert_last_crate_event(expected_raw_event: crate::Event<Test>) {
        let converted_event = TestEvent::membership_mod(expected_raw_event);

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

pub fn get_membership_by_id(member_id: u64) -> crate::Membership<Test> {
    if <crate::MembershipById<Test>>::contains_key(member_id) {
        Membership::membership(member_id)
    } else {
        panic!("member profile not created");
    }
}

pub fn assert_dispatch_error_message(result: DispatchResult, expected_result: DispatchResult) {
    assert!(result.is_err());
    assert_eq!(result, expected_result);
}

#[derive(Clone, Debug, PartialEq)]
pub struct TestUserInfo {
    pub handle: Option<Vec<u8>>,
    pub avatar_uri: Option<Vec<u8>>,
    pub about: Option<Vec<u8>>,
}

pub fn get_alice_info() -> TestUserInfo {
    TestUserInfo {
        handle: Some(String::from("alice").as_bytes().to_vec()),
        avatar_uri: Some(
            String::from("http://avatar-url.com/alice")
                .as_bytes()
                .to_vec(),
        ),
        about: Some(String::from("my name is alice").as_bytes().to_vec()),
    }
}

pub fn get_bob_info() -> TestUserInfo {
    TestUserInfo {
        handle: Some(String::from("bobby").as_bytes().to_vec()),
        avatar_uri: Some(
            String::from("http://avatar-url.com/bob")
                .as_bytes()
                .to_vec(),
        ),
        about: Some(String::from("my name is bob").as_bytes().to_vec()),
    }
}

pub const ALICE_ACCOUNT_ID: u64 = 1;

pub fn buy_default_membership_as_alice() -> DispatchResult {
    let info = get_alice_info();
    Membership::buy_membership(
        Origin::signed(ALICE_ACCOUNT_ID),
        info.handle,
        info.avatar_uri,
        info.about,
    )
}

pub fn set_alice_free_balance(balance: u64) {
    let _ = Balances::deposit_creating(&ALICE_ACCOUNT_ID, balance);
}

pub struct UpdateMembershipVerificationFixture {
    pub origin: RawOrigin<u64>,
    pub worker_id: u64,
    pub member_id: u64,
    pub verified: bool,
}

impl Default for UpdateMembershipVerificationFixture {
    fn default() -> Self {
        Self {
            origin: RawOrigin::Signed(ALICE_ACCOUNT_ID),
            worker_id: 1,
            member_id: 1,
            verified: true,
        }
    }
}

impl UpdateMembershipVerificationFixture {
    pub fn call_and_assert(&self, expected_result: DispatchResult) {
        let actual_result = Membership::update_profile_verification(
            self.origin.clone().into(),
            self.worker_id,
            self.member_id,
            self.verified,
        );

        assert_eq!(expected_result, actual_result);

        if actual_result.is_ok() {
            let membership = get_membership_by_id(self.member_id);
            assert_eq!(membership.verified, self.verified);
        }
    }

    pub fn with_origin(self, origin: RawOrigin<u64>) -> Self {
        Self { origin, ..self }
    }

    pub fn with_member_id(self, member_id: u64) -> Self {
        Self { member_id, ..self }
    }

    pub fn with_worker_id(self, worker_id: u64) -> Self {
        Self { worker_id, ..self }
    }
}
