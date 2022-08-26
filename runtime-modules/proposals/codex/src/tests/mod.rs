mod mock;

use content::NftLimitPeriod;
use frame_support::dispatch::{DispatchError, DispatchResult};
use frame_support::storage::StorageMap;
use frame_support::traits::Currency;
use frame_support::traits::{OnFinalize, OnInitialize};
use frame_system::{EventRecord, RawOrigin};
use sp_runtime::traits::Hash;
use sp_std::convert::TryInto;
use sp_std::iter::FromIterator;

use common::working_group::WorkingGroup;
use common::BalanceKind;
use proposals_engine::ProposalParameters;
use referendum::ReferendumManager;
use working_group::StakePolicy;

use crate::*;
use crate::{Error, ProposalDetails};
pub use mock::*;
use sp_runtime::traits::One;
use working_group::{
    ApplicationById, ApplicationId, ApplyOnOpeningParameters, OpeningById, OpeningId, OpeningType,
    StakeParameters, WorkerId,
};

use strum::IntoEnumIterator;

pub(crate) fn increase_total_balance_issuance(balance: u64) {
    increase_total_balance_issuance_using_account_id(999, balance);
}

pub(crate) fn increase_total_balance_issuance_using_account_id(account_id: u64, balance: u64) {
    let initial_balance = Balances::total_issuance();
    {
        let _ = Balances::deposit_creating(&account_id, balance);
    }
    assert_eq!(
        Balances::total_issuance(),
        initial_balance.saturating_add(balance)
    );
}

fn insert_leader<I: Instance>() -> WorkerId<Test>
where
    Test: working_group::Config<I>,
{
    let (opening_id, application_id) = add_and_apply_on_lead_opening::<I>();

    let successful_application_ids = BTreeSet::<ApplicationId>::from_iter(vec![application_id]);

    let worker_id = working_group::NextWorkerId::<Test, I>::get();
    working_group::Module::<Test, I>::fill_opening(
        RawOrigin::Root.into(),
        opening_id,
        successful_application_ids,
    )
    .unwrap();

    assert!(working_group::Module::<Test, I>::current_lead()
        .map(|id| id == worker_id)
        .unwrap_or(false));

    worker_id
}

fn add_and_apply_on_lead_opening<I: Instance>() -> (OpeningId, ApplicationId)
where
    Test: working_group::Config<I>,
{
    let opening_id = add_lead_opening_helper::<I>();

    let application_id = apply_on_opening_helper::<I>(&opening_id);

    (opening_id, application_id)
}

fn add_lead_opening_helper<I: Instance>() -> OpeningId
where
    Test: working_group::Config<I>,
{
    let opening_id = working_group::Module::<Test, I>::next_opening_id();

    working_group::Module::<Test, I>::add_opening(
        RawOrigin::Root.into(),
        vec![],
        OpeningType::Leader,
        StakePolicy {
            stake_amount: <Test as working_group::Config<I>>::MinimumApplicationStake::get(),
            leaving_unstaking_period:
                <Test as working_group::Config<I>>::MinUnstakingPeriodLimit::get() + 1,
        },
        Some(One::one()),
    )
    .unwrap();

    assert!(
        OpeningById::<Test, I>::contains_key(opening_id),
        "Opening not added"
    );

    opening_id
}

fn apply_on_opening_helper<I: Instance>(opening_id: &OpeningId) -> ApplicationId
where
    Test: working_group::Config<I>,
{
    let stake = <Test as working_group::Config<I>>::MinimumApplicationStake::get();
    increase_total_balance_issuance_using_account_id(LEADER_ACCOUNT_ID, stake);

    let application_id = working_group::Module::<Test, I>::next_application_id();

    working_group::Module::<Test, I>::apply_on_opening(
        RawOrigin::Signed(LEADER_ACCOUNT_ID).into(),
        ApplyOnOpeningParameters::<Test> {
            member_id: LEADER_MEMBER_ID,
            opening_id: *opening_id,
            role_account_id: LEADER_ACCOUNT_ID,
            reward_account_id: LEADER_ACCOUNT_ID,
            description: vec![],
            stake_parameters: StakeParameters {
                stake,
                staking_account_id: LEADER_ACCOUNT_ID,
            },
        },
    )
    .unwrap();

    assert!(
        ApplicationById::<Test, I>::contains_key(application_id),
        "Application not added"
    );

    application_id
}

fn setup_lead_opening_and_application(working_group: WorkingGroup) -> (OpeningId, ApplicationId) {
    match working_group {
        WorkingGroup::Forum => add_and_apply_on_lead_opening::<ForumWorkingGroupInstance>(),
        WorkingGroup::Storage => add_and_apply_on_lead_opening::<StorageWorkingGroupInstance>(),
        WorkingGroup::Content => add_and_apply_on_lead_opening::<ContentWorkingGroupInstance>(),
        WorkingGroup::OperationsAlpha => {
            add_and_apply_on_lead_opening::<OperationsWorkingGroupInstanceAlpha>()
        }
        WorkingGroup::Gateway => add_and_apply_on_lead_opening::<GatewayWorkingGroupInstance>(),
        WorkingGroup::Membership => {
            add_and_apply_on_lead_opening::<MembershipWorkingGroupInstance>()
        }
        WorkingGroup::OperationsBeta => {
            add_and_apply_on_lead_opening::<OperationsWorkingGroupInstanceBeta>()
        }
        WorkingGroup::OperationsGamma => {
            add_and_apply_on_lead_opening::<OperationsWorkingGroupInstanceGamma>()
        }
        WorkingGroup::Distribution => {
            add_and_apply_on_lead_opening::<DistributionWorkingGroupInstance>()
        }
    }
}

fn setup_lead(working_group: WorkingGroup) -> WorkerId<Test> {
    match working_group {
        WorkingGroup::Forum => insert_leader::<ForumWorkingGroupInstance>(),
        WorkingGroup::Storage => insert_leader::<StorageWorkingGroupInstance>(),
        WorkingGroup::Content => insert_leader::<ContentWorkingGroupInstance>(),
        WorkingGroup::OperationsAlpha => insert_leader::<OperationsWorkingGroupInstanceAlpha>(),
        WorkingGroup::Gateway => insert_leader::<GatewayWorkingGroupInstance>(),
        WorkingGroup::Membership => insert_leader::<MembershipWorkingGroupInstance>(),
        WorkingGroup::OperationsBeta => insert_leader::<OperationsWorkingGroupInstanceBeta>(),
        WorkingGroup::OperationsGamma => insert_leader::<OperationsWorkingGroupInstanceGamma>(),
        WorkingGroup::Distribution => insert_leader::<DistributionWorkingGroupInstance>(),
    }
}

fn assert_last_event(generic_event: <Test as Config>::Event) {
    let events = System::events();
    let system_event: <Test as frame_system::Config>::Event = generic_event;
    assert!(
        !events.is_empty(),
        "If you are checking for last event there must be at least 1 event"
    );

    let EventRecord { event, .. } = &events[events.len() - 1];
    assert_eq!(event, &system_event);
}

struct ProposalTestFixture<
    InsufficientRightsCall,
    InvalidStakeAccountCall,
    EmptyStakeCall,
    SuccessfulCall,
> where
    InsufficientRightsCall: Fn() -> DispatchResult,
    InvalidStakeAccountCall: Fn() -> DispatchResult,
    EmptyStakeCall: Fn() -> DispatchResult,
    SuccessfulCall: Fn() -> DispatchResult,
{
    insufficient_rights_call: InsufficientRightsCall,
    invalid_stake_account_call: InvalidStakeAccountCall,
    empty_stake_call: EmptyStakeCall,
    successful_call: SuccessfulCall,
    proposal_parameters: ProposalParameters<u64, u64>,
    proposal_details: ProposalDetailsOf<Test>,
    general_proposal_parameters: GeneralProposalParameters<Test>,
}

impl<InsufficientRightsCall, InvalidStakeAccountCall, EmptyStakeCall, SuccessfulCall>
    ProposalTestFixture<
        InsufficientRightsCall,
        InvalidStakeAccountCall,
        EmptyStakeCall,
        SuccessfulCall,
    >
where
    InsufficientRightsCall: Fn() -> DispatchResult,
    InvalidStakeAccountCall: Fn() -> DispatchResult,
    EmptyStakeCall: Fn() -> DispatchResult,
    SuccessfulCall: Fn() -> DispatchResult,
{
    fn check_for_invalid_stakes(&self) {
        assert_eq!(
            (self.empty_stake_call)(),
            Err(proposals_engine::Error::<Test>::EmptyStake.into())
        );
    }

    fn check_call_for_insufficient_rights(&self) {
        assert_eq!(
            (self.insufficient_rights_call)(),
            Err(DispatchError::BadOrigin)
        );
    }

    fn check_call_for_invalid_stake_account(&self) {
        assert_eq!(
            (self.invalid_stake_account_call)(),
            Err(proposals_engine::Error::<Test>::InvalidStakingAccountForMember.into())
        );
    }

    fn check_for_insufficient_balance(&self) {
        assert_eq!(
            (self.successful_call)(),
            Err(proposals_engine::Error::<Test>::InsufficientBalanceForStake.into())
        );
    }

    fn check_for_successful_call(&self) {
        let account_id = 1;
        increase_total_balance_issuance_using_account_id(account_id, 150000);

        assert_eq!((self.successful_call)(), Ok(()));

        let proposal_id =
            <Test as proposals_engine::Config>::ProposalId::from(ProposalsEngine::proposal_count());
        // a discussion was created
        assert!(<crate::ThreadIdByProposalId<Test>>::contains_key(
            proposal_id
        ));
        let thread_id = <crate::ThreadIdByProposalId<Test>>::get(proposal_id);

        let proposal = ProposalsEngine::proposals(proposal_id);
        // check for correct proposal parameters
        assert_eq!(proposal.parameters, self.proposal_parameters);
        assert_last_event(
            RawEvent::ProposalCreated(
                proposal_id,
                self.general_proposal_parameters.clone(),
                self.proposal_details.clone(),
                thread_id,
            )
            .into(),
        );
    }

    pub fn check_all(&self) {
        self.check_call_for_insufficient_rights();
        self.check_for_invalid_stakes();
        self.check_call_for_invalid_stake_account();
        self.check_for_insufficient_balance();
        self.check_for_successful_call();
    }
}

#[test]
fn create_signal_proposal_common_checks_succeed() {
    initial_test_ext().execute_with(|| {
        let general_proposal_parameters_no_staking = GeneralProposalParameters::<Test> {
            member_id: 1,
            title: b"title".to_vec(),
            description: b"body".to_vec(),
            staking_account_id: None,
            exact_execution_block: None,
        };

        let general_proposal_parameters_incorrect_staking = GeneralProposalParameters::<Test> {
            member_id: 1,
            title: b"title".to_vec(),
            description: b"body".to_vec(),
            staking_account_id: Some(STAKING_ACCOUNT_ID_NOT_BOUND_TO_MEMBER),
            exact_execution_block: None,
        };

        let general_proposal_parameters = GeneralProposalParameters::<Test> {
            member_id: 1,
            title: b"title".to_vec(),
            description: b"body".to_vec(),
            staking_account_id: Some(1),
            exact_execution_block: None,
        };

        let proposal_details = ProposalDetails::Signal(b"text".to_vec());

        let proposal_fixture = ProposalTestFixture {
            general_proposal_parameters: general_proposal_parameters.clone(),
            proposal_details: proposal_details.clone(),
            insufficient_rights_call: || {
                ProposalsCodex::create_proposal(
                    RawOrigin::None.into(),
                    general_proposal_parameters_no_staking.clone(),
                    proposal_details.clone(),
                )
            },
            invalid_stake_account_call: || {
                ProposalsCodex::create_proposal(
                    RawOrigin::Signed(1).into(),
                    general_proposal_parameters_incorrect_staking.clone(),
                    proposal_details.clone(),
                )
            },
            empty_stake_call: || {
                ProposalsCodex::create_proposal(
                    RawOrigin::Signed(1).into(),
                    general_proposal_parameters_no_staking.clone(),
                    proposal_details.clone(),
                )
            },
            successful_call: || {
                ProposalsCodex::create_proposal(
                    RawOrigin::Signed(1).into(),
                    general_proposal_parameters.clone(),
                    proposal_details.clone(),
                )
            },
            proposal_parameters: <Test as crate::Config>::SignalProposalParameters::get(),
        };
        proposal_fixture.check_all();
    });
}

#[test]
fn create_signal_proposal_codex_call_fails_without_text() {
    initial_test_ext().execute_with(|| {
        let general_proposal_parameters = GeneralProposalParameters::<Test> {
            member_id: 1,
            title: b"title".to_vec(),
            description: b"body".to_vec(),
            staking_account_id: None,
            exact_execution_block: None,
        };

        assert_eq!(
            ProposalsCodex::create_proposal(
                RawOrigin::Signed(1).into(),
                general_proposal_parameters,
                ProposalDetails::Signal(Vec::new()),
            ),
            Err(Error::<Test>::SignalProposalIsEmpty.into())
        );
    });
}

#[test]
fn create_runtime_upgrade_common_checks_succeed() {
    initial_test_ext().execute_with(|| {
        let general_proposal_parameters_no_staking = GeneralProposalParameters::<Test> {
            member_id: 1,
            title: b"title".to_vec(),
            description: b"body".to_vec(),
            staking_account_id: None,
            exact_execution_block: None,
        };

        let general_proposal_parameters_incorrect_staking = GeneralProposalParameters::<Test> {
            member_id: 1,
            title: b"title".to_vec(),
            description: b"body".to_vec(),
            staking_account_id: Some(STAKING_ACCOUNT_ID_NOT_BOUND_TO_MEMBER),
            exact_execution_block: None,
        };
        let general_proposal_parameters = GeneralProposalParameters::<Test> {
            member_id: 1,
            title: b"title".to_vec(),
            description: b"body".to_vec(),
            staking_account_id: Some(1),
            exact_execution_block: None,
        };

        let proposal_details = ProposalDetails::RuntimeUpgrade(b"wasm".to_vec());

        let proposal_fixture = ProposalTestFixture {
            general_proposal_parameters: general_proposal_parameters.clone(),
            proposal_details: proposal_details.clone(),
            insufficient_rights_call: || {
                ProposalsCodex::create_proposal(
                    RawOrigin::None.into(),
                    general_proposal_parameters_no_staking.clone(),
                    proposal_details.clone(),
                )
            },
            invalid_stake_account_call: || {
                ProposalsCodex::create_proposal(
                    RawOrigin::Signed(1).into(),
                    general_proposal_parameters_incorrect_staking.clone(),
                    proposal_details.clone(),
                )
            },
            empty_stake_call: || {
                ProposalsCodex::create_proposal(
                    RawOrigin::Signed(1).into(),
                    general_proposal_parameters_no_staking.clone(),
                    proposal_details.clone(),
                )
            },
            successful_call: || {
                ProposalsCodex::create_proposal(
                    RawOrigin::Signed(1).into(),
                    general_proposal_parameters.clone(),
                    proposal_details.clone(),
                )
            },
            proposal_parameters: <Test as crate::Config>::RuntimeUpgradeProposalParameters::get(),
        };
        proposal_fixture.check_all();
    });
}

#[test]
fn create_upgrade_runtime_proposal_codex_call_fails_with_empty_wasm() {
    initial_test_ext().execute_with(|| {
        let general_proposal_parameters = GeneralProposalParameters::<Test> {
            member_id: 1,
            title: b"title".to_vec(),
            description: b"body".to_vec(),
            staking_account_id: None,
            exact_execution_block: None,
        };

        assert_eq!(
            ProposalsCodex::create_proposal(
                RawOrigin::Signed(1).into(),
                general_proposal_parameters,
                ProposalDetails::RuntimeUpgrade(Vec::new()),
            ),
            Err(Error::<Test>::RuntimeProposalIsEmpty.into())
        );
    });
}

#[test]
fn create_funding_request_proposal_common_checks_succeed() {
    initial_test_ext().execute_with(|| {
        let total_balance_issuance = 500000;
        increase_total_balance_issuance(total_balance_issuance);

        let general_proposal_parameters_no_staking = GeneralProposalParameters::<Test> {
            member_id: 1,
            title: b"title".to_vec(),
            description: b"body".to_vec(),
            staking_account_id: None,
            exact_execution_block: None,
        };

        let general_proposal_parameters_incorrect_staking = GeneralProposalParameters::<Test> {
            member_id: 1,
            title: b"title".to_vec(),
            description: b"body".to_vec(),
            staking_account_id: Some(STAKING_ACCOUNT_ID_NOT_BOUND_TO_MEMBER),
            exact_execution_block: None,
        };
        let general_proposal_parameters = GeneralProposalParameters::<Test> {
            member_id: 1,
            title: b"title".to_vec(),
            description: b"body".to_vec(),
            staking_account_id: Some(1),
            exact_execution_block: None,
        };

        let proposal_details = ProposalDetails::FundingRequest(vec![
            common::FundingRequestParameters {
                amount: 100,
                account: 2,
            },
            common::FundingRequestParameters {
                amount: 50,
                account: 3,
            },
        ]);

        let proposal_fixture = ProposalTestFixture {
            general_proposal_parameters: general_proposal_parameters.clone(),
            proposal_details: proposal_details.clone(),
            insufficient_rights_call: || {
                ProposalsCodex::create_proposal(
                    RawOrigin::None.into(),
                    general_proposal_parameters_no_staking.clone(),
                    proposal_details.clone(),
                )
            },
            invalid_stake_account_call: || {
                ProposalsCodex::create_proposal(
                    RawOrigin::Signed(1).into(),
                    general_proposal_parameters_incorrect_staking.clone(),
                    proposal_details.clone(),
                )
            },
            empty_stake_call: || {
                ProposalsCodex::create_proposal(
                    RawOrigin::Signed(1).into(),
                    general_proposal_parameters_no_staking.clone(),
                    proposal_details.clone(),
                )
            },
            successful_call: || {
                ProposalsCodex::create_proposal(
                    RawOrigin::Signed(1).into(),
                    general_proposal_parameters.clone(),
                    proposal_details.clone(),
                )
            },
            proposal_parameters: <Test as crate::Config>::FundingRequestProposalParameters::get(),
        };
        proposal_fixture.check_all();
    });
}

#[test]
fn create_funding_request_proposal_call_fails_with_incorrect_balance() {
    initial_test_ext().execute_with(|| {
        let general_proposal_parameters = GeneralProposalParameters::<Test> {
            member_id: 1,
            title: b"title".to_vec(),
            description: b"body".to_vec(),
            staking_account_id: Some(1),
            exact_execution_block: None,
        };

        let funding_request_proposal_zero_balance =
            ProposalDetails::FundingRequest(vec![common::FundingRequestParameters {
                amount: 0,
                account: 2,
            }]);

        assert_eq!(
            ProposalsCodex::create_proposal(
                RawOrigin::Signed(1).into(),
                general_proposal_parameters.clone(),
                funding_request_proposal_zero_balance,
            ),
            Err(Error::<Test>::InvalidFundingRequestProposalBalance.into())
        );

        let exceeded_budget = <Test as crate::Config>::FundingRequestProposalMaxAmount::get() + 1;

        let funding_request_proposal_exceeded_balance =
            ProposalDetails::FundingRequest(vec![common::FundingRequestParameters {
                amount: exceeded_budget.into(),
                account: 2,
            }]);

        assert_eq!(
            ProposalsCodex::create_proposal(
                RawOrigin::Signed(1).into(),
                general_proposal_parameters,
                funding_request_proposal_exceeded_balance,
            ),
            Err(Error::<Test>::InvalidFundingRequestProposalBalance.into())
        );
    });
}

#[test]
fn create_funding_request_proposal_call_fails_with_incorrect_number_of_accounts() {
    initial_test_ext().execute_with(|| {
        let general_proposal_parameters = GeneralProposalParameters::<Test> {
            member_id: 1,
            title: b"title".to_vec(),
            description: b"body".to_vec(),
            staking_account_id: Some(1),
            exact_execution_block: None,
        };

        assert_eq!(
            ProposalsCodex::create_proposal(
                RawOrigin::Signed(1).into(),
                general_proposal_parameters.clone(),
                ProposalDetails::FundingRequest(
                    Vec::<common::FundingRequestParameters<u64, u64>>::new()
                ),
            ),
            Err(Error::<Test>::InvalidFundingRequestProposalNumberOfAccount.into())
        );

        let mut funding_request_proposal_exceeded_number_of_account =
            Vec::<common::FundingRequestParameters<_, _>>::new();

        for i in 0..=<Test as crate::Config>::FundingRequestProposalMaxAccounts::get() {
            funding_request_proposal_exceeded_number_of_account.push(
                common::FundingRequestParameters {
                    amount: 100,
                    account: i.try_into().unwrap(),
                },
            );
        }

        assert_eq!(
            ProposalsCodex::create_proposal(
                RawOrigin::Signed(1).into(),
                general_proposal_parameters,
                ProposalDetails::FundingRequest(
                    funding_request_proposal_exceeded_number_of_account
                ),
            ),
            Err(Error::<Test>::InvalidFundingRequestProposalNumberOfAccount.into())
        );
    });
}

#[test]
fn create_funding_request_proposal_call_fails_repeated_account() {
    initial_test_ext().execute_with(|| {
        let general_proposal_parameters = GeneralProposalParameters::<Test> {
            member_id: 1,
            title: b"title".to_vec(),
            description: b"body".to_vec(),
            staking_account_id: Some(1),
            exact_execution_block: None,
        };

        let funding_request_proposal_details = vec![
            common::FundingRequestParameters {
                amount: 100,
                account: 1u64,
            };
            2
        ];

        assert_eq!(
            ProposalsCodex::create_proposal(
                RawOrigin::Signed(1).into(),
                general_proposal_parameters,
                ProposalDetails::FundingRequest(funding_request_proposal_details),
            ),
            Err(Error::<Test>::InvalidFundingRequestProposalRepeatedAccount.into())
        );
    });
}

#[test]
fn create_set_max_validator_count_proposal_common_checks_succeed() {
    initial_test_ext().execute_with(|| {
        let general_proposal_parameters_no_staking = GeneralProposalParameters::<Test> {
            member_id: 1,
            title: b"title".to_vec(),
            description: b"body".to_vec(),
            staking_account_id: None,
            exact_execution_block: None,
        };

        let general_proposal_parameters_incorrect_staking = GeneralProposalParameters::<Test> {
            member_id: 1,
            title: b"title".to_vec(),
            description: b"body".to_vec(),
            staking_account_id: Some(STAKING_ACCOUNT_ID_NOT_BOUND_TO_MEMBER),
            exact_execution_block: None,
        };

        let general_proposal_parameters = GeneralProposalParameters::<Test> {
            member_id: 1,
            title: b"title".to_vec(),
            description: b"body".to_vec(),
            staking_account_id: Some(1),
            exact_execution_block: None,
        };

        let proposal_details = ProposalDetails::SetMaxValidatorCount(4);

        let proposal_fixture = ProposalTestFixture {
            general_proposal_parameters: general_proposal_parameters.clone(),
            proposal_details: proposal_details.clone(),
            insufficient_rights_call: || {
                ProposalsCodex::create_proposal(
                    RawOrigin::None.into(),
                    general_proposal_parameters_no_staking.clone(),
                    proposal_details.clone(),
                )
            },
            invalid_stake_account_call: || {
                ProposalsCodex::create_proposal(
                    RawOrigin::Signed(1).into(),
                    general_proposal_parameters_incorrect_staking.clone(),
                    proposal_details.clone(),
                )
            },
            empty_stake_call: || {
                ProposalsCodex::create_proposal(
                    RawOrigin::Signed(1).into(),
                    general_proposal_parameters_no_staking.clone(),
                    proposal_details.clone(),
                )
            },
            successful_call: || {
                ProposalsCodex::create_proposal(
                    RawOrigin::Signed(1).into(),
                    general_proposal_parameters.clone(),
                    proposal_details.clone(),
                )
            },
            proposal_parameters:
                <Test as crate::Config>::SetMaxValidatorCountProposalParameters::get(),
        };
        proposal_fixture.check_all();
    });
}

#[test]
fn create_veto_proposal_common_checks_succeed() {
    initial_test_ext().execute_with(|| {
        let general_proposal_parameters_no_staking = GeneralProposalParameters::<Test> {
            member_id: 1,
            title: b"title".to_vec(),
            description: b"body".to_vec(),
            staking_account_id: None,
            exact_execution_block: None,
        };

        let general_proposal_parameters_incorrect_staking = GeneralProposalParameters::<Test> {
            member_id: 1,
            title: b"title".to_vec(),
            description: b"body".to_vec(),
            staking_account_id: Some(STAKING_ACCOUNT_ID_NOT_BOUND_TO_MEMBER),
            exact_execution_block: None,
        };

        let general_proposal_parameters = GeneralProposalParameters::<Test> {
            member_id: 1,
            title: b"title".to_vec(),
            description: b"body".to_vec(),
            staking_account_id: Some(1),
            exact_execution_block: None,
        };

        // Create proposal to be vetoed
        increase_total_balance_issuance_using_account_id(2, 15000000);
        ProposalsCodex::create_proposal(
            RawOrigin::Signed(2).into(),
            GeneralProposalParameters::<Test> {
                member_id: 2,
                title: b"title".to_vec(),
                description: b"body".to_vec(),
                staking_account_id: Some(2),
                exact_execution_block: None,
            },
            ProposalDetails::Signal(vec![0u8]),
        )
        .unwrap();

        let proposal_details =
            ProposalDetails::VetoProposal(ProposalsEngine::proposal_count().into());

        let proposal_fixture = ProposalTestFixture {
            general_proposal_parameters: general_proposal_parameters.clone(),
            proposal_details: proposal_details.clone(),
            insufficient_rights_call: || {
                ProposalsCodex::create_proposal(
                    RawOrigin::None.into(),
                    general_proposal_parameters_no_staking.clone(),
                    proposal_details.clone(),
                )
            },
            invalid_stake_account_call: || {
                ProposalsCodex::create_proposal(
                    RawOrigin::Signed(1).into(),
                    general_proposal_parameters_incorrect_staking.clone(),
                    proposal_details.clone(),
                )
            },
            empty_stake_call: || {
                ProposalsCodex::create_proposal(
                    RawOrigin::Signed(1).into(),
                    general_proposal_parameters_no_staking.clone(),
                    proposal_details.clone(),
                )
            },
            successful_call: || {
                ProposalsCodex::create_proposal(
                    RawOrigin::Signed(1).into(),
                    general_proposal_parameters.clone(),
                    proposal_details.clone(),
                )
            },
            proposal_parameters: <Test as crate::Config>::VetoProposalProposalParameters::get(),
        };
        proposal_fixture.check_all();
    });
}

#[test]
fn create_veto_proposal_fails_with_invalid_proposal_id() {
    initial_test_ext().execute_with(|| {
        let account_id = 1;
        increase_total_balance_issuance_using_account_id(account_id, 15000000);

        let general_proposal_parameters = GeneralProposalParameters::<Test> {
            member_id: 1,
            title: b"title".to_vec(),
            description: b"body".to_vec(),
            staking_account_id: Some(account_id),
            exact_execution_block: None,
        };

        assert_eq!(
            ProposalsCodex::create_proposal(
                RawOrigin::Signed(1).into(),
                general_proposal_parameters.clone(),
                ProposalDetails::VetoProposal(1u32.into()),
            ),
            Err(Error::<Test>::InvalidProposalId.into())
        );
    });
}

#[test]
fn create_set_max_validator_count_proposal_failed_with_invalid_validator_count() {
    initial_test_ext().execute_with(|| {
        let account_id = 1;
        increase_total_balance_issuance_using_account_id(account_id, 15000000);

        staking::MinimumValidatorCount::<Test>::put(10);

        let general_proposal_parameters = GeneralProposalParameters::<Test> {
            member_id: 1,
            title: b"title".to_vec(),
            description: b"body".to_vec(),
            staking_account_id: Some(account_id),
            exact_execution_block: None,
        };

        assert_eq!(
            ProposalsCodex::create_proposal(
                RawOrigin::Signed(1).into(),
                general_proposal_parameters.clone(),
                ProposalDetails::SetMaxValidatorCount(3),
            ),
            Err(Error::<Test>::InvalidValidatorCount.into())
        );

        assert_eq!(
            ProposalsCodex::create_proposal(
                RawOrigin::Signed(1).into(),
                general_proposal_parameters,
                ProposalDetails::SetMaxValidatorCount(
                    <Test as crate::Config>::SetMaxValidatorCountProposalMaxValidators::get() + 1
                ),
            ),
            Err(Error::<Test>::InvalidValidatorCount.into())
        );
    });
}

#[test]
fn create_add_working_group_leader_opening_proposal_common_checks_succeed() {
    // This uses strum crate for enum iteration
    for group in WorkingGroup::iter() {
        run_create_add_working_group_leader_opening_proposal_common_checks_succeed(group);
    }
}

fn run_create_add_working_group_leader_opening_proposal_common_checks_succeed(group: WorkingGroup) {
    initial_test_ext().execute_with(|| {
        let general_proposal_parameters_no_staking = GeneralProposalParameters::<Test> {
            member_id: 1,
            title: b"title".to_vec(),
            description: b"body".to_vec(),
            staking_account_id: None,
            exact_execution_block: None,
        };

        let general_proposal_parameters_incorrect_staking = GeneralProposalParameters::<Test> {
            member_id: 1,
            title: b"title".to_vec(),
            description: b"body".to_vec(),
            staking_account_id: Some(STAKING_ACCOUNT_ID_NOT_BOUND_TO_MEMBER),
            exact_execution_block: None,
        };
        let general_proposal_parameters = GeneralProposalParameters::<Test> {
            member_id: 1,
            title: b"title".to_vec(),
            description: b"body".to_vec(),
            staking_account_id: Some(1),
            exact_execution_block: None,
        };

        let add_opening_parameters = CreateOpeningParameters {
            description: b"some text".to_vec(),
            stake_policy: StakePolicy {
                stake_amount: <Test as working_group::Config<working_group::Instance1>>::MinimumApplicationStake::get() as
                    u64,
                leaving_unstaking_period: 0_u64,
            },
            reward_per_block: None,
            group,
        };

        let proposal_details =
            ProposalDetails::CreateWorkingGroupLeadOpening(add_opening_parameters);

        let proposal_fixture = ProposalTestFixture {
            general_proposal_parameters: general_proposal_parameters.clone(),
            proposal_details: proposal_details.clone(),
            insufficient_rights_call: || {
                ProposalsCodex::create_proposal(
                    RawOrigin::None.into(),
                    general_proposal_parameters_no_staking.clone(),
                    proposal_details.clone(),
                )
            },
            invalid_stake_account_call: || {
                ProposalsCodex::create_proposal(
                    RawOrigin::Signed(1).into(),
                    general_proposal_parameters_incorrect_staking.clone(),
                    proposal_details.clone(),
                )
            },
            empty_stake_call: || {
                ProposalsCodex::create_proposal(
                    RawOrigin::Signed(1).into(),
                    general_proposal_parameters_no_staking.clone(),
                    proposal_details.clone(),
                )
            },
            successful_call: || {
                ProposalsCodex::create_proposal(
                    RawOrigin::Signed(1).into(),
                    general_proposal_parameters.clone(),
                    proposal_details.clone(),
                )
            },
            proposal_parameters:
                <Test as crate::Config>::CreateWorkingGroupLeadOpeningProposalParameters::get(),
        };
        proposal_fixture.check_all();
    });
}

#[test]
fn create_fill_working_group_leader_opening_proposal_common_checks_succeed() {
    // This uses strum crate for enum iteration
    for group in WorkingGroup::iter() {
        run_create_fill_working_group_leader_opening_proposal_common_checks_succeed(group);
    }
}

fn run_create_fill_working_group_leader_opening_proposal_common_checks_succeed(
    working_group: WorkingGroup,
) {
    initial_test_ext().execute_with(|| {
        let (opening_id, application_id) = setup_lead_opening_and_application(working_group);

        let general_proposal_parameters_no_staking = GeneralProposalParameters::<Test> {
            member_id: 1,
            title: b"title".to_vec(),
            description: b"body".to_vec(),
            staking_account_id: None,
            exact_execution_block: None,
        };

        let general_proposal_parameters_incorrect_staking = GeneralProposalParameters::<Test> {
            member_id: 1,
            title: b"title".to_vec(),
            description: b"body".to_vec(),
            staking_account_id: Some(STAKING_ACCOUNT_ID_NOT_BOUND_TO_MEMBER),
            exact_execution_block: None,
        };

        let general_proposal_parameters = GeneralProposalParameters::<Test> {
            member_id: 1,
            title: b"title".to_vec(),
            description: b"body".to_vec(),
            staking_account_id: Some(1),
            exact_execution_block: None,
        };

        let fill_opening_parameters = FillOpeningParameters {
            opening_id,
            application_id,
            working_group,
        };

        let proposal_details =
            ProposalDetails::FillWorkingGroupLeadOpening(fill_opening_parameters);

        let proposal_fixture = ProposalTestFixture {
            general_proposal_parameters: general_proposal_parameters.clone(),
            proposal_details: proposal_details.clone(),
            insufficient_rights_call: || {
                ProposalsCodex::create_proposal(
                    RawOrigin::None.into(),
                    general_proposal_parameters_no_staking.clone(),
                    proposal_details.clone(),
                )
            },
            invalid_stake_account_call: || {
                ProposalsCodex::create_proposal(
                    RawOrigin::Signed(1).into(),
                    general_proposal_parameters_incorrect_staking.clone(),
                    proposal_details.clone(),
                )
            },
            empty_stake_call: || {
                ProposalsCodex::create_proposal(
                    RawOrigin::Signed(1).into(),
                    general_proposal_parameters_no_staking.clone(),
                    proposal_details.clone(),
                )
            },
            successful_call: || {
                ProposalsCodex::create_proposal(
                    RawOrigin::Signed(1).into(),
                    general_proposal_parameters.clone(),
                    proposal_details.clone(),
                )
            },
            proposal_parameters:
                <Test as crate::Config>::FillWorkingGroupLeadOpeningProposalParameters::get(),
        };
        proposal_fixture.check_all();
    });
}

#[test]
fn create_fill_working_group_leader_opening_proposal_with_invalid_opening_id_fails() {
    // This uses strum crate for enum iteration
    for group in WorkingGroup::iter() {
        run_create_fill_working_group_leader_opening_proposal_with_invalid_opening_id_fails(group);
    }
}

fn run_create_fill_working_group_leader_opening_proposal_with_invalid_opening_id_fails(
    working_group: WorkingGroup,
) {
    initial_test_ext().execute_with(|| {
        increase_total_balance_issuance_using_account_id(1, 500000);

        let general_proposal_parameters = GeneralProposalParameters::<Test> {
            member_id: 1,
            title: b"title".to_vec(),
            description: b"body".to_vec(),
            staking_account_id: Some(1),
            exact_execution_block: None,
        };

        setup_council(2);

        assert_eq!(
            ProposalsCodex::create_proposal(
                RawOrigin::Signed(1).into(),
                general_proposal_parameters,
                ProposalDetails::FillWorkingGroupLeadOpening(FillOpeningParameters {
                    opening_id: 1,
                    application_id: 1,
                    working_group,
                })
            ),
            Err(Error::<Test>::InvalidLeadOpeningId.into())
        );
    });
}

#[test]
fn create_fill_working_group_leader_opening_proposal_with_invalid_application_id_fails() {
    // This uses strum crate for enum iteration
    for group in WorkingGroup::iter() {
        run_create_fill_working_group_leader_opening_proposal_with_invalid_application_id_fails(
            group,
        );
    }
}

fn run_create_fill_working_group_leader_opening_proposal_with_invalid_application_id_fails(
    working_group: WorkingGroup,
) {
    initial_test_ext().execute_with(|| {
        let (opening_id, application_id) = setup_lead_opening_and_application(working_group);

        increase_total_balance_issuance_using_account_id(1, 500000);

        let general_proposal_parameters = GeneralProposalParameters::<Test> {
            member_id: 1,
            title: b"title".to_vec(),
            description: b"body".to_vec(),
            staking_account_id: Some(1),
            exact_execution_block: None,
        };

        setup_council(2);

        assert_eq!(
            ProposalsCodex::create_proposal(
                RawOrigin::Signed(1).into(),
                general_proposal_parameters,
                ProposalDetails::FillWorkingGroupLeadOpening(FillOpeningParameters {
                    opening_id,
                    application_id: application_id + 1,
                    working_group,
                })
            ),
            Err(Error::<Test>::InvalidLeadApplicationId.into())
        );
    });
}

#[test]
fn create_set_working_group_mint_capacity_proposal_common_checks_succeed() {
    // This uses strum crate for enum iteration
    for group in WorkingGroup::iter() {
        run_create_update_working_group_budget_proposal_common_checks_succeed(group);
    }
}

fn run_create_update_working_group_budget_proposal_common_checks_succeed(
    working_group: WorkingGroup,
) {
    initial_test_ext().execute_with(|| {
        increase_total_balance_issuance(500000);

        let general_proposal_parameters_no_staking = GeneralProposalParameters::<Test> {
            member_id: 1,
            title: b"title".to_vec(),
            description: b"body".to_vec(),
            staking_account_id: None,
            exact_execution_block: None,
        };

        let general_proposal_parameters_incorrect_staking = GeneralProposalParameters::<Test> {
            member_id: 1,
            title: b"title".to_vec(),
            description: b"body".to_vec(),
            staking_account_id: Some(STAKING_ACCOUNT_ID_NOT_BOUND_TO_MEMBER),
            exact_execution_block: None,
        };

        let general_proposal_parameters = GeneralProposalParameters::<Test> {
            member_id: 1,
            title: b"title".to_vec(),
            description: b"body".to_vec(),
            staking_account_id: Some(1),
            exact_execution_block: None,
        };

        let proposal_details =
            ProposalDetails::UpdateWorkingGroupBudget(0, working_group, BalanceKind::Positive);

        let proposal_fixture = ProposalTestFixture {
            general_proposal_parameters: general_proposal_parameters.clone(),
            proposal_details: proposal_details.clone(),
            insufficient_rights_call: || {
                ProposalsCodex::create_proposal(
                    RawOrigin::None.into(),
                    general_proposal_parameters_no_staking.clone(),
                    proposal_details.clone(),
                )
            },
            invalid_stake_account_call: || {
                ProposalsCodex::create_proposal(
                    RawOrigin::Signed(1).into(),
                    general_proposal_parameters_incorrect_staking.clone(),
                    proposal_details.clone(),
                )
            },
            empty_stake_call: || {
                ProposalsCodex::create_proposal(
                    RawOrigin::Signed(1).into(),
                    general_proposal_parameters_no_staking.clone(),
                    proposal_details.clone(),
                )
            },
            successful_call: || {
                ProposalsCodex::create_proposal(
                    RawOrigin::Signed(1).into(),
                    general_proposal_parameters.clone(),
                    proposal_details.clone(),
                )
            },
            proposal_parameters:
                <Test as crate::Config>::UpdateWorkingGroupBudgetProposalParameters::get(),
        };
        proposal_fixture.check_all();
    });
}

#[test]
fn create_decrease_working_group_leader_stake_proposal_common_checks_succeed() {
    // This uses strum crate for enum iteration
    for group in WorkingGroup::iter() {
        run_create_decrease_working_group_leader_stake_proposal_common_checks_succeed(group);
    }
}

fn run_create_decrease_working_group_leader_stake_proposal_common_checks_succeed(
    working_group: WorkingGroup,
) {
    initial_test_ext().execute_with(|| {
        let lead_id = setup_lead(working_group);
        increase_total_balance_issuance(500000);

        let general_proposal_parameters_no_staking = GeneralProposalParameters::<Test> {
            member_id: 1,
            title: b"title".to_vec(),
            description: b"body".to_vec(),
            staking_account_id: None,
            exact_execution_block: None,
        };

        let general_proposal_parameters_incorrect_staking = GeneralProposalParameters::<Test> {
            member_id: 1,
            title: b"title".to_vec(),
            description: b"body".to_vec(),
            staking_account_id: Some(STAKING_ACCOUNT_ID_NOT_BOUND_TO_MEMBER),
            exact_execution_block: None,
        };

        let general_proposal_parameters = GeneralProposalParameters::<Test> {
            member_id: 1,
            title: b"title".to_vec(),
            description: b"body".to_vec(),
            staking_account_id: Some(1),
            exact_execution_block: None,
        };

        let proposal_details =
            ProposalDetails::DecreaseWorkingGroupLeadStake(lead_id, 10, working_group);

        let proposal_fixture = ProposalTestFixture {
            general_proposal_parameters: general_proposal_parameters.clone(),
            proposal_details: proposal_details.clone(),
            insufficient_rights_call: || {
                ProposalsCodex::create_proposal(
                    RawOrigin::None.into(),
                    general_proposal_parameters_no_staking.clone(),
                    proposal_details.clone(),
                )
            },
            invalid_stake_account_call: || {
                ProposalsCodex::create_proposal(
                    RawOrigin::Signed(1).into(),
                    general_proposal_parameters_incorrect_staking.clone(),
                    proposal_details.clone(),
                )
            },
            empty_stake_call: || {
                ProposalsCodex::create_proposal(
                    RawOrigin::Signed(1).into(),
                    general_proposal_parameters_no_staking.clone(),
                    proposal_details.clone(),
                )
            },
            successful_call: || {
                ProposalsCodex::create_proposal(
                    RawOrigin::Signed(1).into(),
                    general_proposal_parameters.clone(),
                    proposal_details.clone(),
                )
            },
            proposal_parameters:
                <Test as crate::Config>::DecreaseWorkingGroupLeadStakeProposalParameters::get(),
        };
        proposal_fixture.check_all();
    });
}

#[test]
fn create_slash_working_group_leader_stake_proposal_common_checks_succeed() {
    // This uses strum crate for enum iteration
    for group in WorkingGroup::iter() {
        run_create_slash_working_group_leader_stake_proposal_common_checks_succeed(group);
    }
}

fn run_create_slash_working_group_leader_stake_proposal_common_checks_succeed(
    working_group: WorkingGroup,
) {
    initial_test_ext().execute_with(|| {
        let lead_id = setup_lead(working_group);

        increase_total_balance_issuance(500000);

        let general_proposal_parameters_no_staking = GeneralProposalParameters::<Test> {
            member_id: 1,
            title: b"title".to_vec(),
            description: b"body".to_vec(),
            staking_account_id: None,
            exact_execution_block: None,
        };

        let general_proposal_parameters = GeneralProposalParameters::<Test> {
            member_id: 1,
            title: b"title".to_vec(),
            description: b"body".to_vec(),
            staking_account_id: Some(1),
            exact_execution_block: None,
        };

        let general_proposal_parameters_incorrect_staking = GeneralProposalParameters::<Test> {
            member_id: 1,
            title: b"title".to_vec(),
            description: b"body".to_vec(),
            staking_account_id: Some(STAKING_ACCOUNT_ID_NOT_BOUND_TO_MEMBER),
            exact_execution_block: None,
        };

        let proposal_details = ProposalDetails::SlashWorkingGroupLead(lead_id, 10, working_group);

        let proposal_fixture = ProposalTestFixture {
            general_proposal_parameters: general_proposal_parameters.clone(),
            proposal_details: proposal_details.clone(),
            insufficient_rights_call: || {
                ProposalsCodex::create_proposal(
                    RawOrigin::None.into(),
                    general_proposal_parameters_no_staking.clone(),
                    proposal_details.clone(),
                )
            },
            invalid_stake_account_call: || {
                ProposalsCodex::create_proposal(
                    RawOrigin::Signed(1).into(),
                    general_proposal_parameters_incorrect_staking.clone(),
                    proposal_details.clone(),
                )
            },
            empty_stake_call: || {
                ProposalsCodex::create_proposal(
                    RawOrigin::Signed(1).into(),
                    general_proposal_parameters_no_staking.clone(),
                    proposal_details.clone(),
                )
            },
            successful_call: || {
                ProposalsCodex::create_proposal(
                    RawOrigin::Signed(1).into(),
                    general_proposal_parameters.clone(),
                    proposal_details.clone(),
                )
            },
            proposal_parameters:
                <Test as crate::Config>::SlashWorkingGroupLeadProposalParameters::get(),
        };
        proposal_fixture.check_all();
    });
}

#[test]
fn create_slash_working_group_leader_stake_proposal_with_invalid_worker_id_fails() {
    // This uses strum crate for enum iteration
    for group in WorkingGroup::iter() {
        run_create_slash_working_group_leader_stake_proposal_with_invalid_worker_id_fails(group);
    }
}

fn run_create_slash_working_group_leader_stake_proposal_with_invalid_worker_id_fails(
    working_group: WorkingGroup,
) {
    initial_test_ext().execute_with(|| {
        increase_total_balance_issuance_using_account_id(1, 500000);

        let general_proposal_parameters = GeneralProposalParameters::<Test> {
            member_id: 1,
            title: b"title".to_vec(),
            description: b"body".to_vec(),
            staking_account_id: Some(1),
            exact_execution_block: None,
        };

        setup_council(2);

        assert_eq!(
            ProposalsCodex::create_proposal(
                RawOrigin::Signed(1).into(),
                general_proposal_parameters,
                ProposalDetails::SlashWorkingGroupLead(1, 10, working_group)
            ),
            Err(Error::<Test>::InvalidLeadWorkerId.into())
        );
    });
}

pub fn run_to_block(n: u64) {
    while System::block_number() < n {
        System::on_finalize(System::block_number());
        Module::<Test>::on_finalize(System::block_number());
        council::Module::<Test>::on_finalize(System::block_number());
        referendum::Module::<Test, ReferendumInstance>::on_finalize(System::block_number());
        System::set_block_number(System::block_number() + 1);
        System::on_initialize(System::block_number());
        council::Module::<Test>::on_initialize(System::block_number());
        referendum::Module::<Test, ReferendumInstance>::on_initialize(System::block_number());
    }
}

fn setup_council(start_id: u64) {
    let council_size = <Test as council::Config>::CouncilSize::get();
    let candidates_number =
        council_size + <Test as council::Config>::MinNumberOfExtraCandidates::get();
    let candidates: Vec<_> = (start_id..start_id + candidates_number).collect();
    let council: Vec<_> = (start_id..start_id + council_size).collect();
    let voters: Vec<_> =
        (candidates.last().unwrap() + 1..candidates.last().unwrap() + 1 + council_size).collect();
    for id in candidates {
        increase_total_balance_issuance_using_account_id(id, BalanceOf::<Test>::max_value());
        council::Module::<Test>::announce_candidacy(
            RawOrigin::Signed(id).into(),
            id,
            id,
            id,
            BalanceOf::<Test>::max_value(),
        )
        .unwrap();
    }

    let current_block = System::block_number();
    run_to_block(current_block + <Test as council::Config>::AnnouncingPeriodDuration::get());

    for (i, voter_id) in voters.iter().enumerate() {
        assert_eq!(Balances::free_balance(*voter_id), 0);
        increase_total_balance_issuance_using_account_id(*voter_id, BalanceOf::<Test>::max_value());
        assert_eq!(
            Balances::free_balance(*voter_id),
            BalanceOf::<Test>::max_value()
        );
        let commitment = referendum::Module::<Test, ReferendumInstance>::calculate_commitment(
            voter_id,
            &[0u8],
            &1,
            &council[i],
        );

        referendum::Module::<Test, ReferendumInstance>::vote(
            RawOrigin::Signed(*voter_id).into(),
            commitment,
            BalanceOf::<Test>::max_value(),
        )
        .unwrap();
    }

    let current_block = System::block_number();
    run_to_block(
        current_block + <Test as referendum::Config<ReferendumInstance>>::VoteStageDuration::get(),
    );

    for (i, voter_id) in voters.iter().enumerate() {
        referendum::Module::<Test, ReferendumInstance>::reveal_vote(
            RawOrigin::Signed(*voter_id).into(),
            vec![0u8],
            council[i],
        )
        .unwrap();
    }

    let current_block = System::block_number();
    run_to_block(
        current_block
            + <Test as referendum::Config<ReferendumInstance>>::RevealStageDuration::get(),
    );

    let council_members = council::Module::<Test>::council_members();
    assert_eq!(
        council_members
            .iter()
            .map(|councilor| *councilor.member_id())
            .collect::<Vec<_>>(),
        council,
    );
}

#[test]
fn decrease_stake_with_zero_staking_balance_fails() {
    // This uses strum crate for enum iteration
    for group in WorkingGroup::iter() {
        run_decrease_stake_with_zero_staking_balance_fails(group);
    }
}

fn run_decrease_stake_with_zero_staking_balance_fails(working_group: WorkingGroup) {
    initial_test_ext().execute_with(|| {
        let lead_id = setup_lead(working_group);

        increase_total_balance_issuance_using_account_id(1, 500000);

        let general_proposal_parameters = GeneralProposalParameters::<Test> {
            member_id: 1,
            title: b"title".to_vec(),
            description: b"body".to_vec(),
            staking_account_id: Some(1),
            exact_execution_block: None,
        };

        setup_council(2);

        assert_eq!(
            ProposalsCodex::create_proposal(
                RawOrigin::Signed(1).into(),
                general_proposal_parameters,
                ProposalDetails::DecreaseWorkingGroupLeadStake(lead_id, 0, working_group,)
            ),
            Err(Error::<Test>::DecreasingStakeIsZero.into())
        );
    });
}

#[test]
fn create_decrease_stake_proposal_with_invalid_worker_id_fails() {
    // This uses strum crate for enum iteration
    for group in WorkingGroup::iter() {
        run_create_decrease_stake_proposal_with_invalid_worker_id_fails(group);
    }
}

fn run_create_decrease_stake_proposal_with_invalid_worker_id_fails(working_group: WorkingGroup) {
    initial_test_ext().execute_with(|| {
        increase_total_balance_issuance_using_account_id(1, 500000);

        let general_proposal_parameters = GeneralProposalParameters::<Test> {
            member_id: 1,
            title: b"title".to_vec(),
            description: b"body".to_vec(),
            staking_account_id: Some(1),
            exact_execution_block: None,
        };

        setup_council(2);

        assert_eq!(
            ProposalsCodex::create_proposal(
                RawOrigin::Signed(1).into(),
                general_proposal_parameters,
                ProposalDetails::DecreaseWorkingGroupLeadStake(1, 0, working_group,)
            ),
            Err(Error::<Test>::InvalidLeadWorkerId.into())
        );
    });
}

#[test]
fn create_set_working_group_leader_reward_proposal_common_checks_succeed() {
    // This uses strum crate for enum iteration
    for group in WorkingGroup::iter() {
        run_create_set_working_group_leader_reward_proposal_common_checks_succeed(group);
    }
}

fn run_create_set_working_group_leader_reward_proposal_common_checks_succeed(
    working_group: WorkingGroup,
) {
    initial_test_ext().execute_with(|| {
        let lead_id = setup_lead(working_group);

        let general_proposal_parameters_no_staking = GeneralProposalParameters::<Test> {
            member_id: 1,
            title: b"title".to_vec(),
            description: b"body".to_vec(),
            staking_account_id: None,
            exact_execution_block: None,
        };

        let general_proposal_parameters_incorrect_staking = GeneralProposalParameters::<Test> {
            member_id: 1,
            title: b"title".to_vec(),
            description: b"body".to_vec(),
            staking_account_id: Some(STAKING_ACCOUNT_ID_NOT_BOUND_TO_MEMBER),
            exact_execution_block: None,
        };

        let general_proposal_parameters = GeneralProposalParameters::<Test> {
            member_id: 1,
            title: b"title".to_vec(),
            description: b"body".to_vec(),
            staking_account_id: Some(1),
            exact_execution_block: None,
        };

        let proposal_details =
            ProposalDetails::SetWorkingGroupLeadReward(lead_id, Some(10), working_group);
        let proposal_fixture = ProposalTestFixture {
            general_proposal_parameters: general_proposal_parameters.clone(),
            proposal_details: proposal_details.clone(),
            insufficient_rights_call: || {
                ProposalsCodex::create_proposal(
                    RawOrigin::None.into(),
                    general_proposal_parameters_no_staking.clone(),
                    proposal_details.clone(),
                )
            },

            invalid_stake_account_call: || {
                ProposalsCodex::create_proposal(
                    RawOrigin::Signed(1).into(),
                    general_proposal_parameters_incorrect_staking.clone(),
                    proposal_details.clone(),
                )
            },
            empty_stake_call: || {
                ProposalsCodex::create_proposal(
                    RawOrigin::Signed(1).into(),
                    general_proposal_parameters_no_staking.clone(),
                    proposal_details.clone(),
                )
            },
            successful_call: || {
                ProposalsCodex::create_proposal(
                    RawOrigin::Signed(1).into(),
                    general_proposal_parameters.clone(),
                    proposal_details.clone(),
                )
            },
            proposal_parameters:
                <Test as crate::Config>::SlashWorkingGroupLeadProposalParameters::get(),
        };
        proposal_fixture.check_all();
    });
}

#[test]
fn create_set_working_group_leader_reward_proposal_with_invalid_worker_id_fails() {
    // This uses strum crate for enum iteration
    for group in WorkingGroup::iter() {
        run_create_set_working_group_leader_reward_proposal_with_invalid_worker_id_fails(group);
    }
}

fn run_create_set_working_group_leader_reward_proposal_with_invalid_worker_id_fails(
    working_group: WorkingGroup,
) {
    initial_test_ext().execute_with(|| {
        increase_total_balance_issuance_using_account_id(1, 500000);

        let general_proposal_parameters = GeneralProposalParameters::<Test> {
            member_id: 1,
            title: b"title".to_vec(),
            description: b"body".to_vec(),
            staking_account_id: Some(1),
            exact_execution_block: None,
        };

        setup_council(2);

        assert_eq!(
            ProposalsCodex::create_proposal(
                RawOrigin::Signed(1).into(),
                general_proposal_parameters,
                ProposalDetails::SetWorkingGroupLeadReward(1, Some(10), working_group,)
            ),
            Err(Error::<Test>::InvalidLeadWorkerId.into())
        );
    });
}

#[test]
fn create_terminate_working_group_leader_role_proposal_common_checks_succeed() {
    // This uses strum crate for enum iteration
    for group in WorkingGroup::iter() {
        run_create_terminate_working_group_leader_role_proposal_common_checks_succeed(group);
    }
}

fn run_create_terminate_working_group_leader_role_proposal_common_checks_succeed(
    group: WorkingGroup,
) {
    initial_test_ext().execute_with(|| {
        let lead_id = setup_lead(group);

        increase_total_balance_issuance(500000);

        let general_proposal_parameters_no_staking = GeneralProposalParameters::<Test> {
            member_id: 1,
            title: b"title".to_vec(),
            description: b"body".to_vec(),
            staking_account_id: None,
            exact_execution_block: None,
        };

        let general_proposal_parameters_incorrect_staking = GeneralProposalParameters::<Test> {
            member_id: 1,
            title: b"title".to_vec(),
            description: b"body".to_vec(),
            staking_account_id: Some(STAKING_ACCOUNT_ID_NOT_BOUND_TO_MEMBER),
            exact_execution_block: None,
        };

        let general_proposal_parameters = GeneralProposalParameters::<Test> {
            member_id: 1,
            title: b"title".to_vec(),
            description: b"body".to_vec(),
            staking_account_id: Some(1),
            exact_execution_block: None,
        };

        let terminate_role_parameters = TerminateRoleParameters {
            worker_id: lead_id,
            slashing_amount: None,
            group,
        };

        let proposal_details =
            ProposalDetails::TerminateWorkingGroupLead(terminate_role_parameters);

        let proposal_fixture = ProposalTestFixture {
            general_proposal_parameters: general_proposal_parameters.clone(),
            proposal_details: proposal_details.clone(),
            insufficient_rights_call: || {
                ProposalsCodex::create_proposal(
                    RawOrigin::None.into(),
                    general_proposal_parameters_no_staking.clone(),
                    proposal_details.clone(),
                )
            },
            invalid_stake_account_call: || {
                ProposalsCodex::create_proposal(
                    RawOrigin::Signed(1).into(),
                    general_proposal_parameters_incorrect_staking.clone(),
                    proposal_details.clone(),
                )
            },
            empty_stake_call: || {
                ProposalsCodex::create_proposal(
                    RawOrigin::Signed(1).into(),
                    general_proposal_parameters_no_staking.clone(),
                    proposal_details.clone(),
                )
            },
            successful_call: || {
                ProposalsCodex::create_proposal(
                    RawOrigin::Signed(1).into(),
                    general_proposal_parameters.clone(),
                    proposal_details.clone(),
                )
            },
            proposal_parameters:
                <Test as crate::Config>::TerminateWorkingGroupLeadProposalParameters::get(),
        };
        proposal_fixture.check_all();
    });
}

#[test]
fn create_terminate_working_group_leader_role_proposal_with_invalid_worker_id_fails() {
    // This uses strum crate for enum iteration
    for group in WorkingGroup::iter() {
        run_create_terminate_working_group_leader_role_proposal_with_invalid_worker_id_fails(group);
    }
}

fn run_create_terminate_working_group_leader_role_proposal_with_invalid_worker_id_fails(
    group: WorkingGroup,
) {
    initial_test_ext().execute_with(|| {
        increase_total_balance_issuance_using_account_id(1, 500000);

        let general_proposal_parameters = GeneralProposalParameters::<Test> {
            member_id: 1,
            title: b"title".to_vec(),
            description: b"body".to_vec(),
            staking_account_id: Some(1),
            exact_execution_block: None,
        };

        setup_council(2);

        assert_eq!(
            ProposalsCodex::create_proposal(
                RawOrigin::Signed(1).into(),
                general_proposal_parameters,
                ProposalDetails::TerminateWorkingGroupLead(TerminateRoleParameters {
                    worker_id: 1,
                    slashing_amount: None,
                    group,
                })
            ),
            Err(Error::<Test>::InvalidLeadWorkerId.into())
        );
    });
}

#[test]
fn create_amend_constitution_proposal_common_checks_succeed() {
    initial_test_ext().execute_with(|| {
        let general_proposal_parameters_no_staking = GeneralProposalParameters::<Test> {
            member_id: 1,
            title: b"title".to_vec(),
            description: b"body".to_vec(),
            staking_account_id: None,
            exact_execution_block: None,
        };

        let general_proposal_parameters = GeneralProposalParameters::<Test> {
            member_id: 1,
            title: b"title".to_vec(),
            description: b"body".to_vec(),
            staking_account_id: Some(1),
            exact_execution_block: None,
        };

        let general_proposal_parameters_incorrect_staking = GeneralProposalParameters::<Test> {
            member_id: 1,
            title: b"title".to_vec(),
            description: b"body".to_vec(),
            staking_account_id: Some(STAKING_ACCOUNT_ID_NOT_BOUND_TO_MEMBER),
            exact_execution_block: None,
        };

        let proposal_details = ProposalDetails::AmendConstitution(b"constitution text".to_vec());

        let proposal_fixture = ProposalTestFixture {
            general_proposal_parameters: general_proposal_parameters.clone(),
            proposal_details: proposal_details.clone(),
            insufficient_rights_call: || {
                ProposalsCodex::create_proposal(
                    RawOrigin::None.into(),
                    general_proposal_parameters_no_staking.clone(),
                    proposal_details.clone(),
                )
            },
            invalid_stake_account_call: || {
                ProposalsCodex::create_proposal(
                    RawOrigin::Signed(1).into(),
                    general_proposal_parameters_incorrect_staking.clone(),
                    proposal_details.clone(),
                )
            },
            empty_stake_call: || {
                ProposalsCodex::create_proposal(
                    RawOrigin::Signed(1).into(),
                    general_proposal_parameters_no_staking.clone(),
                    proposal_details.clone(),
                )
            },
            successful_call: || {
                ProposalsCodex::create_proposal(
                    RawOrigin::Signed(1).into(),
                    general_proposal_parameters.clone(),
                    proposal_details.clone(),
                )
            },
            proposal_parameters: <Test as crate::Config>::AmendConstitutionProposalParameters::get(
            ),
        };
        proposal_fixture.check_all();
    });
}

#[test]
fn create_set_council_budget_increment_common_checks_succeed() {
    initial_test_ext().execute_with(|| {
        let general_proposal_parameters_no_staking = GeneralProposalParameters::<Test> {
            member_id: 1,
            title: b"title".to_vec(),
            description: b"body".to_vec(),
            staking_account_id: None,
            exact_execution_block: None,
        };

        let general_proposal_parameters = GeneralProposalParameters::<Test> {
            member_id: 1,
            title: b"title".to_vec(),
            description: b"body".to_vec(),
            staking_account_id: Some(1),
            exact_execution_block: None,
        };

        let general_proposal_parameters_incorrect_staking = GeneralProposalParameters::<Test> {
            member_id: 1,
            title: b"title".to_vec(),
            description: b"body".to_vec(),
            staking_account_id: Some(STAKING_ACCOUNT_ID_NOT_BOUND_TO_MEMBER),
            exact_execution_block: None,
        };

        let proposal_details = ProposalDetails::SetCouncilBudgetIncrement(100);

        let proposal_fixture = ProposalTestFixture {
            general_proposal_parameters: general_proposal_parameters.clone(),
            proposal_details: proposal_details.clone(),
            insufficient_rights_call: || {
                ProposalsCodex::create_proposal(
                    RawOrigin::None.into(),
                    general_proposal_parameters_no_staking.clone(),
                    proposal_details.clone(),
                )
            },
            invalid_stake_account_call: || {
                ProposalsCodex::create_proposal(
                    RawOrigin::Signed(1).into(),
                    general_proposal_parameters_incorrect_staking.clone(),
                    proposal_details.clone(),
                )
            },
            empty_stake_call: || {
                ProposalsCodex::create_proposal(
                    RawOrigin::Signed(1).into(),
                    general_proposal_parameters_no_staking.clone(),
                    proposal_details.clone(),
                )
            },
            successful_call: || {
                ProposalsCodex::create_proposal(
                    RawOrigin::Signed(1).into(),
                    general_proposal_parameters.clone(),
                    proposal_details.clone(),
                )
            },
            proposal_parameters:
                <Test as crate::Config>::SetCouncilBudgetIncrementProposalParameters::get(),
        };
        proposal_fixture.check_all();
    });
}

#[test]
fn create_cancel_working_group_leader_opening_proposal_common_checks_succeed() {
    // This uses strum crate for enum iteration
    for group in WorkingGroup::iter() {
        run_create_cancel_working_group_leader_opening_proposal_common_checks_succeed(group);
    }
}

fn run_create_cancel_working_group_leader_opening_proposal_common_checks_succeed(
    working_group: WorkingGroup,
) {
    initial_test_ext().execute_with(|| {
        let (opening_id, _) = setup_lead_opening_and_application(working_group);

        let general_proposal_parameters_no_staking = GeneralProposalParameters::<Test> {
            member_id: 1,
            title: b"title".to_vec(),
            description: b"body".to_vec(),
            staking_account_id: None,
            exact_execution_block: None,
        };

        let general_proposal_parameters = GeneralProposalParameters::<Test> {
            member_id: 1,
            title: b"title".to_vec(),
            description: b"body".to_vec(),
            staking_account_id: Some(1),
            exact_execution_block: None,
        };

        let general_proposal_parameters_incorrect_staking = GeneralProposalParameters::<Test> {
            member_id: 1,
            title: b"title".to_vec(),
            description: b"body".to_vec(),
            staking_account_id: Some(STAKING_ACCOUNT_ID_NOT_BOUND_TO_MEMBER),
            exact_execution_block: None,
        };

        let proposal_details =
            ProposalDetails::CancelWorkingGroupLeadOpening(opening_id, working_group);

        let proposal_fixture = ProposalTestFixture {
            general_proposal_parameters: general_proposal_parameters.clone(),
            proposal_details: proposal_details.clone(),
            insufficient_rights_call: || {
                ProposalsCodex::create_proposal(
                    RawOrigin::None.into(),
                    general_proposal_parameters_no_staking.clone(),
                    proposal_details.clone(),
                )
            },
            invalid_stake_account_call: || {
                ProposalsCodex::create_proposal(
                    RawOrigin::Signed(1).into(),
                    general_proposal_parameters_incorrect_staking.clone(),
                    proposal_details.clone(),
                )
            },
            empty_stake_call: || {
                ProposalsCodex::create_proposal(
                    RawOrigin::Signed(1).into(),
                    general_proposal_parameters_no_staking.clone(),
                    proposal_details.clone(),
                )
            },
            successful_call: || {
                ProposalsCodex::create_proposal(
                    RawOrigin::Signed(1).into(),
                    general_proposal_parameters.clone(),
                    proposal_details.clone(),
                )
            },
            proposal_parameters:
                <Test as crate::Config>::CancelWorkingGroupLeadOpeningProposalParameters::get(),
        };
        proposal_fixture.check_all();
    });
}

#[test]
fn create_cancel_working_group_leader_opening_proposal_with_invalid_opening_id_fails() {
    // This uses strum crate for enum iteration
    for group in WorkingGroup::iter() {
        run_create_cancel_working_group_leader_opening_proposal_with_invalid_opening_id_fails(
            group,
        );
    }
}

fn run_create_cancel_working_group_leader_opening_proposal_with_invalid_opening_id_fails(
    working_group: WorkingGroup,
) {
    initial_test_ext().execute_with(|| {
        increase_total_balance_issuance_using_account_id(1, 500000);

        let general_proposal_parameters = GeneralProposalParameters::<Test> {
            member_id: 1,
            title: b"title".to_vec(),
            description: b"body".to_vec(),
            staking_account_id: Some(1),
            exact_execution_block: None,
        };

        setup_council(2);

        assert_eq!(
            ProposalsCodex::create_proposal(
                RawOrigin::Signed(1).into(),
                general_proposal_parameters,
                ProposalDetails::CancelWorkingGroupLeadOpening(1, working_group)
            ),
            Err(Error::<Test>::InvalidLeadOpeningId.into())
        );
    });
}

#[test]
fn create_set_councilor_reward_proposal_common_checks_succeed() {
    initial_test_ext().execute_with(|| {
        let total_balance_issuance = 500000;
        increase_total_balance_issuance(total_balance_issuance);

        let general_proposal_parameters_no_staking = GeneralProposalParameters::<Test> {
            member_id: 1,
            title: b"title".to_vec(),
            description: b"body".to_vec(),
            staking_account_id: None,
            exact_execution_block: None,
        };

        let general_proposal_parameters = GeneralProposalParameters::<Test> {
            member_id: 1,
            title: b"title".to_vec(),
            description: b"body".to_vec(),
            staking_account_id: Some(1),
            exact_execution_block: None,
        };

        let general_proposal_parameters_incorrect_staking = GeneralProposalParameters::<Test> {
            member_id: 1,
            title: b"title".to_vec(),
            description: b"body".to_vec(),
            staking_account_id: Some(STAKING_ACCOUNT_ID_NOT_BOUND_TO_MEMBER),
            exact_execution_block: None,
        };

        let proposal_details = ProposalDetails::SetCouncilorReward(100);

        let proposal_fixture = ProposalTestFixture {
            general_proposal_parameters: general_proposal_parameters.clone(),
            proposal_details: proposal_details.clone(),
            insufficient_rights_call: || {
                ProposalsCodex::create_proposal(
                    RawOrigin::None.into(),
                    general_proposal_parameters_no_staking.clone(),
                    proposal_details.clone(),
                )
            },
            invalid_stake_account_call: || {
                ProposalsCodex::create_proposal(
                    RawOrigin::Signed(1).into(),
                    general_proposal_parameters_incorrect_staking.clone(),
                    proposal_details.clone(),
                )
            },
            empty_stake_call: || {
                ProposalsCodex::create_proposal(
                    RawOrigin::Signed(1).into(),
                    general_proposal_parameters_no_staking.clone(),
                    proposal_details.clone(),
                )
            },
            successful_call: || {
                ProposalsCodex::create_proposal(
                    RawOrigin::Signed(1).into(),
                    general_proposal_parameters.clone(),
                    proposal_details.clone(),
                )
            },
            proposal_parameters: <Test as crate::Config>::SetCouncilorRewardProposalParameters::get(
            ),
        };
        proposal_fixture.check_all();
    });
}

#[test]
fn create_set_initial_invitation_balance_proposal_common_checks_succeed() {
    initial_test_ext().execute_with(|| {
        let general_proposal_parameters_no_staking = GeneralProposalParameters::<Test> {
            member_id: 1,
            title: b"title".to_vec(),
            description: b"body".to_vec(),
            staking_account_id: None,
            exact_execution_block: None,
        };

        let general_proposal_parameters = GeneralProposalParameters::<Test> {
            member_id: 1,
            title: b"title".to_vec(),
            description: b"body".to_vec(),
            staking_account_id: Some(1),
            exact_execution_block: None,
        };

        let general_proposal_parameters_incorrect_staking = GeneralProposalParameters::<Test> {
            member_id: 1,
            title: b"title".to_vec(),
            description: b"body".to_vec(),
            staking_account_id: Some(STAKING_ACCOUNT_ID_NOT_BOUND_TO_MEMBER),
            exact_execution_block: None,
        };

        let proposal_details = ProposalDetails::SetInitialInvitationBalance(100);

        let proposal_fixture = ProposalTestFixture {
            general_proposal_parameters: general_proposal_parameters.clone(),
            proposal_details: proposal_details.clone(),
            insufficient_rights_call: || {
                ProposalsCodex::create_proposal(
                    RawOrigin::None.into(),
                    general_proposal_parameters_no_staking.clone(),
                    proposal_details.clone(),
                )
            },
            invalid_stake_account_call: || {
                ProposalsCodex::create_proposal(
                    RawOrigin::Signed(1).into(),
                    general_proposal_parameters_incorrect_staking.clone(),
                    proposal_details.clone(),
                )
            },
            empty_stake_call: || {
                ProposalsCodex::create_proposal(
                    RawOrigin::Signed(1).into(),
                    general_proposal_parameters_no_staking.clone(),
                    proposal_details.clone(),
                )
            },
            successful_call: || {
                ProposalsCodex::create_proposal(
                    RawOrigin::Signed(1).into(),
                    general_proposal_parameters.clone(),
                    proposal_details.clone(),
                )
            },
            proposal_parameters:
                <Test as crate::Config>::SetInitialInvitationBalanceProposalParameters::get(),
        };
        proposal_fixture.check_all();
    });
}

#[test]
fn create_set_initial_invitation_count_proposal_common_checks_succeed() {
    initial_test_ext().execute_with(|| {
        let general_proposal_parameters_no_staking = GeneralProposalParameters::<Test> {
            member_id: 1,
            title: b"title".to_vec(),
            description: b"body".to_vec(),
            staking_account_id: None,
            exact_execution_block: None,
        };

        let general_proposal_parameters = GeneralProposalParameters::<Test> {
            member_id: 1,
            title: b"title".to_vec(),
            description: b"body".to_vec(),
            staking_account_id: Some(1),
            exact_execution_block: None,
        };

        let general_proposal_parameters_incorrect_staking = GeneralProposalParameters::<Test> {
            member_id: 1,
            title: b"title".to_vec(),
            description: b"body".to_vec(),
            staking_account_id: Some(STAKING_ACCOUNT_ID_NOT_BOUND_TO_MEMBER),
            exact_execution_block: None,
        };

        let proposal_details = ProposalDetails::SetInitialInvitationCount(100);

        let proposal_fixture = ProposalTestFixture {
            general_proposal_parameters: general_proposal_parameters.clone(),
            proposal_details: proposal_details.clone(),
            insufficient_rights_call: || {
                ProposalsCodex::create_proposal(
                    RawOrigin::None.into(),
                    general_proposal_parameters_no_staking.clone(),
                    proposal_details.clone(),
                )
            },
            invalid_stake_account_call: || {
                ProposalsCodex::create_proposal(
                    RawOrigin::Signed(1).into(),
                    general_proposal_parameters_incorrect_staking.clone(),
                    proposal_details.clone(),
                )
            },
            empty_stake_call: || {
                ProposalsCodex::create_proposal(
                    RawOrigin::Signed(1).into(),
                    general_proposal_parameters_no_staking.clone(),
                    proposal_details.clone(),
                )
            },
            successful_call: || {
                ProposalsCodex::create_proposal(
                    RawOrigin::Signed(1).into(),
                    general_proposal_parameters.clone(),
                    proposal_details.clone(),
                )
            },
            proposal_parameters: <Test as crate::Config>::SetInvitationCountProposalParameters::get(
            ),
        };
        proposal_fixture.check_all();
    });
}

#[test]
fn create_set_membership_lead_invitation_quota_common_checks_succeed() {
    initial_test_ext().execute_with(|| {
        let general_proposal_parameters_no_staking = GeneralProposalParameters::<Test> {
            member_id: 1,
            title: b"title".to_vec(),
            description: b"body".to_vec(),
            staking_account_id: None,
            exact_execution_block: None,
        };

        let general_proposal_parameters = GeneralProposalParameters::<Test> {
            member_id: 1,
            title: b"title".to_vec(),
            description: b"body".to_vec(),
            staking_account_id: Some(1),
            exact_execution_block: None,
        };

        let general_proposal_parameters_incorrect_staking = GeneralProposalParameters::<Test> {
            member_id: 1,
            title: b"title".to_vec(),
            description: b"body".to_vec(),
            staking_account_id: Some(STAKING_ACCOUNT_ID_NOT_BOUND_TO_MEMBER),
            exact_execution_block: None,
        };

        let proposal_details = ProposalDetails::SetMembershipLeadInvitationQuota(100);

        let proposal_fixture = ProposalTestFixture {
            general_proposal_parameters: general_proposal_parameters.clone(),
            proposal_details: proposal_details.clone(),
            insufficient_rights_call: || {
                ProposalsCodex::create_proposal(
                    RawOrigin::None.into(),
                    general_proposal_parameters_no_staking.clone(),
                    proposal_details.clone(),
                )
            },
            invalid_stake_account_call: || {
                ProposalsCodex::create_proposal(
                    RawOrigin::Signed(1).into(),
                    general_proposal_parameters_incorrect_staking.clone(),
                    proposal_details.clone(),
                )
            },
            empty_stake_call: || {
                ProposalsCodex::create_proposal(
                    RawOrigin::Signed(1).into(),
                    general_proposal_parameters_no_staking.clone(),
                    proposal_details.clone(),
                )
            },
            successful_call: || {
                ProposalsCodex::create_proposal(
                    RawOrigin::Signed(1).into(),
                    general_proposal_parameters.clone(),
                    proposal_details.clone(),
                )
            },
            proposal_parameters:
                <Test as crate::Config>::SetMembershipLeadInvitationQuotaProposalParameters::get(),
        };
        proposal_fixture.check_all();
    });
}

#[test]
fn create_set_referral_cut_common_checks_succeed() {
    initial_test_ext().execute_with(|| {
        let general_proposal_parameters_no_staking = GeneralProposalParameters::<Test> {
            member_id: 1,
            title: b"title".to_vec(),
            description: b"body".to_vec(),
            staking_account_id: None,
            exact_execution_block: None,
        };

        let general_proposal_parameters = GeneralProposalParameters::<Test> {
            member_id: 1,
            title: b"title".to_vec(),
            description: b"body".to_vec(),
            staking_account_id: Some(1),
            exact_execution_block: None,
        };

        let general_proposal_parameters_incorrect_staking = GeneralProposalParameters::<Test> {
            member_id: 1,
            title: b"title".to_vec(),
            description: b"body".to_vec(),
            staking_account_id: Some(STAKING_ACCOUNT_ID_NOT_BOUND_TO_MEMBER),
            exact_execution_block: None,
        };

        let proposal_details = ProposalDetails::SetReferralCut(100);

        let proposal_fixture = ProposalTestFixture {
            proposal_details: proposal_details.clone(),
            general_proposal_parameters: general_proposal_parameters.clone(),
            insufficient_rights_call: || {
                ProposalsCodex::create_proposal(
                    RawOrigin::None.into(),
                    general_proposal_parameters_no_staking.clone(),
                    proposal_details.clone(),
                )
            },
            invalid_stake_account_call: || {
                ProposalsCodex::create_proposal(
                    RawOrigin::Signed(1).into(),
                    general_proposal_parameters_incorrect_staking.clone(),
                    proposal_details.clone(),
                )
            },
            empty_stake_call: || {
                ProposalsCodex::create_proposal(
                    RawOrigin::Signed(1).into(),
                    general_proposal_parameters_no_staking.clone(),
                    proposal_details.clone(),
                )
            },
            successful_call: || {
                ProposalsCodex::create_proposal(
                    RawOrigin::Signed(1).into(),
                    general_proposal_parameters.clone(),
                    proposal_details.clone(),
                )
            },
            proposal_parameters: <Test as crate::Config>::SetReferralCutProposalParameters::get(),
        };
        proposal_fixture.check_all();
    });
}

#[test]
fn create_update_global_nft_limit_proposal_common_checks_succeed() {
    initial_test_ext().execute_with(|| {
        let general_proposal_parameters_no_staking = GeneralProposalParameters::<Test> {
            member_id: 1,
            title: b"title".to_vec(),
            description: b"body".to_vec(),
            staking_account_id: None,
            exact_execution_block: None,
        };

        let general_proposal_parameters = GeneralProposalParameters::<Test> {
            member_id: 1,
            title: b"title".to_vec(),
            description: b"body".to_vec(),
            staking_account_id: Some(1),
            exact_execution_block: None,
        };

        let general_proposal_parameters_incorrect_staking = GeneralProposalParameters::<Test> {
            member_id: 1,
            title: b"title".to_vec(),
            description: b"body".to_vec(),
            staking_account_id: Some(STAKING_ACCOUNT_ID_NOT_BOUND_TO_MEMBER),
            exact_execution_block: None,
        };

        let proposal_details = ProposalDetails::UpdateGlobalNftLimit(NftLimitPeriod::Daily, 100);

        let proposal_fixture = ProposalTestFixture {
            general_proposal_parameters: general_proposal_parameters.clone(),
            proposal_details: proposal_details.clone(),
            insufficient_rights_call: || {
                ProposalsCodex::create_proposal(
                    RawOrigin::None.into(),
                    general_proposal_parameters_no_staking.clone(),
                    proposal_details.clone(),
                )
            },
            invalid_stake_account_call: || {
                ProposalsCodex::create_proposal(
                    RawOrigin::Signed(1).into(),
                    general_proposal_parameters_incorrect_staking.clone(),
                    proposal_details.clone(),
                )
            },
            empty_stake_call: || {
                ProposalsCodex::create_proposal(
                    RawOrigin::Signed(1).into(),
                    general_proposal_parameters_no_staking.clone(),
                    proposal_details.clone(),
                )
            },
            successful_call: || {
                ProposalsCodex::create_proposal(
                    RawOrigin::Signed(1).into(),
                    general_proposal_parameters.clone(),
                    proposal_details.clone(),
                )
            },
            proposal_parameters:
                <Test as crate::Config>::UpdateGlobalNftLimitProposalParameters::get(),
        };
        proposal_fixture.check_all();
    });
}

#[test]
fn create_update_channel_payouts_common_checks_succeed() {
    initial_test_ext().execute_with(|| {
        let general_proposal_parameters_no_staking = GeneralProposalParameters::<Test> {
            member_id: 1,
            title: b"title".to_vec(),
            description: b"body".to_vec(),
            staking_account_id: None,
            exact_execution_block: None,
        };

        let general_proposal_parameters = GeneralProposalParameters::<Test> {
            member_id: 1,
            title: b"title".to_vec(),
            description: b"body".to_vec(),
            staking_account_id: Some(1),
            exact_execution_block: None,
        };

        let general_proposal_parameters_incorrect_staking = GeneralProposalParameters::<Test> {
            member_id: 1,
            title: b"title".to_vec(),
            description: b"body".to_vec(),
            staking_account_id: Some(STAKING_ACCOUNT_ID_NOT_BOUND_TO_MEMBER),
            exact_execution_block: None,
        };

        let proposal_details = ProposalDetails::UpdateChannelPayouts(
            content::UpdateChannelPayoutsParameters::<Test> {
                commitment: Some(<Test as frame_system::Config>::Hashing::hash(
                    b"commitment".as_ref(),
                )),
                payload: Some(content::ChannelPayoutsPayloadParametersRecord {
                    uploader_account: <Test as frame_system::Config>::AccountId::default(),
                    object_creation_params: content::DataObjectCreationParameters {
                        size: u64::MAX,
                        ipfs_content_id: Vec::from_iter((0..46).map(|_| u8::MAX)),
                    },
                    expected_data_size_fee: u128::MAX.saturated_into::<BalanceOf<Test>>(),
                    expected_data_object_state_bloat_bond: u128::MAX
                        .saturated_into::<BalanceOf<Test>>(),
                }),
                min_cashout_allowed: Some(u128::MAX.saturated_into::<BalanceOf<Test>>()),
                max_cashout_allowed: Some(u128::MAX.saturated_into::<BalanceOf<Test>>()),
                channel_cashouts_enabled: Some(true),
            },
        );

        let proposal_fixture = ProposalTestFixture {
            proposal_details: proposal_details.clone(),
            general_proposal_parameters: general_proposal_parameters.clone(),
            insufficient_rights_call: || {
                ProposalsCodex::create_proposal(
                    RawOrigin::None.into(),
                    general_proposal_parameters_no_staking.clone(),
                    proposal_details.clone(),
                )
            },
            invalid_stake_account_call: || {
                ProposalsCodex::create_proposal(
                    RawOrigin::Signed(1).into(),
                    general_proposal_parameters_incorrect_staking.clone(),
                    proposal_details.clone(),
                )
            },
            empty_stake_call: || {
                ProposalsCodex::create_proposal(
                    RawOrigin::Signed(1).into(),
                    general_proposal_parameters_no_staking.clone(),
                    proposal_details.clone(),
                )
            },
            successful_call: || {
                ProposalsCodex::create_proposal(
                    RawOrigin::Signed(1).into(),
                    general_proposal_parameters.clone(),
                    proposal_details.clone(),
                )
            },
            proposal_parameters:
                <Test as crate::Config>::UpdateChannelPayoutsProposalParameters::get(),
        };
        proposal_fixture.check_all();
    });
}

#[test]
fn create_update_channel_payouts_proposal_fails_when_min_cashout_exceeds_max_cashout() {
    initial_test_ext().execute_with(|| {
        let general_proposal_parameters = GeneralProposalParameters::<Test> {
            member_id: 1,
            title: b"title".to_vec(),
            description: b"body".to_vec(),
            staking_account_id: Some(1),
            exact_execution_block: None,
        };

        let details = ProposalDetailsOf::<Test>::UpdateChannelPayouts(
            content::UpdateChannelPayoutsParameters::<Test> {
                min_cashout_allowed: Some(2u64),
                max_cashout_allowed: Some(1u64),
                commitment: None,
                payload: None,
                channel_cashouts_enabled: None,
            },
        );

        assert_eq!(
            ProposalsCodex::create_proposal(
                RawOrigin::Signed(1).into(),
                general_proposal_parameters.clone(),
                details,
            ),
            Err(Error::<Test>::InvalidChannelPayoutsProposalMinCashoutExceedsMaxCashout.into())
        );
    });
}
