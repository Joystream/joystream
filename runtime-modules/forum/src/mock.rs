#![cfg(test)]

use crate as forum;
use crate::*;

pub use frame_support::assert_err;
use sp_core::H256;

use crate::Config;
use frame_support::traits::{
    ConstU16, ConstU32, ConstU64, LockIdentifier, OnFinalize, OnInitialize,
};
use sp_std::cell::RefCell;
use staking_handler::LockComparator;

use frame_support::parameter_types;
use sp_runtime::{
    testing::Header,
    traits::{BlakeTwo256, Hash, IdentityLookup},
    DispatchError,
};
use sp_std::convert::{TryFrom, TryInto};

parameter_types! {
    pub const BlockHashCount: u64 = 250;
    pub const MinimumPeriod: u64 = 5;
    pub const ExistentialDeposit: u64 = 10;
    pub const DefaultMembershipPrice: u64 = 100;
    pub const DefaultInitialInvitationBalance: u64 = 100;
}

type UncheckedExtrinsic = frame_system::mocking::MockUncheckedExtrinsic<Runtime>;
type Block = frame_system::mocking::MockBlock<Runtime>;

frame_support::construct_runtime!(
    pub enum Runtime where
        Block = Block,
        NodeBlock = Block,
        UncheckedExtrinsic = UncheckedExtrinsic,
    {
        System: frame_system,
        Membership: membership::{Pallet, Call, Storage, Event<T>},
        Balances: balances,
        Timestamp: pallet_timestamp,
        TestForumModule: forum::{Pallet, Call, Storage, Event<T>, Config<T>},
        ForumWorkingGroup: working_group::<Instance1>::{Pallet, Call, Storage, Event<T>},
    }
);

impl frame_system::Config for Runtime {
    type BaseCallFilter = frame_support::traits::Everything;
    type BlockWeights = ();
    type BlockLength = ();
    type DbWeight = ();
    type Origin = Origin;
    type Call = Call;
    type Index = u64;
    type BlockNumber = u64;
    type Hash = H256;
    type Hashing = BlakeTwo256;
    type AccountId = u128;
    type Lookup = IdentityLookup<Self::AccountId>;
    type Header = Header;
    type Event = Event;
    type BlockHashCount = ConstU64<250>;
    type Version = ();
    type PalletInfo = PalletInfo;
    type AccountData = balances::AccountData<u64>;
    type OnNewAccount = ();
    type OnKilledAccount = ();
    type SystemWeightInfo = ();
    type SS58Prefix = ConstU16<42>;
    type OnSetCode = ();
    type MaxConsumers = frame_support::traits::ConstU32<16>;
}

impl pallet_timestamp::Config for Runtime {
    type Moment = u64;
    type OnTimestampSet = ();
    type MinimumPeriod = MinimumPeriod;
    type WeightInfo = ();
}

impl balances::Config for Runtime {
    type Balance = u64;
    type DustRemoval = ();
    type Event = Event;
    type ExistentialDeposit = ExistentialDeposit;
    type AccountStore = System;
    type MaxLocks = ();
    type MaxReserves = ConstU32<2>;
    type ReserveIdentifier = [u8; 8];
    type WeightInfo = ();
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

impl working_group::Config<ForumWorkingGroupInstance> for Runtime {
    type Event = Event;
    type MaxWorkerNumberLimit = MaxWorkerNumberLimit;
    type StakingAccountValidator = membership::Module<Runtime>;
    type StakingHandler = staking_handler::StakingManager<Self, LockId>;
    type MemberOriginValidator = ();
    type MinUnstakingPeriodLimit = ();
    type RewardPeriod = ();
    type WeightInfo = ();
    type MinimumApplicationStake = MinimumApplicationStake;
    type LeaderOpeningStake = LeaderOpeningStake;
}

impl LockComparator<<Runtime as balances::Config>::Balance> for Runtime {
    fn are_locks_conflicting(
        _new_lock: &LockIdentifier,
        _existing_locks: &[LockIdentifier],
    ) -> bool {
        false
    }
}

pub const WORKING_GROUP_BUDGET: u64 = 100;

thread_local! {
    pub static WG_BUDGET: RefCell<u64> = RefCell::new(WORKING_GROUP_BUDGET);
}

pub struct Wg;
impl common::working_group::WorkingGroupBudgetHandler<u128, u64> for Wg {
    fn try_withdraw(_account_id: &u128, _amount: u64) -> DispatchResult {
        unimplemented!()
    }

    fn get_budget() -> u64 {
        WG_BUDGET.with(|val| *val.borrow())
    }

    fn set_budget(new_value: u64) {
        WG_BUDGET.with(|val| {
            *val.borrow_mut() = new_value;
        });
    }
}

impl membership::Config for Runtime {
    type Event = Event;
    type DefaultMembershipPrice = DefaultMembershipPrice;
    type DefaultInitialInvitationBalance = DefaultInitialInvitationBalance;
    type WorkingGroup = Wg;
    type WeightInfo = ();
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
    pub const ThreadDeposit: u64 = 100;
    pub const PostDeposit: u64 = 10;
    pub const ForumModuleId: PalletId = PalletId(*b"m0:forum"); // module : forum
}

pub struct MapLimits;

impl StorageLimits for MapLimits {
    type MaxSubcategories = MaxSubcategories;
    type MaxModeratorsForCategory = MaxModeratorsForCategory;
    type MaxCategories = MaxCategories;
}

impl Config for Runtime {
    type Event = Event;
    type CategoryId = u64;
    type ThreadId = u64;
    type PostId = u64;
    type PostReactionId = u64;
    type MaxCategoryDepth = MaxCategoryDepth;
    type PostLifeTime = PostLifeTime;

    type MapLimits = MapLimits;
    type WorkingGroup = Wg;
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
            <Runtime as working_group::Config<ForumWorkingGroupInstance>>::MaxWorkerNumberLimit::get(
            ) as u128;
        let mut benchmarks_accounts: Vec<u128> = (1..max_worker_number).collect::<Vec<_>>();
        allowed_accounts.append(&mut benchmarks_accounts);

        allowed_accounts.contains(account_id) && account_id == member_id
    }
}

impl common::working_group::WorkingGroupAuthenticator<Runtime> for Wg {
    fn ensure_worker_origin(
        _origin: <Runtime as frame_system::Config>::Origin,
        _worker_id: &<Runtime as common::membership::MembershipTypes>::ActorId,
    ) -> DispatchResult {
        unimplemented!()
    }

    fn ensure_leader_origin(_origin: <Runtime as frame_system::Config>::Origin) -> DispatchResult {
        unimplemented!()
    }

    fn get_leader_member_id() -> Option<<Runtime as common::membership::MembershipTypes>::MemberId>
    {
        unimplemented!()
    }

    fn get_worker_member_id(
        _: &<Runtime as common::membership::MembershipTypes>::ActorId,
    ) -> Option<<Runtime as common::membership::MembershipTypes>::MemberId> {
        unimplemented!()
    }

    fn is_leader_account_id(account_id: &<Runtime as frame_system::Config>::AccountId) -> bool {
        *account_id == FORUM_LEAD_ORIGIN_ID
    }

    fn is_worker_account_id(
        account_id: &<Runtime as frame_system::Config>::AccountId,
        worker_id: &<Runtime as common::membership::MembershipTypes>::ActorId,
    ) -> bool {
        Self::worker_exists(worker_id) && *account_id == *worker_id
    }

    fn worker_exists(
        worker_id: &<Runtime as common::membership::MembershipTypes>::ActorId,
    ) -> bool {
        [
            FORUM_LEAD_ORIGIN_ID,
            FORUM_MODERATOR_ORIGIN_ID,
            FORUM_MODERATOR_2_ORIGIN_ID,
        ]
        .iter()
        .chain(EXTRA_MODERATORS.iter())
        .any(|id| *id == *worker_id)
    }

    fn ensure_worker_exists(
        worker_id: &<Runtime as common::membership::MembershipTypes>::ActorId,
    ) -> DispatchResult {
        ensure!(
            Self::worker_exists(worker_id),
            DispatchError::Other("Worker doesnt exist")
        );
        Ok(())
    }
}

#[derive(Clone)]
pub enum OriginType {
    Signed(<Runtime as frame_system::Config>::AccountId),
}

pub fn mock_origin(origin: OriginType) -> mock::Origin {
    match origin {
        OriginType::Signed(account_id) => Origin::signed(account_id),
    }
}

pub const FORUM_LEAD_ORIGIN_ID: <Runtime as frame_system::Config>::AccountId = 0;

pub const FORUM_LEAD_ORIGIN: OriginType = OriginType::Signed(FORUM_LEAD_ORIGIN_ID);

pub const NOT_FORUM_LEAD_ORIGIN_ID: <Runtime as frame_system::Config>::AccountId = 111;

pub const NOT_FORUM_LEAD_ORIGIN: OriginType = OriginType::Signed(NOT_FORUM_LEAD_ORIGIN_ID);

pub const NOT_FORUM_LEAD_2_ORIGIN_ID: <Runtime as frame_system::Config>::AccountId = 112;

pub const NOT_FORUM_LEAD_2_ORIGIN: OriginType = OriginType::Signed(NOT_FORUM_LEAD_2_ORIGIN_ID);

pub const NOT_FORUM_MODERATOR_ORIGIN_ID: <Runtime as frame_system::Config>::AccountId = 113;

pub const NOT_FORUM_MODERATOR_ORIGIN: OriginType =
    OriginType::Signed(NOT_FORUM_MODERATOR_ORIGIN_ID);

pub const NOT_FORUM_MEMBER_ORIGIN_ID: <Runtime as frame_system::Config>::AccountId = 114;

pub const NOT_FORUM_MEMBER_ORIGIN: OriginType = OriginType::Signed(NOT_FORUM_MEMBER_ORIGIN_ID);

pub const INVLAID_CATEGORY_ID: <Runtime as Config>::CategoryId = 333;

pub const FORUM_MODERATOR_ORIGIN_ID: <Runtime as frame_system::Config>::AccountId = 123;

pub const FORUM_MODERATOR_ORIGIN: OriginType = OriginType::Signed(FORUM_MODERATOR_ORIGIN_ID);

pub const FORUM_MODERATOR_2_ORIGIN_ID: <Runtime as frame_system::Config>::AccountId = 124;

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

/// Get a new good thread metadata
pub fn good_thread_metadata() -> Vec<u8> {
    b"Great new thread".to_vec()
}

/// Get a new good thread text
pub fn good_thread_text() -> Vec<u8> {
    b"The first post in this thread".to_vec()
}

/// Get a new metadata for the good thread
pub fn good_thread_new_metadata() -> Vec<u8> {
    b"Brand new thread metadata".to_vec()
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

/// Create category mock
pub fn create_category_mock(
    origin: OriginType,
    parent: Option<<Runtime as Config>::CategoryId>,
    title: Vec<u8>,
    description: Vec<u8>,
    result: DispatchResult,
) -> <Runtime as Config>::CategoryId {
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
            Event::TestForumModule(RawEvent::CategoryCreated(
                category_id,
                parent,
                title,
                description
            ))
        );
    }
    category_id
}

/// Create thread mock
pub fn create_thread_mock(
    origin: OriginType,
    account_id: <Runtime as frame_system::Config>::AccountId,
    forum_user_id: ForumUserId<Runtime>,
    category_id: <Runtime as Config>::CategoryId,
    title: Vec<u8>,
    text: Vec<u8>,
    result: DispatchResult,
) -> <Runtime as Config>::ThreadId {
    let thread_id = TestForumModule::next_thread_id();
    let initial_balance = balances::Pallet::<Runtime>::free_balance(&account_id);

    assert_eq!(
        TestForumModule::create_thread(
            mock_origin(origin),
            forum_user_id,
            category_id,
            title.clone(),
            text.clone(),
        ),
        result
    );
    if result.is_ok() {
        assert_eq!(TestForumModule::next_thread_id(), thread_id + 1);
        assert_eq!(
            System::events().last().unwrap().event,
            Event::TestForumModule(RawEvent::ThreadCreated(
                category_id,
                thread_id,
                TestForumModule::next_thread_id() - 1,
                forum_user_id,
                title,
                text,
            ))
        );

        assert_eq!(
            balances::Pallet::<Runtime>::free_balance(&account_id),
            initial_balance
                - <Runtime as Config>::ThreadDeposit::get()
                - <Runtime as Config>::PostDeposit::get()
        );
    } else {
        assert_eq!(
            balances::Pallet::<Runtime>::free_balance(&account_id),
            initial_balance
        );
    }
    thread_id
}

/// Create edit thread metadata mock
pub fn edit_thread_metadata_mock(
    origin: OriginType,
    forum_user_id: ForumUserId<Runtime>,
    category_id: <Runtime as Config>::CategoryId,
    thread_id: <Runtime as Config>::PostId,
    new_metadata: Vec<u8>,
    result: DispatchResult,
) -> <Runtime as Config>::PostId {
    assert_eq!(
        TestForumModule::edit_thread_metadata(
            mock_origin(origin),
            forum_user_id,
            category_id,
            thread_id,
            new_metadata.clone(),
        ),
        result
    );
    if result.is_ok() {
        assert_eq!(
            System::events().last().unwrap().event,
            Event::TestForumModule(RawEvent::ThreadMetadataUpdated(
                thread_id,
                forum_user_id,
                category_id,
                new_metadata
            ))
        );
    }
    thread_id
}

/// Create delete thread mock
pub fn delete_thread_mock(
    origin: OriginType,
    account_id: <Runtime as frame_system::Config>::AccountId,
    forum_user_id: ForumUserId<Runtime>,
    category_id: <Runtime as Config>::CategoryId,
    thread_id: <Runtime as Config>::ThreadId,
    result: DispatchResult,
) {
    let initial_balance = balances::Pallet::<Runtime>::free_balance(&account_id);
    let hide = false;

    let num_direct_threads = match <CategoryById<Runtime>>::contains_key(category_id) {
        true => <CategoryById<Runtime>>::get(category_id).num_direct_threads,
        false => 0,
    };
    let thread_payment = <ThreadById<Runtime>>::get(category_id, thread_id).cleanup_pay_off;
    assert_eq!(
        TestForumModule::delete_thread(
            mock_origin(origin),
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
            Event::TestForumModule(RawEvent::ThreadDeleted(
                thread_id,
                forum_user_id,
                category_id,
                hide,
            ))
        );

        assert_eq!(
            balances::Pallet::<Runtime>::free_balance(&account_id),
            initial_balance + thread_payment
        );
    } else {
        assert_eq!(
            balances::Pallet::<Runtime>::free_balance(&account_id),
            initial_balance
        );
    }
}

/// Create delete post mock
pub fn delete_post_mock(
    origin: OriginType,
    account_id: <Runtime as frame_system::Config>::AccountId,
    forum_user_id: ForumUserId<Runtime>,
    category_id: <Runtime as Config>::CategoryId,
    thread_id: <Runtime as Config>::ThreadId,
    post_id: <Runtime as Config>::PostId,
    result: DispatchResult,
    hide: bool,
) {
    let initial_balance = balances::Pallet::<Runtime>::free_balance(&account_id);
    let number_of_posts = <ThreadById<Runtime>>::get(category_id, thread_id).number_of_posts;
    let mut deleted_posts = BTreeMap::new();
    let extended_post_id = ExtendedPostIdObject {
        category_id,
        thread_id,
        post_id,
    };

    deleted_posts.insert(extended_post_id, hide);

    assert_eq!(
        TestForumModule::delete_posts(
            mock_origin(origin),
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
            Event::TestForumModule(RawEvent::PostDeleted(
                vec![0u8],
                forum_user_id,
                deleted_posts.clone()
            ))
        );

        assert_eq!(
            balances::Pallet::<Runtime>::free_balance(&account_id),
            initial_balance + <Runtime as Config>::PostDeposit::get()
        );
    } else {
        assert_eq!(
            balances::Pallet::<Runtime>::free_balance(&account_id),
            initial_balance
        );
    }
}

/// Create move thread mock
pub fn move_thread_mock(
    origin: OriginType,
    moderator_id: ModeratorId<Runtime>,
    category_id: <Runtime as Config>::CategoryId,
    thread_id: <Runtime as Config>::PostId,
    new_category_id: <Runtime as Config>::CategoryId,
    result: DispatchResult,
) {
    assert_eq!(
        TestForumModule::move_thread_to_category(
            mock_origin(origin),
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
            Event::TestForumModule(RawEvent::ThreadMoved(
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
    account_id: <Runtime as frame_system::Config>::AccountId,
    forum_user_id: ForumUserId<Runtime>,
    category_id: <Runtime as Config>::CategoryId,
    thread_id: <Runtime as Config>::ThreadId,
    text: Vec<u8>,
    editable: bool,
    result: DispatchResult,
) -> <Runtime as Config>::PostId {
    let post_id = TestForumModule::next_post_id();
    let initial_balance = balances::Pallet::<Runtime>::free_balance(account_id);
    assert_eq!(
        TestForumModule::add_post(
            mock_origin(origin),
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
            Event::TestForumModule(RawEvent::PostAdded(
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
                balances::Pallet::<Runtime>::free_balance(&account_id),
                initial_balance - <Runtime as Config>::PostDeposit::get()
            );

            assert!(<PostById<Runtime>>::contains_key(thread_id, post_id));
        } else {
            assert_eq!(
                balances::Pallet::<Runtime>::free_balance(&account_id),
                initial_balance
            );

            assert!(!<PostById<Runtime>>::contains_key(thread_id, post_id));
        }
    } else {
        assert_eq!(
            balances::Pallet::<Runtime>::free_balance(&account_id),
            initial_balance
        );
    };
    post_id
}

/// Create edit post text mock
pub fn edit_post_text_mock(
    origin: OriginType,
    forum_user_id: ForumUserId<Runtime>,
    category_id: <Runtime as Config>::CategoryId,
    thread_id: <Runtime as Config>::ThreadId,
    post_id: <Runtime as Config>::PostId,
    new_text: Vec<u8>,
    result: DispatchResult,
) -> <Runtime as Config>::PostId {
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
            Event::TestForumModule(RawEvent::PostTextUpdated(
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

/// Create update category membership of moderator mock
pub fn update_category_membership_of_moderator_mock(
    origin: OriginType,
    moderator_id: ModeratorId<Runtime>,
    category_id: <Runtime as Config>::CategoryId,
    new_value: bool,
    result: DispatchResult,
) -> <Runtime as Config>::CategoryId {
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
            Event::TestForumModule(RawEvent::CategoryMembershipOfModeratorUpdated(
                moderator_id,
                category_id,
                new_value
            ))
        );
    };
    category_id
}

/// Create update category archival status mock
pub fn update_category_archival_status_mock(
    origin: OriginType,
    actor: PrivilegedActor<Runtime>,
    category_id: <Runtime as Config>::CategoryId,
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
            Event::TestForumModule(RawEvent::CategoryArchivalStatusUpdated(
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
    category_id: <Runtime as Config>::CategoryId,
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
            Event::TestForumModule(RawEvent::CategoryTitleUpdated(
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
    category_id: <Runtime as Config>::CategoryId,
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
            Event::TestForumModule(RawEvent::CategoryDescriptionUpdated(
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
    category_id: <Runtime as Config>::CategoryId,
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
            Event::TestForumModule(RawEvent::CategoryDeleted(category_id, moderator_id))
        );
    }
}

/// Create moderate thread mock
pub fn moderate_thread_mock(
    origin: OriginType,
    moderator_id: ModeratorId<Runtime>,
    category_id: <Runtime as Config>::CategoryId,
    thread_id: <Runtime as Config>::ThreadId,
    rationale: Vec<u8>,
    result: DispatchResult,
) -> <Runtime as Config>::ThreadId {
    let thread_account_id =
        <Runtime as Config>::ModuleId::get().into_sub_account_truncating(thread_id);
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
            Event::TestForumModule(RawEvent::ThreadModerated(
                thread_id,
                rationale,
                PrivilegedActor::Moderator(moderator_id),
                category_id
            ))
        );

        assert_eq!(
            balances::Pallet::<Runtime>::free_balance(&thread_account_id),
            0
        );
    }
    thread_id
}

/// Create moderate post mock
pub fn moderate_post_mock(
    origin: OriginType,
    moderator_id: ModeratorId<Runtime>,
    category_id: <Runtime as Config>::CategoryId,
    thread_id: <Runtime as Config>::ThreadId,
    post_id: <Runtime as Config>::PostId,
    rationale: Vec<u8>,
    result: DispatchResult,
) -> <Runtime as Config>::PostId {
    let initial_balance = balances::Pallet::<Runtime>::free_balance(moderator_id);
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
            Event::TestForumModule(RawEvent::PostModerated(
                post_id,
                rationale,
                PrivilegedActor::Moderator(moderator_id),
                category_id,
                thread_id
            ))
        );

        assert_eq!(
            balances::Pallet::<Runtime>::free_balance(&moderator_id),
            initial_balance
        );
    } else {
        assert_eq!(
            balances::Pallet::<Runtime>::free_balance(&moderator_id),
            initial_balance
        );
    };

    post_id
}

/// Create set stickied threads mock
pub fn set_stickied_threads_mock(
    origin: OriginType,
    moderator_id: ModeratorId<Runtime>,
    category_id: <Runtime as Config>::CategoryId,
    stickied_ids: Vec<<Runtime as Config>::ThreadId>,
    result: DispatchResult,
) -> <Runtime as Config>::CategoryId {
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
            stickied_ids
        );
        assert_eq!(
            System::events().last().unwrap().event,
            Event::TestForumModule(RawEvent::CategoryStickyThreadUpdate(
                category_id,
                stickied_ids,
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
    category_id: <Runtime as Config>::CategoryId,
    thread_id: <Runtime as Config>::ThreadId,
    post_id: <Runtime as Config>::PostId,
    post_reaction_id: <Runtime as Config>::PostReactionId,
    result: DispatchResult,
) {
    assert_eq!(
        TestForumModule::react_post(
            mock_origin(origin),
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
            Event::TestForumModule(RawEvent::PostReacted(
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
pub fn default_genesis_config() -> forum::GenesisConfig<Runtime> {
    forum::GenesisConfig::<Runtime> {
        next_category_id: 1,
        category_counter: 0,
        next_thread_id: 1,
        next_post_id: 1,
    }
}

pub fn build_test_externalities() -> sp_io::TestExternalities {
    let mut t = frame_system::GenesisConfig::default()
        .build_storage::<Runtime>()
        .unwrap();

    default_genesis_config().assimilate_storage(&mut t).unwrap();

    t.into()
}

/// Generate enviroment with test externalities
pub fn with_test_externalities<R, F: FnOnce() -> R>(f: F) -> R {
    /*
        Events are not emitted on block 0.
        So any dispatchable calls made during genesis block formation will have no events emitted.
        https://substrate.dev/recipes/2-appetizers/4-events.html
    */
    let func = || {
        run_to_block(1);
        f()
    };

    build_test_externalities().execute_with(func)
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
