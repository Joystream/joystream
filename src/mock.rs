#![cfg(test)]

use crate::*;

use primitives::H256;

use crate::{GenesisConfig, Module, Trait};
use runtime_primitives::{
    testing::Header,
    traits::{BlakeTwo256, IdentityLookup},
    Perbill,
};
use srml_support::{impl_outer_origin, parameter_types};

impl_outer_origin! {
    pub enum Origin for Runtime {}
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
}

impl system::Trait for Runtime {
    type Origin = Origin;
    type Index = u64;
    type BlockNumber = u64;
    type Call = ();
    type Hash = H256;
    type Hashing = BlakeTwo256;
    type AccountId = u64;
    type Lookup = IdentityLookup<Self::AccountId>;
    type Header = Header;
    // type WeightMultiplierUpdate = ();
    type Event = ();
    type BlockHashCount = BlockHashCount;
    type MaximumBlockWeight = MaximumBlockWeight;
    type MaximumBlockLength = MaximumBlockLength;
    type AvailableBlockRatio = AvailableBlockRatio;
    type Version = ();
}

impl timestamp::Trait for Runtime {
    type Moment = u64;
    type OnTimestampSet = ();
    type MinimumPeriod = MinimumPeriod;
}

impl Trait for Runtime {
    type Event = ();
    // type MembershipRegistry = registry::TestMembershipRegistryModule;
}

// impl forum::Trait for Runtime {
//     type Moment = u64;
//     type Event = ();
// }

#[derive(Clone)]
pub enum OriginType {
    Signed(<Runtime as system::Trait>::AccountId),
    //Inherent, <== did not find how to make such an origin yet
    Root,
}

pub fn mock_origin(origin: OriginType) -> mock::Origin {
    match origin {
        OriginType::Signed(account_id) => Origin::signed(account_id),
        //OriginType::Inherent => Origin::inherent,
        OriginType::Root => system::RawOrigin::Root.into(), //Origin::root
    }
}

pub const NOT_FORUM_SUDO_ORIGIN: OriginType = OriginType::Signed(111);

pub const NOT_MEMBER_ORIGIN: OriginType = OriginType::Signed(222);

pub const INVLAID_CATEGORY_ID: CategoryId = 333;

pub const INVLAID_THREAD_ID: ThreadId = 444;

pub const INVLAID_POST_ID: ThreadId = 555;

pub fn generate_text(len: usize) -> Vec<u8> {
    vec![b'x'; len]
}

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

pub fn good_post_text() -> Vec<u8> {
    b"A response in the thread".to_vec()
}

pub fn good_rationale() -> Vec<u8> {
    b"This post violates our community rules".to_vec()
}

/*
 * These test fixtures can be heavily refactored to avoid repotition, needs macros, and event
 * assertions are also missing.
 */

pub struct CreateCategoryFixture {
    pub origin: OriginType,
    pub parent: Option<CategoryId>,
    pub title: Vec<u8>,
    pub description: Vec<u8>,
    pub result: dispatch::Result,
}

impl CreateCategoryFixture {
    pub fn call_and_assert(&self) {
        assert_eq!(
            TestForumModule::create_category(
                mock_origin(self.origin.clone()),
                self.parent,
                self.title.clone(),
                self.description.clone()
            ),
            self.result
        )
    }
}

pub struct UpdateCategoryFixture {
    pub origin: OriginType,
    pub category_id: CategoryId,
    pub new_archival_status: Option<bool>,
    pub new_deletion_status: Option<bool>,
    pub result: dispatch::Result,
}

impl UpdateCategoryFixture {
    pub fn call_and_assert(&self) {
        assert_eq!(
            TestForumModule::update_category(
                mock_origin(self.origin.clone()),
                self.category_id,
                self.new_archival_status.clone(),
                self.new_deletion_status.clone()
            ),
            self.result
        )
    }
}

pub struct CreateThreadFixture {
    pub origin: OriginType,
    pub category_id: CategoryId,
    pub title: Vec<u8>,
    pub text: Vec<u8>,
    pub result: dispatch::Result,
}

impl CreateThreadFixture {
    pub fn call_and_assert(&self) {
        assert_eq!(
            TestForumModule::create_thread(
                mock_origin(self.origin.clone()),
                self.category_id,
                self.title.clone(),
                self.text.clone()
            ),
            self.result
        )
    }
}

pub struct CreatePostFixture {
    pub origin: OriginType,
    pub thread_id: ThreadId,
    pub text: Vec<u8>,
    pub result: dispatch::Result,
}

impl CreatePostFixture {
    pub fn call_and_assert(&self) {
        assert_eq!(
            TestForumModule::add_post(
                mock_origin(self.origin.clone()),
                self.thread_id,
                self.text.clone()
            ),
            self.result
        )
    }
}

pub fn create_forum_member() -> OriginType {
    let member_id = 33;
    let _ = TestForumModule::create_forum_user(member_id, 
        "new forum member".as_bytes().to_vec(), 
        "new forum member self description".as_bytes().to_vec());
    OriginType::Signed(member_id)
}

pub fn create_moderator() -> OriginType {
    let moderator = 33;
    let _ = TestForumModule::create_moderator(moderator, 
        "new moderator member".as_bytes().to_vec(), 
        "new moderator member self description".as_bytes().to_vec());
    OriginType::Signed(moderator)
}

pub fn assert_create_category(
    forum_sudo: OriginType,
    parent_category_id: Option<CategoryId>,
    expected_result: dispatch::Result,
) {
    CreateCategoryFixture {
        origin: forum_sudo,
        parent: parent_category_id,
        title: good_category_title(),
        description: good_category_description(),
        result: expected_result,
    }
    .call_and_assert();
}

pub fn assert_create_thread(
    forum_sudo: OriginType,
    category_id: CategoryId,
    expected_result: dispatch::Result,
) {
    CreateThreadFixture {
        origin: forum_sudo,
        category_id,
        title: good_thread_title(),
        text: good_thread_text(),
        result: expected_result,
    }
    .call_and_assert();
}

pub fn assert_create_post(
    forum_sudo: OriginType,
    thread_id: ThreadId,
    expected_result: dispatch::Result,
) {
    CreatePostFixture {
        origin: forum_sudo,
        thread_id,
        text: good_thread_text(),
        result: expected_result,
    }
    .call_and_assert();
}

pub fn create_category(
    forum_sudo: OriginType,
    parent_category_id: Option<CategoryId>,
) -> CategoryId {
    let category_id = TestForumModule::next_category_id();
    assert_create_category(forum_sudo, parent_category_id, Ok(()));
    category_id
}

pub fn create_root_category(forum_sudo: OriginType) -> CategoryId {
    create_category(forum_sudo, None)
}

pub fn create_root_category_and_thread(
    forum_sudo: OriginType,
) -> (OriginType, CategoryId, ThreadId) {
    let member_origin = create_forum_member();
    let _moderator = create_moderator();
    let category_id = create_root_category(forum_sudo);
    let thread_id = TestForumModule::next_thread_id();

    CreateThreadFixture {
        origin: member_origin.clone(),
        category_id,
        title: good_thread_title(),
        text: good_thread_text(),
        result: Ok(()),
    }
    .call_and_assert();

    (member_origin, category_id, thread_id)
}

pub fn create_root_category_and_moderator_and_thread(
    forum_sudo: OriginType,
) -> (OriginType, CategoryId, ThreadId) {
    let _forum_user = create_forum_member();
    let member_origin = create_moderator();
    let category_id = create_root_category(forum_sudo);
    let thread_id = TestForumModule::next_thread_id();

    let _ = TestForumModule::set_moderator_category(
                Origin::signed(default_genesis_config().forum_sudo),
                category_id,
                default_genesis_config().forum_sudo,
                true
            );

    CreateThreadFixture {
        origin: member_origin.clone(),
        category_id,
        title: good_thread_title(),
        text: good_thread_text(),
        result: Ok(()),
    }
    .call_and_assert();

    (member_origin, category_id, thread_id)
}

pub fn create_root_category_and_thread_and_post(
    forum_sudo: OriginType,
) -> (OriginType, CategoryId, ThreadId, PostId) {
    let (member_origin, category_id, thread_id) = create_root_category_and_thread(forum_sudo);
    let post_id = TestForumModule::next_post_id();

    CreatePostFixture {
        origin: member_origin.clone(),
        thread_id: thread_id.clone(),
        text: good_post_text(),
        result: Ok(()),
    }
    .call_and_assert();

    (member_origin, category_id, thread_id, post_id)
}

pub fn create_root_category_and_moderator_and_thread_and_post(
    forum_sudo: OriginType,
) -> (OriginType, CategoryId, ThreadId, PostId) {
    let (member_origin, category_id, thread_id) = create_root_category_and_moderator_and_thread(forum_sudo);
    let post_id = TestForumModule::next_post_id();

    CreatePostFixture {
        origin: member_origin.clone(),
        thread_id: thread_id.clone(),
        text: good_post_text(),
        result: Ok(()),
    }
    .call_and_assert();

    (member_origin, category_id, thread_id, post_id)
}

pub fn moderate_thread(
    forum_sudo: OriginType,
    thread_id: ThreadId,
    rationale: Vec<u8>,
) -> dispatch::Result {
    TestForumModule::moderate_thread(mock_origin(forum_sudo), thread_id, rationale)
}

pub fn moderate_post(
    forum_sudo: OriginType,
    post_id: PostId,
    rationale: Vec<u8>,
) -> dispatch::Result {
    TestForumModule::moderate_post(mock_origin(forum_sudo), post_id, rationale)
}

pub fn archive_category(forum_sudo: OriginType, category_id: CategoryId) -> dispatch::Result {
    TestForumModule::update_category(mock_origin(forum_sudo), category_id, Some(true), None)
}

pub fn unarchive_category(forum_sudo: OriginType, category_id: CategoryId) -> dispatch::Result {
    TestForumModule::update_category(mock_origin(forum_sudo), category_id, Some(false), None)
}

pub fn delete_category(forum_sudo: OriginType, category_id: CategoryId) -> dispatch::Result {
    TestForumModule::update_category(mock_origin(forum_sudo), category_id, None, Some(true))
}

pub fn undelete_category(forum_sudo: OriginType, category_id: CategoryId) -> dispatch::Result {
    TestForumModule::update_category(mock_origin(forum_sudo), category_id, None, Some(false))
}

pub fn assert_not_forum_sudo_cannot_update_category(
    update_operation: fn(OriginType, CategoryId) -> dispatch::Result,
) {
    let config = default_genesis_config();
    let origin = OriginType::Signed(config.forum_sudo);

    build_test_externalities(config).execute_with(|| {
        let category_id = create_root_category(origin.clone());
        assert_eq!(
            update_operation(NOT_FORUM_SUDO_ORIGIN, category_id),
            Err(ERROR_ORIGIN_NOT_FORUM_SUDO)
        );
    });
}

// This function basically just builds a genesis storage key/value store according to
// our desired mockup.

// refactor
/// - add each config as parameter, then
///

pub fn default_genesis_config() -> GenesisConfig<Runtime> {
    GenesisConfig::<Runtime> {
        forum_user_by_id: vec![],
        forum_user_id_by_account: vec![],
        next_forum_user_id: 1,
        moderator_by_id: vec![],
        moderator_id_by_account: vec![],
        next_moderator_id: 1,
        category_by_id: vec![], // endowed_accounts.iter().cloned().map(|k|(k, 1 << 60)).collect(),
        next_category_id: 1,
        thread_by_id: vec![],
        next_thread_id: 1,
        post_by_id: vec![],
        next_post_id: 1,

        forum_sudo: 33,
        category_by_moderator: vec![],
        max_category_depth: 3,
        reaction_by_post: vec![],
        poll_desc: vec![],
        poll_by_account: vec![],
        poll_statistics: vec![],

        category_title_constraint: InputValidationLengthConstraint {
            min: 10,
            max_min_diff: 140,
        },

        category_description_constraint: InputValidationLengthConstraint {
            min: 10,
            max_min_diff: 140,
        },

        thread_title_constraint: InputValidationLengthConstraint {
            min: 3,
            max_min_diff: 43,
        },

        post_text_constraint: InputValidationLengthConstraint {
            min: 1,
            max_min_diff: 1001,
        },

        thread_moderation_rationale_constraint: InputValidationLengthConstraint {
            min: 10,
            max_min_diff: 2000,
        },

        post_moderation_rationale_constraint: InputValidationLengthConstraint {
            min: 10,
            max_min_diff: 2000,
        }, // JUST GIVING UP ON ALL THIS FOR NOW BECAUSE ITS TAKING TOO LONG

        poll_desc_constraint: InputValidationLengthConstraint {
            min: 10,
            max_min_diff: 200,
        },
        poll_items_constraint: InputValidationLengthConstraint {
            min: 1,
            max_min_diff: 20,
        },
        user_name_constraint: InputValidationLengthConstraint {
            min: 6,
            max_min_diff: 20,
        },
        user_self_introduction_constraint: InputValidationLengthConstraint {
            min: 10,
            max_min_diff: 200,
        },
    }
}

pub type RuntimeMap<K, V> = std::vec::Vec<(K, V)>;
pub type RuntimeDoubleMap<K1, K2, V> = std::vec::Vec<(K1, K2, V)>;
pub type RuntimeCategory = Category<
    <Runtime as system::Trait>::BlockNumber,
    <Runtime as timestamp::Trait>::Moment,
>;
pub type RuntimeThread = Thread<
    <Runtime as system::Trait>::BlockNumber,
    <Runtime as timestamp::Trait>::Moment,
>;
pub type RuntimePost = Post<
    <Runtime as system::Trait>::BlockNumber,
    <Runtime as timestamp::Trait>::Moment,
>;
pub type RuntimeBlockchainTimestamp = BlockchainTimestamp<
    <Runtime as system::Trait>::BlockNumber,
    <Runtime as timestamp::Trait>::Moment,
>;

pub fn genesis_config(
    forum_user_by_id: &RuntimeMap<ForumUserId, ForumUser<<Runtime as system::Trait>::AccountId>>,
    forum_user_id_by_account: &RuntimeMap<<Runtime as system::Trait>::AccountId, ForumUserId>,
    next_forum_user_id: u64,
    moderator_by_id: &RuntimeMap<ModeratorId, Moderator<<Runtime as system::Trait>::AccountId>>,
    moderator_id_by_account: &RuntimeMap<<Runtime as system::Trait>::AccountId, ModeratorId>,
    next_moderator_id: u64,
    category_by_id: &RuntimeMap<CategoryId, RuntimeCategory>,
    next_category_id: u64,
    thread_by_id: &RuntimeMap<ThreadId, RuntimeThread>,
    next_thread_id: u64,
    post_by_id: &RuntimeMap<PostId, RuntimePost>,
    next_post_id: u64,
    forum_sudo: <Runtime as system::Trait>::AccountId,
    category_by_moderator: &RuntimeDoubleMap<CategoryId, <Runtime as system::Trait>::AccountId, bool>,
    max_category_depth: u8,
    reaction_by_post: &RuntimeDoubleMap<PostId, <Runtime as system::Trait>::AccountId, PostReaction>,
    poll_desc: &RuntimeDoubleMap<PostId, u8, Vec<u8>>,
    poll_by_account: &RuntimeDoubleMap<PostId, <Runtime as system::Trait>::AccountId, PollData>,
    poll_statistics: &RuntimeDoubleMap<ThreadId, PollData, u64>,
    category_title_constraint: &InputValidationLengthConstraint,
    category_description_constraint: &InputValidationLengthConstraint,
    thread_title_constraint: &InputValidationLengthConstraint,
    post_text_constraint: &InputValidationLengthConstraint,
    thread_moderation_rationale_constraint: &InputValidationLengthConstraint,
    post_moderation_rationale_constraint: &InputValidationLengthConstraint,
    poll_desc_constraint: &InputValidationLengthConstraint,
    poll_items_constraint: &InputValidationLengthConstraint,
    user_name_constraint: &InputValidationLengthConstraint,
    user_self_introduction_constraint: &InputValidationLengthConstraint,
) -> GenesisConfig<Runtime> {
    GenesisConfig::<Runtime> {
        forum_user_by_id: forum_user_by_id.clone(),
        forum_user_id_by_account: forum_user_id_by_account.clone(),
        next_forum_user_id: next_forum_user_id,
        moderator_by_id: moderator_by_id.clone(),
        moderator_id_by_account: moderator_id_by_account.clone(),
        next_moderator_id: next_moderator_id,
        category_by_id: category_by_id.clone(),
        next_category_id: next_category_id,
        thread_by_id: thread_by_id.clone(),
        next_thread_id: next_thread_id,
        post_by_id: post_by_id.clone(),
        next_post_id: next_post_id,
        forum_sudo: forum_sudo,
        category_by_moderator: category_by_moderator.clone(),
        max_category_depth: max_category_depth,
        reaction_by_post: reaction_by_post.clone(),
        poll_desc: poll_desc.clone(),
        poll_by_account: poll_by_account.clone(),
        poll_statistics: poll_statistics.clone(),
        category_title_constraint: category_title_constraint.clone(),
        category_description_constraint: category_description_constraint.clone(),
        thread_title_constraint: thread_title_constraint.clone(),
        post_text_constraint: post_text_constraint.clone(),
        thread_moderation_rationale_constraint: thread_moderation_rationale_constraint.clone(),
        post_moderation_rationale_constraint: post_moderation_rationale_constraint.clone(),
        poll_desc_constraint: poll_desc_constraint.clone(),
        poll_items_constraint: poll_items_constraint.clone(),
        user_name_constraint: user_name_constraint.clone(),
        user_self_introduction_constraint: user_self_introduction_constraint.clone(),
    }
}

// NB!:
// Wanted to have payload: a: &GenesisConfig<Test>
// but borrow checker made my life miserabl, so giving up for now.
pub fn build_test_externalities(config: GenesisConfig<Runtime>) -> runtime_io::TestExternalities {
    let mut t = system::GenesisConfig::default()
        .build_storage::<Runtime>()
        .unwrap();

    config.assimilate_storage(&mut t).unwrap();

    t.into()
}

pub type System = system::Module<Runtime>;

/// Export forum module on a test runtime
pub type TestForumModule = Module<Runtime>;
