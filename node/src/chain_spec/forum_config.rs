use node_runtime::ForumConfig;

/// Generates a basic empty `ForumConfig` geneis config
pub fn empty() -> ForumConfig {
    ForumConfig {
        category_by_id: vec![],
        thread_by_id: vec![],
        post_by_id: vec![],
        category_by_moderator: vec![],
        next_category_id: 1,
        next_thread_id: 1,
        next_post_id: 1,
        category_counter: 0,
        data_migration_done: true,
    }
}
