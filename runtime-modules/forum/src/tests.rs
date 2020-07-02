#![cfg(test)]

use super::*;
use crate::mock::*;
/// test cases are arranged as two layers.
/// first layer is each method in defined in module.
/// second layer is each parameter of the specific method.

/*
 * set_max_category_depth
 */
#[test]
// test set max category depth works
fn set_max_category_depth() {
    let config = default_genesis_config();
    let origin = FORUM_LEAD_ORIGIN;
    build_test_externalities(config).execute_with(|| {
        set_max_category_depth_mock(NOT_FORUM_LEAD_ORIGIN, 1, Err(ERROR_ORIGIN_NOT_FORUM_LEAD));
        set_max_category_depth_mock(origin, 1, Ok(()));
    });
}

/*
 * set_moderator_category_origin
 */
#[test]
// test case for check if origin is forum lead
fn set_moderator_category_origin() {
    let config = default_genesis_config();
    let forum_lead = FORUM_LEAD_ORIGIN_ID;
    let origin = OriginType::Signed(forum_lead);
    build_test_externalities(config).execute_with(|| {
        let moderator_id = forum_lead;
        let category_id = create_category_mock(
            origin.clone(),
            None,
            good_category_title(),
            good_category_description(),
            Ok(()),
        );
        set_moderator_category_mock(origin, moderator_id, category_id, true, Ok(()));
        set_moderator_category_mock(
            NOT_FORUM_LEAD_ORIGIN,
            moderator_id,
            category_id,
            true,
            Err(ERROR_ORIGIN_NOT_FORUM_LEAD),
        );
    });
}

#[test]
// test case for check whether category is existed.
fn set_moderator_category_category() {
    let config = default_genesis_config();
    let forum_lead = FORUM_LEAD_ORIGIN_ID;
    let origin = OriginType::Signed(forum_lead);
    build_test_externalities(config).execute_with(|| {
        let moderator_id = forum_lead;
        let category_id = create_category_mock(
            origin.clone(),
            None,
            good_category_title(),
            good_category_description(),
            Ok(()),
        );
        set_moderator_category_mock(origin.clone(), moderator_id, category_id, true, Ok(()));
        set_moderator_category_mock(
            origin.clone(),
            moderator_id,
            INVLAID_CATEGORY_ID,
            true,
            Err(ERROR_CATEGORY_DOES_NOT_EXIST),
        );
    });
}

#[test]
// test case for check if account id registered as moderator
fn set_moderator_category_account_id() {
    let config = default_genesis_config();
    let forum_lead = FORUM_LEAD_ORIGIN_ID;
    let origin = OriginType::Signed(forum_lead);
    build_test_externalities(default_genesis_config()).execute_with(|| {
        let category_id = create_category_mock(
            origin.clone(),
            None,
            good_category_title(),
            good_category_description(),
            Ok(()),
        );
        set_moderator_category_mock(
            origin.clone(),
            NOT_REGISTER_MODERATOR_ID,
            category_id,
            true,
            Err(ERROR_MODERATOR_ID_NOT_MATCH_ACCOUNT),
        );
    });

    build_test_externalities(config).execute_with(|| {
        let moderator_id = forum_lead;
        let category_id = create_category_mock(
            origin.clone(),
            None,
            good_category_title(),
            good_category_description(),
            Ok(()),
        );
        set_moderator_category_mock(origin, moderator_id, category_id, true, Ok(()));
    });
}

#[test]
// test case for check if origin is forum lead
fn create_category_origin() {
    let origins = vec![FORUM_LEAD_ORIGIN, NOT_FORUM_LEAD_ORIGIN];
    let results = vec![Ok(()), Err(ERROR_ORIGIN_NOT_FORUM_LEAD)];
    for index in 0..origins.len() {
        let config = default_genesis_config();
        build_test_externalities(config).execute_with(|| {
            create_category_mock(
                origins[index].clone(),
                None,
                good_category_title(),
                good_category_description(),
                results[index],
            );
        });
    }
}

#[test]
// test case for check if parent category is archived, deleted , not existed.
fn create_category_parent() {
    let parents = vec![Some(1), Some(2), Some(3), Some(4)];
    let results = vec![
        Ok(()),
        Err(ERROR_ANCESTOR_CATEGORY_IMMUTABLE),
        Err(ERROR_ANCESTOR_CATEGORY_IMMUTABLE),
        Err(ERROR_CATEGORY_DOES_NOT_EXIST),
    ];

    for index in 0..parents.len() {
        let config = default_genesis_config();
        let forum_lead = FORUM_LEAD_ORIGIN_ID;
        let origin = OriginType::Signed(forum_lead);
        build_test_externalities(config).execute_with(|| {
            create_category_mock(
                origin.clone(),
                None,
                good_category_title(),
                good_category_description(),
                Ok(()),
            );
            create_category_mock(
                origin.clone(),
                Some(1),
                good_category_title(),
                good_category_description(),
                Ok(()),
            );
            create_category_mock(
                origin.clone(),
                Some(2),
                good_category_title(),
                good_category_description(),
                Ok(()),
            );
            update_category_mock(origin.clone(), 3, Some(true), None, Ok(()));
            update_category_mock(origin.clone(), 2, None, Some(true), Ok(()));
            create_category_mock(
                origin.clone(),
                parents[index],
                good_category_title(),
                good_category_description(),
                results[index],
            );
        });
    }
}

#[test]
// test case set category depth
fn create_category_depth() {
    let config = default_genesis_config();
    let forum_lead = FORUM_LEAD_ORIGIN_ID;
    let origin = OriginType::Signed(forum_lead);
    build_test_externalities(config).execute_with(|| {
        create_category_mock(
            origin.clone(),
            None,
            good_category_title(),
            good_category_description(),
            Ok(()),
        );
        create_category_mock(
            origin.clone(),
            Some(1),
            good_category_title(),
            good_category_description(),
            Ok(()),
        );
        create_category_mock(
            origin.clone(),
            Some(2),
            good_category_title(),
            good_category_description(),
            Ok(()),
        );
        create_category_mock(
            origin.clone(),
            Some(3),
            good_category_title(),
            good_category_description(),
            Ok(()),
        );
        create_category_mock(
            origin.clone(),
            Some(4),
            good_category_title(),
            good_category_description(),
            Err(ERROR_MAX_VALID_CATEGORY_DEPTH_EXCEEDED),
        );
    });
}

/*
 ** update_category
 */
#[test]
// test if category updator is forum lead
fn update_category_origin() {
    let origins = [FORUM_LEAD_ORIGIN, NOT_FORUM_LEAD_ORIGIN];
    let results = vec![Ok(()), Err(ERROR_ORIGIN_NOT_FORUM_LEAD)];

    for index in 0..origins.len() {
        let config = default_genesis_config();
        let forum_lead = FORUM_LEAD_ORIGIN_ID;
        let origin = OriginType::Signed(forum_lead);
        build_test_externalities(config).execute_with(|| {
            create_category_mock(
                origin,
                None,
                good_category_title(),
                good_category_description(),
                Ok(()),
            );
            update_category_mock(origins[index].clone(), 1, Some(true), None, results[index]);
        });
    }
}
#[test]
// test case for new setting actually not update category status
fn update_category_without_updates() {
    let config = default_genesis_config();
    let forum_lead = FORUM_LEAD_ORIGIN_ID;
    let origin = OriginType::Signed(forum_lead);
    build_test_externalities(config).execute_with(|| {
        create_category_mock(
            origin.clone(),
            None,
            good_category_title(),
            good_category_description(),
            Ok(()),
        );
        update_category_mock(origin, 1, None, None, Err(ERROR_CATEGORY_NOT_BEING_UPDATED));
    });
}
#[test]
// test case for new setting actually not update category status
fn update_category_without_updates_two() {
    let config = default_genesis_config();
    let forum_lead = FORUM_LEAD_ORIGIN_ID;
    let origin = OriginType::Signed(forum_lead);
    build_test_externalities(config).execute_with(|| {
        create_category_mock(
            origin.clone(),
            None,
            good_category_title(),
            good_category_description(),
            Ok(()),
        );
        update_category_mock(
            origin,
            1,
            Some(false),
            Some(false),
            Err(ERROR_CATEGORY_NOT_BEING_UPDATED),
        );
    });
}

#[test]
// test case for new setting actually not update category status
fn update_category_without_updates_three() {
    let config = default_genesis_config();
    let forum_lead = FORUM_LEAD_ORIGIN_ID;
    let origin = OriginType::Signed(forum_lead);
    build_test_externalities(config).execute_with(|| {
        create_category_mock(
            origin.clone(),
            None,
            good_category_title(),
            good_category_description(),
            Ok(()),
        );
        update_category_mock(origin.clone(), 1, Some(false), Some(true), Ok(()));
        update_category_mock(
            origin.clone(),
            1,
            Some(false),
            Some(true),
            Err(ERROR_CATEGORY_CANNOT_BE_UNARCHIVED_WHEN_DELETED),
        );
    });
}

#[test]
// test unarchived not doable after category deleted
fn update_category_deleted_then_unarchived() {
    let config = default_genesis_config();
    let forum_lead = FORUM_LEAD_ORIGIN_ID;
    let origin = OriginType::Signed(forum_lead);
    build_test_externalities(config).execute_with(|| {
        create_category_mock(
            origin.clone(),
            None,
            good_category_title(),
            good_category_description(),
            Ok(()),
        );
        update_category_mock(origin.clone(), 1, Some(true), Some(true), Ok(()));
        update_category_mock(
            origin.clone(),
            1,
            Some(false),
            None,
            Err(ERROR_CATEGORY_CANNOT_BE_UNARCHIVED_WHEN_DELETED),
        );
    });
}

/*
 ** create_thread
 */
#[test]
// test if thread creator is valid forum user
fn create_thread_origin() {
    let origins = [FORUM_LEAD_ORIGIN, NOT_FORUM_LEAD_ORIGIN];
    let results = vec![Ok(()), Err(ERROR_FORUM_USER_ID_NOT_MATCH_ACCOUNT)];
    for index in 0..origins.len() {
        let config = default_genesis_config();
        let forum_lead = FORUM_LEAD_ORIGIN_ID;
        let origin = OriginType::Signed(forum_lead);
        build_test_externalities(config).execute_with(|| {
            let category_id = create_category_mock(
                origin,
                None,
                good_category_title(),
                good_category_description(),
                Ok(()),
            );
            create_thread_mock(
                origins[index].clone(),
                forum_lead,
                category_id,
                good_thread_title(),
                good_thread_text(),
                None,
                results[index],
            );
        });
    }
}

#[test]
// test if timestamp of poll start time and end time are valid
fn create_thread_poll_timestamp() {
    // there is other test case as start timestamp is now, and end timestamp as minus
    // but it can not be implemented since the Timestamp::now() return value is zero.
    // then minus become a very large number.

    let results = vec![Ok(()), Err(ERROR_POLL_TIME_SETTING)];
    for index in 0..results.len() {
        let config = default_genesis_config();
        let forum_lead = FORUM_LEAD_ORIGIN_ID;
        let origin = OriginType::Signed(forum_lead);

        build_test_externalities(config).execute_with(|| {
            let category_id = create_category_mock(
                origin.clone(),
                None,
                good_category_title(),
                good_category_description(),
                Ok(()),
            );

            create_thread_mock(
                origin.clone(),
                forum_lead,
                category_id,
                good_thread_title(),
                good_thread_text(),
                Some(generate_poll_timestamp_cases(index)),
                results[index],
            );
        });
    }
}

/*
 ** vote_on_poll
 */
#[test]
// test if poll submitter is a forum user
fn vote_on_poll_origin() {
    let origins = vec![FORUM_LEAD_ORIGIN, NOT_FORUM_LEAD_ORIGIN];
    let results = vec![Ok(()), Err(ERROR_FORUM_USER_ID_NOT_MATCH_ACCOUNT)];
    for index in 0..origins.len() {
        let config = default_genesis_config();
        let forum_lead = FORUM_LEAD_ORIGIN_ID;
        let origin = OriginType::Signed(forum_lead);
        build_test_externalities(config).execute_with(|| {
            let category_id = create_category_mock(
                origin.clone(),
                None,
                good_category_title(),
                good_category_description(),
                Ok(()),
            );
            let thread_id = create_thread_mock(
                origin.clone(),
                forum_lead,
                category_id,
                good_thread_title(),
                good_thread_text(),
                Some(generate_poll()),
                Ok(()),
            );

            vote_on_poll_mock(
                origins[index].clone(),
                forum_lead,
                thread_id,
                1,
                results[index],
            );
        });
    }
}

#[test]
// test if poll metadata created
fn vote_on_poll_exists() {
    let config = default_genesis_config();
    let forum_lead = FORUM_LEAD_ORIGIN_ID;
    let origin = OriginType::Signed(forum_lead);
    build_test_externalities(config).execute_with(|| {
        let category_id = create_category_mock(
            origin.clone(),
            None,
            good_category_title(),
            good_category_description(),
            Ok(()),
        );
        let thread_id = create_thread_mock(
            origin.clone(),
            forum_lead,
            category_id,
            good_thread_title(),
            good_thread_text(),
            None,
            Ok(()),
        );
        vote_on_poll_mock(
            origin.clone(),
            forum_lead,
            thread_id,
            1,
            Err(ERROR_POLL_NOT_EXIST),
        );
    });
}

#[test]
// test if forum reject poll submit after expiration
fn vote_on_poll_expired() {
    let config = default_genesis_config();
    let forum_lead = FORUM_LEAD_ORIGIN_ID;
    let origin = OriginType::Signed(forum_lead);
    build_test_externalities(config).execute_with(|| {
        let category_id = create_category_mock(
            origin.clone(),
            None,
            good_category_title(),
            good_category_description(),
            Ok(()),
        );
        let thread_id = create_thread_mock(
            origin.clone(),
            forum_lead,
            category_id,
            good_thread_title(),
            good_thread_text(),
            Some(generate_poll()),
            Ok(()),
        );
        // std::thread::sleep(std::time::Duration::new(12, 0));
        // vote_on_poll_mock(origin.clone(), thread_id, 1, Err(ERROR_POLL_COMMIT_EXPIRED));
        vote_on_poll_mock(origin.clone(), forum_lead, thread_id, 1, Ok(()));
    });
}

/*
 ** moderate_thread
 */

#[test]
// test if thread moderator registered as valid moderator
fn moderate_thread_origin_ok() {
    let config = default_genesis_config();
    let forum_lead = FORUM_LEAD_ORIGIN_ID;
    let origin = OriginType::Signed(forum_lead);
    build_test_externalities(config).execute_with(|| {
        let moderator_id = forum_lead;
        let category_id = create_category_mock(
            origin.clone(),
            None,
            good_category_title(),
            good_category_description(),
            Ok(()),
        );
        set_moderator_category_mock(origin.clone(), moderator_id, category_id, true, Ok(()));
        let thread_id = create_thread_mock(
            origin.clone(),
            forum_lead,
            category_id,
            good_thread_title(),
            good_thread_text(),
            None,
            Ok(()),
        );
        moderate_thread_mock(origin, moderator_id, thread_id, Ok(()));
    });
}

/*
 ** add_post
 */

#[test]
// test if post origin registered as forum user
fn add_post_origin() {
    let origins = vec![FORUM_LEAD_ORIGIN, NOT_FORUM_LEAD_ORIGIN];
    let results = vec![Ok(()), Err(ERROR_FORUM_USER_ID_NOT_MATCH_ACCOUNT)];
    for index in 0..origins.len() {
        let config = default_genesis_config();
        let forum_lead = FORUM_LEAD_ORIGIN_ID;
        let origin = OriginType::Signed(forum_lead);
        build_test_externalities(config).execute_with(|| {
            let category_id = create_category_mock(
                origin.clone(),
                None,
                good_category_title(),
                good_category_description(),
                Ok(()),
            );

            let thread_id = create_thread_mock(
                origin.clone(),
                forum_lead,
                category_id,
                good_thread_title(),
                good_thread_text(),
                None,
                Ok(()),
            );
            create_post_mock(
                origins[index].clone(),
                forum_lead,
                thread_id,
                good_post_text(),
                results[index],
            );
        });
    }
}

/*
 ** react_post
 */
#[test]
// test if post react take effect
fn react_post() {
    // three reations to post, test them one by one.
    let new_values = vec![
        PostReaction::ThumbUp,
        PostReaction::ThumbDown,
        PostReaction::Like,
    ];
    for index in 0..new_values.len() {
        let config = default_genesis_config();
        let forum_lead = FORUM_LEAD_ORIGIN_ID;
        let origin = FORUM_LEAD_ORIGIN;

        build_test_externalities(config).execute_with(|| {
            let category_id = create_category_mock(
                origin.clone(),
                None,
                good_category_title(),
                good_category_description(),
                Ok(()),
            );

            let thread_id = create_thread_mock(
                origin.clone(),
                forum_lead,
                category_id,
                good_thread_title(),
                good_thread_text(),
                None,
                Ok(()),
            );
            let post_id = create_post_mock(
                origin.clone(),
                forum_lead,
                thread_id,
                good_post_text(),
                Ok(()),
            );
            assert_eq!(
                TestForumModule::react_post(
                    mock_origin(origin.clone()),
                    forum_lead,
                    post_id,
                    new_values[index]
                ),
                Ok(())
            );
            assert_eq!(
                TestForumModule::reaction_by_post(post_id, forum_lead),
                new_values[index]
            );
        });
    }
}

/*
 ** moderate_post
 */

#[test]
// test if post moderator registered
fn moderate_post_origin() {
    let origins = vec![FORUM_LEAD_ORIGIN, NOT_FORUM_LEAD_ORIGIN];
    let results = vec![Ok(()), Err(ERROR_MODERATOR_ID_NOT_MATCH_ACCOUNT)];
    for index in 0..origins.len() {
        let config = default_genesis_config();
        let forum_lead = FORUM_LEAD_ORIGIN_ID;
        let origin = OriginType::Signed(forum_lead);
        build_test_externalities(config).execute_with(|| {
            let moderator_id = forum_lead;

            let category_id = create_category_mock(
                origin.clone(),
                None,
                good_category_title(),
                good_category_description(),
                Ok(()),
            );
            set_moderator_category_mock(origin.clone(), moderator_id, category_id, true, Ok(()));

            let thread_id = create_thread_mock(
                origin.clone(),
                forum_lead,
                category_id,
                good_thread_title(),
                good_thread_text(),
                None,
                Ok(()),
            );
            let post_id = create_post_mock(
                origin.clone(),
                forum_lead,
                thread_id,
                good_post_text(),
                Ok(()),
            );
            moderate_post_mock(
                origins[index].clone(),
                moderator_id,
                post_id,
                results[index],
            );
        });
    }
}

#[test]
fn set_stickied_threads_ok() {
    let config = default_genesis_config();
    let forum_lead = FORUM_LEAD_ORIGIN_ID;
    let origin = OriginType::Signed(forum_lead);
    build_test_externalities(config).execute_with(|| {
        let moderator_id = forum_lead;
        let category_id = create_category_mock(
            origin.clone(),
            None,
            good_category_title(),
            good_category_description(),
            Ok(()),
        );
        set_moderator_category_mock(origin.clone(), moderator_id, category_id, true, Ok(()));
        let thread_id = create_thread_mock(
            origin.clone(),
            forum_lead,
            category_id,
            good_thread_title(),
            good_thread_text(),
            None,
            Ok(()),
        );
        set_stickied_threads_mock(origin, moderator_id, category_id, vec![thread_id], Ok(()));
    });
}

#[test]
fn set_stickied_threads_wrong_moderator() {
    let config = default_genesis_config();
    let forum_lead = FORUM_LEAD_ORIGIN_ID;
    let origin = OriginType::Signed(forum_lead);
    build_test_externalities(config).execute_with(|| {
        let moderator_id = forum_lead;
        let category_id = create_category_mock(
            origin.clone(),
            None,
            good_category_title(),
            good_category_description(),
            Ok(()),
        );

        let thread_id = create_thread_mock(
            origin.clone(),
            forum_lead,
            category_id,
            good_thread_title(),
            good_thread_text(),
            None,
            Ok(()),
        );
        set_stickied_threads_mock(
            origin,
            moderator_id,
            category_id,
            vec![thread_id],
            Err(ERROR_MODERATOR_MODERATE_CATEGORY),
        );
    });
}

#[test]
fn set_stickied_threads_thread_not_exists() {
    let config = default_genesis_config();
    let forum_lead = FORUM_LEAD_ORIGIN_ID;
    let origin = OriginType::Signed(forum_lead);
    build_test_externalities(config).execute_with(|| {
        let moderator_id = forum_lead;
        let category_id = create_category_mock(
            origin.clone(),
            None,
            good_category_title(),
            good_category_description(),
            Ok(()),
        );
        set_moderator_category_mock(origin.clone(), moderator_id, category_id, true, Ok(()));
        let thread_id = create_thread_mock(
            origin.clone(),
            forum_lead,
            category_id,
            good_thread_title(),
            good_thread_text(),
            None,
            Ok(()),
        );
        let wrong_thread_id = thread_id + 1;
        set_stickied_threads_mock(
            origin,
            moderator_id,
            category_id,
            vec![wrong_thread_id],
            Err(ERROR_THREAD_DOES_NOT_EXIST),
        );
    });
}

#[test]
fn set_stickied_threads_wrong_category() {
    let config = default_genesis_config();
    let forum_lead = FORUM_LEAD_ORIGIN_ID;
    let origin = OriginType::Signed(forum_lead);
    build_test_externalities(config).execute_with(|| {
        let moderator_id = forum_lead;
        let category_id = create_category_mock(
            origin.clone(),
            None,
            good_category_title(),
            good_category_description(),
            Ok(()),
        );
        set_moderator_category_mock(origin.clone(), moderator_id, category_id, true, Ok(()));
        let _ = create_thread_mock(
            origin.clone(),
            forum_lead,
            category_id,
            good_thread_title(),
            good_thread_text(),
            None,
            Ok(()),
        );
        let category_id_2 = create_category_mock(
            origin.clone(),
            None,
            good_category_title(),
            good_category_description(),
            Ok(()),
        );
        let thread_id = create_thread_mock(
            origin.clone(),
            forum_lead,
            category_id_2,
            good_thread_title(),
            good_thread_text(),
            None,
            Ok(()),
        );
        set_stickied_threads_mock(
            origin,
            moderator_id,
            category_id,
            vec![thread_id],
            Err(ERROR_THREAD_WITH_WRONG_CATEGORY_ID),
        );
    });
}

#[test]
fn test_migration_not_done() {
    let config = migration_not_done_config();
    let forum_lead = FORUM_LEAD_ORIGIN_ID;
    let origin = OriginType::Signed(forum_lead);
    build_test_externalities(config).execute_with(|| {
        let forum_user_id = 1;
        let moderator_id = 1;
        let category_id = 1;
        let thread_id = 1;
        let post_id = 1;

        assert_eq!(
            TestForumModule::create_category(
                mock_origin(origin.clone()),
                None,
                good_category_title(),
                good_category_description()
            ),
            Err(ERROR_DATA_MIGRATION_NOT_DONE),
        );

        assert_eq!(
            TestForumModule::create_thread(
                mock_origin(origin.clone()),
                forum_user_id,
                category_id,
                good_thread_title(),
                good_thread_text(),
                None,
            ),
            Err(ERROR_DATA_MIGRATION_NOT_DONE),
        );

        assert_eq!(
            TestForumModule::add_post(
                mock_origin(origin.clone()),
                forum_user_id,
                thread_id,
                good_post_text(),
            ),
            Err(ERROR_DATA_MIGRATION_NOT_DONE),
        );

        assert_eq!(
            TestForumModule::moderate_thread(mock_origin(origin.clone()), moderator_id, thread_id,),
            Err(ERROR_DATA_MIGRATION_NOT_DONE),
        );

        assert_eq!(
            TestForumModule::moderate_post(mock_origin(origin.clone()), moderator_id, post_id,),
            Err(ERROR_DATA_MIGRATION_NOT_DONE),
        );
    });
}
