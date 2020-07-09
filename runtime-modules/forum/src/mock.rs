#![cfg(test)]

use crate::*;

use primitives::H256;

use crate::{GenesisConfig, Module, Trait};

use runtime_primitives::{
    testing::Header,
    traits::{BlakeTwo256, Hash, IdentityLookup},
    Perbill,
};
use srml_support::{impl_outer_event, impl_outer_origin, parameter_types};

impl_outer_origin! {
    pub enum Origin for Runtime {}
}

mod forum_mod {
    pub use crate::Event;
}

impl_outer_event! {
    pub enum TestEvent for Runtime {
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

parameter_types! {
    pub const MaxCategoryDepth: u64 = 20;
}

impl Trait for Runtime {
    type Event = TestEvent;
    type ForumUserId = u64;
    type ModeratorId = u64;
    type CategoryId = u64;
    type ThreadId = u64;
    type PostId = u64;
    type PostReactionId = u64;
    type MaxCategoryDepth = MaxCategoryDepth;

    fn is_lead(account_id: &<Self as system::Trait>::AccountId) -> bool {
        *account_id == FORUM_LEAD_ORIGIN_ID
    }

    fn is_forum_member(
        account_id: &<Self as system::Trait>::AccountId,
        forum_user_id: &Self::ForumUserId,
    ) -> bool {
        let allowed_accounts = [
            FORUM_LEAD_ORIGIN_ID,
            NOT_FORUM_LEAD_ORIGIN_ID,
            NOT_FORUM_LEAD_2_ORIGIN_ID,
        ];

        allowed_accounts.contains(account_id) && account_id == forum_user_id
    }

    fn is_moderator(account_id: &Self::AccountId, moderator_id: &Self::ModeratorId) -> bool {
        let allowed_accounts = [
            FORUM_LEAD_ORIGIN_ID,
            FORUM_MODERATOR_ORIGIN_ID,
            FORUM_MODERATOR_2_ORIGIN_ID,
        ];

        allowed_accounts.contains(account_id) && account_id == moderator_id
    }

    fn calculate_hash(text: &[u8]) -> Self::Hash {
        Self::Hashing::hash(text)
    }
}

#[derive(Clone)]
pub enum OriginType {
    Signed(<Runtime as system::Trait>::AccountId),
    //Inherent, <== did not find how to make such an origin yet
}

pub fn mock_origin(origin: OriginType) -> mock::Origin {
    match origin {
        OriginType::Signed(account_id) => Origin::signed(account_id),
        //OriginType::Inherent => Origin::inherent,
    }
}

pub const FORUM_LEAD_ORIGIN_ID: <Runtime as system::Trait>::AccountId = 110;

pub const FORUM_LEAD_ORIGIN: OriginType = OriginType::Signed(FORUM_LEAD_ORIGIN_ID);

pub const NOT_FORUM_LEAD_ORIGIN_ID: <Runtime as system::Trait>::AccountId = 111;

pub const NOT_FORUM_LEAD_ORIGIN: OriginType = OriginType::Signed(NOT_FORUM_LEAD_ORIGIN_ID);

pub const NOT_FORUM_LEAD_2_ORIGIN_ID: <Runtime as system::Trait>::AccountId = 112;

pub const NOT_FORUM_LEAD_2_ORIGIN: OriginType = OriginType::Signed(NOT_FORUM_LEAD_2_ORIGIN_ID);

pub const INVLAID_CATEGORY_ID: <Runtime as Trait>::CategoryId = 333;

pub const FORUM_MODERATOR_ORIGIN_ID: <Runtime as system::Trait>::AccountId = 123;

pub const FORUM_MODERATOR_ORIGIN: OriginType = OriginType::Signed(FORUM_MODERATOR_ORIGIN_ID);

pub const FORUM_MODERATOR_2_ORIGIN_ID: <Runtime as system::Trait>::AccountId = 124;

pub const FORUM_MODERATOR_2_ORIGIN: OriginType = OriginType::Signed(FORUM_MODERATOR_2_ORIGIN_ID);

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
) -> Poll<<Runtime as timestamp::Trait>::Moment, <Runtime as system::Trait>::Hash> {
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
) -> Poll<<Runtime as timestamp::Trait>::Moment, <Runtime as system::Trait>::Hash> {
    let test_cases = vec![generate_poll(expiration_diff), generate_poll(1)];
    test_cases[index].clone()
}

pub fn create_category_mock(
    origin: OriginType,
    parent: Option<<Runtime as Trait>::CategoryId>,
    title: Vec<u8>,
    description: Vec<u8>,
    result: Result<(), &'static str>,
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
    forum_user_id: <Runtime as Trait>::ForumUserId,
    category_id: <Runtime as Trait>::CategoryId,
    title: Vec<u8>,
    text: Vec<u8>,
    poll_data: Option<
        Poll<<Runtime as timestamp::Trait>::Moment, <Runtime as system::Trait>::Hash>,
    >,
    result: Result<(), &'static str>,
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
    forum_user_id: <Runtime as Trait>::ForumUserId,
    category_id: <Runtime as Trait>::CategoryId,
    thread_id: <Runtime as Trait>::PostId,
    new_title: Vec<u8>,
    result: Result<(), &'static str>,
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
    moderator_id: <Runtime as Trait>::ModeratorId,
    category_id: <Runtime as Trait>::CategoryId,
    thread_id: <Runtime as Trait>::PostId,
    result: Result<(), &'static str>,
) {
    assert_eq!(
        TestForumModule::delete_thread(
            mock_origin(origin.clone()),
            moderator_id,
            category_id,
            thread_id,
        ),
        result
    );
    if result.is_ok() {
        assert!(!<ThreadById<Runtime>>::exists(category_id, thread_id));
        assert_eq!(
            System::events().last().unwrap().event,
            TestEvent::forum_mod(RawEvent::ThreadDeleted(thread_id))
        );
    }
}

pub fn move_thread_mock(
    origin: OriginType,
    moderator_id: <Runtime as Trait>::ModeratorId,
    category_id: <Runtime as Trait>::CategoryId,
    thread_id: <Runtime as Trait>::PostId,
    new_category_id: <Runtime as Trait>::CategoryId,
    result: Result<(), &'static str>,
) {
    assert_eq!(
        TestForumModule::move_thread_to_category(
            mock_origin(origin.clone()),
            moderator_id,
            category_id,
            thread_id,
            new_category_id,
        ),
        result
    );
    if result.is_ok() {
        assert!(<ThreadById<Runtime>>::exists(new_category_id, thread_id),);
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
    result: Result<(), &'static str>,
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
    forum_user_id: <Runtime as Trait>::ForumUserId,
    category_id: <Runtime as Trait>::CategoryId,
    thread_id: <Runtime as Trait>::ThreadId,
    text: Vec<u8>,
    result: Result<(), &'static str>,
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
    forum_user_id: <Runtime as Trait>::ForumUserId,
    category_id: <Runtime as Trait>::CategoryId,
    thread_id: <Runtime as Trait>::ThreadId,
    post_id: <Runtime as Trait>::PostId,
    new_text: Vec<u8>,
    result: Result<(), &'static str>,
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
    moderator_id: <Runtime as Trait>::ModeratorId,
    category_id: <Runtime as Trait>::CategoryId,
    new_value: bool,
    result: Result<(), &'static str>,
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
            <CategoryByModerator<Runtime>>::exists(category_id, moderator_id),
            new_value
        );
    };
    category_id
}

pub fn vote_on_poll_mock(
    origin: OriginType,
    forum_user_id: <Runtime as Trait>::ForumUserId,
    category_id: <Runtime as Trait>::CategoryId,
    thread_id: <Runtime as Trait>::ThreadId,
    index: u32,
    result: Result<(), &'static str>,
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
    result: Result<(), &'static str>,
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
    result: Result<(), &'static str>,
) -> () {
    assert_eq!(
        TestForumModule::delete_category(mock_origin(origin), moderator_id, category_id),
        result,
    );
    if result.is_ok() {
        assert!(!<CategoryById<Runtime>>::exists(category_id));
        assert_eq!(
            System::events().last().unwrap().event,
            TestEvent::forum_mod(RawEvent::CategoryDeleted(category_id))
        );
    };
}

pub fn moderate_thread_mock(
    origin: OriginType,
    moderator_id: <Runtime as Trait>::ModeratorId,
    category_id: <Runtime as Trait>::CategoryId,
    thread_id: <Runtime as Trait>::ThreadId,
    rationale: Vec<u8>,
    result: Result<(), &'static str>,
) -> <Runtime as Trait>::ThreadId {
    assert_eq!(
        TestForumModule::moderate_thread(
            mock_origin(origin),
            moderator_id,
            category_id,
            thread_id,
            rationale.clone(),
        ),
        result
    );
    if result.is_ok() {
        assert!(!<ThreadById<Runtime>>::exists(category_id, thread_id));

        let rationale_hash = Runtime::calculate_hash(rationale.clone().as_slice());
        assert_eq!(
            System::events().last().unwrap().event,
            TestEvent::forum_mod(RawEvent::ThreadModerated(thread_id, rationale_hash))
        );
    }
    thread_id
}

pub fn moderate_post_mock(
    origin: OriginType,
    moderator_id: <Runtime as Trait>::ModeratorId,
    category_id: <Runtime as Trait>::CategoryId,
    thread_id: <Runtime as Trait>::ThreadId,
    post_id: <Runtime as Trait>::PostId,
    rationale: Vec<u8>,
    result: Result<(), &'static str>,
) -> <Runtime as Trait>::PostId {
    assert_eq!(
        TestForumModule::moderate_post(
            mock_origin(origin),
            moderator_id,
            category_id,
            thread_id,
            post_id,
            rationale.clone(),
        ),
        result
    );
    if result.is_ok() {
        assert!(!<PostById<Runtime>>::exists(thread_id, post_id));

        let rationale_hash = Runtime::calculate_hash(rationale.clone().as_slice());
        assert_eq!(
            System::events().last().unwrap().event,
            TestEvent::forum_mod(RawEvent::PostModerated(post_id, rationale_hash))
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

pub fn default_genesis_config() -> GenesisConfig<Runtime> {
    create_genesis_config(true)
}

pub fn migration_not_done_config() -> GenesisConfig<Runtime> {
    create_genesis_config(false)
}

pub fn create_genesis_config(data_migration_done: bool) -> GenesisConfig<Runtime> {
    GenesisConfig::<Runtime> {
        category_by_id: vec![], // endowed_accounts.iter().cloned().map(|k|(k, 1 << 60)).collect(),
        next_category_id: 1,
        thread_by_id: vec![],
        next_thread_id: 1,
        post_by_id: vec![],
        next_post_id: 1,

        category_by_moderator: vec![],
        reaction_by_post: vec![],

        poll_items_constraint: InputValidationLengthConstraint {
            min: 4,
            max_min_diff: 20,
        },

        // data migration part
        data_migration_done: data_migration_done,
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
