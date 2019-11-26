use node_runtime::{
    forum::{
        Category, CategoryId, InputValidationLengthConstraint, Post, PostId, Thread, ThreadId,
    },
    AccountId, BlockNumber, ForumConfig, Moment,
};
use serde::{Deserialize, Serialize};
use serde_json::Result;

#[derive(Serialize, Deserialize)]
struct ForumData {
    categories: Vec<(CategoryId, Category<BlockNumber, Moment, AccountId>)>,
    posts: Vec<(PostId, Post<BlockNumber, Moment, AccountId>)>,
    threads: Vec<(ThreadId, Thread<BlockNumber, Moment, AccountId>)>,
}

fn parse_forum_json() -> Result<ForumData> {
    let data = include_str!("../res/forum_data.json");
    serde_json::from_str(data)
}

fn new_validation(min: u16, max_min_diff: u16) -> InputValidationLengthConstraint {
    return InputValidationLengthConstraint { min, max_min_diff };
}

pub fn create(forum_sudo: AccountId) -> ForumConfig {
    let forum_data = parse_forum_json().expect("failed loading forum data");

    let next_category_id: CategoryId = forum_data
        .categories
        .last()
        .map_or(1, |category| category.0 + 1);
    let next_thread_id: ThreadId = forum_data.threads.last().map_or(1, |thread| thread.0 + 1);
    let next_post_id: PostId = forum_data.posts.last().map_or(1, |post| post.0 + 1);

    ForumConfig {
        category_by_id: forum_data.categories,
        thread_by_id: forum_data.threads,
        post_by_id: forum_data.posts,
        next_category_id,
        next_thread_id,
        next_post_id,
        forum_sudo,
        category_title_constraint: new_validation(10, 90),
        category_description_constraint: new_validation(10, 490),
        thread_title_constraint: new_validation(10, 90),
        post_text_constraint: new_validation(10, 990),
        thread_moderation_rationale_constraint: new_validation(10, 290),
        post_moderation_rationale_constraint: new_validation(10, 290),
    }
}
