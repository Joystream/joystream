mod mock;

use mock::{build_test_externalities, Test};

#[test]
fn mock_test() {
    build_test_externalities().execute_with(|| {
        assert!(true);
    });
}
