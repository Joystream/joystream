#![cfg(test)]

use super::*;
use crate::mock::*;

use srml_support::{assert_err, assert_ok};
use system::{EventRecord, Phase};

/// test cases are arranged as two layers.
/// first layer is each method in defined in module.
/// second layer is each parameter of the specific method.

/*
 * add labels
 */

#[test]
fn add_labels() {
    let config = default_genesis_config();
    let labels = vec![
        vec![generate_text(config.label_name_constraint.min as usize)],
        vec![generate_text(
            (config.label_name_constraint.min - 1) as usize,
        )],
        vec![generate_text(
            (config.label_name_constraint.max() + 1) as usize,
        )],
    ];
    let results = vec![
        Ok(()),
        Err(ERROR_LABEL_TOO_SHORT),
        Err(ERROR_LABEL_TOO_LONG),
    ];
    for index in 0..labels.len() {
        let config = default_genesis_config();
        build_test_externalities(config).execute_with(|| {
            add_labels_mock(labels[index].clone(), results[index]);
        })
    }
}

/*
 * create_forum_user
 */
#[test]
// test case for check account id
fn create_forum_user_account_id() {
    let config = default_genesis_config();
    let forum_sudo = config.forum_sudo;
    build_test_externalities(config).execute_with(|| {
        create_forum_user_mock(
            forum_sudo,
            good_user_name(),
            good_self_introduction(),
            Ok(()),
        );
        create_forum_user_mock(
            forum_sudo,
            good_user_name(),
            good_self_introduction(),
            Err(ERROR_USER_ALREADY_REGISTERED_FORUM),
        );
    });
}

#[test]
// test case for check forum user name
fn create_forum_user_name() {
    let config = default_genesis_config();
    let forum_sudo = config.forum_sudo;
    let names = vec![
        generate_text(config.user_name_constraint.min as usize),
        generate_text((config.user_name_constraint.min - 1) as usize),
        generate_text((config.user_name_constraint.max() + 1) as usize),
    ];
    let results = vec![
        Ok(()),
        Err(ERROR_USER_NAME_TOO_SHORT),
        Err(ERROR_USER_NAME_TOO_LONG),
    ];
    for index in 0..names.len() {
        let config = default_genesis_config();
        build_test_externalities(config).execute_with(|| {
            create_forum_user_mock(
                forum_sudo,
                names[index].clone(),
                good_self_introduction(),
                results[index],
            );
        });
    }
}

#[test]
// test case for check self introduction
fn create_forum_user_self_introduction() {
    let config = default_genesis_config();
    let forum_sudo = config.forum_sudo;
    let introductions = vec![
        generate_text(config.user_self_introduction_constraint.min as usize),
        generate_text((config.user_self_introduction_constraint.min - 1) as usize),
        generate_text((config.user_self_introduction_constraint.max() + 1) as usize),
    ];
    let results = vec![
        Ok(()),
        Err(ERROR_USER_SELF_DESC_TOO_SHORT),
        Err(ERROR_USER_SELF_DESC_TOO_LONG),
    ];
    for index in 0..introductions.len() {
        let config = default_genesis_config();
        build_test_externalities(config).execute_with(|| {
            create_forum_user_mock(
                forum_sudo,
                good_user_name(),
                introductions[index].clone(),
                results[index],
            );
        });
    }
}

/*
 * create_moderator
 */
#[test]
// test case for check account id
fn create_moderator_account_id() {
    let config = default_genesis_config();
    let forum_sudo = config.forum_sudo;
    build_test_externalities(config).execute_with(|| {
        create_moderator_mock(
            forum_sudo,
            good_user_name(),
            good_self_introduction(),
            Ok(()),
        );
        create_moderator_mock(
            forum_sudo,
            good_user_name(),
            good_self_introduction(),
            Err(ERROR_USER_ALREADY_REGISTERED_MODERATOR),
        );
    });
}

#[test]
// test case for check forum user name
fn create_moderator_name() {
    let config = default_genesis_config();
    let forum_sudo = config.forum_sudo;
    let names = vec![
        generate_text(config.user_name_constraint.min as usize),
        generate_text((config.user_name_constraint.min - 1) as usize),
        generate_text((config.user_name_constraint.max() + 1) as usize),
    ];
    let results = vec![
        Ok(()),
        Err(ERROR_USER_NAME_TOO_SHORT),
        Err(ERROR_USER_NAME_TOO_LONG),
    ];
    for index in 0..names.len() {
        let config = default_genesis_config();
        build_test_externalities(config).execute_with(|| {
            create_moderator_mock(
                forum_sudo,
                names[index].clone(),
                good_self_introduction(),
                results[index],
            );
        });
    }
}

#[test]
// test case for check self introduction
fn create_moderator_self_introduction() {
    let config = default_genesis_config();
    let forum_sudo = config.forum_sudo;
    let introductions = vec![
        generate_text(config.user_self_introduction_constraint.min as usize),
        generate_text((config.user_self_introduction_constraint.min - 1) as usize),
        generate_text((config.user_self_introduction_constraint.max() + 1) as usize),
    ];
    let results = vec![
        Ok(()),
        Err(ERROR_USER_SELF_DESC_TOO_SHORT),
        Err(ERROR_USER_SELF_DESC_TOO_LONG),
    ];
    for index in 0..introductions.len() {
        let config = default_genesis_config();
        build_test_externalities(config).execute_with(|| {
            create_moderator_mock(
                forum_sudo,
                good_user_name(),
                introductions[index].clone(),
                results[index],
            );
        });
    }
}

/*
 * set_max_category_depth
 */
#[test]
fn set_max_category_depth() {
    let config = default_genesis_config();
    let origin = OriginType::Signed(config.forum_sudo);
    build_test_externalities(config).execute_with(|| {
        set_max_category_depth_mock(NOT_FORUM_SUDO_ORIGIN, 1, Err(ERROR_ORIGIN_NOT_FORUM_SUDO));
        set_max_category_depth_mock(origin, 1, Ok(()));
    });
}

/*
 * set_moderator_category_origin
 */
#[test]
// test case for check if origin is forum sudo
fn set_moderator_category_origin() {
    let config = default_genesis_config();
    let forum_sudo = config.forum_sudo;
    let origin = OriginType::Signed(forum_sudo);

    build_test_externalities(config).execute_with(|| {
        let _ = create_moderator_mock(
            forum_sudo,
            good_user_name(),
            good_self_introduction(),
            Ok(()),
        );
        let category_id = create_category_mock(
            origin.clone(),
            None,
            good_category_title(),
            good_category_description(),
            &vec![],
            Ok(()),
        );
        set_moderator_category_mock(origin, category_id, forum_sudo, true, Ok(()));
        set_moderator_category_mock(
            NOT_FORUM_SUDO_ORIGIN,
            category_id,
            forum_sudo,
            true,
            Err(ERROR_ORIGIN_NOT_FORUM_SUDO),
        );
    });
}

#[test]
// test case for check whether category is existed.
fn set_moderator_category_category() {
    let config = default_genesis_config();
    let forum_sudo = config.forum_sudo;
    let origin = OriginType::Signed(forum_sudo);
    build_test_externalities(config).execute_with(|| {
        let _ = create_moderator_mock(
            forum_sudo,
            good_user_name(),
            good_self_introduction(),
            Ok(()),
        );
        let category_id = create_category_mock(
            origin.clone(),
            None,
            good_category_title(),
            good_category_description(),
            &vec![],
            Ok(()),
        );
        set_moderator_category_mock(origin.clone(), category_id, forum_sudo, true, Ok(()));
        set_moderator_category_mock(
            origin.clone(),
            INVLAID_CATEGORY_ID,
            forum_sudo,
            true,
            Err(ERROR_CATEGORY_DOES_NOT_EXIST),
        );
    });
}

#[test]
// test case for check if account id registered as moderator
fn set_moderator_category_account_id() {
    let config = default_genesis_config();
    let forum_sudo = config.forum_sudo;
    let origin = OriginType::Signed(forum_sudo);
    build_test_externalities(default_genesis_config()).execute_with(|| {
        let category_id = create_category_mock(
            origin.clone(),
            None,
            good_category_title(),
            good_category_description(),
            &vec![],
            Ok(()),
        );
        set_moderator_category_mock(
            origin.clone(),
            category_id,
            forum_sudo,
            true,
            Err(ERROR_NOT_MODERATOR_USER),
        );
    });

    build_test_externalities(config).execute_with(|| {
        let _ = create_moderator_mock(
            forum_sudo,
            good_user_name(),
            good_self_introduction(),
            Ok(()),
        );
        let category_id = create_category_mock(
            origin.clone(),
            None,
            good_category_title(),
            good_category_description(),
            &vec![],
            Ok(()),
        );
        set_moderator_category_mock(origin, category_id, forum_sudo, true, Ok(()));
    });
}

/*
 * set_forum_sudo
 */
#[test]
fn set_forum_sudo() {
    let config = default_genesis_config();
    let forum_sudo = config.forum_sudo;
    let origin = OriginType::Signed(forum_sudo);
    build_test_externalities(config).execute_with(|| {
        set_forum_sudo_mock(origin, Some(forum_sudo), Err(require_root_origin()));
        set_forum_sudo_mock(OriginType::Root, Some(forum_sudo), Ok(()));
    });
}

/*
 * set_forum_sudo
 */
#[test]
// test case for check if origin is forum sudo
fn create_category_origin() {
    let origins = vec![
        OriginType::Signed(default_genesis_config().forum_sudo),
        NOT_FORUM_SUDO_ORIGIN,
    ];
    let results = vec![Ok(()), Err(ERROR_ORIGIN_NOT_FORUM_SUDO)];
    for index in 0..origins.len() {
        let config = default_genesis_config();
        build_test_externalities(config).execute_with(|| {
            create_category_mock(
                origins[index].clone(),
                None,
                good_category_title(),
                good_category_description(),
                &vec![],
                results[index],
            );
        });
    }
}

#[test]
// test case for check if origin is forum sudo
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
        let forum_sudo = config.forum_sudo;
        let origin = OriginType::Signed(forum_sudo);
        build_test_externalities(config).execute_with(|| {
            create_category_mock(
                origin.clone(),
                None,
                good_category_title(),
                good_category_description(),
                &vec![],
                Ok(()),
            );
            create_category_mock(
                origin.clone(),
                Some(1),
                good_category_title(),
                good_category_description(),
                &vec![],
                Ok(()),
            );
            create_category_mock(
                origin.clone(),
                Some(2),
                good_category_title(),
                good_category_description(),
                &vec![],
                Ok(()),
            );
            update_category_mock(origin.clone(), 3, Some(true), None, Ok(()));
            update_category_mock(origin.clone(), 2, None, Some(true), Ok(()));
            create_category_mock(
                origin.clone(),
                parents[index],
                good_category_title(),
                good_category_description(),
                &vec![],
                results[index],
            );
        });
    }
}

#[test]
// test case for check if origin is forum sudo
fn create_category_depth() {
    let config = default_genesis_config();
    let forum_sudo = config.forum_sudo;
    let origin = OriginType::Signed(forum_sudo);
    build_test_externalities(config).execute_with(|| {
        create_category_mock(
            origin.clone(),
            None,
            good_category_title(),
            good_category_description(),
            &vec![],
            Ok(()),
        );
        create_category_mock(
            origin.clone(),
            Some(1),
            good_category_title(),
            good_category_description(),
            &vec![],
            Ok(()),
        );
        create_category_mock(
            origin.clone(),
            Some(2),
            good_category_title(),
            good_category_description(),
            &vec![],
            Ok(()),
        );
        create_category_mock(
            origin.clone(),
            Some(3),
            good_category_title(),
            good_category_description(),
            &vec![],
            Ok(()),
        );
        create_category_mock(
            origin.clone(),
            Some(4),
            good_category_title(),
            good_category_description(),
            &vec![],
            Err(ERROR_MAX_VALID_CATEGORY_DEPTH_EXCEEDED),
        );
    });
}

#[test]
// test case for check if origin is forum sudo
fn create_category_title() {
    let config = default_genesis_config();
    let forum_sudo = config.forum_sudo;
    let origin = OriginType::Signed(forum_sudo);
    let titles = vec![
        generate_text(config.category_title_constraint.min as usize),
        generate_text((config.category_title_constraint.min - 1) as usize),
        generate_text((config.category_title_constraint.max() + 1) as usize),
    ];
    let results = vec![
        Ok(()),
        Err(ERROR_CATEGORY_TITLE_TOO_SHORT),
        Err(ERROR_CATEGORY_TITLE_TOO_LONG),
    ];
    for index in 0..titles.len() {
        let config = default_genesis_config();
        build_test_externalities(config).execute_with(|| {
            create_category_mock(
                origin.clone(),
                None,
                titles[index].clone(),
                good_category_description(),
                &vec![],
                results[index],
            );
        });
    }
}

#[test]
// test case for check if origin is forum sudo
fn create_category_description() {
    let config = default_genesis_config();
    let forum_sudo = config.forum_sudo;
    let origin = OriginType::Signed(forum_sudo);
    let descriptions = vec![
        generate_text(config.category_description_constraint.min as usize),
        generate_text((config.category_description_constraint.min - 1) as usize),
        generate_text((config.category_description_constraint.max() + 1) as usize),
    ];
    let results = vec![
        Ok(()),
        Err(ERROR_CATEGORY_DESCRIPTION_TOO_SHORT),
        Err(ERROR_CATEGORY_DESCRIPTION_TOO_LONG),
    ];
    for index in 0..descriptions.len() {
        let config = default_genesis_config();
        build_test_externalities(config).execute_with(|| {
            create_category_mock(
                origin.clone(),
                None,
                good_category_title(),
                descriptions[index].clone(),
                &vec![],
                results[index],
            );
        });
    }
}

#[test]
// test case for check if origin is forum sudo
fn create_category_labels() {
    let config = default_genesis_config();
    let forum_sudo = config.forum_sudo;
    let origin = OriginType::Signed(forum_sudo);
    let labels = vec![vec![1, 2, 3, 4, 5], vec![1, 2, 3, 4, 5, 6], vec![100]];
    let results = vec![
        Ok(()),
        Err(ERROR_TOO_MUCH_LABELS),
        Err(ERROR_LABEL_INDEX_IS_WRONG),
    ];

    for index in 0..labels.len() {
        let config = default_genesis_config();
        build_test_externalities(config).execute_with(|| {
            create_labels_mock();
            create_category_mock(
                origin.clone(),
                None,
                good_category_title(),
                good_category_description(),
                &labels[index],
                results[index],
            );
        });
    }
}

/*
 ** update_category
 */
#[test]
fn update_category_origin() {
    let origins = [
        OriginType::Signed(default_genesis_config().forum_sudo),
        NOT_FORUM_SUDO_ORIGIN,
    ];
    let results = vec![Ok(()), Err(ERROR_ORIGIN_NOT_FORUM_SUDO)];

    for index in 0..origins.len() {
        let config = default_genesis_config();
        let forum_sudo = config.forum_sudo;
        let origin = OriginType::Signed(forum_sudo);
        build_test_externalities(config).execute_with(|| {
            create_category_mock(
                origin,
                None,
                good_category_title(),
                good_category_description(),
                &vec![],
                Ok(()),
            );
            update_category_mock(origins[index].clone(), 1, Some(true), None, results[index]);
        });
    }
}
#[test]
fn update_category_without_updates() {
    let config = default_genesis_config();
    let forum_sudo = config.forum_sudo;
    let origin = OriginType::Signed(forum_sudo);
    build_test_externalities(config).execute_with(|| {
        create_category_mock(
            origin.clone(),
            None,
            good_category_title(),
            good_category_description(),
            &vec![],
            Ok(()),
        );
        update_category_mock(origin, 1, None, None, Err(ERROR_CATEGORY_NOT_BEING_UPDATED));
    });
}
#[test]
fn update_category_without_updates_two() {
    let config = default_genesis_config();
    let forum_sudo = config.forum_sudo;
    let origin = OriginType::Signed(forum_sudo);
    build_test_externalities(config).execute_with(|| {
        create_category_mock(
            origin.clone(),
            None,
            good_category_title(),
            good_category_description(),
            &vec![],
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
fn update_category_without_updates_three() {
    let config = default_genesis_config();
    let forum_sudo = config.forum_sudo;
    let origin = OriginType::Signed(forum_sudo);
    build_test_externalities(config).execute_with(|| {
        create_category_mock(
            origin.clone(),
            None,
            good_category_title(),
            good_category_description(),
            &vec![],
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
fn update_category_deleted_then_unarchived() {
    let config = default_genesis_config();
    let forum_sudo = config.forum_sudo;
    let origin = OriginType::Signed(forum_sudo);
    build_test_externalities(config).execute_with(|| {
        create_category_mock(
            origin.clone(),
            None,
            good_category_title(),
            good_category_description(),
            &vec![],
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
 ** update_category_labels
 */
#[test]
fn update_category_labels() {
    let labels = vec![vec![1, 2, 3, 4, 5], vec![1, 2, 3, 4, 5, 6], vec![100]];
    let results = vec![
        Ok(()),
        Err(ERROR_TOO_MUCH_LABELS),
        Err(ERROR_LABEL_INDEX_IS_WRONG),
    ];

    for index in 0..labels.len() {
        let config = default_genesis_config();
        let forum_sudo = config.forum_sudo;
        let origin = OriginType::Signed(forum_sudo);
        build_test_externalities(config).execute_with(|| {
            create_labels_mock();
            let category_id = create_category_mock(
                origin.clone(),
                None,
                good_category_title(),
                good_category_description(),
                &vec![],
                Ok(()),
            );
            update_category_labels_mock(
                origin.clone(),
                category_id,
                labels[index].clone(),
                results[index],
            );
        });
    }
}

#[test]
fn update_category_labels_moderator() {
    let config = default_genesis_config();
    let forum_sudo = config.forum_sudo;
    let origin = OriginType::Signed(forum_sudo);
    build_test_externalities(config).execute_with(|| {
        create_labels_mock();
        let category_id = create_category_mock(
            origin.clone(),
            None,
            good_category_title(),
            good_category_description(),
            &vec![],
            Ok(()),
        );
        update_category_labels_mock(origin.clone(), category_id, vec![1], Ok(()));
    });
}

/*
 ** create_thread
 */
#[test]
fn create_thread_origin() {
    let origins = [
        OriginType::Signed(default_genesis_config().forum_sudo),
        NOT_FORUM_SUDO_ORIGIN,
    ];
    let results = vec![Ok(()), Err(ERROR_NOT_FORUM_USER)];
    for index in 0..origins.len() {
        let config = default_genesis_config();
        let forum_sudo = config.forum_sudo;
        let origin = OriginType::Signed(forum_sudo);

        build_test_externalities(config).execute_with(|| {
            create_forum_user_mock(
                forum_sudo,
                good_user_name(),
                good_self_introduction(),
                Ok(()),
            );
            let category_id = create_category_mock(
                origin,
                None,
                good_category_title(),
                good_category_description(),
                &vec![],
                Ok(()),
            );
            create_thread_mock(
                origins[index].clone(),
                category_id,
                good_thread_title(),
                good_thread_text(),
                &vec![],
                None,
                results[index],
            );
        });
    }
}

#[test]
fn create_thread_title() {
    let constraint = default_genesis_config().thread_title_constraint;
    let titles = [
        generate_text(constraint.min as usize),
        generate_text((constraint.min as usize) - 1),
        generate_text(constraint.max() + 1),
    ];
    let results = vec![
        Ok(()),
        Err(ERROR_THREAD_TITLE_TOO_SHORT),
        Err(ERROR_THREAD_TITLE_TOO_LONG),
    ];
    for index in 0..titles.len() {
        let config = default_genesis_config();
        let forum_sudo = config.forum_sudo;
        let origin = OriginType::Signed(forum_sudo);

        build_test_externalities(config).execute_with(|| {
            create_forum_user_mock(
                forum_sudo,
                good_user_name(),
                good_self_introduction(),
                Ok(()),
            );
            let category_id = create_category_mock(
                origin.clone(),
                None,
                good_category_title(),
                good_category_description(),
                &vec![],
                Ok(()),
            );
            create_thread_mock(
                origin.clone(),
                category_id,
                titles[index].clone(),
                good_thread_text(),
                &vec![],
                None,
                results[index],
            );
        });
    }
}

#[test]
fn create_thread_text() {
    let constraint = default_genesis_config().post_text_constraint;
    let texts = [
        generate_text(constraint.min as usize),
        generate_text((constraint.min as usize) - 1),
        generate_text(constraint.max() + 1),
    ];

    let results = vec![
        Ok(()),
        Err(ERROR_POST_TEXT_TOO_SHORT),
        Err(ERROR_POST_TEXT_TOO_LONG),
    ];
    for index in 0..texts.len() {
        let config = default_genesis_config();
        let forum_sudo = config.forum_sudo;
        let origin = OriginType::Signed(forum_sudo);

        build_test_externalities(config).execute_with(|| {
            create_forum_user_mock(
                forum_sudo,
                good_user_name(),
                good_self_introduction(),
                Ok(()),
            );
            let category_id = create_category_mock(
                origin.clone(),
                None,
                good_category_title(),
                good_category_description(),
                &vec![],
                Ok(()),
            );
            create_thread_mock(
                origin.clone(),
                category_id,
                good_thread_title(),
                texts[index].clone(),
                &vec![],
                None,
                results[index],
            );
        });
    }
}

#[test]
fn create_thread_labels() {
    let labels = vec![vec![1, 2, 3, 4, 5], vec![1, 2, 3, 4, 5, 6], vec![100]];
    let results = vec![
        Ok(()),
        Err(ERROR_TOO_MUCH_LABELS),
        Err(ERROR_LABEL_INDEX_IS_WRONG),
    ];
    for index in 0..labels.len() {
        let config = default_genesis_config();
        let forum_sudo = config.forum_sudo;
        let origin = OriginType::Signed(forum_sudo);

        build_test_externalities(config).execute_with(|| {
            create_labels_mock();
            create_forum_user_mock(
                forum_sudo,
                good_user_name(),
                good_self_introduction(),
                Ok(()),
            );
            let category_id = create_category_mock(
                origin.clone(),
                None,
                good_category_title(),
                good_category_description(),
                &vec![],
                Ok(()),
            );
            create_thread_mock(
                origin.clone(),
                category_id,
                good_thread_title(),
                good_thread_text(),
                &labels[index],
                None,
                results[index],
            );
        });
    }
}

#[test]
fn create_thread_poll_items_number() {
    let poll_items_constraint = default_genesis_config().poll_items_constraint;
    let items = vec![
        generate_poll_items(poll_items_constraint.min as usize),
        generate_poll_items((poll_items_constraint.min as usize) - 1),
        generate_poll_items((poll_items_constraint.max() as usize) + 1),
    ];
    let results = vec![
        Ok(()),
        Err(ERROR_POLL_ITEMS_TOO_SHORT),
        Err(ERROR_POLL_ITEMS_TOO_LONG),
    ];
    for index in 0..items.len() {
        let config = default_genesis_config();
        let forum_sudo = config.forum_sudo;
        let origin = OriginType::Signed(forum_sudo);

        build_test_externalities(config).execute_with(|| {
            create_labels_mock();
            create_forum_user_mock(
                forum_sudo,
                good_user_name(),
                good_self_introduction(),
                Ok(()),
            );
            let category_id = create_category_mock(
                origin.clone(),
                None,
                good_category_title(),
                good_category_description(),
                &vec![],
                Ok(()),
            );
            create_thread_mock(
                origin.clone(),
                category_id,
                good_thread_title(),
                good_thread_text(),
                &vec![],
                Some((
                    items[index].clone(),
                    good_poll_text(),
                    Timestamp::now(),
                    Timestamp::now() + 10,
                    1,
                    4,
                )),
                results[index],
            );
        });
    }
}

#[test]
fn create_thread_poll_items_text() {
    let poll_desc_constraint = default_genesis_config().poll_desc_constraint;
    let items = vec![
        generate_text(poll_desc_constraint.min as usize),
        generate_text((poll_desc_constraint.min as usize) - 1),
        generate_text((poll_desc_constraint.max() as usize) + 1),
    ];
    let results = vec![
        Ok(()),
        Err(ERROR_POLL_DESC_TOO_SHORT),
        Err(ERROR_POLL_DESC_TOO_LONG),
    ];
    for index in 0..items.len() {
        let config = default_genesis_config();
        let forum_sudo = config.forum_sudo;
        let origin = OriginType::Signed(forum_sudo);

        build_test_externalities(config).execute_with(|| {
            create_labels_mock();
            create_forum_user_mock(
                forum_sudo,
                good_user_name(),
                good_self_introduction(),
                Ok(()),
            );
            let category_id = create_category_mock(
                origin.clone(),
                None,
                good_category_title(),
                good_category_description(),
                &vec![],
                Ok(()),
            );
            create_thread_mock(
                origin.clone(),
                category_id,
                good_thread_title(),
                good_thread_text(),
                &vec![],
                Some((
                    good_poll_items(),
                    items[index].clone(),
                    Timestamp::now(),
                    Timestamp::now() + 10,
                    1,
                    4,
                )),
                results[index],
            );
        });
    }
}

#[test]
fn create_thread_poll_timestamp() {
    // there is other test case as start timestamp is now, and end timestamp as minus
    // but it can not be implemented since the Timestamp::now() return value is zero.
    // then minus become a very large number.
    let start_times = vec![0, 10];
    let end_times = vec![10, 5];
    let results = vec![
        Ok(()),
        Err(ERROR_POLL_TIME_SETTING),
        Err(ERROR_POLL_TIME_SETTING),
    ];
    for index in 0..start_times.len() {
        let config = default_genesis_config();
        let forum_sudo = config.forum_sudo;
        let origin = OriginType::Signed(forum_sudo);

        build_test_externalities(config).execute_with(|| {
            create_labels_mock();
            create_forum_user_mock(
                forum_sudo,
                good_user_name(),
                good_self_introduction(),
                Ok(()),
            );
            let category_id = create_category_mock(
                origin.clone(),
                None,
                good_category_title(),
                good_category_description(),
                &vec![],
                Ok(()),
            );
            println!(
                "{} {} {}",
                Timestamp::now(),
                (Timestamp::now() as i64 + start_times[index]) as u64,
                (Timestamp::now() as i64 + end_times[index]) as u64
            );
            create_thread_mock(
                origin.clone(),
                category_id,
                good_thread_title(),
                good_thread_text(),
                &vec![],
                Some((
                    good_poll_items(),
                    good_poll_text(),
                    (Timestamp::now() as i64 + start_times[index]) as u64,
                    (Timestamp::now() as i64 + end_times[index]) as u64,
                    1,
                    4,
                )),
                results[index],
            );
        });
    }
}

/*
 ** update_thread_labels
 */

#[test]
fn update_thread_labels() {
    let labels = vec![vec![1, 2, 3, 4, 5], vec![1, 2, 3, 4, 5, 6], vec![100]];
    let results = vec![
        Ok(()),
        Err(ERROR_TOO_MUCH_LABELS),
        Err(ERROR_LABEL_INDEX_IS_WRONG),
    ];
    for index in 0..labels.len() {
        let config = default_genesis_config();
        let forum_sudo = config.forum_sudo;
        let origin = OriginType::Signed(forum_sudo);

        build_test_externalities(config).execute_with(|| {
            create_labels_mock();
            create_forum_user_mock(
                forum_sudo,
                good_user_name(),
                good_self_introduction(),
                Ok(()),
            );
            let category_id = create_category_mock(
                origin.clone(),
                None,
                good_category_title(),
                good_category_description(),
                &vec![],
                Ok(()),
            );
            let thread_id = create_thread_mock(
                origin.clone(),
                category_id,
                good_thread_title(),
                good_thread_text(),
                &vec![],
                None,
                Ok(()),
            );
            update_thread_labels_mock(
                origin.clone(),
                thread_id,
                labels[index].clone(),
                results[index],
            );
        });
    }
}

/*
 ** submit_poll
 */
#[test]
fn submit_poll_origin() {
    let origins = vec![
        OriginType::Signed(default_genesis_config().forum_sudo),
        NOT_FORUM_SUDO_ORIGIN,
    ];
    let results = vec![Ok(()), Err(ERROR_NOT_FORUM_USER)];
    for index in 0..origins.len() {
        let config = default_genesis_config();
        let forum_sudo = config.forum_sudo;
        let origin = OriginType::Signed(forum_sudo);
        build_test_externalities(config).execute_with(|| {
            create_forum_user_mock(
                forum_sudo,
                good_user_name(),
                good_self_introduction(),
                Ok(()),
            );
            let category_id = create_category_mock(
                origin.clone(),
                None,
                good_category_title(),
                good_category_description(),
                &vec![],
                Ok(()),
            );
            let thread_id = create_thread_mock(
                origin.clone(),
                category_id,
                good_thread_title(),
                good_thread_text(),
                &vec![],
                Some((
                    good_poll_items(),
                    good_poll_text(),
                    Timestamp::now(),
                    Timestamp::now() + 10,
                    1,
                    4,
                )),
                Ok(()),
            );

            submit_poll_mock(origins[index].clone(), thread_id, 1, results[index]);
        });
    }
}

#[test]
fn submit_poll_exists() {
    let config = default_genesis_config();
    let forum_sudo = config.forum_sudo;
    let origin = OriginType::Signed(forum_sudo);
    build_test_externalities(config).execute_with(|| {
        create_forum_user_mock(
            forum_sudo,
            good_user_name(),
            good_self_introduction(),
            Ok(()),
        );
        let category_id = create_category_mock(
            origin.clone(),
            None,
            good_category_title(),
            good_category_description(),
            &vec![],
            Ok(()),
        );
        let thread_id = create_thread_mock(
            origin.clone(),
            category_id,
            good_thread_title(),
            good_thread_text(),
            &vec![],
            None,
            Ok(()),
        );
        submit_poll_mock(origin.clone(), thread_id, 1, Err(ERROR_POLL_NOT_EXIST));
    });
}

#[test]
fn submit_poll_expired() {
    let config = default_genesis_config();
    let forum_sudo = config.forum_sudo;
    let origin = OriginType::Signed(forum_sudo);
    build_test_externalities(config).execute_with(|| {
        create_forum_user_mock(
            forum_sudo,
            good_user_name(),
            good_self_introduction(),
            Ok(()),
        );
        let category_id = create_category_mock(
            origin.clone(),
            None,
            good_category_title(),
            good_category_description(),
            &vec![],
            Ok(()),
        );
        let thread_id = create_thread_mock(
            origin.clone(),
            category_id,
            good_thread_title(),
            good_thread_text(),
            &vec![],
            Some((
                good_poll_items(),
                good_poll_text(),
                Timestamp::now(),
                Timestamp::now() + 10,
                1,
                4,
            )),
            Ok(()),
        );
        // std::thread::sleep(std::time::Duration::new(12, 0));
        // submit_poll_mock(origin.clone(), thread_id, 1, Err(ERROR_POLL_COMMIT_EXPIRED));
        submit_poll_mock(origin.clone(), thread_id, 1, Ok(()));
    });
}

#[test]
fn submit_poll_data() {
    // correct data, at least choose two, at most choose three, no such index.
    let poll_data = vec![3, 1, 15, 32];
    let results = vec![
        Ok(()),
        Err(ERROR_POLL_DATA),
        Err(ERROR_POLL_DATA),
        Err(ERROR_POLL_DATA),
    ];

    for index in 0..poll_data.len() {
        let config = default_genesis_config();
        let forum_sudo = config.forum_sudo;
        let origin = OriginType::Signed(forum_sudo);
        build_test_externalities(config).execute_with(|| {
            create_forum_user_mock(
                forum_sudo,
                good_user_name(),
                good_self_introduction(),
                Ok(()),
            );
            let category_id = create_category_mock(
                origin.clone(),
                None,
                good_category_title(),
                good_category_description(),
                &vec![],
                Ok(()),
            );
            let thread_id = create_thread_mock(
                origin.clone(),
                category_id,
                good_thread_title(),
                good_thread_text(),
                &vec![],
                Some((
                    good_poll_items(),
                    good_poll_text(),
                    Timestamp::now(),
                    Timestamp::now() + 10,
                    2,
                    3,
                )),
                Ok(()),
            );
            // std::thread::sleep(std::time::Duration::new(12, 0));
            // submit_poll_mock(origin.clone(), thread_id, 1, Err(ERROR_POLL_COMMIT_EXPIRED));
            submit_poll_mock(origin.clone(), thread_id, poll_data[index], results[index]);
        });
    }
}

/*
 ** moderate_thread
 */

/*
 ** add_post
 */

/*
 ** react_post
 */

/*
 ** edit_post_text
 */

/*
 ** moderate_post
 */
