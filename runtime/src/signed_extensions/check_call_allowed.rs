use crate::{AccountId, Balances, Call, Runtime};
use codec::{Decode, Encode};
use common::locks::STAKING_LOCK_ID;
use frame_support::traits::LockIdentifier;
use frame_system::Config;
use scale_info::TypeInfo;
use sp_runtime::{
    traits::{DispatchInfoOf, SignedExtension},
    transaction_validity::{InvalidTransaction, TransactionValidity, TransactionValidityError},
};
use sp_std::{vec, vec::Vec};
use staking_handler::LockComparator;

const BONDING_NOT_ALLOWED: u8 = 1;

#[derive(Encode, Decode, Clone, Eq, PartialEq, TypeInfo)]
#[scale_info(skip_type_params(T))]
pub struct CheckCallAllowed<T: Config + Send + Sync>(sp_std::marker::PhantomData<T>);

impl CheckCallAllowed<Runtime> {
    /// Create new `SignedExtension` to check allowed calls in transaction
    pub fn new() -> Self {
        Self(sp_std::marker::PhantomData)
    }
}

impl sp_std::fmt::Debug for CheckCallAllowed<Runtime> {
    #[cfg(feature = "std")]
    fn fmt(&self, f: &mut sp_std::fmt::Formatter) -> sp_std::fmt::Result {
        write!(f, "CheckCallAllowed")
    }

    #[cfg(not(feature = "std"))]
    fn fmt(&self, _: &mut sp_std::fmt::Formatter) -> sp_std::fmt::Result {
        Ok(())
    }
}

impl Default for CheckCallAllowed<Runtime> {
    fn default() -> Self {
        Self::new()
    }
}

impl CheckCallAllowed<Runtime> {
    // Checks to see if the account has any rivalrous locks that would conflict
    // with the FRAME staking pallet lock
    fn has_no_conflicting_locks(who: &AccountId) -> bool {
        let existing_locks = Balances::locks(who);

        if existing_locks.len() == 0 {
            return true;
        }

        if existing_locks.len() == 1 && existing_locks[0].id == STAKING_LOCK_ID {
            return true;
        }

        let existing_lock_ids: Vec<LockIdentifier> =
            existing_locks.iter().map(|lock| lock.id).collect();

        !Runtime::are_locks_conflicting(&STAKING_LOCK_ID, existing_lock_ids.as_slice())
    }

    // Recursively checks calls until one invalid bonding call is detected and returns false,
    // otherwise returns true.
    fn has_no_invalid_bonding_calls(who: &AccountId, calls: Vec<Call>) -> bool {
        for call in calls.into_iter() {
            let valid = match call {
                // Calls that can contain other Calls and must be checked recursively..
                Call::Utility(substrate_utility::Call::<Runtime>::batch { calls }) => {
                    Self::has_no_invalid_bonding_calls(who, calls.to_vec())
                }
                Call::Utility(substrate_utility::Call::<Runtime>::as_derivative {
                    call, ..
                }) => Self::has_no_invalid_bonding_calls(who, vec![*call]),

                // Bonding
                Call::Staking(pallet_staking::Call::<Runtime>::bond { .. }) => {
                    Self::has_no_conflicting_locks(who)
                }

                // Call::Multisig(pallet_multisig::Call::<Runtime>::as_multi )
                // Call::Multisig(pallet_multisig::Call::<Runtime>::as_multi_threshold_1 )

                // should we prevent Sudo from bypassing these checks?
                // Call::Sudo(pallet_sudo::Call::<Runtime>::sudo { call }) => ...
                // Call::Sudo(pallet_sudo::Call::<Runtime>::sudo_as { who, call }) => ...
                // Call::Sudo(pallet_sudo::Call::<Runtime>::sudo_unchecked_weight { call }) => ...
                // Call::Utility(substrate_utility::Call::<Runtime>::batch_all { calls }) => ...
                // Call::Utility(substrate_utility::Call::<Runtime>::force_batch { calls }) => ...
                // Call::Utility(substrate_utility::Call::<Runtime>::dispatch_as { calls }) => ...
                _ => true,
            };

            if !valid {
                return false;
            }
        }

        true
    }
}
impl SignedExtension for CheckCallAllowed<Runtime> {
    type AccountId = AccountId;
    type Call = Call;
    type AdditionalSigned = ();
    type Pre = ();
    const IDENTIFIER: &'static str = "CheckCallAllowed";

    fn additional_signed(&self) -> sp_std::result::Result<(), TransactionValidityError> {
        Ok(())
    }

    fn pre_dispatch(
        self,
        who: &Self::AccountId,
        call: &Self::Call,
        info: &DispatchInfoOf<Self::Call>,
        len: usize,
    ) -> Result<Self::Pre, TransactionValidityError> {
        self.validate(who, call, info, len).map(|_| ())
    }

    fn validate(
        &self,
        who: &Self::AccountId,
        call: &Self::Call,
        _info: &DispatchInfoOf<Self::Call>,
        _len: usize,
    ) -> TransactionValidity {
        if Self::has_no_invalid_bonding_calls(who, vec![call.clone()]) {
            Ok(Default::default())
        } else {
            InvalidTransaction::Custom(BONDING_NOT_ALLOWED).into()
        }
    }
}
