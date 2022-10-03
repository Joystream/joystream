//! Disallow some panic-invoking macros in a production build
//! Usage:
//! #[cfg(not(any(test, feature = "runtime-benchmarks")))]
//! #[allow(unused_imports)]
//! #[macro_use]
//! extern crate common;

#![cfg(not(any(test, feature = "runtime-benchmarks")))]

#[macro_export]
macro_rules! assert {
    ($cond:expr $(,)?) => {
        compile_error!("assert! macro used in production build");
    };
    ($cond:expr, $($arg:tt)+) => {
        compile_error!("assert! macro used in production build");
    };
}

#[macro_export]
macro_rules! assert_eq {
    ($left:expr, $right:expr $(,)?) => {
        compile_error!("assert_eq! macro used in production build");
    };
    ($left:expr, $right:expr, $($arg:tt)+) => {
        compile_error!("assert_eq! macro used in production build");
    };
}

#[macro_export]
macro_rules! assert_ne {
    ($left:expr, $right:expr $(,)?) => {
        compile_error!("assert_ne! macro used in production build");
    };
    ($left:expr, $right:expr, $($arg:tt)+) => {
        compile_error!("assert_ne! macro used in production build");
    };
}

#[macro_export]
macro_rules! todo {
    () => {
        compile_error!("todo! macro used in production build");
    };
    ($($arg:tt)+) => {
        compile_error!("todo! macro used in production build");
    };
}

#[macro_export]
macro_rules! unimplemented {
    () => {
        compile_error!("unimplemented! macro used in production build");
    };
    ($($arg:tt)+) => {
        compile_error!("unimplemented! macro used in production build");
    };
}
