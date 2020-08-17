#![cfg(test)]

use super::genesis;
use super::mock::*;

use frame_support::{assert_err, assert_ok, traits::Currency, StorageValue};
use sp_arithmetic::traits::One;
use sp_std::collections::{btree_map::BTreeMap, btree_set::BTreeSet};
use system::RawOrigin;

use common::constraints::InputValidationLengthConstraint;
use hiring;

#[test]
fn create_channel_success() {
    TestExternalitiesBuilder::<Test>::default()
        .build()
        .execute_with(|| {
            /*
               Events are not emitted on block 0.
               So any dispatchable calls made during genesis block formation will have no events emitted.
               https://substrate.dev/recipes/2-appetizers/4-events.html
            */
            run_to_block(1);

            // Add channel creator as member
            let channel_creator_member_root_and_controller_account = 12312;

            let channel_creator_member_id = add_member(
                channel_creator_member_root_and_controller_account,
                to_vec(CHANNEL_CREATOR_HANDLE),
            );

            let fixture = CreateChannelFixture::make_valid_unpulished_video_channel_for(
                channel_creator_member_id,
                None,
            );

            fixture.call_and_assert_success();
        });
}

#[test]
fn create_channel_is_not_a_member() {
    TestExternalitiesBuilder::<Test>::default()
        .build()
        .execute_with(|| {
            let channel_creator_member_id = add_channel_creator_member();

            let mut fixture = CreateChannelFixture::make_valid_unpulished_video_channel_for(
                channel_creator_member_id,
                None,
            );

            // Change to invalid member id, i.e. != channel_creator_member_id
            fixture.channel_creator_member_id = fixture.channel_creator_member_id
                + <<Test as membership::Trait>::MemberId as One>::one();

            fixture.call_and_assert_error(MSG_MEMBER_ID_INVALID);
        });
}

#[test]
fn create_channel_not_enabled() {
    TestExternalitiesBuilder::<Test>::default()
        .build()
        .execute_with(|| {
            add_member_and_set_as_lead();

            set_channel_creation_enabled(false);

            let channel_creator_member_id = add_channel_creator_member();

            let fixture = CreateChannelFixture::make_valid_unpulished_video_channel_for(
                channel_creator_member_id,
                None,
            );

            fixture.call_and_assert_error(MSG_CHANNEL_CREATION_DISABLED);
        });
}

#[test]
fn create_channel_with_bad_member_role_account() {
    TestExternalitiesBuilder::<Test>::default()
        .build()
        .execute_with(|| {
            let channel_creator_member_id = add_channel_creator_member();

            let fixture = CreateChannelFixture::make_valid_unpulished_video_channel_for(
                channel_creator_member_id,
                Some(0),
            );

            fixture.call_and_assert_error(MSG_SIGNER_NOT_CONTROLLER_ACCOUNT);
        });
}

#[test]
fn create_channel_handle_too_long() {
    TestExternalitiesBuilder::<Test>::default()
        .build()
        .execute_with(|| {
            let channel_creator_member_id = add_channel_creator_member();

            let mut fixture = CreateChannelFixture::make_valid_unpulished_video_channel_for(
                channel_creator_member_id,
                None,
            );

            fixture.channel_handle =
                generate_too_long_length_buffer(&ChannelHandleConstraint::get());

            fixture.call_and_assert_error(MSG_CHANNEL_HANDLE_TOO_LONG);
        });
}

#[test]
fn create_channel_handle_too_short() {
    TestExternalitiesBuilder::<Test>::default()
        .build()
        .execute_with(|| {
            let channel_creator_member_id = add_channel_creator_member();

            let mut fixture = CreateChannelFixture::make_valid_unpulished_video_channel_for(
                channel_creator_member_id,
                None,
            );

            fixture.channel_handle =
                generate_too_short_length_buffer(&ChannelHandleConstraint::get());

            fixture.call_and_assert_error(MSG_CHANNEL_HANDLE_TOO_SHORT);
        });
}

#[test]
fn create_channel_description_too_long() {
    TestExternalitiesBuilder::<Test>::default()
        .build()
        .execute_with(|| {
            let channel_creator_member_id = add_channel_creator_member();

            let mut fixture = CreateChannelFixture::make_valid_unpulished_video_channel_for(
                channel_creator_member_id,
                None,
            );

            fixture.description = Some(generate_too_long_length_buffer(
                &ChannelDescriptionConstraint::get(),
            ));

            fixture.call_and_assert_error(MSG_CHANNEL_DESCRIPTION_TOO_LONG);
        });
}

#[test]
fn create_channel_description_too_short() {
    TestExternalitiesBuilder::<Test>::default()
        .build()
        .execute_with(|| {
            let channel_creator_member_id = add_channel_creator_member();

            let mut fixture = CreateChannelFixture::make_valid_unpulished_video_channel_for(
                channel_creator_member_id,
                None,
            );

            fixture.description = Some(generate_too_short_length_buffer(
                &ChannelDescriptionConstraint::get(),
            ));

            fixture.call_and_assert_error(MSG_CHANNEL_DESCRIPTION_TOO_SHORT);
        });
}

#[test]
fn transfer_channel_ownership_success() {
    TestExternalitiesBuilder::<Test>::default()
        .build()
        .execute_with(|| {
            /*
               Events are not emitted on block 0.
               So any dispatchable calls made during genesis block formation will have no events emitted.
               https://substrate.dev/recipes/2-appetizers/4-events.html
            */
            run_to_block(1);

            // Add channel creator as member
            let channel_creator_member_root_and_controller_account_1 = 1111;
            let channel_creator_member_root_and_controller_account_2 = 2222;

            let channel_creator_member_id_1 = add_member(
                channel_creator_member_root_and_controller_account_1,
                to_vec(CHANNEL_CREATOR_HANDLE),
            );

            let channel_creator_member_id_2 = add_member(
                channel_creator_member_root_and_controller_account_2,
                to_vec(CHANNEL_CREATOR_HANDLE2),
            );

            let create_channel_fixture =
                CreateChannelFixture::make_valid_unpulished_video_channel_for(
                    channel_creator_member_id_1,
                    None,
                );

            let channel_id = create_channel_fixture.call_and_assert_success();

            let original_channel = ChannelById::<Test>::get(channel_id);

            let new_role_account = 3333;

            let transfer_result = ContentWorkingGroup::transfer_channel_ownership(
                Origin::signed(create_channel_fixture.channel_creator_role_account),
                channel_id,
                channel_creator_member_id_2,
                new_role_account,
            );

            assert_ok!(transfer_result);

            let updated_channel = ChannelById::<Test>::get(channel_id);

            assert_eq!(
                updated_channel,
                Channel {
                    owner: channel_creator_member_id_2,
                    role_account: new_role_account,
                    ..original_channel
                }
            );
        });
}

#[test]
fn update_channel_as_owner_success() {}

struct UpdateChannelAsCurationActorFixture {
    pub origin: Origin,
    pub curation_actor: CurationActor<CuratorId<Test>>,
    pub new_verified: Option<bool>,
    pub new_description: Option<OptionalText>,
    pub new_curation_status: Option<ChannelCurationStatus>,
}

impl UpdateChannelAsCurationActorFixture {
    fn update_channel_as_curation_actor(
        &self,
        channel_id: ChannelId<Test>,
    ) -> Result<(), &'static str> {
        ContentWorkingGroup::update_channel_as_curation_actor(
            self.origin.clone(),
            self.curation_actor.clone(),
            channel_id,
            self.new_verified,
            self.new_curation_status,
        )
        .map_err(<&str>::from)
    }

    pub fn call_and_assert_success(&self, channel_id: ChannelId<Test>) {
        let old_channel = ChannelById::<Test>::get(channel_id);

        let upd_verified = self.new_verified.unwrap_or(old_channel.verified);
        let upd_description = self
            .new_description
            .clone()
            .unwrap_or(old_channel.description);
        let upd_curation_status = self
            .new_curation_status
            .unwrap_or(old_channel.curation_status);

        let expected_updated_channel = Channel {
            verified: upd_verified,
            handle: old_channel.handle,
            title: old_channel.title,
            description: upd_description,
            avatar: old_channel.avatar,
            banner: old_channel.banner,
            content: old_channel.content,
            owner: old_channel.owner,
            role_account: old_channel.role_account,
            publication_status: old_channel.publication_status,
            curation_status: upd_curation_status,
            created: old_channel.created,
            principal_id: old_channel.principal_id,
        };

        // Call and check result

        let call_result = self.update_channel_as_curation_actor(channel_id);

        assert_eq!(call_result, Ok(()));

        // Event triggered
        let event_channel_id = Self::get_event_deposited();

        assert_eq!(event_channel_id, channel_id);

        // Channel has been updated correctly
        assert!(ChannelById::<Test>::contains_key(channel_id));

        let updated_channel = ChannelById::<Test>::get(channel_id);

        assert_eq!(updated_channel, expected_updated_channel);
    }

    fn get_event_deposited() -> crate::ChannelId<Test> {
        if let mock::TestEvent::lib(ref x) = System::events().last().unwrap().event {
            if let crate::RawEvent::ChannelUpdatedByCurationActor(ref channel_id) = x {
                return channel_id.clone();
            } else {
                panic!("Event was not ChannelUpdatedByCurationActor.")
            }
        } else {
            panic!("No event deposited.")
        }
    }
}

#[test]
fn update_channel_as_curation_actor_success() {
    TestExternalitiesBuilder::<Test>::default()
        .build()
        .execute_with(|| {
            // Add lead and hire curator
            let curator_params = AddMemberAndApplyOnOpeningParams::new(
                2222,
                to_vec("yoyoyo0"), // generate_valid_length_buffer(&ChannelHandleConstraint::get()),
                2222 * 2,
                generate_valid_length_buffer(&CuratorApplicationHumanReadableText::get()),
            );

            // Hire curator
            let setup_and_fill_opening_result =
                setup_and_fill_opening(&vec![FillOpeningApplicantParams::new(
                    curator_params.clone(),
                    true,
                )]);

            let curator_id = match setup_and_fill_opening_result.application_outomes[0] {
                FillOpeningApplicantOutcome::Hired { curator_id } => curator_id,
                _ => panic!(),
            };

            // Make channel
            let channel_creator_member_id = add_channel_creator_member();
            let channel_id = channel_creator_member_id;

            CreateChannelFixture::make_valid_unpulished_video_channel_for(
                channel_creator_member_id,
                None,
            )
            .call_and_assert_success();

            // Update channel as curator
            UpdateChannelAsCurationActorFixture {
                origin: Origin::signed(curator_params.curator_applicant_role_account),
                curation_actor: CurationActor::Curator(curator_id),
                new_verified: Some(true),
                new_description: None, //  don't touch!
                new_curation_status: Some(ChannelCurationStatus::Censored),
            }
            .call_and_assert_success(channel_id);
        });
}

#[test]
fn add_curator_opening_success() {
    TestExternalitiesBuilder::<Test>::default()
        .build()
        .execute_with(|| {
            /*
             * Setup
             */

            add_member_and_set_as_lead();

            let expected_opening_id = hiring::NextOpeningId::<Test>::get();

            let expected_curator_opening_id = NextCuratorOpeningId::<Test>::get();

            /*
             * Test
             */

            // Add opening
            let activate_at = hiring::ActivateOpeningAt::ExactBlock(34);

            let human_readable_text =
                generate_valid_length_buffer(&OpeningHumanReadableText::get());

            assert_eq!(
                ContentWorkingGroup::add_curator_opening(
                    Origin::signed(LEAD_ROLE_ACCOUNT),
                    activate_at.clone(),
                    get_baseline_opening_policy(),
                    human_readable_text.clone()
                )
                .unwrap(),
                ()
            );

            assert_eq!(
                get_last_event_or_panic(),
                crate::RawEvent::CuratorOpeningAdded(expected_curator_opening_id)
            );

            // Assert that given opening id has been added,
            // and has the right properties.
            assert!(crate::CuratorOpeningById::<Test>::contains_key(
                expected_curator_opening_id
            ));

            let created_curator_opening =
                crate::CuratorOpeningById::<Test>::get(expected_curator_opening_id);

            let expected_curator_opening = CuratorOpening {
                opening_id: expected_opening_id,
                curator_applications: BTreeSet::new(),
                policy_commitment: get_baseline_opening_policy(),
            };

            assert_eq!(created_curator_opening, expected_curator_opening);

            // Assert that next id incremented.
            assert_eq!(
                crate::NextCuratorOpeningId::<Test>::get(),
                expected_opening_id + 1
            );

            /*
             * TODO: add assertion abouot side-effect in hiring module,
             * this is where state of application has fundamentally changed.
             */
        });
}

#[test]
fn accept_curator_applications_success() {
    TestExternalitiesBuilder::<Test>::default()
        .build()
        .execute_with(|| {
            /*
             * Setup
             */

            add_member_and_set_as_lead();

            let curator_opening_id = add_curator_opening();

            /*
             * Test
             */

            assert_eq!(
                ContentWorkingGroup::accept_curator_applications(
                    Origin::signed(LEAD_ROLE_ACCOUNT),
                    curator_opening_id
                )
                .unwrap(),
                ()
            );

            assert_eq!(
                get_last_event_or_panic(),
                crate::RawEvent::AcceptedCuratorApplications(curator_opening_id)
            )

            /*
             * TODO: add assertion abouot side-effect in hiring module,
             * this is where state of application has fundamentally changed.
             */
        });
}

#[test]
fn begin_curator_applicant_review_success() {
    TestExternalitiesBuilder::<Test>::default()
        .build()
        .execute_with(|| {
            /*
             * Setup
             */

            let normal_opening_constructed = setup_normal_accepting_opening();

            let _ = add_member_and_apply_on_opening(
                normal_opening_constructed.curator_opening_id,
                333,
                to_vec("CuratorWannabe"),
                11111,
                generate_valid_length_buffer(&CuratorApplicationHumanReadableText::get()),
            );

            /*
             * Test
             */

            assert_eq!(
                ContentWorkingGroup::begin_curator_applicant_review(
                    Origin::signed(LEAD_ROLE_ACCOUNT),
                    normal_opening_constructed.curator_opening_id
                )
                .unwrap(),
                ()
            );

            assert_eq!(
                get_last_event_or_panic(),
                crate::RawEvent::BeganCuratorApplicationReview(
                    normal_opening_constructed.curator_opening_id
                )
            );

            /*
             * TODO: add assertion abouot side-effect in hiring module,
             * this is where state of application has fundamentally changed.
             */

            // Assert opening is in opening stage... hiring::ActiveOpeningStage::ReviewPeriod
            let opening =
                <hiring::OpeningById<Test>>::get(&normal_opening_constructed.curator_opening_id);
            match opening.stage {
                hiring::OpeningStage::Active { stage, .. } => {
                    match stage {
                        hiring::ActiveOpeningStage::ReviewPeriod {
                            started_review_period_at_block,
                            ..
                        } => {
                            /* OK */
                            // assert_eq!(started_accepting_applicants_at_block, 0);
                            assert_eq!(started_review_period_at_block, System::block_number());
                        }
                        _ => panic!("ActiveOpeningStage must be in ReviewPeriod"),
                    }
                }
                _ => panic!("OpeningStage must be Active"),
            };
        });
}

#[test]
fn fill_curator_opening_success() {
    TestExternalitiesBuilder::<Test>::default()
        .build()
        .execute_with(|| {
            /*
             * Setup
             */

            let applicants = vec![
                FillOpeningApplicantParams::new(
                    AddMemberAndApplyOnOpeningParams::new(
                        2222,
                        to_vec("yoyoyo0"), // generate_valid_length_buffer(&ChannelHandleConstraint::get()),
                        2222 * 2,
                        generate_valid_length_buffer(&CuratorApplicationHumanReadableText::get()),
                    ),
                    true,
                ),
                FillOpeningApplicantParams::new(
                    AddMemberAndApplyOnOpeningParams::new(
                        3333,
                        to_vec("yoyoyo1"), // generate_valid_length_buffer(&ChannelHandleConstraint::get()),
                        3333 * 2,
                        generate_valid_length_buffer(&CuratorApplicationHumanReadableText::get()),
                    ),
                    true,
                ),
                FillOpeningApplicantParams::new(
                    AddMemberAndApplyOnOpeningParams::new(
                        5555,
                        to_vec("yoyoyo2"), // generate_valid_length_buffer(&ChannelHandleConstraint::get()),
                        5555 * 2,
                        generate_valid_length_buffer(&CuratorApplicationHumanReadableText::get()),
                    ),
                    false,
                ),
                FillOpeningApplicantParams::new(
                    AddMemberAndApplyOnOpeningParams::new(
                        6666,
                        to_vec("yoyoyo3"), // generate_valid_length_buffer(&ChannelHandleConstraint::get()),
                        6666 * 2,
                        generate_valid_length_buffer(&CuratorApplicationHumanReadableText::get()),
                    ),
                    true,
                ),
            ];

            /*
             * Exercise and assert
             */

            setup_and_fill_opening(&applicants);
        });
}

#[test]
fn withdraw_curator_application_success() {
    TestExternalitiesBuilder::<Test>::default()
        .build()
        .execute_with(|| {
            /*
             * Setup
             */

            let normal_opening_constructed = setup_normal_accepting_opening();

            let curator_applicant_root_and_controller_account = 333;
            let curator_applicant_role_account = 11111;
            let human_readable_text =
                generate_valid_length_buffer(&CuratorApplicationHumanReadableText::get());

            let result = add_member_and_apply_on_opening(
                normal_opening_constructed.curator_opening_id,
                curator_applicant_root_and_controller_account,
                to_vec("CuratorWannabe"),
                curator_applicant_role_account,
                human_readable_text,
            );

            /*
             * Test
             */

            assert_eq!(
                ContentWorkingGroup::withdraw_curator_application(
                    Origin::signed(curator_applicant_role_account),
                    result.curator_application_id
                )
                .unwrap(),
                ()
            );

            // Event was triggered
            assert_eq!(
                get_last_event_or_panic(),
                crate::RawEvent::CuratorApplicationWithdrawn(result.curator_application_id)
            );

            /*
             * TODO: add assertion abouot side-effect in hiring module,
             * this is where state of application has fundamentally changed.
             */
        });
}

#[test]
fn terminate_curator_application_success() {
    TestExternalitiesBuilder::<Test>::default()
        .build()
        .execute_with(|| {
            /*
             * Setup
             */

            let normal_opening_constructed = setup_normal_accepting_opening();

            let result = add_member_and_apply_on_opening(
                normal_opening_constructed.curator_opening_id,
                333,
                to_vec("CuratorWannabe"),
                11111,
                generate_valid_length_buffer(&CuratorApplicationHumanReadableText::get()),
            );

            /*
             * Test
             */

            assert_eq!(
                ContentWorkingGroup::terminate_curator_application(
                    Origin::signed(LEAD_ROLE_ACCOUNT),
                    normal_opening_constructed.curator_opening_id
                )
                .unwrap(),
                ()
            );

            assert_eq!(
                get_last_event_or_panic(),
                crate::RawEvent::CuratorApplicationTerminated(result.curator_application_id)
            );

            /*
             * TODO: add assertion abouot side-effect in hiring module,
             * this is where state of application has fundamentally changed.
             */
        });
}

#[test]
fn apply_on_curator_opening_success() {
    TestExternalitiesBuilder::<Test>::default()
        .build()
        .execute_with(|| {
            /*
             * Setup
             */

            let normal_opening_constructed = setup_normal_accepting_opening();

            // Add curator membership

            let curator_applicant_root_and_controller_account = 72618;

            let curator_applicant_member_id = add_member(
                curator_applicant_root_and_controller_account,
                to_vec("IwillTrytoapplyhere"),
            );

            let curator_applicant_role_account = 8881111;

            let role_stake_balance = get_baseline_opening_policy()
                .role_staking_policy
                .unwrap()
                .amount;
            let application_stake_balance = get_baseline_opening_policy()
                .application_staking_policy
                .unwrap()
                .amount;
            let total_balance = role_stake_balance + application_stake_balance;

            let source_account = curator_applicant_root_and_controller_account;

            // Credit staking source account
            let _ = balances::Module::<Test>::deposit_creating(&source_account, total_balance);

            let human_readable_text = generate_valid_length_buffer(&ChannelHandleConstraint::get());

            let expected_curator_application_id = NextCuratorApplicationId::<Test>::get();

            let old_curator_opening =
                CuratorOpeningById::<Test>::get(normal_opening_constructed.curator_opening_id);

            let new_curator_application_id = NextCuratorApplicationId::<Test>::get();

            /*
             * Test
             */

            assert_eq!(
                ContentWorkingGroup::apply_on_curator_opening(
                    Origin::signed(curator_applicant_root_and_controller_account),
                    curator_applicant_member_id,
                    normal_opening_constructed.curator_opening_id,
                    curator_applicant_role_account,
                    Some(role_stake_balance),
                    Some(application_stake_balance),
                    human_readable_text
                )
                .unwrap(),
                ()
            );

            assert_eq!(
                get_last_event_or_panic(),
                crate::RawEvent::AppliedOnCuratorOpening(
                    normal_opening_constructed.curator_opening_id,
                    new_curator_application_id
                )
            );

            assert!(CuratorApplicationById::<Test>::contains_key(
                new_curator_application_id
            ));

            // Assert that appropriate application has been added
            let new_curator_application =
                CuratorApplicationById::<Test>::get(new_curator_application_id);

            let expected_curator_application = CuratorApplication {
                role_account: curator_applicant_role_account,
                curator_opening_id: normal_opening_constructed.curator_opening_id,
                member_id: curator_applicant_member_id,
                application_id: expected_curator_application_id,
            };

            assert_eq!(expected_curator_application, new_curator_application);

            // Assert that the opening has had the application added to application list
            let mut singleton = BTreeSet::new(); // Unavoidable mutable, BTreeSet can only be populated this way.
            singleton.insert(new_curator_application_id);

            let new_curator_applications = old_curator_opening
                .curator_applications
                .union(&singleton)
                .cloned()
                .collect();

            let expected_curator_opening = CuratorOpening {
                curator_applications: new_curator_applications,
                ..old_curator_opening
            };

            let new_curator_opening =
                CuratorOpeningById::<Test>::get(normal_opening_constructed.curator_opening_id);

            assert_eq!(expected_curator_opening, new_curator_opening);
        });
}

#[test]
fn multiple_applications_by_same_member_to_opening_fails() {
    TestExternalitiesBuilder::<Test>::default()
        .build()
        .execute_with(|| {
            /*
             * Setup
             */

            let normal_opening_constructed = setup_normal_accepting_opening();

            // Add curator membership

            let curator_applicant_root_and_controller_account = 72618;

            let curator_applicant_member_id = add_member(
                curator_applicant_root_and_controller_account,
                to_vec("IwillTrytoapplyhere"),
            );

            let curator_applicant_role_account = 8881111;

            let role_stake_balance = get_baseline_opening_policy()
                .role_staking_policy
                .unwrap()
                .amount;
            let application_stake_balance = get_baseline_opening_policy()
                .application_staking_policy
                .unwrap()
                .amount;
            let total_balance = role_stake_balance + application_stake_balance;

            let source_account = curator_applicant_root_and_controller_account;

            // Credit staking source account with enough funds for two applications,
            // because we don't want our second application to fail for lack of funds
            let _ = balances::Module::<Test>::deposit_creating(&source_account, total_balance * 2);

            let human_readable_text = generate_valid_length_buffer(&ChannelHandleConstraint::get());

            /*
             * Test
             */

            // First application should work
            assert_ok!(ContentWorkingGroup::apply_on_curator_opening(
                Origin::signed(curator_applicant_root_and_controller_account),
                curator_applicant_member_id,
                normal_opening_constructed.curator_opening_id,
                curator_applicant_role_account,
                Some(role_stake_balance),
                Some(application_stake_balance),
                human_readable_text.clone()
            ));

            // Second application should fail since
            // first application is still active
            assert_err!(
                ContentWorkingGroup::apply_on_curator_opening(
                    Origin::signed(curator_applicant_root_and_controller_account),
                    curator_applicant_member_id,
                    normal_opening_constructed.curator_opening_id,
                    curator_applicant_role_account,
                    Some(role_stake_balance),
                    Some(application_stake_balance),
                    human_readable_text
                ),
                MSG_MEMBER_HAS_ACTIVE_APPLICATION_ON_OPENING
            );
        });
}

struct UpdateCuratorRoleAccountFixture {
    pub origin: Origin,
    pub member_id: <Test as membership::Trait>::MemberId,
    pub curator_id: CuratorId<Test>,
    pub new_role_account: <Test as system::Trait>::AccountId,
}

impl UpdateCuratorRoleAccountFixture {
    fn call(&self) -> Result<(), &'static str> {
        ContentWorkingGroup::update_curator_role_account(
            self.origin.clone(),
            self.member_id,
            self.curator_id,
            self.new_role_account,
        )
        .map_err(<&str>::from)
    }

    pub fn call_and_assert_success(&self) {
        let original_curator = CuratorById::<Test>::get(self.curator_id);

        let call_result = self.call();

        assert_eq!(call_result, Ok(()));

        let updated_curator = CuratorById::<Test>::get(self.curator_id);

        assert_eq!(
            crate::Curator {
                role_account: self.new_role_account,
                ..original_curator
            },
            updated_curator
        );

        let (event_curator_id, event_new_role_account) =
            if let mock::TestEvent::lib(ref x) = System::events().last().unwrap().event {
                if let crate::RawEvent::CuratorRoleAccountUpdated(
                    ref curator_id,
                    ref new_role_account,
                ) = x
                {
                    (curator_id.clone(), new_role_account.clone())
                } else {
                    panic!("Event was not CuratorRoleAccountUpdated.")
                }
            } else {
                panic!("No event deposited.")
            };

        assert_eq!(self.curator_id, event_curator_id);

        assert_eq!(self.new_role_account, event_new_role_account);
    }
}

#[test]
fn update_curator_role_account_success() {
    TestExternalitiesBuilder::<Test>::default()
        .build()
        .execute_with(|| {
            let result = setup_lead_and_hire_curator();

            let fixture = UpdateCuratorRoleAccountFixture {
                origin: Origin::signed(
                    result
                        .curator_params()
                        .curator_applicant_root_and_controller_account,
                ),
                member_id: result.curator_member_id(),
                curator_id: result.curator_id(),
                new_role_account: 777777,
            };

            fixture.call_and_assert_success();
        });
}

struct UpdateCuratorRewardAccountFixture {
    pub origin: Origin,
    pub curator_id: CuratorId<Test>,
    pub new_reward_account: <Test as system::Trait>::AccountId,
}

impl UpdateCuratorRewardAccountFixture {
    #[allow(dead_code)] // delete if the method is unnecessary
    fn call(&self) -> Result<(), &'static str> {
        ContentWorkingGroup::update_curator_reward_account(
            self.origin.clone(),
            self.curator_id,
            self.new_reward_account,
        )
        .map_err(<&str>::from)
    }

    #[allow(dead_code)] // delete if the method is unnecessary
    pub fn call_and_assert_success(&self) {
        let _original_curator = CuratorById::<Test>::get(self.curator_id);

        let call_result = self.call();

        assert_eq!(call_result, Ok(()));

        /*
            Actually checking new reward account requires checking call to token mint module, but we cannot do that properly yet.
        */

        let (event_curator_id, event_reward_account) =
            if let mock::TestEvent::lib(ref x) = System::events().last().unwrap().event {
                if let crate::RawEvent::CuratorRewardAccountUpdated(
                    ref curator_id,
                    ref reward_account,
                ) = x
                {
                    (curator_id.clone(), reward_account.clone())
                } else {
                    panic!("Event was not CuratorRewardAccountUpdated.")
                }
            } else {
                panic!("No event deposited.")
            };

        assert_eq!(self.curator_id, event_curator_id);

        assert_eq!(self.new_reward_account, event_reward_account);
    }
}

#[test]
fn update_curator_reward_account_success() {
    TestExternalitiesBuilder::<Test>::default()
        .build()
        .execute_with(|| {
            let result = setup_lead_and_hire_curator();

            let _fixture = UpdateCuratorRewardAccountFixture {
                origin: Origin::signed(result.curator_params().curator_applicant_role_account),
                curator_id: result.curator_id(),
                new_reward_account: 123321,
            };

            // TEMPORARILY DISABLED
            //fixture.call_and_assert_success();
        });
}

struct LeaveCuratorRoleFixture {
    pub origin: Origin,
    pub curator_id: CuratorId<Test>,
    pub rationale_text: Vec<u8>,
}

impl LeaveCuratorRoleFixture {
    fn call(&self) -> Result<(), &'static str> {
        ContentWorkingGroup::leave_curator_role(
            self.origin.clone(),
            self.curator_id,
            self.rationale_text.clone(),
        )
        .map_err(<&str>::from)
    }

    pub fn call_and_assert_success(&self) {
        let original_curator = CuratorById::<Test>::get(self.curator_id);

        let call_result = self.call();

        assert_eq!(call_result, Ok(()));

        let expected_curator = Curator {
            stage: CuratorRoleStage::Unstaking(CuratorExitSummary::new(
                &CuratorExitInitiationOrigin::Curator,
                &1,
                &self.rationale_text,
            )),
            ..(original_curator.clone())
        };

        let updated_curator = CuratorById::<Test>::get(self.curator_id);

        assert_eq!(updated_curator, expected_curator);

        assert_eq!(
            get_last_event_or_panic(),
            crate::RawEvent::CuratorUnstaking(self.curator_id)
        );

        // Tracking unstaking
        let curator_role_stake_id = original_curator.role_stake_profile.unwrap().stake_id;

        assert!(UnstakerByStakeId::<Test>::contains_key(
            curator_role_stake_id
        ));

        let unstaker = UnstakerByStakeId::<Test>::get(curator_role_stake_id);

        assert_eq!(unstaker, WorkingGroupUnstaker::Curator(self.curator_id));

        /*
         * TODO: Missing checks to calls to
         * recurringrewards, stake
         */
    }
}

#[test]
fn leave_curator_role_success() {
    TestExternalitiesBuilder::<Test>::default()
        .build()
        .execute_with(|| {
            let result = setup_lead_and_hire_curator();

            let fixture = LeaveCuratorRoleFixture {
                origin: Origin::signed(result.curator_params().curator_applicant_role_account),
                curator_id: result.curator_id(),
                rationale_text: "I am sick of this horrible thing".as_bytes().to_vec(),
            };

            fixture.call_and_assert_success();
        });
}

struct TerminateCuratorRoleFixture {
    pub origin: Origin,
    pub curator_id: CuratorId<Test>,
    pub rationale_text: Vec<u8>,
}

impl TerminateCuratorRoleFixture {
    fn call(&self) -> Result<(), &'static str> {
        ContentWorkingGroup::terminate_curator_role(
            self.origin.clone(),
            self.curator_id,
            self.rationale_text.clone(),
        )
        .map_err(<&str>::from)
    }

    pub fn call_and_assert_success(&self) {
        let original_curator = CuratorById::<Test>::get(self.curator_id);

        let call_result = self.call();

        assert_eq!(call_result, Ok(()));

        let expected_curator = Curator {
            stage: CuratorRoleStage::Unstaking(CuratorExitSummary::new(
                &CuratorExitInitiationOrigin::Lead,
                &1,
                &self.rationale_text,
            )),
            ..(original_curator.clone())
        };

        let updated_curator = CuratorById::<Test>::get(self.curator_id);

        assert_eq!(updated_curator, expected_curator);

        assert_eq!(
            get_last_event_or_panic(),
            crate::RawEvent::CuratorUnstaking(self.curator_id)
        );

        // Tracking unstaking
        let curator_role_stake_id = original_curator.role_stake_profile.unwrap().stake_id;

        assert!(UnstakerByStakeId::<Test>::contains_key(
            curator_role_stake_id
        ));

        let unstaker = UnstakerByStakeId::<Test>::get(curator_role_stake_id);

        assert_eq!(unstaker, WorkingGroupUnstaker::Curator(self.curator_id));

        /*
         * TODO: Missing checks to calls to
         * recurringrewards, stake
         */
    }
}

#[test]
fn terminate_curator_role_success() {
    TestExternalitiesBuilder::<Test>::default()
        .build()
        .execute_with(|| {
            let result = setup_lead_and_hire_curator();

            let fixture = TerminateCuratorRoleFixture {
                origin: Origin::signed(LEAD_ROLE_ACCOUNT),
                curator_id: result.curator_id(),
                rationale_text: "This curator is a joke!".as_bytes().to_vec(),
            };

            fixture.call_and_assert_success();
        });
}

struct SetLeadFixture {
    pub origin: Origin,
    pub member_id: <Test as membership::Trait>::MemberId,
    pub new_role_account: <Test as system::Trait>::AccountId,
}

impl SetLeadFixture {
    fn call(&self) -> Result<(), &'static str> {
        ContentWorkingGroup::replace_lead(
            self.origin.clone(),
            Some((self.member_id, self.new_role_account)),
        )
        .map_err(<&str>::from)
    }

    pub fn call_and_assert_success(&self) {
        let original_next_lead_id = NextLeadId::<Test>::get();

        let call_result = self.call();

        assert_eq!(call_result, Ok(()));

        let updated_next_lead_id = NextLeadId::<Test>::get();

        assert_eq!(original_next_lead_id + 1, updated_next_lead_id);

        let new_lead_id = if let Some(id) = CurrentLeadId::<Test>::get() {
            id
        } else {
            panic!("Lead not set when it must be.")
        };

        let new_lead = LeadById::<Test>::get(new_lead_id);

        let expected_new_lead = Lead {
            member_id: self.member_id,
            role_account: self.new_role_account,
            reward_relationship: None,
            inducted: 1, // make dynamic later
            stage: LeadRoleState::Active,
        };

        assert_eq!(new_lead, expected_new_lead);

        assert_eq!(
            get_last_event_or_panic(),
            crate::RawEvent::LeadSet(new_lead_id)
        );
    }
}

#[test]
fn set_lead_success() {
    TestExternalitiesBuilder::<Test>::default()
        .build()
        .execute_with(|| {
            /*
               Events are not emitted on block 0.
               So any dispatchable calls made during genesis block formation will have no events emitted.
               https://substrate.dev/recipes/2-appetizers/4-events.html
            */
            run_to_block(1);

            let member_id =
                add_member(LEAD_ROOT_AND_CONTROLLER_ACCOUNT, to_vec(LEAD_MEMBER_HANDLE));

            SetLeadFixture {
                origin: RawOrigin::Root.into(),
                member_id,
                new_role_account: 44444,
            }
            .call_and_assert_success();
        });
}

struct UnsetLeadFixture {
    pub origin: Origin,
}

impl UnsetLeadFixture {
    fn call(&self) -> Result<(), &'static str> {
        ContentWorkingGroup::replace_lead(self.origin.clone(), None).map_err(<&str>::from)
    }

    pub fn call_and_assert_success(&self) {
        let original_lead_id = CurrentLeadId::<Test>::get().unwrap();
        let original_lead = LeadById::<Test>::get(original_lead_id);

        let call_result = self.call();

        assert_eq!(call_result, Ok(()));

        assert!(CurrentLeadId::<Test>::get().is_none());

        let updated_lead = LeadById::<Test>::get(original_lead_id);

        let expected_updated_lead = Lead {
            stage: LeadRoleState::Exited(ExitedLeadRole {
                initiated_at_block_number: 1,
            }),
            ..original_lead
        };

        assert_eq!(updated_lead, expected_updated_lead);

        assert_eq!(
            get_last_event_or_panic(),
            crate::RawEvent::LeadUnset(original_lead_id)
        );
    }
}

#[test]
fn unset_lead_success() {
    TestExternalitiesBuilder::<Test>::default()
        .build()
        .execute_with(|| {
            let _ = add_member_and_set_as_lead();

            UnsetLeadFixture {
                origin: RawOrigin::Root.into(),
            }
            .call_and_assert_success();
        });
}

struct UnstakedFixture {
    pub stake_id: StakeId<Test>,
}

impl UnstakedFixture {
    fn call(&self) {
        ContentWorkingGroup::unstaked(self.stake_id);
    }

    pub fn call_and_assert_success(&self) {
        let unstaker = UnstakerByStakeId::<Test>::get(self.stake_id);

        let curator_id = if let WorkingGroupUnstaker::Curator(curator_id) = unstaker {
            curator_id
        } else {
            panic!("Unstaker not curator")
        };

        let original_curator = CuratorById::<Test>::get(curator_id);

        let original_exit_summary =
            if let CuratorRoleStage::Unstaking(exit_summary) = (original_curator.clone()).stage {
                exit_summary
            } else {
                panic!("Curator not unstaking")
            };

        self.call();

        let expected_curator = Curator {
            stage: CuratorRoleStage::Exited(original_exit_summary),
            ..(original_curator.clone())
        };

        let updated_curator = CuratorById::<Test>::get(curator_id);

        assert_eq!(updated_curator, expected_curator);

        assert_eq!(
            get_last_event_or_panic(),
            crate::RawEvent::TerminatedCurator(curator_id)
        );

        // Unstaker gone
        assert!(!UnstakerByStakeId::<Test>::contains_key(self.stake_id));
    }

    // pub fn call_and_assert_failed_result(&self, error_message: &'static str) {
    //     let call_result = self.call();

    //     assert_eq!(call_result, Err(error_message));
    // }
}

#[test]
fn unstaked_curator_success() {
    TestExternalitiesBuilder::<Test>::default()
        .build()
        .execute_with(|| {
            let result = setup_lead_and_hire_curator();

            TerminateCuratorRoleFixture {
                origin: Origin::signed(LEAD_ROLE_ACCOUNT),
                curator_id: result.curator_id(),
                rationale_text: "This curator is a joke!".as_bytes().to_vec(),
            }
            .call_and_assert_success();

            let curator_role_stake_id = CuratorById::<Test>::get(result.curator_id())
                .role_stake_profile
                .unwrap()
                .stake_id;

            UnstakedFixture {
                stake_id: curator_role_stake_id,
            }
            .call_and_assert_success();
        });
}

#[test]
fn account_can_act_as_principal_success() {}

/*
 * Fixtures
 */

static LEAD_ROOT_AND_CONTROLLER_ACCOUNT: <Test as system::Trait>::AccountId = 1289;
static LEAD_ROLE_ACCOUNT: <Test as system::Trait>::AccountId = 1289;
static LEAD_MEMBER_HANDLE: &str = "IamTheLead";
static CHANNEL_CREATOR_ROOT_AND_CONTROLLER_ACCOUNT: <Test as system::Trait>::AccountId = 11;
static CHANNEL_CREATOR_HANDLE: &str = "Coolcreator1";
static CHANNEL_CREATOR_HANDLE2: &str = "Coolcreator2";

fn make_generic_add_member_params() -> AddMemberAndApplyOnOpeningParams {
    AddMemberAndApplyOnOpeningParams::new(
        2222,
        to_vec("yoyoyo0"), // generate_valid_length_buffer(&ChannelHandleConstraint::get()),
        2222 * 2,
        generate_valid_length_buffer(&CuratorApplicationHumanReadableText::get()),
    )
}

/// Made into function to avoid having to clone every time we read fields
pub fn get_baseline_opening_policy(
) -> OpeningPolicyCommitment<<Test as system::Trait>::BlockNumber, BalanceOf<Test>> {
    OpeningPolicyCommitment {
        application_rationing_policy: Some(hiring::ApplicationRationingPolicy {
            max_active_applicants: 5,
        }),
        max_review_period_length: 100,
        application_staking_policy: Some(hiring::StakingPolicy {
            amount: 40000,
            amount_mode: hiring::StakingAmountLimitMode::Exact,
            crowded_out_unstaking_period_length: Some(3),
            review_period_expired_unstaking_period_length: Some(22),
        }),
        role_staking_policy: Some(hiring::StakingPolicy {
            amount: 900000,
            amount_mode: hiring::StakingAmountLimitMode::AtLeast,
            crowded_out_unstaking_period_length: Some(30),
            review_period_expired_unstaking_period_length: Some(2),
        }),
        role_slashing_terms: SlashingTerms::Unslashable,

        fill_opening_successful_applicant_application_stake_unstaking_period: None,
        fill_opening_failed_applicant_application_stake_unstaking_period: None,
        fill_opening_failed_applicant_role_stake_unstaking_period: None,
        terminate_curator_application_stake_unstaking_period: None,
        terminate_curator_role_stake_unstaking_period: None,
        exit_curator_role_application_stake_unstaking_period: None,
        exit_curator_role_stake_unstaking_period: None,
    }
}

pub fn to_vec(s: &str) -> Vec<u8> {
    s.as_bytes().to_vec()
}

// MOVE THIS LATER WHEN fill_opening is factored out
#[derive(Clone)]
pub struct FillOpeningApplicantParams {
    pub add_and_apply_params: AddMemberAndApplyOnOpeningParams,
    pub hire: bool,
}

impl FillOpeningApplicantParams {
    pub fn new(add_and_apply_params: AddMemberAndApplyOnOpeningParams, hire: bool) -> Self {
        Self {
            add_and_apply_params: add_and_apply_params.clone(),
            hire: hire,
        }
    }
}

#[derive(Clone)]
pub struct AddMemberAndApplyOnOpeningParams {
    pub curator_applicant_root_and_controller_account: <Test as system::Trait>::AccountId,
    pub handle: Vec<u8>,
    pub curator_applicant_role_account: <Test as system::Trait>::AccountId,
    pub human_readable_text: Vec<u8>,
}

impl AddMemberAndApplyOnOpeningParams {
    pub fn new(
        curator_applicant_root_and_controller_account: <Test as system::Trait>::AccountId,
        handle: Vec<u8>,
        curator_applicant_role_account: <Test as system::Trait>::AccountId,
        human_readable_text: Vec<u8>,
    ) -> Self {
        Self {
            curator_applicant_root_and_controller_account,
            handle,
            curator_applicant_role_account,
            human_readable_text,
        }
    }
}

fn add_members_and_apply_on_opening(
    curator_opening_id: CuratorOpeningId<Test>,
    applicants: &Vec<AddMemberAndApplyOnOpeningParams>,
) -> Vec<NewMemberAppliedResult> {
    applicants
        .iter()
        .cloned()
        .map(|params| -> NewMemberAppliedResult {
            add_member_and_apply_on_opening(
                curator_opening_id,
                params.curator_applicant_root_and_controller_account,
                params.handle,
                params.curator_applicant_role_account,
                params.human_readable_text,
            )
        })
        .collect()
}

#[derive(Clone)]
struct NewMemberAppliedResult {
    pub member_id: <Test as membership::Trait>::MemberId,
    pub curator_application_id: crate::CuratorApplicationId<Test>,
}

fn add_member_and_apply_on_opening(
    curator_opening_id: CuratorOpeningId<Test>,
    curator_applicant_root_and_controller_account: <Test as system::Trait>::AccountId,
    handle: Vec<u8>,
    curator_applicant_role_account: <Test as system::Trait>::AccountId,
    human_readable_text: Vec<u8>,
) -> NewMemberAppliedResult {
    // Make membership
    let curator_applicant_member_id =
        add_member(curator_applicant_root_and_controller_account, handle);

    // Guarantee sufficient stake
    let role_stake_balance = if let Some(policy) = get_baseline_opening_policy().role_staking_policy
    {
        policy.amount
    } else {
        0
    };

    let application_stake_balance =
        if let Some(policy) = get_baseline_opening_policy().application_staking_policy {
            policy.amount
        } else {
            0
        };

    let total_balance = role_stake_balance + application_stake_balance;

    let source_account = curator_applicant_root_and_controller_account;

    // Credit staking source account if required
    if total_balance > 0 {
        let _ = balances::Module::<Test>::deposit_creating(&source_account, total_balance);
    }

    let expected_hiring_application_id = <hiring::NextApplicationId<Test>>::get();

    let old_curator_opening = CuratorOpeningById::<Test>::get(curator_opening_id);

    let new_curator_application_id = NextCuratorApplicationId::<Test>::get();

    /*
     * Test
     */

    assert_eq!(
        ContentWorkingGroup::apply_on_curator_opening(
            Origin::signed(curator_applicant_root_and_controller_account),
            curator_applicant_member_id,
            curator_opening_id,
            curator_applicant_role_account,
            Some(role_stake_balance),
            Some(application_stake_balance),
            human_readable_text
        )
        .unwrap(),
        ()
    );

    assert_eq!(
        get_last_event_or_panic(),
        crate::RawEvent::AppliedOnCuratorOpening(curator_opening_id, new_curator_application_id)
    );

    assert!(CuratorApplicationById::<Test>::contains_key(
        new_curator_application_id
    ));

    // Assert that appropriate application has been added
    let new_curator_application = CuratorApplicationById::<Test>::get(new_curator_application_id);

    let expected_curator_application = CuratorApplication {
        role_account: curator_applicant_role_account,
        curator_opening_id: curator_opening_id,
        member_id: curator_applicant_member_id,
        application_id: expected_hiring_application_id,
    };

    assert_eq!(expected_curator_application, new_curator_application);

    // Assert that the opening has had the application added to application list
    let mut singleton = BTreeSet::new(); // Unavoidable mutable, BTreeSet can only be populated this way.
    singleton.insert(new_curator_application_id);

    let new_curator_applications = old_curator_opening
        .curator_applications
        .union(&singleton)
        .cloned()
        .collect();

    let expected_curator_opening = CuratorOpening {
        curator_applications: new_curator_applications,
        ..old_curator_opening
    };

    let new_curator_opening = CuratorOpeningById::<Test>::get(curator_opening_id);

    assert_eq!(expected_curator_opening, new_curator_opening);

    NewMemberAppliedResult {
        member_id: curator_applicant_member_id,
        curator_application_id: new_curator_application_id,
    }
}

struct NormalOpeningConstructed {
    pub curator_opening_id: CuratorOpeningId<Test>,
    pub new_member_as_lead: NewMemberAsLead,
}

fn setup_normal_opening() -> NormalOpeningConstructed {
    let new_member_as_lead = add_member_and_set_as_lead();

    let expected_curator_opening_id = NextCuratorOpeningId::<Test>::get();

    assert_eq!(
        ContentWorkingGroup::add_curator_opening(
            Origin::signed(LEAD_ROLE_ACCOUNT),
            hiring::ActivateOpeningAt::ExactBlock(34),
            get_baseline_opening_policy(),
            generate_valid_length_buffer(&OpeningHumanReadableText::get())
        )
        .unwrap(),
        ()
    );

    assert_eq!(
        get_last_event_or_panic(),
        crate::RawEvent::CuratorOpeningAdded(expected_curator_opening_id)
    );

    NormalOpeningConstructed {
        curator_opening_id: expected_curator_opening_id,
        new_member_as_lead,
    }
}

fn setup_normal_accepting_opening() -> NormalOpeningConstructed {
    let normal_opening_constructed = setup_normal_opening();

    assert_eq!(
        ContentWorkingGroup::accept_curator_applications(
            Origin::signed(LEAD_ROLE_ACCOUNT), // <== get dynamic value from somewhere else later
            normal_opening_constructed.curator_opening_id
        )
        .unwrap(),
        ()
    );

    normal_opening_constructed
}

struct SetupOpeningInReview {
    //pub curator_opening_id: lib::CuratorOpeningId<Test>,
    pub normal_opening_constructed: NormalOpeningConstructed,
    pub added_members_application_result: Vec<NewMemberAppliedResult>,
}

fn setup_opening_in_review(
    applicants: &Vec<AddMemberAndApplyOnOpeningParams>,
) -> SetupOpeningInReview {
    let normal_opening_constructed = setup_normal_accepting_opening();

    let added_members_application_result =
        add_members_and_apply_on_opening(normal_opening_constructed.curator_opening_id, applicants);

    assert_eq!(
        ContentWorkingGroup::begin_curator_applicant_review(
            Origin::signed(LEAD_ROLE_ACCOUNT),
            normal_opening_constructed.curator_opening_id
        )
        .unwrap(),
        ()
    );

    // TODO: assert event stuff !!!!

    SetupOpeningInReview {
        normal_opening_constructed,
        added_members_application_result,
    }
}

enum FillOpeningApplicantOutcome {
    NotHired,
    Hired { curator_id: CuratorId<Test> },
}

struct SetupAndFillOpeningResult {
    setup_opening_in_review: SetupOpeningInReview,
    application_outomes: Vec<FillOpeningApplicantOutcome>,
}

fn setup_and_fill_opening(
    applicants: &Vec<FillOpeningApplicantParams>,
) -> SetupAndFillOpeningResult {
    let setup_opening_params = applicants
        .iter()
        .cloned()
        .map(|param| param.add_and_apply_params)
        .collect::<Vec<_>>();

    let setup_opening_in_review = setup_opening_in_review(&setup_opening_params);

    let curator_opening = CuratorOpeningById::<Test>::get(
        setup_opening_in_review
            .normal_opening_constructed
            .curator_opening_id,
    );

    // Set whom to hire
    let applicants_to_hire_iter = applicants.iter().filter(|params| params.hire);

    let num_applicants_hired = applicants_to_hire_iter.cloned().count();

    let hired_applicant_and_result = setup_opening_in_review
        .added_members_application_result
        .iter()
        .zip(applicants.iter())
        .filter(|(_, fill_opening_applicant_params)| fill_opening_applicant_params.hire)
        .collect::<Vec<_>>();

    let successful_curator_application_ids = hired_applicant_and_result
        .iter()
        .map(|(new_member_applied_result, _)| new_member_applied_result.curator_application_id)
        .collect::<BTreeSet<_>>();

    // Remember original id counters
    let original_next_curator_id = NextCuratorId::<Test>::get();
    let original_next_principal_id = NextPrincipalId::<Test>::get();

    /*
     * Call
     */

    assert_eq!(
        ContentWorkingGroup::fill_curator_opening(
            Origin::signed(LEAD_ROLE_ACCOUNT),
            setup_opening_in_review
                .normal_opening_constructed
                .curator_opening_id,
            successful_curator_application_ids.clone(),
            None
        ),
        Ok(())
    );

    /*
     * Asserts
     */

    let successful_curator_application_id_to_curator_id = successful_curator_application_ids
        .iter()
        .enumerate()
        .map(
            |(index, item)| -> (CuratorApplicationId<Test>, CuratorId<Test>) {
                let curator_id = original_next_curator_id + (index as CuratorId<Test>);

                (*item, curator_id)
            },
        )
        .collect::<BTreeMap<_, _>>();

    assert_eq!(
        get_last_event_or_panic(),
        crate::RawEvent::CuratorOpeningFilled(
            setup_opening_in_review
                .normal_opening_constructed
                .curator_opening_id,
            successful_curator_application_id_to_curator_id
        )
    );

    // The right number of curators have been created
    let num_curators_created = NextCuratorId::<Test>::get() - original_next_curator_id;

    assert_eq!(num_curators_created, (num_applicants_hired as u64));

    // The right numbe of prinipals were created
    let num_principals_created = NextPrincipalId::<Test>::get() - original_next_principal_id;

    assert_eq!(num_principals_created, (num_applicants_hired as u64));

    // Inspect all expected curators and principal added
    for (hired_index, item) in hired_applicant_and_result.iter().enumerate() {
        let (new_member_applied_result, fill_opening_applicant_params) = item;

        // Curator
        let expected_added_curator_id: u64 = (hired_index as u64) + original_next_curator_id;

        // Principal
        let expected_added_principal_id: u64 = (hired_index as u64) + original_next_principal_id;

        // Curator added
        assert!(CuratorById::<Test>::contains_key(expected_added_curator_id));

        let added_curator = CuratorById::<Test>::get(expected_added_curator_id);

        // expected_curator
        let reward_relationship = None::<<Test as recurringrewards::Trait>::RewardRelationshipId>;

        let curator_application =
            CuratorApplicationById::<Test>::get(new_member_applied_result.curator_application_id);
        let application_id = curator_application.application_id;
        let application = hiring::ApplicationById::<Test>::get(application_id);

        let role_stake_profile = if let Some(ref stake_id) = application.active_role_staking_id {
            // get_baseline_opening_policy().role_staking_policy {

            Some(CuratorRoleStakeProfile::new(
                stake_id,
                &curator_opening
                    .policy_commitment
                    .terminate_curator_role_stake_unstaking_period,
                &curator_opening
                    .policy_commitment
                    .exit_curator_role_stake_unstaking_period,
            ))
        } else {
            None
        };

        let expected_curator = Curator {
            role_account: fill_opening_applicant_params
                .add_and_apply_params
                .curator_applicant_role_account,
            reward_relationship: reward_relationship,
            role_stake_profile: role_stake_profile, //  added_curator.role_stake_profile.clone(),
            stage: CuratorRoleStage::Active,
            induction: CuratorInduction::new(
                &setup_opening_in_review
                    .normal_opening_constructed
                    .new_member_as_lead
                    .lead_id,
                &new_member_applied_result.curator_application_id,
                &1,
            ),
            principal_id: expected_added_principal_id,
        };

        assert_eq!(expected_curator, added_curator);

        // Principal added
        assert!(PrincipalById::<Test>::contains_key(
            expected_added_principal_id
        ));

        let added_principal = PrincipalById::<Test>::get(expected_added_principal_id);

        let expected_added_principal = Principal::Curator(expected_added_principal_id);

        assert_eq!(added_principal, expected_added_principal);
    }

    /*
     * TODO: add assertion abouot side-effect in !hiring & membership! module,
     * this is where state of application has fundamentally changed.
     */

    let application_outomes = applicants
        .iter()
        .enumerate()
        .map(|(index, params)| {
            if params.hire {
                FillOpeningApplicantOutcome::Hired {
                    curator_id: (index as u64) + original_next_curator_id,
                }
            } else {
                FillOpeningApplicantOutcome::NotHired
            }
        })
        .collect::<Vec<_>>();

    SetupAndFillOpeningResult {
        setup_opening_in_review,
        application_outomes,
    }
}

struct SetupLeadAndHireCuratorResult {
    pub curator_params: AddMemberAndApplyOnOpeningParams,
    pub setup_and_fill_opening_result: SetupAndFillOpeningResult,
}

impl SetupLeadAndHireCuratorResult {
    fn curator_params(&self) -> AddMemberAndApplyOnOpeningParams {
        self.curator_params.clone()
    }

    pub fn curator_id(&self) -> CuratorId<Test> {
        match self.setup_and_fill_opening_result.application_outomes[0] {
            FillOpeningApplicantOutcome::Hired { curator_id } => curator_id,
            _ => panic!(),
        }
    }

    pub fn curator_member_id(&self) -> <Test as membership::Trait>::MemberId {
        self.setup_and_fill_opening_result
            .setup_opening_in_review
            .added_members_application_result[0]
            .member_id
    }
}

fn setup_lead_and_hire_curator() -> SetupLeadAndHireCuratorResult {
    let curator_params = make_generic_add_member_params();

    // Hire curator
    let setup_and_fill_opening_result =
        setup_and_fill_opening(&vec![FillOpeningApplicantParams::new(
            curator_params.clone(),
            true,
        )]);

    SetupLeadAndHireCuratorResult {
        curator_params,
        setup_and_fill_opening_result,
    }
}

struct CreateChannelFixture {
    pub channel_creator_member_id: <Test as membership::Trait>::MemberId,
    pub controller_account: <Test as system::Trait>::AccountId,
    pub channel_creator_role_account: <Test as system::Trait>::AccountId,
    pub channel_handle: Vec<u8>,
    pub channel_title: OptionalText,
    pub description: OptionalText,
    pub avatar: OptionalText,
    pub banner: OptionalText,
    pub content: ChannelContentType,
    pub publication_status: ChannelPublicationStatus,
}

impl CreateChannelFixture {
    pub fn make_valid_unpulished_video_channel_for(
        channel_creator_member_id: <Test as membership::Trait>::MemberId,
        override_controller_account: Option<<Test as system::Trait>::AccountId>,
    ) -> Self {
        let controller_account = if let Some(account) = override_controller_account {
            account
        } else {
            membership::Module::<Test>::ensure_membership(channel_creator_member_id)
                .unwrap()
                .controller_account
        };

        Self {
            channel_creator_member_id,
            controller_account,
            channel_creator_role_account: 527489,
            channel_handle: generate_valid_length_buffer(&ChannelHandleConstraint::get()),
            channel_title: Some(generate_valid_length_buffer(&ChannelTitleConstraint::get())),
            avatar: Some(generate_valid_length_buffer(&ChannelAvatarConstraint::get())),
            banner: Some(generate_valid_length_buffer(&ChannelBannerConstraint::get())),
            description: Some(generate_valid_length_buffer(
                &ChannelDescriptionConstraint::get(),
            )),
            content: ChannelContentType::Video,
            publication_status: ChannelPublicationStatus::Unlisted,
        }
    }

    fn create_channel(&self) -> Result<(), &'static str> {
        ContentWorkingGroup::create_channel(
            Origin::signed(self.controller_account),
            self.channel_creator_member_id,
            self.channel_creator_role_account,
            self.content.clone(),
            self.channel_handle.clone(),
            self.channel_title.clone(),
            self.description.clone(),
            self.avatar.clone(),
            self.banner.clone(),
            self.publication_status.clone(),
        )
        .map_err(<&str>::from)
    }

    pub fn call_and_assert_error(&self, err_message: &'static str) {
        let number_of_events_before_call = System::events().len();

        let call_result = self.create_channel();

        assert_eq!(call_result, Err(err_message));

        // No new events deposited
        assert_eq!(System::events().len(), number_of_events_before_call);
    }

    pub fn call_and_assert_success(&self) -> ChannelId<Test> {
        let old_next_channel_id = NextChannelId::<Test>::get();

        let call_result = self.create_channel();

        // Call result was Ok
        assert_eq!(call_result, Ok(()));

        // Assert that event was triggered,
        // keep channel id.
        assert_eq!(
            get_last_event_or_panic(),
            crate::RawEvent::ChannelCreated(old_next_channel_id)
        );

        let channel_id = old_next_channel_id;

        // Assert that given channel id has been added,
        // and has the right properties.
        assert!(crate::ChannelById::<Test>::contains_key(channel_id));

        let created_channel = crate::ChannelById::<Test>::get(channel_id);

        let expected_channel = Channel {
            verified: false,
            handle: self.channel_handle.clone(),
            title: self.channel_title.clone(),
            avatar: self.avatar.clone(),
            banner: self.banner.clone(),
            description: self.description.clone(),
            content: self.content.clone(),
            owner: self.channel_creator_member_id,
            role_account: self.channel_creator_role_account,
            publication_status: self.publication_status.clone(),
            curation_status: ChannelCurationStatus::Normal,
            created: 1, // <== replace with now()

            // We have no expectation here, so we just copy what was added
            principal_id: created_channel.principal_id,
        };

        assert_eq!(created_channel, expected_channel);

        // Assert that next id incremented.
        assert_eq!(crate::NextChannelId::<Test>::get(), channel_id + 1);

        // Assert that there is a mapping established for handle
        assert_eq!(
            crate::ChannelIdByHandle::<Test>::get(self.channel_handle.clone()),
            channel_id
        );

        // Check that principal actually has been added
        assert!(crate::PrincipalById::<Test>::contains_key(
            created_channel.principal_id
        ));

        let created_principal = crate::PrincipalById::<Test>::get(created_channel.principal_id);

        assert!(match created_principal {
            Principal::Lead => false,
            Principal::Curator(_) => false,
            Principal::ChannelOwner(created_principal_channel_id) =>
                created_principal_channel_id == channel_id,
        });

        channel_id
    }
}

struct NewMemberAsLead {
    pub member_id: <Test as membership::Trait>::MemberId,
    pub lead_id: LeadId<Test>,
}

fn add_member_and_set_as_lead() -> NewMemberAsLead {
    let member_id = add_member(LEAD_ROOT_AND_CONTROLLER_ACCOUNT, to_vec(LEAD_MEMBER_HANDLE));

    let lead_id = set_lead(member_id, LEAD_ROLE_ACCOUNT);

    NewMemberAsLead { member_id, lead_id }
}

pub fn set_channel_creation_enabled(enabled: bool) {
    crate::Module::<Test>::set_channel_creation_enabled(Origin::signed(LEAD_ROLE_ACCOUNT), enabled)
        .unwrap()
}

pub fn add_channel_creator_member() -> <Test as membership::Trait>::MemberId {
    let channel_creator_member_id = add_member(
        CHANNEL_CREATOR_ROOT_AND_CONTROLLER_ACCOUNT,
        to_vec(CHANNEL_CREATOR_HANDLE),
    );

    channel_creator_member_id
}

pub fn add_member(
    root_and_controller_account: <Test as system::Trait>::AccountId,
    handle: Vec<u8>,
) -> <Test as membership::Trait>::MemberId {
    let next_member_id = membership::NextMemberId::<Test>::get();

    assert_eq!(
        membership::Module::<Test>::buy_membership(
            Origin::signed(root_and_controller_account),
            0,
            Some(handle),
            None,
            None
        )
        .unwrap(),
        ()
    );

    next_member_id
}

pub fn set_lead(
    member_id: <Test as membership::Trait>::MemberId,
    new_role_account: <Test as system::Trait>::AccountId,
) -> LeadId<Test> {
    /*
       Events are not emitted on block 0.
       So any dispatchable calls made during genesis block formation will have no events emitted.
       https://substrate.dev/recipes/2-appetizers/4-events.html
    */
    run_to_block(1);

    let expected_lead_id = NextLeadId::<Test>::get();
    // Set lead
    assert_eq!(
        ContentWorkingGroup::replace_lead(
            RawOrigin::Root.into(),
            Some((member_id, new_role_account))
        )
        .unwrap(),
        ()
    );

    assert_eq!(
        get_last_event_or_panic(),
        crate::RawEvent::LeadSet(expected_lead_id)
    );

    expected_lead_id
}

pub fn add_curator_opening() -> CuratorOpeningId<Test> {
    let activate_at = hiring::ActivateOpeningAt::ExactBlock(34);

    let human_readable_text = generate_valid_length_buffer(&OpeningHumanReadableText::get());

    let expected_curator_opening_id = NextCuratorOpeningId::<Test>::get();

    assert_eq!(
        ContentWorkingGroup::add_curator_opening(
            Origin::signed(LEAD_ROLE_ACCOUNT),
            activate_at.clone(),
            get_baseline_opening_policy(),
            human_readable_text.clone()
        )
        .unwrap(),
        ()
    );

    assert_eq!(
        get_last_event_or_panic(),
        crate::RawEvent::CuratorOpeningAdded(expected_curator_opening_id)
    );

    expected_curator_opening_id
}

/*
 * Buffer generators
 */

pub fn generate_text(len: usize) -> Vec<u8> {
    vec![b'x'; len]
}

pub fn generate_valid_length_buffer(constraint: &InputValidationLengthConstraint) -> Vec<u8> {
    generate_text(constraint.min as usize)
}

pub fn generate_too_short_length_buffer(constraint: &InputValidationLengthConstraint) -> Vec<u8> {
    generate_text((constraint.min - 1) as usize)
}

pub fn generate_too_long_length_buffer(constraint: &InputValidationLengthConstraint) -> Vec<u8> {
    generate_text((constraint.max() + 1) as usize)
}

#[test]
fn increasing_mint_capacity() {
    const MINT_CAPACITY: u64 = 50000;

    TestExternalitiesBuilder::<Test>::default()
        .with_content_wg_config(
            genesis::GenesisConfigBuilder::<Test>::default()
                .with_mint_capacity(MINT_CAPACITY)
                .build(),
        )
        .build()
        .execute_with(|| {
            /*
               Events are not emitted on block 0.
               So any dispatchable calls made during genesis block formation will have no events emitted.
               https://substrate.dev/recipes/2-appetizers/4-events.html
            */
            run_to_block(1);

            let mint_id = ContentWorkingGroup::mint();
            let mint = Minting::mints(mint_id);
            assert_eq!(mint.capacity(), MINT_CAPACITY);

            let increase = 25000;
            // Increasing mint capacity
            let expected_new_capacity = MINT_CAPACITY + increase;
            assert_ok!(ContentWorkingGroup::increase_mint_capacity(
                RawOrigin::Root.into(),
                increase
            ));
            // Excpected event after increasing
            assert_eq!(
                get_last_event_or_panic(),
                crate::RawEvent::MintCapacityIncreased(mint_id, increase, expected_new_capacity)
            );
            // Excpected value of capacity after increasing
            let mint = Minting::mints(mint_id);
            assert_eq!(mint.capacity(), expected_new_capacity);
        });
}

#[test]
fn setting_mint_capacity() {
    const MINT_CAPACITY: u64 = 50000;

    TestExternalitiesBuilder::<Test>::default()
        .with_content_wg_config(
            genesis::GenesisConfigBuilder::<Test>::default()
                .with_mint_capacity(MINT_CAPACITY)
                .build(),
        )
        .build()
        .execute_with(|| {
            /*
               Events are not emitted on block 0.
               So any dispatchable calls made during genesis block formation will have no events emitted.
               https://substrate.dev/recipes/2-appetizers/4-events.html
            */
            run_to_block(1);

            let mint_id = ContentWorkingGroup::mint();
            let mint = Minting::mints(mint_id);
            assert_eq!(mint.capacity(), MINT_CAPACITY);

            // Decreasing mint capacity
            let new_lower_capacity = 10000;
            let decrease = MINT_CAPACITY - new_lower_capacity;
            assert_ok!(ContentWorkingGroup::set_mint_capacity(
                RawOrigin::Root.into(),
                new_lower_capacity
            ));
            // Correct event after decreasing
            assert_eq!(
                get_last_event_or_panic(),
                crate::RawEvent::MintCapacityDecreased(mint_id, decrease, new_lower_capacity)
            );
            // Correct value of capacity after decreasing
            let mint = Minting::mints(mint_id);
            assert_eq!(mint.capacity(), new_lower_capacity);

            // Increasing mint capacity
            let new_higher_capacity = 25000;
            let increase = new_higher_capacity - mint.capacity();
            assert_ok!(ContentWorkingGroup::set_mint_capacity(
                RawOrigin::Root.into(),
                new_higher_capacity
            ));
            // Excpected event after increasing
            assert_eq!(
                get_last_event_or_panic(),
                crate::RawEvent::MintCapacityIncreased(mint_id, increase, new_higher_capacity)
            );
            // Excpected value of capacity after increasing
            let mint = Minting::mints(mint_id);
            assert_eq!(mint.capacity(), new_higher_capacity);
        });
}
