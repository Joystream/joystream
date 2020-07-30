#![cfg(test)]

use primitives::H256;
use runtime_primitives::{
    testing::Header,
    traits::{BlakeTwo256, IdentityLookup},
    Perbill,
};
use srml_support::{impl_outer_origin, parameter_types};

use crate::hiring::ApplicationDeactivationCause;
use crate::{Module, Trait};
use balances;
use stake;

use std::cell::Cell;
use std::cell::RefCell;
use std::panic;
use std::rc::Rc;

impl_outer_origin! {
    pub enum Origin for Test {}
}

parameter_types! {
    pub const BlockHashCount: u64 = 250;
    pub const MaximumBlockWeight: u32 = 1024;
    pub const MaximumBlockLength: u32 = 2 * 1024;
    pub const AvailableBlockRatio: Perbill = Perbill::one();
    pub const MinimumPeriod: u64 = 5;
}

// Workaround for https://github.com/rust-lang/rust/issues/26925 . Remove when sorted.
#[derive(Clone, PartialEq, Eq, Debug)]
pub struct Test;

impl system::Trait for Test {
    type Origin = Origin;
    type Index = u64;
    type BlockNumber = u64;
    type Call = ();
    type Hash = H256;
    type Hashing = BlakeTwo256;
    type AccountId = u64;
    type Lookup = IdentityLookup<Self::AccountId>;
    type Header = Header;
    type Event = ();
    type BlockHashCount = BlockHashCount;
    type MaximumBlockWeight = MaximumBlockWeight;
    type MaximumBlockLength = MaximumBlockLength;
    type AvailableBlockRatio = AvailableBlockRatio;
    type Version = ();
}

parameter_types! {
    pub const ExistentialDeposit: u32 = 100;
    pub const TransferFee: u32 = 0;
    pub const CreationFee: u32 = 0;
    pub const TransactionBaseFee: u32 = 1;
    pub const TransactionByteFee: u32 = 0;
    pub const StakePoolId: [u8; 8] = *b"joystake";
}

impl balances::Trait for Test {
    /// The type for recording an account's balance.
    type Balance = u64;
    /// What to do if an account's free balance gets zeroed.
    type OnFreeBalanceZero = ();
    /// What to do if a new account is created.
    type OnNewAccount = ();
    /// The ubiquitous event type.
    type Event = ();

    type DustRemoval = ();
    type TransferPayment = ();
    type ExistentialDeposit = ExistentialDeposit;
    type TransferFee = TransferFee;
    type CreationFee = CreationFee;
}

impl Trait for Test {
    type OpeningId = u64;

    type ApplicationId = u64;

    type ApplicationDeactivatedHandler = TestApplicationDeactivatedHandler;

    type StakeHandlerProvider = TestStakeHandlerProvider;
}

impl stake::Trait for Test {
    type Currency = Balances;
    type StakePoolId = StakePoolId;
    type StakingEventsHandler = ();
    type StakeId = u64;
    type SlashId = u64;
}

pub type Balances = balances::Module<Test>;
pub type System = system::Module<Test>;
pub type Hiring = Module<Test>;

// Intercepts panic method
// Returns: whether panic occurred
fn panics<F: std::panic::RefUnwindSafe + Fn()>(could_panic_func: F) -> bool {
    {
        let default_hook = panic::take_hook();
        panic::set_hook(Box::new(|info| {
            println!("{}", info);
        }));

        // intercept panic
        let result = panic::catch_unwind(|| could_panic_func());

        //restore default behaviour
        panic::set_hook(default_hook);

        result.is_err()
    }
}

pub struct TestStakeHandlerProvider;
impl crate::StakeHandlerProvider<Test> for TestStakeHandlerProvider {
    /// Returns StakeHandler. Mock entry point for stake module.
    fn staking() -> Rc<RefCell<dyn crate::StakeHandler<Test>>> {
        THREAD_LOCAL_STAKE_HANDLER.with(|f| f.borrow().clone())
    }
}

// 1. RefCell - thread_local! mutation pattern
// 2. Rc - ability to have multiple references
// 3. Refcell - interior mutability to provide extra-mock capabilities (like mockall checkpoint).
thread_local! {
    pub static THREAD_LOCAL_STAKE_HANDLER:
      RefCell<Rc<RefCell<dyn crate::StakeHandler<Test>>>> = RefCell::new(Rc::new(RefCell::new(crate::HiringStakeHandler {})));
}

// Sets stake handler implementation in hiring module. Mockall frameworks integration
pub(crate) fn set_stake_handler_impl(mock: Rc<rstd::cell::RefCell<dyn crate::StakeHandler<Test>>>) {
    // Hiring::staking.mock_safe(move || MockResult::Return(mock.clone()));
    THREAD_LOCAL_STAKE_HANDLER.with(|f| {
        *f.borrow_mut() = mock.clone();
    });
}

// Tests mock expectation and restores default behaviour
pub(crate) fn test_expectation_and_clear_mock() {
    set_stake_handler_impl(Rc::new(RefCell::new(crate::HiringStakeHandler {})));
}

pub fn build_test_externalities() -> runtime_io::TestExternalities {
    let t = system::GenesisConfig::default()
        .build_storage::<Test>()
        .unwrap();

    t.into()
}

// Intercepts panic in provided function, test mock expectation and restores default behaviour
pub(crate) fn handle_mock<F: std::panic::RefUnwindSafe + Fn()>(func: F) {
    let panicked = panics(func);

    test_expectation_and_clear_mock();

    assert!(!panicked);
}

//
// ******* ApplicationDeactivatedHandler mocks ********************
//
thread_local! {
    pub static LAST_DEACTIVATED_APPLICATION:
        Cell<Option<(<Test as Trait>::ApplicationId, ApplicationDeactivationCause)>> = Cell::new(None);
}

pub struct TestApplicationDeactivatedHandler;
impl crate::ApplicationDeactivatedHandler<Test> for TestApplicationDeactivatedHandler {
    fn deactivated(
        application_id: &<Test as Trait>::ApplicationId,
        cause: ApplicationDeactivationCause,
    ) {
        LAST_DEACTIVATED_APPLICATION.with(|f| {
            f.replace(Some((*application_id, cause)));
        });
    }
}

impl TestApplicationDeactivatedHandler {
    pub(crate) fn assert_deactivated_application(
        expected_application_id: <Test as Trait>::ApplicationId,
        expected_cause: ApplicationDeactivationCause,
    ) {
        let mut actual_deactivated_application = None;
        LAST_DEACTIVATED_APPLICATION.with(|f| {
            actual_deactivated_application = f.replace(None);
        });

        assert_eq!(
            Some((expected_application_id, expected_cause)),
            actual_deactivated_application
        );
    }
}
