#![cfg(test)]

use crate::*;
use frame_support::traits::{OnFinalize, OnInitialize};
use frame_support::{impl_outer_event, impl_outer_origin, ord_parameter_types, parameter_types};
use sp_core::H256;
use sp_io::TestExternalities;
use sp_runtime::{
    testing::Header,
    traits::{BlakeTwo256, IdentityLookup},
    DispatchResult, Perbill,
};

pub(crate) const FIRST_OWNER_ORIGIN: u64 = 1;
pub(crate) const SECOND_OWNER_ORIGIN: u64 = 2;

impl_outer_origin! {
    pub enum Origin for Runtime {}
}

#[derive(Clone, Default, PartialEq, Eq, Debug)]
pub struct Runtime;

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

impl_outer_event! {
    pub enum TestEvent for Runtime {
        crate DefaultInstance <T>,
        frame_system<T>,
    }
}

ord_parameter_types! {
    pub const CorrectOwner: u64 = FIRST_OWNER_ORIGIN;
}

parameter_types! {
    pub const PostTitleMaxLength: u64 = 200;
    pub const PostBodyMaxLength: u64 = 10_000;
    pub const ReplyMaxLength: u64 = 2_000;
    pub const PostsMaxNumber: u64 = 20;
    pub const RepliesMaxNumber: u64 = 100;
}

impl Trait for Runtime {
    type Event = TestEvent;

    type PostTitleMaxLength = PostTitleMaxLength;
    type PostBodyMaxLength = PostBodyMaxLength;
    type ReplyMaxLength = ReplyMaxLength;

    type PostsMaxNumber = PostsMaxNumber;
    type RepliesMaxNumber = RepliesMaxNumber;

    type BlogOwnerEnsureOrigin = frame_system::EnsureSignedBy<CorrectOwner, Self::AccountId>;

    type ParticipantEnsureOrigin = frame_system::EnsureSigned<Self::ParticipantId>;
    type ParticipantId = u64;

    type PostId = u64;
    type ReplyId = u64;
}

#[derive(Default)]
pub struct ExtBuilder;

impl ExtBuilder {
    fn run_to_block(n: u64) {
        while System::block_number() < n {
            <System as OnFinalize<u64>>::on_finalize(System::block_number());
            <crate::Module<Runtime> as OnFinalize<u64>>::on_finalize(System::block_number());
            System::set_block_number(System::block_number() + 1);
            <System as OnInitialize<u64>>::on_initialize(System::block_number());
            <crate::Module<Runtime> as OnInitialize<u64>>::on_initialize(System::block_number());
        }
    }

    pub fn build(self) -> TestExternalities {
        let t = frame_system::GenesisConfig::default()
            .build_storage::<Runtime>()
            .unwrap();

        let mut result: TestExternalities = t.into();

        // Make sure we are not in block 0 where no events are emitted - see https://substrate.dev/recipes/2-appetizers/4-events.html#emitting-events
        result.execute_with(|| Self::run_to_block(1));

        result
    }
}

// Assign back to type variables so we can make dispatched calls of these modules later.
pub type System = frame_system::Module<Runtime>;
pub type TestBlogModule = Module<Runtime>;

pub enum PostType {
    Valid,
    PostTitleInvalid,
    PostBodyInvalid,
}

pub enum ReplyType {
    Valid,
    Invalid,
}

pub fn generate_text(len: usize) -> Vec<u8> {
    vec![b'x'; len]
}

type RawTestEvent = RawEvent<
    <Runtime as Trait>::ParticipantId,
    <Runtime as Trait>::PostId,
    <Runtime as Trait>::ReplyId,
    ReactionsNumber,
    bool,
    DefaultInstance,
>;

pub fn get_test_event(raw_event: RawTestEvent) -> TestEvent {
    TestEvent::crate_DefaultInstance(raw_event)
}

// Posts
pub fn post_count() -> u64 {
    TestBlogModule::post_count()
}

pub fn post_by_id(post_id: <Runtime as Trait>::PostId) -> Option<Post<Runtime, DefaultInstance>> {
    match TestBlogModule::post_by_id(post_id) {
        post if post != Post::<Runtime, DefaultInstance>::default() => Some(post),
        _ => None,
    }
}

pub fn get_post(
    post_type: PostType,
    editing: bool,
    locked: bool,
) -> Post<Runtime, DefaultInstance> {
    let (title, body);
    match post_type {
        // Make them different
        PostType::Valid if editing => {
            title = generate_text((PostTitleMaxLength::get() - 1) as usize);
            body = generate_text((PostBodyMaxLength::get() - 1) as usize);
        }
        PostType::Valid => {
            title = generate_text(PostTitleMaxLength::get() as usize);
            body = generate_text(PostBodyMaxLength::get() as usize);
        }
        PostType::PostTitleInvalid => {
            title = generate_text((PostTitleMaxLength::get() + 1) as usize);
            body = generate_text(PostBodyMaxLength::get() as usize);
        }
        PostType::PostBodyInvalid => {
            title = generate_text(PostTitleMaxLength::get() as usize);
            body = generate_text((PostBodyMaxLength::get() + 1) as usize);
        }
    }
    let mut post = Post::new(title, body);
    if locked {
        post.lock()
    }
    post
}

pub fn create_post(origin_id: u64, post_type: PostType) -> DispatchResult {
    let post = get_post(post_type, false, false);
    TestBlogModule::create_post(Origin::signed(origin_id), post.title, post.body)
}

pub fn lock_post(origin_id: u64, post_id: <Runtime as Trait>::PostId) -> DispatchResult {
    TestBlogModule::lock_post(Origin::signed(origin_id), post_id)
}

pub fn unlock_post(origin_id: u64, post_id: <Runtime as Trait>::PostId) -> DispatchResult {
    TestBlogModule::unlock_post(Origin::signed(origin_id), post_id)
}

pub fn edit_post(
    origin_id: u64,
    post_id: <Runtime as Trait>::PostId,
    post_type: PostType,
) -> DispatchResult {
    let post = get_post(post_type, true, false);
    TestBlogModule::edit_post(
        Origin::signed(origin_id),
        post_id,
        Some(post.title),
        Some(post.body),
    )
}

// Replies
pub fn reply_by_id(
    post_id: <Runtime as Trait>::PostId,
    reply_id: <Runtime as Trait>::ReplyId,
) -> Option<Reply<Runtime, DefaultInstance>> {
    match TestBlogModule::reply_by_id(post_id, reply_id) {
        reply if reply != Reply::<Runtime, DefaultInstance>::default() => Some(reply),
        _ => None,
    }
}

pub fn get_reply_text(reply_type: ReplyType, editing: bool) -> Vec<u8> {
    match reply_type {
        ReplyType::Valid if editing => generate_text(ReplyMaxLength::get() as usize),
        ReplyType::Valid => generate_text(ReplyMaxLength::get() as usize),
        ReplyType::Invalid => generate_text((ReplyMaxLength::get() + 1) as usize),
    }
}

pub fn get_reply(
    reply_type: ReplyType,
    owner: <Runtime as frame_system::Trait>::AccountId,
    parent_id: ParentId<Runtime, DefaultInstance>,
    editing: bool,
) -> Reply<Runtime, DefaultInstance> {
    let reply_text = get_reply_text(reply_type, editing);
    Reply::new(reply_text, owner, parent_id)
}

pub fn create_reply(
    origin_id: u64,
    post_id: <Runtime as Trait>::PostId,
    reply_id: Option<<Runtime as Trait>::ReplyId>,
    reply_type: ReplyType,
) -> DispatchResult {
    let reply = get_reply_text(reply_type, false);
    TestBlogModule::create_reply(Origin::signed(origin_id), post_id, reply_id, reply)
}

pub fn edit_reply(
    origin_id: u64,
    post_id: <Runtime as Trait>::PostId,
    reply_id: <Runtime as Trait>::ReplyId,
    reply_type: ReplyType,
) -> DispatchResult {
    let reply = get_reply_text(reply_type, true);
    TestBlogModule::edit_reply(Origin::signed(origin_id), post_id, reply_id, reply)
}

// Reactions

pub fn react(
    origin_id: u64,
    index: ReactionsNumber,
    post_id: <Runtime as Trait>::PostId,
    reply_id: Option<<Runtime as Trait>::ReplyId>,
) -> DispatchResult {
    TestBlogModule::react(Origin::signed(origin_id), index, post_id, reply_id)
}

pub fn get_reactions(
    post_id: <Runtime as Trait>::PostId,
    reply_id: Option<<Runtime as Trait>::ReplyId>,
    owner: <Runtime as Trait>::ParticipantId,
) -> Option<[bool; REACTIONS_MAX_NUMBER as usize]> {
    if Reactions::<Runtime>::contains_key((post_id, reply_id), owner) {
        Some(TestBlogModule::reactions((post_id, reply_id), owner))
    } else {
        None
    }
}
