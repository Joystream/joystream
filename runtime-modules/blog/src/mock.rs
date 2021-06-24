#![cfg(test)]

use crate::*;
use frame_support::traits::{LockIdentifier, OnFinalize, OnInitialize};
use frame_support::weights::Weight;
use frame_support::{impl_outer_event, impl_outer_origin, parameter_types};
use sp_core::H256;
use sp_io::TestExternalities;
use sp_runtime::{
    testing::Header,
    traits::{BlakeTwo256, IdentityLookup},
    DispatchResult, Perbill,
};

pub(crate) const FIRST_OWNER_ORIGIN: u128 = 0;
pub(crate) const FIRST_OWNER_PARTICIPANT_ID: u64 = 0;
pub(crate) const SECOND_OWNER_ORIGIN: u128 = 2;
pub(crate) const SECOND_OWNER_PARTICIPANT_ID: u64 = 2;
pub(crate) const BAD_MEMBER_ID: u64 = 100000;

impl_outer_origin! {
    pub enum Origin for Runtime {}
}

#[derive(Clone, Default, PartialEq, Eq, Debug)]
pub struct Runtime;

parameter_types! {
    pub const ExistentialDeposit: u32 = 0;
}

impl balances::Trait for Runtime {
    type Balance = u64;
    type DustRemoval = ();
    type Event = TestEvent;
    type ExistentialDeposit = ExistentialDeposit;
    type AccountStore = System;
    type WeightInfo = ();
    type MaxLocks = ();
}

parameter_types! {
    pub const BlockHashCount: u64 = 250;
    pub const MaximumBlockWeight: u32 = 1024;
    pub const MaximumBlockLength: u32 = 2 * 1024;
    pub const AvailableBlockRatio: Perbill = Perbill::one();
}

// First, implement the system pallet's configuration trait for `Runtime`
impl frame_system::Trait for Runtime {
    type BaseCallFilter = ();
    type Origin = Origin;
    type Call = ();
    type Index = u64;
    type BlockNumber = u64;
    type Hash = H256;
    type Hashing = BlakeTwo256;
    type AccountId = u128;
    type Lookup = IdentityLookup<Self::AccountId>;
    type Header = Header;
    type Event = TestEvent;
    type BlockHashCount = BlockHashCount;
    type MaximumBlockWeight = MaximumBlockWeight;
    type DbWeight = ();
    type BlockExecutionWeight = ();
    type ExtrinsicBaseWeight = ();
    type MaximumExtrinsicWeight = ();
    type MaximumBlockLength = MaximumBlockLength;
    type AvailableBlockRatio = AvailableBlockRatio;
    type Version = ();
    type PalletInfo = ();
    type AccountData = balances::AccountData<u64>;
    type OnNewAccount = ();
    type OnKilledAccount = ();
    type SystemWeightInfo = ();
}

impl_outer_event! {
    pub enum TestEvent for Runtime {
        crate DefaultInstance <T>,
        frame_system<T>,
        balances<T>,
        membership<T>,
    }
}

parameter_types! {
    pub const DefaultMembershipPrice: u64 = 100;
    pub const DefaultInitialInvitationBalance: u64 = 100;
    pub const InviteMemberLockId: [u8; 8] = [9; 8];
    pub const StakingCandidateLockId: [u8; 8] = [10; 8];
    pub const MinimumPeriod: u64 = 5;
    pub const ReferralCutMaximumPercent: u8 = 50;
    pub const CandidateStake: u64 = 100;
}

impl membership::Trait for Runtime {
    type Event = TestEvent;
    type DefaultMembershipPrice = DefaultMembershipPrice;
    type DefaultInitialInvitationBalance = DefaultInitialInvitationBalance;
    type WorkingGroup = ();
    type WeightInfo = Weights;
    type InvitedMemberStakingHandler = staking_handler::StakingManager<Self, InviteMemberLockId>;
    type ReferralCutMaximumPercent = ReferralCutMaximumPercent;
    type StakingCandidateStakingHandler =
        staking_handler::StakingManager<Self, StakingCandidateLockId>;
    type CandidateStake = CandidateStake;
}

impl pallet_timestamp::Trait for Runtime {
    type Moment = u64;
    type OnTimestampSet = ();
    type MinimumPeriod = MinimumPeriod;
    type WeightInfo = ();
}

impl staking_handler::LockComparator<u64> for Runtime {
    fn are_locks_conflicting(
        _new_lock: &LockIdentifier,
        _existing_locks: &[LockIdentifier],
    ) -> bool {
        false
    }
}

impl common::working_group::WorkingGroupBudgetHandler<Runtime> for () {
    fn get_budget() -> u64 {
        unimplemented!();
    }

    fn set_budget(_: u64) {
        unimplemented!()
    }
}

impl common::working_group::WorkingGroupAuthenticator<Runtime> for () {
    fn ensure_worker_origin(
        _origin: <Runtime as frame_system::Trait>::Origin,
        _worker_id: &<Runtime as common::membership::MembershipTypes>::ActorId,
    ) -> DispatchResult {
        unimplemented!()
    }

    fn ensure_leader_origin(_origin: <Runtime as frame_system::Trait>::Origin) -> DispatchResult {
        unimplemented!()
    }

    fn get_leader_member_id() -> Option<<Runtime as common::membership::MembershipTypes>::MemberId> {
        unimplemented!()
    }

    fn is_leader_account_id(_: &<Runtime as frame_system::Trait>::AccountId) -> bool {
        unimplemented!();
    }

    fn is_worker_account_id(
        _: &<Runtime as frame_system::Trait>::AccountId,
        _worker_id: &<Runtime as common::membership::MembershipTypes>::ActorId,
    ) -> bool {
        unimplemented!();
    }
}

pub struct Weights;
impl membership::WeightInfo for Weights {
    fn buy_membership_without_referrer(_: u32, _: u32) -> Weight {
        unimplemented!()
    }
    fn buy_membership_with_referrer(_: u32, _: u32) -> Weight {
        unimplemented!()
    }
    fn update_profile(_: u32) -> Weight {
        unimplemented!()
    }
    fn update_accounts_none() -> Weight {
        unimplemented!()
    }
    fn update_accounts_root() -> Weight {
        unimplemented!()
    }
    fn update_accounts_controller() -> Weight {
        unimplemented!()
    }
    fn update_accounts_both() -> Weight {
        unimplemented!()
    }
    fn set_referral_cut() -> Weight {
        unimplemented!()
    }
    fn transfer_invites() -> Weight {
        unimplemented!()
    }
    fn invite_member(_: u32, _: u32) -> Weight {
        unimplemented!()
    }
    fn set_membership_price() -> Weight {
        unimplemented!()
    }
    fn update_profile_verification() -> Weight {
        unimplemented!()
    }
    fn set_leader_invitation_quota() -> Weight {
        unimplemented!()
    }
    fn set_initial_invitation_balance() -> Weight {
        unimplemented!()
    }
    fn set_initial_invitation_count() -> Weight {
        unimplemented!()
    }
    fn add_staking_account_candidate() -> Weight {
        unimplemented!()
    }
    fn confirm_staking_account() -> Weight {
        unimplemented!()
    }
    fn remove_staking_account() -> Weight {
        unimplemented!()
    }
}

parameter_types! {
    pub const PostsMaxNumber: u64 = 20;
    pub const RepliesMaxNumber: u64 = 100;
    pub const ReplyDeposit: u64 = 500;
    pub const BlogModuleId: ModuleId = ModuleId(*b"m00:blog"); // module : blog
    pub const ReplyLifetime: <Runtime as frame_system::Trait>::BlockNumber = 10;
}

impl Trait for Runtime {
    type Event = TestEvent;

    type PostsMaxNumber = PostsMaxNumber;
    type ParticipantEnsureOrigin = MockEnsureParticipant;
    type WeightInfo = ();

    type ReplyId = u64;
    type ReplyDeposit = ReplyDeposit;
    type ModuleId = BlogModuleId;
    type ReplyLifetime = ReplyLifetime;
}

impl WeightInfo for () {
    fn create_post(_: u32, _: u32) -> Weight {
        unimplemented!()
    }
    fn lock_post() -> Weight {
        unimplemented!()
    }
    fn unlock_post() -> Weight {
        unimplemented!()
    }
    fn edit_post(_: u32, _: u32) -> Weight {
        unimplemented!()
    }
    fn create_reply_to_post(_: u32) -> Weight {
        unimplemented!()
    }
    fn create_reply_to_reply(_: u32) -> Weight {
        unimplemented!()
    }
    fn edit_reply(_: u32) -> Weight {
        unimplemented!()
    }
    fn delete_replies(_: u32) -> Weight {
        unimplemented!()
    }
}

pub struct MockEnsureParticipant;
impl
    MemberOriginValidator<
        Origin,
        ParticipantId<Runtime>,
        <Runtime as frame_system::Trait>::AccountId,
    > for MockEnsureParticipant
{
    fn is_member_controller_account(
        member_id: &ParticipantId<Runtime>,
        _: &<Runtime as frame_system::Trait>::AccountId,
    ) -> bool {
        *member_id != BAD_MEMBER_ID
    }

    fn ensure_member_controller_account_origin(
        _: Origin,
        _: ParticipantId<Runtime>,
    ) -> Result<<Runtime as frame_system::Trait>::AccountId, DispatchError> {
        unimplemented!();
    }
}

impl common::membership::MembershipTypes for Runtime {
    type MemberId = u64;
    type ActorId = u64;
}

#[derive(Default)]
pub struct ExtBuilder;

pub(crate) fn run_to_block(n: u64) {
    while System::block_number() < n {
        <System as OnFinalize<u64>>::on_finalize(System::block_number());
        <crate::Module<Runtime> as OnFinalize<u64>>::on_finalize(System::block_number());
        System::set_block_number(System::block_number() + 1);
        <System as OnInitialize<u64>>::on_initialize(System::block_number());
        <crate::Module<Runtime> as OnInitialize<u64>>::on_initialize(System::block_number());
    }
}

impl ExtBuilder {
    pub fn build(self) -> TestExternalities {
        let t = frame_system::GenesisConfig::default()
            .build_storage::<Runtime>()
            .unwrap();

        let mut result: TestExternalities = t.into();

        // Make sure we are not in block 0 where no events are emitted - see https://substrate.dev/recipes/2-appetizers/4-events.html#emitting-events
        result.execute_with(|| run_to_block(1));

        result
    }
}

// Assign back to type variables so we can make dispatched calls of these modules later.
pub type System = frame_system::Module<Runtime>;
pub type TestBlogModule = Module<Runtime>;

pub fn generate_text(len: usize) -> Vec<u8> {
    vec![b'x'; len]
}

type RawTestEvent = RawEvent<
    ParticipantId<Runtime>,
    PostId,
    <Runtime as Trait>::ReplyId,
    Vec<u8>,
    Vec<u8>,
    Option<Vec<u8>>,
    Option<Vec<u8>>,
    DefaultInstance,
>;

pub fn get_test_event(raw_event: RawTestEvent) -> TestEvent {
    TestEvent::crate_DefaultInstance(raw_event)
}

// Posts
pub fn post_count() -> u64 {
    TestBlogModule::post_count()
}

pub fn post_by_id(post_id: PostId) -> Option<Post<Runtime, DefaultInstance>> {
    match TestBlogModule::post_by_id(post_id) {
        post if post != Post::<Runtime, DefaultInstance>::default() => Some(post),
        _ => None,
    }
}

pub fn get_post(locked: bool) -> Post<Runtime, DefaultInstance> {
    let title = generate_text(10);
    let body = generate_text(100);
    let mut post = Post::new(&title, &body);
    if locked {
        post.lock()
    }
    post
}

pub(crate) fn generate_post() -> (Vec<u8>, Vec<u8>) {
    (generate_text(10), generate_text(100))
}

pub fn create_post(origin: Origin) -> DispatchResult {
    let (title, body) = generate_post();
    TestBlogModule::create_post(origin, title, body)
}

pub fn lock_post(origin: Origin, post_id: PostId) -> DispatchResult {
    TestBlogModule::lock_post(origin, post_id)
}

pub fn unlock_post(origin: Origin, post_id: PostId) -> DispatchResult {
    TestBlogModule::unlock_post(origin, post_id)
}

pub fn edit_post(origin: Origin, post_id: PostId) -> DispatchResult {
    let (title, body) = generate_post();
    TestBlogModule::edit_post(origin, post_id, Some(title), Some(body))
}

// Replies
pub fn reply_by_id(
    post_id: PostId,
    reply_id: <Runtime as Trait>::ReplyId,
) -> Option<Reply<Runtime, DefaultInstance>> {
    match TestBlogModule::reply_by_id(post_id, reply_id) {
        reply if reply != Reply::<Runtime, DefaultInstance>::default() => Some(reply),
        _ => None,
    }
}

pub fn get_reply_text() -> Vec<u8> {
    generate_text(100)
}

pub fn get_reply(
    owner: ParticipantId<Runtime>,
    parent_id: ParentId<<Runtime as Trait>::ReplyId, PostId>,
) -> Reply<Runtime, DefaultInstance> {
    let reply_text = get_reply_text();
    Reply::new(
        reply_text,
        owner,
        parent_id,
        <Runtime as Trait>::ReplyDeposit::get(),
    )
}

pub fn create_reply(
    origin_id: u128,
    participant_id: u64,
    post_id: PostId,
    reply_id: Option<<Runtime as Trait>::ReplyId>,
    editable: bool,
) -> DispatchResult {
    let reply = get_reply_text();
    TestBlogModule::create_reply(
        Origin::signed(origin_id),
        participant_id,
        post_id,
        reply_id,
        reply,
        editable,
    )
}

pub fn delete_reply(
    origin_id: u128,
    participant_id: u64,
    post_id: PostId,
    reply_id: <Runtime as Trait>::ReplyId,
) -> DispatchResult {
    TestBlogModule::delete_replies(
        Origin::signed(origin_id),
        participant_id,
        vec![ReplyToDelete {
            post_id,
            reply_id,
            hide: false,
        }],
    )
}

pub fn edit_reply(
    origin_id: u128,
    participant_id: u64,
    post_id: PostId,
    reply_id: <Runtime as Trait>::ReplyId,
) -> DispatchResult {
    let reply = get_reply_text();
    TestBlogModule::edit_reply(
        Origin::signed(origin_id),
        participant_id,
        post_id,
        reply_id,
        reply,
    )
}
