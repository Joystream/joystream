#![cfg_attr(not(feature = "std"), no_std)]

use rstd::prelude::*;
use parity_codec::Codec;
use parity_codec_derive::{Encode, Decode};
use srml_support::{StorageMap, StorageValue, dispatch, decl_module, decl_storage, decl_event, ensure, Parameter};
use srml_support::traits::{Currency};
use runtime_primitives::traits::{Zero, Bounded, SimpleArithmetic, As, Member, MaybeSerializeDebug};
use system::{self, ensure_signed};
use crate::governance::{GovernanceCurrency, BalanceOf };
use crate::membership::registry;

use crate::traits::{Members, Roles};

#[derive(Encode, Decode, Copy, Clone, Eq, PartialEq, Debug)]
pub enum Role {
    Storage,
}

#[derive(Encode, Decode, Clone)]
pub struct RoleParameters<T: Trait> {
    min_stake: BalanceOf<T>,
    max_actors: u32,
    // minimum actors to maintain - if role is unstaking
    // and remaining actors would be less that this value - prevent or punish for unstaking
    min_actors: u32,
    // fixed amount of tokens paid to actors' primary account
    reward_per_block: BalanceOf<T>,
    // payouts are made at this block interval
    reward_period: T::BlockNumber,
    unbonding_period: T::BlockNumber,
    // "startup" time allowed for roles that need to sync their infrastructure
    // with other providers before they are considered in service and punishable for
    // not delivering required level of service.
    //startup_grace_period: T::BlockNumber,
}

#[derive(Encode, Decode, Clone)]
pub struct Actor<T: Trait> {
    member_id: <T::Members as Members<T>>::Id,
    role: Role,
    role_key: T::AccountId,
    joined_at: T::BlockNumber,
    //startup_grace_period_ends_at: T::BlockNumber,
}

pub trait Trait: system::Trait + GovernanceCurrency {
    type Event: From<Event<Self>> + Into<<Self as system::Trait>::Event>;

    type Members: Members<Self>;
}

decl_storage! {
    trait Store for Module<T: Trait> as Actors {
        /// requirements to enter and maintain status in roles
        Parameters get(parameters) : map Role => Option<RoleParameters<T>>;

        /// roles members can enter into
        AvailableRoles get(available_roles) : Vec<Role> = vec![Role::Storage];

        /// role keys mapped to their actor
        Actors get(actors) : map T::AccountId => Option<Actor<T>>;

        /// active actors for each role
        ActorsByRole get(actors_by_role) : map Role => Vec<T::AccountId>;

        /// role keys associated with a member id
        MemberRoleKeys get(member_role_keys) : map <T::Members as Members<T>>::Id => Vec<T::AccountId>;

        /// tokens bonded until given block number
        Bondage get(bondage) : map T::AccountId => T::BlockNumber;
    }
}

decl_event! {
    pub enum Event<T> where
      <T as system::Trait>::AccountId {
        ActorJoined(AccountId, Role),
    }
}

impl<T: Trait> Module<T> {
    fn role_is_available(role: Role) -> bool {
        Self::available_roles().into_iter().any(|r| role == r)
    }
}

impl<T: Trait> Roles<T> for Module<T> {
    fn is_role_key(account_id: &T::AccountId) -> bool {
        Self::actors(account_id).is_some()
    }
}

decl_module! {
    pub struct Module<T: Trait> for enum Call where origin: T::Origin {
        fn deposit_event<T>() = default;

        /// Member staking to enter a role
        pub fn stake(origin, role: Role, role_key: T::AccountId) {
            let sender = ensure_signed(origin)?;
            let member_id = T::Members::lookup_member_id(&sender)?;
            ensure!(!<Actors<T>>::exists(&sender), "");

            ensure!(Self::role_is_available(role), "");

            let role_parameters = Self::parameters(role);
            ensure!(role_parameters.is_some(), "");
            let role_parameters = role_parameters.unwrap();

            let actors_in_role = Self::actors_by_role(role);

            // ensure there is an empty slot for the role
            ensure!(actors_in_role.len() < role_parameters.max_actors as usize, "");

            // ensure the role key has enough balance
            ensure!(T::Currency::free_balance(&role_key) >= role_parameters.min_stake, "");

            <ActorsByRole<T>>::mutate(role, |actors| actors.push(role_key.clone()));
            <MemberRoleKeys<T>>::mutate(&member_id, |keys| keys.push(role_key.clone()));
            <Bondage<T>>::insert(&role_key, T::BlockNumber::max_value());
            <Actors<T>>::insert(&role_key, Actor {
                member_id,
                role_key: role_key.clone(),
                role,
                joined_at: <system::Module<T>>::block_number()
            });

            Self::deposit_event(RawEvent::ActorJoined(role_key, role));
        }

        // pub fn set_role_parameters(role: Role, params: RoleParameters) {}
        // pub fn set_available_roles(Vec<Role>) {}
    }
}