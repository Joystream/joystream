use crate::currency::{BalanceOf, GovernanceCurrency};
use parity_codec_derive::{Decode, Encode};
use rstd::prelude::*;
use runtime_primitives::traits::{As, Bounded, MaybeDebug, Zero};
use srml_support::traits::{
    Currency, LockIdentifier, LockableCurrency, WithdrawReason, WithdrawReasons,
};
use srml_support::{decl_event, decl_module, decl_storage, ensure, StorageMap, StorageValue};
use system::{self, ensure_signed};

use crate::traits::{Members, Roles};

static MSG_NO_ACTOR_FOR_ROLE: &str = "For the specified role, no actor is currently staked.";

const STAKING_ID: LockIdentifier = *b"role_stk";

#[derive(Encode, Decode, Copy, Clone, Eq, PartialEq, Debug)]
pub enum Role {
    Storage,
}

#[cfg_attr(feature = "std", derive(Debug))]
#[derive(Encode, Decode, Copy, Clone, Eq, PartialEq)]
pub struct RoleParameters<T: Trait> {
    // minium balance required to stake to enter a role
    pub min_stake: BalanceOf<T>,

    // minimum actors to maintain - if role is unstaking
    // and remaining actors would be less that this value - prevent or punish for unstaking
    pub min_actors: u32,

    // the maximum number of spots available to fill for a role
    pub max_actors: u32,

    // fixed amount of tokens paid to actors' primary account
    pub reward: BalanceOf<T>,

    // payouts are made at this block interval
    pub reward_period: T::BlockNumber,

    // minimum amount of time before being able to unstake
    pub bonding_period: T::BlockNumber,

    // how long tokens remain locked for after unstaking
    pub unbonding_period: T::BlockNumber,

    // minimum period required to be in service. unbonding before this time is highly penalized
    pub min_service_period: T::BlockNumber,

    // "startup" time allowed for roles that need to sync their infrastructure
    // with other providers before they are considered in service and punishable for
    // not delivering required level of service.
    pub startup_grace_period: T::BlockNumber,

    // small fee burned to make a request to enter role
    pub entry_request_fee: BalanceOf<T>,
}

impl<T: Trait> Default for RoleParameters<T> {
    fn default() -> Self {
        Self {
            min_stake: BalanceOf::<T>::sa(3000),
            max_actors: 10,
            reward: BalanceOf::<T>::sa(10),
            reward_period: T::BlockNumber::sa(600),
            unbonding_period: T::BlockNumber::sa(600),
            entry_request_fee: BalanceOf::<T>::sa(50),

            // not currently used
            min_actors: 5,
            bonding_period: T::BlockNumber::sa(600),
            min_service_period: T::BlockNumber::sa(600),
            startup_grace_period: T::BlockNumber::sa(600),
        }
    }
}

#[derive(Encode, Decode, Clone)]
pub struct Actor<T: Trait> {
    pub member_id: MemberId<T>,
    pub role: Role,
    pub account: T::AccountId,
    pub joined_at: T::BlockNumber,
}

pub trait ActorRemoved<T: Trait> {
    fn actor_removed(actor: &T::AccountId);
}

pub trait Trait: system::Trait + GovernanceCurrency + MaybeDebug {
    type Event: From<Event<Self>> + Into<<Self as system::Trait>::Event>;

    type Members: Members<Self>;

    type OnActorRemoved: ActorRemoved<Self>;
}

pub type MemberId<T> = <<T as Trait>::Members as Members<T>>::Id;
// actor account, memberid, role, expires
pub type Request<T> = (
    <T as system::Trait>::AccountId,
    MemberId<T>,
    Role,
    <T as system::Trait>::BlockNumber,
);
pub type Requests<T> = Vec<Request<T>>;

pub const DEFAULT_REQUEST_LIFETIME: u64 = 300;
pub const REQUEST_CLEARING_INTERVAL: u64 = 100;

decl_storage! {
    trait Store for Module<T: Trait> as Actors {
        /// requirements to enter and maintain status in roles
        pub Parameters get(parameters) build(|config: &GenesisConfig<T>| {
            if config.enable_storage_role {
                let storage_params: RoleParameters<T> = Default::default();
                vec![(Role::Storage, storage_params)]
            } else {
                vec![]
            }
        }): map Role => Option<RoleParameters<T>>;

        /// the roles members can enter into
        pub AvailableRoles get(available_roles) build(|config: &GenesisConfig<T>| {
            if config.enable_storage_role {
                vec![(Role::Storage)]
            } else {
                vec![]
            }
        }): Vec<Role>;

        /// Actors list
        pub ActorAccountIds get(actor_account_ids) : Vec<T::AccountId>;

        /// actor accounts mapped to their actor
        pub ActorByAccountId get(actor_by_account_id) : map T::AccountId => Option<Actor<T>>;

        /// actor accounts associated with a role
        pub AccountIdsByRole get(account_ids_by_role) : map Role => Vec<T::AccountId>;

        /// actor accounts associated with a member id
        pub AccountIdsByMemberId get(account_ids_by_member_id) : map MemberId<T> => Vec<T::AccountId>;

        /// First step before enter a role is registering intent with a new account/key.
        /// This is done by sending a role_entry_request() from the new account.
        /// The member must then send a stake() transaction to approve the request and enter the desired role.
        /// The account making the request will be bonded and must have
        /// sufficient balance to cover the minimum stake for the role.
        /// Bonding only occurs after successful entry into a role.
        pub RoleEntryRequests get(role_entry_requests) : Requests<T>;

        /// Entry request expires after this number of blocks
        pub RequestLifeTime get(request_life_time) config(request_life_time) : u64 = DEFAULT_REQUEST_LIFETIME;
    }
    add_extra_genesis {
        config(enable_storage_role): bool;
    }
}

decl_event! {
    pub enum Event<T> where
      <T as system::Trait>::AccountId {
        EntryRequested(AccountId, Role),
        Staked(AccountId, Role),
        Unstaked(AccountId, Role),
    }
}

impl<T: Trait> Module<T> {
    fn is_role_available(role: Role) -> bool {
        Self::available_roles().into_iter().any(|r| role == r)
    }

    fn ensure_actor(role_key: &T::AccountId) -> Result<Actor<T>, &'static str> {
        Self::actor_by_account_id(role_key).ok_or("not role key")
    }

    fn ensure_actor_is_member(
        role_key: &T::AccountId,
        member_id: MemberId<T>,
    ) -> Result<Actor<T>, &'static str> {
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
        let accounts: Vec<T::AccountId> = Self::account_ids_by_role(role)
            .into_iter()
            .filter(|account| !(*account == actor_account))
            .collect();
        <AccountIdsByRole<T>>::insert(role, accounts);

        let accounts: Vec<T::AccountId> = Self::account_ids_by_member_id(&member_id)
            .into_iter()
            .filter(|account| !(*account == actor_account))
            .collect();
        <AccountIdsByMemberId<T>>::insert(&member_id, accounts);

        let accounts: Vec<T::AccountId> = Self::actor_account_ids()
            .into_iter()
            .filter(|account| !(*account == actor_account))
            .collect();
        <ActorAccountIds<T>>::put(accounts);

        <ActorByAccountId<T>>::remove(&actor_account);

        T::OnActorRemoved::actor_removed(&actor_account);
    }

    fn apply_unstake(
        actor_account: T::AccountId,
        role: Role,
        member_id: MemberId<T>,
        unbonding_period: T::BlockNumber,
        stake: BalanceOf<T>,
    ) {
        // simple unstaking ...only applying unbonding period
        Self::update_lock(
            &actor_account,
            stake,
            <system::Module<T>>::block_number() + unbonding_period,
        );

        Self::remove_actor_from_service(actor_account, role, member_id);
    }

    // Locks account and only allows paying for transaction fees. Account cannot
    // transfer or reserve funds.
    fn update_lock(account: &T::AccountId, stake: BalanceOf<T>, until: T::BlockNumber) {
        T::Currency::set_lock(
            STAKING_ID,
            account,
            stake,
            until,
            WithdrawReasons::all() & !(WithdrawReason::TransactionPayment | WithdrawReason::Fee),
        );
    }
}

impl<T: Trait> Roles<T> for Module<T> {
    fn is_role_account(account_id: &T::AccountId) -> bool {
        <ActorByAccountId<T>>::exists(account_id)
    }

    fn account_has_role(account_id: &T::AccountId, role: Role) -> bool {
        Self::actor_by_account_id(account_id).map_or(false, |actor| actor.role == role)
    }

    fn random_account_for_role(role: Role) -> Result<T::AccountId, &'static str> {
        let ids = Self::account_ids_by_role(role);
        if 0 == ids.len() {
            return Err(MSG_NO_ACTOR_FOR_ROLE);
        }
        let seed = <system::Module<T>>::random_seed();
        let mut rand: u64 = 0;
        for offset in 0..8 {
            rand += (seed.as_ref()[offset] as u64) << offset;
        }
        let idx = (rand as usize) % ids.len();
        return Ok(ids[idx].clone());
    }
}

decl_module! {
    pub struct Module<T: Trait> for enum Call where origin: T::Origin {
        fn deposit_event<T>() = default;

        fn on_initialize(now: T::BlockNumber) {
            // clear expired requests
            if now % T::BlockNumber::sa(REQUEST_CLEARING_INTERVAL) == T::BlockNumber::zero() {
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
                    let accounts = Self::account_ids_by_role(role);
                    for actor in accounts.into_iter().map(|account| Self::actor_by_account_id(account)) {
                        if let Some(actor) = actor {
                            if now > actor.joined_at + params.reward_period {
                                // reward can top up balance if it is below minimum stake requirement
                                // this guarantees overtime that actor always covers the minimum stake and
                                // has enough balance to pay for tx fees
                                let balance = T::Currency::free_balance(&actor.account);
                                if balance < params.min_stake {
                                    let _ = T::Currency::deposit_into_existing(&actor.account, params.reward);
                                } else {
                                    // otherwise it should go the the member account
                                    if let Ok(member_account) = T::Members::lookup_account_by_member_id(actor.member_id) {
                                        let _ = T::Currency::deposit_into_existing(&member_account, params.reward);
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        pub fn role_entry_request(origin, role: Role, member_id: MemberId<T>) {
            let sender = ensure_signed(origin)?;

            ensure!(T::Members::lookup_member_id(&sender).is_err(), "account is a member");
            ensure!(!Self::is_role_account(&sender), "account already used");

            ensure!(Self::is_role_available(role), "inactive role");

            let role_parameters = Self::ensure_role_parameters(role)?;

            // pay (burn) entry fee - spam filter
            let fee = role_parameters.entry_request_fee;
            ensure!(T::Currency::can_slash(&sender, fee), "cannot pay role entry request fee");
            let _ = T::Currency::slash(&sender, fee);

            <RoleEntryRequests<T>>::mutate(|requests| {
                let expires = <system::Module<T>>::block_number()+ T::BlockNumber::sa(Self::request_life_time());
                requests.push((sender.clone(), member_id, role, expires));
            });
            Self::deposit_event(RawEvent::EntryRequested(sender, role));
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
            ensure!(Self::is_role_available(role), "inactive role");
            let role_parameters = Self::ensure_role_parameters(role)?;

            let accounts_in_role = Self::account_ids_by_role(role);

            // ensure there is an empty slot for the role
            ensure!(accounts_in_role.len() < role_parameters.max_actors as usize, "role slots full");

            // ensure the actor account has enough balance
            ensure!(T::Currency::free_balance(&actor_account) >= role_parameters.min_stake, "not enough balance to stake");

            <AccountIdsByRole<T>>::mutate(role, |accounts| accounts.push(actor_account.clone()));
            <AccountIdsByMemberId<T>>::mutate(&member_id, |accounts| accounts.push(actor_account.clone()));

            // Lock minimum stake, but allow spending for transaction fees
            Self::update_lock(&actor_account, role_parameters.min_stake, T::BlockNumber::max_value());
            <ActorByAccountId<T>>::insert(&actor_account, Actor {
                member_id,
                account: actor_account.clone(),
                role,
                joined_at: <system::Module<T>>::block_number()
            });
            <ActorAccountIds<T>>::mutate(|accounts| accounts.push(actor_account.clone()));

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

            Self::apply_unstake(actor.account.clone(), actor.role, actor.member_id, role_parameters.unbonding_period, role_parameters.min_stake);

            Self::deposit_event(RawEvent::Unstaked(actor.account, actor.role));
        }

        pub fn set_role_parameters(role: Role, params: RoleParameters<T>) {
            let new_stake = params.min_stake.clone();
            <Parameters<T>>::insert(role, params);
            // Update locks for all actors in the role. The lock for each account is already until max_value
            // It doesn't affect actors which are unbonding, they should have already been removed from AccountIdsByRole
            let accounts = Self::account_ids_by_role(role);
            for account in accounts.into_iter() {
                Self::update_lock(&account, new_stake, T::BlockNumber::max_value());
            }
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
            Self::apply_unstake(actor.account, actor.role, actor.member_id, role_parameters.unbonding_period, role_parameters.min_stake);
        }
    }
}
