#![cfg(test)]

use crate::*;

pub use frame_support::assert_err;
use sp_core::H256;

use crate::{GenesisConfig, Module, Trait};
use frame_support::traits::{LockIdentifier, OnFinalize, OnInitialize};
use staking_handler::LockComparator;

use frame_support::{impl_outer_event, impl_outer_origin, parameter_types};
use sp_runtime::{
    testing::Header,
    traits::{BlakeTwo256, Hash, IdentityLookup},
    DispatchError, Perbill,
};

impl_outer_origin! {
    pub enum Origin for Runtime {}
}

mod forum_mod {
    pub use crate::Event;
}

impl_outer_event! {
    pub enum TestEvent for Runtime {
        forum_mod<T>,
        frame_system<T>,
        balances<T>,
        membership<T>,
        working_group Instance1 <T>,
    }
}

// Workaround for https://github.com/rust-lang/rust/issues/26925 . Remove when sorted.
#[derive(Clone, PartialEq, Eq, Debug)]
pub struct Runtime;
parameter_types! {
    pub const BlockHashCount: u64 = 250;
    pub const MaximumBlockWeight: u32 = 1024;
    pub const MaximumBlockLength: u32 = 2 * 1024;
    pub const AvailableBlockRatio: Perbill = Perbill::one();
    pub const MinimumPeriod: u64 = 5;
    pub const ExistentialDeposit: u32 = 0;
    pub const DefaultMembershipPrice: u64 = 100;
    pub const DefaultInitialInvitationBalance: u64 = 100;
}

impl frame_system::Trait for Runtime {
    type BaseCallFilter = ();
    type Origin = Origin;
    type Call = ();
    type Index = u64;
    type BlockNumber = u64;
    type Hash = H256;
    type Hashing = BlakeTwo256;
    type AccountId = u64;
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

impl pallet_timestamp::Trait for Runtime {
    type Moment = u64;
    type OnTimestampSet = ();
    type MinimumPeriod = MinimumPeriod;
    type WeightInfo = ();
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

impl common::Trait for Runtime {
    type MemberId = u64;
    type ActorId = u64;
}

parameter_types! {
    pub const MaxWorkerNumberLimit: u32 = 3;
    pub const LockId: [u8; 8] = [9; 8];
    pub const InviteMemberLockId: [u8; 8] = [9; 8];
}

// The forum working group instance alias.
pub type ForumWorkingGroupInstance = working_group::Instance1;

impl working_group::Trait<ForumWorkingGroupInstance> for Runtime {
    type Event = TestEvent;
    type MaxWorkerNumberLimit = MaxWorkerNumberLimit;
    type StakingAccountValidator = membership::Module<Runtime>;
    type StakingHandler = staking_handler::StakingManager<Self, LockId>;
    type MemberOriginValidator = ();
    type MinUnstakingPeriodLimit = ();
    type RewardPeriod = ();
    type WeightInfo = Weights;
}

impl LockComparator<<Runtime as balances::Trait>::Balance> for Runtime {
    fn are_locks_conflicting(
        _new_lock: &LockIdentifier,
        _existing_locks: &[LockIdentifier],
    ) -> bool {
        false
    }
}

// Weights info stub
pub struct Weights;
impl working_group::WeightInfo for Weights {
    fn on_initialize_leaving(_: u32) -> u64 {
        unimplemented!()
    }

    fn on_initialize_rewarding_with_missing_reward(_: u32) -> u64 {
        unimplemented!()
    }

    fn on_initialize_rewarding_with_missing_reward_cant_pay(_: u32) -> u64 {
        unimplemented!()
    }

    fn on_initialize_rewarding_without_missing_reward(_: u32) -> u64 {
        unimplemented!()
    }

    fn apply_on_opening(_: u32) -> u64 {
        unimplemented!()
    }

    fn fill_opening_lead() -> u64 {
        unimplemented!()
    }

    fn fill_opening_worker(_: u32) -> u64 {
        unimplemented!()
    }

    fn update_role_account() -> u64 {
        unimplemented!()
    }

    fn cancel_opening() -> u64 {
        unimplemented!()
    }

    fn withdraw_application() -> u64 {
        unimplemented!()
    }

    fn slash_stake(_: u32) -> u64 {
        unimplemented!()
    }

    fn terminate_role_worker(_: u32) -> u64 {
        unimplemented!()
    }

    fn terminate_role_lead(_: u32) -> u64 {
        unimplemented!()
    }

    fn increase_stake() -> u64 {
        unimplemented!()
    }

    fn decrease_stake() -> u64 {
        unimplemented!()
    }

    fn spend_from_budget() -> u64 {
        unimplemented!()
    }

    fn update_reward_amount() -> u64 {
        unimplemented!()
    }

    fn set_status_text(_: u32) -> u64 {
        unimplemented!()
    }

    fn update_reward_account() -> u64 {
        unimplemented!()
    }

    fn set_budget() -> u64 {
        unimplemented!()
    }

    fn add_opening(_: u32) -> u64 {
        unimplemented!()
    }

    fn leave_role_immediatly() -> u64 {
        unimplemented!()
    }

    fn leave_role_later() -> u64 {
        unimplemented!()
    }
}

impl membership::Trait for Runtime {
    type Event = TestEvent;
    type DefaultMembershipPrice = DefaultMembershipPrice;
    type DefaultInitialInvitationBalance = DefaultInitialInvitationBalance;
    type WorkingGroup = working_group::Module<Self, ForumWorkingGroupInstance>;
    type InvitedMemberStakingHandler = staking_handler::StakingManager<Self, InviteMemberLockId>;
}

parameter_types! {
    pub const MaxCategoryDepth: u64 = 20;

    pub const MaxSubcategories: u64 = 20;
    pub const MaxThreadsInCategory: u64 = 20;
    pub const MaxPostsInThread: u64 = 20;
    pub const MaxModeratorsForCategory: u64 = 3;
    pub const MaxCategories: u64 = 40;
    pub const MaxPollAlternativesNumber: u64 = 20;
}

pub struct MapLimits;

impl StorageLimits for MapLimits {
    type MaxSubcategories = MaxSubcategories;
    type MaxThreadsInCategory = MaxThreadsInCategory;
    type MaxPostsInThread = MaxPostsInThread;
    type MaxModeratorsForCategory = MaxModeratorsForCategory;
    type MaxCategories = MaxCategories;
    type MaxPollAlternativesNumber = MaxPollAlternativesNumber;
}

impl Trait for Runtime {
    type Event = TestEvent;
    type CategoryId = u64;
    type ThreadId = u64;
    type PostId = u64;
    type PostReactionId = u64;
    type MaxCategoryDepth = MaxCategoryDepth;

    type MapLimits = MapLimits;
    type WorkingGroup = ();
    type MemberOriginValidator = ();

    fn calculate_hash(text: &[u8]) -> Self::Hash {
        Self::Hashing::hash(text)
    }

    type WeightInfo = ();
}

impl common::origin::MemberOriginValidator<Origin, u64, u64> for () {
    fn ensure_member_controller_account_origin(
        origin: Origin,
        member_id: u64,
    ) -> Result<u64, DispatchError> {
        let account_id = ensure_signed(origin).unwrap();
        ensure!(
            Self::is_member_controller_account(&member_id, &account_id),
            DispatchError::BadOrigin
        );
        Ok(account_id)
    }

    fn is_member_controller_account(member_id: &u64, account_id: &u64) -> bool {
        let allowed_accounts = [
            FORUM_LEAD_ORIGIN_ID,
            NOT_FORUM_LEAD_ORIGIN_ID,
            NOT_FORUM_LEAD_2_ORIGIN_ID,
        ];

        allowed_accounts.contains(account_id) && account_id == member_id
    }
}

impl common::working_group::WorkingGroupAuthenticator<Runtime> for () {
    fn ensure_worker_origin(
        _origin: <Runtime as frame_system::Trait>::Origin,
        _worker_id: &<Runtime as common::Trait>::ActorId,
    ) -> DispatchResult {
        unimplemented!()
    }

    fn ensure_leader_origin(_origin: <Runtime as frame_system::Trait>::Origin) -> DispatchResult {
        unimplemented!()
    }

    fn get_leader_member_id() -> Option<<Runtime as common::Trait>::MemberId> {
        unimplemented!()
    }

    fn is_leader_account_id(account_id: &<Runtime as frame_system::Trait>::AccountId) -> bool {
        *account_id != NOT_FORUM_LEAD_ORIGIN_ID && *account_id != NOT_FORUM_LEAD_2_ORIGIN_ID
    }

    fn is_worker_account_id(
        account_id: &<Runtime as frame_system::Trait>::AccountId,
        _worker_id: &<Runtime as common::Trait>::ActorId,
    ) -> bool {
        *account_id != NOT_FORUM_MODERATOR_ORIGIN_ID
    }
}

impl WeightInfo for () {
    fn create_category(_: u32, _: u32, _: u32) -> Weight {
        0
    }
    fn update_category_membership_of_moderator_new() -> Weight {
        0
    }
    fn update_category_membership_of_moderator_old() -> Weight {
        0
    }
    fn update_category_archival_status_lead(_: u32) -> Weight {
        0
    }
    fn update_category_archival_status_moderator(_: u32) -> Weight {
        0
    }
    fn delete_category_lead(_: u32) -> Weight {
        0
    }
    fn delete_category_moderator(_: u32) -> Weight {
        0
    }
    fn create_thread(_: u32, _: u32, _: u32, _: u32) -> Weight {
        0
    }
    fn edit_thread_title(_: u32, _: u32) -> Weight {
        0
    }
    fn update_thread_archival_status_lead(_: u32) -> Weight {
        0
    }
    fn update_thread_archival_status_moderator(_: u32) -> Weight {
        0
    }
    fn delete_thread_lead(_: u32) -> Weight {
        0
    }
    fn delete_thread_moderator(_: u32) -> Weight {
        0
    }
    fn move_thread_to_category_lead(_: u32) -> Weight {
        0
    }
    fn move_thread_to_category_moderator(_: u32) -> Weight {
        0
    }
    fn vote_on_poll(_: u32, _: u32) -> Weight {
        0
    }
    fn moderate_thread_lead(_: u32, _: u32, _: u32) -> Weight {
        0
    }
    fn moderate_thread_moderator(_: u32, _: u32, _: u32) -> Weight {
        0
    }
    fn add_post(_: u32, _: u32) -> Weight {
        0
    }
    fn react_post(_: u32) -> Weight {
        0
    }
    fn edit_post_text(_: u32, _: u32) -> Weight {
        0
    }
    fn moderate_post_lead(_: u32, _: u32) -> Weight {
        0
    }
    fn moderate_post_moderator(_: u32, _: u32) -> Weight {
        0
    }
    fn set_stickied_threads_lead(_: u32, _: u32) -> Weight {
        0
    }
    fn set_stickied_threads_moderator(_: u32, _: u32) -> Weight {
        0
    }
}

#[derive(Clone)]
pub enum OriginType {
    Signed(<Runtime as frame_system::Trait>::AccountId),
}

pub fn mock_origin(origin: OriginType) -> mock::Origin {
    match origin {
        OriginType::Signed(account_id) => Origin::signed(account_id),
    }
}

pub const FORUM_LEAD_ORIGIN_ID: <Runtime as frame_system::Trait>::AccountId = 0;

pub const FORUM_LEAD_ORIGIN: OriginType = OriginType::Signed(FORUM_LEAD_ORIGIN_ID);

pub const NOT_FORUM_LEAD_ORIGIN_ID: <Runtime as frame_system::Trait>::AccountId = 111;

pub const NOT_FORUM_LEAD_ORIGIN: OriginType = OriginType::Signed(NOT_FORUM_LEAD_ORIGIN_ID);

pub const NOT_FORUM_LEAD_2_ORIGIN_ID: <Runtime as frame_system::Trait>::AccountId = 112;

pub const NOT_FORUM_LEAD_2_ORIGIN: OriginType = OriginType::Signed(NOT_FORUM_LEAD_2_ORIGIN_ID);

pub const NOT_FORUM_MODERATOR_ORIGIN_ID: <Runtime as frame_system::Trait>::AccountId = 113;

pub const NOT_FORUM_MODERATOR_ORIGIN: OriginType =
    OriginType::Signed(NOT_FORUM_MODERATOR_ORIGIN_ID);

pub const NOT_FORUM_MEMBER_ORIGIN_ID: <Runtime as frame_system::Trait>::AccountId = 114;

pub const NOT_FORUM_MEMBER_ORIGIN: OriginType = OriginType::Signed(NOT_FORUM_MEMBER_ORIGIN_ID);

pub const INVLAID_CATEGORY_ID: <Runtime as Trait>::CategoryId = 333;

pub const FORUM_MODERATOR_ORIGIN_ID: <Runtime as frame_system::Trait>::AccountId = 123;

pub const FORUM_MODERATOR_ORIGIN: OriginType = OriginType::Signed(FORUM_MODERATOR_ORIGIN_ID);

pub const FORUM_MODERATOR_2_ORIGIN_ID: <Runtime as frame_system::Trait>::AccountId = 124;

pub const FORUM_MODERATOR_2_ORIGIN: OriginType = OriginType::Signed(FORUM_MODERATOR_2_ORIGIN_ID);

const EXTRA_MODERATOR_COUNT: usize = 5;
pub const EXTRA_MODERATORS: [u64; EXTRA_MODERATOR_COUNT] = [125, 126, 127, 128, 129];

pub fn good_category_title() -> Vec<u8> {
    b"Great new category".to_vec()
}

pub fn good_category_description() -> Vec<u8> {
    b"This is a great new category for the forum".to_vec()
}

pub fn good_thread_title() -> Vec<u8> {
    b"Great new thread".to_vec()
}

pub fn good_thread_text() -> Vec<u8> {
    b"The first post in this thread".to_vec()
}

pub fn good_thread_new_title() -> Vec<u8> {
    b"Brand new thread title".to_vec()
}

pub fn good_post_text() -> Vec<u8> {
    b"A response in the thread".to_vec()
}

pub fn good_post_new_text() -> Vec<u8> {
    b"Changed post's text".to_vec()
}

pub fn good_moderation_rationale() -> Vec<u8> {
    b"Moderation rationale".to_vec()
}

pub fn good_poll_description() -> Vec<u8> {
    b"poll description".to_vec()
}

pub fn good_poll_alternative_text() -> Vec<u8> {
    b"poll alternative".to_vec()
}

pub fn generate_poll(
    expiration_diff: u64,
) -> Poll<<Runtime as pallet_timestamp::Trait>::Moment, <Runtime as frame_system::Trait>::Hash> {
    Poll {
        description_hash: Runtime::calculate_hash(good_poll_description().as_slice()),
        end_time: Timestamp::now() + expiration_diff,
        poll_alternatives: {
            let mut alternatives = vec![];
            for _ in 0..5 {
                alternatives.push(PollAlternative {
                    alternative_text_hash: Runtime::calculate_hash(
                        good_poll_alternative_text().as_slice(),
                    ),
                    vote_count: 0,
                });
            }
            alternatives
        },
    }
}

pub fn generate_poll_timestamp_cases(
    index: usize,
    expiration_diff: u64,
) -> Poll<<Runtime as pallet_timestamp::Trait>::Moment, <Runtime as frame_system::Trait>::Hash> {
    let test_cases = vec![generate_poll(expiration_diff), generate_poll(1)];
    test_cases[index].clone()
}

pub fn create_category_mock(
    origin: OriginType,
    parent: Option<<Runtime as Trait>::CategoryId>,
    title: Vec<u8>,
    description: Vec<u8>,
    result: DispatchResult,
) -> <Runtime as Trait>::CategoryId {
    let category_id = TestForumModule::next_category_id();
    assert_eq!(
        TestForumModule::create_category(
            mock_origin(origin),
            parent,
            title.clone(),
            description.clone(),
        ),
        result
    );
    if result.is_ok() {
        assert_eq!(TestForumModule::next_category_id(), category_id + 1);
        assert_eq!(
            System::events().last().unwrap().event,
            TestEvent::forum_mod(RawEvent::CategoryCreated(category_id))
        );
    }
    category_id
}

pub fn create_thread_mock(
    origin: OriginType,
    forum_user_id: ForumUserId<Runtime>,
    category_id: <Runtime as Trait>::CategoryId,
    title: Vec<u8>,
    text: Vec<u8>,
    poll_data: Option<
        Poll<<Runtime as pallet_timestamp::Trait>::Moment, <Runtime as frame_system::Trait>::Hash>,
    >,
    result: DispatchResult,
) -> <Runtime as Trait>::ThreadId {
    let thread_id = TestForumModule::next_thread_id();
    assert_eq!(
        TestForumModule::create_thread(
            mock_origin(origin.clone()),
            forum_user_id,
            category_id,
            title,
            text,
            poll_data.clone(),
        ),
        result
    );
    if result.is_ok() {
        assert_eq!(TestForumModule::next_thread_id(), thread_id + 1);
        assert_eq!(
            System::events().last().unwrap().event,
            TestEvent::forum_mod(RawEvent::ThreadCreated(thread_id))
        );
    }
    thread_id
}

pub fn edit_thread_title_mock(
    origin: OriginType,
    forum_user_id: ForumUserId<Runtime>,
    category_id: <Runtime as Trait>::CategoryId,
    thread_id: <Runtime as Trait>::PostId,
    new_title: Vec<u8>,
    result: DispatchResult,
) -> <Runtime as Trait>::PostId {
    assert_eq!(
        TestForumModule::edit_thread_title(
            mock_origin(origin),
            forum_user_id,
            category_id,
            thread_id,
            new_title.clone(),
        ),
        result
    );
    if result.is_ok() {
        assert_eq!(
            TestForumModule::thread_by_id(category_id, thread_id).title_hash,
            Runtime::calculate_hash(new_title.as_slice()),
        );
        assert_eq!(
            System::events().last().unwrap().event,
            TestEvent::forum_mod(RawEvent::ThreadTitleUpdated(thread_id,))
        );
    }
    thread_id
}

pub fn delete_thread_mock(
    origin: OriginType,
    moderator_id: ModeratorId<Runtime>,
    category_id: <Runtime as Trait>::CategoryId,
    thread_id: <Runtime as Trait>::PostId,
    result: DispatchResult,
) {
    let num_direct_threads = match <CategoryById<Runtime>>::contains_key(category_id) {
        true => <CategoryById<Runtime>>::get(category_id).num_direct_threads,
        false => 0,
    };
    assert_eq!(
        TestForumModule::delete_thread(
            mock_origin(origin.clone()),
            PrivilegedActor::Moderator(moderator_id),
            category_id,
            thread_id,
        ),
        result
    );
    if result.is_ok() {
        assert!(!<ThreadById<Runtime>>::contains_key(category_id, thread_id));
        assert_eq!(
            <CategoryById<Runtime>>::get(category_id).num_direct_threads,
            num_direct_threads - 1,
        );
        assert_eq!(
            System::events().last().unwrap().event,
            TestEvent::forum_mod(RawEvent::ThreadDeleted(thread_id))
        );
    }
}

pub fn move_thread_mock(
    origin: OriginType,
    moderator_id: ModeratorId<Runtime>,
    category_id: <Runtime as Trait>::CategoryId,
    thread_id: <Runtime as Trait>::PostId,
    new_category_id: <Runtime as Trait>::CategoryId,
    result: DispatchResult,
) {
    assert_eq!(
        TestForumModule::move_thread_to_category(
            mock_origin(origin.clone()),
            PrivilegedActor::Moderator(moderator_id),
            category_id,
            thread_id,
            new_category_id,
        ),
        result
    );
    if result.is_ok() {
        assert!(<ThreadById<Runtime>>::contains_key(
            new_category_id,
            thread_id
        ),);
        assert_eq!(
            System::events().last().unwrap().event,
            TestEvent::forum_mod(RawEvent::ThreadMoved(thread_id, new_category_id))
        );
    }
}

pub fn update_thread_archival_status_mock(
    origin: OriginType,
    actor: PrivilegedActor<Runtime>,
    category_id: <Runtime as Trait>::CategoryId,
    thread_id: <Runtime as Trait>::ThreadId,
    new_archival_status: bool,
    result: DispatchResult,
) {
    assert_eq!(
        TestForumModule::update_thread_archival_status(
            mock_origin(origin),
            actor,
            category_id,
            thread_id,
            new_archival_status
        ),
        result
    );
    if result.is_ok() {
        assert_eq!(
            System::events().last().unwrap().event,
            TestEvent::forum_mod(RawEvent::ThreadUpdated(thread_id, new_archival_status))
        );
    }
}

pub fn create_post_mock(
    origin: OriginType,
    forum_user_id: ForumUserId<Runtime>,
    category_id: <Runtime as Trait>::CategoryId,
    thread_id: <Runtime as Trait>::ThreadId,
    text: Vec<u8>,
    result: DispatchResult,
) -> <Runtime as Trait>::PostId {
    let post_id = TestForumModule::next_post_id();
    assert_eq!(
        TestForumModule::add_post(
            mock_origin(origin.clone()),
            forum_user_id,
            category_id,
            thread_id,
            text
        ),
        result
    );
    if result.is_ok() {
        assert_eq!(TestForumModule::next_post_id(), post_id + 1);
        assert_eq!(
            System::events().last().unwrap().event,
            TestEvent::forum_mod(RawEvent::PostAdded(post_id))
        );
    };
    post_id
}

pub fn edit_post_text_mock(
    origin: OriginType,
    forum_user_id: ForumUserId<Runtime>,
    category_id: <Runtime as Trait>::CategoryId,
    thread_id: <Runtime as Trait>::ThreadId,
    post_id: <Runtime as Trait>::PostId,
    new_text: Vec<u8>,
    result: DispatchResult,
) -> <Runtime as Trait>::PostId {
    assert_eq!(
        TestForumModule::edit_post_text(
            mock_origin(origin),
            forum_user_id,
            category_id,
            thread_id,
            post_id,
            new_text.clone(),
        ),
        result
    );
    if result.is_ok() {
        assert_eq!(
            TestForumModule::post_by_id(thread_id, post_id).text_hash,
            Runtime::calculate_hash(new_text.as_slice()),
        );
        assert_eq!(
            System::events().last().unwrap().event,
            TestEvent::forum_mod(RawEvent::PostTextUpdated(post_id))
        );
    }
    post_id
}

pub fn change_current_time(diff: u64) -> () {
    Timestamp::set_timestamp(Timestamp::now() + diff);
}

pub fn update_category_membership_of_moderator_mock(
    origin: OriginType,
    moderator_id: ModeratorId<Runtime>,
    category_id: <Runtime as Trait>::CategoryId,
    new_value: bool,
    result: DispatchResult,
) -> <Runtime as Trait>::CategoryId {
    assert_eq!(
        TestForumModule::update_category_membership_of_moderator(
            mock_origin(origin),
            moderator_id,
            category_id,
            new_value
        ),
        result
    );
    if result.is_ok() {
        assert_eq!(
            <CategoryByModerator<Runtime>>::contains_key(category_id, moderator_id),
            new_value
        );

        assert_eq!(
            System::events().last().unwrap().event,
            TestEvent::forum_mod(RawEvent::CategoryMembershipOfModeratorUpdated(
                moderator_id,
                category_id,
                new_value
            ))
        );
    };
    category_id
}

pub fn vote_on_poll_mock(
    origin: OriginType,
    forum_user_id: ForumUserId<Runtime>,
    category_id: <Runtime as Trait>::CategoryId,
    thread_id: <Runtime as Trait>::ThreadId,
    index: u32,
    result: DispatchResult,
) -> <Runtime as Trait>::ThreadId {
    let thread = TestForumModule::thread_by_id(category_id, thread_id);
    assert_eq!(
        TestForumModule::vote_on_poll(
            mock_origin(origin),
            forum_user_id,
            category_id,
            thread_id,
            index
        ),
        result
    );
    if result.is_ok() {
        assert_eq!(
            TestForumModule::thread_by_id(category_id, thread_id)
                .poll
                .unwrap()
                .poll_alternatives[index as usize]
                .vote_count,
            thread.poll.unwrap().poll_alternatives[index as usize].vote_count + 1
        );
        assert_eq!(
            System::events().last().unwrap().event,
            TestEvent::forum_mod(RawEvent::VoteOnPoll(thread_id, index,))
        );
    };
    thread_id
}

pub fn update_category_archival_status_mock(
    origin: OriginType,
    actor: PrivilegedActor<Runtime>,
    category_id: <Runtime as Trait>::CategoryId,
    new_archival_status: bool,
    result: DispatchResult,
) {
    assert_eq!(
        TestForumModule::update_category_archival_status(
            mock_origin(origin),
            actor,
            category_id,
            new_archival_status
        ),
        result
    );
    if result.is_ok() {
        assert_eq!(
            System::events().last().unwrap().event,
            TestEvent::forum_mod(RawEvent::CategoryUpdated(category_id, new_archival_status))
        );
    }
}

pub fn delete_category_mock(
    origin: OriginType,
    moderator_id: PrivilegedActor<Runtime>,
    category_id: <Runtime as Trait>::CategoryId,
    result: DispatchResult,
) -> () {
    assert_eq!(
        TestForumModule::delete_category(mock_origin(origin), moderator_id, category_id),
        result,
    );
    if result.is_ok() {
        assert!(!<CategoryById<Runtime>>::contains_key(category_id));
        assert_eq!(
            System::events().last().unwrap().event,
            TestEvent::forum_mod(RawEvent::CategoryDeleted(category_id))
        );
    };
}

pub fn moderate_thread_mock(
    origin: OriginType,
    moderator_id: ModeratorId<Runtime>,
    category_id: <Runtime as Trait>::CategoryId,
    thread_id: <Runtime as Trait>::ThreadId,
    rationale: Vec<u8>,
    result: DispatchResult,
) -> <Runtime as Trait>::ThreadId {
    assert_eq!(
        TestForumModule::moderate_thread(
            mock_origin(origin),
            PrivilegedActor::Moderator(moderator_id),
            category_id,
            thread_id,
            rationale.clone(),
        ),
        result
    );
    if result.is_ok() {
        assert!(!<ThreadById<Runtime>>::contains_key(category_id, thread_id));
        assert_eq!(
            System::events().last().unwrap().event,
            TestEvent::forum_mod(RawEvent::ThreadModerated(thread_id, rationale))
        );
    }
    thread_id
}

pub fn moderate_post_mock(
    origin: OriginType,
    moderator_id: ModeratorId<Runtime>,
    category_id: <Runtime as Trait>::CategoryId,
    thread_id: <Runtime as Trait>::ThreadId,
    post_id: <Runtime as Trait>::PostId,
    rationale: Vec<u8>,
    result: DispatchResult,
) -> <Runtime as Trait>::PostId {
    assert_eq!(
        TestForumModule::moderate_post(
            mock_origin(origin),
            PrivilegedActor::Moderator(moderator_id),
            category_id,
            thread_id,
            post_id,
            rationale.clone(),
        ),
        result
    );
    if result.is_ok() {
        assert!(!<PostById<Runtime>>::contains_key(thread_id, post_id));
        assert_eq!(
            System::events().last().unwrap().event,
            TestEvent::forum_mod(RawEvent::PostModerated(post_id, rationale))
        );
    }

    post_id
}

pub fn set_stickied_threads_mock(
    origin: OriginType,
    moderator_id: ModeratorId<Runtime>,
    category_id: <Runtime as Trait>::CategoryId,
    stickied_ids: Vec<<Runtime as Trait>::ThreadId>,
    result: DispatchResult,
) -> <Runtime as Trait>::CategoryId {
    assert_eq!(
        TestForumModule::set_stickied_threads(
            mock_origin(origin),
            PrivilegedActor::Moderator(moderator_id),
            category_id,
            stickied_ids.clone(),
        ),
        result
    );
    if result.is_ok() {
        assert_eq!(
            TestForumModule::category_by_id(category_id).sticky_thread_ids,
            stickied_ids.clone()
        );
        assert_eq!(
            System::events().last().unwrap().event,
            TestEvent::forum_mod(RawEvent::CategoryStickyThreadUpdate(
                category_id,
                stickied_ids.clone(),
            ))
        );
    };
    category_id
}

pub fn react_post_mock(
    origin: OriginType,
    forum_user_id: ForumUserId<Runtime>,
    category_id: <Runtime as Trait>::CategoryId,
    thread_id: <Runtime as Trait>::ThreadId,
    post_id: <Runtime as Trait>::PostId,
    post_reaction_id: <Runtime as Trait>::PostReactionId,
    result: DispatchResult,
) {
    assert_eq!(
        TestForumModule::react_post(
            mock_origin(origin.clone()),
            forum_user_id,
            category_id,
            thread_id,
            post_id,
            post_reaction_id,
        ),
        result
    );
    if result.is_ok() {
        assert_eq!(
            System::events().last().unwrap().event,
            TestEvent::forum_mod(RawEvent::PostReacted(
                forum_user_id,
                post_id,
                post_reaction_id,
            ))
        );
    };
}

pub fn default_genesis_config() -> GenesisConfig<Runtime> {
    create_genesis_config(true)
}

pub fn migration_not_done_config() -> GenesisConfig<Runtime> {
    create_genesis_config(false)
}

pub fn create_genesis_config(data_migration_done: bool) -> GenesisConfig<Runtime> {
    GenesisConfig::<Runtime> {
        category_by_id: vec![],
        next_category_id: 1,
        category_counter: 0,
        thread_by_id: vec![],
        next_thread_id: 1,
        post_by_id: vec![],
        next_post_id: 1,

        category_by_moderator: vec![],

        // data migration part
        data_migration_done: data_migration_done,
    }
}

// NB!:
// Wanted to have payload: a: &GenesisConfig<Test>
// but borrow checker made my life miserabl, so giving up for now.
pub fn build_test_externalities(config: GenesisConfig<Runtime>) -> sp_io::TestExternalities {
    let mut t = frame_system::GenesisConfig::default()
        .build_storage::<Runtime>()
        .unwrap();

    config.assimilate_storage(&mut t).unwrap();

    t.into()
}

pub fn with_test_externalities<R, F: FnOnce() -> R>(f: F) -> R {
    let default_genesis_config = default_genesis_config();
    /*
        Events are not emitted on block 0.
        So any dispatchable calls made during genesis block formation will have no events emitted.
        https://substrate.dev/recipes/2-appetizers/4-events.html
    */
    let func = || {
        run_to_block(1);
        f()
    };

    build_test_externalities(default_genesis_config).execute_with(func)
}

// Recommendation from Parity on testing on_finalize
// https://substrate.dev/docs/en/next/development/module/tests
pub fn run_to_block(n: u64) {
    while System::block_number() < n {
        <System as OnFinalize<u64>>::on_finalize(System::block_number());
        <TestForumModule as OnFinalize<u64>>::on_finalize(System::block_number());
        System::set_block_number(System::block_number() + 1);
        <System as OnInitialize<u64>>::on_initialize(System::block_number());
        <TestForumModule as OnInitialize<u64>>::on_initialize(System::block_number());
    }
}

pub type System = frame_system::Module<Runtime>;

pub type Timestamp = pallet_timestamp::Module<Runtime>;

/// Export forum module on a test runtime
pub type TestForumModule = Module<Runtime>;
