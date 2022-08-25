use crate::{AccountId, Balances, Call, Runtime, STAKING_LOCK_ID};
use codec::{Decode, Encode};
use frame_support::traits::LockIdentifier;
use frame_system::Config;
use scale_info::TypeInfo;
use sp_runtime::{
    traits::{DispatchInfoOf, SignedExtension},
    transaction_validity::{
        InvalidTransaction, TransactionLongevity, TransactionValidity, TransactionValidityError,
        ValidTransaction,
    },
};
use sp_std::{vec, vec::Vec};
use staking_handler::LockComparator;

#[derive(Encode, Decode, Clone, Eq, PartialEq, TypeInfo)]
#[scale_info(skip_type_params(T))]
pub struct CheckCallAllowed<T: Config + Send + Sync>(sp_std::marker::PhantomData<T>);

impl CheckCallAllowed<Runtime> {
    /// Create new `SignedExtension` to check runtime version.
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
        // check call
        match call {
            // Prevent pallet_staking bonding if stash account has existing rivalrous lock
            Call::Staking(pallet_staking::Call::<Runtime>::bond { .. }) => {
                // check Locks
                let existing_locks = Balances::locks(who);
                let existing_lock_ids: Vec<LockIdentifier> =
                    existing_locks.iter().map(|lock| lock.id).collect();

                if Runtime::are_locks_conflicting(&STAKING_LOCK_ID, existing_lock_ids.as_slice()) {
                    return InvalidTransaction::Call.into();
                }

                Ok(ValidTransaction {
                    priority: 0,
                    requires: vec![],
                    provides: vec![],
                    longevity: TransactionLongevity::max_value(),
                    propagate: true,
                })
            }
            _ => Ok(ValidTransaction {
                priority: 0,
                requires: vec![],
                provides: vec![],
                longevity: TransactionLongevity::max_value(),
                propagate: true,
            }),
        }
    }
}
