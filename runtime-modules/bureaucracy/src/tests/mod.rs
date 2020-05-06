mod mock;

use crate::constraints::InputValidationLengthConstraint;
use crate::types::{CuratorApplication, CuratorOpening, Lead, OpeningPolicyCommitment};
use crate::{Instance1, RawEvent};
use mock::{build_test_externalities, Bureaucracy1, Membership, System, TestEvent};
use srml_support::StorageValue;
use std::collections::BTreeSet;
use system::{EventRecord, Phase, RawOrigin};

fn setup_members(count: u8) {
    let authority_account_id = 1;
    Membership::set_screening_authority(RawOrigin::Root.into(), authority_account_id).unwrap();

    for i in 0..count {
        let account_id: u64 = i as u64;
        let handle: [u8; 20] = [i; 20];
        Membership::add_screened_member(
            RawOrigin::Signed(authority_account_id).into(),
            account_id,
            membership::members::UserInfo {
                handle: Some(handle.to_vec()),
                avatar_uri: None,
                about: None,
            },
        )
        .unwrap();
    }
}

struct ApplyOnCuratorOpeningFixture {
    origin: RawOrigin<u64>,
    member_id: u64,
    curator_opening_id: u64,
    role_account: u64,
    opt_role_stake_balance: Option<u64>,
    opt_application_stake_balance: Option<u64>,
    human_readable_text: Vec<u8>,
}

impl ApplyOnCuratorOpeningFixture {
    pub fn default_for_opening_id(opening_id: u64) -> Self {
        ApplyOnCuratorOpeningFixture {
            origin: RawOrigin::Signed(1),
            member_id: 1,
            curator_opening_id: opening_id,
            role_account: 1,
            opt_role_stake_balance: None,
            opt_application_stake_balance: None,
            human_readable_text: Vec::new(),
        }
    }

    pub fn call_and_assert(&self, expected_result: Result<(), &str>) {
        let saved_application_next_id = Bureaucracy1::next_curator_application_id();
        let actual_result = Bureaucracy1::apply_on_curator_opening(
            self.origin.clone().into(),
            self.member_id,
            self.curator_opening_id,
            self.role_account,
            self.opt_role_stake_balance,
            self.opt_application_stake_balance,
            self.human_readable_text.clone(),
        );
        assert_eq!(actual_result.clone(), expected_result);

        if actual_result.is_ok() {
            assert_eq!(
                Bureaucracy1::next_curator_application_id(),
                saved_application_next_id + 1
            );
            let application_id = saved_application_next_id;

            let actual_application = Bureaucracy1::curator_application_by_id(application_id);

            let expected_application = CuratorApplication {
                role_account: self.role_account,
                curator_opening_id: self.curator_opening_id,
                member_id: self.member_id,
                application_id,
            };

            assert_eq!(actual_application, expected_application);

            let current_opening = Bureaucracy1::curator_opening_by_id(self.curator_opening_id);
            assert!(current_opening
                .curator_applications
                .contains(&application_id));
        }
    }
}

struct AcceptCuratorApplicationsFixture {
    origin: RawOrigin<u64>,
    opening_id: u64,
}

impl AcceptCuratorApplicationsFixture {
    pub fn default_for_opening_id(opening_id: u64) -> Self {
        AcceptCuratorApplicationsFixture {
            origin: RawOrigin::Signed(1),
            opening_id,
        }
    }

    pub fn call_and_assert(&self, expected_result: Result<(), &str>) {
        let actual_result =
            Bureaucracy1::accept_curator_applications(self.origin.clone().into(), self.opening_id);
        assert_eq!(actual_result, expected_result);
    }
}

struct SetLeadFixture;
impl SetLeadFixture {
    fn set_lead(lead_account_id: u64) {
        assert_eq!(
            Bureaucracy1::set_lead(RawOrigin::Root.into(), 1, lead_account_id),
            Ok(())
        );
    }
}

struct AddCuratorOpeningFixture {
    origin: RawOrigin<u64>,
    activate_at: hiring::ActivateOpeningAt<u64>,
    commitment: OpeningPolicyCommitment<u64, u64>,
    human_readable_text: Vec<u8>,
}

impl Default for AddCuratorOpeningFixture {
    fn default() -> Self {
        AddCuratorOpeningFixture {
            origin: RawOrigin::Signed(1),
            activate_at: hiring::ActivateOpeningAt::CurrentBlock,
            commitment: <OpeningPolicyCommitment<u64, u64>>::default(),
            human_readable_text: Vec::new(),
        }
    }
}

impl AddCuratorOpeningFixture {
    pub fn call_and_assert(&self, expected_result: Result<(), &str>) {
        let saved_opening_next_id = Bureaucracy1::next_curator_opening_id();
        let actual_result = Bureaucracy1::add_curator_opening(
            self.origin.clone().into(),
            self.activate_at.clone(),
            self.commitment.clone(),
            self.human_readable_text.clone(),
        );
        assert_eq!(actual_result.clone(), expected_result);

        if actual_result.is_ok() {
            assert_eq!(
                Bureaucracy1::next_curator_opening_id(),
                saved_opening_next_id + 1
            );
            let opening_id = saved_opening_next_id;

            let actual_opening = Bureaucracy1::curator_opening_by_id(opening_id);

            let expected_opening = CuratorOpening::<u64, u64, u64, u64> {
                opening_id,
                curator_applications: BTreeSet::new(),
                policy_commitment: OpeningPolicyCommitment::default(),
            };

            assert_eq!(actual_opening, expected_opening);
        }
    }

    fn with_text(self, text: Vec<u8>) -> Self {
        AddCuratorOpeningFixture {
            human_readable_text: text,
            ..self
        }
    }

    fn with_activate_at(self, activate_at: hiring::ActivateOpeningAt<u64>) -> Self {
        AddCuratorOpeningFixture {
            activate_at,
            ..self
        }
    }
}

struct EventFixture;
impl EventFixture {
    fn assert_crate_events(
        expected_raw_events: Vec<RawEvent<u64, u64, u64, u64, crate::Instance1>>,
    ) {
        let converted_events = expected_raw_events
            .iter()
            .map(|ev| TestEvent::bureaucracy_Instance1(ev.clone()))
            .collect::<Vec<TestEvent>>();

        Self::assert_global_events(converted_events)
    }
    fn assert_global_events(expected_raw_events: Vec<TestEvent>) {
        let expected_events = expected_raw_events
            .iter()
            .map(|ev| EventRecord {
                phase: Phase::ApplyExtrinsic(0),
                event: ev.clone(),
                topics: vec![],
            })
            .collect::<Vec<EventRecord<_, _>>>();

        assert_eq!(System::events(), expected_events);
    }
}

#[test]
fn set_forum_sudo_set() {
    build_test_externalities().execute_with(|| {
        // Ensure that lead is default
        assert_eq!(Bureaucracy1::current_lead(), None);

        let lead_account_id = 1;
        let lead_member_id = 1;

        // Set lead
        assert_eq!(
            Bureaucracy1::set_lead(RawOrigin::Root.into(), lead_member_id, lead_account_id),
            Ok(())
        );

        let lead = Lead {
            member_id: lead_member_id,
            role_account_id: lead_account_id,
        };
        assert_eq!(Bureaucracy1::current_lead(), Some(lead));

        EventFixture::assert_crate_events(vec![RawEvent::LeaderSet(
            lead_member_id,
            lead_account_id,
        )]);
    });
}

#[test]
fn add_curator_opening_succeeds() {
    build_test_externalities().execute_with(|| {
        let lead_account_id = 1;
        SetLeadFixture::set_lead(lead_account_id);

        let add_curator_opening_fixture = AddCuratorOpeningFixture::default();

        add_curator_opening_fixture.call_and_assert(Ok(()));

        EventFixture::assert_crate_events(vec![
            RawEvent::LeaderSet(1, lead_account_id),
            RawEvent::CuratorOpeningAdded(0),
        ]);
    });
}

#[test]
fn add_curator_opening_fails_with_lead_is_not_set() {
    build_test_externalities().execute_with(|| {
        let add_curator_opening_fixture = AddCuratorOpeningFixture::default();

        add_curator_opening_fixture.call_and_assert(Err(crate::MSG_CURRENT_LEAD_NOT_SET));
    });
}

#[test]
fn add_curator_opening_fails_with_invalid_human_readable_text() {
    build_test_externalities().execute_with(|| {
        SetLeadFixture::set_lead(1);

        <crate::OpeningHumanReadableText<Instance1>>::put(InputValidationLengthConstraint {
            min: 1,
            max_min_diff: 5,
        });

        let add_curator_opening_fixture = AddCuratorOpeningFixture::default().with_text(Vec::new());

        add_curator_opening_fixture.call_and_assert(Err(crate::MSG_OPENING_TEXT_TOO_SHORT));

        let add_curator_opening_fixture =
            AddCuratorOpeningFixture::default().with_text(b"Long text".to_vec());

        add_curator_opening_fixture.call_and_assert(Err(crate::MSG_OPENING_TEXT_TOO_LONG));
    });
}

#[test]
fn add_curator_opening_fails_with_hiring_error() {
    build_test_externalities().execute_with(|| {
        SetLeadFixture::set_lead(1);

        let add_curator_opening_fixture = AddCuratorOpeningFixture::default()
            .with_activate_at(hiring::ActivateOpeningAt::ExactBlock(0));

        add_curator_opening_fixture.call_and_assert(Err("Opening does not activate in the future"));
    });
}

#[test]
fn accept_curator_applications_succeeds() {
    build_test_externalities().execute_with(|| {
        let lead_account_id = 1;
        SetLeadFixture::set_lead(lead_account_id);

        let add_curator_opening_fixture = AddCuratorOpeningFixture::default()
            .with_activate_at(hiring::ActivateOpeningAt::ExactBlock(5));
        add_curator_opening_fixture.call_and_assert(Ok(()));

        let opening_id = 0; // newly created opening

        let accept_curator_applications_fixture =
            AcceptCuratorApplicationsFixture::default_for_opening_id(opening_id);
        accept_curator_applications_fixture.call_and_assert(Ok(()));

        EventFixture::assert_crate_events(vec![
            RawEvent::LeaderSet(1, lead_account_id),
            RawEvent::CuratorOpeningAdded(opening_id),
            RawEvent::AcceptedCuratorApplications(opening_id),
        ]);
    });
}

#[test]
fn accept_curator_applications_fails_with_hiring_error() {
    build_test_externalities().execute_with(|| {
        SetLeadFixture::set_lead(1);

        let add_curator_opening_fixture = AddCuratorOpeningFixture::default();
        add_curator_opening_fixture.call_and_assert(Ok(()));

        let opening_id = 0; // newly created opening

        let accept_curator_applications_fixture =
            AcceptCuratorApplicationsFixture::default_for_opening_id(opening_id);
        accept_curator_applications_fixture
            .call_and_assert(Err("Opening Is Not in Waiting to begin"));
    });
}

#[test]
fn accept_curator_applications_fails_with_not_lead() {
    build_test_externalities().execute_with(|| {
        SetLeadFixture::set_lead(1);

        let add_curator_opening_fixture = AddCuratorOpeningFixture::default();
        add_curator_opening_fixture.call_and_assert(Ok(()));

        SetLeadFixture::set_lead(2);

        let opening_id = 0; // newly created opening

        let accept_curator_applications_fixture =
            AcceptCuratorApplicationsFixture::default_for_opening_id(opening_id);
        accept_curator_applications_fixture.call_and_assert(Err(crate::MSG_IS_NOT_LEAD_ACCOUNT));
    });
}

#[test]
fn accept_curator_applications_fails_with_no_opening() {
    build_test_externalities().execute_with(|| {
        SetLeadFixture::set_lead(1);

        let opening_id = 0; // newly created opening

        let accept_curator_applications_fixture =
            AcceptCuratorApplicationsFixture::default_for_opening_id(opening_id);
        accept_curator_applications_fixture
            .call_and_assert(Err(crate::MSG_CURATOR_OPENING_DOES_NOT_EXIST));
    });
}

#[test]
fn apply_on_curator_opening_succeeds() {
    build_test_externalities().execute_with(|| {
        let lead_account_id = 1;
        SetLeadFixture::set_lead(lead_account_id);

        setup_members(2);

        let add_curator_opening_fixture = AddCuratorOpeningFixture::default();
        add_curator_opening_fixture.call_and_assert(Ok(()));

        let opening_id = 0; // newly created opening

        let appy_on_curator_opening_fixture =
            ApplyOnCuratorOpeningFixture::default_for_opening_id(opening_id);
        appy_on_curator_opening_fixture.call_and_assert(Ok(()));

        EventFixture::assert_global_events(vec![
            TestEvent::bureaucracy_Instance1(RawEvent::LeaderSet(1, lead_account_id)),
            TestEvent::membership_mod(membership::members::RawEvent::MemberRegistered(0, 0)),
            TestEvent::membership_mod(membership::members::RawEvent::MemberRegistered(1, 1)),
            TestEvent::bureaucracy_Instance1(RawEvent::CuratorOpeningAdded(opening_id)),
            TestEvent::bureaucracy_Instance1(RawEvent::AppliedOnCuratorOpening(opening_id, 0)),
        ]);
    });
}

#[test]
fn apply_on_curator_opening_fails_with_no_opening() {
    build_test_externalities().execute_with(|| {
        let lead_account_id = 1;
        SetLeadFixture::set_lead(lead_account_id);

        setup_members(2);

        let opening_id = 0; // newly created opening

        let appy_on_curator_opening_fixture =
            ApplyOnCuratorOpeningFixture::default_for_opening_id(opening_id);
        appy_on_curator_opening_fixture
            .call_and_assert(Err(crate::MSG_CURATOR_OPENING_DOES_NOT_EXIST));
    });
}

#[test]
fn apply_on_curator_opening_fails_with_not_set_members() {
    build_test_externalities().execute_with(|| {
        let lead_account_id = 1;
        SetLeadFixture::set_lead(lead_account_id);

        let add_curator_opening_fixture = AddCuratorOpeningFixture::default();
        add_curator_opening_fixture.call_and_assert(Ok(()));

        let opening_id = 0; // newly created opening

        let appy_on_curator_opening_fixture =
            ApplyOnCuratorOpeningFixture::default_for_opening_id(opening_id);
        appy_on_curator_opening_fixture
            .call_and_assert(Err(crate::MSG_ORIGIN_IS_NEITHER_MEMBER_CONTROLLER_OR_ROOT));
    });
}
