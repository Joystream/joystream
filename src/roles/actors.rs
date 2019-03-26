#![cfg_attr(not(feature = "std"), no_std)]

use rstd::prelude::*;
use parity_codec::Codec;
use parity_codec_derive::{Encode, Decode};
use srml_support::{StorageMap, StorageValue, dispatch, decl_module, decl_storage, decl_event, ensure, Parameter};
use srml_support::traits::{Currency, EnsureAccountLiquid};
use runtime_primitives::traits::{Zero, Bounded, SimpleArithmetic, As, Member, MaybeSerializeDebug, MaybeDebug};
use system::{self, ensure_signed};
use crate::governance::{GovernanceCurrency, BalanceOf };

use crate::traits::{Members, Roles};

#[derive(Encode, Decode, Copy, Clone, Eq, PartialEq, Debug)]
pub enum Role {
    Storage,
}


#[cfg_attr(feature = "std", derive(Debug))]
#[derive(Encode, Decode, Copy, Clone, Eq, PartialEq)]
pub struct RoleParameters<T: Trait> {
    // minium balance required to stake to enter a role
    pub min_stake: BalanceOf<T>,

    // the maximum number of spots available to fill for a role
    pub max_actors: u32,

    // minimum actors to maintain - if role is unstaking
    // and remaining actors would be less that this value - prevent or punish for unstaking
    pub min_actors: u32,

    // fixed amount of tokens paid to actors' primary account
    pub reward: BalanceOf<T>,

    // payouts are made at this block interval
    pub reward_period: T::BlockNumber,

    // how long tokens remain locked for after unstaking
    pub unbonding_period: T::BlockNumber,

    // minimum amount of time before being able to unstake
    pub bonding_time: T::BlockNumber,

    // minimum period required to be in service. unbonding before this time is highly penalized
    pub min_service_period: T::BlockNumber,

    // "startup" time allowed for roles that need to sync their infrastructure
    // with other providers before they are considered in service and punishable for
    // not delivering required level of service.
    pub startup_grace_period: T::BlockNumber,

    // entry_request_fee: BalanceOf<T>,
}

#[derive(Encode, Decode, Clone)]
pub struct Actor<T: Trait> {
    member_id: MemberId<T>,
    role: Role,
    account: T::AccountId,
    joined_at: T::BlockNumber,
    // startup_grace_period_ends_at: T::BlockNumber,
}

pub trait Trait: system::Trait + GovernanceCurrency + MaybeDebug {
    type Event: From<Event<Self>> + Into<<Self as system::Trait>::Event>;

    type Members: Members<Self>;
}

pub type MemberId<T: Trait> = <T::Members as Members<T>>::Id;
pub type Request<T: Trait> = (T::AccountId, MemberId<T>, Role, T::BlockNumber); // actor account, memberid, role, expires
pub type Requests<T: Trait> = Vec<Request<T>>;

const REQUEST_LIFETIME: u64 = 300;
const DEFAULT_REQUEST_CLEARING_INTERVAL: u64 = 100;

decl_storage! {
    trait Store for Module<T: Trait> as Actors {
        /// requirements to enter and maintain status in roles
        Parameters get(parameters) : map Role => Option<RoleParameters<T>>;

        /// the roles members can enter into
        AvailableRoles get(available_roles) : Vec<Role>; // = vec![Role::Storage];

        /// Actors list
        Actors get(actors) : Vec<T::AccountId>;

        /// actor accounts mapped to their actor
        ActorsByAccountId get(actors_by_account_id) : map T::AccountId => Option<Actor<T>>;

        /// actor accounts associated with a role
        AccountsByRole get(accounts_by_role) : map Role => Vec<T::AccountId>;

        /// actor accounts associated with a member id
        AccountsByMember get(accounts_by_member) : map MemberId<T> => Vec<T::AccountId>;

        /// tokens locked until given block number
        Bondage get(bondage) : map T::AccountId => T::BlockNumber;

        /// First step before enter a role is registering intent with a new account/key.
        /// This is done by sending a role_entry_request() from the new account.
        /// The member must then send a stake() transaction to approve the request and enter the desired role.
        /// The account making the request will be bonded and must have
        /// sufficient balance to cover the minimum stake for the role.
        /// Bonding only occurs after successful entry into a role.
        /// The request expires after REQUEST_LIFETIME blocks
        RoleEntryRequests get(role_entry_requests) : Requests<T>;
    }
}

decl_event! {
    pub enum Event<T> where
      <T as system::Trait>::AccountId {
        Staked(AccountId, Role),
    }
}

impl<T: Trait> Module<T> {
    fn role_is_available(role: Role) -> bool {
        Self::available_roles().into_iter().any(|r| role == r)
    }

    fn ensure_actor(role_key: &T::AccountId) -> Result<Actor<T>, &'static str> {
        Self::actors_by_account_id(role_key).ok_or("not role key")
    }

    fn ensure_actor_is_member(role_key: &T::AccountId, member_id: MemberId<T>)
        -> Result<Actor<T>, &'static str>
    {
        let actor = Self::ensure_actor(role_key)?;
        if actor.member_id == member_id {
            Ok(actor)
        } else {
            Err("actor not owned by member")
        }
    }

    fn ensure_role_parameters(role: Role) -> Result<RoleParameters<T>, &'static str> {
        Self::parameters(role).ok_or("no parameters for role")
    }

    // Mutating

    fn remove_actor_from_service(actor_account: T::AccountId, role: Role, member_id: MemberId<T>) {
        let accounts: Vec<T::AccountId> = Self::accounts_by_role(role)
            .into_iter()
            .filter(|account| !(*account == actor_account))
            .collect();
        <AccountsByRole<T>>::insert(role, accounts);

        let accounts: Vec<T::AccountId> = Self::accounts_by_member(&member_id)
            .into_iter()
            .filter(|account| !(*account == actor_account))
            .collect();
        <AccountsByMember<T>>::insert(&member_id, accounts);

        <ActorsByAccountId<T>>::remove(&actor_account);
    }

    fn apply_unstake(actor_account: T::AccountId, role: Role, member_id: MemberId<T>, unbonding_period: T::BlockNumber) {
        // simple unstaking ...only applying unbonding period
        <Bondage<T>>::insert(&actor_account, <system::Module<T>>::block_number() + unbonding_period);

        Self::remove_actor_from_service(actor_account, role, member_id);
    }
}

impl<T: Trait> Roles<T> for Module<T> {
    fn is_role_account(account_id: &T::AccountId) -> bool {
        <ActorsByAccountId<T>>::exists(account_id) || <Bondage<T>>::exists(account_id)
    }
}

decl_module! {
    pub struct Module<T: Trait> for enum Call where origin: T::Origin {
        fn deposit_event<T>() = default;

        fn on_initialize(now: T::BlockNumber) {
            // clear expired requests
            if now % T::BlockNumber::sa(DEFAULT_REQUEST_CLEARING_INTERVAL) == T::BlockNumber::zero() {
                let requests: Requests<T> = Self::role_entry_requests()
                    .into_iter()
                    .filter(|request| request.3 < now)
                    .collect();

                <RoleEntryRequests<T>>::put(requests);
            }
        }

        fn on_finalize(now: T::BlockNumber) {

            // payout rewards to actors
            for role in Self::available_roles().iter() {
                if let Some(params) = Self::parameters(role) {
                    if !(now % params.reward_period == T::BlockNumber::zero()) { continue }
                    let accounts = Self::accounts_by_role(role);
                    for actor in accounts.into_iter().map(|account| Self::actors_by_account_id(account)) {
                        if let Some(actor) = actor {
                            if now > actor.joined_at + params.reward_period {
                                T::Currency::reward(&actor.account, params.reward);
                            }
                        }
                    }
                }
            }

            if now % T::BlockNumber::sa(100) == T::BlockNumber::zero() {
                // clear unbonded accounts
                let actors: Vec<T::AccountId> = Self::actors()
                    .into_iter()
                    .filter(|account| {
                        if <Bondage<T>>::exists(account) {
                            if Self::bondage(account) > now {
                                true
                            } else {
                                <Bondage<T>>::remove(account);
                                false
                            }
                        } else {
                            true
                        }
                    })
                    .collect();
                <Actors<T>>::put(actors);
            }

            // eject actors not staking the minimum
            // iterating over available roles, so if a role has been removed at some point
            // and an actor hasn't unstaked .. this will not apply to them.. which doesn't really matter
            // because they are no longer incentivised to stay in the role anyway
            // TODO: this needs a bit more preparation. The right time to check for each actor is different, as they enter
            // role at different times.
            // for role in Self::available_roles().iter() {
            // }

        }

        pub fn role_entry_request(origin, role: Role, member_id: MemberId<T>) {
            let sender = ensure_signed(origin)?;

            ensure!(T::Members::lookup_member_id(&sender).is_err(), "account is a member");
            ensure!(!Self::is_role_account(&sender), "account already used");

            ensure!(Self::role_is_available(role), "inactive role");

            let role_parameters = Self::ensure_role_parameters(role)?;

            <RoleEntryRequests<T>>::mutate(|requests| {
                let expires = <system::Module<T>>::block_number()+ T::BlockNumber::sa(REQUEST_LIFETIME);
                requests.push((sender, member_id, role, expires));
            });
        }

        /// Member activating entry request
        pub fn stake(origin, role: Role, actor_account: T::AccountId) {
            let sender = ensure_signed(origin)?;
            let member_id = T::Members::lookup_member_id(&sender)?;

            if !Self::role_entry_requests()
                .iter()
                .any(|request| request.0 == actor_account && request.1 == member_id && request.2 == role)
            {
                return Err("no role entry request matches");
            }

            ensure!(T::Members::lookup_member_id(&actor_account).is_err(), "account is a member");
            ensure!(!Self::is_role_account(&actor_account), "account already used");

            // make sure role is still available
            ensure!(Self::role_is_available(role), "");
            let role_parameters = Self::ensure_role_parameters(role)?;

            let accounts_in_role = Self::accounts_by_role(role);

            // ensure there is an empty slot for the role
            ensure!(accounts_in_role.len() < role_parameters.max_actors as usize, "role slots full");

            // ensure the actor account has enough balance
            ensure!(T::Currency::free_balance(&actor_account) >= role_parameters.min_stake, "");

            <AccountsByRole<T>>::mutate(role, |accounts| accounts.push(actor_account.clone()));
            <AccountsByMember<T>>::mutate(&member_id, |accounts| accounts.push(actor_account.clone()));
            <Bondage<T>>::insert(&actor_account, T::BlockNumber::max_value());
            <ActorsByAccountId<T>>::insert(&actor_account, Actor {
                member_id,
                account: actor_account.clone(),
                role,
                joined_at: <system::Module<T>>::block_number()
            });
            <Actors<T>>::mutate(|actors| actors.push(actor_account.clone()));

            let requests: Requests<T> = Self::role_entry_requests()
                .into_iter()
                .filter(|request| request.0 != actor_account)
                .collect();
            <RoleEntryRequests<T>>::put(requests);

            Self::deposit_event(RawEvent::Staked(actor_account, role));
        }

        pub fn unstake(origin, actor_account: T::AccountId) {
            let sender = ensure_signed(origin)?;
            let member_id = T::Members::lookup_member_id(&sender)?;

            let actor = Self::ensure_actor_is_member(&actor_account, member_id)?;

            let role_parameters = Self::ensure_role_parameters(actor.role)?;

            Self::apply_unstake(actor.account, actor.role, actor.member_id, role_parameters.unbonding_period);
        }

        pub fn set_role_parameters(role: Role, params: RoleParameters<T>) {
            <Parameters<T>>::insert(role, params);
        }

        pub fn set_available_roles(roles: Vec<Role>) {
            <AvailableRoles<T>>::put(roles);
        }

        pub fn add_to_available_roles(role: Role) {
            if !Self::available_roles().into_iter().any(|r| r == role) {
                <AvailableRoles<T>>::mutate(|roles| roles.push(role));
            }
        }

        pub fn remove_from_available_roles(role: Role) {
            // Should we eject actors in the role being removed?
            let roles: Vec<Role> = Self::available_roles().into_iter().filter(|r| role != *r).collect();
            <AvailableRoles<T>>::put(roles);
        }

        pub fn remove_actor(actor_account: T::AccountId) {
            let member_id = T::Members::lookup_member_id(&actor_account)?;
            let actor = Self::ensure_actor_is_member(&actor_account, member_id)?;
            let role_parameters = Self::ensure_role_parameters(actor.role)?;
            Self::apply_unstake(actor.account, actor.role, actor.member_id, role_parameters.unbonding_period);
        }
    }
}

impl<T: Trait> EnsureAccountLiquid<T::AccountId> for Module<T> {
	fn ensure_account_liquid(who: &T::AccountId) -> dispatch::Result {
		if Self::bondage(who) <= <system::Module<T>>::block_number() {
			Ok(())
		} else {
			Err("cannot transfer illiquid funds")
		}
	}
}