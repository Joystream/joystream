//! This module contains the BountyActorManager - a bounty actor management helper.
//! It simplifies the interface of dealing with two different actor types: members and council.
//! BountyActorManager contains methods to validate actor origin, transfer funds to/from the bounty
//! account, etc.

use crate::{BalanceOf, BountyActor, Config, Error, Module};

use frame_support::dispatch::{DispatchError, DispatchResult};
use frame_support::ensure;
use frame_support::traits::Currency;
use frame_system::ensure_root;
use sp_arithmetic::traits::Saturating;

use common::council::CouncilBudgetManager;
use common::membership::{MemberId, MemberOriginValidator, MembershipInfoProvider};

// Helper enum for the bounty management.
pub(crate) enum BountyActorManager<T: Config> {
    // Bounty was created or funded by a council.
    Council,

    // Bounty was created or funded by a member.
    Member(T::AccountId, MemberId<T>),
}

impl<T: Config> BountyActorManager<T> {
    // Construct BountyActor by extrinsic origin and optional member_id.
    pub(crate) fn ensure_bounty_actor_manager(
        origin: T::Origin,
        actor: BountyActor<MemberId<T>>,
    ) -> Result<BountyActorManager<T>, DispatchError> {
        match actor {
            BountyActor::Member(member_id) => {
                let account_id =
                    T::Membership::ensure_member_controller_account_origin(origin, member_id)?;

                Ok(BountyActorManager::Member(account_id, member_id))
            }
            BountyActor::Council => {
                ensure_root(origin)?;

                Ok(BountyActorManager::Council)
            }
        }
    }

    // Construct BountyActor.
    pub(crate) fn get_bounty_actor_manager(
        actor: BountyActor<MemberId<T>>,
    ) -> Result<BountyActorManager<T>, DispatchError> {
        match actor {
            BountyActor::Member(member_id) => {
                let account_id = T::Membership::controller_account_id(member_id)?;

                Ok(BountyActorManager::Member(account_id, member_id))
            }
            BountyActor::Council => Ok(BountyActorManager::Council),
        }
    }

    // Validate balance is sufficient for the bounty
    pub(crate) fn validate_balance_sufficiency(
        &self,
        required_balance: BalanceOf<T>,
    ) -> DispatchResult {
        let balance_is_sufficient = match self {
            BountyActorManager::Council => {
                BountyActorManager::<T>::check_council_budget(required_balance)
            }
            BountyActorManager::Member(account_id, _) => {
                Module::<T>::check_balance_for_account(required_balance, account_id)
            }
        };

        ensure!(
            balance_is_sufficient,
            Error::<T>::InsufficientBalanceForBounty
        );

        Ok(())
    }

    // Verifies that council budget is sufficient for a bounty.
    fn check_council_budget(amount: BalanceOf<T>) -> bool {
        T::CouncilBudgetManager::get_budget() >= amount
    }

    // Validate that provided actor relates to the initial BountyActor.
    pub(crate) fn validate_actor(&self, actor: &BountyActor<MemberId<T>>) -> DispatchResult {
        let initial_actor = match self {
            BountyActorManager::Council => BountyActor::Council,
            BountyActorManager::Member(_, member_id) => BountyActor::Member(*member_id),
        };

        ensure!(initial_actor == actor.clone(), Error::<T>::NotBountyActor);

        Ok(())
    }

    // Transfer funds for the bounty creation.
    pub(crate) fn transfer_funds_to_bounty_account(
        &self,
        bounty_id: T::BountyId,
        required_balance: BalanceOf<T>,
    ) -> DispatchResult {
        match self {
            BountyActorManager::Council => {
                BountyActorManager::<T>::transfer_balance_from_council_budget(
                    bounty_id,
                    required_balance,
                );
            }
            BountyActorManager::Member(account_id, _) => {
                Module::<T>::transfer_funds_to_bounty_account(
                    account_id,
                    bounty_id,
                    required_balance,
                )?;
            }
        }

        Ok(())
    }

    // Restore a balance for the bounty creator.
    pub(crate) fn transfer_funds_from_bounty_account(
        &self,
        bounty_id: T::BountyId,
        required_balance: BalanceOf<T>,
    ) -> DispatchResult {
        match self {
            BountyActorManager::Council => {
                BountyActorManager::<T>::transfer_balance_to_council_budget(
                    bounty_id,
                    required_balance,
                );
            }
            BountyActorManager::Member(account_id, _) => {
                Module::<T>::transfer_funds_from_bounty_account(
                    account_id,
                    bounty_id,
                    required_balance,
                )?;
            }
        }

        Ok(())
    }

    // Remove some balance from the council budget and transfer it to the bounty account.
    fn transfer_balance_from_council_budget(bounty_id: T::BountyId, amount: BalanceOf<T>) {
        let budget = T::CouncilBudgetManager::get_budget();
        let new_budget = budget.saturating_sub(amount);

        T::CouncilBudgetManager::set_budget(new_budget);

        let bounty_account_id = Module::<T>::bounty_account_id(bounty_id);
        let _ = balances::Module::<T>::deposit_creating(&bounty_account_id, amount);
    }

    // Add some balance from the council budget and slash from the bounty account.
    fn transfer_balance_to_council_budget(bounty_id: T::BountyId, amount: BalanceOf<T>) {
        let bounty_account_id = Module::<T>::bounty_account_id(bounty_id);
        let _ = balances::Module::<T>::slash(&bounty_account_id, amount);

        let budget = T::CouncilBudgetManager::get_budget();
        let new_budget = budget.saturating_add(amount);

        T::CouncilBudgetManager::set_budget(new_budget);
    }
}
