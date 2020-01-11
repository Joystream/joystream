#![cfg(test)]

//use super::genesis;
use super::lib;
use super::mock::{self, *};
//use crate::membership;
use hiring;
use srml_support::{StorageLinkedMap, StorageValue};
use rstd::collections::btree_set::BTreeSet;
use rstd::collections::btree_map::BTreeMap;
use runtime_primitives::traits::One;

/// DIRTY IMPORT BECAUSE
/// InputValidationLengthConstraint has not been factored out yet!!!
use forum::InputValidationLengthConstraint;

#[test]
fn create_channel_success() {

    TestExternalitiesBuilder::<Test>::default()
        .build()
        .execute_with(|| {

            // Add channel creator as member
            let channel_creator_member_root_and_controller_account = 12312;

            let channel_creator_member_id = add_member(
                channel_creator_member_root_and_controller_account,
                to_vec(CHANNEL_CREATOR_HANDLE)
            );

            let fixture = CreateChannelFixture::make_valid_unpulished_video_channel_for(channel_creator_member_id, None);

            fixture.call_and_assert_success();

        });
}

#[test]
fn create_channel_is_not_a_member() {
    
    TestExternalitiesBuilder::<Test>::default()
        .build()
        .execute_with(|| {

            let channel_creator_member_id = add_channel_creator_member();

            let mut fixture = CreateChannelFixture::make_valid_unpulished_video_channel_for(channel_creator_member_id, None);

            // Change to invalid member id, i.e. != channel_creator_member_id
            fixture.channel_creator_member_id = fixture.channel_creator_member_id + <<Test as members::Trait>::MemberId as One>::one();

            fixture.call_and_assert_error(MSG_CREATE_CHANNEL_IS_NOT_MEMBER);

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

            let fixture = CreateChannelFixture::make_valid_unpulished_video_channel_for(channel_creator_member_id, None);

            fixture.call_and_assert_error(MSG_CHANNEL_CREATION_DISABLED);
        });
}

#[test]
fn create_channel_with_bad_member_role_account() {

    TestExternalitiesBuilder::<Test>::default()
        .build()
        .execute_with(|| {

            let channel_creator_member_id = add_channel_creator_member();

            let fixture = CreateChannelFixture::make_valid_unpulished_video_channel_for(channel_creator_member_id, Some(0));

            fixture.call_and_assert_error(MSG_CREATE_CHANNEL_NOT_CONTROLLER_ACCOUNT);
        });
}

#[test]
fn create_channel_handle_too_long() {

    TestExternalitiesBuilder::<Test>::default()
        .build()
        .execute_with(|| {

            let channel_creator_member_id = add_channel_creator_member();

            let mut fixture = CreateChannelFixture::make_valid_unpulished_video_channel_for(channel_creator_member_id, None);

            fixture.channel_name = generate_too_long_length_buffer(&ChannelHandleConstraint::get());

            fixture.call_and_assert_error(MSG_CHANNEL_HANDLE_TOO_LONG);
        });
}

#[test]
fn create_channel_handle_too_short() {

    TestExternalitiesBuilder::<Test>::default()
        .build()
        .execute_with(|| {

            let channel_creator_member_id = add_channel_creator_member();

            let mut fixture = CreateChannelFixture::make_valid_unpulished_video_channel_for(channel_creator_member_id, None);

            fixture.channel_name = generate_too_short_length_buffer(&ChannelHandleConstraint::get());

            fixture.call_and_assert_error(MSG_CHANNEL_HANDLE_TOO_SHORT);
        });
}

#[test]
fn create_channel_description_too_long() {

    TestExternalitiesBuilder::<Test>::default()
        .build()
        .execute_with(|| {

            let channel_creator_member_id = add_channel_creator_member();

            let mut fixture = CreateChannelFixture::make_valid_unpulished_video_channel_for(channel_creator_member_id, None);

            fixture.description = generate_too_long_length_buffer(&ChannelDescriptionConstraint::get());

            fixture.call_and_assert_error(MSG_CHANNEL_DESCRIPTION_TOO_LONG);
        });
}

#[test]
fn create_channel_description_too_short() {

    TestExternalitiesBuilder::<Test>::default()
        .build()
        .execute_with(|| {

            let channel_creator_member_id = add_channel_creator_member();

            let mut fixture = CreateChannelFixture::make_valid_unpulished_video_channel_for(channel_creator_member_id, None);

            fixture.description = generate_too_short_length_buffer(&ChannelDescriptionConstraint::get());

            fixture.call_and_assert_error(MSG_CHANNEL_DESCRIPTION_TOO_SHORT);

        });
}

#[test]
fn transfer_channel_ownership_success() {

}

#[test]
fn update_channel_as_owner_success() {

}

struct UpdateChannelAsCurationActorFixture {
    pub origin: Origin,
    pub curation_actor: CurationActor<CuratorId<Test>>,
    pub new_verified: Option<bool>,
    pub new_description: Option<Vec<u8>>,
    pub new_curation_status: Option<ChannelCurationStatus>
}

impl UpdateChannelAsCurationActorFixture {

    fn update_channel_as_curation_actor(&self, channel_id: ChannelId<Test>) -> Result<(), &'static str> {

        ContentWorkingGroup::update_channel_as_curation_actor(
            self.origin.clone(),
            self.curation_actor.clone(),
            channel_id,
            self.new_verified,
            self.new_description.clone(),
            self.new_curation_status
        )
    }

    pub fn call_and_assert_success(&self, channel_id: ChannelId<Test>) {

        let old_channel = ChannelById::<Test>::get(channel_id);

        let expected_updated_channel = lib::Channel::new(
            old_channel.channel_name,
            self.new_verified.unwrap_or(old_channel.verified),
            self.new_description.clone().unwrap_or(old_channel.description),
            old_channel.content,
            old_channel.owner,
            old_channel.role_account,
            old_channel.publishing_status,
            self.new_curation_status.unwrap_or(old_channel.curation_status),
            old_channel.created,
            old_channel.principal_id
        );

        // Call and check result

        let call_result = self.update_channel_as_curation_actor(channel_id);

        assert_eq!(
            call_result,
            Ok(())
        );

        // Event triggered
        let event_channel_id = Self::get_event_deposited();

        assert_eq!(
            event_channel_id,
            channel_id
        );

        // Channel has been updated correctly
        assert!(ChannelById::<Test>::exists(channel_id));

        let updated_channel = ChannelById::<Test>::get(channel_id);

        assert_eq!(
            updated_channel,
            expected_updated_channel
        );
    }

    fn get_event_deposited() -> lib::ChannelId<Test> {
    
        if let mock::TestEvent::lib(ref x) = System::events().last().unwrap().event {
            if let lib::RawEvent::ChannelUpdatedByCurationActor(ref channel_id) = x {
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
                2222*2,
                2222*3,
                generate_valid_length_buffer(&CuratorApplicationHumanReadableText::get())
            );

            // Hire curator
            let setup_and_fill_opening_result = setup_and_fill_opening(
                &vec![
                    FillOpeningApplicantParams::new(
                    curator_params.clone(),
                    true)
                ]);

            let curator_id = 
                match setup_and_fill_opening_result.application_outomes[0] {
                    FillOpeningApplicantOutcome::Hired{curator_id} => curator_id,
                    _ => panic!()
                };

            // Make channel
            let channel_creator_member_id = add_channel_creator_member();
            let channel_id = channel_creator_member_id;

            CreateChannelFixture::make_valid_unpulished_video_channel_for(channel_creator_member_id, None)
            .call_and_assert_success();

            // Update channel as curator
            UpdateChannelAsCurationActorFixture {
                origin: Origin::signed(curator_params.curator_applicant_role_account),
                curation_actor: CurationActor::Curator(curator_id),
                new_verified: Some(true),
                new_description: None, //  don't touch!
                new_curation_status: Some(ChannelCurationStatus::Censored)
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

            let human_readable_text = generate_valid_length_buffer(&OpeningHumanReadableText::get());

            assert_eq!(
                ContentWorkingGroup::add_curator_opening(
                    Origin::signed(LEAD_ROLE_ACCOUNT),
                    activate_at.clone(),
                    get_baseline_opening_policy(),
                    human_readable_text.clone()
                ).unwrap(),
                ()
            );

            assert_eq!(
                get_last_event_or_panic(),
                lib::RawEvent::CuratorOpeningAdded(expected_curator_opening_id)
            );

            // Assert that given opening id has been added,
            // and has the right properties.
            assert!(lib::CuratorOpeningById::<Test>::exists(expected_curator_opening_id));

            let created_curator_opening = lib::CuratorOpeningById::<Test>::get(expected_curator_opening_id);

            let expected_curator_opening = CuratorOpening{
                opening_id: expected_opening_id,
                curator_applications: BTreeSet::new(),
                policy_commitment: get_baseline_opening_policy()
            };

            assert_eq!(
                created_curator_opening,
                expected_curator_opening                
            );

            // Assert that next id incremented.
            assert_eq!(
                lib::NextCuratorOpeningId::<Test>::get(),
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
                    ).unwrap(),
                ()
            );

            assert_eq!(
                get_last_event_or_panic(),
                lib::RawEvent::AcceptedCuratorApplications(curator_opening_id)
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
                91000,
                generate_valid_length_buffer(&CuratorApplicationHumanReadableText::get())
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
                lib::RawEvent::BeganCuratorApplicationReview(normal_opening_constructed.curator_opening_id)
            );
            
            /*
             * TODO: add assertion abouot side-effect in hiring module, 
             * this is where state of application has fundamentally changed.
             */
        
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
                        2222*2,
                        2222*3,
                        generate_valid_length_buffer(&CuratorApplicationHumanReadableText::get())
                    ),
                    true
                ),
                FillOpeningApplicantParams::new(
                    AddMemberAndApplyOnOpeningParams::new(
                        3333,
                        to_vec("yoyoyo1"), // generate_valid_length_buffer(&ChannelHandleConstraint::get()),
                        3333*2,
                        3333*3,
                        generate_valid_length_buffer(&CuratorApplicationHumanReadableText::get())
                    ),
                    true
                ),
                FillOpeningApplicantParams::new(
                    AddMemberAndApplyOnOpeningParams::new(
                        5555,
                        to_vec("yoyoyo2"), // generate_valid_length_buffer(&ChannelHandleConstraint::get()),
                        5555*2,
                        5555*3,
                        generate_valid_length_buffer(&CuratorApplicationHumanReadableText::get())
                    ),
                    false
                ),
                FillOpeningApplicantParams::new(
                    AddMemberAndApplyOnOpeningParams::new(
                        6666,
                        to_vec("yoyoyo3"), // generate_valid_length_buffer(&ChannelHandleConstraint::get()),
                        6666*2,
                        6666*3,
                        generate_valid_length_buffer(&CuratorApplicationHumanReadableText::get())
                    ),
                    true
                )
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
            let human_readable_text = generate_valid_length_buffer(&CuratorApplicationHumanReadableText::get());

            let result = add_member_and_apply_on_opening(
                normal_opening_constructed.curator_opening_id,
                curator_applicant_root_and_controller_account,
                to_vec("CuratorWannabe"),
                curator_applicant_role_account,
                91000,
                human_readable_text
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
                lib::RawEvent::CuratorApplicationWithdrawn(result.curator_application_id)
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
                91000,
                generate_valid_length_buffer(&CuratorApplicationHumanReadableText::get())
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
                lib::RawEvent::CuratorApplicationTerminated(result.curator_application_id)
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
                to_vec("IwillTrytoapplyhere")
            );

            let curator_applicant_role_account = 8881111;

            let role_stake_balance = get_baseline_opening_policy().role_staking_policy.unwrap().amount;
            let application_stake_balance = get_baseline_opening_policy().application_staking_policy.unwrap().amount;
            let total_balance = role_stake_balance + application_stake_balance;
        
            let source_account = 918111;

            // Credit staking source account
            let _ = balances::Module::<Test>::deposit_creating(&source_account, total_balance);

            let human_readable_text = generate_valid_length_buffer(&ChannelHandleConstraint::get());

            let expected_curator_application_id = NextCuratorApplicationId::<Test>::get();

            let old_curator_opening = CuratorOpeningById::<Test>::get(normal_opening_constructed.curator_opening_id);

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
                    source_account,
                    Some(role_stake_balance),
                    Some(application_stake_balance),
                    human_readable_text
                )
                .unwrap(),
                ()
            );

            assert_eq!(
                get_last_event_or_panic(),
                lib::RawEvent::AppliedOnCuratorOpening(normal_opening_constructed.curator_opening_id, new_curator_application_id)
            );

            assert!(
                CuratorApplicationById::<Test>::exists(new_curator_application_id)
            );

            // Assert that appropriate application has been added
            let new_curator_application = CuratorApplicationById::<Test>::get(new_curator_application_id);

            let expected_curator_application = CuratorApplication{
                role_account: curator_applicant_role_account,
                curator_opening_id: normal_opening_constructed.curator_opening_id,
                member_id: curator_applicant_member_id,
                application_id: expected_curator_application_id,
            };

            assert_eq!(
                expected_curator_application,
                new_curator_application
            );

            // Assert that the opening has had the application added to application list
            let mut singleton = BTreeSet::new(); // Unavoidable mutable, BTreeSet can only be populated this way.
            singleton.insert(new_curator_application_id);

            let new_curator_applications = old_curator_opening.curator_applications.union(&singleton).cloned().collect();

            let expected_curator_opening = CuratorOpening{
                curator_applications: new_curator_applications,
                ..old_curator_opening
            };

            let new_curator_opening = CuratorOpeningById::<Test>::get(normal_opening_constructed.curator_opening_id);

            assert_eq!(
                expected_curator_opening,
                new_curator_opening
            );
        });
}

struct UpdateCuratorRoleAccountFixture {
    pub origin: Origin,
    pub member_id: <Test as members::Trait>::MemberId,
    pub curator_id: CuratorId<Test>,
    pub new_role_account: <Test as system::Trait>::AccountId,
}

impl UpdateCuratorRoleAccountFixture {

    fn call(&self) -> Result<(),&'static str>{

        ContentWorkingGroup::update_curator_role_account(
            self.origin.clone(),
            self.member_id,
            self.curator_id,
            self.new_role_account
        )
    }

    pub fn call_and_assert_success(&self) {

        let original_curator = CuratorById::<Test>::get(self.curator_id);

        let call_result = self.call();

        assert_eq!(
            call_result,
            Ok(())
        );

        let updated_curator = CuratorById::<Test>::get(self.curator_id);

        assert_eq!(
            lib::Curator{
                role_account: self.new_role_account,
                ..original_curator
            },
            updated_curator
        );

        let (event_curator_id, event_new_role_account) =
            if let mock::TestEvent::lib(ref x) = System::events().last().unwrap().event {
                if let lib::RawEvent::CuratorRoleAccountUpdated(ref curator_id, ref new_role_account) = x {
                    (curator_id.clone(), new_role_account.clone())
                } else {
                    panic!("Event was not CuratorRoleAccountUpdated.")
                }
            } else {
                panic!("No event deposited.")
            };

        assert_eq!(
            self.curator_id,
            event_curator_id
        );

        assert_eq!(
            self.new_role_account,
            event_new_role_account
        );
    }

    pub fn call_and_assert_failed_result(&self, error_message: &'static str) {

        let call_result = self.call();

        assert_eq!(
            call_result,
            Err(error_message)
        );

    }

}

#[test]
fn update_curator_role_account_success() {

    TestExternalitiesBuilder::<Test>::default()
        .build()
        .execute_with(|| {

            let result = setup_lead_and_hire_curator();

            let fixture = UpdateCuratorRoleAccountFixture{
                origin: Origin::signed(result.curator_params().curator_applicant_root_and_controller_account),
                member_id: result.curator_member_id(),
                curator_id: result.curator_id(),
                new_role_account: 777777
            };

            fixture.call_and_assert_success();
        });

}

struct UpdateCuratorRewardAccountFixture {
    pub origin: Origin,
    pub curator_id: CuratorId<Test>,
    pub new_reward_account: <Test as system::Trait>::AccountId
}

impl UpdateCuratorRewardAccountFixture {

    fn call(&self) -> Result<(),&'static str>{

        ContentWorkingGroup::update_curator_reward_account(
            self.origin.clone(),
            self.curator_id,
            self.new_reward_account
        )
    }

    pub fn call_and_assert_success(&self) {

        let _original_curator = CuratorById::<Test>::get(self.curator_id);

        let call_result = self.call();

        assert_eq!(
            call_result,
            Ok(())
        );

        /*
            Actually checking new reward account requires checking call to token mint module, but we cannot do that properly yet.
        */

        let (event_curator_id, event_reward_account) =
            if let mock::TestEvent::lib(ref x) = System::events().last().unwrap().event {
                if let lib::RawEvent::CuratorRewardAccountUpdated(ref curator_id, ref reward_account) = x {
                    (curator_id.clone(), reward_account.clone())
                } else {
                    panic!("Event was not CuratorRewardAccountUpdated.")
                }
            } else {
                panic!("No event deposited.")
            };

        assert_eq!(
            self.curator_id,
            event_curator_id
        );

        assert_eq!(
            self.new_reward_account,
            event_reward_account
        );
    }

    pub fn call_and_assert_failed_result(&self, error_message: &'static str) {

        let call_result = self.call();

        assert_eq!(
            call_result,
            Err(error_message)
        );

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
                new_reward_account: 123321
            };
            
            // TEMPORARILY DISABLED
            //fixture.call_and_assert_success();
        });

}

struct LeaveCuratorRoleFixture {
    pub origin: Origin,
    pub curator_id: CuratorId<Test>,
    pub rationale_text: Vec<u8>
}

impl LeaveCuratorRoleFixture {
    fn call(&self) -> Result<(),&'static str>{

        ContentWorkingGroup::leave_curator_role(
            self.origin.clone(),
            self.curator_id,
            self.rationale_text.clone()
        )
    }

    pub fn call_and_assert_success(&self) {

        let original_curator = CuratorById::<Test>::get(self.curator_id);

        let call_result = self.call();

        assert_eq!(
            call_result,
            Ok(())
        );

        let expected_curator = Curator {
            stage: CuratorRoleStage::Unstaking(CuratorExitSummary::new(
                &CuratorExitInitiationOrigin::Curator,
                &1,
                &self.rationale_text
            )),
            ..(original_curator.clone())
        };

        let updated_curator = CuratorById::<Test>::get(self.curator_id);

        assert_eq!(
            updated_curator,
            expected_curator
        );

        assert_eq!(
            get_last_event_or_panic(),
            lib::RawEvent::CuratorUnstaking(self.curator_id)
        );

        // Tracking unstaking
        let curator_role_stake_id = original_curator
                                    .role_stake_profile
                                    .unwrap()
                                    .stake_id;

        assert!(
            UnstakerByStakeId::<Test>::exists(curator_role_stake_id)
        );

        let unstaker = UnstakerByStakeId::<Test>::get(curator_role_stake_id);

        assert_eq!(
            unstaker,
            WorkingGroupUnstaker::Curator(self.curator_id)
        );

        /*
         * TODO: Missing checks to calls to
         * recurringrewards, stake
         */
    }

    pub fn call_and_assert_failed_result(&self, error_message: &'static str) {

        let call_result = self.call();

        assert_eq!(
            call_result,
            Err(error_message)
        );

    }
}

#[test]
fn leave_curator_role_success() {

    TestExternalitiesBuilder::<Test>::default()
        .build()
        .execute_with(|| {

            let result = setup_lead_and_hire_curator();

            let fixture = LeaveCuratorRoleFixture{
                origin: Origin::signed(result.curator_params().curator_applicant_role_account),
                curator_id: result.curator_id(),
                rationale_text: "I am sick of this horrible thing".as_bytes().to_vec()
            };
            
            fixture.call_and_assert_success();
        });
}

struct TerminateCuratorRoleFixture {
    pub origin: Origin,
    pub curator_id: CuratorId<Test>,
    pub rationale_text: Vec<u8>
}

impl TerminateCuratorRoleFixture {
    fn call(&self) -> Result<(),&'static str>{

        ContentWorkingGroup::terminate_curator_role(
            self.origin.clone(),
            self.curator_id,
            self.rationale_text.clone()
        )
    }

    pub fn call_and_assert_success(&self) {

        let original_curator = CuratorById::<Test>::get(self.curator_id);

        let call_result = self.call();

        assert_eq!(
            call_result,
            Ok(())
        );

        let expected_curator = Curator {
            stage: CuratorRoleStage::Unstaking(CuratorExitSummary::new(
                &CuratorExitInitiationOrigin::Lead,
                &1,
                &self.rationale_text
            )),
            ..(original_curator.clone())
        };

        let updated_curator = CuratorById::<Test>::get(self.curator_id);

        assert_eq!(
            updated_curator,
            expected_curator
        );

        assert_eq!(
            get_last_event_or_panic(),
            lib::RawEvent::CuratorUnstaking(self.curator_id)
        );

        // Tracking unstaking
        let curator_role_stake_id = original_curator
                                    .role_stake_profile
                                    .unwrap()
                                    .stake_id;

        assert!(
            UnstakerByStakeId::<Test>::exists(curator_role_stake_id)
        );

        let unstaker = UnstakerByStakeId::<Test>::get(curator_role_stake_id);

        assert_eq!(
            unstaker,
            WorkingGroupUnstaker::Curator(self.curator_id)
        );

        /*
         * TODO: Missing checks to calls to
         * recurringrewards, stake
         */
    }

    pub fn call_and_assert_failed_result(&self, error_message: &'static str) {

        let call_result = self.call();

        assert_eq!(
            call_result,
            Err(error_message)
        );

    }
}

#[test]
fn terminate_curator_role_success() {

    TestExternalitiesBuilder::<Test>::default()
        .build()
        .execute_with(|| {

            let result = setup_lead_and_hire_curator();

            let fixture = TerminateCuratorRoleFixture{
                origin: Origin::signed(LEAD_ROLE_ACCOUNT),
                curator_id: result.curator_id(),
                rationale_text: "This curator is a joke!".as_bytes().to_vec()
            };
            
            fixture.call_and_assert_success();
        });
}

#[test]
fn set_lead_success() {

}

#[test]
fn unset_lead_success() {

}

#[test]
fn unstaked_success() {

}

#[test]
fn account_can_act_as_principal_success() {

}

/*
 * Fixtures
 */

static LEAD_ROOT_AND_CONTROLLER_ACCOUNT: <Test as system::Trait>::AccountId = 1289;
static LEAD_ROLE_ACCOUNT: <Test as system::Trait>::AccountId = 1289;
static LEAD_MEMBER_HANDLE: &str = "IamTheLead";
static CHANNEL_CREATOR_ROOT_AND_CONTROLLER_ACCOUNT: <Test as system::Trait>::AccountId = 11;
static CHANNEL_CREATOR_HANDLE: &str = "Coolcreator";

fn make_generic_add_member_params() -> AddMemberAndApplyOnOpeningParams {

    AddMemberAndApplyOnOpeningParams::new(
        2222,
        to_vec("yoyoyo0"), // generate_valid_length_buffer(&ChannelHandleConstraint::get()),
        2222*2,
        2222*3,
        generate_valid_length_buffer(&CuratorApplicationHumanReadableText::get())
    )
}

/// Made into function to avoid having to clone every time we read fields
pub fn get_baseline_opening_policy() -> OpeningPolicyCommitment<<Test as system::Trait>::BlockNumber, BalanceOf<Test>> {
    
    OpeningPolicyCommitment{
        application_rationing_policy: Some(hiring::ApplicationRationingPolicy{
            max_active_applicants : 5
        }),
        max_review_period_length: 100,
        application_staking_policy: Some(hiring::StakingPolicy{
            amount: 40000,
            amount_mode: hiring::StakingAmountLimitMode::Exact,
            crowded_out_unstaking_period_length: Some(3),
            review_period_expired_unstaking_period_length: Some(22),
        }),
        role_staking_policy: Some(hiring::StakingPolicy{
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

/*
 * Setups
 */


//type TestSeed = u128;

/*
fn account_from_seed(TestSeed: seed) -> <Test as system::Trait>::AccountId {

}

fn vector_from_seed(TestSeed: seed) {

}
*/

/*
static INITIAL_SEED_VALUE: u128 = 0;
static CURRENT_SEED: u128 = INITIAL_SEED_VALUE;

fn get_current_seed() {

}

fn update_seed() {

}

fn reset_seed() {
    CURRENT_SEED: u128 = INITIAL_SEED_VALUE;
}
*/


// MOVE THIS LATER WHEN fill_opening is factored out
#[derive(Clone)]
pub struct FillOpeningApplicantParams {
    pub add_and_apply_params: AddMemberAndApplyOnOpeningParams,
    pub hire: bool
}

impl FillOpeningApplicantParams {
    pub fn new(
        add_and_apply_params: AddMemberAndApplyOnOpeningParams,
        hire: bool
    ) -> Self {

        Self {
            add_and_apply_params: add_and_apply_params.clone(),
            hire: hire
        }
    }
}

#[derive(Clone)]
pub struct AddMemberAndApplyOnOpeningParams {
    pub curator_applicant_root_and_controller_account: <Test as system::Trait>::AccountId,
    pub handle: Vec<u8>,
    pub curator_applicant_role_account: <Test as system::Trait>::AccountId,
    pub source_account: <Test as system::Trait>::AccountId,
    pub human_readable_text: Vec<u8>
}

impl AddMemberAndApplyOnOpeningParams {
    pub fn new(
        curator_applicant_root_and_controller_account: <Test as system::Trait>::AccountId,
        handle: Vec<u8>,
        curator_applicant_role_account: <Test as system::Trait>::AccountId,
        source_account: <Test as system::Trait>::AccountId,
        human_readable_text: Vec<u8>
    ) -> Self {

        Self{
            curator_applicant_root_and_controller_account,
            handle,
            curator_applicant_role_account,
            source_account,
            human_readable_text
        }
    }
}

fn add_members_and_apply_on_opening(curator_opening_id: CuratorOpeningId<Test>, applicants: &Vec<AddMemberAndApplyOnOpeningParams>) -> Vec<NewMemberAppliedResult> {

    applicants
    .iter()
    .cloned()
    .map(|params| -> NewMemberAppliedResult {
        
        add_member_and_apply_on_opening(
            curator_opening_id,
            params.curator_applicant_root_and_controller_account,
            params.handle,
            params.curator_applicant_role_account,
            params.source_account,
            params.human_readable_text
        )
    })
    .collect()
}

#[derive(Clone)]
struct NewMemberAppliedResult{
    pub member_id: <Test as members::Trait>::MemberId,
    pub curator_application_id: lib::CuratorApplicationId<Test>
}

fn add_member_and_apply_on_opening(
    curator_opening_id: CuratorOpeningId<Test>,
    curator_applicant_root_and_controller_account: <Test as system::Trait>::AccountId,
    handle: Vec<u8>,
    curator_applicant_role_account: <Test as system::Trait>::AccountId,
    source_account: <Test as system::Trait>::AccountId,
    human_readable_text: Vec<u8>
) -> NewMemberAppliedResult {

    // Make membership
    let curator_applicant_member_id = add_member(
        curator_applicant_root_and_controller_account,
        handle
    );

    // Guarantee sufficient stake
    let role_stake_balance = get_baseline_opening_policy().role_staking_policy.unwrap().amount;
    let application_stake_balance = get_baseline_opening_policy().application_staking_policy.unwrap().amount;
    let total_balance = role_stake_balance + application_stake_balance;

    // Credit staking source account
    let _ = balances::Module::<Test>::deposit_creating(&source_account, total_balance);

    let expected_curator_application_id = NextCuratorApplicationId::<Test>::get();

    let old_curator_opening = CuratorOpeningById::<Test>::get(curator_opening_id);

    /*
     * Test
     */

    assert_eq!(
        ContentWorkingGroup::apply_on_curator_opening(
            Origin::signed(curator_applicant_root_and_controller_account),
            curator_applicant_member_id,
            curator_opening_id,
            curator_applicant_role_account,
            source_account,
            Some(role_stake_balance),
            Some(application_stake_balance),
            human_readable_text
        )
        .unwrap(),
        ()
    );

    let (curator_opening_id, new_curator_application_id) = ensure_applieadoncuratoropening_event_deposited();

    assert!(
        CuratorApplicationById::<Test>::exists(new_curator_application_id)
    );

    // Assert that appropriate application has been added
    let new_curator_application = CuratorApplicationById::<Test>::get(new_curator_application_id);

    let expected_curator_application = CuratorApplication{
        role_account: curator_applicant_role_account,
        curator_opening_id: curator_opening_id,
        member_id: curator_applicant_member_id,
        application_id: expected_curator_application_id,
    };

    assert_eq!(
        expected_curator_application,
        new_curator_application
    );

    // Assert that the opening has had the application added to application list
    let mut singleton = BTreeSet::new(); // Unavoidable mutable, BTreeSet can only be populated this way.
    singleton.insert(new_curator_application_id);

    let new_curator_applications = old_curator_opening.curator_applications.union(&singleton).cloned().collect();

    let expected_curator_opening = CuratorOpening{
        curator_applications: new_curator_applications,
        ..old_curator_opening
    };

    let new_curator_opening = CuratorOpeningById::<Test>::get(curator_opening_id);

    assert_eq!(
        expected_curator_opening,
        new_curator_opening
    );

    NewMemberAppliedResult {
        member_id: curator_applicant_member_id,
        curator_application_id: new_curator_application_id
    }
}

struct NormalOpeningConstructed {
    pub curator_opening_id: CuratorOpeningId<Test>,
    pub new_member_as_lead: NewMemberAsLead
}

fn setup_normal_opening() -> NormalOpeningConstructed {

    let new_member_as_lead = add_member_and_set_as_lead();

    assert_eq!(
        ContentWorkingGroup::add_curator_opening(
            Origin::signed(LEAD_ROLE_ACCOUNT),
            hiring::ActivateOpeningAt::ExactBlock(34),
            get_baseline_opening_policy(),
            generate_valid_length_buffer(&OpeningHumanReadableText::get())
        ).unwrap(),
        ()
    );

    let curator_opening_id = ensure_curatoropeningadded_event_deposited();

    NormalOpeningConstructed {
        curator_opening_id,
        new_member_as_lead
    }
}

fn setup_normal_accepting_opening() -> NormalOpeningConstructed {

    let normal_opening_constructed = setup_normal_opening();

    assert_eq!(
        ContentWorkingGroup::accept_curator_applications(
            Origin::signed(LEAD_ROLE_ACCOUNT), // <== get dynamic value from somewhere else later
            normal_opening_constructed.curator_opening_id
            ).unwrap(),
        ()
    );

    normal_opening_constructed
}

struct SetupOpeningInReview {
    //pub curator_opening_id: lib::CuratorOpeningId<Test>,
    pub normal_opening_constructed : NormalOpeningConstructed,
    pub added_members_application_result: Vec<NewMemberAppliedResult>,
}

fn setup_opening_in_review(applicants: &Vec<AddMemberAndApplyOnOpeningParams>) -> SetupOpeningInReview {

    let normal_opening_constructed = setup_normal_accepting_opening();

    let added_members_application_result = add_members_and_apply_on_opening(
        normal_opening_constructed.curator_opening_id,
        applicants
    );

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
        added_members_application_result
    }
}

enum FillOpeningApplicantOutcome {
    NotHired,
    Hired {
        curator_id: CuratorId<Test>,
    },
}

struct SetupAndFillOpeningResult {
    setup_opening_in_review: SetupOpeningInReview,
    application_outomes: Vec<FillOpeningApplicantOutcome>
}

fn setup_and_fill_opening(applicants: &Vec<FillOpeningApplicantParams>) -> SetupAndFillOpeningResult {

    let setup_opening_params = applicants
                                .iter()
                                .cloned()
                                .map(|param| param.add_and_apply_params)
                                .collect::<Vec<_>>();

    let setup_opening_in_review = setup_opening_in_review(&setup_opening_params);

    let curator_opening = CuratorOpeningById::<Test>::get(setup_opening_in_review.normal_opening_constructed.curator_opening_id);

    // Set whom to hire
    let applicants_to_hire_iter = applicants
                                    .iter()
                                    .filter(|params| params.hire);

    let num_applicants_hired = applicants_to_hire_iter.cloned().count();
    //let num_applicants_not_to_hire = (applicants.len() - num_applicants_hired) as usize;

    let hired_applicant_and_result = setup_opening_in_review.added_members_application_result
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
            setup_opening_in_review.normal_opening_constructed.curator_opening_id,
            successful_curator_application_ids.clone()
        )
        ,
        Ok(())
    );

    /*
    * Asserts
    */

    let (
        event_curator_opening_id,
        event_successful_curator_application_id_to_curator_id
    ) = ensure_curatoropeningfilled_event_deposited();            
    
    // Event has correct payload
    assert_eq!(
        setup_opening_in_review.normal_opening_constructed.curator_opening_id,
        event_curator_opening_id
    );

    assert_eq!(
        successful_curator_application_ids,
        event_successful_curator_application_id_to_curator_id
        .keys()
        .cloned()
        .collect::<BTreeSet<_>>()
    );

    // The right number of curators have been created
    let num_curators_created = NextCuratorId::<Test>::get() - original_next_curator_id;

    assert_eq!(
        num_curators_created,
        (num_applicants_hired as u64)
    );

    // The right numbe of prinipals were created
    let num_principals_created = NextPrincipalId::<Test>::get() - original_next_principal_id;

    assert_eq!(
        num_principals_created,
        (num_applicants_hired as u64)
    );

    // Inspect all expected curators and principal added
    for (hired_index, item) in hired_applicant_and_result.iter().enumerate()  {

        let (new_member_applied_result, fill_opening_applicant_params) = item;

        // Curator
        let expected_added_curator_id: u64 = (hired_index as u64) + original_next_curator_id;

        // Principal
        let expected_added_principal_id: u64 = (hired_index as u64) + original_next_principal_id;
        
        // Curator added
        assert!(
            CuratorById::<Test>::exists(expected_added_curator_id)
        );

        let added_curator = CuratorById::<Test>::get(expected_added_curator_id);

        // expected_curator
        let reward_relationship = None::<<Test as recurringrewards::Trait>::RewardRelationshipId>;

        let curator_application = CuratorApplicationById::<Test>::get(new_member_applied_result.curator_application_id);
        let application_id = curator_application.application_id;
        let application = hiring::ApplicationById::<Test>::get(application_id);

        let role_stake_profile = 
            if let Some(ref stake_id) = application.active_role_staking_id { // get_baseline_opening_policy().role_staking_policy {

                Some(
                    CuratorRoleStakeProfile::new(
                        stake_id,
                        &curator_opening.policy_commitment.terminate_curator_role_stake_unstaking_period,
                        &curator_opening.policy_commitment.exit_curator_role_stake_unstaking_period
                    )
                )
            } else {
                None
            };
        
        let expected_curator = Curator{
            role_account: fill_opening_applicant_params.add_and_apply_params.curator_applicant_role_account ,
            reward_relationship: reward_relationship,
            role_stake_profile: role_stake_profile, //  added_curator.role_stake_profile.clone(),
            stage: CuratorRoleStage::Active,
            induction: CuratorInduction::new(
                &setup_opening_in_review.normal_opening_constructed.new_member_as_lead.lead_id,
                &new_member_applied_result.curator_application_id,
                &1
            ),
            principal_id: expected_added_principal_id,
        };

        assert_eq!(
            expected_curator,
            added_curator
        );

        // Principal added
        assert!(
            PrincipalById::<Test>::exists(expected_added_principal_id)
        );

        let added_principal = PrincipalById::<Test>::get(expected_added_principal_id);

        let expected_added_principal = Principal::Curator(expected_added_principal_id);

        assert_eq!(
            added_principal,
            expected_added_principal
        );
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
                                            curator_id: (index as u64) + original_next_curator_id
                                        }
                                    } else {
                                        FillOpeningApplicantOutcome::NotHired
                                    }

                                })
                                .collect::<Vec<_>>();
                                
    SetupAndFillOpeningResult {
        setup_opening_in_review,
        application_outomes
    }
}

struct SetupLeadAndHireCuratorResult {
    pub curator_params: AddMemberAndApplyOnOpeningParams,
    pub setup_and_fill_opening_result: SetupAndFillOpeningResult
}

impl SetupLeadAndHireCuratorResult {

    fn curator_params(&self) -> AddMemberAndApplyOnOpeningParams{
        self.curator_params.clone()
    }

    pub fn curator_id(&self) -> CuratorId<Test> {

        match self.setup_and_fill_opening_result.application_outomes[0] {
            FillOpeningApplicantOutcome::Hired{curator_id} => curator_id,
            _ => panic!()
        }
    }

    pub fn curator_member_id(&self) -> <Test as members::Trait>::MemberId {

        self.setup_and_fill_opening_result
        .setup_opening_in_review
        .added_members_application_result[0]
        .member_id
    }
}

fn setup_lead_and_hire_curator() -> SetupLeadAndHireCuratorResult {

    let curator_params = make_generic_add_member_params();

    // Hire curator
    let setup_and_fill_opening_result = setup_and_fill_opening(
        &vec![
            FillOpeningApplicantParams::new(
            curator_params.clone(),
            true)
        ]);

    SetupLeadAndHireCuratorResult {
        curator_params,
        setup_and_fill_opening_result
    }
}


struct CreateChannelFixture {
    pub channel_creator_member_id: <Test as members::Trait>::MemberId,
    pub controller_account: <Test as system::Trait>::AccountId,
    pub channel_creator_role_account: <Test as system::Trait>::AccountId,
    pub channel_name: Vec<u8>,
    pub description: Vec<u8>,
    pub content: ChannelContentType,
    pub publishing_status: ChannelPublishingStatus
}

impl CreateChannelFixture {

    pub fn make_valid_unpulished_video_channel_for(
        channel_creator_member_id: <Test as members::Trait>::MemberId,
        override_controller_account: Option<<Test as system::Trait>::AccountId>
    ) -> Self {

        let controller_account = 
            if let Some(account) = override_controller_account {
                account
            } else {
                members::Module::<Test>::ensure_profile(channel_creator_member_id)
                .unwrap()
                .controller_account
            };

        Self {
            channel_creator_member_id,
            controller_account,
            channel_creator_role_account: 527489,
            channel_name: generate_valid_length_buffer(&ChannelHandleConstraint::get()),
            description: generate_valid_length_buffer(&ChannelDescriptionConstraint::get()),
            content: ChannelContentType::Video,
            publishing_status: ChannelPublishingStatus::NotPublished
        }
    }

    fn create_channel(&self) -> Result<(), &'static str> {

        ContentWorkingGroup::create_channel(
            Origin::signed(self.controller_account),
            self.channel_creator_member_id,
            self.channel_creator_role_account,
            self.channel_name.clone(),
            self.description.clone(),
            self.content.clone(),
            self.publishing_status.clone()
        )
    }

    pub fn call_and_assert_error(&self, err_message: &'static str) {

        let number_of_events_before_call = System::events().len();

        let call_result = self.create_channel();

        assert_eq!(
            call_result
            ,
            Err(err_message)
        );

        // No new events deposited
        assert_no_new_events(number_of_events_before_call);
    }

    pub fn call_and_assert_success(&self) -> ChannelId<Test> {

        let call_result = self.create_channel();

        // Call result was Ok
        assert_eq!(
            call_result,
            Ok(())
        );

        // Assert that event was triggered,
        // keep channel id.
        let channel_id = ensure_channelcreated_event_deposited();

        // Assert that given channel id has been added,
        // and has the right properties.
        assert!(lib::ChannelById::<Test>::exists(channel_id));

        let created_channel = lib::ChannelById::<Test>::get(channel_id);

        let expected_channel = Channel {
            channel_name: self.channel_name.clone(),
            verified: false,
            description: self.description.clone(),
            content: self.content.clone(),
            owner: self.channel_creator_member_id,
            role_account: self.channel_creator_role_account,
            publishing_status: self.publishing_status.clone(),
            curation_status: ChannelCurationStatus::Normal,
            created: 1, // <== replace with now()

            // We have no expectation here, so we just copy what was added
            principal_id: created_channel.principal_id
        };

        assert_eq!(
            created_channel,
            expected_channel                
        );

        // Assert that next id incremented.
        assert_eq!(lib::NextChannelId::<Test>::get(), channel_id + 1);

        // Assert that there is a mapping established for name
        assert_eq!(
            lib::ChannelIdByName::<Test>::get(self.channel_name.clone()),
            channel_id
        );

        // Check that principal actually has been added
        assert!(
            lib::PrincipalById::<Test>::exists(created_channel.principal_id)
        );

        let created_principal = lib::PrincipalById::<Test>::get(created_channel.principal_id);

        assert!(
            match created_principal {
                Principal::Lead => false,
                Principal::Curator(_) => false,
                Principal::ChannelOwner(created_principal_channel_id) => created_principal_channel_id == channel_id,
            }
        );

        channel_id
    }

}

struct NewMemberAsLead {
    pub member_id: <Test as members::Trait>::MemberId,
    pub lead_id: LeadId<Test>
}

fn add_member_and_set_as_lead() -> NewMemberAsLead {

    let member_id = add_member(
        LEAD_ROOT_AND_CONTROLLER_ACCOUNT,
        to_vec(LEAD_MEMBER_HANDLE)
    );

    let lead_id = set_lead(member_id, LEAD_ROLE_ACCOUNT);

    NewMemberAsLead {
        member_id,
        lead_id
    }
}

pub fn set_channel_creation_enabled(enabled: bool) {

    lib::Module::<Test>::set_channel_creation_enabled(
        Origin::signed(LEAD_ROLE_ACCOUNT), 
        enabled
    ).unwrap()
}

pub fn add_channel_creator_member() -> <Test as members::Trait>::MemberId {

    let channel_creator_member_id = add_member(
        CHANNEL_CREATOR_ROOT_AND_CONTROLLER_ACCOUNT,
        to_vec(CHANNEL_CREATOR_HANDLE)
    );

    channel_creator_member_id
}


pub fn add_member(root_and_controller_account: <Test as system::Trait>::AccountId, handle: Vec<u8>) -> <Test as members::Trait>::MemberId {
    
    assert_eq!(
        members::Module::<Test>::buy_membership(
            Origin::signed(root_and_controller_account),
            0,
            members::UserInfo{
                handle: Some(handle),
                avatar_uri: None,
                about: None,
            }
        ).unwrap(),
        ()
    );

    ensure_memberregistered_event_deposited()
}

pub fn set_lead(member_id: <Test as members::Trait>::MemberId, new_role_account: <Test as system::Trait>::AccountId) -> LeadId<Test> {

    // Get controller account
    //let lead_member_controller_account = members::Module::<Test>::ensure_profile(member_id).unwrap().controller_account;

    // Set lead
    assert_eq!(
        ContentWorkingGroup::set_lead(
            mock::Origin::system(system::RawOrigin::Root),
            member_id,
            new_role_account
        ).unwrap(),
        ()
    );

    // Grab lead id
    ensure_lead_set_event_deposited()
}

// lead_role_account: <Test as system::Trait>::AccountId
pub fn add_curator_opening() -> CuratorOpeningId<Test> {

    let activate_at = hiring::ActivateOpeningAt::ExactBlock(34);

    let human_readable_text = generate_valid_length_buffer(&OpeningHumanReadableText::get());

    assert_eq!(
        ContentWorkingGroup::add_curator_opening(
            Origin::signed(LEAD_ROLE_ACCOUNT),
            activate_at.clone(),
            get_baseline_opening_policy(),
            human_readable_text.clone()
        ).unwrap(),
        ()
    );

    ensure_curatoropeningadded_event_deposited()
}

/*
 * Event readers
 */

fn ensure_curatoropeningfilled_event_deposited() -> (lib::CuratorOpeningId<Test>, BTreeMap<CuratorApplicationId<Test>, CuratorId<Test>>) {

    if let mock::TestEvent::lib(ref x) = System::events().last().unwrap().event {
        if let lib::RawEvent::CuratorOpeningFilled(ref curator_opening_id, ref successful_curator_application_id_to_curator_id) = x {
            return (curator_opening_id.clone(), successful_curator_application_id_to_curator_id.clone())
        } else {
            panic!("Event was not CuratorOpeningFilled.")
        }
    } else {
        panic!("No event deposited.")
    }
}

fn ensure_terminatecuratorapplication_event_deposited() -> lib::CuratorApplicationId<Test> {

    if let mock::TestEvent::lib(ref x) = System::events().last().unwrap().event {
        if let lib::RawEvent::CuratorApplicationTerminated(ref curator_application_id) = x {
            return curator_application_id.clone()
        } else {
            panic!("Event was not CuratorApplicationTerminated.")
        }
    } else {
        panic!("No event deposited.")
    }
}

fn ensure_begancuratorapplicationreview_event_deposited() -> lib::CuratorOpeningId<Test> {

    if let mock::TestEvent::lib(ref x) = System::events().last().unwrap().event {
        if let lib::RawEvent::BeganCuratorApplicationReview(ref curator_opening_id) = x {
            return curator_opening_id.clone()
        } else {
            panic!("Event was not BeganCuratorApplicationReview.")
        }
    } else {
        panic!("No event deposited.")
    }
}

fn ensure_curatorapplicationwithdrawn_event_deposited() -> lib::CuratorApplicationId<Test> {

    if let mock::TestEvent::lib(ref x) = System::events().last().unwrap().event {
        if let lib::RawEvent::CuratorApplicationWithdrawn(ref curator_application_id) = x {
            return curator_application_id.clone()
        } else {
            panic!("Event was not AppliedOnCuratorOpening.")
        }
    } else {
        panic!("No event deposited.")
    }
}

fn ensure_applieadoncuratoropening_event_deposited() -> (lib::CuratorOpeningId<Test>, lib::CuratorApplicationId<Test>) {

    if let mock::TestEvent::lib(ref x) = System::events().last().unwrap().event {
        if let lib::RawEvent::AppliedOnCuratorOpening(ref curator_opening_id, ref new_curator_application_id) = x {
            return (curator_opening_id.clone(), new_curator_application_id.clone())
        } else {
            panic!("Event was not AppliedOnCuratorOpening.")
        }
    } else {
        panic!("No event deposited.")
    }
}

// MOVE OUT TO MEMBERSHIP MODULE MOCK LATER?,
// OR MAKE MACRO OUT OF.
fn ensure_memberregistered_event_deposited() -> <Test as members::Trait>::MemberId {

    if let mock::TestEvent::members(ref x) = System::events().last().unwrap().event {
        if let members::RawEvent::MemberRegistered(ref member_id, ref _root_and_controller_account) = x {
            return member_id.clone();
        } else {
            panic!("Event was not MemberRegistered.")
        }
    } else {
        panic!("No event deposited.")
    }
}

fn ensure_channelcreated_event_deposited() -> lib::ChannelId<Test> {
    if let mock::TestEvent::lib(ref x) = System::events().last().unwrap().event {
        if let lib::RawEvent::ChannelCreated(ref channel_id) = x {
            return channel_id.clone();
        } else {
            panic!("Event was not ChannelCreated.")
        }
    } else {
        panic!("No event deposited.")
    }
}

fn ensure_lead_set_event_deposited() -> lib::LeadId<Test> {

    if let mock::TestEvent::lib(ref x) = System::events().last().unwrap().event {
        if let lib::RawEvent::LeadSet(ref lead_id) = x {
            return lead_id.clone();
        } else {
            panic!("Event was not LeadSet.")
        }
    } else {
        panic!("No event deposited.")
    }

}

fn ensure_curatoropeningadded_event_deposited() -> lib::CuratorOpeningId<Test> {

    if let mock::TestEvent::lib(ref x) = System::events().last().unwrap().event {
        if let lib::RawEvent::CuratorOpeningAdded(ref curator_opening_id) = x {
            return curator_opening_id.clone();
        } else {
            panic!("Event was not CuratorOpeningAdded.")
        }
    } else {
        panic!("No event deposited.")
    } 
}

fn ensure_acceptedcuratorapplications_event_deposited() -> lib::CuratorOpeningId<Test> {
    
    if let mock::TestEvent::lib(ref x) = System::events().last().unwrap().event {
        if let lib::RawEvent::AcceptedCuratorApplications(ref curator_opening_id) = x {
            return curator_opening_id.clone();
        } else {
            panic!("Event was not AcceptedCuratorApplications.")
        }
    } else {
        panic!("No event deposited.")
    } 
}


fn assert_no_new_events(number_of_events_before_call: usize) {

    assert_eq!(
        number_of_events_before_call,
        System::events().len()
    );
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