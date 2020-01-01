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
}

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

pub fn require_root_origin() -> &'static str {
    "RequireRootOrigin"
}

pub fn generate_text(len: usize) -> Vec<u8> {
    vec![b'x'; len]
}

pub fn good_user_name() -> Vec<u8> {
    b"good name".to_vec()
}

pub fn good_self_introduction() -> Vec<u8> {
    b"good description".to_vec()
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

pub fn good_poll_items() -> Vec<Vec<u8>> {
    vec![
        b"poll item A".to_vec(),
        b"poll item B".to_vec(),
        b"poll item C".to_vec(),
        b"poll item D".to_vec(),
    ]
}

pub fn good_poll_text() -> Vec<u8> {
    b"It is a poll for you to choose A B C D".to_vec()
}

pub fn get_poll_meta() -> Option<(
    Vec<Vec<u8>>,
    Vec<u8>,
    <Runtime as timestamp::Trait>::Moment,
    <Runtime as timestamp::Trait>::Moment,
    u8,
    u8,
)> {
    // four items and poll last for 10 seconds for testing purpose.
    Some((
        good_poll_items(),
        good_poll_text(),
        Timestamp::now(),
        Timestamp::now() + 10,
        1,
        4,
    ))
}

pub fn good_labels() -> Vec<Vec<u8>> {
    vec![
        b"label item A".to_vec(),
        b"label item B".to_vec(),
        b"label item C".to_vec(),
        b"label item D".to_vec(),
        b"label item E".to_vec(),
        b"label item F".to_vec(),
        b"label item G".to_vec(),
        b"label item H".to_vec(),
    ]
}

pub fn create_forum_user_mock(
    account_id: <Runtime as system::Trait>::AccountId,
    name: Vec<u8>,
    self_introduction: Vec<u8>,
    result: Result<(), &'static str>,
) -> OriginType {
    assert_eq!(
        TestForumModule::create_forum_user(account_id, name.clone(), self_introduction.clone(),),
        result
    );
    OriginType::Signed(account_id)
}

pub fn create_moderator_mock(
    account_id: <Runtime as system::Trait>::AccountId,
    name: Vec<u8>,
    self_introduction: Vec<u8>,
    result: Result<(), &'static str>,
) -> OriginType {
    assert_eq!(
        TestForumModule::create_moderator(account_id, name.clone(), self_introduction.clone(),),
        result
    );
    OriginType::Signed(account_id)
}

pub fn create_labels_mock() {
    assert_eq!(TestForumModule::add_labels(good_labels()), Ok(()));
}

pub fn create_category_mock(
    origin: OriginType,
    parent: Option<CategoryId>,
    title: Vec<u8>,
    description: Vec<u8>,
    labels: &Vec<LabelId>,
    result: Result<(), &'static str>,
) -> CategoryId {
    assert_eq!(
        TestForumModule::create_category(
            mock_origin(origin),
            parent,
            title.clone(),
            description.clone(),
            labels.clone(),
        ),
        result
    );
    TestForumModule::next_category_id() - 1
}

pub fn create_thread_mock(
    origin: OriginType,
    category_id: CategoryId,
    title: Vec<u8>,
    text: Vec<u8>,
    labels: &Vec<LabelId>,
    poll_data: Option<(
        Vec<Vec<u8>>,
        Vec<u8>,
        <Runtime as timestamp::Trait>::Moment,
        <Runtime as timestamp::Trait>::Moment,
        u8,
        u8,
    )>,
    result: Result<(), &'static str>,
) -> ThreadId {
    assert_eq!(
        TestForumModule::create_thread(
            mock_origin(origin.clone()),
            category_id,
            title.clone(),
            text.clone(),
            labels.clone(),
            poll_data.clone(),
        ),
        result
    );
    TestForumModule::next_thread_id() - 1
}

pub fn create_post_mock(
    origin: OriginType,
    thread_id: ThreadId,
    text: Vec<u8>,
    result: Result<(), &'static str>,
) -> PostId {
    assert_eq!(
        TestForumModule::add_post(mock_origin(origin.clone()), thread_id, text.clone(),),
        result
    );
    TestForumModule::next_post_id() - 1
}

pub fn add_labels_mock(labels: Vec<Vec<u8>>, result: Result<(), &'static str>) -> usize {
    assert_eq!(TestForumModule::add_labels(labels.clone()), result);
    labels.len()
}

pub fn set_forum_sudo_mock(
    origin: OriginType,
    new_forum_sudo: Option<<Runtime as system::Trait>::AccountId>,
    result: Result<(), &'static str>,
) {
    assert_eq!(
        TestForumModule::set_forum_sudo(mock_origin(origin), new_forum_sudo),
        result
    );
}

pub fn set_max_category_depth_mock(
    origin: OriginType,
    max_category_depth: u8,
    result: Result<(), &'static str>,
) -> u8 {
    assert_eq!(
        TestForumModule::set_max_category_depth(mock_origin(origin), max_category_depth),
        result
    );
    max_category_depth
}

pub fn set_moderator_category_mock(
    origin: OriginType,
    category_id: CategoryId,
    account_id: <Runtime as system::Trait>::AccountId,
    new_value: bool,
    result: Result<(), &'static str>,
) -> <Runtime as system::Trait>::AccountId {
    assert_eq!(
        TestForumModule::set_moderator_category(
            mock_origin(origin),
            category_id,
            account_id,
            new_value
        ),
        result
    );
    account_id
}

pub fn update_category_mock(origin: OriginType,
    category_id: CategoryId,
    new_archival_status: Option<bool>, 
    new_deletion_status: Option<bool>,
    result: Result<(), &'static str>,
) -> CategoryId {
    assert_eq!(
        TestForumModule::update_category(
            mock_origin(origin),
            category_id,
            new_archival_status,
            new_deletion_status
        ),
        result
    );
    category_id
}

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
        max_category_depth: 5,
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
        label_name_constraint: InputValidationLengthConstraint {
            min: 10,
            max_min_diff: 20,
        },
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
        category_thread_labes: vec![],
        next_label_id: 1,
        category_labels: vec![],
        thread_labels: vec![],
        max_applied_labels: 5,
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

pub type Timestamp = timestamp::Module<Runtime>;

/// Export forum module on a test runtime
pub type TestForumModule = Module<Runtime>;
