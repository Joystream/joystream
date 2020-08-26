#![cfg(test)]

use sp_std::marker::PhantomData;
use std::cell::RefCell;
use std::panic;
use std::rc::Rc;

use super::Test;

// Intercepts panic method
// Returns: whether panic occurred
pub(crate) fn panics<F: std::panic::RefUnwindSafe + Fn()>(could_panic_func: F) -> bool {
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

// Test StakeHandlerProvider implementation based on local thread static variables
pub struct TestStakeHandlerProvider;
impl crate::StakeHandlerProvider<Test> for TestStakeHandlerProvider {
    /// Returns StakeHandler. Mock entry point for stake module.
    fn stakes() -> Rc<dyn crate::StakeHandler<Test>> {
        THREAD_LOCAL_STAKE_HANDLER.with(|f| f.borrow().clone())
    }
}

// 1. RefCell - thread_local! mutation pattern
// 2. Rc - ability to have multiple references
thread_local! {
    pub static THREAD_LOCAL_STAKE_HANDLER:
      RefCell<Rc<dyn crate::StakeHandler<Test>>> = RefCell::new(Rc::new(crate::types::DefaultStakeHandler{marker: PhantomData::<Test>}));
}

// Sets stake handler implementation. Mockall framework integration.
pub(crate) fn set_stake_handler_impl(mock: Rc<dyn crate::StakeHandler<Test>>) {
    THREAD_LOCAL_STAKE_HANDLER.with(|f| {
        *f.borrow_mut() = mock.clone();
    });
}

// Tests mock expectation and restores default behaviour
pub(crate) fn test_expectation_and_clear_mock() {
    set_stake_handler_impl(Rc::new(crate::types::DefaultStakeHandler {
        marker: PhantomData::<Test>,
    }));
}

// Intercepts panic in provided function, test mock expectation and restores default behaviour
pub(crate) fn handle_mock<F: std::panic::RefUnwindSafe + Fn()>(func: F) {
    let panicked = panics(func);

    test_expectation_and_clear_mock();

    assert!(!panicked);
}
