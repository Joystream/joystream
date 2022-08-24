use node_runtime::ForumConfig;

/// Generates a basic empty `ForumConfig` geneis config
pub fn empty() -> ForumConfig {
    ForumConfig {
        next_category_id: 1,
        next_thread_id: 1,
        next_post_id: 1,
        category_counter: 0,
    }
}
