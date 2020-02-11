#![cfg(test)]

use super::*;
use crate::mock::*;
/// test cases are arranged as two layers.
/// first layer is each method in defined in module.
/// second layer is each parameter of the specific method.

/*
 * add labels
 */

#[test]
// test labels' text length
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
// test case for create a new forum user
fn create_forum_user_account_id() {
    let config = default_genesis_config();
    let forum_sudo = config.forum_sudo;
    build_test_externalities(config).execute_with(|| {
        create_forum_user_mock(
            forum_sudo,
            good_user_name(),
            good_self_introduction(),
            good_forum_user_footer(),
            Ok(()),
        );
        // test use same account id to create multiple forum user
        create_forum_user_mock(
            forum_sudo,
            good_user_name(),
            good_self_introduction(),
            good_forum_user_footer(),
            Ok(()),
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
                good_forum_user_footer(),
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
                good_forum_user_footer(),
                results[index],
            );
        });
    }
}

#[test]
// test case for check post footer
fn create_forum_user_post_footer() {
    let config = default_genesis_config();
    let forum_sudo = config.forum_sudo;
    let post_footers = vec![
        Some(generate_text(config.post_footer_constraint.min as usize)),
        Some(generate_text(
            (config.post_footer_constraint.min - 1) as usize,
        )),
        Some(generate_text(
            (config.post_footer_constraint.max() + 1) as usize,
        )),
    ];
    let results = vec![
        Ok(()),
        Err(ERROR_USER_POST_FOOTER_TOO_SHORT),
        Err(ERROR_USER_POST_FOOTER_TOO_LONG),
    ];
    for index in 0..post_footers.len() {
        let config = default_genesis_config();
        build_test_externalities(config).execute_with(|| {
            create_forum_user_mock(
                forum_sudo,
                good_user_name(),
                good_self_introduction(),
                post_footers[index].clone(),
                results[index],
            );
        });
    }
}

/*
 * create_moderator
 */
#[test]
// test case for create a new moderator
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
        // test use same account id to create multiple moderator
        create_moderator_mock(
            forum_sudo,
            good_user_name(),
            good_self_introduction(),
            Ok(()),
        );
    });
}

#[test]
// test case for check moderator's name
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
// test case for check moderator's self introduction
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
// test set max category depth works
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
        let moderator_id = create_moderator_mock(
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
            &BTreeSet::new(),
            Ok(()),
        );
        set_moderator_category_mock(origin, moderator_id, category_id, true, Ok(()));
        set_moderator_category_mock(
            NOT_FORUM_SUDO_ORIGIN,
            moderator_id,
            category_id,
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
        let moderator_id = create_moderator_mock(
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
            &BTreeSet::new(),
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
    let forum_sudo = config.forum_sudo;
    let origin = OriginType::Signed(forum_sudo);
    build_test_externalities(default_genesis_config()).execute_with(|| {
        let category_id = create_category_mock(
            origin.clone(),
            None,
            good_category_title(),
            good_category_description(),
            &BTreeSet::new(),
            Ok(()),
        );
        set_moderator_category_mock(
            origin.clone(),
            NOT_REGISTER_MODERATOR_ID,
            category_id,
            true,
            Err(ERROR_NOT_MODERATOR_USER),
        );
    });

    build_test_externalities(config).execute_with(|| {
        let moderator_id = create_moderator_mock(
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
            &BTreeSet::new(),
            Ok(()),
        );
        set_moderator_category_mock(origin, moderator_id, category_id, true, Ok(()));
    });
}

/*
 * set_forum_sudo
 */
#[test]
// test the blockchain sudo account can update forum sudo
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
                &BTreeSet::new(),
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
        let forum_sudo = config.forum_sudo;
        let origin = OriginType::Signed(forum_sudo);
        build_test_externalities(config).execute_with(|| {
            create_category_mock(
                origin.clone(),
                None,
                good_category_title(),
                good_category_description(),
                &BTreeSet::new(),
                Ok(()),
            );
            create_category_mock(
                origin.clone(),
                Some(1),
                good_category_title(),
                good_category_description(),
                &BTreeSet::new(),
                Ok(()),
            );
            create_category_mock(
                origin.clone(),
                Some(2),
                good_category_title(),
                good_category_description(),
                &BTreeSet::new(),
                Ok(()),
            );
            update_category_mock(origin.clone(), 3, Some(true), None, Ok(()));
            update_category_mock(origin.clone(), 2, None, Some(true), Ok(()));
            create_category_mock(
                origin.clone(),
                parents[index],
                good_category_title(),
                good_category_description(),
                &BTreeSet::new(),
                results[index],
            );
        });
    }
}

#[test]
// test case set category depth
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
            &BTreeSet::new(),
            Ok(()),
        );
        create_category_mock(
            origin.clone(),
            Some(1),
            good_category_title(),
            good_category_description(),
            &BTreeSet::new(),
            Ok(()),
        );
        create_category_mock(
            origin.clone(),
            Some(2),
            good_category_title(),
            good_category_description(),
            &BTreeSet::new(),
            Ok(()),
        );
        create_category_mock(
            origin.clone(),
            Some(3),
            good_category_title(),
            good_category_description(),
            &BTreeSet::new(),
            Ok(()),
        );
        create_category_mock(
            origin.clone(),
            Some(4),
            good_category_title(),
            good_category_description(),
            &BTreeSet::new(),
            Err(ERROR_MAX_VALID_CATEGORY_DEPTH_EXCEEDED),
        );
    });
}

#[test]
// test category title length
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
                &BTreeSet::new(),
                results[index],
            );
        });
    }
}

#[test]
// test for category description text length
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
                &BTreeSet::new(),
                results[index],
            );
        });
    }
}

#[test]
// test if category labels is valid
fn create_category_labels() {
    let config = default_genesis_config();
    let forum_sudo = config.forum_sudo;
    let origin = OriginType::Signed(forum_sudo);
    let labels: Vec<BTreeSet<<Runtime as Trait>::LabelId>> = vec![
        {
            let mut a = BTreeSet::<<Runtime as Trait>::LabelId>::new();
            a.insert(1);
            a
        },
        {
            let mut a = BTreeSet::<<Runtime as Trait>::LabelId>::new();
            a.insert(1);
            a.insert(2);
            a.insert(3);
            a.insert(4);
            a.insert(5);
            a.insert(6);
            a
        },
        {
            let mut a = BTreeSet::<<Runtime as Trait>::LabelId>::new();
            a.insert(100);
            a
        },
    ];
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
// test if category updator is forum sudo
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
                &BTreeSet::new(),
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
    let forum_sudo = config.forum_sudo;
    let origin = OriginType::Signed(forum_sudo);
    build_test_externalities(config).execute_with(|| {
        create_category_mock(
            origin.clone(),
            None,
            good_category_title(),
            good_category_description(),
            &BTreeSet::new(),
            Ok(()),
        );
        update_category_mock(origin, 1, None, None, Err(ERROR_CATEGORY_NOT_BEING_UPDATED));
    });
}
#[test]
// test case for new setting actually not update category status
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
            &BTreeSet::new(),
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
    let forum_sudo = config.forum_sudo;
    let origin = OriginType::Signed(forum_sudo);
    build_test_externalities(config).execute_with(|| {
        create_category_mock(
            origin.clone(),
            None,
            good_category_title(),
            good_category_description(),
            &BTreeSet::new(),
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
    let forum_sudo = config.forum_sudo;
    let origin = OriginType::Signed(forum_sudo);
    build_test_externalities(config).execute_with(|| {
        create_category_mock(
            origin.clone(),
            None,
            good_category_title(),
            good_category_description(),
            &BTreeSet::new(),
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
// test category labels is valid
fn update_category_labels() {
    let labels: Vec<BTreeSet<<Runtime as Trait>::ThreadId>> = vec![
        {
            let mut a = BTreeSet::<<Runtime as Trait>::ThreadId>::new();
            a.insert(1);
            a
        },
        {
            let mut a = BTreeSet::<<Runtime as Trait>::ThreadId>::new();
            a.insert(1);
            a.insert(2);
            a.insert(3);
            a.insert(4);
            a.insert(5);
            a.insert(6);
            a
        },
        {
            let mut a = BTreeSet::<<Runtime as Trait>::ThreadId>::new();
            a.insert(100);
            a
        },
    ];
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
            let moderator_id = create_moderator_mock(
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
                &BTreeSet::new(),
                Ok(()),
            );
            update_category_labels_mock(
                origin.clone(),
                moderator_id,
                category_id,
                labels[index].clone(),
                results[index],
            );
        });
    }
}

#[test]
// test setting category moderator
fn update_category_labels_moderator() {
    let config = default_genesis_config();
    let forum_sudo = config.forum_sudo;
    let origin = OriginType::Signed(forum_sudo);
    build_test_externalities(config).execute_with(|| {
        create_labels_mock();
        let moderator_id = create_moderator_mock(
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
            &BTreeSet::new(),
            Ok(()),
        );
        update_category_labels_mock(
            origin.clone(),
            moderator_id,
            category_id,
            BTreeSet::new(),
            Ok(()),
        );
    });
}

/*
 ** create_thread
 */
#[test]
// test if thread creator is valid forum user
fn create_thread_origin() {
    let origins = [
        OriginType::Signed(default_genesis_config().forum_sudo),
        NOT_FORUM_SUDO_ORIGIN,
    ];
    let results = vec![Ok(()), Err(ERROR_FORUM_USER_ID_NOT_MATCH_ACCOUNT)];
    for index in 0..origins.len() {
        let config = default_genesis_config();
        let forum_sudo = config.forum_sudo;
        let origin = OriginType::Signed(forum_sudo);

        build_test_externalities(config).execute_with(|| {
            let forum_user_id = create_forum_user_mock(
                forum_sudo,
                good_user_name(),
                good_self_introduction(),
                good_forum_user_footer(),
                Ok(()),
            );
            let category_id = create_category_mock(
                origin,
                None,
                good_category_title(),
                good_category_description(),
                &BTreeSet::new(),
                Ok(()),
            );
            create_thread_mock(
                origins[index].clone(),
                forum_user_id,
                category_id,
                good_thread_title(),
                good_thread_text(),
                &BTreeSet::new(),
                None,
                results[index],
            );
        });
    }
}

#[test]
// test thread title length
fn create_thread_title() {
    let constraint = default_genesis_config().thread_title_constraint;
    let titles = [
        generate_text(constraint.min as usize),
        generate_text((constraint.min as usize) - 1),
        generate_text((constraint.max() as usize) + 1),
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
            let forum_user_id = create_forum_user_mock(
                forum_sudo,
                good_user_name(),
                good_self_introduction(),
                good_forum_user_footer(),
                Ok(()),
            );
            let category_id = create_category_mock(
                origin.clone(),
                None,
                good_category_title(),
                good_category_description(),
                &BTreeSet::new(),
                Ok(()),
            );
            create_thread_mock(
                origin.clone(),
                forum_user_id,
                category_id,
                titles[index].clone(),
                good_thread_text(),
                &BTreeSet::new(),
                None,
                results[index],
            );
        });
    }
}

#[test]
// test thread text length
fn create_thread_text() {
    let constraint = default_genesis_config().post_text_constraint;
    let texts = [
        generate_text(constraint.min as usize),
        generate_text((constraint.min as usize) - 1),
        generate_text((constraint.max() as usize) + 1),
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
            let forum_user_id = create_forum_user_mock(
                forum_sudo,
                good_user_name(),
                good_self_introduction(),
                good_forum_user_footer(),
                Ok(()),
            );
            let category_id = create_category_mock(
                origin.clone(),
                None,
                good_category_title(),
                good_category_description(),
                &BTreeSet::new(),
                Ok(()),
            );
            create_thread_mock(
                origin.clone(),
                forum_user_id,
                category_id,
                good_thread_title(),
                texts[index].clone(),
                &BTreeSet::new(),
                None,
                results[index],
            );
        });
    }
}

#[test]
// test thread label setting is valid
fn create_thread_labels() {
    let labels = generate_label_index_cases();
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
            let forum_user_id = create_forum_user_mock(
                forum_sudo,
                good_user_name(),
                good_self_introduction(),
                good_forum_user_footer(),
                Ok(()),
            );
            let category_id = create_category_mock(
                origin.clone(),
                None,
                good_category_title(),
                good_category_description(),
                &BTreeSet::new(),
                Ok(()),
            );
            create_thread_mock(
                origin.clone(),
                forum_user_id,
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
// test if timestamp of poll start time and end time are valid
fn create_thread_poll_timestamp() {
    // there is other test case as start timestamp is now, and end timestamp as minus
    // but it can not be implemented since the Timestamp::now() return value is zero.
    // then minus become a very large number.

    let results = vec![Ok(()), Err(ERROR_POLL_TIME_SETTING)];
    for index in 0..results.len() {
        let config = default_genesis_config();
        let forum_sudo = config.forum_sudo;
        let origin = OriginType::Signed(forum_sudo);

        build_test_externalities(config).execute_with(|| {
            create_labels_mock();
            let forum_user_id = create_forum_user_mock(
                forum_sudo,
                good_user_name(),
                good_self_introduction(),
                good_forum_user_footer(),
                Ok(()),
            );
            let category_id = create_category_mock(
                origin.clone(),
                None,
                good_category_title(),
                good_category_description(),
                &BTreeSet::new(),
                Ok(()),
            );

            create_thread_mock(
                origin.clone(),
                forum_user_id,
                category_id,
                good_thread_title(),
                good_thread_text(),
                &BTreeSet::new(),
                Some(generate_poll_timestamp_cases(index)),
                results[index],
            );
        });
    }
}

/*
 ** update_thread_labels_by_author
 */

#[test]
// test if thread labels are valid
fn update_thread_labels_by_author() {
    let labels = generate_label_index_cases();
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
            let forum_user_id = create_forum_user_mock(
                forum_sudo,
                good_user_name(),
                good_self_introduction(),
                good_forum_user_footer(),
                Ok(()),
            );
            let category_id = create_category_mock(
                origin.clone(),
                None,
                good_category_title(),
                good_category_description(),
                &BTreeSet::new(),
                Ok(()),
            );
            let thread_id = create_thread_mock(
                origin.clone(),
                forum_user_id,
                category_id,
                good_thread_title(),
                good_thread_text(),
                &BTreeSet::new(),
                None,
                Ok(()),
            );
            update_thread_labels_by_author_mock(
                origin.clone(),
                forum_user_id,
                thread_id,
                labels[index].clone(),
                results[index],
            );
        });
    }
}

/*
 ** update_thread_labels_by_moderator
 */

#[test]
// test if thread labels are valid
fn update_thread_labels_by_moderator() {
    let labels = generate_label_index_cases();
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
            let forum_user_id = create_forum_user_mock(
                forum_sudo,
                good_user_name(),
                good_self_introduction(),
                good_forum_user_footer(),
                Ok(()),
            );
            let moderator_id = create_moderator_mock(
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
                &BTreeSet::new(),
                Ok(()),
            );

            set_moderator_category_mock(origin.clone(), moderator_id, category_id, true, Ok(()));

            let thread_id = create_thread_mock(
                origin.clone(),
                forum_user_id,
                category_id,
                good_thread_title(),
                good_thread_text(),
                &BTreeSet::new(),
                None,
                Ok(()),
            );

            update_thread_labels_by_moderator_mock(
                origin.clone(),
                moderator_id,
                thread_id,
                labels[index].clone(),
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
    let origins = vec![
        OriginType::Signed(default_genesis_config().forum_sudo),
        NOT_FORUM_SUDO_ORIGIN,
    ];
    let results = vec![Ok(()), Err(ERROR_FORUM_USER_ID_NOT_MATCH_ACCOUNT)];
    for index in 0..origins.len() {
        let config = default_genesis_config();
        let forum_sudo = config.forum_sudo;
        let origin = OriginType::Signed(forum_sudo);
        build_test_externalities(config).execute_with(|| {
            let forum_user_id = create_forum_user_mock(
                forum_sudo,
                good_user_name(),
                good_self_introduction(),
                good_forum_user_footer(),
                Ok(()),
            );
            let category_id = create_category_mock(
                origin.clone(),
                None,
                good_category_title(),
                good_category_description(),
                &BTreeSet::new(),
                Ok(()),
            );
            let thread_id = create_thread_mock(
                origin.clone(),
                forum_user_id,
                category_id,
                good_thread_title(),
                good_thread_text(),
                &BTreeSet::new(),
                Some(generate_poll()),
                Ok(()),
            );

            vote_on_poll_mock(
                origins[index].clone(),
                forum_user_id,
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
    let forum_sudo = config.forum_sudo;
    let origin = OriginType::Signed(forum_sudo);
    build_test_externalities(config).execute_with(|| {
        let forum_user_id = create_forum_user_mock(
            forum_sudo,
            good_user_name(),
            good_self_introduction(),
            good_forum_user_footer(),
            Ok(()),
        );
        let category_id = create_category_mock(
            origin.clone(),
            None,
            good_category_title(),
            good_category_description(),
            &BTreeSet::new(),
            Ok(()),
        );
        let thread_id = create_thread_mock(
            origin.clone(),
            forum_user_id,
            category_id,
            good_thread_title(),
            good_thread_text(),
            &BTreeSet::new(),
            None,
            Ok(()),
        );
        vote_on_poll_mock(
            origin.clone(),
            forum_user_id,
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
    let forum_sudo = config.forum_sudo;
    let origin = OriginType::Signed(forum_sudo);
    build_test_externalities(config).execute_with(|| {
        let forum_user_id = create_forum_user_mock(
            forum_sudo,
            good_user_name(),
            good_self_introduction(),
            good_forum_user_footer(),
            Ok(()),
        );
        let category_id = create_category_mock(
            origin.clone(),
            None,
            good_category_title(),
            good_category_description(),
            &BTreeSet::new(),
            Ok(()),
        );
        let thread_id = create_thread_mock(
            origin.clone(),
            forum_user_id,
            category_id,
            good_thread_title(),
            good_thread_text(),
            &BTreeSet::new(),
            Some(generate_poll()),
            Ok(()),
        );
        // std::thread::sleep(std::time::Duration::new(12, 0));
        // vote_on_poll_mock(origin.clone(), thread_id, 1, Err(ERROR_POLL_COMMIT_EXPIRED));
        vote_on_poll_mock(origin.clone(), forum_user_id, thread_id, 1, Ok(()));
    });
}

/*
 ** moderate_thread
 */

#[test]
// test if thread moderator registered as valid moderator
fn moderate_thread_origin_ok() {
    let config = default_genesis_config();
    let forum_sudo = config.forum_sudo;
    let origin = OriginType::Signed(forum_sudo);
    build_test_externalities(config).execute_with(|| {
        let forum_user_id = create_forum_user_mock(
            forum_sudo,
            good_user_name(),
            good_self_introduction(),
            good_forum_user_footer(),
            Ok(()),
        );
        let moderator_id = create_moderator_mock(
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
            &BTreeSet::new(),
            Ok(()),
        );
        set_moderator_category_mock(origin.clone(), moderator_id, category_id, true, Ok(()));
        let thread_id = create_thread_mock(
            origin.clone(),
            forum_user_id,
            category_id,
            good_thread_title(),
            good_thread_text(),
            &BTreeSet::new(),
            None,
            Ok(()),
        );
        moderate_thread_mock(origin, moderator_id, thread_id, good_rationale(), Ok(()));
    });
}

#[test]
// test thread moderate rationale's length
fn moderate_thread_rationale() {
    let constraint = default_genesis_config().thread_moderation_rationale_constraint;
    let rationales = vec![
        generate_text(constraint.min as usize),
        generate_text((constraint.min - 1) as usize),
        generate_text((constraint.max() + 1) as usize),
    ];
    let results = vec![
        Ok(()),
        Err(ERROR_THREAD_MODERATION_RATIONALE_TOO_SHORT),
        Err(ERROR_THREAD_MODERATION_RATIONALE_TOO_LONG),
    ];
    for index in 0..rationales.len() {
        let config = default_genesis_config();
        let forum_sudo = config.forum_sudo;
        let origin = OriginType::Signed(forum_sudo);
        build_test_externalities(config).execute_with(|| {
            let forum_user_id = create_forum_user_mock(
                forum_sudo,
                good_user_name(),
                good_self_introduction(),
                good_forum_user_footer(),
                Ok(()),
            );
            let moderator_id = create_moderator_mock(
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
                &BTreeSet::new(),
                Ok(()),
            );
            set_moderator_category_mock(origin.clone(), moderator_id, category_id, true, Ok(()));
            let thread_id = create_thread_mock(
                origin.clone(),
                forum_user_id,
                category_id,
                good_thread_title(),
                good_thread_text(),
                &BTreeSet::new(),
                None,
                Ok(()),
            );
            moderate_thread_mock(
                origin.clone(),
                moderator_id,
                thread_id,
                rationales[index].clone(),
                results[index],
            );
        });
    }
}

/*
 ** add_post
 */

#[test]
// test if post origin registered as forum user
fn add_post_origin() {
    let origins = vec![
        OriginType::Signed(default_genesis_config().forum_sudo),
        NOT_FORUM_SUDO_ORIGIN,
    ];
    let results = vec![Ok(()), Err(ERROR_FORUM_USER_ID_NOT_MATCH_ACCOUNT)];
    for index in 0..origins.len() {
        let config = default_genesis_config();
        let forum_sudo = config.forum_sudo;
        let origin = OriginType::Signed(forum_sudo);
        build_test_externalities(config).execute_with(|| {
            let forum_user_id = create_forum_user_mock(
                forum_sudo,
                good_user_name(),
                good_self_introduction(),
                good_forum_user_footer(),
                Ok(()),
            );

            let category_id = create_category_mock(
                origin.clone(),
                None,
                good_category_title(),
                good_category_description(),
                &BTreeSet::new(),
                Ok(()),
            );

            let thread_id = create_thread_mock(
                origin.clone(),
                forum_user_id,
                category_id,
                good_thread_title(),
                good_thread_text(),
                &BTreeSet::new(),
                None,
                Ok(()),
            );
            create_post_mock(
                origins[index].clone(),
                forum_user_id,
                thread_id,
                good_post_text(),
                results[index],
            );
        });
    }
}

#[test]
// test post text's length
fn add_post_text() {
    let constraint = default_genesis_config().post_text_constraint;
    let texts = vec![
        generate_text(constraint.min as usize),
        generate_text((constraint.min - 1) as usize),
        generate_text((constraint.max() + 1) as usize),
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
            let forum_user_id = create_forum_user_mock(
                forum_sudo,
                good_user_name(),
                good_self_introduction(),
                good_forum_user_footer(),
                Ok(()),
            );

            let category_id = create_category_mock(
                origin.clone(),
                None,
                good_category_title(),
                good_category_description(),
                &BTreeSet::new(),
                Ok(()),
            );

            let thread_id = create_thread_mock(
                origin.clone(),
                forum_user_id,
                category_id,
                good_thread_title(),
                good_thread_text(),
                &BTreeSet::new(),
                None,
                Ok(()),
            );
            create_post_mock(
                origin.clone(),
                forum_user_id,
                thread_id,
                texts[index].clone(),
                results[index],
            );
        });
    }
}

#[test]
// test post text's length
fn edit_post_text() {
    let constraint = default_genesis_config().post_text_constraint;
    let texts = vec![
        generate_text(constraint.min as usize),
        generate_text((constraint.min - 1) as usize),
        generate_text((constraint.max() + 1) as usize),
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
            let forum_user_id = create_forum_user_mock(
                forum_sudo,
                good_user_name(),
                good_self_introduction(),
                good_forum_user_footer(),
                Ok(()),
            );

            let category_id = create_category_mock(
                origin.clone(),
                None,
                good_category_title(),
                good_category_description(),
                &BTreeSet::new(),
                Ok(()),
            );

            let thread_id = create_thread_mock(
                origin.clone(),
                forum_user_id,
                category_id,
                good_thread_title(),
                good_thread_text(),
                &BTreeSet::new(),
                None,
                Ok(()),
            );
            let post_id = create_post_mock(
                origin.clone(),
                forum_user_id,
                thread_id,
                good_post_text(),
                Ok(()),
            );

            edit_post_text_mock(
                origin.clone(),
                forum_user_id,
                post_id,
                texts[index].clone(),
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
        let forum_sudo = config.forum_sudo.clone();
        let origin = OriginType::Signed(config.forum_sudo);

        build_test_externalities(config).execute_with(|| {
            let forum_user_id = create_forum_user_mock(
                forum_sudo,
                good_user_name(),
                good_self_introduction(),
                good_forum_user_footer(),
                Ok(()),
            );

            let category_id = create_category_mock(
                origin.clone(),
                None,
                good_category_title(),
                good_category_description(),
                &BTreeSet::new(),
                Ok(()),
            );

            let thread_id = create_thread_mock(
                origin.clone(),
                forum_user_id,
                category_id,
                good_thread_title(),
                good_thread_text(),
                &BTreeSet::new(),
                None,
                Ok(()),
            );
            let post_id = create_post_mock(
                origin.clone(),
                forum_user_id,
                thread_id,
                good_post_text(),
                Ok(()),
            );
            assert_eq!(
                TestForumModule::react_post(
                    mock_origin(origin.clone()),
                    forum_user_id,
                    post_id,
                    new_values[index]
                ),
                Ok(())
            );
            assert_eq!(
                TestForumModule::reaction_by_post(post_id, forum_user_id),
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
    let origins = vec![
        OriginType::Signed(default_genesis_config().forum_sudo),
        NOT_FORUM_SUDO_ORIGIN,
    ];
    let results = vec![Ok(()), Err(ERROR_MODERATOR_ID_NOT_MATCH_ACCOUNT)];
    for index in 0..origins.len() {
        let config = default_genesis_config();
        let forum_sudo = config.forum_sudo;
        let origin = OriginType::Signed(forum_sudo);
        build_test_externalities(config).execute_with(|| {
            let forum_user_id = create_forum_user_mock(
                forum_sudo,
                good_user_name(),
                good_self_introduction(),
                good_forum_user_footer(),
                Ok(()),
            );
            let moderator_id = create_moderator_mock(
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
                &BTreeSet::new(),
                Ok(()),
            );
            set_moderator_category_mock(origin.clone(), moderator_id, category_id, true, Ok(()));

            let thread_id = create_thread_mock(
                origin.clone(),
                forum_user_id,
                category_id,
                good_thread_title(),
                good_thread_text(),
                &BTreeSet::new(),
                None,
                Ok(()),
            );
            let post_id = create_post_mock(
                origin.clone(),
                forum_user_id,
                thread_id,
                good_post_text(),
                Ok(()),
            );
            moderate_post_mock(
                origins[index].clone(),
                moderator_id,
                post_id,
                good_rationale(),
                results[index],
            );
        });
    }
}

#[test]
// test post rationale text's length
fn moderate_post_rationale() {
    let constraint = default_genesis_config().post_moderation_rationale_constraint;
    let rationales = vec![
        generate_text(constraint.min as usize),
        generate_text((constraint.min - 1) as usize),
        generate_text((constraint.max() + 1) as usize),
    ];
    let results = vec![
        Ok(()),
        Err(ERROR_POST_MODERATION_RATIONALE_TOO_SHORT),
        Err(ERROR_POST_MODERATION_RATIONALE_TOO_LONG),
    ];
    for index in 0..rationales.len() {
        let config = default_genesis_config();
        let forum_sudo = config.forum_sudo;
        let origin = OriginType::Signed(forum_sudo);
        build_test_externalities(config).execute_with(|| {
            let forum_user_id = create_forum_user_mock(
                forum_sudo,
                good_user_name(),
                good_self_introduction(),
                good_forum_user_footer(),
                Ok(()),
            );
            let moderator_id = create_moderator_mock(
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
                &BTreeSet::new(),
                Ok(()),
            );

            set_moderator_category_mock(origin.clone(), moderator_id, category_id, true, Ok(()));
            let thread_id = create_thread_mock(
                origin.clone(),
                forum_user_id,
                category_id,
                good_thread_title(),
                good_thread_text(),
                &BTreeSet::new(),
                None,
                Ok(()),
            );
            let post_id = create_post_mock(
                origin.clone(),
                forum_user_id,
                thread_id,
                good_post_text(),
                Ok(()),
            );
            moderate_post_mock(
                origin.clone(),
                moderator_id,
                post_id,
                rationales[index].clone(),
                results[index],
            );
        });
    }
}

#[test]
fn set_stickied_threads_ok() {
    let config = default_genesis_config();
    let forum_sudo = config.forum_sudo;
    let origin = OriginType::Signed(forum_sudo);
    build_test_externalities(config).execute_with(|| {
        let forum_user_id = create_forum_user_mock(
            forum_sudo,
            good_user_name(),
            good_self_introduction(),
            good_forum_user_footer(),
            Ok(()),
        );
        let moderator_id = create_moderator_mock(
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
            &BTreeSet::new(),
            Ok(()),
        );
        set_moderator_category_mock(origin.clone(), moderator_id, category_id, true, Ok(()));
        let thread_id = create_thread_mock(
            origin.clone(),
            forum_user_id,
            category_id,
            good_thread_title(),
            good_thread_text(),
            &BTreeSet::new(),
            None,
            Ok(()),
        );
        set_stickied_threads_mock(origin, moderator_id, category_id, vec![thread_id], Ok(()));
    });
}

#[test]
fn set_stickied_threads_wrong_moderator() {
    let config = default_genesis_config();
    let forum_sudo = config.forum_sudo;
    let origin = OriginType::Signed(forum_sudo);
    build_test_externalities(config).execute_with(|| {
        let forum_user_id = create_forum_user_mock(
            forum_sudo,
            good_user_name(),
            good_self_introduction(),
            good_forum_user_footer(),
            Ok(()),
        );
        let moderator_id = create_moderator_mock(
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
            &BTreeSet::new(),
            Ok(()),
        );

        let thread_id = create_thread_mock(
            origin.clone(),
            forum_user_id,
            category_id,
            good_thread_title(),
            good_thread_text(),
            &BTreeSet::new(),
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
    let forum_sudo = config.forum_sudo;
    let origin = OriginType::Signed(forum_sudo);
    build_test_externalities(config).execute_with(|| {
        let forum_user_id = create_forum_user_mock(
            forum_sudo,
            good_user_name(),
            good_self_introduction(),
            good_forum_user_footer(),
            Ok(()),
        );
        let moderator_id = create_moderator_mock(
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
            &BTreeSet::new(),
            Ok(()),
        );
        set_moderator_category_mock(origin.clone(), moderator_id, category_id, true, Ok(()));
        let thread_id = create_thread_mock(
            origin.clone(),
            forum_user_id,
            category_id,
            good_thread_title(),
            good_thread_text(),
            &BTreeSet::new(),
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
    let forum_sudo = config.forum_sudo;
    let origin = OriginType::Signed(forum_sudo);
    build_test_externalities(config).execute_with(|| {
        let forum_user_id = create_forum_user_mock(
            forum_sudo,
            good_user_name(),
            good_self_introduction(),
            good_forum_user_footer(),
            Ok(()),
        );
        let moderator_id = create_moderator_mock(
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
            &BTreeSet::new(),
            Ok(()),
        );
        set_moderator_category_mock(origin.clone(), moderator_id, category_id, true, Ok(()));
        let _ = create_thread_mock(
            origin.clone(),
            forum_user_id,
            category_id,
            good_thread_title(),
            good_thread_text(),
            &BTreeSet::new(),
            None,
            Ok(()),
        );
        let category_id_2 = create_category_mock(
            origin.clone(),
            None,
            good_category_title(),
            good_category_description(),
            &BTreeSet::new(),
            Ok(()),
        );
        let thread_id = create_thread_mock(
            origin.clone(),
            forum_user_id,
            category_id_2,
            good_thread_title(),
            good_thread_text(),
            &BTreeSet::new(),
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
