#![cfg(test)]

use crate::*;
use primitives::H256;
use runtime_io::TestExternalities;
use runtime_primitives::{
    testing::Header,
    traits::{BlakeTwo256, IdentityLookup},
    Perbill,
};
use srml_support::{impl_outer_event, impl_outer_origin, parameter_types, traits::Get};
use std::cell::RefCell;
use system;

impl_outer_origin! {
    pub enum Origin for Runtime {}
}

#[derive(Clone, PartialEq, Eq, Debug)]
pub struct Runtime;

parameter_types! {
    pub const BlockHashCount: u64 = 250;
    pub const MaximumBlockWeight: u32 = 1024;
    pub const MaximumBlockLength: u32 = 2 * 1024;
    pub const AvailableBlockRatio: Perbill = Perbill::one();
}

// First, implement the system pallet's configuration trait for `Runtime`
impl system::Trait for Runtime {
    type Origin = Origin;
    type Index = u64;
    type Call = ();
    type BlockNumber = u64;
    type Hash = H256;
    type Hashing = BlakeTwo256;
    type AccountId = u64;
    type Lookup = IdentityLookup<Self::AccountId>;
    type Header = Header;
    // To test events, use `TestEvent`. Otherwise, use the commented line
    type Event = TestEvent;
    // type Event = ();
    type BlockHashCount = BlockHashCount;
    type MaximumBlockWeight = MaximumBlockWeight;
    type MaximumBlockLength = MaximumBlockLength;
    type AvailableBlockRatio = AvailableBlockRatio;
    type Version = ();
}

mod test_events {
    pub use crate::Event;
}

impl_outer_event! {
    pub enum TestEvent for Runtime {
        test_events<T>,
    }
}

thread_local! {
    static POST_TITLE_MAX_LENGTH: RefCell<u32> = RefCell::new(0);
    static POST_BODY_MAX_LENGTH: RefCell<u32> = RefCell::new(0);
    static REPLY_MAX_LENGTH: RefCell<u32> = RefCell::new(0);

    static POSTS_MAX_NUMBER: RefCell<u32> = RefCell::new(0);
    static REPLIES_MAX_NUMBER: RefCell<u32> = RefCell::new(0);
    static DIRECT_REPLIES_MAX_NUMBER: RefCell<u32> = RefCell::new(0);

    static CONSECUTIVE_REPLIES_MAX_NUMBER: RefCell<u16> = RefCell::new(0);
}

pub struct PostTitleMaxLength;
impl Get<u32> for PostTitleMaxLength {
    fn get() -> u32 {
        POST_TITLE_MAX_LENGTH.with(|v| *v.borrow())
    }
}

pub struct PostBodyMaxLength;
impl Get<u32> for PostBodyMaxLength {
    fn get() -> u32 {
        POST_BODY_MAX_LENGTH.with(|v| *v.borrow())
    }
}

pub struct ReplyMaxLength;
impl Get<u32> for ReplyMaxLength {
    fn get() -> u32 {
        REPLY_MAX_LENGTH.with(|v| *v.borrow())
    }
}

pub struct PostsMaxNumber;
impl Get<u32> for PostsMaxNumber {
    fn get() -> u32 {
        POSTS_MAX_NUMBER.with(|v| *v.borrow())
    }
}

pub struct RepliesMaxNumber;
impl Get<u32> for RepliesMaxNumber {
    fn get() -> u32 {
        REPLIES_MAX_NUMBER.with(|v| *v.borrow())
    }
}

pub struct DirectRepliesMaxNumber;
impl Get<u32> for DirectRepliesMaxNumber {
    fn get() -> u32 {
        DIRECT_REPLIES_MAX_NUMBER.with(|v| *v.borrow())
    }
}

pub struct ConsecutiveRepliesMaxNumber;
impl Get<u16> for ConsecutiveRepliesMaxNumber {
    fn get() -> u16 {
        CONSECUTIVE_REPLIES_MAX_NUMBER.with(|v| *v.borrow())
    }
}

impl Trait for Runtime {
    type Event = TestEvent;
    type PostTitleMaxLength = PostTitleMaxLength;
    type PostBodyMaxLength = PostBodyMaxLength;
    type ReplyMaxLength = ReplyMaxLength;
    type PostsMaxNumber = PostsMaxNumber;
    type RepliesMaxNumber = RepliesMaxNumber;
    type DirectRepliesMaxNumber = DirectRepliesMaxNumber;
    type ConsecutiveRepliesMaxNumber = ConsecutiveRepliesMaxNumber;

    type BlogId = u32;
    type PostId = u32;
    type ReplyId = u32;
}

pub struct ExtBuilder {
    post_title_max_length: u32,
    post_body_max_length: u32,
    reply_max_length: u32,
    posts_max_number: u32,
    replies_max_number: u32,
    direct_replies_max_number: u32,
    consecutive_replies_max_number: u16,
}

impl Default for ExtBuilder {
    fn default() -> Self {
        Self {
            post_title_max_length: 200,
            post_body_max_length: 10_000,
            reply_max_length: 2_000,
            posts_max_number: 20,
            replies_max_number: 100,
            direct_replies_max_number: 10,
            consecutive_replies_max_number: 3,
        }
    }
}

impl ExtBuilder {
    pub fn post_title_max_length(mut self, post_title_max_length: u32) -> Self {
        self.post_title_max_length = post_title_max_length;
        self
    }

    pub fn post_body_max_length(mut self, post_body_max_length: u32) -> Self {
        self.post_body_max_length = post_body_max_length;
        self
    }

    pub fn reply_max_length(mut self, reply_max_length: u32) -> Self {
        self.reply_max_length = reply_max_length;
        self
    }

    pub fn posts_max_number(mut self, posts_max_number: u32) -> Self {
        self.posts_max_number = posts_max_number;
        self
    }

    pub fn replies_max_number(mut self, replies_max_number: u32) -> Self {
        self.replies_max_number = replies_max_number;
        self
    }

    pub fn direct_replies_max_number(mut self, direct_replies_max_number: u32) -> Self {
        self.direct_replies_max_number = direct_replies_max_number;
        self
    }

    pub fn consecutive_replies_max_number(mut self, consecutive_replies_max_number: u16) -> Self {
        self.consecutive_replies_max_number = consecutive_replies_max_number;
        self
    }

    pub fn set_associated_consts(&self) {
        POST_TITLE_MAX_LENGTH.with(|v| *v.borrow_mut() = self.post_title_max_length);
        POST_BODY_MAX_LENGTH.with(|v| *v.borrow_mut() = self.post_body_max_length);
        REPLY_MAX_LENGTH.with(|v| *v.borrow_mut() = self.reply_max_length);

        POSTS_MAX_NUMBER.with(|v| *v.borrow_mut() = self.posts_max_number);
        REPLIES_MAX_NUMBER.with(|v| *v.borrow_mut() = self.replies_max_number);
        DIRECT_REPLIES_MAX_NUMBER.with(|v| *v.borrow_mut() = self.direct_replies_max_number);

        CONSECUTIVE_REPLIES_MAX_NUMBER
            .with(|v| *v.borrow_mut() = self.consecutive_replies_max_number);
    }

    pub fn build(self) -> TestExternalities {
        self.set_associated_consts();
        let t = system::GenesisConfig::default()
            .build_storage::<Runtime>()
            .unwrap();
        t.into()
    }
}

// Assign back to type variables so we can make dispatched calls of these modules later.
pub type System = system::Module<Runtime>;
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
    <Runtime as system::Trait>::AccountId,
    <Runtime as Trait>::BlogId,
    <Runtime as Trait>::PostId,
    <Runtime as Trait>::ReplyId,
>;

pub fn get_test_event(raw_event: RawTestEvent) -> TestEvent {
    TestEvent::test_events(raw_event)
}

// Blogs
pub fn blogs_count() -> <Runtime as Trait>::BlogId {
    TestBlogModule::blogs_count()
}

pub fn blog_by_id(blog_id: <Runtime as Trait>::BlogId) -> Option<Blog<Runtime>> {
    TestBlogModule::blog_by_id(blog_id)
}

pub fn create_blog(origin_id: u64) -> Result<(), &'static str> {
    TestBlogModule::create_blog(Origin::signed(origin_id))
}

pub fn lock_blog(origin_id: u64, blog_id: <Runtime as Trait>::BlogId) -> Result<(), &'static str> {
    TestBlogModule::lock_blog(Origin::signed(origin_id), blog_id)
}

pub fn unlock_blog(
    origin_id: u64,
    blog_id: <Runtime as Trait>::BlogId,
) -> Result<(), &'static str> {
    TestBlogModule::unlock_blog(Origin::signed(origin_id), blog_id)
}

// Posts
pub fn post_by_id(
    post_id: <Runtime as Trait>::PostId,
    blog_id: <Runtime as Trait>::BlogId,
) -> Option<Post<Runtime>> {
    TestBlogModule::post_by_id(blog_id, post_id)
}

pub fn get_post(post_type: PostType, editing: bool) -> Post<Runtime> {
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
    Post::new(title, body)
}

pub fn create_post(
    origin_id: u64,
    blog_id: <Runtime as Trait>::BlogId,
    post_type: PostType,
) -> Result<(), &'static str> {
    let post = get_post(post_type, false);
    TestBlogModule::create_post(Origin::signed(origin_id), blog_id, post.title, post.body)
}

pub fn lock_post(
    origin_id: u64,
    blog_id: <Runtime as Trait>::BlogId,
    post_id: <Runtime as Trait>::PostId,
) -> Result<(), &'static str> {
    TestBlogModule::lock_post(Origin::signed(origin_id), blog_id, post_id)
}

pub fn unlock_post(
    origin_id: u64,
    blog_id: <Runtime as Trait>::BlogId,
    post_id: <Runtime as Trait>::PostId,
) -> Result<(), &'static str> {
    TestBlogModule::unlock_post(Origin::signed(origin_id), blog_id, post_id)
}

pub fn edit_post(
    origin_id: u64,
    blog_id: <Runtime as Trait>::BlogId,
    post_id: <Runtime as Trait>::PostId,
    post_type: PostType,
) -> Result<(), &'static str> {
    let post = get_post(post_type, true);
    TestBlogModule::edit_post(
        Origin::signed(origin_id),
        blog_id,
        post_id,
        Some(post.title),
        Some(post.body),
    )
}

// Replies
pub fn reply_by_id(
    blog_id: <Runtime as Trait>::BlogId,
    post_id: <Runtime as Trait>::PostId,
    reply_id: <Runtime as Trait>::ReplyId,
) -> Option<Reply<Runtime>> {
    TestBlogModule::reply_by_id((blog_id, post_id, reply_id))
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
    owner: <Runtime as system::Trait>::AccountId,
    parent_id: Parent<Runtime>,
    editing: bool,
) -> Reply<Runtime> {
    let reply_text = get_reply_text(reply_type, editing);
    Reply::new(reply_text, owner, parent_id)
}

pub fn create_reply(
    origin_id: u64,
    blog_id: <Runtime as Trait>::BlogId,
    post_id: <Runtime as Trait>::PostId,
    reply_id: Option<<Runtime as Trait>::ReplyId>,
    reply_type: ReplyType,
) -> Result<(), &'static str> {
    let reply = get_reply_text(reply_type, false);
    TestBlogModule::create_reply(Origin::signed(origin_id), blog_id, post_id, reply_id, reply)
}

pub fn edit_reply(
    origin_id: u64,
    blog_id: <Runtime as Trait>::BlogId,
    post_id: <Runtime as Trait>::PostId,
    reply_id: <Runtime as Trait>::ReplyId,
    reply_type: ReplyType,
) -> Result<(), &'static str> {
    let reply = get_reply_text(reply_type, true);
    TestBlogModule::edit_reply(Origin::signed(origin_id), blog_id, post_id, reply_id, reply)
}
