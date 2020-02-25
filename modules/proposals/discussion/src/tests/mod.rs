mod mock;

use mock::*;

use system::RawOrigin;

#[test]
fn create_discussion_call_succeeds() {
    initial_test_ext().execute_with(|| {
        let origin = RawOrigin::Signed(1);
        let create_discussion_result =
            Discussions::create_discussion(origin.into(), b"title".to_vec());

        assert_eq!(create_discussion_result, Ok(()));
    });
}
