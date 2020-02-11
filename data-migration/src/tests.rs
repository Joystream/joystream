#![cfg(test)]

use super::*;
use crate::mock::*;

#[test]
fn data_migration_test() {
    let config = generate_genesis_config();
    build_test_externalities(config).execute_with(|| {
        // set configuration
        set_migration_config_mock(0, 10, 10, 10);
        // create data for old forum
        create_migration_data_mock(FORUM_SUDO, 10, 10, b"Default text".to_vec());
        // need four iteration to migrate category, thread and post.
        for index in 0..4 {
            assert_eq!(TestModule::data_migration_done(), false);
            on_initialize_mock(index);
        }
        assert_eq!(TestModule::data_migration_done(), true);
        // assert_eq!(true, false);
    });
}
