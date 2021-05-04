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

/// Indicates different types of Service Provider
/// There is only Generic for now
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Clone, PartialEq, Eq, Debug)]
pub enum ServiceProviderKind {
    Generic,
}

impl Default for ServiceProviderKind {
    fn default() -> Self {
        Self::Generic
    }
}

/// WorkerId + Working Group of a Service provider
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq, Debug)]
pub struct ServiceProviderWorkerId<WorkerId> {
    pub worker_id: WorkerId,
    pub group: ServiceProviderKind,
}

/// Representation of a single service provider
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq, Debug)]
pub struct ServiceProvider<WorkerId, Balance, BlockNumber> {
    pub service_provider_worker_id: ServiceProviderWorkerId<WorkerId>,
    pub service_price_per_unit: Balance,
    pub refund_period: BlockNumber,
}

/// Representation of a channel between a Service Provider and a channel
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq, Debug)]
pub struct ServiceChannel<WorkerId, Balance, BlockNumber> {
    pub gateway_worker_id: WorkerId,
    pub gateway_worker_fallback_account: WorkerId,
    pub service_provider_id: ServiceProviderWorkerId<WorkerId>,
    pub service_provider_fallback_account: Option<WorkerId>,
    pub locked_balance_requirement: Balance,
    pub refund_delay_period: BlockNumber,
    pub platform_price: Balance,
    pub state: ServiceChannelState<BlockNumber>,
}

/// State of a service channel
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Clone, PartialEq, Eq, Debug)]
pub enum ServiceChannelState<BlockNumber> {
    Pending,
    Operational,
    RefundInitiated(BlockNumber),
}

impl<T> Default for ServiceChannelState<T> {
    fn default() -> Self {
        Self::Pending
    }
}

type ServiceChannelOf<T> =
    ServiceChannel<WorkerId<T>, <T as Trait>::Balance, <T as system::Trait>::BlockNumber>;

type ServiceProviderOf<T> =
    ServiceProvider<WorkerId<T>, <T as Trait>::Balance, <T as system::Trait>::BlockNumber>;

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

    type ServiceChannelId: Parameter
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
        /// Next identifier for service channel
        pub NextServiceChannelId get(fn next_service_channel_id): T::ServiceChannelId;

        /// Map between Service Provider Id and Service Provider
        pub ServiceProviderById get(fn service_provider_by_id): map hasher(blake2_128_concat)
            T::ServiceProviderId => ServiceProviderOf<T>;

        /// Map between Service Channel ID and service channel
        pub ServiceChannelById get(fn service_channel_by_id): map hasher(blake2_128_concat)
            T::ServiceChannelId => ServiceChannelOf<T>;

        /// Time until stake is refunded.
        pub RefundPeriod get(fn refund_period): T::BlockNumber;

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

        /// Creates a new service provider chosing one in the corresponding working group
        /// needs to be a lead on the gateway working group to call it.
        #[weight = 10_000_000] // TODO: adjust weight
        pub fn create_service_provider(
            origin,
            worker_id: WorkerId<T>,
            service_price_per_unit: T::Balance,
            refund_period: T::BlockNumber
        ) {
            GatewayWorkingGroup::<T>::ensure_origin_is_active_leader(origin)?;
            // TODO: should check in any of the working groups
            // This could be done through WorkingGroupAuthenticatior
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

        /// Creates a new channel between service provider and calling gateway
        #[weight = 10_000_000] // TODO adjust weight
        pub fn create_channel(
            origin,
            gateway_worker_id: WorkerId<T>,
            service_provider_id: ServiceProviderWorkerId<WorkerId<T>>,
            platform_price: T::Balance,
            locked_balance_requirement: T::Balance,
            gateway_worker_fallback_account: WorkerId<T>,
        ) {
            let _ = GatewayWorkingGroup::<T>::ensure_worker_signed(origin, &gateway_worker_id)?;
            ServiceProviderWorkingGroup::<T>::ensure_worker_exists(&service_provider_id.worker_id)?;
            GatewayWorkingGroup::<T>::ensure_worker_exists(&gateway_worker_id)?;

            let service_channel = ServiceChannelOf::<T> {
                gateway_worker_id,
                service_provider_id,
                locked_balance_requirement,
                refund_delay_period: <RefundPeriod<T>>::get(),
                platform_price,
                state: ServiceChannelState::default(),
                gateway_worker_fallback_account,
                service_provider_fallback_account: None,
            };

            let channel_id = Self::get_next_channel_id();

            <ServiceChannelById<T>>::insert(channel_id, service_channel);
        }
    }
}

impl<T: Trait> Module<T> {
    fn get_next_service_provider_id() -> T::ServiceProviderId {
        <NextServiceProvider<T>>::mutate(|id| {
            sp_std::mem::replace(id, id.saturating_add(One::one()))
        })
    }

    fn get_next_channel_id() -> T::ServiceChannelId {
        <NextServiceChannelId<T>>::mutate(|id| {
            sp_std::mem::replace(id, id.saturating_add(One::one()))
        })
    }
}
