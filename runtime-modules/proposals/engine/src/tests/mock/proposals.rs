//! Contains executable proposal extrinsic mocks

use rstd::prelude::*;
use rstd::vec::Vec;
use sr_primitives::DispatchError;
use srml_support::decl_module;
pub trait Trait: system::Trait {}

decl_module! {
    pub struct Module<T: Trait> for enum Call where origin: T::Origin {
    	/// Working extrinsic test
        pub fn dummy_proposal(_origin, _title: Vec<u8>, _description: Vec<u8>) {}

		/// Broken extrinsic test
        pub fn faulty_proposal(_origin, _title: Vec<u8>, _description: Vec<u8>,) {
             Err("ExecutionFailed")?
        }
    }
}
