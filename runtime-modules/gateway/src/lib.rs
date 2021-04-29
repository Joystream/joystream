// Ensure we're `no_std` when compiling for Wasm.
#![cfg_attr(not(feature = "std"), no_std)]

use codec::Codec;
use codec::{Decode, Encode};
use frame_support::sp_runtime::traits::{MaybeSerialize, Member};
use frame_support::Parameter;
use frame_support::{decl_event, decl_module, decl_storage, ensure};
use sp_arithmetic::traits::{BaseArithmetic, Zero};
use sp_std::vec::Vec;

#[cfg(feature = "std")]
pub use serde::{Deserialize, Serialize};

// TODO(important!) when WorkingGroupAuthenticatior is available in this branch
// replace with this
pub type GatewayWorkingGroupInstance = working_group::Instance5;
pub type ServiceProviderWorkingGroupInstance = working_group::Instance6;
pub type GatewayWorkingGroup<T> = working_group::Module<T, GatewayWorkingGroupInstance>;
pub type ServiceProviderWorkingGroup<T> =
    working_group::Module<T, ServiceProviderWorkingGroupInstance>;

type WorkerId<T> = working_group::WorkerId<T>;

#[derive(Encode, Decode, Clone, PartialEq, Eq, Debug)]
enum ServiceProviderKind {
    Generic,
}

#[derive(Encode, Decode, Default, Clone, PartialEq, Eq, Debug)]
struct ServiceProvidderWorkerId<T: membership::Trait> {
    worker_id: WorkerId<T>,
    group: ServiceProviderKind,
}

#[derive(Encode, Decode, Default, Clone, PartialEq, Eq, Debug)]
struct ServiceProvider<T: membership::Trait> {
    service_provider_worker_id: ServiceProvidderWorkerId<T>,
}

pub trait Trait:
    system::Trait
    + working_group::Trait<ServiceProviderWorkingGroupInstance>
    + working_group::Trait<GatewayWorkingGroupInstance>
{
    type Event: From<Event<Self>> + Into<<Self as system::Trait>::Event>;
    type ServiceProviderId: Parameter
        + Member
        + BaseArithmetic
        + Codec
        + Default
        + Copy
        + MaybeSerialize
        + PartialEq;
}

decl_storage! {
    trait Store for Module<T: Trait> as Gateway {
        /// Next identifier for *any* service provider
        pub NextServiceProvider get(fn next_service_provider_id): T::ServiceProviderId;

        /// Map between Service Provider Id and Service Provider
        pub ServiceProviderById get(fn service_provider_by_id): map hasher(blake2_128_concat)
            T::ServiceProviderId => ServiceProvider<T>
    }
}

decl_event! {
    pub enum Event<T>
        where WorkerId = WorkerId<T>,
    {
        ServiceProviderCreated(WorkerId),
    }
}

decl_module! {
    pub struct Module<T: Trait> for enum Call where origin: T::Origin {
        fn deposit_event() = default;

        #[weight = 10_000_000] // TODO: adjust weight
        fn create_service_provider(origin, worker_id: WorkerId<T>) {
            GatewayWorkingGroup::<T>::ensure_origin_is_active_leader(origin)?;
            ServiceProviderWorkingGroup::<T>::ensure_worker_exists(worker_id)
            /*
            ensure!(!T::Currency::total_balance(&sender).is_zero(), "account must have a balance");
            ensure!(memo.len() as u32 <= Self::max_memo_length(), "memo too long");

            <Memo<T>>::insert(&sender, memo);
            Self::deposit_event(RawEvent::MemoUpdated(sender));
            */
        }
    }
}
