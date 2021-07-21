#![cfg(test)]

use crate::*;

pub use frame_support::assert_err;
use sp_core::H256;

use crate::{GenesisConfig, Module, Trait};
use frame_support::traits::{LockIdentifier, OnFinalize, OnInitialize};
use sp_std::cell::RefCell;
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
    pub const ExistentialDeposit: u64 = 10;
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
    type AccountData = balances::AccountData<u64>;
    type OnNewAccount = ();
    type OnKilledAccount = ();
    type SystemWeightInfo = ();
    type PalletInfo = ();
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

impl common::membership::MembershipTypes for Runtime {
    type MemberId = u128;
    type ActorId = u128;
}

parameter_types! {
    pub const MaxWorkerNumberLimit: u32 = 3;
    pub const LockId: [u8; 8] = [9; 8];
    pub const InviteMemberLockId: [u8; 8] = [9; 8];
    pub const StakingCandidateLockId: [u8; 8] = [10; 8];
    pub const CandidateStake: u64 = 100;
    pub const MinimumApplicationStake: u32 = 50;
    pub const LeaderOpeningStake: u32 = 20;
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
    type MinimumApplicationStake = MinimumApplicationStake;
    type LeaderOpeningStake = LeaderOpeningStake;
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

    fn leave_role(_: u32) -> u64 {
        unimplemented!()
    }
}

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

pub const WORKING_GROUP_BUDGET: u64 = 100;

thread_local! {
    pub static WG_BUDGET: RefCell<u64> = RefCell::new(WORKING_GROUP_BUDGET);
}

impl common::working_group::WorkingGroupBudgetHandler<Runtime> for () {
    fn get_budget() -> u64 {
        WG_BUDGET.with(|val| *val.borrow())
    }

    fn set_budget(new_value: u64) {
        WG_BUDGET.with(|val| {
            *val.borrow_mut() = new_value;
        });
    }
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

parameter_types! {
    pub const ReferralCutMaximumPercent: u8 = 50;
    pub const MaxCategoryDepth: u64 = 20;
    pub const PostLifeTime: u64 = 100;
    pub const MaxSubcategories: u64 = 20;
    pub const MaxModeratorsForCategory: u64 = 3;
    pub const MaxCategories: u64 = 40;
    pub const MaxPollAlternativesNumber: u64 = 20;
    pub const ThreadDeposit: u64 = 100;
    pub const PostDeposit: u64 = 10;
    pub const ForumModuleId: ModuleId = ModuleId(*b"m0:forum"); // module : forum
}

pub struct MapLimits;

impl StorageLimits for MapLimits {
    type MaxSubcategories = MaxSubcategories;
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
    type PostLifeTime = PostLifeTime;

    type MapLimits = MapLimits;
    type WorkingGroup = ();
    type MemberOriginValidator = ();
    type ThreadDeposit = ThreadDeposit;
    type PostDeposit = PostDeposit;

    type ModuleId = ForumModuleId;

    fn calculate_hash(text: &[u8]) -> Self::Hash {
        Self::Hashing::hash(text)
    }

    type WeightInfo = ();
}

impl common::membership::MemberOriginValidator<Origin, u128, u128> for () {
    fn ensure_member_controller_account_origin(
        origin: Origin,
        member_id: u128,
    ) -> Result<u128, DispatchError> {
        let account_id = ensure_signed(origin).unwrap();
        ensure!(
            Self::is_member_controller_account(&member_id, &account_id),
            DispatchError::BadOrigin
        );
        Ok(account_id)
    }

    fn is_member_controller_account(member_id: &u128, account_id: &u128) -> bool {
        let mut allowed_accounts = vec![
            FORUM_LEAD_ORIGIN_ID,
            NOT_FORUM_LEAD_ORIGIN_ID,
            NOT_FORUM_LEAD_2_ORIGIN_ID,
        ];

        // Test accounts for benchmarks.
        let max_worker_number =
            <Runtime as working_group::Trait<ForumWorkingGroupInstance>>::MaxWorkerNumberLimit::get(
            ) as u128;
        let mut benchmarks_accounts: Vec<u128> = (1..max_worker_number).collect::<Vec<_>>();
        allowed_accounts.append(&mut benchmarks_accounts);

        allowed_accounts.contains(account_id) && account_id == member_id
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

    fn get_leader_member_id() -> Option<<Runtime as common::membership::MembershipTypes>::MemberId>
    {
        unimplemented!()
    }

    fn is_leader_account_id(account_id: &<Runtime as frame_system::Trait>::AccountId) -> bool {
        *account_id != NOT_FORUM_LEAD_ORIGIN_ID && *account_id != NOT_FORUM_LEAD_2_ORIGIN_ID
    }

    fn is_worker_account_id(
        account_id: &<Runtime as frame_system::Trait>::AccountId,
        _worker_id: &<Runtime as common::membership::MembershipTypes>::ActorId,
    ) -> bool {
        *account_id != NOT_FORUM_MODERATOR_ORIGIN_ID
    }

    fn worker_exists(
        _worker_id: &<Runtime as common::membership::MembershipTypes>::ActorId,
    ) -> bool {
        unimplemented!();
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
    fn update_category_title_lead(_: u32, _: u32) -> Weight {
        0
    }
    fn update_category_title_moderator(_: u32, _: u32) -> Weight {
        0
    }
    fn update_category_description_lead(_: u32, _: u32) -> Weight {
        0
    }
    fn update_category_description_moderator(_: u32, _: u32) -> Weight {
        0
    }
    fn delete_category_lead(_: u32) -> Weight {
        0
    }
    fn delete_category_moderator(_: u32) -> Weight {
        0
    }
    fn create_thread(_: u32, _: u32, _: u32) -> Weight {
        0
    }
    fn edit_thread_title(_: u32, _: u32) -> Weight {
        0
    }
    fn delete_thread(_: u32) -> Weight {
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
    fn moderate_thread_lead(_: u32, _: u32) -> Weight {
        0
    }
    fn moderate_thread_moderator(_: u32, _: u32) -> Weight {
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
    fn delete_posts(_: u32, _: u32, _: u32) -> Weight {
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
pub const EXTRA_MODERATORS: [u128; EXTRA_MODERATOR_COUNT] = [125, 126, 127, 128, 129];

/// Get a good category title
pub fn good_category_title() -> Vec<u8> {
    b"Great new category".to_vec()
}

/// Get a new good category title
pub fn good_category_title_new() -> Vec<u8> {
    b"Great new category title".to_vec()
}

/// Get a good category description
pub fn good_category_description() -> Vec<u8> {
    b"This is a great new category for the forum".to_vec()
}

/// Get a good new category description
pub fn good_category_description_new() -> Vec<u8> {
    b"This is a great new category description for the forum".to_vec()
}

/// Get a new good thread title
pub fn good_thread_title() -> Vec<u8> {
    b"Great new thread".to_vec()
}

/// Get a new good thread text
pub fn good_thread_text() -> Vec<u8> {
    b"The first post in this thread".to_vec()
}

/// Get a new title ofr the  good  thread
pub fn good_thread_new_title() -> Vec<u8> {
    b"Brand new thread title".to_vec()
}

/// Get a good post text
pub fn good_post_text() -> Vec<u8> {
    b"A response in the thread".to_vec()
}

/// Get a good new post text
pub fn good_post_new_text() -> Vec<u8> {
    b"Changed post's text".to_vec()
}

/// Get a good moderation rationale
pub fn good_moderation_rationale() -> Vec<u8> {
    b"Moderation rationale".to_vec()
}

/// Get a good poll description
pub fn good_poll_description() -> Vec<u8> {
    b"poll description".to_vec()
}

/// Get a good poll alternative text
pub fn good_poll_alternative_text() -> Vec<u8> {
    b"poll alternative".to_vec()
}

/// Generate a valid poll input
pub fn generate_poll_input(
    expiration_diff: u64,
) -> PollInput<<Runtime as pallet_timestamp::Trait>::Moment> {
    PollInput {
        description: good_poll_description(),
        end_time: Timestamp::now() + expiration_diff,
        poll_alternatives: {
            let mut alternatives = vec![];
            for _ in 0..5 {
                alternatives.push(good_poll_alternative_text());
            }
            alternatives
        },
    }
}

/// Generate poll input for different timestamp cases
pub fn generate_poll_input_timestamp_cases(
    index: usize,
    expiration_diff: u64,
) -> PollInput<<Runtime as pallet_timestamp::Trait>::Moment> {
    let test_cases = vec![generate_poll_input(expiration_diff), generate_poll_input(1)];
    test_cases[index].clone()
}

/// Create category mock
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
            TestEvent::forum_mod(RawEvent::CategoryCreated(
                category_id,
                parent,
                title.clone(),
                description.clone()
            ))
        );
    }
    category_id
}

/// Create thread mock
pub fn create_thread_mock(
    origin: OriginType,
    account_id: <Runtime as frame_system::Trait>::AccountId,
    forum_user_id: ForumUserId<Runtime>,
    category_id: <Runtime as Trait>::CategoryId,
    title: Vec<u8>,
    text: Vec<u8>,
    poll_input_data: Option<PollInput<<Runtime as pallet_timestamp::Trait>::Moment>>,
    result: DispatchResult,
) -> <Runtime as Trait>::ThreadId {
    let thread_id = TestForumModule::next_thread_id();
    let initial_balance = balances::Module::<Runtime>::free_balance(&account_id);

    assert_eq!(
        TestForumModule::create_thread(
            mock_origin(origin.clone()),
            forum_user_id,
            category_id,
            title.clone(),
            text.clone(),
            poll_input_data.clone(),
        ),
        result
    );
    if result.is_ok() {
        assert_eq!(TestForumModule::next_thread_id(), thread_id + 1);
        assert_eq!(
            System::events().last().unwrap().event,
            TestEvent::forum_mod(RawEvent::ThreadCreated(
                category_id,
                thread_id,
                TestForumModule::next_thread_id() - 1,
                forum_user_id,
                title.clone(),
                text.clone(),
                poll_input_data.clone()
            ))
        );

        assert_eq!(
            balances::Module::<Runtime>::free_balance(&account_id),
            initial_balance
                - <Runtime as Trait>::ThreadDeposit::get()
                - <Runtime as Trait>::PostDeposit::get()
        );
    } else {
        assert_eq!(
            balances::Module::<Runtime>::free_balance(&account_id),
            initial_balance
        );
    }
    thread_id
}

/// Create edit thread title mock
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
            TestEvent::forum_mod(RawEvent::ThreadTitleUpdated(
                thread_id,
                forum_user_id,
                category_id,
                new_title.clone()
            ))
        );
    }
    thread_id
}

/// Create delete thread mock
pub fn delete_thread_mock(
    origin: OriginType,
    account_id: <Runtime as frame_system::Trait>::AccountId,
    forum_user_id: ForumUserId<Runtime>,
    category_id: <Runtime as Trait>::CategoryId,
    thread_id: <Runtime as Trait>::ThreadId,
    result: DispatchResult,
) {
    let initial_balance = balances::Module::<Runtime>::free_balance(&account_id);
    let hide = false;

    let num_direct_threads = match <CategoryById<Runtime>>::contains_key(category_id) {
        true => <CategoryById<Runtime>>::get(category_id).num_direct_threads,
        false => 0,
    };
    let thread_payment = <ThreadById<Runtime>>::get(category_id, thread_id).cleanup_pay_off;
    assert_eq!(
        TestForumModule::delete_thread(
            mock_origin(origin.clone()),
            forum_user_id,
            category_id,
            thread_id,
            hide,
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
            TestEvent::forum_mod(RawEvent::ThreadDeleted(
                thread_id,
                forum_user_id,
                category_id,
                hide,
            ))
        );

        assert_eq!(
            balances::Module::<Runtime>::free_balance(&account_id),
            initial_balance + thread_payment
        );
    } else {
        assert_eq!(
            balances::Module::<Runtime>::free_balance(&account_id),
            initial_balance
        );
    }
}

/// Create delete post mock
pub fn delete_post_mock(
    origin: OriginType,
    account_id: <Runtime as frame_system::Trait>::AccountId,
    forum_user_id: ForumUserId<Runtime>,
    category_id: <Runtime as Trait>::CategoryId,
    thread_id: <Runtime as Trait>::ThreadId,
    post_id: <Runtime as Trait>::PostId,
    result: DispatchResult,
    hide: bool,
) {
    let initial_balance = balances::Module::<Runtime>::free_balance(&account_id);
    let number_of_posts = <ThreadById<Runtime>>::get(category_id, thread_id).number_of_posts;
    let deleted_posts = vec![(category_id, thread_id, post_id, hide)];

    assert_eq!(
        TestForumModule::delete_posts(
            mock_origin(origin.clone()),
            forum_user_id,
            deleted_posts.clone(),
            vec![0u8]
        ),
        result
    );

    if result.is_ok() {
        assert!(!<PostById<Runtime>>::contains_key(thread_id, post_id));
        if <ThreadById<Runtime>>::contains_key(category_id, thread_id) {
            assert_eq!(
                <ThreadById<Runtime>>::get(category_id, thread_id).number_of_posts,
                number_of_posts - 1,
            );
        }
        assert_eq!(
            System::events().last().unwrap().event,
            TestEvent::forum_mod(RawEvent::PostDeleted(
                vec![0u8],
                forum_user_id,
                deleted_posts.clone()
            ))
        );

        assert_eq!(
            balances::Module::<Runtime>::free_balance(&account_id),
            initial_balance + <Runtime as Trait>::PostDeposit::get()
        );
    } else {
        assert_eq!(
            balances::Module::<Runtime>::free_balance(&account_id),
            initial_balance
        );
    }
}

/// Create move thread mock
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
            TestEvent::forum_mod(RawEvent::ThreadMoved(
                thread_id,
                new_category_id,
                PrivilegedActor::Moderator(moderator_id),
                category_id
            ))
        );
    }
}

/// Made a create post mock
pub fn create_post_mock(
    origin: OriginType,
    account_id: <Runtime as frame_system::Trait>::AccountId,
    forum_user_id: ForumUserId<Runtime>,
    category_id: <Runtime as Trait>::CategoryId,
    thread_id: <Runtime as Trait>::ThreadId,
    text: Vec<u8>,
    editable: bool,
    result: DispatchResult,
) -> <Runtime as Trait>::PostId {
    let post_id = TestForumModule::next_post_id();
    let initial_balance = balances::Module::<Runtime>::free_balance(account_id);
    assert_eq!(
        TestForumModule::add_post(
            mock_origin(origin.clone()),
            forum_user_id,
            category_id,
            thread_id,
            text.clone(),
            editable
        ),
        result
    );

    if result.is_ok() {
        assert_eq!(TestForumModule::next_post_id(), post_id + 1);
        assert_eq!(
            System::events().last().unwrap().event,
            TestEvent::forum_mod(RawEvent::PostAdded(
                post_id,
                forum_user_id,
                category_id,
                thread_id,
                text,
                editable
            ))
        );

        if editable {
            assert_eq!(
                balances::Module::<Runtime>::free_balance(&account_id),
                initial_balance - <Runtime as Trait>::PostDeposit::get()
            );

            assert!(<PostById<Runtime>>::contains_key(thread_id, post_id));
        } else {
            assert_eq!(
                balances::Module::<Runtime>::free_balance(&account_id),
                initial_balance
            );

            assert!(!<PostById<Runtime>>::contains_key(thread_id, post_id));
        }
    } else {
        assert_eq!(
            balances::Module::<Runtime>::free_balance(&account_id),
            initial_balance
        );
    };
    post_id
}

/// Create edit post text mock
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
        let post = TestForumModule::post_by_id(thread_id, post_id);
        assert_eq!(post.text_hash, Runtime::calculate_hash(new_text.as_slice()),);
        assert_eq!(
            System::events().last().unwrap().event,
            TestEvent::forum_mod(RawEvent::PostTextUpdated(
                post_id,
                forum_user_id,
                category_id,
                thread_id,
                new_text
            ))
        );
    }
    post_id
}

/// Change current timestamp
pub fn change_current_time(diff: u64) -> () {
    Timestamp::set_timestamp(Timestamp::now() + diff);
}

/// Create update category membership of moderator mock
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

/// Create vote on poll mock
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
            TestEvent::forum_mod(RawEvent::VoteOnPoll(
                thread_id,
                index,
                forum_user_id,
                category_id
            ))
        );
        assert!(TestForumModule::poll_votes_by_thread_id_by_forum_user_id(
            &thread_id,
            &forum_user_id
        ));
    };
    thread_id
}

/// Create update category archival status mock
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
            actor.clone(),
            category_id,
            new_archival_status
        ),
        result
    );
    if result.is_ok() {
        assert_eq!(
            System::events().last().unwrap().event,
            TestEvent::forum_mod(RawEvent::CategoryArchivalStatusUpdated(
                category_id,
                new_archival_status,
                actor
            ))
        );
    }
}

/// Create update category title mock
pub fn update_category_title_mock(
    origin: OriginType,
    actor: PrivilegedActor<Runtime>,
    category_id: <Runtime as Trait>::CategoryId,
    new_title: Vec<u8>,
    result: DispatchResult,
) {
    let new_title_hash = Runtime::calculate_hash(new_title.as_slice());
    assert_eq!(
        TestForumModule::update_category_title(
            mock_origin(origin),
            actor.clone(),
            category_id,
            new_title
        ),
        result
    );
    if result.is_ok() {
        assert_eq!(
            System::events().last().unwrap().event,
            TestEvent::forum_mod(RawEvent::CategoryTitleUpdated(
                category_id,
                new_title_hash,
                actor
            ))
        );
    }
}

/// Create update category description mock
pub fn update_category_description_mock(
    origin: OriginType,
    actor: PrivilegedActor<Runtime>,
    category_id: <Runtime as Trait>::CategoryId,
    new_description: Vec<u8>,
    result: DispatchResult,
) {
    let new_description_hash = Runtime::calculate_hash(new_description.as_slice());
    assert_eq!(
        TestForumModule::update_category_description(
            mock_origin(origin),
            actor.clone(),
            category_id,
            new_description
        ),
        result
    );
    if result.is_ok() {
        assert_eq!(
            System::events().last().unwrap().event,
            TestEvent::forum_mod(RawEvent::CategoryDescriptionUpdated(
                category_id,
                new_description_hash,
                actor
            ))
        );
    }
}

/// Create delete category mock
pub fn delete_category_mock(
    origin: OriginType,
    moderator_id: PrivilegedActor<Runtime>,
    category_id: <Runtime as Trait>::CategoryId,
    result: DispatchResult,
) {
    assert_eq!(
        TestForumModule::delete_category(mock_origin(origin), moderator_id.clone(), category_id),
        result,
    );
    if result.is_ok() {
        assert!(!<CategoryById<Runtime>>::contains_key(category_id));
        assert_eq!(
            System::events().last().unwrap().event,
            TestEvent::forum_mod(RawEvent::CategoryDeleted(category_id, moderator_id))
        );
    }
}

/// Create moderate thread mock
pub fn moderate_thread_mock(
    origin: OriginType,
    moderator_id: ModeratorId<Runtime>,
    category_id: <Runtime as Trait>::CategoryId,
    thread_id: <Runtime as Trait>::ThreadId,
    rationale: Vec<u8>,
    result: DispatchResult,
) -> <Runtime as Trait>::ThreadId {
    let thread_account_id = <Runtime as Trait>::ModuleId::get().into_sub_account(thread_id);
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
            TestEvent::forum_mod(RawEvent::ThreadModerated(
                thread_id,
                rationale,
                PrivilegedActor::Moderator(moderator_id),
                category_id
            ))
        );

        // If we moderate a thread with no extra post, only the initial post deposit
        // should remain
        assert_eq!(
            balances::Module::<Runtime>::free_balance(&thread_account_id),
            <Runtime as Trait>::PostDeposit::get()
        );
    }
    thread_id
}

/// Create moderate post mock
pub fn moderate_post_mock(
    origin: OriginType,
    moderator_id: ModeratorId<Runtime>,
    category_id: <Runtime as Trait>::CategoryId,
    thread_id: <Runtime as Trait>::ThreadId,
    post_id: <Runtime as Trait>::PostId,
    rationale: Vec<u8>,
    result: DispatchResult,
) -> <Runtime as Trait>::PostId {
    let initial_balance = balances::Module::<Runtime>::free_balance(moderator_id);
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
            TestEvent::forum_mod(RawEvent::PostModerated(
                post_id,
                rationale,
                PrivilegedActor::Moderator(moderator_id),
                category_id,
                thread_id
            ))
        );

        assert_eq!(
            balances::Module::<Runtime>::free_balance(&moderator_id),
            initial_balance
        );
    } else {
        assert_eq!(
            balances::Module::<Runtime>::free_balance(&moderator_id),
            initial_balance
        );
    };

    post_id
}

/// Create set stickied threads mock
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
                PrivilegedActor::Moderator(moderator_id)
            ))
        );
    };
    category_id
}

/// Create react post mock
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
                category_id,
                thread_id
            ))
        );
    };
}

/// Create default genesis config
pub fn default_genesis_config() -> GenesisConfig<Runtime> {
    create_genesis_config(true)
}

/// Create config without data migration
pub fn migration_not_done_config() -> GenesisConfig<Runtime> {
    create_genesis_config(false)
}

/// Create genesis config
pub fn create_genesis_config(data_migration_done: bool) -> GenesisConfig<Runtime> {
    GenesisConfig::<Runtime> {
        category_by_id: vec![],
        next_category_id: 1,
        category_counter: 0,
        thread_by_id: vec![],
        post_by_id: vec![],
        next_thread_id: 1,
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

/// Generate enviroment with test externalities
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

/// System module on a test runtime
pub type System = frame_system::Module<Runtime>;

/// Timestamp module on a test runtime
pub type Timestamp = pallet_timestamp::Module<Runtime>;

/// Export forum module on a test runtime
pub type TestForumModule = Module<Runtime>;
