#![warn(missing_docs)]

use crate::{Instance, Module, Trait};
use frame_support::decl_error;

decl_error! {
    /// Discussion module predefined errors
    pub enum Error for Module<T: Trait<I>, I: Instance>{
        /// Provided stake balance cannot be zero.
        StakeBalanceCannotBeZero,
    }
}
