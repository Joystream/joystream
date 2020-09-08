//! Contains executable proposal extrinsic mocks

use frame_support::decl_module;
use sp_std::vec::Vec;
pub trait Trait: system::Trait {}

decl_module! {
    pub struct Module<T: Trait> for enum Call where origin: T::Origin {
        /// Working extrinsic test
        #[weight = 10_000_000]
        pub fn dummy_proposal(_origin, _title: Vec<u8>, _description: Vec<u8>) {}

        /// Broken extrinsic test
        #[weight = 10_000_000]
        pub fn faulty_proposal(_origin, _title: Vec<u8>, _description: Vec<u8>,) {
             Err("ExecutionFailed")?
        }
    }
}
