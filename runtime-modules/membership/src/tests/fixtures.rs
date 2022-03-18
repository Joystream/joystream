use super::mock::*;
use crate::{BuyMembershipParameters, InviteMembershipParameters};
use frame_support::dispatch::DispatchResult;
use frame_support::traits::{OnFinalize, OnInitialize};
use frame_support::StorageMap;
use frame_system::{EventRecord, Phase, RawOrigin};
use sp_runtime::traits::Hash;

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
    pub handle_hash: Option<Vec<u8>>,
    pub metadata: Vec<u8>,
}

pub fn get_alice_info() -> TestUserInfo {
    let handle = b"alice".to_vec();
    let hashed = <Test as frame_system::Trait>::Hashing::hash(&handle);
    let hash = hashed.as_ref().to_vec();

    let metadata = b"
    {
        'name': 'Alice',
        'avatar_uri': 'http://avatar-url.com/alice',
        'about': 'my name is alice',
    }
    "
    .to_vec();

    TestUserInfo {
        handle: Some(handle),
        handle_hash: Some(hash),
        metadata,
    }
}

pub fn get_bob_info() -> TestUserInfo {
    let handle = b"bobby".to_vec();
    let hashed = <Test as frame_system::Trait>::Hashing::hash(&handle);
    let hash = hashed.as_ref().to_vec();

    let metadata = b"
    {
        'name': 'Bob',
        'avatar_uri': 'http://avatar-url.com/bob',
        'about': 'my name is bob',
    }
    "
    .to_vec();

    TestUserInfo {
        handle: Some(handle),
        handle_hash: Some(hash),
        metadata,
    }
}

pub const ALICE_ACCOUNT_ID: u64 = 1;
pub const BOB_ACCOUNT_ID: u64 = 2;
pub const ALICE_MEMBER_ID: u64 = 0;
pub const BOB_MEMBER_ID: u64 = 1;

pub fn get_alice_membership_parameters() -> BuyMembershipParameters<u64, u64> {
    let info = get_alice_info();

    BuyMembershipParameters {
        root_account: ALICE_ACCOUNT_ID,
        controller_account: ALICE_ACCOUNT_ID,
        handle: info.handle,
        referrer_id: None,
        metadata: info.metadata,
    }
}

pub fn buy_default_membership_as_alice() -> DispatchResult {
    let params = get_alice_membership_parameters();
    Membership::buy_membership(Origin::signed(ALICE_ACCOUNT_ID), params)
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

pub struct BuyMembershipFixture {
    pub origin: RawOrigin<u64>,
    pub root_account: u64,
    pub controller_account: u64,
    pub handle: Option<Vec<u8>>,
    pub metadata: Vec<u8>,
    pub referrer_id: Option<u64>,
}

impl Default for BuyMembershipFixture {
    fn default() -> Self {
        let alice = get_alice_info();
        Self {
            origin: RawOrigin::Signed(ALICE_ACCOUNT_ID),
            root_account: ALICE_ACCOUNT_ID,
            controller_account: ALICE_ACCOUNT_ID,
            handle: alice.handle,
            metadata: alice.metadata,
            referrer_id: None,
        }
    }
}

impl BuyMembershipFixture {
    pub fn call_and_assert(&self, expected_result: DispatchResult) {
        let params = BuyMembershipParameters {
            root_account: self.root_account.clone(),
            controller_account: self.controller_account.clone(),
            handle: self.handle.clone(),
            metadata: self.metadata.clone(),
            referrer_id: self.referrer_id.clone(),
        };

        let actual_result = Membership::buy_membership(self.origin.clone().into(), params);

        assert_eq!(expected_result, actual_result);
    }

    pub fn with_referrer_id(self, referrer_id: u64) -> Self {
        Self {
            referrer_id: Some(referrer_id),
            ..self
        }
    }

    pub fn with_handle(self, handle: Vec<u8>) -> Self {
        Self {
            handle: Some(handle),
            ..self
        }
    }

    pub fn with_accounts(self, account_id: u64) -> Self {
        Self {
            root_account: account_id,
            controller_account: account_id,
            ..self
        }
    }

    pub fn with_origin(self, origin: RawOrigin<u64>) -> Self {
        Self { origin, ..self }
    }
}

pub(crate) fn increase_total_balance_issuance_using_account_id(account_id: u64, balance: u64) {
    let initial_balance = Balances::total_issuance();
    {
        let _ = Balances::deposit_creating(&account_id, balance);
    }
    assert_eq!(Balances::total_issuance(), initial_balance + balance);
}

pub struct SetReferralCutFixture {
    pub origin: RawOrigin<u64>,
    pub value: u8,
}

pub const DEFAULT_REFERRAL_CUT_VALUE: u8 = 50;

impl Default for SetReferralCutFixture {
    fn default() -> Self {
        Self {
            origin: RawOrigin::Root,
            value: DEFAULT_REFERRAL_CUT_VALUE,
        }
    }
}

impl SetReferralCutFixture {
    pub fn call_and_assert(&self, expected_result: DispatchResult) {
        let actual_result = Membership::set_referral_cut(self.origin.clone().into(), self.value);

        assert_eq!(expected_result, actual_result);

        if actual_result.is_ok() {
            assert_eq!(Membership::referral_cut(), self.value);
        }
    }

    pub fn with_origin(self, origin: RawOrigin<u64>) -> Self {
        Self { origin, ..self }
    }

    pub fn with_referral_cut(self, value: u8) -> Self {
        Self { value, ..self }
    }
}

pub struct TransferInvitesFixture {
    pub origin: RawOrigin<u64>,
    pub source_member_id: u64,
    pub target_member_id: u64,
    pub invites: u32,
}

impl Default for TransferInvitesFixture {
    fn default() -> Self {
        Self {
            origin: RawOrigin::Signed(ALICE_ACCOUNT_ID),
            source_member_id: ALICE_MEMBER_ID,
            target_member_id: BOB_MEMBER_ID,
            invites: 3,
        }
    }
}

impl TransferInvitesFixture {
    pub fn call_and_assert(&self, expected_result: DispatchResult) {
        let actual_result = Membership::transfer_invites(
            self.origin.clone().into(),
            self.source_member_id,
            self.target_member_id,
            self.invites,
        );

        assert_eq!(expected_result, actual_result);
    }

    pub fn with_origin(self, origin: RawOrigin<u64>) -> Self {
        Self { origin, ..self }
    }

    pub fn with_source_member_id(self, source_member_id: u64) -> Self {
        Self {
            source_member_id,
            ..self
        }
    }

    pub fn with_target_member_id(self, target_member_id: u64) -> Self {
        Self {
            target_member_id,
            ..self
        }
    }

    pub fn with_invites_number(self, invites: u32) -> Self {
        Self { invites, ..self }
    }
}

pub struct InviteMembershipFixture {
    pub member_id: u64,
    pub origin: RawOrigin<u64>,
    pub root_account: u64,
    pub controller_account: u64,
    pub handle: Option<Vec<u8>>,
    pub metadata: Vec<u8>,
}

impl Default for InviteMembershipFixture {
    fn default() -> Self {
        let bob = get_bob_info();
        Self {
            member_id: ALICE_MEMBER_ID,
            origin: RawOrigin::Signed(ALICE_ACCOUNT_ID),
            root_account: BOB_ACCOUNT_ID,
            controller_account: BOB_ACCOUNT_ID,
            handle: bob.handle,
            metadata: bob.metadata,
        }
    }
}

impl InviteMembershipFixture {
    pub fn get_invite_membership_parameters(&self) -> InviteMembershipParameters<u64, u64> {
        InviteMembershipParameters {
            inviting_member_id: self.member_id.clone(),
            root_account: self.root_account.clone(),
            controller_account: self.controller_account.clone(),
            handle: self.handle.clone(),
            metadata: self.metadata.clone(),
        }
    }

    pub fn call_and_assert(&self, expected_result: DispatchResult) {
        let params = self.get_invite_membership_parameters();

        let actual_result = Membership::invite_member(self.origin.clone().into(), params);

        assert_eq!(expected_result, actual_result);
    }

    pub fn with_member_id(self, member_id: u64) -> Self {
        Self { member_id, ..self }
    }

    pub fn with_handle(self, handle: Vec<u8>) -> Self {
        Self {
            handle: Some(handle),
            ..self
        }
    }

    pub fn with_empty_handle(self) -> Self {
        Self {
            handle: None,
            ..self
        }
    }

    pub fn with_accounts(self, account_id: u64) -> Self {
        Self {
            root_account: account_id,
            controller_account: account_id,
            ..self
        }
    }

    pub fn with_origin(self, origin: RawOrigin<u64>) -> Self {
        Self { origin, ..self }
    }
}

pub struct SetMembershipPriceFixture {
    pub origin: RawOrigin<u64>,
    pub price: u64,
}

pub const DEFAULT_MEMBERSHIP_PRICE: u64 = 100;

impl Default for SetMembershipPriceFixture {
    fn default() -> Self {
        Self {
            origin: RawOrigin::Root,
            price: DEFAULT_MEMBERSHIP_PRICE,
        }
    }
}

impl SetMembershipPriceFixture {
    pub fn call_and_assert(&self, expected_result: DispatchResult) {
        let actual_result =
            Membership::set_membership_price(self.origin.clone().into(), self.price);

        assert_eq!(expected_result, actual_result);

        if actual_result.is_ok() {
            assert_eq!(Membership::membership_price(), self.price);
        }
    }

    pub fn with_price(self, price: u64) -> Self {
        Self { price, ..self }
    }

    pub fn with_origin(self, origin: RawOrigin<u64>) -> Self {
        Self { origin, ..self }
    }
}

pub struct SetLeaderInvitationQuotaFixture {
    pub origin: RawOrigin<u64>,
    pub quota: u32,
}

pub const DEFAULT_LEADER_INVITATION_QUOTA: u32 = 100;

impl Default for SetLeaderInvitationQuotaFixture {
    fn default() -> Self {
        Self {
            origin: RawOrigin::Root,
            quota: DEFAULT_LEADER_INVITATION_QUOTA,
        }
    }
}

impl SetLeaderInvitationQuotaFixture {
    pub fn call_and_assert(&self, expected_result: DispatchResult) {
        let actual_result =
            Membership::set_leader_invitation_quota(self.origin.clone().into(), self.quota);

        assert_eq!(expected_result, actual_result);

        if actual_result.is_ok() {
            assert_eq!(Membership::membership(ALICE_MEMBER_ID).invites, self.quota);
        }
    }

    pub fn with_origin(self, origin: RawOrigin<u64>) -> Self {
        Self { origin, ..self }
    }
}

pub struct SetInitialInvitationBalanceFixture {
    pub origin: RawOrigin<u64>,
    pub new_initial_balance: u64,
}

pub const DEFAULT_INITIAL_INVITATION_BALANCE: u64 = 200;

impl Default for SetInitialInvitationBalanceFixture {
    fn default() -> Self {
        Self {
            origin: RawOrigin::Root,
            new_initial_balance: DEFAULT_INITIAL_INVITATION_BALANCE,
        }
    }
}

impl SetInitialInvitationBalanceFixture {
    pub fn with_initial_balance(self, new_initial_balance: u64) -> Self {
        Self {
            new_initial_balance,
            ..self
        }
    }

    pub fn call_and_assert(&self, expected_result: DispatchResult) {
        let actual_result = Membership::set_initial_invitation_balance(
            self.origin.clone().into(),
            self.new_initial_balance,
        );

        assert_eq!(expected_result, actual_result);

        if actual_result.is_ok() {
            assert_eq!(
                Membership::initial_invitation_balance(),
                self.new_initial_balance
            );
        }
    }

    pub fn with_origin(self, origin: RawOrigin<u64>) -> Self {
        Self { origin, ..self }
    }
}

pub struct SetInitialInvitationCountFixture {
    pub origin: RawOrigin<u64>,
    pub new_invitation_count: u32,
}

pub const DEFAULT_INITIAL_INVITATION_COUNT: u32 = 5;

impl Default for SetInitialInvitationCountFixture {
    fn default() -> Self {
        Self {
            origin: RawOrigin::Root,
            new_invitation_count: DEFAULT_INITIAL_INVITATION_COUNT,
        }
    }
}

impl SetInitialInvitationCountFixture {
    pub fn call_and_assert(&self, expected_result: DispatchResult) {
        let actual_result = Membership::set_initial_invitation_count(
            self.origin.clone().into(),
            self.new_invitation_count,
        );

        assert_eq!(expected_result, actual_result);

        if actual_result.is_ok() {
            assert_eq!(
                Membership::initial_invitation_count(),
                self.new_invitation_count
            );
        }
    }

    pub fn with_origin(self, origin: RawOrigin<u64>) -> Self {
        Self { origin, ..self }
    }
}

pub struct AddStakingAccountFixture {
    pub origin: RawOrigin<u64>,
    pub member_id: u64,
    pub staking_account_id: u64,
    pub initial_balance: u64,
}

impl Default for AddStakingAccountFixture {
    fn default() -> Self {
        Self {
            origin: RawOrigin::Signed(ALICE_ACCOUNT_ID),
            member_id: ALICE_MEMBER_ID,
            staking_account_id: ALICE_ACCOUNT_ID,
            initial_balance: <Test as Trait>::CandidateStake::get(),
        }
    }
}

impl AddStakingAccountFixture {
    pub fn call_and_assert(&self, expected_result: DispatchResult) {
        Balances::make_free_balance_be(&self.staking_account_id, self.initial_balance);
        let actual_result =
            Membership::add_staking_account_candidate(self.origin.clone().into(), self.member_id);

        assert_eq!(expected_result, actual_result);

        if actual_result.is_ok() {
            assert!(<crate::StakingAccountIdMemberStatus<Test>>::contains_key(
                &self.staking_account_id,
            ));
        }
    }

    pub fn with_origin(self, origin: RawOrigin<u64>) -> Self {
        Self { origin, ..self }
    }

    pub fn with_member_id(self, member_id: u64) -> Self {
        Self { member_id, ..self }
    }

    pub fn with_initial_balance(self, initial_balance: u64) -> Self {
        Self {
            initial_balance,
            ..self
        }
    }
}

pub struct RemoveStakingAccountFixture {
    pub origin: RawOrigin<u64>,
    pub member_id: u64,
    pub staking_account_id: u64,
}

impl Default for RemoveStakingAccountFixture {
    fn default() -> Self {
        Self {
            origin: RawOrigin::Signed(ALICE_ACCOUNT_ID),
            member_id: ALICE_MEMBER_ID,
            staking_account_id: ALICE_ACCOUNT_ID,
        }
    }
}

impl RemoveStakingAccountFixture {
    pub fn call_and_assert(&self, expected_result: DispatchResult) {
        let initial_balance = Balances::usable_balance(&self.staking_account_id);

        let actual_result =
            Membership::remove_staking_account(self.origin.clone().into(), self.member_id);

        assert_eq!(expected_result, actual_result);

        if actual_result.is_ok() {
            assert_eq!(
                Balances::usable_balance(&self.staking_account_id),
                initial_balance + <Test as Trait>::CandidateStake::get()
            );

            assert!(!<crate::StakingAccountIdMemberStatus<Test>>::contains_key(
                &self.staking_account_id,
            ));
        }
    }

    pub fn with_origin(self, origin: RawOrigin<u64>) -> Self {
        Self { origin, ..self }
    }

    pub fn with_member_id(self, member_id: u64) -> Self {
        Self { member_id, ..self }
    }
}

pub struct ConfirmStakingAccountFixture {
    pub origin: RawOrigin<u64>,
    pub member_id: u64,
    pub staking_account_id: u64,
}

impl Default for ConfirmStakingAccountFixture {
    fn default() -> Self {
        Self {
            origin: RawOrigin::Signed(ALICE_ACCOUNT_ID),
            member_id: ALICE_MEMBER_ID,
            staking_account_id: ALICE_ACCOUNT_ID,
        }
    }
}

impl ConfirmStakingAccountFixture {
    pub fn call_and_assert(&self, expected_result: DispatchResult) {
        let actual_result = Membership::confirm_staking_account(
            self.origin.clone().into(),
            self.member_id,
            self.staking_account_id,
        );

        assert_eq!(expected_result, actual_result);

        if actual_result.is_ok() {
            assert!(<crate::StakingAccountIdMemberStatus<Test>>::get(&ALICE_ACCOUNT_ID,).confirmed);
        }
    }

    pub fn with_origin(self, origin: RawOrigin<u64>) -> Self {
        Self { origin, ..self }
    }

    pub fn with_member_id(self, member_id: u64) -> Self {
        Self { member_id, ..self }
    }
}
