// Ensure we're `no_std` when compiling for Wasm.
#![cfg_attr(not(feature = "std"), no_std)]

use codec::alloc::string::ToString;
use codec::Codec;
use codec::{Decode, Encode};
use frame_support::traits::{Currency, ExistenceRequirement, Get};
use frame_support::{decl_error, decl_event, decl_module, decl_storage, ensure, Parameter};
use frame_support::{
    dispatch::DispatchResult,
    sp_runtime::traits::{MaybeSerialize, Member},
};
use sp_arithmetic::traits::{BaseArithmetic, One, Saturating, Zero};
use sp_runtime::ModuleId;
use sp_runtime::{traits::AccountIdConversion, DispatchError};
use sp_std::fmt::Debug;
use sp_std::fmt::Display;
use sp_std::prelude::Vec;
use system::ensure_signed;

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
    /// Worker Id of the service provider in it's respective group
    pub worker_id: WorkerId,
    /// Group of the service provider
    pub group: ServiceProviderKind,
}

/// Request for payment
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq, Debug)]
pub struct PaymentRequestSignature<RequestId, ServiceUnits> {
    /// ID of the payment request(This is determined by the internal protocol of the gateway/service provider)
    pub payment_signature_request_id: RequestId,
    /// Total number of service units rendered
    pub new_total_service_level_requested_paid_for: ServiceUnits,
    // TODO: Do we request utf8?
    /// Some human-legible report of services provided(In some encoding?)
    pub service_provider_service_report_commitment: Vec<u8>,
}

// TODO: Maybe use Serde to standarize this?
// TODO: Also are display requirements too restrictive?
impl<T: Display, I: Display> PaymentRequestSignature<T, I> {
    fn serialize(&self) -> Vec<u8> {
        let mut serialized = self.payment_signature_request_id.to_string().into_bytes();
        serialized.extend(
            &self
                .new_total_service_level_requested_paid_for
                .to_string()
                .into_bytes(),
        );
        serialized.extend(&self.service_provider_service_report_commitment);
        serialized
    }

    pub fn get_verification_message<U: Trait>(
        &self,
        service_provider_id: &U::ServiceProviderId,
    ) -> Vec<u8> {
        let mut serialized = self.serialize();
        serialized.extend(&service_provider_id.to_string().into_bytes());
        serialized
    }
}

/// Representation of a single service provider
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq, Debug)]
pub struct ServiceProvider<WorkerId, Balance, BlockNumber> {
    pub service_provider_worker_id: ServiceProviderWorkerId<WorkerId>,
    pub platform_service_price: Balance,
    pub refund_period: BlockNumber,
    pub provider_price: Balance,
    pub minimum_locked_balance: Balance,
}

/// Representation of a channel between a Service Provider and a channel
#[cfg_attr(feature = "std", derive(Serialize, Deserialize))]
#[derive(Encode, Decode, Default, Clone, PartialEq, Eq, Debug)]
pub struct ServiceChannel<Balance, BlockNumber, AccountId> {
    pub gateway_worker_fallback_account: AccountId,
    pub service_provider_fallback_account: Option<AccountId>,
    pub locked_balance: Balance,
    pub refund_delay_period: BlockNumber,
    pub platform_price: Balance,
    pub provider_price: Balance,
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

type ServiceChannelOf<T> = ServiceChannel<
    BalanceOf<T>,
    <T as system::Trait>::BlockNumber,
    <T as system::Trait>::AccountId,
>;

pub type BalanceOf<T> =
    <<T as Trait>::Currency as Currency<<T as system::Trait>::AccountId>>::Balance;

type ServiceProviderOf<T> =
    ServiceProvider<WorkerId<T>, BalanceOf<T>, <T as system::Trait>::BlockNumber>;

type PaymentRequestSignatureOf = PaymentRequestSignature<u64, u32>;

// Ideally we could use
pub trait Verify<AccountId> {
    fn verify(&self, msg: &[u8], signer: &AccountId) -> bool;
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
        + PartialEq
        + Display;

    type ModuleId: Get<ModuleId>;

    type Currency: frame_support::traits::Currency<Self::AccountId>;

    type Signature: Verify<Self::AccountId> + Codec + MaybeSerialize + Debug + PartialEq + Clone;
}

decl_error! {
    pub enum Error for Module<T: Trait> {
        InsufficientBalance,
        ChannelNotExists,
        ServiceProviderNotExist,
        ServiceChannelNotForProvider,
        ServiceChannelAlreadyConfirmed,
        SignatureError,
        InsufficientBalanceForSettling,
        NoServiceProviderFallbackAccount,
        ChannelNotOperational,
        ChannelRefundNotStarted,
        RefundDelayOnGoing,
        ServiceTermsUpdateEmpty,
        ServicePriceIsZero,
        RefundPeriodIsZero,
        LockedIncreaseIsZero,
        ServiceChannelAlreadyExists,
    }
}

decl_storage! {
    trait Store for Module<T: Trait> as Gateway {
        /// Next identifier for *any* service provider
        pub NextServiceProvider get(fn next_service_provider_id): T::ServiceProviderId;

        /// Map between Service Provider Id and Service Provider
        pub ServiceProviderById get(fn service_provider_by_id): map hasher(blake2_128_concat)
            T::ServiceProviderId => ServiceProviderOf<T>;

        /// Map between (Service Provider, Gateway) and service channel
        pub ServiceChannelByServiceProviderIdByWorkerId get(fn service_channel_by_provider_id_by_worker_id): double_map hasher(blake2_128_concat)
            T::ServiceProviderId, hasher(blake2_128_concat) WorkerId<T> => ServiceChannelOf<T>;

        /// Default share of a service channel price that goes to the platform(is burned).
        /// It is updatable by the lead for an specific provider.
        pub ServiceChannelPlatformPrice get(fn service_channel_creation_price): BalanceOf<T>;

        /// Default price of a unit of service for a service channel.
        /// It's updatable by the service provider.
        pub ProviderPrice get(fn provider_price): BalanceOf<T>;

        /// Default price of a unit of service for a service channel.
        /// It's updatable by the lead for an specific provider.
        pub RefundPeriod get(fn refund_period): T::BlockNumber;

        /// Default minimum locked balance for a channel of a given service provider.
        /// It's updatable by the service provider for their channels.
        pub MinimumLockedBalance get(fn minimum_locked_balance): BalanceOf<T>;
    }
}

decl_event! {
    pub enum Event<T>
        where WorkerId = WorkerId<T>,
              ServiceProviderWorkerId = ServiceProviderWorkerId<WorkerId<T>>,
              Balance = BalanceOf<T>,
              <T as system::Trait>::BlockNumber,
              <T as Trait>::ServiceProviderId,
              <T as system::Trait>::AccountId,
              PaymentRequestSignature = PaymentRequestSignatureOf,
    {
        /// A service provider was created With the following parameters
        /// * Worker Id of the service provider
        /// * Refund period
        /// * Service price per unit for any channel created for this provider
        /// * Platform price per unit of service rendered for the created service channel
        /// * Id of the service provider created
        ServiceProviderCreated(ServiceProviderWorkerId, BlockNumber, Balance, Balance, ServiceProviderId),


        /// A channel was created
        /// * Gateway worker Id
        /// * Service Provider Id
        /// * Platform Price
        /// * Locked Balance
        /// * Gateway Worker
        ServiceChannelCreated(WorkerId, ServiceProviderId, Balance, AccountId),

        /// A channel was confirmed by the Service Provider
        /// * Id of service Provider
        /// * Worker Id of gateway
        ServiceChannelConfirmed(ServiceProviderId, WorkerId),

        /// A channel has been settled
        /// * Id of service Provider
        /// * Worker Id of gateway
        /// * Payment request that is being used for settlment
        ChannelSettled(ServiceProviderId, WorkerId, PaymentRequestSignature),

        /// A channel has been canceled
        /// * Id of service Provider
        /// * Worker Id of gateway
        ChannelCanceled(ServiceProviderId, WorkerId),

        /// A gateway initiated a refund request
        /// * Id of service Provider
        /// * Worker Id of gateway
        ChannelRefundInitiated(ServiceProviderId, WorkerId),
    }
}

decl_module! {
pub struct Module<T: Trait> for enum Call where origin: T::Origin {
    fn deposit_event() = default;

    /// Creates a new service provider choosing one in the corresponding working group
    /// needs to be a lead on the gateway working group to call it.
    #[weight = 10_000_000] // TODO: adjust weight
    pub fn create_service_provider(
        origin,
        service_provider_worker_id: ServiceProviderWorkerId<WorkerId<T>>,
    ) {
        GatewayWorkingGroup::<T>::ensure_origin_is_active_leader(origin)?;
        // TODO: should check in any of the working groups
        // This could be done through WorkingGroupAuthenticatior
        ServiceProviderWorkingGroup::<T>::ensure_worker_exists(
            &service_provider_worker_id.worker_id
        )?;

        // == MUTATION SAFE ==

        let service_provider_id = Self::get_next_service_provider_id();

        let service_provider = ServiceProvider {
            service_provider_worker_id: service_provider_worker_id.clone(),
            platform_service_price: Self::service_channel_creation_price(),
            provider_price: Self::provider_price(),
            refund_period: Self::refund_period(),
            minimum_locked_balance: Self::minimum_locked_balance(),
        };

        <ServiceProviderById<T>>::insert(
            service_provider_id,
            service_provider
        );

        Self::deposit_event(
            RawEvent::ServiceProviderCreated(
                service_provider_worker_id,
                Self::refund_period(),
                Self::provider_price(),
                Self::service_channel_creation_price(),
                service_provider_id
            )
        );
    }

    /// Used by gateway to propose a channel for a service provider.
    /// Must be confirmed by the Service Provider using `confirm_channel`
    #[weight = 10_000_000] // TODO adjust weight
    pub fn create_channel(
        origin,
        service_provider_id: T::ServiceProviderId,
        gateway_worker_id: WorkerId<T>,
        locked_balance: BalanceOf<T>,
    ) {
        let gateway_worker = GatewayWorkingGroup::<T>::ensure_worker_signed(origin, &gateway_worker_id)?;
        ensure!(<ServiceProviderById<T>>::contains_key(service_provider_id), Error::<T>::ServiceProviderNotExist);
        ensure!(
            !<ServiceChannelByServiceProviderIdByWorkerId<T>>::contains_key(service_provider_id, gateway_worker_id),
            Error::<T>::ServiceChannelAlreadyExists
        );

        let service_channel_provider = Self::service_provider_by_id(service_provider_id);
        let account_id = gateway_worker.role_account_id;

        ensure!(
            <T as Trait>::Currency::free_balance(&account_id) >= locked_balance,
            Error::<T>::InsufficientBalance
        );

        ensure!(
            locked_balance >= service_channel_provider.minimum_locked_balance,
            Error::<T>::InsufficientBalance
        );

        // == MUTATION SAFE ==

        Self::reserve_channel_balance(
            service_provider_id,
            gateway_worker_id,
            &account_id,
            locked_balance
        )?;

        let service_channel = ServiceChannelOf::<T> {
            locked_balance,
            refund_delay_period: service_channel_provider.refund_period,
            platform_price: service_channel_provider.platform_service_price,
            provider_price: service_channel_provider.provider_price,
            state: ServiceChannelState::default(),
            gateway_worker_fallback_account: account_id.clone(),
            service_provider_fallback_account: None,
        };


        <ServiceChannelByServiceProviderIdByWorkerId<T>>::insert(service_provider_id, gateway_worker_id, service_channel);
        Self::deposit_event(
            RawEvent::ServiceChannelCreated(
                gateway_worker_id,
                service_provider_id,
                locked_balance,
                account_id,
            )
        );
    }

    /// Service provider confirms channel proposed by gateway worker.
    #[weight = 10_000_000] // TODO: adjust weight
    pub fn confirm_channel(
        origin,
        service_provider_id: T::ServiceProviderId,
        gateway_worker_id: WorkerId<T>,
    ) {
        let account_id = ensure_signed(origin.clone())?;
        let mut service_channel = Self::ensure_service_provider_caller(origin, &service_provider_id, &gateway_worker_id)?;
        ensure!(service_channel.state == ServiceChannelState::Pending, Error::<T>::ServiceChannelAlreadyConfirmed);

        // == MUTATION SAFE ==

        service_channel.state = ServiceChannelState::Operational;
        service_channel.service_provider_fallback_account = Some(account_id);
        <ServiceChannelByServiceProviderIdByWorkerId<T>>::insert(service_provider_id, gateway_worker_id, service_channel);

        Self::deposit_event(RawEvent::ServiceChannelConfirmed(service_provider_id, gateway_worker_id));
    }

    /// Called by a service provider to get paid by its service rendered.
    /// This extrinsic closes the channel and a new one needs to be open to continue providing service.
    #[weight = 10_000_000] // TODO: adjust weight
    pub fn settle_channel(
        origin,
        service_provider_id: T::ServiceProviderId,
        gateway_worker_id: WorkerId<T>,
        request_payment_signature: PaymentRequestSignatureOf,
        signature: T::Signature
    ) {
        // Ensure origin is service channel owner
        let service_channel = Self::ensure_service_provider_caller(origin, &service_provider_id, &gateway_worker_id)?;

        // Verify that signature is valid for this service channel
        let verification_message = request_payment_signature.get_verification_message::<T>(&service_provider_id);
        ensure!(signature.verify(&verification_message, &service_channel.gateway_worker_fallback_account), Error::<T>::SignatureError);

        // Ensure Channel is operational
        ensure!(service_channel.state == ServiceChannelState::Operational, Error::<T>::ChannelNotOperational);

        // Calculate payments for platform, service provider and refund for gateway
        let payoff_balance = service_channel.provider_price * BalanceOf::<T>::from(request_payment_signature.new_total_service_level_requested_paid_for);
        let burn_balance = service_channel.platform_price * BalanceOf::<T>::from(request_payment_signature.new_total_service_level_requested_paid_for);
        ensure!(service_channel.locked_balance >= (payoff_balance + burn_balance), Error::<T>::InsufficientBalanceForSettling);
        let refund_balance = service_channel.locked_balance - (payoff_balance + burn_balance);
        ensure!(service_channel.locked_balance == <T as Trait>::Currency::free_balance(&Self::get_service_channel_account(service_provider_id, gateway_worker_id)), Error::<T>::InsufficientBalanceForSettling);

        // Check that there is a fallback account for service provider to make the payment to. Should be always true since channel is operational.
        let service_provider_account = if let Some(fallback_account) = service_channel.service_provider_fallback_account {
            fallback_account
        } else {
            return Err(Error::<T>::NoServiceProviderFallbackAccount.into());
        };

        // == MUTATION SAFE ==

        let gateway_account_id = service_channel.gateway_worker_fallback_account;

        // Make channel payments
        Self::settle_channel_balance(
            Some(&service_provider_account),
            &gateway_account_id,
            service_provider_id,
            gateway_worker_id,
            payoff_balance,
            burn_balance,
            refund_balance,
        )?;

        // Cleanup channel
        <ServiceChannelByServiceProviderIdByWorkerId<T>>::remove(service_provider_id, gateway_worker_id);

        // TODO: Should signature be part of the event?
        Self::deposit_event(RawEvent::ChannelSettled(service_provider_id, gateway_worker_id, request_payment_signature));
    }

    /// Cancel a channel before it's confirmed
    #[weight = 10_000_000]  // TODO: adjust weight
    pub fn cancel_channel(origin, service_provider_id: T::ServiceProviderId, gateway_worker_id: WorkerId<T>) {
        let service_channel = Self::ensure_gateway_caller(origin, &service_provider_id, &gateway_worker_id)?;
        ensure!(
            service_channel.state == ServiceChannelState::Pending,
            Error::<T>::ServiceChannelAlreadyConfirmed
        );

        // == MUTATION SAFE ==

        Self::settle_channel_balance(
            None,
            &service_channel.gateway_worker_fallback_account,
            service_provider_id,
            gateway_worker_id,
            Zero::zero(),
            Zero::zero(),
            service_channel.locked_balance
        )?;

        <ServiceChannelByServiceProviderIdByWorkerId<T>>::remove(service_provider_id, gateway_worker_id);
        Self::deposit_event(RawEvent::ChannelCanceled(service_provider_id, gateway_worker_id));
    }

    /// Initiate a channel refund by a gateway, the service provider can settle the channel before the refund is completed.
    #[weight = 10_000_000] // TODO: adjust weight
    pub fn initiate_refund_channel(origin, service_provider_id: T::ServiceProviderId, gateway_worker_id: WorkerId<T>) {
        let mut service_channel = Self::ensure_gateway_caller(origin, &service_provider_id, &gateway_worker_id)?;
        ensure!(service_channel.state == ServiceChannelState::Operational, Error::<T>::ChannelNotOperational);

        // == MUTATION SAFE ==

        service_channel.state = ServiceChannelState::RefundInitiated(system::Module::<T>::block_number());
        <ServiceChannelByServiceProviderIdByWorkerId<T>>::insert(service_provider_id, gateway_worker_id, service_channel);

        Self::deposit_event(RawEvent::ChannelRefundInitiated(service_provider_id, gateway_worker_id));
    }

    /// Completes a refund for a given channel, must at least have passed the `refund_delay_period` in blocks
    /// specified in the ServiceProvider in the moment of the ServiceChannel creation
    #[weight = 10_000_000] // TODO: adjust weight
    pub fn complete_refund_channel(origin, service_provider_id: T::ServiceProviderId, gateway_worker_id: WorkerId<T>) {
        let service_channel = Self::ensure_gateway_caller(origin, &service_provider_id, &gateway_worker_id)?;
        let refund_start = if let ServiceChannelState::RefundInitiated(refund_start) = service_channel.state {
          refund_start
        } else {
          return Err(Error::<T>::ChannelRefundNotStarted.into());
        };
        ensure!(
            system::Module::<T>::block_number() - refund_start >= service_channel.refund_delay_period,
            Error::<T>::RefundDelayOnGoing
        );

        // == MUTATION SAFE ==

        Self::settle_channel_balance(
            None,
            &service_channel.gateway_worker_fallback_account,
            service_provider_id,
            gateway_worker_id,
            Zero::zero(),
            Zero::zero(),
            service_channel.locked_balance,
        )?;
        <ServiceChannelByServiceProviderIdByWorkerId<T>>::remove(service_provider_id, gateway_worker_id);
    }

    /// Increases the locked balance for a given service channel.
    /// This is done by a gateway to increase the amount of service units a provider can render before having to settle the channel.
    #[weight = 10_000_000] // TODO: adjust weight
    pub fn increase_channel_capital(origin, service_provider_id: T::ServiceProviderId, gateway_worker_id: WorkerId<T>, increased_amount: BalanceOf<T>) {
        let account_id = ensure_signed(origin.clone())?;
        let mut service_channel = Self::ensure_gateway_caller(origin, &service_provider_id, &gateway_worker_id)?;
        ensure!(
            increased_amount > Zero::zero(),
            Error::<T>::LockedIncreaseIsZero
        );
        ensure!(
            <T as Trait>::Currency::free_balance(&account_id) >= increased_amount,
            Error::<T>::InsufficientBalance
        );

        // == MUTATION SAFE ==

        Self::reserve_channel_balance(
            service_provider_id,
            gateway_worker_id,
            &account_id,
            increased_amount,
        )?;
        service_channel.locked_balance += increased_amount;
        <ServiceChannelByServiceProviderIdByWorkerId<T>>::insert(service_provider_id, gateway_worker_id, service_channel);
    }

    /// Update gateway's fallback account
    #[weight = 10_000_000] // TODO: adjust weight
    pub fn update_gateway_fallback_account(
        origin,
        service_provider_id: T::ServiceProviderId,
        gateway_worker_id: WorkerId<T>,
        new_fallback_account: T::AccountId
    ) {
        let mut service_channel = Self::ensure_gateway_caller(origin, &service_provider_id, &gateway_worker_id)?;

        // == MUTATION SAFE ==

        service_channel.gateway_worker_fallback_account = new_fallback_account;
        <ServiceChannelByServiceProviderIdByWorkerId<T>>::insert(service_provider_id, gateway_worker_id, service_channel);
    }

    ///  Update service provider's fallback account
    #[weight = 10_000_000] // TODO: adjust weight
    pub fn update_service_provider_fallback_account(
        origin,
        service_provider_id: T::ServiceProviderId,
        gateway_worker_id: WorkerId<T>,
        new_fallback_account: T::AccountId
    ) {
        let mut service_channel = Self::ensure_service_provider_caller(origin, &service_provider_id, &gateway_worker_id)?;

        // == MUTATION SAFE ==

        service_channel.service_provider_fallback_account = Some(new_fallback_account);
        <ServiceChannelByServiceProviderIdByWorkerId<T>>::insert(service_provider_id, gateway_worker_id, service_channel);
    }


    /// Decreases the amount of locked capital by the service channel
    #[weight = 10_000_000] // TODO: adjust weight
    pub fn decrease_channel_capital(
        origin,
        service_provider_id: T::ServiceProviderId,
        gateway_worker_id: WorkerId<T>,
        decreased_amount: BalanceOf<T>
    ) {
        let mut service_channel = Self::ensure_service_provider_caller(origin, &service_provider_id, &gateway_worker_id)?;
        let service_channel_account_id = &Self::get_service_channel_account(service_provider_id, gateway_worker_id);
        ensure!(
            <T as Trait>::Currency::free_balance(&service_channel_account_id) >
                decreased_amount,
            Error::<T>::InsufficientBalance
        );

        // == MUTATION SAFE ==

        <T as Trait>::Currency::transfer(
            service_channel_account_id,
            &service_channel.gateway_worker_fallback_account,
            decreased_amount,
            ExistenceRequirement::AllowDeath,
        )?;

        service_channel.locked_balance -= decreased_amount;
        <ServiceChannelByServiceProviderIdByWorkerId<T>>::insert(service_provider_id, gateway_worker_id, service_channel);
    }

    /// Called by lead to update a given service provider term
    #[weight = 10_000_000] // TODO: adjust weight
    pub fn update_service_provider_terms(
        origin,
        service_provider_id: T::ServiceProviderId,
        platform_service_price: Option<BalanceOf<T>>,
        refund_period: Option<T::BlockNumber>
    ) {
        GatewayWorkingGroup::<T>::ensure_origin_is_active_leader(origin)?;
        ensure!(
            <ServiceProviderById<T>>::contains_key(service_provider_id),
            Error::<T>::ServiceProviderNotExist
        );
        ensure!(
            platform_service_price.is_some() || refund_period.is_some(),
            Error::<T>::ServiceTermsUpdateEmpty
        );
        if let Some(platform_service_price) = platform_service_price {
             ensure!(
                platform_service_price > Zero::zero(),
                Error::<T>::ServicePriceIsZero
            );
        }
        if let Some(refund_period) = refund_period {
             ensure!(
                refund_period > Zero::zero(),
                Error::<T>::RefundPeriodIsZero
            );
        }

        // == MUTATION SAFE ==

        <ServiceProviderById<T>>::mutate(
            service_provider_id,
            |sp| *sp = ServiceProvider {
                refund_period: refund_period.unwrap_or(sp.refund_period),
                platform_service_price: platform_service_price.unwrap_or(sp.platform_service_price),
                ..sp.clone()
            }
        )
    }

    /// Called by lead to remove a given service provider
    #[weight = 10_000_000] // TODO: adjust weight
    pub fn remove_service_provider(origin, service_provider_id: T::ServiceProviderId) {
        GatewayWorkingGroup::<T>::ensure_origin_is_active_leader(origin)?;
        ensure!(<ServiceProviderById<T>>::contains_key(service_provider_id), Error::<T>::ServiceProviderNotExist);

        // == MUTATION SAFE ==

        <ServiceProviderById<T>>::remove(service_provider_id);
    }
}}
impl<T: Trait> Module<T> {
    fn ensure_service_provider_caller(
        origin: T::Origin,
        service_provider_id: &T::ServiceProviderId,
        gateway_worker_id: &WorkerId<T>,
    ) -> Result<ServiceChannelOf<T>, DispatchError> {
        ensure!(
            <ServiceChannelByServiceProviderIdByWorkerId<T>>::contains_key(
                service_provider_id,
                gateway_worker_id
            ),
            Error::<T>::ChannelNotExists
        );
        let service_channel = Self::service_channel_by_provider_id_by_worker_id(
            service_provider_id,
            gateway_worker_id,
        );
        if let Some(ref account_id) = service_channel.service_provider_fallback_account {
            let caller_id = ensure_signed(origin.clone())?;
            if account_id == &caller_id {
                return Ok(service_channel);
            }
        }
        let service_channel_provider = Self::service_provider_by_id(service_provider_id);

        ServiceProviderWorkingGroup::<T>::ensure_worker_signed(
            origin,
            &service_channel_provider
                .service_provider_worker_id
                .worker_id,
        )?;

        Ok(service_channel)
    }

    fn ensure_gateway_caller(
        origin: T::Origin,
        service_provider_id: &T::ServiceProviderId,
        gateway_worker_id: &WorkerId<T>,
    ) -> Result<ServiceChannelOf<T>, DispatchError> {
        ensure!(
            <ServiceChannelByServiceProviderIdByWorkerId<T>>::contains_key(
                service_provider_id,
                gateway_worker_id
            ),
            Error::<T>::ChannelNotExists
        );
        let service_channel = Self::service_channel_by_provider_id_by_worker_id(
            service_provider_id,
            gateway_worker_id,
        );

        if ensure_signed(origin.clone())? == service_channel.gateway_worker_fallback_account {
            return Ok(service_channel);
        }

        GatewayWorkingGroup::<T>::ensure_worker_signed(origin, &gateway_worker_id)?;

        Ok(service_channel)
    }

    fn get_next_service_provider_id() -> T::ServiceProviderId {
        <NextServiceProvider<T>>::mutate(|id| {
            sp_std::mem::replace(id, id.saturating_add(One::one()))
        })
    }

    fn get_service_channel_account(
        service_provider_id: T::ServiceProviderId,
        gateway_worker_id: WorkerId<T>,
    ) -> T::AccountId {
        T::ModuleId::get().into_sub_account((service_provider_id, gateway_worker_id))
    }

    fn reserve_channel_balance(
        service_provider_id: T::ServiceProviderId,
        gateway_worker_id: WorkerId<T>,
        gateway_account_id: &T::AccountId,
        reserved_balance: BalanceOf<T>,
    ) -> DispatchResult {
        <T as Trait>::Currency::transfer(
            gateway_account_id,
            &Self::get_service_channel_account(service_provider_id, gateway_worker_id),
            reserved_balance,
            ExistenceRequirement::AllowDeath,
        )
    }

    fn settle_channel_balance(
        service_provider_account_id: Option<&T::AccountId>,
        gateway_account_id: &T::AccountId,
        service_provider_id: T::ServiceProviderId,
        gateway_worker_id: WorkerId<T>,
        payoff_balance: BalanceOf<T>,
        burn_balance: BalanceOf<T>,
        refund_balance: BalanceOf<T>,
    ) -> DispatchResult {
        let service_channel_account =
            Self::get_service_channel_account(service_provider_id, gateway_worker_id);
        <T as Trait>::Currency::slash(&service_channel_account, burn_balance);

        if let Some(service_provider_account_id) = service_provider_account_id {
            <T as Trait>::Currency::transfer(
                &service_channel_account,
                service_provider_account_id,
                payoff_balance,
                ExistenceRequirement::AllowDeath,
            )?;
        }

        <T as Trait>::Currency::transfer(
            &service_channel_account,
            gateway_account_id,
            refund_balance,
            ExistenceRequirement::AllowDeath,
        )
    }
}
