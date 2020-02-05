#![cfg(test)]

use crate::*;

use primitives::H256;

use crate::{GenesisConfig, Module, Trait};
// use old_forum_mod::GenesisConfig as OldGenesisConfig;

use runtime_primitives::{
    testing::Header,
    traits::{BlakeTwo256, IdentityLookup, OnInitialize},
    Perbill,
};
use srml_support::{impl_outer_event, impl_outer_origin, parameter_types};

impl_outer_origin! {
    pub enum Origin for Runtime {}
}

mod old_forum_mod {
    pub use old_forum::Event;
}

mod forum_mod {
    pub use crate::Event;
}

impl_outer_event! {
    pub enum TestEvent for Runtime {
        old_forum_mod<T>,
        forum_mod<T>,
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
    type Event = TestEvent;
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

pub struct ShimMembershipRegistry {}

impl old_forum::ForumUserRegistry<<Runtime as system::Trait>::AccountId>
    for ShimMembershipRegistry
{
    fn get_forum_user(
        _id: &<Runtime as system::Trait>::AccountId,
    ) -> Option<old_forum::ForumUser<<Runtime as system::Trait>::AccountId>> {
        None
    }
}

impl old_forum::Trait for Runtime {
    type Event = TestEvent;
    type MembershipRegistry = ShimMembershipRegistry;
}

impl Trait for Runtime {
    type Event = TestEvent;
    type ForumUserId = u64;
    type ModeratorId = u64;
    type CategoryId = u64;
    type ThreadId = u64;
    type LabelId = u64;
    type PostId = u64;
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

pub const NOT_FORUM_SUDO_ORIGIN_ID: <Runtime as system::Trait>::AccountId = 111;

pub const NOT_FORUM_SUDO_ORIGIN: OriginType = OriginType::Signed(NOT_FORUM_SUDO_ORIGIN_ID);

pub const INVLAID_CATEGORY_ID: <Runtime as Trait>::CategoryId = 333;

pub const NOT_REGISTER_MODERATOR_ID: <Runtime as Trait>::ModeratorId = 666;

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

pub fn good_forum_user_footer() -> Option<Vec<u8>> {
    Some(b"good forum user footer".to_vec())
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

pub fn generate_poll() -> Poll<<Runtime as timestamp::Trait>::Moment> {
    Poll {
        poll_description: b"poll description".to_vec(),
        start_time: Timestamp::now(),
        end_time: Timestamp::now() + 10,
        poll_alternatives: {
            let mut alternatives = vec![];
            for _ in 0..5 {
                alternatives.push(PollAlternative {
                    alternative_text: b"poll alternative".to_vec(),
                    vote_count: 0,
                });
            }
            alternatives
        },
    }
}

pub fn generate_poll_timestamp_cases(index: usize) -> Poll<<Runtime as timestamp::Trait>::Moment> {
    let test_cases = vec![
        Poll {
            poll_description: b"poll description".to_vec(),
            start_time: Timestamp::now(),
            end_time: Timestamp::now() + 10,
            poll_alternatives: {
                let mut alternatives = vec![];
                for _ in 0..5 {
                    alternatives.push(PollAlternative {
                        alternative_text: b"poll alternative".to_vec(),
                        vote_count: 0,
                    });
                }
                alternatives
            },
        },
        Poll {
            poll_description: b"poll description".to_vec(),
            start_time: Timestamp::now() + 10,
            end_time: Timestamp::now(),
            poll_alternatives: {
                let mut alternatives = vec![];
                for _ in 0..5 {
                    alternatives.push(PollAlternative {
                        alternative_text: b"poll alternative".to_vec(),
                        vote_count: 0,
                    });
                }
                alternatives
            },
        },
    ];
    test_cases[index].clone()
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

pub fn generate_label_index_cases() -> Vec<BTreeSet<<Runtime as Trait>::ThreadId>> {
    vec![
        {
            let mut a = BTreeSet::<<Runtime as Trait>::ThreadId>::new();
            a.insert(1);
            a
        },
        {
            let mut a = BTreeSet::<<Runtime as Trait>::ThreadId>::new();
            a.insert(1);
            a.insert(2);
            a.insert(3);
            a.insert(4);
            a.insert(5);
            a.insert(6);
            a
        },
        {
            let mut a = BTreeSet::<<Runtime as Trait>::ThreadId>::new();
            a.insert(100);
            a
        },
    ]
}

pub fn create_forum_user_mock(
    account_id: <Runtime as system::Trait>::AccountId,
    name: Vec<u8>,
    self_introduction: Vec<u8>,
    forum_user_footer: Option<Vec<u8>>,
    result: Result<(), &'static str>,
) -> <Runtime as Trait>::ForumUserId {
    let forum_user_id = TestForumModule::next_forum_user_id();
    assert_eq!(
        TestForumModule::create_forum_user(
            account_id,
            name.clone(),
            self_introduction.clone(),
            forum_user_footer.clone(),
        ),
        result
    );
    if result.is_ok() {
        let forum_user = ForumUser {
            role_account: account_id,
            name: name.clone(),
            self_introduction: self_introduction.clone(),
            post_footer: forum_user_footer.clone(),
        };
        assert_eq!(TestForumModule::forum_user_by_id(forum_user_id), forum_user,);
        assert_eq!(TestForumModule::next_forum_user_id(), forum_user_id + 1);
        assert_eq!(
            System::events().last().unwrap().event,
            TestEvent::forum_mod(RawEvent::ForumUserCreated(forum_user_id))
        );
    };

    forum_user_id
}

pub fn create_moderator_mock(
    account_id: <Runtime as system::Trait>::AccountId,
    name: Vec<u8>,
    self_introduction: Vec<u8>,
    result: Result<(), &'static str>,
) -> <Runtime as Trait>::ModeratorId {
    let moderator_id = TestForumModule::next_moderator_id();
    assert_eq!(
        TestForumModule::create_moderator(account_id, name.clone(), self_introduction.clone(),),
        result
    );
    if result.is_ok() {
        let moderator = Moderator {
            role_account: account_id,
            name: name.clone(),
            self_introduction: self_introduction.clone(),
        };
        assert_eq!(TestForumModule::moderator_by_id(moderator_id), moderator);
        assert_eq!(TestForumModule::next_moderator_id(), moderator_id + 1);
        assert_eq!(
            System::events().last().unwrap().event,
            TestEvent::forum_mod(RawEvent::ModeratorCreated(moderator_id))
        );
    };
    moderator_id
}

pub fn create_labels_mock() {
    let labels: Vec<Label> = good_labels()
        .iter()
        .map(|label| Label {
            text: label.clone(),
        })
        .collect();
    let last_index = TestForumModule::next_label_id();
    assert_eq!(TestForumModule::add_labels(good_labels()), Ok(()));
    for index in 0..labels.len() {
        assert_eq!(
            TestForumModule::label_by_id(last_index + index as u64),
            labels[index]
        );
    }
    assert_eq!(
        TestForumModule::next_label_id(),
        last_index as u64 + labels.len() as u64
    );
}

pub fn create_category_mock(
    origin: OriginType,
    parent: Option<<Runtime as Trait>::CategoryId>,
    title: Vec<u8>,
    description: Vec<u8>,
    labels: &BTreeSet<<Runtime as Trait>::LabelId>,
    result: Result<(), &'static str>,
) -> <Runtime as Trait>::CategoryId {
    let category_id = TestForumModule::next_category_id();
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
    forum_user_id: <Runtime as Trait>::ForumUserId,
    category_id: <Runtime as Trait>::CategoryId,
    title: Vec<u8>,
    text: Vec<u8>,
    labels: &BTreeSet<<Runtime as Trait>::LabelId>,
    poll_data: Option<Poll<<Runtime as timestamp::Trait>::Moment>>,
    result: Result<(), &'static str>,
) -> <Runtime as Trait>::ThreadId {
    let thread_id = TestForumModule::next_thread_id();
    assert_eq!(
        TestForumModule::create_thread(
            mock_origin(origin.clone()),
            forum_user_id,
            category_id,
            title.clone(),
            text.clone(),
            labels.clone(),
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

pub fn create_post_mock(
    origin: OriginType,
    forum_user_id: <Runtime as Trait>::ForumUserId,
    thread_id: <Runtime as Trait>::ThreadId,
    text: Vec<u8>,
    result: Result<(), &'static str>,
) -> <Runtime as Trait>::PostId {
    let post_id = TestForumModule::next_post_id();
    assert_eq!(
        TestForumModule::add_post(
            mock_origin(origin.clone()),
            forum_user_id,
            thread_id,
            text.clone(),
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

pub fn add_labels_mock(labels: Vec<Vec<u8>>, result: Result<(), &'static str>) -> usize {
    let last_index = TestForumModule::next_label_id();

    assert_eq!(TestForumModule::add_labels(labels.clone()), result);
    if result.is_ok() {
        let label_list: Vec<Label> = labels
            .iter()
            .map(|label| Label {
                text: label.clone(),
            })
            .collect();

        for index in 0..label_list.len() {
            assert_eq!(
                TestForumModule::label_by_id(last_index + index as u64),
                label_list[index]
            );
        }
        assert_eq!(
            TestForumModule::next_label_id(),
            last_index as u64 + label_list.len() as u64
        );
    };
    labels.len()
}

pub fn set_forum_sudo_mock(
    origin: OriginType,
    new_forum_sudo: Option<<Runtime as system::Trait>::AccountId>,
    result: Result<(), &'static str>,
) {
    let old_forum_sudo = TestForumModule::forum_sudo();

    assert_eq!(
        TestForumModule::set_forum_sudo(mock_origin(origin), new_forum_sudo),
        result
    );

    if result.is_ok() {
        assert_eq!(TestForumModule::forum_sudo(), new_forum_sudo);
        assert_eq!(
            System::events().last().unwrap().event,
            TestEvent::forum_mod(RawEvent::ForumSudoSet(old_forum_sudo, new_forum_sudo,))
        );
    };
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
    if result.is_ok() {
        assert_eq!(TestForumModule::max_category_depth(), max_category_depth);
        assert_eq!(
            System::events().last().unwrap().event,
            TestEvent::forum_mod(RawEvent::MaxCategoryDepthUpdated(max_category_depth,))
        );
    };

    max_category_depth
}

pub fn set_moderator_category_mock(
    origin: OriginType,
    moderator_id: <Runtime as Trait>::ModeratorId,
    category_id: <Runtime as Trait>::CategoryId,
    new_value: bool,
    result: Result<(), &'static str>,
) -> <Runtime as Trait>::CategoryId {
    assert_eq!(
        TestForumModule::set_moderator_category(
            mock_origin(origin),
            moderator_id,
            category_id,
            new_value
        ),
        result
    );
    if result.is_ok() {
        assert_eq!(
            TestForumModule::category_by_moderator(category_id, moderator_id),
            new_value
        );
    };
    category_id
}

pub fn vote_on_poll_mock(
    origin: OriginType,
    forum_user_id: <Runtime as Trait>::ForumUserId,
    thread_id: <Runtime as Trait>::ThreadId,
    index: u32,
    result: Result<(), &'static str>,
) -> <Runtime as Trait>::ThreadId {
    let thread = TestForumModule::thread_by_id(thread_id);
    assert_eq!(
        TestForumModule::vote_on_poll(mock_origin(origin), forum_user_id, thread_id, index),
        result
    );
    if result.is_ok() {
        assert_eq!(
            TestForumModule::thread_by_id(thread_id)
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

pub fn update_category_mock(
    origin: OriginType,
    category_id: <Runtime as Trait>::CategoryId,
    new_archival_status: Option<bool>,
    new_deletion_status: Option<bool>,
    result: Result<(), &'static str>,
) -> <Runtime as Trait>::CategoryId {
    assert_eq!(
        TestForumModule::update_category(
            mock_origin(origin),
            category_id,
            new_archival_status,
            new_deletion_status
        ),
        result
    );
    if result.is_ok() {
        assert_eq!(
            System::events().last().unwrap().event,
            TestEvent::forum_mod(RawEvent::CategoryUpdated(
                category_id,
                new_archival_status,
                new_deletion_status
            ))
        );
    };
    category_id
}

pub fn moderate_thread_mock(
    origin: OriginType,
    moderator_id: <Runtime as Trait>::ModeratorId,
    thread_id: <Runtime as Trait>::ThreadId,
    rationale: Vec<u8>,
    result: Result<(), &'static str>,
) -> <Runtime as Trait>::ThreadId {
    assert_eq!(
        TestForumModule::moderate_thread(mock_origin(origin), moderator_id, thread_id, rationale),
        result
    );
    if result.is_ok() {
        assert_eq!(
            TestForumModule::thread_by_id(thread_id)
                .moderation
                .is_some(),
            true
        );
        assert_eq!(
            System::events().last().unwrap().event,
            TestEvent::forum_mod(RawEvent::ThreadModerated(thread_id,))
        );
    }
    thread_id
}

pub fn moderate_post_mock(
    origin: OriginType,
    moderator_id: <Runtime as Trait>::ModeratorId,
    post_id: <Runtime as Trait>::PostId,
    rationale: Vec<u8>,
    result: Result<(), &'static str>,
) -> <Runtime as Trait>::PostId {
    assert_eq!(
        TestForumModule::moderate_post(mock_origin(origin), moderator_id, post_id, rationale),
        result
    );
    if result.is_ok() {
        assert_eq!(
            TestForumModule::post_by_id(post_id).moderation.is_some(),
            true
        );
        assert_eq!(
            System::events().last().unwrap().event,
            TestEvent::forum_mod(RawEvent::PostModerated(post_id,))
        );
    }

    post_id
}

pub fn update_category_labels_mock(
    origin: OriginType,
    moderator_id: <Runtime as Trait>::ModeratorId,
    category_id: <Runtime as Trait>::CategoryId,
    labels: BTreeSet<<Runtime as Trait>::LabelId>,
    result: Result<(), &'static str>,
) -> <Runtime as Trait>::CategoryId {
    assert_eq!(
        TestForumModule::update_category_labels(
            mock_origin(origin),
            moderator_id,
            category_id,
            labels.clone(),
        ),
        result
    );
    if result.is_ok() {
        assert_eq!(
            TestForumModule::category_labels(category_id),
            labels.clone()
        );
    }
    category_id
}

pub fn update_thread_labels_by_author_mock(
    origin: OriginType,
    forum_user_id: <Runtime as Trait>::ForumUserId,
    thread_id: <Runtime as Trait>::ThreadId,
    labels: BTreeSet<<Runtime as Trait>::LabelId>,
    result: Result<(), &'static str>,
) -> <Runtime as Trait>::ThreadId {
    assert_eq!(
        TestForumModule::update_thread_labels_by_author(
            mock_origin(origin),
            forum_user_id,
            thread_id,
            labels.clone(),
        ),
        result
    );
    if result.is_ok() {
        assert_eq!(TestForumModule::thread_labels(thread_id), labels.clone());
    };
    thread_id
}

pub fn update_thread_labels_by_moderator_mock(
    origin: OriginType,
    moderator_id: <Runtime as Trait>::ModeratorId,
    thread_id: <Runtime as Trait>::ThreadId,
    labels: BTreeSet<<Runtime as Trait>::LabelId>,
    result: Result<(), &'static str>,
) -> <Runtime as Trait>::ThreadId {
    assert_eq!(
        TestForumModule::update_thread_labels_by_moderator(
            mock_origin(origin),
            moderator_id,
            thread_id,
            labels.clone(),
        ),
        result
    );
    if result.is_ok() {
        assert_eq!(TestForumModule::thread_labels(thread_id), labels.clone());
    };
    thread_id
}

pub fn edit_post_text_mock(
    origin: OriginType,
    forum_user_id: <Runtime as Trait>::ForumUserId,
    post_id: <Runtime as Trait>::PostId,
    new_text: Vec<u8>,
    result: Result<(), &'static str>,
) -> <Runtime as Trait>::PostId {
    let post = TestForumModule::post_by_id(post_id);
    assert_eq!(
        TestForumModule::edit_post_text(
            mock_origin(origin),
            forum_user_id,
            post_id,
            new_text.clone(),
        ),
        result
    );
    if result.is_ok() {
        assert_eq!(
            TestForumModule::post_by_id(post_id).current_text,
            new_text.clone()
        );
        assert_eq!(
            TestForumModule::post_by_id(post_id)
                .text_change_history
                .len(),
            post.text_change_history.len() + 1
        );
        assert_eq!(
            System::events().last().unwrap().event,
            TestEvent::forum_mod(RawEvent::PostTextUpdated(
                post_id,
                TestForumModule::post_by_id(post_id)
                    .text_change_history
                    .len() as u64,
            ))
        );
    }
    post_id
}

pub fn set_stickied_threads_mock(
    origin: OriginType,
    moderator_id: <Runtime as Trait>::ModeratorId,
    category_id: <Runtime as Trait>::CategoryId,
    stickied_ids: Vec<<Runtime as Trait>::ThreadId>,
    result: Result<(), &'static str>,
) -> <Runtime as Trait>::CategoryId {
    assert_eq!(
        TestForumModule::set_stickied_threads(
            mock_origin(origin),
            moderator_id,
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

pub fn generate_old_forum_data(moderator_id: <Runtime as system::Trait>::AccountId) {
    for _ in 0..100 {
        TestForumModule::create_migrate_data(moderator_id);
    }
}

pub fn on_initialize_mock(
    moderator_id: <Runtime as system::Trait>::AccountId,
    n: <Runtime as system::Trait>::BlockNumber,
) {
    TestForumModule::on_initialize(n);
}

pub fn default_genesis_config() -> GenesisConfig<Runtime> {
    generate_genesis_config(0, 0, true)
}

pub fn data_migration_genesis_config() -> GenesisConfig<Runtime> {
    generate_genesis_config(100, 100, false)
}

pub fn generate_genesis_config(
    threads_imported_per_block: u64,
    posts_imported_per_block: u64,
    data_migration_done: bool,
) -> GenesisConfig<Runtime> {
    GenesisConfig::<Runtime> {
        forum_user_by_id: vec![],
        next_forum_user_id: 1,
        moderator_by_id: vec![],
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
            min: 4,
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
        post_footer_constraint: InputValidationLengthConstraint {
            min: 10,
            max_min_diff: 140,
        },

        label_by_id: vec![],
        next_label_id: 1,
        category_labels: vec![],
        thread_labels: vec![],
        max_applied_labels: 5,

        // data migration part
        fork_block_number: 0,
        threads_imported_per_block: threads_imported_per_block,
        posts_imported_per_block: posts_imported_per_block,
        data_migration_done: data_migration_done,
        account_by_forum_user_id: vec![],
        account_by_moderator_id: vec![],
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

pub type OldForumModule = old_forum::Module<Runtime>;
