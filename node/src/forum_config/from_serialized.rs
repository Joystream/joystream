#![allow(clippy::type_complexity)]

use super::new_validation;
use node_runtime::{
    forum::{Category, CategoryId, Post, Thread},
    AccountId, BlockNumber, ForumConfig, Moment, PostId, ThreadId,
};
use serde::Deserialize;
use serde_json::Result;

#[derive(Deserialize)]
struct ForumData {
    categories: Vec<(CategoryId, Category<BlockNumber, Moment, AccountId>)>,
    posts: Vec<(
        PostId,
        Post<BlockNumber, Moment, AccountId, ThreadId, PostId>,
    )>,
    threads: Vec<(ThreadId, Thread<BlockNumber, Moment, AccountId, ThreadId>)>,
}

fn parse_forum_json() -> Result<ForumData> {
    let data = include_str!("../../res/forum_data_empty.json");
    serde_json::from_str(data)
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
        category_title_constraint: new_validation(10, 90),
        category_description_constraint: new_validation(10, 490),
        thread_title_constraint: new_validation(10, 90),
        post_text_constraint: new_validation(10, 990),
        thread_moderation_rationale_constraint: new_validation(10, 290),
        post_moderation_rationale_constraint: new_validation(10, 290),
        forum_sudo,
    }
}
