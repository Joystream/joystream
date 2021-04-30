// Ensure we're `no_std` when compiling for Wasm.
#![cfg_attr(not(feature = "std"), no_std)]

use codec::Codec;
use codec::{Decode, Encode};
use frame_support::sp_runtime::traits::{MaybeSerialize, MaybeSerializeDeserialize, Member};
use frame_support::{decl_event, decl_module, decl_storage, Parameter};
use sp_arithmetic::traits::{AtLeast32BitUnsigned, BaseArithmetic, One, Saturating};
use sp_std::fmt::Debug;

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

#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Clone, PartialEq, Eq, Debug)]
enum ServiceProviderKind {
    Generic,
}

impl Default for ServiceProviderKind {
    fn default() -> Self {
        Self::Generic
    }
}

#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq, Debug)]
pub struct ServiceProviderWorkerId<WorkerId> {
    worker_id: WorkerId,
    group: ServiceProviderKind,
}

#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq, Debug)]
pub struct ServiceProvider<ServiceProviderWorkerId, Balance, BlockNumber> {
    service_provider_worker_id: ServiceProviderWorkerId,
    service_price_per_unit: Balance,
    refund_period: BlockNumber,
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
    type Balance: Parameter
        + Member
        + AtLeast32BitUnsigned
        + Codec
        + Default
        + Copy
        + MaybeSerializeDeserialize
        + Debug;
}

decl_storage! {
    trait Store for Module<T: Trait> as Gateway {
        /// Next identifier for *any* service provider
        pub NextServiceProvider get(fn next_service_provider_id): T::ServiceProviderId;

        /// Map between Service Provider Id and Service Provider
        pub ServiceProviderById get(fn service_provider_by_id): map hasher(blake2_128_concat)
            T::ServiceProviderId => ServiceProvider<ServiceProviderWorkerId<WorkerId<T>>, T::Balance, T::BlockNumber>
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
        fn create_service_provider(
            origin,
            worker_id: WorkerId<T>,
            service_price_per_unit: T::Balance,
            refund_period: T::BlockNumber
        ) {
            GatewayWorkingGroup::<T>::ensure_origin_is_active_leader(origin)?;
            ServiceProviderWorkingGroup::<T>::ensure_worker_exists(&worker_id)?;

            // Mutation
            let service_provider_id = Self::get_next_service_provider_id();
            let service_provider_worker_id = ServiceProviderWorkerId {
                worker_id,
                group: ServiceProviderKind::Generic,
            };

            let service_provider = ServiceProvider {
                service_provider_worker_id,
                service_price_per_unit,
                refund_period,
            };

            <ServiceProviderById<T>>::insert(
                service_provider_id,
                service_provider
            );
        }
    }
}

impl<T: Trait> Module<T> {
    fn get_next_service_provider_id() -> T::ServiceProviderId {
        <NextServiceProvider<T>>::mutate(|id| {
            sp_std::mem::replace(id, id.saturating_add(One::one()))
        })
    }
}
